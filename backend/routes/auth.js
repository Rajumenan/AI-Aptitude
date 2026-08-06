const express = require('express');
const router = express.Router();
const {
  register,
  verifyOtp,
  resendOtp,
  login,
  googleLogin,
  getGoogleClientId,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout
} = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/resend-otp', authLimiter, resendOtp);
router.post('/login', authLimiter, login);
router.post('/google-login', authLimiter, googleLogin);
router.get('/google-client-id', getGoogleClientId);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/logout', logout);

module.exports = router;
