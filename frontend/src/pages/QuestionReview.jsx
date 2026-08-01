import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';

const QuestionReview = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { level } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(0); // Q1 expanded by default

  const fetchReviewDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/results/details/${sessionId}`);
      if (res.success) {
        setReview(res.review);
      }
    } catch (error) {
      alert('Could not fetch quiz questions review.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewDetails();
  }, [sessionId]);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? -1 : index);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] justify-center items-center">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--border)] border-t-[var(--primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)]">Question Review 🔍</h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Evaluate your answers and learn from step-by-step logical explanations
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {review.map((item, index) => {
          const isExpanded = expandedIndex === index;
          const isCorrect = item.isCorrect;

          return (
            <div
              key={index}
              className={`bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs transition-all ${
                isCorrect ? 'border-l-4 border-l-[var(--success)]' : 'border-l-4 border-l-[var(--danger)]'
              }`}
            >
              {/* Card Header Trigger */}
              <div 
                onClick={() => toggleExpand(index)}
                className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[var(--primary)]">QUESTION {index + 1}</span>
                    <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary-light)] px-2 py-0.5 rounded uppercase truncate">
                      {item.topic}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-[var(--text)] truncate pr-2">
                    {item.questionText}
                  </p>
                </div>
                <div className="shrink-0 text-[var(--text-secondary)]">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Collapsed Body Panel */}
              {isExpanded && (
                <div className="p-4 sm:p-5 border-t border-[var(--border)] space-y-4">
                  {/* Full question */}
                  <div className="text-sm sm:text-base font-semibold leading-relaxed text-[var(--text)]">
                    {item.questionText}
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {Object.entries(item.options).map(([key, val]) => {
                      const isUserSelected = item.userAnswer === key;
                      const isCorrectAnswer = item.correctAnswer === key;

                      let rowStyle = 'bg-[var(--card)] border-[var(--border)]';
                      let keyColor = 'text-[var(--text-secondary)]';

                      if (isCorrectAnswer) {
                        rowStyle = 'bg-[var(--success-light)] border-[var(--success)]';
                        keyColor = 'text-[var(--success)]';
                      } else if (isUserSelected && !isCorrect) {
                        rowStyle = 'bg-[var(--danger-light)] border-[var(--danger)]';
                        keyColor = 'text-[var(--danger)]';
                      }

                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm ${rowStyle}`}
                        >
                          <span className={`font-bold ${keyColor}`}>({key})</span>
                          <span className="text-[var(--text)] flex-1">{val}</span>
                          {isCorrectAnswer && <CheckCircle size={16} className="text-[var(--success)] shrink-0" />}
                          {isUserSelected && !isCorrect && <XCircle size={16} className="text-[var(--danger)] shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Meta comparisons */}
                  <div className="flex flex-wrap gap-6 pt-1 text-xs">
                    <div>
                      <span className="block text-[var(--text-secondary)]">Your Answer</span>
                      <strong className={`font-bold ${isCorrect ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                        {item.userAnswer ? `Option ${item.userAnswer}` : 'Skipped'}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[var(--text-secondary)]">Correct Answer</span>
                      <strong className="font-bold text-[var(--success)]">
                        Option {item.correctAnswer}
                      </strong>
                    </div>
                  </div>

                  {/* Explanation card */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-1">
                    <h4 className="text-xs font-bold text-[var(--text)]">AI Explanation:</h4>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button 
        className="btn btn-outline w-full h-12 rounded-xl text-sm font-bold mt-4"
        onClick={() => navigate(`/results/${sessionId}`, { state: { level } })}
      >
        Back to Scorecard
      </button>
    </div>
  );
};

export default QuestionReview;
