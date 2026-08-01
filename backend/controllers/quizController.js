const crypto = require('crypto');
const QuizSession = require('../models/QuizSession');
const Result = require('../models/Result');
const Leaderboard = require('../models/Leaderboard');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { generateAIQuestion, analyzePerformance, generateHint } = require('../services/aiService');

// Hint token costs
const HINT_COSTS = { 1: 30, 2: 50, 3: 70 };

// Helper: compute UTC midnight date string (YYYY-MM-DD)
const utcDateStr = (date) => date.toISOString().slice(0, 10);

// Token reward rules
const DAILY_TOKEN_REWARD = 2;
const SUNDAY_TOKEN_REWARD = 10;

// Helper: check new quiz day, award tokens, and return current streak info
const updateStreak = async (userId) => {
  const user = await User.findById(userId).select('currentStreak longestStreak lastQuizDate tokens');
  if (!user) return { currentStreak: 0, longestStreak: 0, isNewDay: true, tokensAwarded: DAILY_TOKEN_REWARD, totalTokens: DAILY_TOKEN_REWARD };

  const todayStr = utcDateStr(new Date());
  const lastStr = user.lastQuizDate ? utcDateStr(user.lastQuizDate) : null;

  let isNewDay = false;
  let tokensAwarded = 0;

  if (lastStr !== todayStr) {
    isNewDay = true;
    const dayOfWeek = new Date().getUTCDay(); // 0 = Sunday
    tokensAwarded = dayOfWeek === 0 ? SUNDAY_TOKEN_REWARD : DAILY_TOKEN_REWARD;
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    {
      lastQuizDate: new Date(),
      ...(tokensAwarded > 0 && { $inc: { tokens: tokensAwarded } })
    },
    { new: true }
  ).select('tokens');

  const totalTokens = (updated?.tokens || (user.tokens || 0) + tokensAwarded);

  return { 
    currentStreak: user.currentStreak || 0, 
    longestStreak: user.longestStreak || 0, 
    isNewDay, 
    tokensAwarded, 
    totalTokens 
  };
};


// Helper to calculate performance rating
const getPerformanceRating = (score) => {
  const pct = (score / 10) * 100;
  if (pct >= 90) return 'Excellent';
  if (pct >= 80) return 'Very Good';
  if (pct >= 70) return 'Good';
  if (pct >= 60) return 'Average';
  return 'Needs Improvement';
};

// @desc    Start a new quiz session
// @route   POST /api/quiz/start
// @access  Private
exports.startQuiz = async (req, res) => {
  try {
    const { level } = req.body;
    const userId = req.user._id;

    if (!level) {
      return res.status(400).json({ success: false, message: 'Please specify quiz level' });
    }

    // Cancel any ongoing quiz session for the user
    await QuizSession.updateMany(
      { userId, status: 'in-progress' },
      { status: 'completed', endTime: new Date() } // auto-archive
    );

    // Generate the 1st question
    const firstQuestion = await generateAIQuestion(level, []);

    // Create session
    const session = await QuizSession.create({
      userId,
      level,
      questions: [firstQuestion],
      answers: [],
      currentQuestionIndex: 0,
      score: 0,
      startTime: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Quiz started successfully',
      sessionId: session._id,
      level: session.level,
      currentQuestionNumber: 1,
      question: {
        questionText: firstQuestion.questionText,
        options: firstQuestion.options,
        topic: firstQuestion.topic
      }
    });
  } catch (error) {
    console.error('Start Quiz Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error starting quiz' });
  }
};

// @desc    Get the current active question of an ongoing session
// @route   GET /api/quiz/current-question
// @access  Private
exports.getCurrentQuestion = async (req, res) => {
  try {
    const userId = req.user._id;

    const session = await QuizSession.findOne({ userId, status: 'in-progress' });
    if (!session) {
      return res.status(404).json({ success: false, message: 'No active quiz session found' });
    }

    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.status(200).json({
      success: true,
      sessionId: session._id,
      level: session.level,
      currentQuestionNumber: session.currentQuestionIndex + 1,
      question: {
        questionText: currentQuestion.questionText,
        options: currentQuestion.options,
        topic: currentQuestion.topic
      }
    });
  } catch (error) {
    console.error('Get Current Question Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Submit answer for current question and fetch next (or complete quiz)
// @route   POST /api/quiz/submit-answer
// @access  Private
exports.submitAnswer = async (req, res) => {
  try {
    const { answer, questionIndex } = req.body; // 'A', 'B', 'C', 'D' or null
    const userId = req.user._id;

    const session = await QuizSession.findOne({ userId, status: 'in-progress' });
    if (!session) {
      return res.status(404).json({ success: false, message: 'No active quiz session found' });
    }

    const currentQuestionIdx = session.currentQuestionIndex;
    
    // Protection against duplicate submissions for the same question
    if (questionIndex !== undefined && questionIndex !== currentQuestionIdx) {
      const currentQuestion = session.questions[currentQuestionIdx];
      return res.status(200).json({
        success: true,
        isCorrect: false, // Already answered or out of sync
        correctOption: currentQuestion?.correctOption,
        isQuizCompleted: false,
        score: session.score,
        nextQuestionNumber: session.currentQuestionIndex + 1,
        question: currentQuestion ? {
          questionText: currentQuestion.questionText,
          options: currentQuestion.options,
          topic: currentQuestion.topic
        } : null
      });
    }

    const currentQuestion = session.questions[currentQuestionIdx];

    // Evaluate response
    const isCorrect = currentQuestion.correctOption === answer;
    
    // Update score and answers array
    if (isCorrect) {
      session.score += 1;
    }
    session.answers.push(answer || null);
    session.currentQuestionIndex += 1;

    // Check if quiz has reached 10 questions
    if (session.currentQuestionIndex < 10) {
      // Gather list of previous questions to avoid duplication in next questions
      const previousQuestionsList = session.questions.map(q => q.questionText);

      // Generate the next question
      const nextQuestion = await generateAIQuestion(session.level, previousQuestionsList);
      session.questions.push(nextQuestion);
      await session.save();

      res.status(200).json({
        success: true,
        isCorrect,
        correctOption: currentQuestion.correctOption, // to render correct indicator
        isQuizCompleted: false,
        score: session.score,
        nextQuestionNumber: session.currentQuestionIndex + 1,
        question: {
          questionText: nextQuestion.questionText,
          options: nextQuestion.options,
          topic: nextQuestion.topic
        }
      });
    } else {
      // Quiz complete!
      session.status = 'completed';
      session.endTime = new Date();
      await session.save();

      // Process and record results
      const totalQuestions = 10;
      const score = session.score;
      const percentage = (score / totalQuestions) * 100;
      const correctAnswers = score;
      const incorrectAnswers = totalQuestions - score;

      // Time taken in seconds
      const timeTaken = Math.round((session.endTime - session.startTime) / 1000);
      
      // Accuracy calculation (ignoring unanswered questions)
      const attemptedQuestions = session.answers.filter(ans => ans !== null).length;
      const accuracy = attemptedQuestions > 0 ? Math.round((score / attemptedQuestions) * 100) : 0;
      const performanceRating = getPerformanceRating(score);

      // Generate AI analysis
      const quizAnalysisData = {
        level: session.level,
        score,
        totalQuestions,
        questions: session.questions,
        answers: session.answers
      };
      
      const aiAnalysis = await analyzePerformance(quizAnalysisData);

      // Save result
      const result = await Result.create({
        userId,
        sessionId: session._id,
        level: session.level,
        score,
        totalQuestions,
        percentage,
        correctAnswers,
        incorrectAnswers,
        timeTaken,
        accuracy,
        performanceRating,
        analysis: aiAnalysis
      });

      // Update Leaderboard
      let leaderboard = await Leaderboard.findOne({ level: session.level });
      if (!leaderboard) {
        leaderboard = await Leaderboard.create({ level: session.level, entries: [] });
      }

      // Add to entries
      leaderboard.entries.push({
        userId,
        username: req.user.username,
        score,
        timeTaken,
        createdAt: new Date()
      });

      // Sort: Highest score first, then lowest time taken, then oldest
      leaderboard.entries.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.timeTaken - b.timeTaken;
      });

      // Keep only top 10 entries
      if (leaderboard.entries.length > 10) {
        leaderboard.entries = leaderboard.entries.slice(0, 10);
      }
      await leaderboard.save();

      // Certificate Generation (Required >= 70%)
      let certificate = null;
      if (percentage >= 70) {
        const certificateId = crypto.randomUUID();
        certificate = await Certificate.create({
          certificateId,
          userId,
          sessionId: session._id,
          level: session.level,
          score
        });

        // Notify user about certificate achievement
        await Notification.create({
          userId,
          title: 'Certificate Unlocked! 🏆',
          message: `Congratulations! You scored ${percentage}% in the ${session.level} Quiz and earned a Certificate of Achievement.`,
          type: 'Achievement'
        });
      } else {
        // Standard notification
        await Notification.create({
          userId,
          title: 'Quiz Completed! 📝',
          message: `You completed the ${session.level} Quiz with a score of ${score}/10. Review your performance report!`,
          type: 'Quiz'
        });
      }

      // Update daily streak
      const streakInfo = await updateStreak(userId);

      res.status(200).json({
        success: true,
        isCorrect,
        correctOption: currentQuestion.correctOption,
        isQuizCompleted: true,
        score: session.score,
        sessionId: session._id,
        resultId: result._id,
        certificateEarned: !!certificate,
        certificateId: certificate ? certificate.certificateId : null,
        streakInfo
      });
    }

  } catch (error) {
    console.error('Submit Answer Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error submitting answer' });
  }
};

// @desc    Get session state (check if user has active session)
// @route   GET /api/quiz/session-state
// @access  Private
exports.getSessionState = async (req, res) => {
  try {
    const userId = req.user._id;
    const session = await QuizSession.findOne({ userId, status: 'in-progress' });

    if (!session) {
      return res.status(200).json({ success: true, hasActiveSession: false });
    }

    res.status(200).json({
      success: true,
      hasActiveSession: true,
      sessionId: session._id,
      level: session.level,
      currentQuestionNumber: session.currentQuestionIndex + 1
    });
  } catch (error) {
    console.error('Get Session State Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error checking session' });
  }
};

// @desc    Use tokens to get a hint for the current question
// @route   POST /api/quiz/hint
// @access  Private
exports.getHint = async (req, res) => {
  try {
    const userId = req.user._id;
    const { hintNumber } = req.body; // 1, 2, or 3

    const hintNum = parseInt(hintNumber);
    if (![1, 2, 3].includes(hintNum)) {
      return res.status(400).json({ success: false, message: 'Hint number must be 1, 2, or 3.' });
    }

    const tokenCost = HINT_COSTS[hintNum];

    // Get active session
    const session = await QuizSession.findOne({ userId, status: 'in-progress' });
    if (!session) {
      return res.status(404).json({ success: false, message: 'No active quiz session found.' });
    }

    // Get current question
    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion) {
      return res.status(404).json({ success: false, message: 'Current question not found.' });
    }

    // Check token balance
    const user = await User.findById(userId).select('tokens');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if ((user.tokens || 0) < tokenCost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient tokens. Hint #${hintNum} costs ${tokenCost} tokens. You have ${user.tokens || 0} tokens.`,
        required: tokenCost,
        available: user.tokens || 0
      });
    }

    // Deduct tokens atomically
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { tokens: -tokenCost } },
      { new: true }
    ).select('tokens');

    // Generate AI hint
    const hintResult = await generateHint(
      currentQuestion.questionText,
      currentQuestion.options,
      hintNum
    );

    res.status(200).json({
      success: true,
      hintNumber: hintNum,
      hint: hintResult.hint,
      tokensSpent: tokenCost,
      remainingTokens: updatedUser.tokens
    });

  } catch (error) {
    console.error('Get Hint Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error generating hint.' });
  }
};
