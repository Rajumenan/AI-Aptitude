const express = require('express');
const router = express.Router();
const {
  startQuiz,
  getCurrentQuestion,
  submitAnswer,
  getSessionState,
  getHint
} = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');

// Apply JWT authentication wrapper to all quiz routes
router.use(protect);

router.post('/start', startQuiz);
router.get('/current-question', getCurrentQuestion);
router.post('/submit-answer', submitAnswer);
router.get('/session-state', getSessionState);
router.post('/hint', getHint);

module.exports = router;

