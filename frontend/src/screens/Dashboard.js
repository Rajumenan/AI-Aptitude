import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import { BookOpen, Trophy, Compass, Landmark, Briefcase, Play, AlertCircle, Flame } from 'lucide-react-native';

const Dashboard = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, refreshUserProfile } = useAuth();

  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    averageAccuracy: 0,
    certificatesCount: 0,
    tokens: 0,
    currentStreak: 0
  });
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch stats and session status when dashboard gains focus
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          setStatsLoading(true);
          const data = await refreshUserProfile();
          if (data) {
            setStats(data.stats);
          }
          
          const sessionState = await api.get('/api/quiz/session-state');
          if (sessionState.success && sessionState.hasActiveSession) {
            setActiveSession(sessionState);
          } else {
            setActiveSession(null);
          }
        } catch (error) {
          console.log('Error pulling dashboard data:', error.message);
        } finally {
          setStatsLoading(false);
        }
      };

      fetchData();
    }, [])
  );

  const startNewQuiz = async (level) => {
    try {
      setLoading(true);
      const res = await api.post('/api/quiz/start', { level });
      if (res.success) {
        navigation.navigate('QuizScreen', {
          sessionId: res.sessionId,
          level: res.level,
          firstQuestion: res.question
        });
      }
    } catch (error) {
      Alert.alert('Quiz Launch Failed', error.message || 'Server error starting quiz. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLevelPress = (levelName) => {
    if (activeSession) {
      Alert.alert(
        'Ongoing Quiz Detected',
        `You have an active ${activeSession.level} quiz in progress. Would you like to resume it, or abandon it to start a new ${levelName} quiz?`,
        [
          { text: 'Resume Active Quiz', onPress: resumeActiveQuiz },
          { text: 'Abandon & Start New', onPress: () => startNewQuiz(levelName), style: 'destructive' },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      startNewQuiz(levelName);
    }
  };

  const resumeActiveQuiz = async () => {
    if (!activeSession) return;
    try {
      setLoading(true);
      const res = await api.get('/api/quiz/current-question');
      if (res.success) {
        navigation.navigate('QuizScreen', {
          sessionId: activeSession.sessionId,
          level: activeSession.level,
          resumeQuestion: res.question,
          resumeQuestionNumber: res.currentQuestionNumber
        });
      }
    } catch (error) {
      Alert.alert('Error Resuming', error.message || 'Could not fetch question state.');
    } finally {
      setLoading(false);
    }
  };

  const levels = [
    { name: 'Basic', description: 'Arithmetic, Percentages, Ratio, profit & loss, basic patterns', icon: BookOpen, color: '#3B82F6' },
    { name: 'Intermediate', description: 'Probability, clocks, calendars, syllogism, relations', icon: Compass, color: '#10B981' },
    { name: 'Advance', description: 'Puzzles, statements, assumptions, number theory, calculations', icon: Trophy, color: '#8B5CF6' },
    { name: 'Company Related', description: 'TCS NQT, Infosys, Wipro, Accenture placement tests', icon: Briefcase, color: '#F59E0B' },
    { name: 'Government Exams', description: 'UPSC CSAT, Bank, SSC, Railways, State PSC papers', icon: Landmark, color: '#EF4444' }
  ];

  return (
    <ScreenWrapper scroll contentContainerStyle={styles.container}>
      {/* Welcome Row */}
      <View style={styles.welcomeRow}>
        <View>
          <Text style={[styles.welcomeSub, { color: theme.textSecondary }]}>Hello,</Text>
          <Text style={[styles.welcomeTitle, { color: theme.text }]}>{user?.username || 'Learner'} 👋</Text>
        </View>
        {/* Streak & Token Pill */}
        {!statsLoading && (
          <View style={styles.streakTokenPill}>
            <Flame size={14} color="#FF6B35" style={{ marginRight: 3 }} />
            <Text style={[styles.streakTokenText, { color: '#FF6B35' }]}>{stats.currentStreak}d</Text>
            <Text style={{ color: '#CBD5E1', marginHorizontal: 6 }}>|</Text>
            <Text style={{ fontSize: 13, marginRight: 3 }}>🪙</Text>
            <Text style={[styles.streakTokenText, { color: '#F59E0B' }]}>{stats.tokens}</Text>
          </View>
        )}
      </View>

      {/* Resume Banner */}
      {activeSession && (
        <TouchableOpacity 
          style={[styles.resumeBanner, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}
          onPress={resumeActiveQuiz}
          disabled={loading}
        >
          <AlertCircle size={20} color={theme.warning} style={styles.bannerIcon} />
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitle, { color: theme.text }]}>Resume Quiz In Progress</Text>
            <Text style={[styles.bannerSubtitle, { color: theme.textSecondary }]}>
              Continue your {activeSession.level} Quiz (Q {activeSession.currentQuestionNumber}/10)
            </Text>
          </View>
          <Play size={16} color={theme.warning} fill={theme.warning} />
        </TouchableOpacity>
      )}

      {/* Overview Stats */}
      <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.statsTitle, { color: theme.text }]}>Overall Performance</Text>
        
        {statsLoading ? (
          <ActivityIndicator color={theme.primary} style={{ marginVertical: 15 }} />
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: theme.primary }]}>{stats.totalQuizzes}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Quizzes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: theme.primary }]}>{stats.averageScore}/10</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avg Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: theme.primary }]}>{stats.averageAccuracy}%</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Accuracy</Text>
            </View>
          </View>
        )}
      </View>

      {/* Level Selectors */}
      <View style={styles.levelsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Choose Difficulty Level</Text>
        
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loaderText, { color: theme.textSecondary }]}>Setting up your quiz...</Text>
          </View>
        ) : (
          levels.map((lvl) => {
            const Icon = lvl.icon;
            return (
              <TouchableOpacity
                key={lvl.name}
                style={[styles.levelBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => handleLevelPress(lvl.name)}
              >
                <View style={[styles.levelIconContainer, { backgroundColor: lvl.color + '15' }]}>
                  <Icon size={24} color={lvl.color} />
                </View>
                
                <View style={styles.levelTextContainer}>
                  <Text style={[styles.levelName, { color: theme.text }]}>{lvl.name}</Text>
                  <Text style={[styles.levelDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                    {lvl.description}
                  </Text>
                </View>
                
                <Play size={14} color={theme.textSecondary} style={styles.playIcon} />
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeSub: {
    fontSize: 14,
    fontWeight: '500',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  streakTokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B3510',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FF6B3540',
  },
  streakTokenText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  resumeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  bannerIcon: {
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 35,
    backgroundColor: '#E5E7EB',
  },
  levelsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  levelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  levelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  levelTextContainer: {
    flex: 1,
  },
  levelName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  levelDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  playIcon: {
    marginLeft: 8,
  },
  loaderContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Dashboard;
