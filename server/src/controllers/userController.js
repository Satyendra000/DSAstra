const User = require("../models/User");
const Submission = require("../models/Submission");
const { syncPlatformData } = require("../services/platformSyncService");

// @desc    Sync Clerk user to MongoDB
// @route   POST /api/users/sync
// @access  Private (Clerk)
const syncUser = async (req, res) => {
  try {
    console.log("syncUser: started");
    const userId = req.auth.userId;
    const { email, name } = req.body;
    console.log("syncUser: userId:", userId, "email:", email, "name:", name);

    let user = await User.findOne({ clerkId: userId });
    console.log("syncUser: findOne complete, user found:", !!user);

    if (!user) {
      console.log("syncUser: creating new user...");
      user = await User.create({
        clerkId: userId,
        email,
        name,
      });
      console.log("syncUser: user created.");
      return res.status(201).json(user);
    }

    if (user.email !== email || user.name !== name) {
      console.log("syncUser: updating user...");
      user.email = email;
      user.name = name;
      await user.save();
      console.log("syncUser: update saved.");
    }

    // Sync platform data if handles are set
    const handles = user.platformHandles || {};
    if (handles.codeforces || handles.leetcode || handles.codechef) {
      try {
        console.log("syncUser: syncing platform data...");
        await syncPlatformData(user);
        // Reload user with updated data
        user = await User.findOne({ clerkId: userId });
        console.log("syncUser: platform sync complete.");
      } catch (syncErr) {
        console.warn("syncUser: platform sync failed:", syncErr.message);
      }
    }

    console.log("syncUser: sending response");
    res.json(user);
  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private (Clerk)
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get solved problem IDs (MongoDB _ids)
// @route   GET /api/users/solved
// @access  Private (Clerk)
const getSolvedProblems = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId }).select("solvedProblems");
    if (!user) {
      return res.json({ solvedProblemIds: [] });
    }
    
    // Return the problemId strings (which are MongoDB _id values)
    const solvedProblemIds = (user.solvedProblems || []).map(sp => sp.problemId);
    res.json({ solvedProblemIds });
  } catch (error) {
    console.error("Get Solved Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Toggle bookmark a problem
// @route   POST /api/users/bookmarks/:problemId
// @access  Private (Clerk)
const toggleBookmark = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { problemId } = req.params;

    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isBookmarked = user.savedProblems.includes(problemId);

    if (isBookmarked) {
      user.savedProblems.pull(problemId);
    } else {
      user.savedProblems.addToSet(problemId);
    }

    await user.save();
    res.json({ savedProblems: user.savedProblems, bookmarked: !isBookmarked });
  } catch (error) {
    console.error("Bookmark Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all bookmarked problem IDs
// @route   GET /api/users/bookmarks
// @access  Private (Clerk)
const getBookmarks = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId }).select("savedProblems");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ savedProblems: user.savedProblems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update platform handles (CF / LC / CC usernames)
// @route   PUT /api/users/platform-handles
// @access  Private (Clerk)
const updatePlatformHandles = async (req, res) => {
  try {
    console.log("updatePlatformHandles: started");
    const userId = req.auth.userId;
    const { codeforces, leetcode, codechef } = req.body;
    console.log("updatePlatformHandles: body handles:", { codeforces, leetcode, codechef });

    // Upsert — create the user doc if it doesn't exist yet (e.g. first login via Clerk)
    console.log("updatePlatformHandles: upserting user...");
    let user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $setOnInsert: { clerkId: userId },
      },
      { new: true, upsert: true }
    );
    console.log("updatePlatformHandles: upsert complete. User:", !!user);

    if (!user.platformHandles) user.platformHandles = {};
    if (codeforces !== undefined) user.platformHandles.codeforces = codeforces.trim();
    if (leetcode   !== undefined) user.platformHandles.leetcode   = leetcode.trim();
    if (codechef   !== undefined) user.platformHandles.codechef   = codechef.trim();

    user.markModified("platformHandles");
    console.log("updatePlatformHandles: saving user...");
    await user.save();
    console.log("updatePlatformHandles: saved successfully.");

    // Trigger platform data sync in background (don't block the response)
    syncPlatformData(user).catch(err =>
      console.error("Background platform sync failed:", err.message)
    );

    res.json({ platformHandles: user.platformHandles });
  } catch (error) {
    console.error("Platform Handles Error:", error);
    res.status(500).json({ message: "Server Error", detail: error.message });
  }
};


// @desc    Get user statistics for dashboard
// @route   GET /api/users/stats
// @access  Private (Clerk)
const getUserStats = async (req, res) => {
  try {
    // Upsert — never fail for a fresh Clerk user who hasn't been explicitly synced yet
    let user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) {
      // Return empty stats for brand-new users instead of 404
      return res.json({
        solvedCount: 0, streak: 0, heatmapData: {},
        activeDays: 0, avgPerDay: 0, contestsParticipated: 0,
        platformHandles: { codeforces: "", leetcode: "", codechef: "" },
        platformRatings: [], targetRating: 1500,
      });
    }

    // Auto-sync platform data if user has handles but no rating history
    const handles = user.platformHandles || {};
    const hasHandles = handles.codeforces || handles.leetcode || handles.codechef;
    const hasRatings = user.ratingHistory && user.ratingHistory.length > 0;
    if (hasHandles && !hasRatings) {
      try {
        await syncPlatformData(user);
        // Reload user after sync
        user = await User.findOne({ clerkId: req.auth.userId });
      } catch (syncErr) {
        console.warn("Auto-sync during stats fetch failed:", syncErr.message);
      }
    }

    // Calculate solved problems count
    const solvedCount = user.solvedProblems?.length || 0;

    // Get submissions for the last 365 days for heatmap (use clerkId)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const submissions = await Submission.find({
      userId: req.auth.userId,
      createdAt: { $gte: oneYearAgo }
    }).select("createdAt status");

    // Group submissions by date for heatmap
    const heatmapData = {};
    submissions.forEach(sub => {
      // Offset by 4 hours to align with 4 AM rollover (using absolute UTC time)
      const logicalDate = new Date(sub.createdAt.getTime() - 4 * 60 * 60 * 1000);
      const dateKey = logicalDate.toISOString().split('T')[0];
      if (!heatmapData[dateKey]) {
        heatmapData[dateKey] = 0;
      }
      heatmapData[dateKey]++;
    });

    // Merge LeetCode heatmap if it exists
    if (user.externalStats?.leetcode?.heatmap) {
      for (const [dateStr, count] of Object.entries(user.externalStats.leetcode.heatmap)) {
        // Only include last 365 days
        if (new Date(dateStr) >= oneYearAgo) {
          heatmapData[dateStr] = (heatmapData[dateStr] || 0) + count;
        }
      }
    }

    // Calculate streak (consecutive days with submissions)
    let streak = 0;
    // Offset today by 4 hours to align with 4 AM rollover
    const logicalToday = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const todayDateKey = logicalToday.toISOString().split('T')[0];
    
    // Create a normalized Date object at midnight UTC for today's logical date
    const normalizedToday = new Date(todayDateKey + "T00:00:00Z");
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(normalizedToday);
      checkDate.setUTCDate(checkDate.getUTCDate() - i);
      
      const dateKey = checkDate.toISOString().split('T')[0];
      
      if (heatmapData[dateKey] && heatmapData[dateKey] > 0) {
        streak++;
      } else if (i > 0) {
        // Break streak if gap (allow today to be empty)
        break;
      }
    }

    // Get platform ratings from ratingHistory
    const platformRatings = {};
    const platformSparklines = {};
    
    (user.ratingHistory || []).forEach(entry => {
      if (!platformRatings[entry.platform]) {
        platformRatings[entry.platform] = { current: 0, max: 0, history: [] };
      }
      platformRatings[entry.platform].history.push(entry.rating);
      platformRatings[entry.platform].current = entry.rating;
      platformRatings[entry.platform].max = Math.max(platformRatings[entry.platform].max, entry.rating);
    });

    // Format sparklines (last 7 entries per platform)
    Object.keys(platformRatings).forEach(platform => {
      platformSparklines[platform] = platformRatings[platform].history.slice(-7);
    });

    // Compute active days and average per day over last 365 days
    const activeDays = Object.keys(heatmapData).length;
    const totalSubmissionsYear = Object.values(heatmapData).reduce((a, b) => a + b, 0);
    const avgPerDay = activeDays > 0 ? (totalSubmissionsYear / 365).toFixed(1) : "0.0";

    // Ensure all 3 platforms are always returned so the dashboard shows 3 cards
    const allPlatforms = ["Codeforces", "LeetCode", "CodeChef"];
    const finalPlatformRatings = allPlatforms.map(platform => {
      if (platformRatings[platform]) {
        return {
          name: platform,
          rating: platformRatings[platform].current,
          maxRating: platformRatings[platform].max,
          sparkline: platformSparklines[platform]
        };
      } else {
        return {
          name: platform,
          rating: 0,
          maxRating: 0,
          sparkline: []
        };
      }
    });

      const actualTotalPoints = user.solvedProblems.reduce((sum, p) => sum + (p.pointsEarned ?? 10), 0);

      res.json({
        solvedCount,
        streak,
        heatmapData,
        activeDays,
        avgPerDay: parseFloat(avgPerDay),
        contestsParticipated: user.contestsParticipated || 0,
        platformHandles: user.platformHandles || { codeforces: "", leetcode: "", codechef: "" },
        platformRatings: finalPlatformRatings,
        targetRating: user.targetRating || 1500,
        externalStats: user.externalStats || {},
        points: Math.max(user.points || 0, actualTotalPoints),
      pointsHistory: [...user.solvedProblems]
        .sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt))
        .slice(0, 30)
        .map(p => ({
          title: p.title || null,
          platform: p.platform,
          pointsEarned: p.pointsEarned ?? 10,
          focusMode: p.focusMode || false,
          solvedAt: p.solvedAt,
        })),
    });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { syncUser, getUserProfile, getSolvedProblems, toggleBookmark, getBookmarks, getUserStats, updatePlatformHandles };
