
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import { Clock, AlertCircle, Lightbulb, X } from 'lucide-react-native';

const HINT_COSTS = { 1: 30, 2: 50, 3: 70 };

const QuizScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { sessionId, level, firstQuestion, resumeQuestion, resumeQuestionNumber } = route.params || {};

  const [questionNumber, setQuestionNumber] = useState(resumeQuestionNumber || 1);
  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion || resumeQuestion || null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);

  // Hint & Token state
  const [tokenBalance, setTokenBalance] = useState(null);
  const [hintsUsedThisQuestion, setHintsUsedThisQuestion] = useState(0);
  const [hintModalVisible, setHintModalVisible] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintHistory, setHintHistory] = useState([]);

  const timerRef = useRef(null);
  const progressAnim = useRef(new Animated.Value((questionNumber - 1) / 10)).current;

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

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [questionNumber]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(60);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); handleTimeOut(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeOut = () => {
    Alert.alert('Time Out!', 'Time ran out. Moving to next question.', [{ text: 'OK', onPress: () => handleSubmitAnswer(null) }]);
  };

  const isSubmittingRef = useRef(false);
  const nextQuestionDataRef = useRef(null);

  const handleSubmitAnswer = async (forcedAnswer = null) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

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
        Animated.timing(progressAnim, {
          toValue: res.nextQuestionNumber ? (res.nextQuestionNumber - 1) / 10 : 1.0,
          duration: 300,
          useNativeDriver: false,
        }).start();
        if (res.isQuizCompleted && res.streakInfo?.totalTokens !== undefined) {
          setTokenBalance(res.streakInfo.totalTokens);
        }
        advanceToNextQuestion(res);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Submission Error', error.message || 'Server error. Try again.');
      startTimer();
      setIsSubmitted(false);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleNextPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (nextQuestionDataRef.current) {
      advanceToNextQuestion(nextQuestionDataRef.current);
      nextQuestionDataRef.current = null;
    }
  };

  const advanceToNextQuestion = (res) => {
    if (res.isQuizCompleted) {
      navigation.replace('ResultScreen', { sessionId, level });
    } else {
      setQuestionNumber(res.nextQuestionNumber);
      setCurrentQuestion(res.question);
      setSelectedOption(null);
      setIsSubmitted(false);
      // Reset hints for new question
      setHintsUsedThisQuestion(0);
      setHintHistory([]);
    }
  };

  // ── Hint Logic ───────────────────────────────────────────────
  const nextHintNumber = hintsUsedThisQuestion + 1;
  const nextHintCost = HINT_COSTS[nextHintNumber] || null;
  const canUseHint = !isSubmitted && nextHintNumber <= 3 && nextHintCost !== null;

  const handleRequestHint = async () => {
    if (!canUseHint) return;
    if (tokenBalance === null || tokenBalance < nextHintCost) {
      Alert.alert(
        'Not Enough Tokens',
        'Hint #' + nextHintNumber + ' costs ' + nextHintCost + ' tokens.\n' +
        'You have ' + (tokenBalance ?? 0) + ' tokens.\n' +
        'Earn more by completing quizzes daily!'
      );
      return;
    }
    setHintLoading(true);
    setHintModalVisible(true);
    try {
      const res = await api.post('/api/quiz/hint', { hintNumber: nextHintNumber });
      if (res.success) {
        const newHint = { number: nextHintNumber, text: res.hint, cost: res.tokensSpent };
        setHintHistory(prev => [...prev, newHint]);
        setHintsUsedThisQuestion(nextHintNumber);
        setTokenBalance(res.remainingTokens);
      }
    } catch (error) {
      setHintModalVisible(false);
      Alert.alert('Hint Error', error.message || 'Could not fetch hint.');
    } finally {
      setHintLoading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────

  if (!currentQuestion) {
    return (
      <ScreenWrapper style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ScreenWrapper>
    );
  }

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.quizHeader}>
        <View>
          <Text style={[styles.levelLabel, { color: theme.primary }]}>{level.toUpperCase()}</Text>
          <Text style={[styles.qNum, { color: theme.text }]}>Question {questionNumber} of 10</Text>
        </View>
        <View style={styles.headerRight}>
          {tokenBalance !== null && (
            <View style={[styles.tokenBadge, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B40' }]}>
              <Text style={styles.tokenBadgeEmoji}>🪙</Text>
              <Text style={[styles.tokenBadgeText, { color: '#F59E0B' }]}>{tokenBalance}</Text>
            </View>
          )}
          <View style={[styles.timerBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Clock size={15} color={timeLeft <= 10 ? theme.danger : theme.warning} />
            <Text style={[styles.timerText, { color: timeLeft <= 10 ? theme.danger : theme.text }]}>{timeLeft}s</Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: theme.border }]}>
        <Animated.View style={[styles.progressBar, { width: progressWidth, backgroundColor: theme.primary }]} />
      </View>

      {/* Quiz Body */}
      <View style={styles.quizBody}>
        <View style={[styles.questionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.questionText, { color: theme.text }]}>{currentQuestion.questionText}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {Object.entries(currentQuestion.options).map(([key, val]) => {
            const isSelected = selectedOption === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.optionBtn, {
                  backgroundColor: isSelected ? theme.primary + '15' : theme.card,
                  borderColor: isSelected ? theme.primary : theme.border,
                }]}
                onPress={() => setSelectedOption(key)}
                disabled={isSubmitted || loading}
              >
                <View style={[styles.optionKeyCircle, { backgroundColor: isSelected ? theme.primary : theme.border }]}>
                  <Text style={[styles.optionKeyText, { color: isSelected ? '#FFF' : theme.text }]}>{key}</Text>
                </View>
                <Text style={[styles.optionValText, { color: theme.text }]}>{val}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hint Row */}
        {!isSubmitted && (
          <View style={styles.hintRow}>
            {hintHistory.length > 0 && (
              <TouchableOpacity style={[styles.viewHintsBtn, { borderColor: theme.border }]} onPress={() => setHintModalVisible(true)}>
                <Lightbulb size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.viewHintsBtnText, { color: theme.textSecondary }]}>View Hints ({hintHistory.length})</Text>
              </TouchableOpacity>
            )}
            {canUseHint ? (
              <TouchableOpacity
                style={[
                  styles.hintBtn,
                  { backgroundColor: '#8B5CF615', borderColor: '#8B5CF640' },
                  tokenBalance !== null && tokenBalance < nextHintCost && { opacity: 0.5 }
                ]}
                onPress={handleRequestHint}
              >
                <Lightbulb size={15} color="#8B5CF6" style={{ marginRight: 5 }} />
                <Text style={[styles.hintBtnText, { color: '#8B5CF6' }]}>Hint #{nextHintNumber}</Text>
                <View style={styles.hintCostPill}>
                  <Text style={styles.hintCostPillEmoji}>🪙</Text>
                  <Text style={styles.hintCostPillText}>{nextHintCost}</Text>
                </View>
              </TouchableOpacity>
            ) : hintsUsedThisQuestion >= 3 ? (
              <Text style={[styles.maxHintsText, { color: theme.textSecondary }]}>Max 3 hints used</Text>
            ) : null}
          </View>
        )}
      </View>



      {/* Action Buttons */}
      <View style={styles.footerActions}>
        {!isSubmitted ? (
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: selectedOption ? theme.primary : theme.border }]}
            onPress={() => handleSubmitAnswer(null)}
            disabled={!selectedOption || loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <Text style={[styles.actionBtnText, { color: selectedOption ? '#FFF' : theme.textSecondary }]}>Submit Answer</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={handleNextPress}>
            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Next Question</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Hint Bottom Sheet Modal */}
      <Modal visible={hintModalVisible} transparent animationType="slide" onRequestClose={() => setHintModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Lightbulb size={20} color="#8B5CF6" style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Hints</Text>
              </View>
              <TouchableOpacity onPress={() => setHintModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Token balance row */}
            <View style={[styles.modalTokenRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTokenLabel, { color: theme.textSecondary }]}>Token Balance</Text>
              <View style={styles.modalTokenBadge}>
                <Text style={styles.modalTokenEmoji}>🪙</Text>
                <Text style={[styles.modalTokenNum, { color: '#F59E0B' }]}>{tokenBalance ?? '—'}</Text>
              </View>
            </View>

            <ScrollView style={styles.hintScroll} showsVerticalScrollIndicator={false}>
              {hintLoading ? (
                <View style={styles.hintLoadingContainer}>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text style={[styles.hintLoadingText, { color: theme.textSecondary }]}>Generating hint...</Text>
                </View>
              ) : (
                <>
                  {hintHistory.map((h, idx) => (
                    <View key={idx} style={[styles.hintCard, { backgroundColor: '#8B5CF610', borderColor: '#8B5CF630' }]}>
                      <View style={styles.hintCardHeader}>
                        <Text style={[styles.hintCardLabel, { color: '#8B5CF6' }]}>Hint #{h.number}</Text>
                        <Text style={[styles.hintCardCost, { color: theme.textSecondary }]}>🪙 -{h.cost} spent</Text>
                      </View>
                      <Text style={[styles.hintCardText, { color: theme.text }]}>{h.text}</Text>
                    </View>
                  ))}

                  {/* Next hint CTA */}
                  {canUseHint && !hintLoading && (
                    <View style={[styles.nextHintCTA, { borderColor: theme.border }]}>
                      <Text style={[styles.nextHintCTALabel, { color: theme.textSecondary }]}>
                        Upgrade to Hint #{nextHintNumber} — costs 🪙 {nextHintCost}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.nextHintCTABtn,
                          { backgroundColor: '#8B5CF6' },
                          tokenBalance !== null && tokenBalance < nextHintCost && { opacity: 0.5 }
                        ]}
                        onPress={() => { setHintModalVisible(false); handleRequestHint(); }}
                      >
                        <Text style={styles.nextHintCTABtnText}>Get Hint #{nextHintNumber}  🪙 {nextHintCost}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {hintsUsedThisQuestion >= 3 && (
                    <Text style={[styles.maxHintsText, { color: theme.textSecondary, textAlign: 'center', marginTop: 12 }]}>
                      Maximum 3 hints used for this question.
                    </Text>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  levelLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5 },
  qNum: { fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tokenBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, marginRight: 4 },
  tokenBadgeEmoji: { fontSize: 13, marginRight: 4 },
  tokenBadgeText: { fontSize: 13, fontWeight: 'bold' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, borderWidth: 1 },
  timerText: { fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
  progressContainer: { height: 6, borderRadius: 3, width: '100%', marginBottom: 20, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  quizBody: { flex: 1 },
  questionCard: { borderRadius: 14, borderWidth: 1, padding: 20, marginBottom: 20 },
  questionText: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  optionsContainer: { marginBottom: 10 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  optionKeyCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  optionKeyText: { fontSize: 14, fontWeight: 'bold' },
  optionValText: { fontSize: 14, fontWeight: '500', flex: 1 },
  hintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 },
  hintBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  hintBtnText: { fontSize: 13, fontWeight: 'bold' },
  hintCostPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8B5CF625', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 8 },
  hintCostPillEmoji: { fontSize: 11, marginRight: 2 },
  hintCostPillText: { fontSize: 11, fontWeight: 'bold', color: '#8B5CF6' },
  viewHintsBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  viewHintsBtnText: { fontSize: 12, fontWeight: '600' },
  maxHintsText: { fontSize: 12, fontStyle: 'italic' },
  feedbackBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 15, justifyContent: 'center' },
  feedbackText: { fontSize: 14, fontWeight: 'bold' },
  footerActions: { paddingVertical: 10, marginBottom: 10 },
  submitBtn: { height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center', width: '100%' },
  actionBtnText: { fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, maxHeight: '75%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 16 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalCloseBtn: { padding: 4 },
  modalTokenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, marginBottom: 10 },
  modalTokenLabel: { fontSize: 13, fontWeight: '500' },
  modalTokenBadge: { flexDirection: 'row', alignItems: 'center' },
  modalTokenEmoji: { fontSize: 16, marginRight: 4 },
  modalTokenNum: { fontSize: 16, fontWeight: 'bold' },
  hintScroll: { paddingHorizontal: 20 },
  hintLoadingContainer: { alignItems: 'center', paddingVertical: 40 },
  hintLoadingText: { marginTop: 12, fontSize: 14 },
  hintCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  hintCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  hintCardLabel: { fontSize: 13, fontWeight: 'bold' },
  hintCardCost: { fontSize: 12 },
  hintCardText: { fontSize: 14, lineHeight: 20 },
  nextHintCTA: { borderTopWidth: 1, paddingTop: 14, marginTop: 4, alignItems: 'center' },
  nextHintCTALabel: { fontSize: 12, marginBottom: 10 },
  nextHintCTABtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, width: '100%', alignItems: 'center' },
  nextHintCTABtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});

export default QuizScreen;

