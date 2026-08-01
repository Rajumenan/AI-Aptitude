const Result = require('../models/Result');
const QuizSession = require('../models/QuizSession');
const Certificate = require('../models/Certificate');
const User = require('../models/User');

// @desc    Get user quiz history
// @route   GET /api/results/history
// @access  Private
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await Result.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      history: history.map(h => ({
        id: h._id,
        sessionId: h.sessionId,
        level: h.level,
        score: h.score,
        percentage: h.percentage,
        performanceRating: h.performanceRating,
        timeTaken: h.timeTaken,
        createdAt: h.createdAt
      }))
    });
  } catch (error) {
    console.error('Get History Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving quiz history' });
  }
};

// @desc    Get details of a specific result (for Scorecard, AI report, Question Review)
// @route   GET /api/results/details/:sessionId
// @access  Private
exports.getResultDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const result = await Result.findOne({ sessionId, userId });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result scorecard not found' });
    }

    const session = await QuizSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Quiz session details not found' });
    }

    // Assemble review questions
    // In review, we show the questionText, options, user's answer, correct answer, status and explanation.
    const questionReview = session.questions.map((q, idx) => {
      const userAnswer = session.answers[idx] || null;
      const isCorrect = q.correctOption === userAnswer;
      return {
        questionText: q.questionText,
        options: q.options,
        userAnswer,
        correctAnswer: q.correctOption,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic
      };
    });

    // Fetch streak info for the user
    const user = await User.findById(userId).select('currentStreak longestStreak lastQuizDate');
    const streakInfo = {
      currentStreak: user ? user.currentStreak || 0 : 0,
      longestStreak: user ? user.longestStreak || 0 : 0
    };

    res.status(200).json({
      success: true,
      scorecard: {
        id: result._id,
        sessionId: result.sessionId,
        level: result.level,
        score: result.score,
        totalQuestions: result.totalQuestions,
        percentage: result.percentage,
        correctAnswers: result.correctAnswers,
        incorrectAnswers: result.incorrectAnswers,
        timeTaken: result.timeTaken,
        accuracy: result.accuracy,
        performanceRating: result.performanceRating,
        createdAt: result.createdAt
      },
      analysis: result.analysis,
      review: questionReview,
      certificateEarned: !!(await Certificate.findOne({ sessionId, userId })),
      streakInfo
    });
  } catch (error) {
    console.error('Get Result Details Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving details' });
  }
};

// @desc    Get certificate details
// @route   GET /api/results/certificate/:sessionId
// @access  Private
exports.getCertificate = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const certificate = await Certificate.findOne({ sessionId, userId });
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'No certificate awarded for this session' });
    }

    const user = req.user;

    res.status(200).json({
      success: true,
      certificate: {
        certificateId: certificate.certificateId,
        username: user.username,
        level: certificate.level,
        score: certificate.score,
        dateGenerated: certificate.dateGenerated
      }
    });
  } catch (error) {
    console.error('Get Certificate Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving certificate' });
  }
};
