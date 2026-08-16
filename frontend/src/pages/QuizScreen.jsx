import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Clock, AlertCircle, Lightbulb, X, Coins, Sparkles } from 'lucide-react';

// Hint token costs: 30 tokens = 1 hint, 60 tokens = 2 hints, 80 tokens = 3 hints
const HINT_COSTS = { 1: 30, 2: 60, 3: 80 };

const QuizScreen = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { level = 'General', firstQuestion, resumeQuestion, resumeQuestionNumber } = location.state || {};

  const [questionNumber, setQuestionNumber] = useState(resumeQuestionNumber || 1);
  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion || resumeQuestion || null);
  const [selectedOption, setSelectedOption] = useState(null); // 'A', 'B', 'C', 'D' or null
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);

  // Hint & Token state
  const [tokenBalance, setTokenBalance] = useState(null);
  const [hintsUsedThisQuestion, setHintsUsedThisQuestion] = useState(0);
  const [hintModalVisible, setHintModalVisible] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintHistory, setHintHistory] = useState([]);
  const [hintError, setHintError] = useState(null);

  const timerRef = useRef(null);
  const autoAdvanceRef = useRef(null);

  // Fetch token balance on mount
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const data = await api.get('/api/profile/me');
        setTokenBalance(data?.stats?.tokens ?? 0);
      } catch (_) {}
    };
    loadTokens();
  }, []);

  // Fetch current question if not loaded on startup
  useEffect(() => {
    const fetchQuestion = async () => {
      if (!currentQuestion) {
        try {
          const res = await api.get('/api/quiz/current-question');
          if (res.success) {
            setQuestionNumber(res.currentQuestionNumber);
            setCurrentQuestion(res.question);
          }
        } catch (error) {
          alert('Could not fetch quiz question.');
          navigate('/dashboard');
        }
      }
    };
    fetchQuestion();
  }, [sessionId]);

  // Set up timer on question transition
  useEffect(() => {
    startTimer();
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(autoAdvanceRef.current);
    };
  }, [questionNumber]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(60);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeOut = () => {
    alert('Time ran out! Moving to the next question.');
    handleSubmitAnswer(null);
  };

  const handleSubmitAnswer = async (forcedAnswer = null) => {
    const answerToSubmit = forcedAnswer !== null ? forcedAnswer : selectedOption;

    clearInterval(timerRef.current);
    setIsSubmitted(true);
    setLoading(true);

    try {
      const res = await api.post('/api/quiz/submit-answer', { 
        answer: answerToSubmit,
        questionIndex: questionNumber - 1
      });

      if (res.success) {
        setLoading(false);
        if (res.isQuizCompleted && res.streakInfo?.totalTokens !== undefined) {
          setTokenBalance(res.streakInfo.totalTokens);
        }
        advance(res);
      }
    } catch (error) {
      setLoading(false);
      alert(error.message || 'Error submitting answer.');
      startTimer();
      setIsSubmitted(false);
    }
  };

  const advance = (res) => {
    if (res.isQuizCompleted) {
      navigate(`/results/${sessionId}`, { state: { level } });
    } else {
      setQuestionNumber(res.nextQuestionNumber);
      setCurrentQuestion(res.question);
      setSelectedOption(null);
      setIsSubmitted(false);
      // Reset hints for new question
      setHintsUsedThisQuestion(0);
      setHintHistory([]);
      setHintError(null);
    }
  };

  // ── Hint Logic ───────────────────────────────────────────────
  const nextHintNumber = hintsUsedThisQuestion + 1;
  const nextHintCost = HINT_COSTS[nextHintNumber] || null;
  const canUseHint = !isSubmitted && nextHintNumber <= 3 && nextHintCost !== null;

  const handleRequestHint = async () => {
    if (!canUseHint) return;
    if (tokenBalance === null || tokenBalance < nextHintCost) {
      alert(
        `Not Enough Tokens!\n\nHint #${nextHintNumber} costs ${nextHintCost} tokens.\nYou currently have ${tokenBalance ?? 0} tokens.\n\nEarn daily tokens by completing quizzes every day (+2 tokens/day, +10 on Sunday)!`
      );
      return;
    }

    setHintLoading(true);
    setHintError(null);
    setHintModalVisible(true);

    try {
      const res = await api.post('/api/quiz/hint', { hintNumber: nextHintNumber });
      if (res.success) {
        const newHint = { number: nextHintNumber, text: res.hint, cost: res.tokensSpent };
        setHintHistory((prev) => [...prev, newHint]);
        setHintsUsedThisQuestion(nextHintNumber);
        if (res.remainingTokens !== undefined) {
          setTokenBalance(res.remainingTokens);
        }
      }
    } catch (error) {
      setHintError(error.message || 'Could not fetch hint.');
    } finally {
      setHintLoading(false);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="flex min-h-[60vh] justify-center items-center">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--border)] border-t-[var(--primary)] animate-spin" />
      </div>
    );
  }

  // Progress Bar width percentage
  const progressPercent = `${((questionNumber - 1) / 10) * 100}%`;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 animate-fadeIn">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-widest text-[var(--primary)] block uppercase">
            {level} CHALLENGE
          </span>
          <h2 className="text-lg sm:text-xl font-black text-[var(--text)] mt-0.5">Question {questionNumber} of 10</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Token Balance Indicator */}
          {tokenBalance !== null && (
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#F59E0B40] bg-[#F59E0B15] font-bold text-xs sm:text-sm text-[#F59E0B]"
              title="Daily Reward Tokens available for hints"
            >
              <span>🪙</span>
              <span>{tokenBalance}</span>
            </div>
          )}

          {/* Timer Box */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-1.5 bg-[var(--card)] font-bold text-xs sm:text-sm shrink-0 ${
            timeLeft <= 10 ? 'border-[var(--danger)] text-[var(--danger)]' : 'border-[var(--border)] text-[var(--text)]'
          }`}>
            <Clock size={16} className={timeLeft <= 10 ? 'text-[var(--danger)]' : 'text-[var(--warning)]'} />
            <span>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Progress Bar container */}
      <div className="h-2 w-full bg-[var(--border)] rounded-full overflow-hidden">
        <div className="h-full bg-[var(--primary)] transition-all duration-300 ease-out" style={{ width: progressPercent }} />
      </div>

      {/* Question Card */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-sm text-sm sm:text-base font-semibold leading-relaxed text-[var(--text)]">
        {currentQuestion.questionText}
      </div>

      {/* Choice Options */}
      <div className="space-y-2.5 sm:space-y-3">
        {Object.entries(currentQuestion.options).map(([key, val]) => {
          const isSelected = selectedOption === key;

          return (
            <div
              key={key}
              onClick={() => !isSubmitted && setSelectedOption(key)}
              className={`flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border-1.5 transition-all cursor-pointer select-none ${
                isSelected 
                  ? 'bg-[var(--primary-light)] border-[var(--primary)] shadow-xs' 
                  : 'bg-[var(--card)] border-[var(--border)] hover:border-[var(--primary)]'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs sm:text-sm shrink-0 transition-colors ${
                isSelected 
                  ? 'bg-[var(--primary)] text-white' 
                  : 'bg-[var(--border)] text-[var(--text)]'
              }`}>
                {key}
              </div>
              <span className="text-xs sm:text-sm font-medium text-[var(--text)] leading-snug">{val}</span>
            </div>
          );
        })}
      </div>

      {/* Hint Actions Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {hintHistory.length > 0 && (
          <button
            onClick={() => setHintModalVisible(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            <Lightbulb size={14} className="text-[#8B5CF6]" />
            <span>View Unlocked Hints ({hintHistory.length})</span>
          </button>
        )}

        <div className="ml-auto">
          {canUseHint ? (
            <button
              onClick={handleRequestHint}
              disabled={tokenBalance !== null && tokenBalance < nextHintCost}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#8B5CF640] bg-[#8B5CF615] text-xs sm:text-sm font-bold text-[#8B5CF6] transition-all hover:bg-[#8B5CF625] ${
                tokenBalance !== null && tokenBalance < nextHintCost ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <Lightbulb size={16} />
              <span>Get Hint #{nextHintNumber}</span>
              <span className="flex items-center gap-1 bg-[#8B5CF625] px-2 py-0.5 rounded-full text-xs">
                🪙 {nextHintCost} tokens
              </span>
            </button>
          ) : hintsUsedThisQuestion >= 3 ? (
            <span className="text-xs text-[var(--text-secondary)] font-medium">Max 3 hints used for this question</span>
          ) : null}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2">
        {!isSubmitted ? (
          <button
            onClick={() => handleSubmitAnswer()}
            className="btn btn-primary btn-block w-full h-12 rounded-xl text-sm font-bold shadow-sm"
            disabled={!selectedOption || loading}
          >
            {loading ? 'Submitting...' : 'Submit Answer'}
          </button>
        ) : (
          <button
            onClick={() => advance({ isQuizCompleted: questionNumber === 10 })}
            className="btn btn-primary btn-block w-full h-12 rounded-xl text-sm font-bold shadow-sm"
          >
            Next Question
          </button>
        )}
      </div>

      {/* Hints Modal */}
      {hintModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#8B5CF620] flex items-center justify-center">
                  <Lightbulb size={18} className="text-[#8B5CF6]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--text)]">Question Hints</h3>
                  <span className="text-xs text-[var(--text-secondary)]">Question {questionNumber} of 10</span>
                </div>
              </div>
              <button 
                onClick={() => setHintModalVisible(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--border)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {hintLoading && (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <div className="w-8 h-8 rounded-full border-3 border-[var(--border)] border-t-[#8B5CF6] animate-spin" />
                  <span className="text-xs text-[var(--text-secondary)] font-medium">Generating AI hint...</span>
                </div>
              )}

              {hintError && (
                <div className="p-3 bg-[var(--danger-light)] border border-[var(--danger)] rounded-xl text-xs text-[var(--danger)]">
                  {hintError}
                </div>
              )}

              {hintHistory.map((h) => (
                <div key={h.number} className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#8B5CF6]">Hint #{h.number}</span>
                    <span className="text-[11px] text-[var(--text-secondary)]">Spent 🪙 {h.cost} tokens</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text)] leading-relaxed">{h.text}</p>
                </div>
              ))}

              {hintHistory.length === 0 && !hintLoading && !hintError && (
                <p className="text-xs text-[var(--text-secondary)] text-center py-4">No hints requested yet for this question.</p>
              )}
            </div>

            <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Token Balance: <strong className="text-[#F59E0B]">🪙 {tokenBalance ?? 0}</strong></span>
              <button
                onClick={() => setHintModalVisible(false)}
                className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white font-bold text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuizScreen;
