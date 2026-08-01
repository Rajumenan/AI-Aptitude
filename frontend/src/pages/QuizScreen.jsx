import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Clock, AlertCircle } from 'lucide-react';

const QuizScreen = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { level = 'General', firstQuestion, resumeQuestion, resumeQuestionNumber } = location.state || {};

  const [questionNumber, setQuestionNumber] = useState(resumeQuestionNumber || 1);
  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion || resumeQuestion || null);
  const [selectedOption, setSelectedOption] = useState(null); // 'A', 'B', 'C', 'D' or null
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'Correct' or 'Incorrect'
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);

  const timerRef = useRef(null);
  const autoAdvanceRef = useRef(null);

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
        answer: answerToSubmit 
      });

      if (res.success) {
        setFeedback(res.isCorrect ? 'Correct' : 'Incorrect');
        setLoading(false);

        // Auto-advance after 1.5 seconds
        autoAdvanceRef.current = setTimeout(() => {
          advance(res);
        }, 1500);
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
      setFeedback(null);
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

        {/* Timer Box */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-1.5 bg-[var(--card)] font-bold text-xs sm:text-sm shrink-0 ${
          timeLeft <= 10 ? 'border-[var(--danger)] text-[var(--danger)]' : 'border-[var(--border)] text-[var(--text)]'
        }`}>
          <Clock size={16} className={timeLeft <= 10 ? 'text-[var(--danger)]' : 'text-[var(--warning)]'} />
          <span>{timeLeft}s</span>
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

      {/* Answer Feedback Toast */}
      {feedback && (
        <div className={`flex items-center justify-center gap-2 p-3 rounded-xl border-1.5 font-bold text-xs sm:text-sm text-center ${
          feedback === 'Correct' 
            ? 'border-[var(--success)] bg-[var(--success-light)] text-[var(--success)]' 
            : 'border-[var(--danger)] bg-[var(--danger-light)] text-[var(--danger)]'
        }`}>
          <AlertCircle size={18} />
          <span>{feedback} Answer</span>
        </div>
      )}

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
    </div>
  );
};

export default QuizScreen;
