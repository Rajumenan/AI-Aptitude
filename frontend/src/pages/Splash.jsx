import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight } from 'lucide-react';

const Splash = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        navigate('/dashboard');
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <div style={styles.container}>
      <div className="animated" style={styles.card}>
        <div style={styles.logoBadge}>🎓</div>
        <h1 style={styles.title}>AI Aptitude Quiz Platform</h1>
        <p style={styles.subtitle}>
          Master your quantitative, logical, and analytical skills with personalized questions generated in real-time by Google Gemini.
        </p>

        <div style={styles.featuresList}>
          <div style={styles.featureItem}>
            <Sparkles size={16} color="var(--primary)" />
            <span>5 adaptive difficulty levels</span>
          </div>
          <div style={styles.featureItem}>
            <Sparkles size={16} color="var(--primary)" />
            <span>Step-by-step cognitive explanations</span>
          </div>
          <div style={styles.featureItem}>
            <Sparkles size={16} color="var(--primary)" />
            <span>AI strengths & weaknesses analysis</span>
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/login')}
          style={{ gap: '10px', marginTop: '10px' }}
        >
          <span>Get Started</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '50px 40px',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 10px 30px var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  logoBadge: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    boxShadow: '0 4px 12px var(--shadow)',
  },
  title: {
    fontSize: '36px',
    fontWeight: '800',
    color: 'var(--text)',
    lineHeight: '1.2',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '15px',
    lineHeight: '1.7',
    maxWidth: '500px',
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '12px',
    margin: '10px 0 20px 0',
    alignSelf: 'center',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text)',
  }
};

export default Splash;
