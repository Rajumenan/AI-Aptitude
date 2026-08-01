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
      <div className="flex min-h-[60vh] flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--border)] border-t-[var(--primary)] animate-spin" />
        <span className="text-xs sm:text-sm text-[var(--text-secondary)]">Assembling scorecard & AI analysis report...</span>
      </div>
    );
  }

  const { scorecard, certificateEarned } = result;

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Badge */}
      <div className="text-center space-y-1">
        <span className="text-[10px] font-black tracking-widest text-[var(--primary)] block uppercase">
          {scorecard.performanceRating}
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)]">Quiz Complete! 🏁</h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">You completed the {level || scorecard.level} Level Quiz</p>
      </div>

      {/* Circle Score Container */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 shadow-sm">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 sm:border-5 border-[var(--primary)] flex flex-col items-center justify-center shrink-0">
          <span className="text-2xl sm:text-3xl font-black text-[var(--text)]">{scorecard.score}</span>
          <span className="text-xs font-bold text-[var(--text-secondary)] -mt-1">/10</span>
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-black text-[var(--primary)]">{scorecard.percentage}% Accuracy</h2>
          <span className="text-xs text-[var(--text-secondary)]">Overall correctness score</span>
        </div>
      </div>

      {/* Certificate Unlocked Banner */}
      {certificateEarned && (
        <div className="flex items-start gap-3.5 p-4 rounded-xl border border-[#F59E0B] bg-[#FFFBF0] text-gray-900">
          <Award size={28} className="text-[#F59E0B] shrink-0 mt-0.5" fill="#F59E0B" />
          <div>
            <h3 className="text-sm font-black text-gray-900">Certificate Unlocked! 🏆</h3>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
              Congratulations! You scored &ge; 70% in this session. Your Certificate of Achievement has been unlocked in your profile.
            </p>
          </div>
        </div>
      )}

      {/* Stats Table List */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 text-xs sm:text-sm">
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-secondary)] font-medium">Correct Answers</span>
          <span className="font-bold text-[var(--success)]">{scorecard.correctAnswers}</span>
        </div>
        <div className="border-t border-[var(--border)] pt-3 flex justify-between items-center">
          <span className="text-[var(--text-secondary)] font-medium">Incorrect Answers</span>
          <span className="font-bold text-[var(--danger)]">{scorecard.incorrectAnswers}</span>
        </div>
        <div className="border-t border-[var(--border)] pt-3 flex justify-between items-center">
          <span className="text-[var(--text-secondary)] font-medium">Time Taken</span>
          <div className="inline-flex items-center gap-1.5 font-bold text-[var(--text)]">
            <Clock size={14} className="text-[var(--text-secondary)]" />
            <span>{formatTime(scorecard.timeTaken)}</span>
          </div>
        </div>
      </div>

      {/* Navigation Triggers */}
      <div className="space-y-3 pt-2">
        {/* AI Performance Analysis */}
        <button 
          className="btn btn-primary w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          onClick={() => navigate(`/analysis/${sessionId}`, { state: { level } })}
        >
          <Sparkles size={16} />
          <span>AI Performance Analysis</span>
        </button>

        {/* Question Review */}
        <button 
          className="btn btn-outline w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          onClick={() => navigate(`/review/${sessionId}`, { state: { level } })}
        >
          <FileText size={16} />
          <span>Review Questions</span>
        </button>

        {/* Back to Dashboard */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full py-3 text-sm font-bold text-[var(--primary)] hover:underline text-center cursor-pointer block"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;
