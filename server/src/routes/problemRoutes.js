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
  generateEngine,
  getGlobalHints,
  getPersonalizedHint,
  getConceptGuide
} = require("../controllers/problemController");

router.get("/daily", getDailyProblem);  // must be before /:id
router.get("/", getProblems);
router.post("/seed-leetcode", seedLeetCode);
router.post("/seed-codechef", seedCodeChef);
router.post("/update-leetcode-templates", updateLeetCodeTemplates);
router.delete("/dsastra", deleteDsastraProblems);
router.delete("/clear-cache", clearDescriptionCache);
router.get("/:id", getProblemById);
router.post("/:id/generate-engine", generateEngine);
router.get("/:id/global-hints", getGlobalHints);
router.get("/:id/concept-guide", getConceptGuide);
router.post("/:id/personalized-hint", getPersonalizedHint);

module.exports = router;