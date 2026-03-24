const express = require("express");
const router = express.Router();
const { syncUser, getUserProfile, toggleBookmark, getBookmarks } = require("../controllers/userController");
const { requireAuth } = require("../middleware/clerkAuth");

// Apply Clerk auth middleware to all routes
router.use(requireAuth);

router.post("/sync", syncUser);
router.get("/me", getUserProfile);
router.get("/bookmarks", getBookmarks);
router.post("/bookmarks/:problemId", toggleBookmark);

module.exports = router;
