const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/me', getProfile);
router.put('/update', updateProfile);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
