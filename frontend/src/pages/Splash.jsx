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
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 sm:p-10 max-w-xl w-full text-center shadow-xl flex flex-col items-center gap-4 sm:gap-6 animate-fadeIn">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-3xl sm:text-4xl shadow-sm">
          🎓
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--text)] leading-tight">
          AI Aptitude Quiz Platform
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-md">
          Master your quantitative, logical, and analytical skills with personalized questions generated in real-time by Google Gemini.
        </p>

        <div className="flex flex-col items-start gap-2.5 my-2 text-xs sm:text-sm text-[var(--text)] font-medium">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--primary)] shrink-0" />
            <span>5 adaptive difficulty levels</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--primary)] shrink-0" />
            <span>Step-by-step cognitive explanations</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--primary)] shrink-0" />
            <span>AI strengths & weaknesses analysis</span>
          </div>
        </div>

        <button 
          className="btn btn-primary w-full sm:w-auto h-12 px-8 rounded-xl font-bold gap-2 text-sm shadow-sm cursor-pointer" 
          onClick={() => navigate('/login')}
        >
          <span>Get Started</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Splash;
