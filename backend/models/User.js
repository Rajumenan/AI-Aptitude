const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true,
    maxlength: [20, 'Username cannot exceed 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },

  // === Secure OTP fields ===
  otp: {
    type: String,   // Stores HASHED OTP (never plain text)
    default: null,
    select: false
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  otpAttempts: {
    type: Number,
    default: 0     // Max 5 verification attempts
  },
  otpLastSentAt: {
    type: Date,
    default: null  // For resend rate-limiting (1 per 60 seconds)
  },

  isVerified: {
    type: Boolean,
    default: false
  },
  refreshToken: {
    type: String,
    default: null
  },

  // === Daily Streak ===
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastQuizDate: {
    type: Date,
    default: null   // Date of last completed quiz (UTC midnight)
  },
  lastLoginDate: {
    type: Date,
    default: null
  },

  // === Tokens ===
  tokens: {
    type: Number,
    default: 0     // +2 per new quiz day, +10 on Sunday
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Verify a plain OTP against the stored bcrypt hash
UserSchema.methods.matchOTP = async function(enteredOTP) {
  if (!this.otp) return false;
  return await bcrypt.compare(enteredOTP, this.otp);
};

module.exports = mongoose.model('User', UserSchema);
