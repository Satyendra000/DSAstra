const express = require("express");
const router = express.Router();
const {
  syncUser,
  getUserProfile,
  getSolvedProblems,
  toggleBookmark,
  getBookmarks,
  getUserStats,
  updatePlatformHandles,
} = require("../controllers/userController");

// Custom auth middleware that returns 401 JSON for API requests
// instead of requireAuth() which does a 302 redirect
const apiAuth = (req, res, next) => {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Apply auth middleware to all routes
router.use(apiAuth);

router.post("/sync", syncUser);
router.get("/me", getUserProfile);
router.get("/solved", getSolvedProblems);
router.get("/stats", getUserStats);
router.get("/bookmarks", getBookmarks);
router.post("/bookmarks/:problemId", toggleBookmark);
router.put("/platform-handles", updatePlatformHandles);

module.exports = router;
