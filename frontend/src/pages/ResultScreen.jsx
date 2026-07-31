import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Sparkles, Clock, ChevronRight, Award, BarChart, FileText } from 'lucide-react';

const ResultScreen = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { level } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  const fetchScorecard = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/results/details/${sessionId}`);
      if (res.success) {
        setResult(res);
      }
    } catch (error) {
      alert('Could not fetch quiz results scorecard.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecard();
  }, [sessionId]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (loading || !result) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Assembling scorecard & AI analysis report...</span>
      </div>
    );
  }

  const { scorecard, certificateEarned } = result;

  return (
    <div className="animated" style={styles.container}>
      {/* Header Badge */}
      <div style={styles.header}>
        <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '2.5px', color: 'var(--primary)', display: 'block', marginBottom: '6px' }}>
          {scorecard.performanceRating.toUpperCase()}
        </span>
        <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Quiz Complete! 🏁</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>You completed the {level || scorecard.level} Level Quiz</p>
      </div>

      {/* Circle Score Container */}
      <div style={styles.scoreRow}>
        <div style={styles.circle}>
          <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text)' }}>{scorecard.score}</span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginTop: '-4px' }}>/10</span>
        </div>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>{scorecard.percentage}% Accuracy</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Overall correctness score</span>
        </div>
      </div>

      {/* Certificate Unlocked Banner */}
      {certificateEarned && (
        <div style={styles.certBanner}>
          <Award size={28} color="#F59E0B" fill="#F59E0B" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '800' }}>Certificate Unlocked! 🏆</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
              Congratulations! You scored &ge; 70% in this session. Your Certificate of Achievement has been unlocked in your profile.
            </p>
          </div>
        </div>
      )}

      {/* Stats Table List */}
      <div style={styles.statsCard}>
        <div style={styles.statsRow}>
          <span style={styles.statsLabel}>Correct Answers</span>
          <span style={{ fontWeight: '700', color: 'var(--success)' }}>{scorecard.correctAnswers}</span>
        </div>
        <div style={styles.line} />
        <div style={styles.statsRow}>
          <span style={styles.statsLabel}>Incorrect Answers</span>
          <span style={{ fontWeight: '700', color: 'var(--danger)' }}>{scorecard.incorrectAnswers}</span>
        </div>
        <div style={styles.line} />
        <div style={styles.statsRow}>
          <span style={styles.statsLabel}>Time Taken</span>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
            <Clock size={14} color="var(--text-secondary)" />
            <span>{formatTime(scorecard.timeTaken)}</span>
          </div>
        </div>
      </div>

      {/* Navigation Triggers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* AI Performance Analysis */}
        <button 
          className="btn btn-primary"
          onClick={() => navigate(`/analysis/${sessionId}`, { state: { level } })}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
        >
          <Sparkles size={16} />
          <span>AI Performance Analysis</span>
        </button>

        {/* Question Review */}
        <button 
          className="btn btn-outline"
          onClick={() => navigate(`/review/${sessionId}`, { state: { level } })}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
        >
          <FileText size={16} />
          <span>Review Questions</span>
        </button>

        {/* Back to Dashboard */}
        <button 
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            padding: '12px',
            alignSelf: 'center',
            marginTop: '10px'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    paddingVertical: '15px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  scoreRow: {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '20px',
    boxShadow: '0 4px 12px var(--shadow)',
  },
  circle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '5px solid var(--primary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certBanner: {
    display: 'flex',
    gap: '15px',
    padding: '16px 20px',
    borderRadius: 'var(--radius)',
    border: '1.5px solid #F59E0B',
    backgroundColor: '#FFFBF0',
    marginBottom: '20px',
  },
  statsCard: {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 24px',
    marginBottom: '24px',
    boxShadow: '0 4px 10px var(--shadow)',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
  },
  statsLabel: {
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  line: {
    height: '1px',
    backgroundColor: 'var(--border)',
    margin: '12px 0',
  }
};

export default ResultScreen;
