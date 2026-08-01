const express = require('express');
const router = express.Router();
const {
  getHistory,
  getResultDetails,
  getCertificate
} = require('../controllers/resultsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/history', getHistory);
router.get('/details/:sessionId', getResultDetails);
router.get('/certificate/:sessionId', getCertificate);

module.exports = router;
