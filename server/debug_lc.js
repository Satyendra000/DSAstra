const axios = require('axios');
const query = `
  query userContestRankingHistory($username: String!) {
    userContestRankingHistory(username: $username) {
      attended
      rating
      contest {
        startTime
      }
    }
  }
`;

axios.post(
  "https://leetcode.com/graphql",
  { query, variables: { username: "satyendra_s" } },
  {
    headers: {
      "Content-Type": "application/json",
      "Referer": "https://leetcode.com",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    timeout: 10000,
  }
).then(res => {
  const history = res.data.data.userContestRankingHistory.filter(h => h.attended);
  console.log("History length:", history.length);
  if (history.length > 0) {
    console.log("Last 2 ratings:", history.slice(-2).map(h => h.rating));
  }
}).catch(err => {
  console.error("Error:", err.message);
});
