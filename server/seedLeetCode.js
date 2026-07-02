/**
 * Seed LeetCode problems into MongoDB
 * Uses LeetCode's public GraphQL API to fetch problem lists
 */
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Problem = require('./src/models/Problem');

const HEADERS = {
  "Content-Type": "application/json",
  "Origin": "https://leetcode.com",
  "Referer": "https://leetcode.com/problemset/",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

async function fetchLeetCodeProblems(skip = 0, limit = 50) {
  const { data } = await axios.post("https://leetcode.com/graphql/", {
    query: `query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
        total: totalNum
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
      skip,
      limit,
      filters: {},
    },
  }, { headers: HEADERS, timeout: 15000 });

  return data?.data?.problemsetQuestionList;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // Check how many LeetCode problems already exist
  const existing = await Problem.countDocuments({ platform: "LeetCode" });
  console.log(`Existing LeetCode problems in DB: ${existing}`);

  // Fetch problems in batches
  const BATCH_SIZE = 50;
  const MAX_PROBLEMS = 200; // Fetch top 200 problems
  let inserted = 0;
  let skipped = 0;

  for (let skip = 0; skip < MAX_PROBLEMS; skip += BATCH_SIZE) {
    console.log(`\nFetching batch ${skip / BATCH_SIZE + 1} (problems ${skip + 1} to ${skip + BATCH_SIZE})...`);

    try {
      const result = await fetchLeetCodeProblems(skip, BATCH_SIZE);
      if (!result?.questions?.length) {
        console.log("No more problems to fetch.");
        break;
      }

      console.log(`Got ${result.questions.length} problems from API (total available: ${result.total})`);

      for (const q of result.questions) {
        // Skip paid-only problems
        if (q.paidOnly) {
          skipped++;
          continue;
        }

        // Check if already exists
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
          difficulty: q.difficulty === "Easy" ? "Easy" : q.difficulty === "Medium" ? "Medium" : "Hard",
          tags: q.topicTags?.map(t => t.name) || [],
          url: `https://leetcode.com/problems/${q.titleSlug}/`,
          description: null, // Will be fetched on first click
          examples: null,
          hints: [],
        });
        inserted++;
      }

      console.log(`Batch done. Inserted: ${inserted}, Skipped: ${skipped}`);

      // Small delay to be nice to the API
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`Error fetching batch: ${err.message}`);
      // Wait longer on error
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n✅ Done! Inserted ${inserted} new LeetCode problems. Skipped ${skipped}.`);
  const total = await Problem.countDocuments({ platform: "LeetCode" });
  console.log(`Total LeetCode problems in DB: ${total}`);
  process.exit(0);
}

seed().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
