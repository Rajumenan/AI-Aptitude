import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Sparkles, CheckCircle2, AlertTriangle, Lightbulb, ArrowRight } from 'lucide-react';

const PerformanceAnalysis = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { level } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);

  const fetchAnalysisReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/results/details/${sessionId}`);
      if (res.success) {
        setAnalysis(res.analysis);
      }
    } catch (error) {
      alert('Could not fetch AI performance analysis.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisReport();
  }, [sessionId]);

  if (loading || !analysis) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Compiling AI metrics analysis...</span>
      </div>
    );
  }

  return (
    <div className="animated" style={styles.container}>
      <div style={styles.header}>
        <h1 style={{ fontSize: '28px', fontWeight: '800' }}>AI Performance Analysis 🤖</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Deep-dive feedback regarding your conceptual strengths, speed, and calculations
        </p>
      </div>

      {/* Main Feedback Box */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <Sparkles size={18} color="#A78BFA" />
          <h3 style={{ fontSize: '15px', fontWeight: '800' }}>AI Cognitive Feedback</h3>
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
          {analysis.difficultyAnalysis}
        </p>
      </div>

      {/* Split Row for Strengths vs Weaknesses */}
      <div style={styles.splitRow}>
        {/* Strong Topics */}
        <div style={styles.splitCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <CheckCircle2 size={16} color="var(--success)" />
            <h4 style={{ fontSize: '14px', fontWeight: '800' }}>Strong Topics</h4>
          </div>
          {analysis.strongTopics.length === 0 ? (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>None identified yet.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {analysis.strongTopics.map((topic, idx) => (
                <div key={idx} style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--success-light)', color: 'var(--success)', fontWeight: '700', fontSize: '12px', textAlign: 'center' }}>
                  {topic}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weak Topics */}
        <div style={styles.splitCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <AlertTriangle size={16} color="var(--danger)" />
            <h4 style={{ fontSize: '14px', fontWeight: '800' }}>Need Work</h4>
          </div>
          {analysis.weakTopics.length === 0 ? (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>None identified yet.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {analysis.weakTopics.map((topic, idx) => (
                <div key={idx} style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', fontWeight: '700', fontSize: '12px', textAlign: 'center' }}>
                  {topic}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Learning Suggestions */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <Lightbulb size={18} color="var(--warning)" />
          <h3 style={{ fontSize: '15px', fontWeight: '800' }}>Personalized Suggestions</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
          {analysis.learningSuggestions.map((suggestion, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '11px',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                {idx + 1}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {suggestion}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Path Recommender Banner */}
      <div style={{
        padding: '20px',
        borderRadius: 'var(--radius-lg)',
        border: '1.5px solid rgba(98, 0, 238, 0.2)',
        backgroundColor: 'var(--primary-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '15px',
        flexWrap: 'wrap',
        marginBottom: '20px'
      }}>
        <div>
          <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1.5px', color: 'var(--primary)' }}>RECOMMENDED PATH</span>
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginTop: '2px', color: 'var(--text)' }}>
            Practice {analysis.recommendedNextLevel} Level
          </h3>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="btn btn-primary"
          style={{ height: '40px', padding: '0 16px', fontSize: '13px', gap: '6px' }}
        >
          <span>Start Practice</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <button 
        className="btn btn-outline"
        onClick={() => navigate(`/results/${sessionId}`, { state: { level } })}
        style={{ width: '100%' }}
      >
        Back to Scorecard
      </button>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '850px',
    margin: '0 auto',
    paddingVertical: '15px',
  },
  header: {
    marginBottom: '24px',
  },
  card: {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    boxShadow: '0 4px 12px var(--shadow)',
    marginBottom: '20px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  splitRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  splitCard: {
    flex: 1,
    minWidth: '260px',
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 24px',
    boxShadow: '0 4px 12px var(--shadow)',
  }
};

export default PerformanceAnalysis;
