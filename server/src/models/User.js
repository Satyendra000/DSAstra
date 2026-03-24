const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    unique: true,
    sparse: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
  },
  targetRating: {
    type: Number,
    default: 1500,
  },
  preferredLanguage: {
    type: String,
    default: "cpp",
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  ratingHistory: [
    {
      platform: String,
      rating: Number,
      date: {
        type: Date,
        default: Date.now,
      },
    }
  ],
  solvedProblems: [
    {
      problemId: String,
      platform: String,
      solvedAt: {
        type: Date,
        default: Date.now,
      },
    }
  ],
  savedProblems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
  }],
}, { timestamps: true });

// Encrypt password using bcrypt
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
