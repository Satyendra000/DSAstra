const Problem = require("../models/Problem");
const { fetchProblemDescription } = require("../utils/scraper");

// @desc   Get daily challenge — deterministic per calendar day
// @route  GET /api/problems/daily
// @access Public
exports.getDailyProblem = async (req, res) => {
  try {
    const total = await Problem.countDocuments({});
    if (total === 0) {
      return res.status(404).json({ message: "No problems in database yet." });
    }

    // Build a stable index from today's UTC date string, offset by 4 hours for 4 AM rollover
    const now = new Date();
    now.setHours(now.getHours() - 4);
    const today = now.toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = (hash * 31 + today.charCodeAt(i)) >>> 0; // unsigned 32-bit
    }
    const idx = hash % total;

    const problem = await Problem.findOne({}).skip(idx).select(
      "title platform difficulty tags url problemId _id"
    );

    if (!problem) return res.status(404).json({ message: "Problem not found" });
    res.json(problem);
  } catch (error) {
    console.error("[DailyProblem] Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getProblems = async (req, res) => {
  try {
    const {
      difficulty,
      tag,
      platform,
      search,
      status,
      solvedIds,
      page = 1,
      limit = 20,
    } = req.query;

    let filter = {};

    if (difficulty) filter.difficulty = difficulty;
    if (tag) {
      // Map standard frontend tags to cover both LeetCode (capitalized) and Codeforces (lowercase abbreviations)
      const tagMap = {
        "Dynamic Programming": ["Dynamic Programming", "dp"],
        "Math": ["Math", "math", "number theory"],
        "Depth-First Search": ["Depth-First Search", "dfs and similar"],
        "Breadth-First Search": ["Breadth-First Search", "dfs and similar"],
        "String": ["String", "strings"],
        "Sorting": ["Sorting", "sortings"],
        "Greedy": ["Greedy", "greedy"],
        "Hash Table": ["Hash Table", "hashing"],
        "Binary Search": ["Binary Search", "binary search"],
        "Two Pointers": ["Two Pointers", "two pointers"],
        "Bit Manipulation": ["Bit Manipulation", "bitmasks"],
        "Graph": ["Graph", "graphs"],
        "Tree": ["Tree", "trees"],
        "Matrix": ["Matrix", "matrices"]
      };
      
      const mappedTags = tagMap[tag] || [tag, tag.toLowerCase()];
      filter.tags = { $in: mappedTags.map(t => new RegExp(`^${t}$`, 'i')) };
    }
    if (platform) filter.platform = platform;
    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    // Status filter: solved/unsolved based on user's solved problem IDs
    if (status && solvedIds) {
      const solvedIdList = solvedIds.split(",").filter(Boolean);
      if (status === "solved") {
        filter._id = { $in: solvedIdList };
      } else if (status === "unsolved") {
        filter._id = { $nin: solvedIdList };
      }
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const problems = await Problem.find(filter)
      .select("-testCases")
      .skip(skip)
      .limit(limitNumber);
      
    const total = await Problem.countDocuments(filter);

    res.json({
      problems,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      total,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // ── Fetch-and-cache description/code if not yet stored ──
    const needsScraping = !problem.description || 
      (problem.platform === "LeetCode" && (!problem.defaultCode || !problem.defaultCode.cpp));

    if (needsScraping && problem.url) {
      try {
        console.log(
          `[Scraper] Fetching description for: ${problem.title} (${problem.platform})`,
        );
        const scraped = await fetchProblemDescription(
          problem.platform,
          problem.url,
        );

        if (scraped.description) {
          try {
            console.log(`[AI] Enhancing problem description for ${problem.platform} - ${problem.title}...`);
            const { enhanceProblemDescription } = require("../services/aiService");
            scraped.description = await enhanceProblemDescription(scraped.description, problem.platform, problem.title);
            console.log(`[AI] ✅ Description enhancement complete`);
          } catch (err) {
            console.error(`[AI] Failed to enhance description:`, err.message);
          }
        }

        problem.description = scraped.description || null;
        if (scraped.examples) problem.examples = scraped.examples;
        if (scraped.hints?.length) problem.hints = scraped.hints;
        if (scraped.meta) problem.meta = scraped.meta;
        if (scraped.metaData) problem.metaData = scraped.metaData;
        // Merge in new tags without replacing existing ones
        if (scraped.tags?.length) {
          const merged = new Set([...(problem.tags || []), ...scraped.tags]);
          problem.tags = [...merged];
        }
        
        // Save defaultCode (user-facing code template) for LeetCode-style problems
        // NOTE: driverCode is handled exclusively by the AI engine (generate-engine route)
        //       and must NOT be overwritten by the scraper.
        if (scraped.defaultCode && Object.keys(scraped.defaultCode).length > 0) {
          problem.defaultCode = scraped.defaultCode;
        }

        await problem.save();
        console.log(`[Scraper] ✅ Cached description for: ${problem.title}`);
      } catch (scrapeErr) {
        // Don't fail the whole request — just return without description
        console.warn(
          `[Scraper] ⚠️ Failed for ${problem.title}:`,
          scrapeErr.message,
        );
      }
    }

    const responseData = problem.toObject();
    responseData.hasTestCases = problem.testCases && problem.testCases.length > 0;
    delete responseData.testCases;
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Clear all cached problem descriptions (forces re-scrape on next visit)
exports.clearDescriptionCache = async (req, res) => {
  try {
    const result = await Problem.updateMany(
      {},
      {
        $set: { description: null, examples: null, hints: [], meta: null },
      },
    );
    res.json({
      message: `Cleared cache for ${result.modifiedCount} problems.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Seed Top LeetCode Problems (Admin endpoint)
exports.seedLeetCode = async (req, res) => {
  try {
    const axios = require("axios");

    // Check how many LeetCode problems already exist
    const existing = await Problem.countDocuments({ platform: "LeetCode" });
    if (existing >= 100) {
      return res.json({
        message: "Already have enough LeetCode problems seeded.",
        existing,
      });
    }

    const { data } = await axios.post(
      "https://leetcode.com/graphql/",
      {
        query: `query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
          questions: data {
            questionFrontendId
            title
            titleSlug
            difficulty
            topicTags { name }
            paidOnly: isPaidOnly
          }
        }
      }`,
        variables: {
          categorySlug: "all-code-essentials",
          skip: 0,
          limit: 120,
          filters: {},
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://leetcode.com",
          Referer: "https://leetcode.com/problemset/",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 15000,
      },
    );

    const questions = data?.data?.problemsetQuestionList?.questions || [];
    let inserted = 0;
    let skipped = 0;

    for (const q of questions) {
      if (q.paidOnly) {
        skipped++;
        continue;
      }

      const exists = await Problem.findOne({
        platform: "LeetCode",
        problemId: q.questionFrontendId,
      });
      if (exists) {
        skipped++;
        continue;
      }

      await Problem.create({
        title: q.title,
        platform: "LeetCode",
        problemId: q.questionFrontendId,
        difficulty:
          q.difficulty === "Easy"
            ? "Easy"
            : q.difficulty === "Medium"
              ? "Medium"
              : "Hard",
        tags: q.topicTags?.map((t) => t.name) || [],
        url: `https://leetcode.com/problems/${q.titleSlug}/`,
        description: null,
        examples: null,
        hints: [],
      });
      inserted++;
    }

    const total = await Problem.countDocuments({ platform: "LeetCode" });
    res.json({
      message: `Seeding complete. Inserted ${inserted} new problems. Skipped ${skipped}. Total LeetCode problems: ${total}`,
    });
  } catch (error) {
    console.error("Seed error:", error.message);
    res.status(500).json({ message: "Seeding failed", error: error.message });
  }
};

// Seed CodeChef Problems (Admin endpoint)
exports.seedCodeChef = async (req, res) => {
  try {
    const { fetchCodeChefPopularProblems } = require("../services/codechefService");
    
    // Check how many CodeChef problems already exist
    const existing = await Problem.countDocuments({ platform: "CodeChef" });
    if (existing >= 100) {
      return res.json({ message: "Already have enough CodeChef problems seeded.", existing });
    }

    console.log("[CodeChef] Starting problem fetch...");
    const problems = await fetchCodeChefPopularProblems(150);
    
    let inserted = 0;
    let skipped = 0;

    for (const p of problems) {
      if (!p.problemCode) { skipped++; continue; }

      const exists = await Problem.findOne({ platform: "CodeChef", problemId: p.problemCode });
      if (exists) { skipped++; continue; }

      await Problem.create({
        title: p.title || p.problemCode,
        platform: "CodeChef",
        problemId: p.problemCode,
        difficulty: p.difficulty || "Medium",
        rating: p.rating || null,
        tags: p.tags || [],
        url: `https://www.codechef.com/problems/${p.problemCode}`,
        description: null,
        examples: null,
        hints: [],
      });
      inserted++;
    }

    const total = await Problem.countDocuments({ platform: "CodeChef" });
    res.json({ 
      message: `CodeChef seeding complete. Inserted ${inserted} new problems. Skipped ${skipped}. Total CodeChef problems: ${total}` 
    });

  } catch (error) {
    console.error("CodeChef seed error:", error.message);
    res.status(500).json({ message: "CodeChef seeding failed", error: error.message });
  }
};

// Delete all DSAstra test problems
exports.deleteDsastraProblems = async (req, res) => {
  try {
    const result = await Problem.deleteMany({ platform: "DSAstra" });
    res.json({
      message: `Deleted ${result.deletedCount} DSAstra problems.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete DSAstra error:", error.message);
    res.status(500).json({ message: "Failed to delete DSAstra problems", error: error.message });
  }
};

// Update LeetCode problems with code templates (single problem or batch)
exports.updateLeetCodeTemplates = async (req, res) => {
  try {
    const axios = require("axios");
    const { problemId, batchSize = 10 } = req.query;

    // Helper function to get code snippets from LeetCode
    const fetchCodeSnippets = async (titleSlug) => {
      const { data } = await axios.post(
        "https://leetcode.com/graphql/",
        {
          query: `query getQuestion($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              codeSnippets { lang langSlug code }
              metaData
              exampleTestcases
            }
          }`,
          variables: { titleSlug },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Origin": "https://leetcode.com",
            "Referer": `https://leetcode.com/problems/${titleSlug}/`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          timeout: 15000,
        }
      );
      return data?.data?.question;
    };

    // Process code snippets into defaultCode object
    const processCodeSnippets = (codeSnippets) => {
      const defaultCode = {};
      const langMap = {
        'cpp': 'cpp', 'java': 'java', 'python3': 'python',
        'python': 'python', 'javascript': 'javascript', 'c': 'c'
      };
      for (const snippet of codeSnippets || []) {
        const ourLang = langMap[snippet.langSlug];
        if (ourLang && snippet.code) defaultCode[ourLang] = snippet.code;
      }
      return defaultCode;
    };

    // Get problems to update
    let query = { platform: "LeetCode", defaultCode: { $exists: false } };
    if (problemId) {
      query = { _id: problemId, platform: "LeetCode" };
    }

    const problems = await Problem.find(query).limit(parseInt(batchSize));

    if (problems.length === 0) {
      return res.json({ message: "No LeetCode problems need updating.", updated: 0 });
    }

    let updated = 0;
    let failed = 0;

    for (const problem of problems) {
      const titleSlug = problem.url?.match(/leetcode\.com\/problems\/([^/]+)/)?.[1];
      if (!titleSlug) { failed++; continue; }

      try {
        const data = await fetchCodeSnippets(titleSlug);
        if (!data?.codeSnippets) { failed++; continue; }

        problem.defaultCode = processCodeSnippets(data.codeSnippets);
        if (data.exampleTestcases) problem.examples = data.exampleTestcases;
        await problem.save();
        updated++;

        // Rate limiting
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.warn(`Failed to update ${problem.title}:`, err.message);
        failed++;
      }
    }

    const remaining = await Problem.countDocuments({ 
      platform: "LeetCode", 
      $or: [{ defaultCode: { $exists: false } }, { defaultCode: {} }] 
    });

    res.json({
      message: `Updated ${updated} problems. Failed: ${failed}. Remaining without templates: ${remaining}`,
      updated,
      failed,
      remaining,
    });

  } catch (error) {
    console.error("Update templates error:", error.message);
    res.status(500).json({ message: "Failed to update templates", error: error.message });
  }
};

// Generate AI Execution Engine for a problem
exports.generateEngine = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await Problem.findById(id);

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    // Require problem to have description fetched first
    if (!problem.description) {
      return res.status(400).json({ error: "Problem description must be fetched first before generating engine." });
    }

    const { generateExecutionEngine } = require("../services/aiService");
    
    console.log(`[AI] Generating engine for ${problem.platform} - ${problem.title}...`);
    const engineData = await generateExecutionEngine(problem);

    if (engineData.driverCode && Object.keys(engineData.driverCode).length > 0) {
      problem.driverCode = engineData.driverCode;
    }
    if (engineData.testCases && engineData.testCases.length > 0) {
      problem.testCases = engineData.testCases;
    }
    if (engineData.referenceSolution) {
      problem.referenceSolution = engineData.referenceSolution;
    }

    await problem.save();
    console.log(`[AI] ✅ Engine generation complete for ${problem.title}`);

    res.json({
      message: "Execution engine generated successfully!",
      driverCode: problem.driverCode,
      hasTestCases: problem.testCases && problem.testCases.length > 0
      // Do not return testCases to the frontend to keep them hidden
    });

  } catch (error) {
    console.error("[AI] Engine generation error:", error.message);
    res.status(500).json({ error: "Failed to generate execution engine", detail: error.message });
  }
};

exports.getGlobalHints = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    // Generate hints only if they don't exist
    if (!problem.hints || problem.hints.length === 0) {
      console.log(`[AI] Generating global hints for ${problem.title}...`);
      const { generateGlobalHints } = require("../services/aiService");
      const hints = await generateGlobalHints(problem);
      
      if (hints && hints.length > 0) {
        problem.hints = hints;
        await problem.save();
      }
    }

    res.json({ hints: problem.hints });
  } catch (error) {
    console.error("[ProblemController] Error generating global hints:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPersonalizedHint = async (req, res) => {
  try {
    const { code, language, previousHints } = req.body;
    if (!code || !language) {
      return res.status(400).json({ message: "Code and language are required." });
    }

    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    console.log(`[AI] Generating personalized hint for ${problem.title}...`);
    const { generatePersonalizedHint } = require("../services/aiService");
    
    // We do NOT save this to the DB. It is strictly ephemeral.
    const hint = await generatePersonalizedHint(problem, code, language, previousHints);
    
    res.json({ hint });
  } catch (error) {
    console.error("[ProblemController] Error generating personalized hint:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getConceptGuide = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    // Return cached guide if available
    if (problem.conceptGuide) {
      return res.json({ guide: problem.conceptGuide });
    }

    // Require problem to have description fetched first
    if (!problem.description) {
      return res.status(400).json({ error: "Problem description must be fetched first before generating a guide." });
    }

    console.log(`[AI] Generating concept guide for ${problem.title}...`);
    const { generateConceptGuide } = require("../services/aiService");
    
    const guide = await generateConceptGuide(problem);
    
    // Cache it in the database
    problem.conceptGuide = guide;
    await problem.save();
    
    res.json({ guide });
  } catch (error) {
    console.error("[ProblemController] Error getting concept guide:", error);
    res.status(500).json({ message: error.message });
  }
};
