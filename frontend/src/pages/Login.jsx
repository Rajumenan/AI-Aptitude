import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const Login = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(null);

  const handleGoogleCredentialResponse = async (response) => {
    setErrorMsg('');
    try {
      setLoading(true);
      const res = await googleLogin(response.credential);
      if (res.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Google Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const data = await api.get('/api/auth/google-client-id');
        if (data.success && data.clientId) {
          setGoogleClientId(data.clientId);
        }
      } catch (err) {
        console.error('Failed to fetch Google Client ID from backend:', err.message);
      }
    };
    fetchClientId();
  }, []);

  useEffect(() => {
    if (!googleClientId) return;

    const initGoogle = () => {
      /* global google */
      if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });
        google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          { theme: 'outline', size: 'large', width: '380' }
        );
      }
    };

    if (typeof google !== 'undefined') {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (typeof google !== 'undefined') {
          initGoogle();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [googleClientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email.trim(), password);
      if (res.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.message && err.message.includes('not verified')) {
        setErrorMsg('Email not verified. Redirecting to OTP Verification...');
        setTimeout(() => {
          navigate('/otp-verification', { state: { email: email.trim() } });
        }, 1500);
      } else {
        setErrorMsg(err.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card animated">
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Log in to challenge your logical & aptitude skills</p>
        </div>

        {errorMsg && (
          <div className="banner banner-danger">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
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

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <Link to="/forgot-password" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)', textDecoration: 'none' }}>
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Authenticating...' : 'Log In'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--text-secondary)' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
            <span style={{ padding: '0 10px', fontSize: '13px', fontWeight: '600' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
          </div>

          <div id="googleSignInButton" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: '700', color: 'var(--primary)', textDecoration: 'none' }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
