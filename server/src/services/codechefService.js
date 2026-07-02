const axios = require("axios");

/**
 * Fetch CodeChef practice problems from their API
 * CodeChef organizes problems by difficulty levels in the PRACTICE contest
 */
async function fetchCodeChefProblems(limit = 200) {
  const problems = [];
  const difficulties = ["school", "easy", "medium", "hard", "challenge"];
  
  for (const difficulty of difficulties) {
    try {
      // CodeChef API for practice problems by difficulty
      const response = await axios.get(
        `https://www.codechef.com/api/list/problems/${difficulty}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
          },
          timeout: 15000,
        }
      );

      if (response.data && response.data.data) {
        const categoryProblems = response.data.data;
        
        for (const problemCode in categoryProblems) {
          const p = categoryProblems[problemCode];
          problems.push({
            problemCode: p.code || problemCode,
            title: p.name || p.code || problemCode,
            difficulty: mapDifficulty(difficulty),
            tags: p.tags || [],
            solved: p.solved_by || 0,
            accuracy: p.accuracy || 0,
          });
        }
      }
      
      console.log(`[CodeChef] Fetched ${difficulty} problems`);
    } catch (err) {
      console.warn(`[CodeChef] Failed to fetch ${difficulty}: ${err.message}`);
    }
    
    // Rate limiting - be nice to CodeChef API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Sort by popularity (solved count) and return top problems
  problems.sort((a, b) => (b.solved || 0) - (a.solved || 0));
  return problems.slice(0, limit);
}

/**
 * Alternative: Fetch from CodeChef's practice problems page
 * This is a more reliable endpoint
 */
async function fetchCodeChefPracticeProblems(limit = 150) {
  const problems = [];
  
  try {
    // Fetch from the practice problems API
    const response = await axios.get(
      "https://www.codechef.com/api/list/problems/practice",
      {
        params: {
          limit: Math.min(limit, 500),
          offset: 0,
          sortBy: "successful_submissions",
          sortOrder: "desc",
        },
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Referer": "https://www.codechef.com/practice",
        },
        timeout: 20000,
      }
    );

    if (response.data && response.data.data) {
      const problemList = Array.isArray(response.data.data) 
        ? response.data.data 
        : Object.values(response.data.data);
      
      for (const p of problemList) {
        if (!p.code && !p.problemCode) continue;
        
        problems.push({
          problemCode: p.code || p.problemCode,
          title: p.name || p.problemName || p.code,
          difficulty: p.difficulty_tag || mapDifficultyFromRating(p.difficulty_rating),
          rating: p.difficulty_rating,
          tags: Array.isArray(p.tags) ? p.tags : (p.tags ? p.tags.split(",").map(t => t.trim()) : []),
          solved: p.successful_submissions || p.solved_by || 0,
        });
      }
    }
  } catch (err) {
    console.warn(`[CodeChef] Practice API failed: ${err.message}`);
  }

  return problems.slice(0, limit);
}

/**
 * Fetch popular CodeChef problems using multiple methods
 */
async function fetchCodeChefPopularProblems(limit = 100) {
  let problems = [];
  
  // Method 1: Try the practice API
  problems = await fetchCodeChefPracticeProblems(limit);
  
  // Method 2: If that didn't work well, try category-based fetching
  if (problems.length < 50) {
    console.log("[CodeChef] Falling back to category-based fetching...");
    problems = await fetchCodeChefProblems(limit);
  }
  
  // Method 3: Fallback to hardcoded popular problems if APIs fail
  if (problems.length < 20) {
    console.log("[CodeChef] Using fallback popular problems list...");
    problems = getFallbackProblems();
  }

  return problems;
}

/**
 * Map CodeChef difficulty strings to our standard format
 */
function mapDifficulty(ccDifficulty) {
  const mapping = {
    "school": "Easy",
    "beginner": "Easy",
    "easy": "Easy",
    "medium": "Medium",
    "hard": "Hard",
    "challenge": "Hard",
    "extcontest": "Hard",
  };
  return mapping[ccDifficulty?.toLowerCase()] || "Medium";
}

/**
 * Map difficulty rating to difficulty label
 */
function mapDifficultyFromRating(rating) {
  if (!rating) return "Medium";
  if (rating <= 1000) return "Easy";
  if (rating <= 1600) return "Medium";
  return "Hard";
}

/**
 * Fallback list of popular CodeChef problems
 * These are well-known beginner-friendly problems
 */
function getFallbackProblems() {
  return [
    // Easy / Beginner
    { problemCode: "FLOW001", title: "Add Two Numbers", difficulty: "Easy", tags: ["implementation", "basic"], solved: 500000 },
    { problemCode: "FLOW002", title: "ID and Ship", difficulty: "Easy", tags: ["implementation"], solved: 350000 },
    { problemCode: "FLOW003", title: "Sum of Digits", difficulty: "Easy", tags: ["implementation", "math"], solved: 300000 },
    { problemCode: "FLOW004", title: "First and Last Digit", difficulty: "Easy", tags: ["implementation"], solved: 280000 },
    { problemCode: "FLOW005", title: "True or False", difficulty: "Easy", tags: ["implementation"], solved: 250000 },
    { problemCode: "FLOW006", title: "Reverse the Number", difficulty: "Easy", tags: ["implementation", "math"], solved: 240000 },
    { problemCode: "FLOW007", title: "Reverse the Number 2", difficulty: "Easy", tags: ["implementation"], solved: 220000 },
    { problemCode: "INTEST", title: "Enormous Input Test", difficulty: "Easy", tags: ["implementation", "i/o"], solved: 200000 },
    { problemCode: "HS08TEST", title: "ATM", difficulty: "Easy", tags: ["implementation"], solved: 180000 },
    { problemCode: "LAPIN", title: "Lapindrome", difficulty: "Easy", tags: ["strings"], solved: 150000 },
    { problemCode: "FCTRL", title: "Factorial", difficulty: "Easy", tags: ["math"], solved: 140000 },
    { problemCode: "FCTRL2", title: "Small Factorials", difficulty: "Easy", tags: ["math", "big-integer"], solved: 130000 },
    { problemCode: "TURMOIL", title: "Turmoil", difficulty: "Easy", tags: ["sorting", "greedy"], solved: 100000 },
    { problemCode: "CARVANS", title: "Carvans", difficulty: "Easy", tags: ["implementation"], solved: 95000 },
    { problemCode: "TSORT", title: "Turbo Sort", difficulty: "Easy", tags: ["sorting"], solved: 90000 },
    { problemCode: "SUMTRIAN", title: "Sums in a Triangle", difficulty: "Easy", tags: ["dp", "math"], solved: 85000 },
    // Medium
    { problemCode: "MARCHA1", title: "Paying Up", difficulty: "Medium", tags: ["dp", "bitmask"], solved: 50000 },
    { problemCode: "LECANDY", title: "Little Elephant and Candies", difficulty: "Medium", tags: ["implementation"], solved: 60000 },
    { problemCode: "NUMGAME", title: "A Funny Game", difficulty: "Medium", tags: ["game-theory"], solved: 40000 },
    { problemCode: "ACODE", title: "Alpha Code", difficulty: "Medium", tags: ["dp", "strings"], solved: 45000 },
    { problemCode: "MAXDIFF", title: "Maximum Difference", difficulty: "Medium", tags: ["implementation", "math"], solved: 55000 },
    { problemCode: "TWOSTR", title: "Two Strings", difficulty: "Medium", tags: ["strings"], solved: 70000 },
    { problemCode: "SNAKPROC", title: "Snake Procession", difficulty: "Medium", tags: ["strings", "implementation"], solved: 65000 },
    { problemCode: "CHEFSTR1", title: "Chef and String", difficulty: "Medium", tags: ["strings", "greedy"], solved: 48000 },
    // Hard
    { problemCode: "PRIME1", title: "Prime Generator", difficulty: "Hard", tags: ["math", "sieve"], solved: 30000 },
    { problemCode: "SPOJ", title: "Sphere Online Judge", difficulty: "Hard", tags: ["dp"], solved: 25000 },
    { problemCode: "TOUR", title: "Traversing Grid", difficulty: "Hard", tags: ["dp", "grid"], solved: 15000 },
    { problemCode: "RRATING", title: "Restaurant Rating", difficulty: "Hard", tags: ["data-structures", "heap"], solved: 20000 },
  ];
}

module.exports = { 
  fetchCodeChefProblems, 
  fetchCodeChefPracticeProblems, 
  fetchCodeChefPopularProblems 
};
