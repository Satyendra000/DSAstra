const User = require("../models/User");

// @desc    Sync Clerk user to MongoDB
// @route   POST /api/users/sync
// @access  Private (Clerk)
const syncUser = async (req, res) => {
  try {
    const { id: clerkId, emailAddresses, firstName, lastName } = req.auth.claims || req.body; // Adapt based on actual claims structure or client passing data
    // Note: req.auth contains minimal info. Typically client sends the full user object or we fetch from Clerk API.
    // For simplicity, let's assume client sends { email, name } in body along with Clerk ID in token claims.
    
    // Actually better approach: Trust the token for ID, but get details from body or fetch from Clerk.
    // Let's rely on body for now for simplicity, but use clerkId from auth to verify identity.
    
    const userId = req.auth.userId; // This is the Clerk ID
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

    // Update if needed (optional)
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

module.exports = { syncUser, getUserProfile };
