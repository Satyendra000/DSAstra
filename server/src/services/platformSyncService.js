const axios = require("axios");

/**
 * Fetch Codeforces user info (rating, rank, etc.)
 */
async function fetchCodeforcesStats(handle) {
  if (!handle) return null;
  try {
    const res = await axios.get(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
      { timeout: 10000 }
    );
    if (res.data.status === "OK" && res.data.result?.length > 0) {
      const user = res.data.result[0];
      
      let totalSolved = 0;
      try {
        const statusRes = await axios.get(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`, { timeout: 10000 });
        if (statusRes.data.status === "OK") {
          const uniqueProblems = new Set(
            statusRes.data.result
              .filter(s => s.verdict === "OK")
              .map(s => s.problem.name)
          );
          totalSolved = uniqueProblems.size;
        }
      } catch (err) {
        console.warn(`[PlatformSync] Codeforces status fetch failed for "${handle}":`, err.message);
      }

      return {
        platform: "Codeforces",
        rating: user.rating || 0,
        maxRating: user.maxRating || 0,
        rank: user.rank || "unrated",
        handle: user.handle,
        totalSolved,
      };
    }
  } catch (err) {
    console.warn(`[PlatformSync] Codeforces fetch failed for "${handle}":`, err.message);
  }
  return null;
}

/**
 * Fetch Codeforces rating history for sparkline
 */
async function fetchCodeforcesRatingHistory(handle) {
  if (!handle) return [];
  try {
    const res = await axios.get(
      `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`,
      { timeout: 10000 }
    );
    if (res.data.status === "OK" && res.data.result) {
      return res.data.result.map((entry) => ({
        rating: entry.newRating,
        date: new Date(entry.ratingUpdateTimeSeconds * 1000),
      }));
    }
  } catch (err) {
    console.warn(`[PlatformSync] Codeforces rating history failed for "${handle}":`, err.message);
  }
  return [];
}

/**
 * Fetch LeetCode user profile stats via their GraphQL API
 */
async function fetchLeetCodeStats(handle) {
  if (!handle) return null;
  try {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
          }
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
        userContestRanking(username: $username) {
          rating
          attendedContestsCount
          globalRanking
          topPercentage
        }
        userContestRankingHistory(username: $username) {
          attended
          rating
          contest {
            startTime
          }
        }
      }
    `;

    const res = await axios.post(
      "https://leetcode.com/graphql",
      {
        query,
        variables: { username: handle },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Referer": "https://leetcode.com",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 10000,
      }
    );

    const data = res.data?.data;
    if (!data?.matchedUser && !data?.userContestRanking) return null;

    const contestRating = data.userContestRanking?.rating
      ? Math.round(data.userContestRanking.rating)
      : 0;

    const acStats = data?.matchedUser?.submitStatsGlobal?.acSubmissionNum || [];
    const totalSolved = acStats.find((s) => s.difficulty === "All")?.count || 0;

    // Extract real contest history
    const historyList = (data.userContestRankingHistory || [])
      .filter((h) => h.attended)
      .map((h) => ({
        rating: Math.round(h.rating),
        date: new Date(h.contest.startTime * 1000),
      }));

    // Fetch calendar separately because if it's private it crashes the whole query
    let heatmap = {};
    try {
      const calendarQuery = `
        query userProfileCalendar($username: String!) {
          matchedUser(username: $username) {
            userCalendar {
              submissionCalendar
            }
          }
        }
      `;
      const calRes = await axios.post(
        "https://leetcode.com/graphql",
        { query: calendarQuery, variables: { username: handle } },
        { headers: { "Content-Type": "application/json", "Referer": "https://leetcode.com", "User-Agent": "Mozilla/5.0" }, timeout: 5000 }
      );
      
      const calendarJson = calRes.data?.data?.matchedUser?.userCalendar?.submissionCalendar;
      if (calendarJson) {
        const parsed = JSON.parse(calendarJson);
        for (const [timestamp, count] of Object.entries(parsed)) {
          const date = new Date(parseInt(timestamp) * 1000);
          const dateStr = date.toISOString().split("T")[0];
          heatmap[dateStr] = (heatmap[dateStr] || 0) + count;
        }
      }
    } catch (e) {
      console.warn("Failed to parse LeetCode calendar or calendar is hidden:", e.message);
    }

    return {
      platform: "LeetCode",
      rating: contestRating,
      maxRating: contestRating,
      rank: data?.matchedUser?.profile?.ranking || 0,
      handle,
      totalSolved,
      contestsAttended: data?.userContestRanking?.attendedContestsCount || 0,
      heatmap,
      history: historyList,
    };
  } catch (err) {
    console.warn(`[PlatformSync] LeetCode fetch failed for "${handle}":`, err.message);
  }
  return null;
}

/**
 * Fetch CodeChef user profile stats
 */
async function fetchCodeChefStats(handle) {
  if (!handle) return null;
  try {
    const res = await axios.get(
      `https://www.codechef.com/users/${encodeURIComponent(handle)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "text/html",
        },
        timeout: 10000,
      }
    );

    const html = res.data;

    // Extract current rating
    const ratingMatch = html.match(/class="rating-number"[^>]*>\s*(\d+)\s*<\/div>/);
    const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 0;

    // Extract max rating and stars
    const maxRatingMatch = html.match(/Highest Rating\s*(\d+)/i);
    const maxRating = maxRatingMatch ? parseInt(maxRatingMatch[1]) : rating;

    const starsMatch = html.match(/(\d+)★/);
    const stars = starsMatch ? `${starsMatch[1]}★` : "1★";
    
    // Extract total solved
    const solvedMatch = html.match(/Total Problems Solved:\s*(\d+)/i);
    const totalSolved = solvedMatch ? parseInt(solvedMatch[1], 10) : 0;
    
    // Extract real contest history
    let historyList = [];
    try {
      const historyMatch = html.match(/var all_rating = (\[.*?\]);/);
      if (historyMatch) {
        const parsed = JSON.parse(historyMatch[1]);
        historyList = parsed.map(h => ({
          rating: parseInt(h.rating),
          date: new Date(h.end_date)
        }));
      }
    } catch (e) {
      console.warn("Failed to parse CodeChef history:", e.message);
    }

    return {
      platform: "CodeChef",
      rating,
      maxRating,
      rank: stars || (rating > 0 ? `${rating}` : "Unrated"),
      handle,
      totalSolved,
      history: historyList,
    };
  } catch (err) {
    console.warn(`[PlatformSync] CodeChef fetch failed for "${handle}":`, err.message);
  }
  return null;
}

/**
 * Sync all platform data for a user and update their DB record
 */
async function syncPlatformData(user) {
  const handles = user.platformHandles || {};
  const results = { ratings: [], updated: false };

  // Fetch all platforms in parallel
  const [cfStats, lcStats, ccStats, cfHistory] = await Promise.all([
    fetchCodeforcesStats(handles.codeforces),
    fetchLeetCodeStats(handles.leetcode),
    fetchCodeChefStats(handles.codechef),
    fetchCodeforcesRatingHistory(handles.codeforces),
  ]);

  // Build rating history entries — start with existing history to preserve sparklines
  const ratingHistory = [...(user.ratingHistory || [])];

  // Helper to overwrite platform history safely
  const overwriteHistory = (platform, historyArray, defaultRating) => {
    if (historyArray && historyArray.length > 0) {
      const otherHistory = ratingHistory.filter(entry => entry.platform !== platform);
      ratingHistory.length = 0;
      ratingHistory.push(...otherHistory);
      
      historyArray.forEach((entry) => {
        ratingHistory.push({
          platform,
          rating: entry.rating,
          date: entry.date,
        });
      });
    } else {
      // If they literally have no history (or scraping failed), append at least 1 entry if we have a current rating
      const platformHistory = ratingHistory.filter(e => e.platform === platform);
      if (platformHistory.length === 0) {
        ratingHistory.push({
          platform,
          rating: defaultRating || 0,
          date: new Date(),
        });
      }
    }
  };

  if (cfStats) {
    results.ratings.push(cfStats);
    overwriteHistory("Codeforces", cfHistory, cfStats.rating);
  }

  if (lcStats) {
    results.ratings.push(lcStats);
    overwriteHistory("LeetCode", lcStats.history, lcStats.rating);
  }

  if (ccStats) {
    results.ratings.push(ccStats);
    overwriteHistory("CodeChef", ccStats.history, ccStats.rating);
  }

  // Ensure rating history stays bounded (e.g. max 500 entries)
  if (ratingHistory.length > 500) {
    ratingHistory.splice(0, ratingHistory.length - 500);
  }

  // Update the user document
  if (ratingHistory.length > 0) {
    user.ratingHistory = ratingHistory;
    user.markModified("ratingHistory");
    results.updated = true;
  }

  // Store external solved counts and heatmaps safely (don't overwrite with null if API fails)
  const existingStats = user.externalStats || {};
  user.externalStats = {
    codeforces: cfStats ? { rating: cfStats.rating, maxRating: cfStats.maxRating, rank: cfStats.rank, totalSolved: cfStats.totalSolved } : existingStats.codeforces,
    leetcode: lcStats ? { 
      rating: lcStats.rating, 
      totalSolved: lcStats.totalSolved, 
      contestsAttended: lcStats.contestsAttended,
      heatmap: lcStats.heatmap // pass to db
    } : existingStats.leetcode,
    codechef: ccStats ? { rating: ccStats.rating, maxRating: ccStats.maxRating, rank: ccStats.rank, totalSolved: ccStats.totalSolved } : existingStats.codechef,
  };
  user.markModified("externalStats");
  results.updated = true;

  // Update contests participated count
  const totalContests =
    (lcStats?.contestsAttended || 0) + (cfHistory?.length || 0);
  if (totalContests > 0) {
    user.contestsParticipated = totalContests;
  }

  if (results.updated) {
    await user.save();
  }

  console.log(
    `[PlatformSync] Synced for user ${user.clerkId}: ${results.ratings.map((r) => `${r.platform}=${r.rating}`).join(", ") || "no data"}`
  );

  return results;
}

module.exports = {
  fetchCodeforcesStats,
  fetchCodeforcesRatingHistory,
  fetchLeetCodeStats,
  fetchCodeChefStats,
  syncPlatformData,
};
