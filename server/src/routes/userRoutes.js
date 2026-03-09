const express = require("express");
const router = express.Router();
const { syncUser, getUserProfile } = require("../controllers/userController");
const { requireAuth } = require("../middleware/clerkAuth");

// Apply Clerk auth middleware to all routes
router.use(requireAuth);

router.post("/sync", syncUser);
router.get("/me", getUserProfile);

module.exports = router;
