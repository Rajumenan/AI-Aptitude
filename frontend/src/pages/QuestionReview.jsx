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
      <div style={{ display: 'flex', minHeight: '60vh', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="animated" style={styles.container}>
      <div style={styles.header}>
        <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Question Review 🔍</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Evaluate your answers and learn from step-by-step logical explanations
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {review.map((item, index) => {
          const isExpanded = expandedIndex === index;
          const isCorrect = item.isCorrect;

          return (
            <div
              key={index}
              style={{
                backgroundColor: 'var(--card)',
                border: '1.5px solid var(--border)',
                borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}`,
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                boxShadow: '0 4px 10px var(--shadow)',
                transition: 'var(--transition)'
              }}
            >
              {/* Card Header Trigger */}
              <div 
                onClick={() => toggleExpand(index)}
                style={styles.cardHeader}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--primary)' }}>QUESTION {index + 1}</span>
                    <span style={styles.topicBadge}>{item.topic}</span>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', paddingRight: '15px' }} className="text-truncate">
                    {item.questionText}
                  </p>
                </div>
                <div>
                  {isExpanded ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                </div>
              </div>

              {/* Collapsed Body Panel */}
              {isExpanded && (
                <div style={styles.cardBody}>
                  {/* Full question */}
                  <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '20px', color: 'var(--text)' }}>
                    {item.questionText}
                  </div>

                  {/* Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {Object.entries(item.options).map(([key, val]) => {
                      const isUserSelected = item.userAnswer === key;
                      const isCorrectAnswer = item.correctAnswer === key;

                      let rowBg = 'var(--card)';
                      let rowBorder = 'var(--border)';
                      let keyColor = 'var(--text-secondary)';

                      if (isCorrectAnswer) {
                        rowBg = 'var(--success-light)';
                        rowBorder = 'var(--success)';
                        keyColor = 'var(--success)';
                      } else if (isUserSelected && !isCorrect) {
                        rowBg = 'var(--danger-light)';
                        rowBorder = 'var(--danger)';
                        keyColor = 'var(--danger)';
                      }

                      return (
                        <div
                          key={key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: `1px solid ${rowBorder}`,
                            backgroundColor: rowBg
                          }}
                        >
                          <span style={{ fontSize: '13px', fontWeight: '700', color: keyColor }}>({key})</span>
                          <span style={{ fontSize: '13px', color: 'var(--text)', flex: 1 }}>{val}</span>
                          {isCorrectAnswer && <CheckCircle size={16} color="var(--success)" />}
                          {isUserSelected && !isCorrect && <XCircle size={16} color="var(--danger)" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Meta comparisons */}
                  <div style={styles.metaRow}>
                    <div>
                      <span style={styles.metaLabel}>Your Answer</span>
                      <strong style={{ fontSize: '13px', color: isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                        {item.userAnswer ? `Option ${item.userAnswer}` : 'Skipped'}
                      </strong>
                    </div>
                    <div>
                      <span style={styles.metaLabel}>Correct Answer</span>
                      <strong style={{ fontSize: '13px', color: 'var(--success)' }}>
                        Option {item.correctAnswer}
                      </strong>
                    </div>
                  </div>

                  {/* Explanation card */}
                  <div style={styles.explanationBox}>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>AI Explanation:</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
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
        className="btn btn-outline"
        onClick={() => navigate(`/results/${sessionId}`, { state: { level } })}
        style={{ width: '100%', marginTop: '20px' }}
      >
        Back to Scorecard
      </button>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    paddingVertical: '15px',
  },
  header: {
    marginBottom: '24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    cursor: 'pointer',
  },
  topicBadge: {
    fontSize: '9px',
    fontWeight: '700',
    color: 'var(--primary)',
    backgroundColor: 'var(--primary-light)',
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: '20px',
    borderTop: '1px solid var(--border)',
  },
  metaRow: {
    display: 'flex',
    gap: '30px',
    marginBottom: '20px',
  },
  metaLabel: {
    display: 'block',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    marginBottom: '2px',
    fontWeight: '500',
  },
  explanationBox: {
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: 'var(--background)',
  }
};

export default QuestionReview;
