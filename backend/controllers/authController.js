const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { generateOTP, hashOTP, getOTPExpiry, canResendOTP, getResendCooldownSeconds } = require('../utils/otp');
const { sendOTPEmail } = require('../services/emailService');

const MAX_OTP_ATTEMPTS = 5; // Lock out after 5 failed attempts

// Helper to generate access and refresh tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'super_secret_access_token_key_12345',
    { expiresIn: '1h' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key_54321',
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

// Helper to update daily login streak and tokens
const updateLoginStreak = (user) => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const lastStr = user.lastLoginDate ? new Date(user.lastLoginDate).toISOString().slice(0, 10) : null;

  if (lastStr !== todayStr) {
    let currentStreak = user.currentStreak || 0;
    if (lastStr) {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      if (lastStr === yesterday.toISOString().slice(0, 10)) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    user.currentStreak = currentStreak;
    if (currentStreak > (user.longestStreak || 0)) {
      user.longestStreak = currentStreak;
    }

    // Award tokens based on the current streak (10 on day 7, 14, 21... otherwise 2)
    if (currentStreak % 7 === 0) {
      user.tokens = (user.tokens || 0) + 10;
    } else {
      user.tokens = (user.tokens || 0) + 2;
    }

    user.lastLoginDate = now;
  }
};

// Internal helper: generate, hash, persist OTP, and send email
const issueAndSendOTP = async (user, emailType = 'verification') => {
  const plainOTP = generateOTP();          // Secure crypto random 6-digit code
  const hashedOTP = await hashOTP(plainOTP); // bcrypt hash before DB storage

  user.otp = hashedOTP;
  user.otpExpiry = getOTPExpiry();           // 5 minutes from now
  user.otpAttempts = 0;                      // Reset attempt counter
  user.otpLastSentAt = new Date();           // Record send timestamp for rate-limiting
  await user.save();

  // Attempt email delivery — log fallback on failure
  try {
    await sendOTPEmail(user.email, plainOTP, emailType);
  } catch (emailErr) {
    // Do not fail the API call if email fails — log and continue
    console.error(`[Email] Failed to send OTP email to ${user.email}:`, emailErr.message);
    console.log(`[DEV FALLBACK] OTP for ${user.email}: ${plainOTP}`);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all fields' });
    }

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ success: false, message: 'User already exists with this email or username' });
      }

      // User exists but is unverified — enforce resend rate-limit
      if (!canResendOTP(user.otpLastSentAt)) {
        const secs = getResendCooldownSeconds(user.otpLastSentAt);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secs} seconds before requesting a new OTP.`
        });
      }

      // Re-issue OTP for existing unverified user
      user.password = password; // Pre-save hook will re-hash
      await issueAndSendOTP(user, 'verification');

      return res.status(200).json({
        success: true,
        message: 'A new verification OTP has been sent to your email.',
        email
      });
    }

    // Create new user
    user = new User({ username, email, password });
    await user.save(); // save first to get _id for Settings

    // Create user settings entry
    await Settings.create({ userId: user._id });

    // Issue and send OTP
    await issueAndSendOTP(user, 'verification');

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for the verification OTP.',
      email
    });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Verify OTP for email verification
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
    }

    const user = await User.findOne({ email }).select('+otp +password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check attempt limit
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Check OTP expiry first
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Compare entered OTP with hashed OTP in DB
    const isOTPValid = await user.matchOTP(otp.trim());
    if (!isOTPValid) {
      user.otpAttempts += 1;
      await user.save();
      const remaining = MAX_OTP_ATTEMPTS - user.otpAttempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'No attempts left. Please request a new OTP.'}`
      });
    }

    // OTP is valid — verify user and clear OTP fields immediately
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    user.otpLastSentAt = null;

    updateLoginStreak(user);

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. Welcome!',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('OTP Verification Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      // Enforce resend rate-limit for auto-resend during login attempt
      if (canResendOTP(user.otpLastSentAt)) {
        await issueAndSendOTP(user, 'verification');
      }
      return res.status(403).json({
        success: false,
        message: 'Account is not yet verified. A new OTP has been sent to your email.',
        isUnverified: true,
        email
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    
    updateLoginStreak(user);
    
    await user.save();

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json({ success: false, message: 'Invalid refresh token' });
    }

    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key_54321');
    } catch (err) {
      user.refreshToken = null;
      await user.save();
      return res.status(403).json({ success: false, message: 'Refresh token expired or invalid' });
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    
    updateLoginStreak(user);
    
    await user.save();

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('Refresh Token Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during token refresh' });
  }
};

// @desc    Forgot Password — Request Reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address' });
    }

    const user = await User.findOne({ email }).select('+otp');
    if (!user) {
      // Generic message to prevent email enumeration attacks
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset OTP has been sent.',
        email
      });
    }

    // Enforce resend rate-limit
    if (!canResendOTP(user.otpLastSentAt)) {
      const secs = getResendCooldownSeconds(user.otpLastSentAt);
      return res.status(429).json({
        success: false,
        message: `Please wait ${secs} seconds before requesting another OTP.`
      });
    }

    await issueAndSendOTP(user, 'reset');

    res.status(200).json({
      success: true,
      message: 'A password reset OTP has been sent to your email address.',
      email
    });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during password reset request' });
  }
};

// @desc    Reset Password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findOne({ email }).select('+otp +password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Enforce attempt limit
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new reset OTP.'
      });
    }

    // Check OTP expiry
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new password reset.' });
    }

    // Verify OTP against bcrypt hash
    const isOTPValid = await user.matchOTP(otp.trim());
    if (!isOTPValid) {
      user.otpAttempts += 1;
      await user.save();
      const remaining = MAX_OTP_ATTEMPTS - user.otpAttempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'No attempts left. Please request a new OTP.'}`
      });
    }

    // OTP valid — update password and clear all OTP fields
    user.password = newPassword;   // Pre-save hook will hash it
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    user.otpLastSentAt = null;
    user.refreshToken = null;      // Force re-login after password reset
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.'
    });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
};

// @desc    Logout — Clear Refresh Token
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};
