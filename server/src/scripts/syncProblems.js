const mongoose = require("mongoose");
const Problem = require("../models/Problem");
const fetchCodeforcesProblems = require("../services/codeforcesService");
const dns = require("dns");
require("dotenv").config();

async function syncProblems() {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  await mongoose.connect(process.env.MONGO_URI);

  const problems = await fetchCodeforcesProblems();

  for (let p of problems) {
    await Problem.updateOne(
      { problemId: p.contestId + "-" + p.index },
      {
        title: p.name,
        platform: "Codeforces",
        problemId: p.contestId + "-" + p.index,
        difficulty: p.rating ? "Medium" : "Unknown",
        rating: p.rating,
        tags: p.tags,
        url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`
      },
      { upsert: true }
    );
  }

  console.log("Problems synced!");
  process.exit();
}

syncProblems();