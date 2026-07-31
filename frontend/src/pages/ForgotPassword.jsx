import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword(email.trim());
      if (res.success) {
        setSuccessMsg('Reset OTP sent successfully!');
        setTimeout(() => {
          navigate('/otp-verification', { 
            state: { email: email.trim(), isPasswordReset: true } 
          });
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to request reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card animated">
        <div className="auth-header">
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">Enter your email and we'll send you an OTP code to reset your password</p>
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
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="e.g. name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? 'Sending OTP...' : 'Send Reset Code'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/login" style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', textDecoration: 'none' }}>
            Back to Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
