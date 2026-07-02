const express = require("express");
const router = express.Router();
const {
  submitCode,
  getSubmissions,
  getSubmissionById,
} = require("../controllers/submissionController");

router.post("/", submitCode);
router.get("/problem/:problemId", getSubmissions);
router.get("/:submissionId", getSubmissionById);

module.exports = router;
