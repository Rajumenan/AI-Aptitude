const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
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

  // Attempt email delivery asynchronously in the background so it doesn't block the request
  sendOTPEmail(user.email, plainOTP, emailType).catch((emailErr) => {
    console.error(`[Email] Failed to send OTP email to ${user.email}:`, emailErr.message);
  });

  // Log the dev fallback OTP immediately with high visibility so developers can locate it instantly in the console
  console.log(`\n🔑 ==========================================\n🔑 [DEV FALLBACK] OTP for ${user.email}: ${plainOTP}\n🔑 ==========================================\n`);
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

// @desc    Resend OTP (verification or reset)
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res) => {
  try {
    const { email, type = 'verification' } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' });
    }

    const user = await User.findOne({ email }).select('+otp');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If verification OTP is requested, but user is already verified
    if (type === 'verification' && user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified. Please log in.' });
    }

    // Enforce rate limit (1 OTP per 60 seconds)
    if (!canResendOTP(user.otpLastSentAt)) {
      const secs = getResendCooldownSeconds(user.otpLastSentAt);
      return res.status(429).json({
        success: false,
        message: `Please wait ${secs} seconds before requesting a new OTP.`
      });
    }

    // Issue and send OTP
    await issueAndSendOTP(user, type);

    res.status(200).json({
      success: true,
      message: `A new ${type} OTP has been sent to your email.`,
      email
    });
  } catch (error) {
    console.error('Resend OTP Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during OTP resend' });
  }
};

const generateUniqueUsername = async (email, name) => {
  let base = (name || email.split('@')[0])
    .replace(/[^a-zA-Z0-9]/g, '') // strip special characters
    .slice(0, 15); // limit length to keep space for counter suffix

  if (!base) {
    base = 'learner';
  }

  let username = base;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${base}${counter}`;
    counter++;
  }

  return username;
};

// @desc    Google OAuth Login & Automatic Registration
// @route   POST /api/auth/google-login
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Google credential ID token is required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('[Google Auth] GOOGLE_CLIENT_ID is not configured in backend .env');
      return res.status(500).json({ success: false, message: 'Google Authentication is currently unconfigured on the server' });
    }

    const client = new OAuth2Client(clientId);
    let payload;

    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('Google ID token verification failed:', verifyErr.message);
      return res.status(401).json({ success: false, message: 'Invalid Google credential token' });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account does not provide an email address' });
    }

    // 1. Search for user by googleId
    let user = await User.findOne({ googleId });

    if (!user) {
      // 2. Fallback search by email
      user = await User.findOne({ email });

      if (user) {
        // Link Google account
        user.googleId = googleId;
        if (!user.profilePicture) {
          user.profilePicture = picture;
        }
        await user.save();
        console.log(`[Google Auth] Linked Google account for existing email: ${email}`);
      } else {
        // 3. Register a new user automatically
        const username = await generateUniqueUsername(email, name);
        user = new User({
          username,
          email,
          googleId,
          profilePicture: picture,
          isVerified: true // Google accounts are pre-verified
        });
        await user.save();

        // Create default settings entry
        await Settings.create({ userId: user._id });
        console.log(`[Google Auth] Created new user: ${username} (${email})`);
      }
    } else {
      // User exists. Ensure profile picture is updated if changed
      if (picture && user.profilePicture !== picture) {
        user.profilePicture = picture;
        await user.save();
      }
    }

    updateLoginStreak(user);

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Google Login Error:', error.stack || error.message);
    res.status(500).json({ success: false, message: 'Server error during Google authentication' });
  }
};

// @desc    Get Google Client ID for frontend initialization
// @route   GET /api/auth/google-client-id
// @access  Public
exports.getGoogleClientId = async (req, res) => {
  res.status(200).json({
    success: true,
    clientId: process.env.GOOGLE_CLIENT_ID || null
  });
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
