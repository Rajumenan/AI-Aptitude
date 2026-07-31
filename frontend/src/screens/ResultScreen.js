import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import { Award, Clock, ArrowRight, AwardIcon, Sparkles, RefreshCw, BarChart2, Flame } from 'lucide-react-native';

const ResultScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { sessionId, level } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  const fetchQuizResult = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/results/details/${sessionId}`);
      if (res.success) {
        setResult(res);
      }
    } catch (error) {
      Alert.alert('Error loading result', error.message || 'Could not fetch quiz scorecard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizResult();
  }, [sessionId]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (loading || !result) {
    return (
      <ScreenWrapper style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 10, color: theme.textSecondary }}>Assembling scorecard & AI report...</Text>
      </ScreenWrapper>
    );
  }

  const { scorecard, certificateEarned, streakInfo } = result;
  const currentStreak = streakInfo?.currentStreak || 0;
  const longestStreak = streakInfo?.longestStreak || 0;
  const tokensAwarded = streakInfo?.tokensAwarded || 0;
  const totalTokens = streakInfo?.totalTokens || 0;
  const isSundayBonus = tokensAwarded === 10;

  return (
    <ScreenWrapper scroll contentContainerStyle={styles.container}>
      {/* Celebration Header */}
      <View style={styles.header}>
        <Text style={[styles.ratingLabel, { color: theme.primary }]}>
          {scorecard.performanceRating.toUpperCase()}
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>Quiz Complete! 🏁</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          You finished the {level} Level quiz
        </Text>
      </View>

      {/* Circle Score Card */}
      <View style={[styles.scoreCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.scoreCircle, { borderColor: theme.primary }]}>
          <Text style={[styles.scoreText, { color: theme.text }]}>{scorecard.score}</Text>
          <Text style={[styles.scoreMax, { color: theme.textSecondary }]}>/10</Text>
        </View>
        <View style={styles.scoreMeta}>
          <Text style={[styles.pctText, { color: theme.primary }]}>{scorecard.percentage}%</Text>
          <Text style={[styles.accLabel, { color: theme.textSecondary }]}>Total Accuracy</Text>
        </View>
      </View>

      {/* Certificate Alert Banner */}
      {certificateEarned && (
        <View style={[styles.certBanner, { backgroundColor: '#F59E0B' + '20', borderColor: '#F59E0B' }]}>
          <Sparkles size={20} color="#F59E0B" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.certBannerTitle, { color: theme.text }]}>Certificate Earned! 🏆</Text>
            <Text style={[styles.certBannerSub, { color: theme.textSecondary }]}>
              You achieved a score {'>='}70%. Your certificate is unlocked in your profile.
            </Text>
          </View>
        </View>
      )}

      {/* Daily Streak Banner */}
      {currentStreak > 0 && (
        <View style={[styles.streakBanner, { backgroundColor: '#FF6B3520', borderColor: '#FF6B35' }]}>
          <View style={styles.streakIconWrap}>
            <Flame size={28} color="#FF6B35" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.streakTitle, { color: theme.text }]}>
              🔥 {currentStreak}-Day Streak!
            </Text>
            <Text style={[styles.streakSub, { color: theme.textSecondary }]}>
              {currentStreak === 1
                ? 'Great start! Come back tomorrow to keep it going.'
                : `You've played ${currentStreak} days in a row. Keep it up!`}
            </Text>
            {tokensAwarded > 0 && (
              <View style={styles.tokenEarnedRow}>
                <Text style={styles.tokenEarnedText}>
                  🪙 +{tokensAwarded} tokens earned{isSundayBonus ? '  🎉 Sunday Bonus!' : ''}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakBadgeNum}>{currentStreak}</Text>
            <Text style={styles.streakBadgeLabel}>days</Text>
          </View>
        </View>
      )}

      {/* Stats Breakdown List */}
      <View style={styles.breakdownContainer}>
        <View style={[styles.breakdownRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>Correct Answers</Text>
          <Text style={[styles.breakdownVal, { color: theme.success }]}>{scorecard.correctAnswers}</Text>
        </View>
        <View style={[styles.breakdownRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>Incorrect Answers</Text>
          <Text style={[styles.breakdownVal, { color: theme.danger }]}>{scorecard.incorrectAnswers}</Text>
        </View>
        <View style={[styles.breakdownRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>Time Taken</Text>
          <View style={styles.breakdownValCol}>
            <Clock size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.breakdownVal, { color: theme.text }]}>
              {formatTime(scorecard.timeTaken)}
            </Text>
          </View>
        </View>
        <View style={[styles.breakdownRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>Current Streak</Text>
          <View style={styles.breakdownValCol}>
            <Flame size={14} color="#FF6B35" style={{ marginRight: 6 }} />
            <Text style={[styles.breakdownVal, { color: '#FF6B35' }]}>{currentStreak} days</Text>
          </View>
        </View>
        <View style={[styles.breakdownRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>Longest Streak</Text>
          <View style={styles.breakdownValCol}>
            <Flame size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.breakdownVal, { color: theme.text }]}>{longestStreak} days</Text>
          </View>
        </View>
        <View style={[styles.breakdownRow, { borderBottomColor: 'transparent' }]}>
          <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>Total Tokens</Text>
          <View style={styles.breakdownValCol}>
            <Text style={{ marginRight: 4, fontSize: 14 }}>🪙</Text>
            <Text style={[styles.breakdownVal, { color: '#F59E0B' }]}>{totalTokens}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {/* AI Performance Analysis */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('PerformanceAnalysis', { 
            sessionId,
            level 
          })}
        >
          <Sparkles size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.actionBtnText}>AI Performance Report</Text>
          <ArrowRight size={16} color="#FFF" style={styles.rightArrow} />
        </TouchableOpacity>

        {/* Question Review */}
        <TouchableOpacity
          style={[styles.actionBtnOutline, { borderColor: theme.border, backgroundColor: theme.card }]}
          onPress={() => navigation.navigate('QuestionReview', { 
            sessionId,
            level 
          })}
        >
          <BarChart2 size={18} color={theme.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.actionBtnOutlineText, { color: theme.text }]}>Review Questions</Text>
          <ArrowRight size={16} color={theme.textSecondary} style={styles.rightArrow} />
        </TouchableOpacity>

        {/* Back to Dashboard */}
        <TouchableOpacity
          style={styles.backHomeBtn}
          onPress={() => navigation.replace('MainApp')}
        >
          <Text style={[styles.backHomeText, { color: theme.primary }]}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  scoreCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: -2,
  },
  scoreMeta: {
    justifyContent: 'center',
  },
  pctText: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 38,
  },
  accLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  certBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  certBannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  certBannerSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  streakIconWrap: {
    marginRight: 12,
  },
  streakTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  streakSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  tokenEarnedRow: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#22C55E20',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tokenEarnedText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  streakBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
  },
  streakBadgeNum: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  streakBadgeLabel: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  breakdownContainer: {
    marginBottom: 30,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  breakdownVal: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  breakdownValCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionBtn: {
    height: 52,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  rightArrow: {
    position: 'absolute',
    right: 16,
  },
  actionBtnOutline: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    paddingHorizontal: 16,
  },
  actionBtnOutlineText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  backHomeBtn: {
    alignSelf: 'center',
    padding: 12,
  },
  backHomeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ResultScreen;
