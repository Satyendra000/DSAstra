const express = require("express");
const router = express.Router();
const {
  getProblems,
  getProblemById,
  getDailyProblem,
  clearDescriptionCache,
  seedLeetCode,
  seedCodeChef,
  deleteDsastraProblems,
  updateLeetCodeTemplates,
} = require("../controllers/problemController");

router.get("/daily", getDailyProblem);  // must be before /:id
router.get("/", getProblems);
router.post("/seed-leetcode", seedLeetCode);
router.post("/seed-codechef", seedCodeChef);
router.post("/update-leetcode-templates", updateLeetCodeTemplates);
router.delete("/dsastra", deleteDsastraProblems);
router.delete("/clear-cache", clearDescriptionCache);
router.get("/:id", getProblemById);

module.exports = router;