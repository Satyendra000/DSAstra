const Problem = require("../models/Problem");

exports.getProblems = async (req, res) => {
  try {
    const { difficulty, tag, platform, search, page = 1, limit = 20 } = req.query;

    let filter = {};

    if (difficulty) filter.difficulty = difficulty;
    if (tag) filter.tags = tag;
    if (platform) filter.platform = platform;
    if (search) {
      filter.title = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const problems = await Problem.find(filter)
      .skip(skip)
      .limit(limitNumber);
      
    const total = await Problem.countDocuments(filter);

    res.json({
      problems,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      total,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};