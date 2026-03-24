const User = require("../models/User");

// @desc    Sync Clerk user to MongoDB
// @route   POST /api/users/sync
// @access  Private (Clerk)
const syncUser = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { email, name } = req.body;

    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      user = await User.create({
        clerkId: userId,
        email,
        name,
      });
      return res.status(201).json(user);
    }

    if (user.email !== email || user.name !== name) {
      user.email = email;
      user.name = name;
      await user.save();
    }

    res.json(user);
  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ message: "Server Error" });
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

module.exports = { syncUser, getUserProfile, toggleBookmark, getBookmarks };
