const Leaderboard = require('../models/Leaderboard');

// @desc    Get leaderboard rankings for a specific level
// @route   GET /api/leaderboard/:level
// @access  Public (or Private)
exports.getLeaderboard = async (req, res) => {
  try {
    const { level } = req.params;

    const validLevels = ['Basic', 'Intermediate', 'Advance', 'Company Related', 'Government Exams'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ success: false, message: 'Invalid level specified' });
    }

    const leaderboard = await Leaderboard.findOne({ level })
      .populate({
        path: 'entries.userId',
        select: 'username email'
      });

    if (!leaderboard) {
      return res.status(200).json({
        success: true,
        level,
        rankings: []
      });
    }

    // Clean up response entries
    const rankings = leaderboard.entries.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId?._id || entry.userId,
      username: entry.username,
      score: entry.score,
      timeTaken: entry.timeTaken,
      date: entry.createdAt
    }));

    res.status(200).json({
      success: true,
      level,
      rankings
    });
  } catch (error) {
    console.error('Get Leaderboard Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving leaderboard' });
  }
};
