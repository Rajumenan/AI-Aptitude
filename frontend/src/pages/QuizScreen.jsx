import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Clock, AlertCircle } from 'lucide-react';

const QuizScreen = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { level, firstQuestion, resumeQuestion, resumeQuestionNumber } = location.state || {};

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

  const handleNextClick = () => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
    }
    // Perform manual skip of delay
    // We already have the updated state from previous submit, but to proceed immediately:
    // We fetch details or handle it if we cache the response.
    // In our setup, auto-advance is standard, but clicking Next immediately advances.
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
      <div style={{ display: 'flex', minHeight: '60vh', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // Progress Bar width percentage
  const progressPercent = `${((questionNumber - 1) / 10) * 100}%`;

  return (
    <div style={styles.container}>
      {/* Header Panel */}
      <div style={styles.quizHeader}>
        <div>
          <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '2px', color: 'var(--primary)' }}>
            {level.toUpperCase()} CHALLENGE
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginTop: '2px' }}>Question {questionNumber} of 10</h2>
        </div>

        {/* Timer Box */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          padding: '6px 12px', 
          borderRadius: '15px', 
          border: '1.5px solid var(--border)',
          backgroundColor: 'var(--card)',
          fontWeight: '700',
          fontSize: '13px',
          color: timeLeft <= 10 ? 'var(--danger)' : 'var(--text)'
        }}>
          <Clock size={16} color={timeLeft <= 10 ? 'var(--danger)' : 'var(--warning)'} />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Progress Bar container */}
      <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--border)', borderRadius: '3px', marginBottom: '24px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: progressPercent, backgroundColor: 'var(--primary)', transition: 'width 0.3s ease-out' }} />
      </div>

      {/* Question Card */}
      <div style={{ 
        backgroundColor: 'var(--card)', 
        border: '1px solid var(--border)', 
        borderRadius: 'var(--radius)', 
        padding: '24px', 
        marginBottom: '24px',
        fontSize: '17px',
        fontWeight: '600',
        lineHeight: '1.6',
        boxShadow: '0 4px 10px var(--shadow)'
      }}>
        {currentQuestion.questionText}
      </div>

      {/* Choice Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Object.entries(currentQuestion.options).map(([key, val]) => {
          const isSelected = selectedOption === key;
          
          let cardBg = 'var(--card)';
          let cardBorder = 'var(--border)';
          
          if (isSelected) {
            cardBg = 'var(--primary-light)';
            cardBorder = 'var(--primary)';
          }

          return (
            <div
              key={key}
              onClick={() => !isSubmitted && setSelectedOption(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '14px 20px',
                backgroundColor: cardBg,
                border: `1.5px solid ${cardBorder}`,
                borderRadius: 'var(--radius)',
                cursor: isSubmitted ? 'default' : 'pointer',
                transition: 'var(--transition)'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isSelected ? 'var(--primary)' : 'var(--border)',
                color: isSelected ? '#FFF' : 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '14px',
                flexShrink: 0
              }}>
                {key}
              </div>
              <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>{val}</span>
            </div>
          );
        })}
      </div>

      {/* Answer Feedback Toast */}
      {feedback && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px',
          borderRadius: 'var(--radius)',
          border: `1.5px solid ${feedback === 'Correct' ? 'var(--success)' : 'var(--danger)'}`,
          backgroundColor: feedback === 'Correct' ? 'var(--success-light)' : 'var(--danger-light)',
          color: feedback === 'Correct' ? 'var(--success)' : 'var(--danger)',
          fontWeight: '700',
          fontSize: '14px',
          margin: '20px 0'
        }}>
          <AlertCircle size={18} />
          <span>{feedback} Answer</span>
        </div>
      )}

      {/* Action Footer */}
      <div style={{ marginTop: '24px' }}>
        {!isSubmitted ? (
          <button
            onClick={() => handleSubmitAnswer()}
            className="btn btn-primary btn-block"
            disabled={!selectedOption || loading}
          >
            {loading ? 'Submitting...' : 'Submit Answer'}
          </button>
        ) : (
          <button
            onClick={() => advance({ isQuizCompleted: questionNumber === 10 })} // Fallback auto click logic
            className="btn btn-primary btn-block"
          >
            Next Question
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    paddingVertical: '10px',
  },
  quizHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  }
};

export default QuizScreen;
