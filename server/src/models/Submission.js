const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Storing Clerk ID directly or local User ID
      default: null,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Accepted",
        "Wrong Answer",
        "Time Limit Exceeded",
        "Compilation Error",
        "Runtime Error",
        "Internal Error",
        "Pending",
      ],
      default: "Pending",
    },
    executionTime: {
      type: Number,
      default: null,
    },
    memory: {
      type: Number,
      default: null,
    },
    passedTestCases: {
      type: Number,
      default: 0,
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// Index for faster queries
submissionSchema.index({ problemId: 1, userId: 1, createdAt: -1 });

module.exports = mongoose.model("Submission", submissionSchema);
