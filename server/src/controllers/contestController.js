const { fetchUpcomingContests } = require("../services/contestService");

// @desc   Get upcoming contests from CF, LC, CC
// @route  GET /api/contests/upcoming
// @access Public (no auth needed)
exports.getUpcomingContests = async (req, res) => {
  try {
    const contests = await fetchUpcomingContests();
    res.json({ contests });
  } catch (error) {
    console.error("[ContestController] Error:", error.message);
    res.status(500).json({ message: "Failed to fetch contests", error: error.message });
  }
};
