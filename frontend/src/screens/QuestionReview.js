import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react-native';

const QuestionReview = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { sessionId, level } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(0); // 1st question expanded by default

  const fetchReview = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/results/details/${sessionId}`);
      if (res.success) {
        setReviewData(res.review);
      }
    } catch (error) {
      Alert.alert('Error Loading Review', error.message || 'Could not fetch quiz questions history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [sessionId]);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? -1 : index);
  };

  if (loading) {
    return (
      <ScreenWrapper style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Question Review 🔍</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Review your answers and detailed step-by-step explanations
        </Text>
      </View>

      <View style={styles.list}>
        {reviewData.map((item, index) => {
          const isExpanded = expandedIndex === index;
          const isCorrect = item.isCorrect;

          return (
            <View 
              key={index} 
              style={[
                styles.questionCard, 
                { 
                  backgroundColor: theme.card, 
                  borderColor: theme.border,
                  borderLeftWidth: 4,
                  borderLeftColor: isCorrect ? theme.success : theme.danger
                }
              ]}
            >
              {/* Question Collapsible Header */}
              <TouchableOpacity 
                style={styles.cardHeader} 
                onPress={() => toggleExpand(index)}
                activeOpacity={0.7}
              >
                <View style={styles.headerTitleCol}>
                  <View style={styles.numRow}>
                    <Text style={[styles.numText, { color: theme.primary }]}>Q {index + 1}</Text>
                    <View style={[styles.topicBadge, { backgroundColor: theme.primary + '10' }]}>
                      <Text style={[styles.topicText, { color: theme.primary }]}>{item.topic}</Text>
                    </View>
                  </View>
                  <Text style={[styles.questionPreviewText, { color: theme.text }]} numberOfLines={2}>
                    {item.questionText}
                  </Text>
                </View>
                {isExpanded ? (
                  <ChevronUp size={20} color={theme.textSecondary} />
                ) : (
                  <ChevronDown size={20} color={theme.textSecondary} />
                )}
              </TouchableOpacity>

              {/* Collapsible Body */}
              {isExpanded && (
                <View style={[styles.cardBody, { borderTopColor: theme.border }]}>
                  {/* Full Question */}
                  <Text style={[styles.fullQuestionText, { color: theme.text }]}>
                    {item.questionText}
                  </Text>

                  {/* Options */}
                  <View style={styles.optionsList}>
                    {Object.entries(item.options).map(([key, val]) => {
                      const isUserChoice = item.userAnswer === key;
                      const isCorrectChoice = item.correctAnswer === key;
                      
                      let optionBg = theme.card;
                      let optionBorder = theme.border;
                      let textColor = theme.text;
                      
                      if (isCorrectChoice) {
                        optionBg = theme.success + '15';
                        optionBorder = theme.success;
                        textColor = theme.success;
                      } else if (isUserChoice && !isCorrect) {
                        optionBg = theme.danger + '15';
                        optionBorder = theme.danger;
                        textColor = theme.danger;
                      }

                      return (
                        <View 
                          key={key} 
                          style={[styles.optionRow, { backgroundColor: optionBg, borderColor: optionBorder }]}
                        >
                          <Text style={[styles.optionKey, { color: textColor }]}>({key})</Text>
                          <Text style={[styles.optionVal, { color: theme.text }]}>{val}</Text>
                          {isCorrectChoice && (
                            <CheckCircle size={16} color={theme.success} style={styles.optionStatusIcon} />
                          )}
                          {isUserChoice && !isCorrect && (
                            <XCircle size={16} color={theme.danger} style={styles.optionStatusIcon} />
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Score indicators info */}
                  <View style={styles.summaryMetaRow}>
                    <View style={styles.metaCol}>
                      <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Your Answer</Text>
                      <Text style={[
                        styles.metaVal, 
                        { color: isCorrect ? theme.success : theme.danger }
                      ]}>
                        {item.userAnswer ? `Option ${item.userAnswer}` : 'Skipped'}
                      </Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Correct Answer</Text>
                      <Text style={[styles.metaVal, { color: theme.success }]}>
                        Option {item.correctAnswer}
                      </Text>
                    </View>
                  </View>

                  {/* Explanation card */}
                  <View style={[styles.explanationCard, { backgroundColor: theme.background }]}>
                    <Text style={[styles.explanationLabel, { color: theme.text }]}>Step-by-Step Explanation:</Text>
                    <Text style={[styles.explanationText, { color: theme.textSecondary }]}>
                      {item.explanation}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  list: {
    marginBottom: 20,
  },
  questionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  numRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  numText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  topicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  topicText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  questionPreviewText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  cardBody: {
    borderTopWidth: 1,
    padding: 16,
  },
  fullQuestionText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 15,
  },
  optionsList: {
    marginBottom: 15,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionKey: {
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 8,
  },
  optionVal: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  optionStatusIcon: {
    marginLeft: 8,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  explanationCard: {
    borderRadius: 8,
    padding: 12,
  },
  explanationLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default QuestionReview;
