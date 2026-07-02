const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
  {
    title: String,
    platform: String,
    problemId: String,
    difficulty: String,
    rating: Number,
    tags: [String],
    url: String,
    // Cached problem content (fetched on first load)
    description: { type: String, default: null }, // Full HTML
    examples: { type: mongoose.Schema.Types.Mixed, default: null }, // Test cases (array or string)
    hints: [String],
    //Code Template -> Shown to User
    defaultCode: {
      cpp: { type: String, default: "" },
      java: { type: String, default: "" },
      python: { type: String, default: "" },
      javascript: { type: String, default: "" },
    },
    //Hidden Code
    driverCode: {
      cpp: { type: String, default: "" },
      java: { type: String, default: "" },
      python: { type: String, default: "" },
      javascript: { type: String, default: "" },
    },
    meta: {
      timeLimit: String,
      memoryLimit: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Problem", problemSchema);