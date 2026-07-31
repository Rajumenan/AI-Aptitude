import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BookOpen, Trophy, Compass, Landmark, Briefcase, Play, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    averageAccuracy: 0,
    certificatesCount: 0
  });
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setStatsLoading(true);
      const data = await refreshUserProfile();
      if (data) {
        setStats(data.stats);
      }
      
      const sessionState = await api.get('/api/quiz/session-state');
      if (sessionState.success && sessionState.hasActiveSession) {
        setActiveSession(sessionState);
      } else {
        setActiveSession(null);
      }
    } catch (error) {
      console.log('Error pulling dashboard data:', error.message);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const startNewQuiz = async (level) => {
    try {
      setLoading(true);
      const res = await api.post('/api/quiz/start', { level });
      if (res.success) {
        navigate(`/quiz/${res.sessionId}`, {
          state: {
            level: res.level,
            firstQuestion: res.question
          }
        });
      }
    } catch (error) {
      alert(error.message || 'Server error starting quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleLevelPress = (levelName) => {
    if (activeSession) {
      const confirmResume = window.confirm(
        `You have an active ${activeSession.level} quiz in progress. Would you like to resume it? (Click Cancel to discard it and start a new ${levelName} quiz)`
      );
      if (confirmResume) {
        resumeActiveQuiz();
      } else {
        startNewQuiz(levelName);
      }
    } else {
      startNewQuiz(levelName);
    }
  };

  const resumeActiveQuiz = async () => {
    if (!activeSession) return;
    try {
      setLoading(true);
      const res = await api.get('/api/quiz/current-question');
      if (res.success) {
        navigate(`/quiz/${activeSession.sessionId}`, {
          state: {
            level: activeSession.level,
            resumeQuestion: res.question,
            resumeQuestionNumber: res.currentQuestionNumber
          }
        });
      }
    } catch (error) {
      alert(error.message || 'Could not resume session.');
    } finally {
      setLoading(false);
    }
  };

  const levels = [
    { name: 'Basic', description: 'Arithmetic, Percentages, Ratio, profit & loss, basic patterns', icon: BookOpen, color: '#3B82F6' },
    { name: 'Intermediate', description: 'Probability, clocks, calendars, syllogism, relations', icon: Compass, color: '#10B981' },
    { name: 'Advance', description: 'Puzzles, statements, assumptions, number theory, calculations', icon: Trophy, color: '#8B5CF6' },
    { name: 'Company Related', description: 'TCS NQT, Infosys, Wipro, Accenture placement tests', icon: Briefcase, color: '#F59E0B' },
    { name: 'Government Exams', description: 'UPSC CSAT, Bank, SSC, Railways, State PSC papers', icon: Landmark, color: '#EF4444' }
  ];

  return (
    <div className="animated" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>Hello,</span>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginTop: '2px' }}>{user?.username || 'Learner'} 👋</h1>
        </div>

        {/* Streak & Token Badges */}
        {!statsLoading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              backgroundColor: '#FF6B3515', border: '1px solid #FF6B3540', 
              padding: '8px 16px', borderRadius: '20px' 
            }}>
              <span style={{ fontSize: '16px' }}>🔥</span>
              <span style={{ color: '#FF6B35', fontWeight: '700', fontSize: '14px' }}>{stats.currentStreak || 0} Day Streak</span>
            </div>
            
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              backgroundColor: '#F59E0B15', border: '1px solid #F59E0B40', 
              padding: '8px 16px', borderRadius: '20px' 
            }}>
              <span style={{ fontSize: '16px' }}>🪙</span>
              <span style={{ color: '#F59E0B', fontWeight: '700', fontSize: '14px' }}>{stats.tokens || 0} Tokens</span>
            </div>
          </div>
        )}
      </div>

      {/* Resume Banner */}
      {activeSession && (
        <div 
          onClick={resumeActiveQuiz}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '16px 20px', 
            borderRadius: 'var(--radius)', 
            border: '1.5px solid var(--warning)', 
            backgroundColor: 'var(--warning-light)',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <AlertTriangle color="var(--warning)" size={24} />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Active Quiz in Progress</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Continue your {activeSession.level} Quiz (Question {activeSession.currentQuestionNumber}/10)
              </p>
            </div>
          </div>
          <button className="btn btn-primary" style={{ height: '36px', padding: '0 16px', fontSize: '13px', backgroundColor: 'var(--warning)', color: '#FFF' }}>
            Resume Quiz
          </button>
        </div>
      )}

      {/* Performance statistics */}
      <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: '0 4px 12px var(--shadow)' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Your General Performance</h2>
        {statsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div className="stats-grid">
            <div className="stats-card">
              <span className="stats-num">{stats.totalQuizzes}</span>
              <span className="stats-label">QUIZZES TAKEN</span>
            </div>
            <div className="stats-card">
              <span className="stats-num">{stats.averageScore}/10</span>
              <span className="stats-label">AVERAGE SCORE</span>
            </div>
            <div className="stats-card">
              <span className="stats-num">{stats.averageAccuracy}%</span>
              <span className="stats-label">TOTAL ACCURACY</span>
            </div>
            <div className="stats-card">
              <span className="stats-num">{stats.certificatesCount}</span>
              <span className="stats-label">AWARDS WON</span>
            </div>
          </div>
        )}
      </div>

      {/* Quiz Levels */}
      <div>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Choose Quiz Level</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite', margin: '0 auto 15px auto' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>AI Agent is assembling unique questions...</span>
          </div>
        ) : (
          <div className="levels-grid">
            {levels.map((lvl) => {
              const Icon = lvl.icon;
              return (
                <div 
                  key={lvl.name} 
                  className="level-card"
                  onClick={() => handleLevelPress(lvl.name)}
                >
                  <div className="level-icon-wrapper" style={{ backgroundColor: lvl.color + '15' }}>
                    <Icon size={24} color={lvl.color} />
                  </div>
                  <div className="level-text-wrapper">
                    <h3 className="level-title" style={{ color: 'var(--text)' }}>{lvl.name}</h3>
                    <p className="level-desc">{lvl.description}</p>
                  </div>
                  <button className="btn btn-outline" style={{ height: '36px', width: '36px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={14} fill="currentColor" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
