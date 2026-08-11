const mongoose = require("mongoose");
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const Problem = require("../models/Problem");
const { fetchCodeChefPopularProblems } = require("../services/codechefService");

// ─── LEETCODE FETCHER ───
async function fetchLeetCode() {
  console.log("\n[LeetCode] Fetching metadata...");
  const problemsToInsert = [];
  let skip = 0;
  const limit = 500;
  const maxProblems = 3500; // Cap to avoid infinite loops

  while (skip < maxProblems) {
    try {
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
          variables: { categorySlug: "all-code-essentials", skip, limit, filters: {} },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        }
      );

      const questions = data?.data?.problemsetQuestionList?.questions;
      if (!questions || questions.length === 0) break;

      for (const q of questions) {
        if (q.paidOnly) continue; // Skip premium
        problemsToInsert.push({
          title: q.title,
          platform: "LeetCode",
          problemId: q.questionFrontendId,
          difficulty: q.difficulty,
          tags: q.topicTags?.map(t => t.name) || [],
          url: `https://leetcode.com/problems/${q.titleSlug}/`,
          description: null,
          examples: null,
          hints: [],
        });
      }
      console.log(`[LeetCode] Fetched batch. Total so far: ${problemsToInsert.length}`);
      skip += limit;
      // Sleep to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.warn("[LeetCode] Error fetching batch:", err.message);
      break;
    }
  }

  return problemsToInsert;
}

// ─── CODEFORCES FETCHER ───
async function fetchCodeforces() {
  console.log("\n[Codeforces] Fetching metadata...");
  const problemsToInsert = [];
  try {
    const { data } = await axios.get("https://codeforces.com/api/problemset.problems");
    if (data.status !== "OK") throw new Error("CF API returned non-OK status");

    const problems = data.result.problems;
    const stats = data.result.problemStatistics;

    // Map stats by contestId + index for easy lookup
    const statsMap = {};
    for (const stat of stats) {
      statsMap[`${stat.contestId}${stat.index}`] = stat.solvedCount;
    }

    for (const p of problems) {
      // CF rating usually ranges from 800 to 3500
      let difficulty = "Medium";
      if (p.rating <= 1200) difficulty = "Easy";
      else if (p.rating >= 1900) difficulty = "Hard";

      problemsToInsert.push({
        title: p.name,
        platform: "Codeforces",
        problemId: `${p.contestId}${p.index}`,
        difficulty,
        rating: p.rating || null,
        tags: p.tags || [],
        url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
        description: null,
        examples: null,
        hints: [],
      });
    }
    console.log(`[Codeforces] Fetched ${problemsToInsert.length} problems.`);
  } catch (err) {
    console.warn("[Codeforces] Error:", err.message);
  }
  return problemsToInsert;
}

// ─── CODECHEF FETCHER ───
async function fetchCodeChef() {
  console.log("\n[CodeChef] Fetching metadata...");
  const problemsToInsert = [];
  try {
    const ccProblems = await fetchCodeChefPopularProblems(500); // Top 500
    for (const p of ccProblems) {
      problemsToInsert.push({
        title: p.title,
        platform: "CodeChef",
        problemId: p.problemCode,
        difficulty: p.difficulty,
        rating: p.rating || null,
        tags: p.tags || [],
        url: `https://www.codechef.com/problems/${p.problemCode}`,
        description: null,
        examples: null,
        hints: [],
      });
    }
    console.log(`[CodeChef] Fetched ${problemsToInsert.length} problems.`);
  } catch (err) {
    console.warn("[CodeChef] Error:", err.message);
  }
  return problemsToInsert;
}

// ─── MAIN EXECUTION ───
async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dsastra");
    console.log("Connected to MongoDB.");

    // 1. Wipe all problems
    console.log("\n[Purge] Wiping all problems from database...");
    await Problem.deleteMany({});
    console.log("[Purge] Done.");

    // 2. Fetch all metadata
    const lc = await fetchLeetCode();
    const cf = await fetchCodeforces();
    const cc = await fetchCodeChef();

    const allProblems = [...lc, ...cf, ...cc];
    console.log(`\n[Database] Inserting ${allProblems.length} global problems...`);

    // 3. Batch insert
    const BATCH_SIZE = 1000;
    for (let i = 0; i < allProblems.length; i += BATCH_SIZE) {
      const batch = allProblems.slice(i, i + BATCH_SIZE);
      await Problem.insertMany(batch, { ordered: false });
      console.log(`[Database] Inserted batch ${i / BATCH_SIZE + 1}`);
    }

    console.log("\n🎉 Global Seeding Complete!");
    console.log(`Total Problems in DB: ${await Problem.countDocuments()}`);

  } catch (err) {
    console.error("Fatal Error:", err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

run();
