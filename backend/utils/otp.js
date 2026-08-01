const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Generate a cryptographically secure random 6-digit OTP.
 * Uses Node.js crypto module instead of Math.random() for true randomness.
 */
const generateOTP = () => {
  // Generate a secure random number in the range [100000, 999999]
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0);
  return String(100000 + (num % 900000)); // guaranteed 6 digits
};

/**
 * Hash a plain OTP using bcrypt before storing in the database.
 * This ensures that even if DB is compromised, OTPs are unusable.
 */
const hashOTP = async (plainOTP) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainOTP, salt);
};

/**
 * Calculate OTP expiry timestamp — 5 minutes from now.
 */
const getOTPExpiry = () => {
  return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
};

/**
 * Check if OTP resend is allowed based on rate-limit of 1 per 60 seconds.
 * Returns true if resend is permitted.
 */
const canResendOTP = (lastSentAt) => {
  if (!lastSentAt) return true;
  const cooldownMs = 60 * 1000; // 60 seconds
  return (Date.now() - new Date(lastSentAt).getTime()) >= cooldownMs;
};

/**
 * Get remaining cooldown seconds for resend rate-limit.
 */
const getResendCooldownSeconds = (lastSentAt) => {
  if (!lastSentAt) return 0;
  const elapsed = Date.now() - new Date(lastSentAt).getTime();
  const cooldownMs = 60 * 1000;
  return Math.max(0, Math.ceil((cooldownMs - elapsed) / 1000));
};

module.exports = {
  generateOTP,
  hashOTP,
  getOTPExpiry,
  canResendOTP,
  getResendCooldownSeconds
};
