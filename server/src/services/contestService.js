const axios = require("axios");

// Simple in-memory cache (5-minute TTL) so we don't hammer external APIs
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── Codeforces upcoming contests ──────────────────────────────────────────────
async function fetchCodeforcesContests() {
  try {
    const { data } = await axios.get("https://codeforces.com/api/contest.list", {
      timeout: 8000,
    });
    if (data.status !== "OK") return [];

    const now = Date.now() / 1000; // CF uses seconds
    return data.result
      .filter((c) => c.phase === "BEFORE") // only upcoming
      .map((c) => ({
        platform:   "Codeforces",
        platformKey: "CF",
        color:      "#3b82f6",
        title:      c.name,
        startTime:  new Date(c.startTimeSeconds * 1000).toISOString(),
        durationSeconds: c.durationSeconds,
        url:        `https://codeforces.com/contest/${c.id}`,
        id:         `cf-${c.id}`,
      }))
      .slice(0, 6);
  } catch (err) {
    console.warn("[ContestService] Codeforces fetch failed:", err.message);
    return [];
  }
}

// ── LeetCode upcoming contests ────────────────────────────────────────────────
async function fetchLeetCodeContests() {
  try {
    const { data } = await axios.post(
      "https://leetcode.com/graphql/",
      {
        query: `{
          allContests {
            title
            titleSlug
            startTime
            duration
            isVirtual
          }
        }`,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Origin:        "https://leetcode.com",
          Referer:       "https://leetcode.com/contest/",
          "User-Agent":  "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        timeout: 8000,
      }
    );

    const now = Date.now() / 1000;
    const contests = data?.data?.allContests || [];
    return contests
      .filter((c) => !c.isVirtual && c.startTime > now)
      .map((c) => ({
        platform:        "LeetCode",
        platformKey:     "LC",
        color:           "#f59e0b",
        title:           c.title,
        startTime:       new Date(c.startTime * 1000).toISOString(),
        durationSeconds: c.duration,
        url:             `https://leetcode.com/contest/${c.titleSlug}/`,
        id:              `lc-${c.titleSlug}`,
      }))
      .slice(0, 4);
  } catch (err) {
    console.warn("[ContestService] LeetCode fetch failed:", err.message);
    return [];
  }
}

// ── CodeChef upcoming contests ────────────────────────────────────────────────
async function fetchCodeChefContests() {
  try {
    const { data } = await axios.get(
      "https://www.codechef.com/api/list/contests/future?sort_by=START&sorting_order=asc&offset=0&mode=all",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          Accept:       "application/json",
        },
        timeout: 8000,
      }
    );

    const contests = data?.future_contests || [];
    return contests
      .map((c) => ({
        platform:        "CodeChef",
        platformKey:     "CC",
        color:           "#f97316",
        title:           c.contest_name,
        startTime:       new Date(c.contest_start_date_iso).toISOString(),
        durationSeconds: parseInt(c.contest_duration) * 60, // duration in minutes → seconds
        url:             `https://www.codechef.com/${c.contest_code}`,
        id:              `cc-${c.contest_code}`,
      }))
      .slice(0, 4);
  } catch (err) {
    console.warn("[ContestService] CodeChef fetch failed:", err.message);
    return [];
  }
}

// ── Public: fetch + merge + sort all upcoming contests ────────────────────────
async function fetchUpcomingContests() {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL) {
    return cache;
  }

  const [cf, lc, cc] = await Promise.all([
    fetchCodeforcesContests(),
    fetchLeetCodeContests(),
    fetchCodeChefContests(),
  ]);

  const merged = [...cf, ...lc, ...cc].sort(
    (a, b) => new Date(a.startTime) - new Date(b.startTime)
  );

  cache     = merged;
  cacheTime = now;
  return merged;
}

module.exports = { fetchUpcomingContests };
