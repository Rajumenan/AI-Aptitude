import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle } from 'lucide-react';

const OTPVerification = () => {
  const { verifyOtp, resetPassword, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { email, isPasswordReset = false } = location.state || {};

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      setLoading(true);
      const res = await resendOtp(email, isPasswordReset ? 'reset' : 'verification');
      if (res.success) {
        setSuccessMsg(res.message || 'OTP resent successfully!');
        setResendCooldown(60); // 60 seconds cooldown
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!otp || otp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }

    if (isPasswordReset && (!newPassword || newPassword.length < 6)) {
      setErrorMsg('Please enter a new password (min. 6 characters).');
      return;
    }

    try {
      setLoading(true);
      if (isPasswordReset) {
        const res = await resetPassword(email, otp.trim(), newPassword);
        if (res.success) {
          setSuccessMsg('Password reset successful! Redirecting to Login...');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } else {
        const res = await verifyOtp(email, otp.trim());
        if (res.success) {
          setSuccessMsg('Account verified! Logging you in...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card animated">
        <div className="auth-header">
          <h1 className="auth-title">Verify Email</h1>
          <p className="auth-subtitle">
            Enter the 6-digit OTP code sent to <strong style={{ color: 'var(--text)' }}>{email}</strong>
          </p>
        </div>

        {errorMsg && (
          <div className="banner banner-danger">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="banner banner-success">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Verification OTP</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold' }}
            />
          </div>

          {isPasswordReset && (
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? 'Verifying...' : isPasswordReset ? 'Update Password' : 'Verify & Log In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Didn't receive the OTP?{' '}
          {resendCooldown > 0 ? (
            <span style={{ fontWeight: '700', color: 'var(--text-muted)' }}>
              Resend in {resendCooldown}s
            </span>
          ) : (
            <button 
              onClick={handleResendOtp} 
              disabled={loading} 
              style={{ 
                background: 'none', 
                border: 'none', 
                fontWeight: '700', 
                color: 'var(--primary)', 
                cursor: 'pointer', 
                padding: 0,
                textDecoration: 'underline'
              }}
            >
              Resend OTP
            </button>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/login" style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', textDecoration: 'none' }}>
            Back to Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
