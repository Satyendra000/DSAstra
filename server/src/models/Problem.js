const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
  title: String,
  platform: String,
  problemId: String,
  difficulty: String,
  rating: Number,
  tags: [String],
  url: String
}, { timestamps: true });

module.exports = mongoose.model("Problem", problemSchema);