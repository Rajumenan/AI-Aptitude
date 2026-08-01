const nodemailer = require('nodemailer');

/**
 * Create and configure the Nodemailer transporter using Gmail SMTP.
 * Credentials are loaded from environment variables (never hardcoded).
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS   // Use Gmail App Password, not your main password
    }
  });
};

/**
 * Send a professional OTP verification email to the user.
 * @param {string} toEmail   - Recipient email address
 * @param {string} otp       - The plain OTP code (never hashed version)
 * @param {string} type      - 'verification' | 'reset' — determines email subject/body
 */
const sendOTPEmail = async (toEmail, otp, type = 'verification') => {
  const isReset = type === 'reset';

  const subject = isReset
    ? 'AI Quiz Platform — Password Reset OTP'
    : 'AI Quiz Platform — Email Verification OTP';

  const actionLabel = isReset ? 'reset your password' : 'verify your email address';
  const warningLabel = isReset
    ? 'If you did not request a password reset, please ignore this email. Your password will remain unchanged.'
    : 'If you did not create an account with us, please ignore this email.';

  const htmlBody = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${subject}</title>
    <style>
      body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; }
      .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #6200ee 0%, #9c27b0 100%); padding: 36px 40px; text-align: center; }
      .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
      .header p { color: rgba(255,255,255,0.85); font-size: 13px; margin: 6px 0 0 0; }
      .body { padding: 36px 40px; }
      .body p { color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0; }
      .otp-box { background: #f3f0ff; border: 2px dashed #6200ee; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
      .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #6200ee; font-family: 'Courier New', monospace; display: block; }
      .otp-note { font-size: 12px; color: #6b7280; margin-top: 10px; display: block; }
      .warning { background: #fff8f0; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px; margin-top: 20px; }
      .warning p { color: #92400e; font-size: 13px; margin: 0; }
      .footer { background: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb; }
      .footer p { color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.6; }
      .footer strong { color: #6200ee; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <h1>🎓 AI Aptitude Quiz Platform</h1>
        <p>Powered by Google Gemini AI</p>
      </div>
      <div class="body">
        <p>Hello,</p>
        <p>You requested an OTP code to <strong>${actionLabel}</strong> for your AI Quiz Platform account.</p>
        <div class="otp-box">
          <span class="otp-code">${otp}</span>
          <span class="otp-note">⏳ This OTP is valid for <strong>5 minutes only</strong></span>
        </div>
        <p>Please enter this code on the verification screen to proceed. Do <strong>not</strong> share this OTP with anyone — our team will never ask for it.</p>
        <div class="warning">
          <p>⚠️ ${warningLabel}</p>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated message from <strong>Team AI Quiz Platform</strong>.<br/>
        Please do not reply to this email.</p>
        <p style="margin-top:10px;">© ${new Date().getFullYear()} AI Aptitude Quiz Platform. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;

  const transporter = createTransporter();

  const mailOptions = {
    from: `"AI Quiz Platform" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html: htmlBody,
    // Plain-text fallback
    text: `Your OTP for AI Quiz Platform is: ${otp}\n\nThis OTP is valid for 5 minutes. Do not share it with anyone.\n\nTeam AI Quiz Platform`
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email] OTP email sent to ${toEmail} — Message ID: ${info.messageId}`);
  return info;
};

module.exports = { sendOTPEmail };
