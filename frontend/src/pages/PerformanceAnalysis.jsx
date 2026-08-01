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
      <div className="flex min-h-[60vh] flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--border)] border-t-[var(--primary)] animate-spin" />
        <span className="text-xs sm:text-sm text-[var(--text-secondary)]">Compiling AI metrics analysis...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)]">AI Performance Analysis 🤖</h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Deep-dive feedback regarding your conceptual strengths, speed, and calculations
        </p>
      </div>

      {/* Main Feedback Box */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-purple-400 shrink-0" />
          <h3 className="text-sm sm:text-base font-bold text-[var(--text)]">AI Cognitive Feedback</h3>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
          {analysis.difficultyAnalysis}
        </p>
      </div>

      {/* Split Grid for Strengths vs Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Strong Topics */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[var(--success)] shrink-0" />
            <h4 className="text-sm font-bold text-[var(--text)]">Strong Topics</h4>
          </div>
          {analysis.strongTopics.length === 0 ? (
            <span className="text-xs text-[var(--text-secondary)] block">None identified yet.</span>
          ) : (
            <div className="space-y-2">
              {analysis.strongTopics.map((topic, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-[var(--success-light)] text-[var(--success)] font-bold text-xs text-center">
                  {topic}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weak Topics */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-[var(--danger)] shrink-0" />
            <h4 className="text-sm font-bold text-[var(--text)]">Need Work</h4>
          </div>
          {analysis.weakTopics.length === 0 ? (
            <span className="text-xs text-[var(--text-secondary)] block">None identified yet.</span>
          ) : (
            <div className="space-y-2">
              {analysis.weakTopics.map((topic, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-[var(--danger-light)] text-[var(--danger)] font-bold text-xs text-center">
                  {topic}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Learning Suggestions */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb size={18} className="text-[var(--warning)] shrink-0" />
          <h3 className="text-sm sm:text-base font-bold text-[var(--text)]">Personalized Suggestions</h3>
        </div>
        <div className="space-y-3 pt-1">
          {analysis.learningSuggestions.map((suggestion, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {suggestion}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Path Recommender Banner */}
      <div className="p-5 rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary-light)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-extrabold tracking-widest text-[var(--primary)] block uppercase">RECOMMENDED PATH</span>
          <h3 className="text-sm sm:text-base font-bold mt-0.5 text-[var(--text)]">
            Practice {analysis.recommendedNextLevel} Level
          </h3>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="btn btn-primary h-10 px-4 text-xs sm:text-sm gap-2 rounded-xl shrink-0 w-full sm:w-auto"
        >
          <span>Start Practice</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <button 
        className="btn btn-outline w-full h-12 rounded-xl text-sm font-bold"
        onClick={() => navigate(`/results/${sessionId}`, { state: { level } })}
      >
        Back to Scorecard
      </button>
    </div>
  );
};

export default PerformanceAnalysis;
