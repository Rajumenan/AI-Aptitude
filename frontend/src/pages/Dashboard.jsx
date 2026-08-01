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
    <div className="w-full space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Hello,</span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mt-1 text-[var(--text)]">
            {user?.username || 'Learner'} 👋
          </h1>
        </div>

        {/* Streak & Token Badges */}
        {!statsLoading && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-[#FF6B3515] border border-[#FF6B3540] px-3 sm:px-4 py-2 rounded-full">
              <span className="text-base sm:text-lg">🔥</span>
              <span className="color-[#FF6B35] font-bold text-xs sm:text-sm text-[#FF6B35]">
                {stats.currentStreak || 0} Day Streak
              </span>
            </div>
            
            <div className="flex items-center gap-2 bg-[#F59E0B15] border border-[#F59E0B40] px-3 sm:px-4 py-2 rounded-full">
              <span className="text-base sm:text-lg">🪙</span>
              <span className="font-bold text-xs sm:text-sm text-[#F59E0B]">
                {stats.tokens || 0} Tokens
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Resume Banner */}
      {activeSession && (
        <div 
          onClick={resumeActiveQuiz}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border-2 border-[var(--warning)] bg-[var(--warning-light)] cursor-pointer transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <AlertTriangle className="text-[var(--warning)] shrink-0" size={24} />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--text)]">Active Quiz in Progress</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                Continue your {activeSession.level} Quiz (Question {activeSession.currentQuestionNumber}/10)
              </p>
            </div>
          </div>
          <button className="btn bg-[var(--warning)] text-white hover:opacity-90 w-full sm:w-auto h-9 px-4 text-xs sm:text-sm rounded-xl font-bold shrink-0">
            Resume Quiz
          </button>
        </div>
      )}

      {/* Performance statistics */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-4 text-[var(--text)]">Your General Performance</h2>
        {statsLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-4 border-[var(--border)] border-t-[var(--primary)] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="stats-card w-full">
              <span className="stats-num text-xl sm:text-2xl lg:text-3xl">{stats.totalQuizzes}</span>
              <span className="stats-label text-[10px] sm:text-xs">QUIZZES TAKEN</span>
            </div>
            <div className="stats-card w-full">
              <span className="stats-num text-xl sm:text-2xl lg:text-3xl">{stats.averageScore}/10</span>
              <span className="stats-label text-[10px] sm:text-xs">AVERAGE SCORE</span>
            </div>
            <div className="stats-card w-full">
              <span className="stats-num text-xl sm:text-2xl lg:text-3xl">{stats.averageAccuracy}%</span>
              <span className="stats-label text-[10px] sm:text-xs">TOTAL ACCURACY</span>
            </div>
            <div className="stats-card w-full">
              <span className="stats-num text-xl sm:text-2xl lg:text-3xl">{stats.certificatesCount}</span>
              <span className="stats-label text-[10px] sm:text-xs">AWARDS WON</span>
            </div>
          </div>
        )}
      </div>

      {/* Quiz Levels */}
      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 text-[var(--text)]">Choose Quiz Level</h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 rounded-full border-4 border-[var(--border)] border-t-[var(--primary)] animate-spin mx-auto mb-4" />
            <span className="text-sm text-[var(--text-secondary)]">AI Agent is assembling unique questions...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {levels.map((lvl) => {
              const Icon = lvl.icon;
              return (
                <div 
                  key={lvl.name} 
                  className="level-card group"
                  onClick={() => handleLevelPress(lvl.name)}
                >
                  <div className="level-icon-wrapper shrink-0" style={{ backgroundColor: lvl.color + '15' }}>
                    <Icon size={24} color={lvl.color} />
                  </div>
                  <div className="level-text-wrapper min-w-0">
                    <h3 className="level-title truncate text-base sm:text-lg" style={{ color: 'var(--text)' }}>{lvl.name}</h3>
                    <p className="level-desc line-clamp-2 text-xs sm:text-sm">{lvl.description}</p>
                  </div>
                  <button className="btn btn-outline shrink-0 h-9 w-9 p-0 rounded-full flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
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
