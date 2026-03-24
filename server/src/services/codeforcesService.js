const axios = require("axios");

async function fetchCodeforcesProblems() {
  const response = await axios.get(
    "https://codeforces.com/api/problemset.problems"
  );

  return response.data.result.problems;
}

module.exports = fetchCodeforcesProblems;