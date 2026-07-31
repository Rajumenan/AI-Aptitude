import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Lightbulb, TrendingUp } from 'lucide-react-native';

const PerformanceAnalysis = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { sessionId, level } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/results/details/${sessionId}`);
      if (res.success) {
        setAnalysis(res.analysis);
      }
    } catch (error) {
      Alert.alert('Error Loading Analysis', error.message || 'Could not fetch AI analysis report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [sessionId]);

  const handleNextLevelPress = (recommendedLevel) => {
    navigation.replace('MainApp'); // Route back to home where they can choose levels
  };

  if (loading || !analysis) {
    return (
      <ScreenWrapper style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 10, color: theme.textSecondary }}>Running AI analyzer models...</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Performance Analysis 🤖</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          AI-generated breakdown of your cognitive strengths and growth areas
        </Text>
      </View>

      {/* Main Feedback Banner */}
      <View style={[styles.feedbackCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardTitleRow}>
          <Sparkles size={18} color="#A78BFA" />
          <Text style={[styles.cardTitle, { color: theme.text }]}>AI Evaluation Feedback</Text>
        </View>
        <Text style={[styles.feedbackDesc, { color: theme.textSecondary }]}>
          {analysis.difficultyAnalysis}
        </Text>
      </View>

      {/* Strengths & Weaknesses */}
      <View style={styles.splitRow}>
        {/* Strong Topics */}
        <View style={[styles.splitCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.splitTitleRow}>
            <CheckCircle2 size={16} color={theme.success} />
            <Text style={[styles.splitTitle, { color: theme.text, marginLeft: 6 }]}>Strengths</Text>
          </View>
          {analysis.strongTopics.length === 0 ? (
            <Text style={[styles.noItemsText, { color: theme.textSecondary }]}>No strong topics identified.</Text>
          ) : (
            analysis.strongTopics.map((topic, idx) => (
              <View key={idx} style={[styles.topicBadge, { backgroundColor: theme.success + '12' }]}>
                <Text style={[styles.topicText, { color: theme.success }]} numberOfLines={1}>
                  {topic}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Areas to Improve */}
        <View style={[styles.splitCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.splitTitleRow}>
            <AlertTriangle size={16} color={theme.danger} />
            <Text style={[styles.splitTitle, { color: theme.text, marginLeft: 6 }]}>Improve</Text>
          </View>
          {analysis.weakTopics.length === 0 ? (
            <Text style={[styles.noItemsText, { color: theme.textSecondary }]}>No weak topics identified.</Text>
          ) : (
            analysis.weakTopics.map((topic, idx) => (
              <View key={idx} style={[styles.topicBadge, { backgroundColor: theme.danger + '12' }]}>
                <Text style={[styles.topicText, { color: theme.danger }]} numberOfLines={1}>
                  {topic}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Learning Suggestions */}
      <View style={[styles.suggestionsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardTitleRow}>
          <Lightbulb size={18} color={theme.warning} />
          <Text style={[styles.cardTitle, { color: theme.text }]}>Learning Suggestions</Text>
        </View>
        <View style={styles.suggestionsList}>
          {analysis.learningSuggestions.map((suggestion, idx) => (
            <View key={idx} style={styles.suggestionItem}>
              <View style={[styles.bulletCircle, { backgroundColor: theme.primary + '15' }]}>
                <Text style={[styles.bulletNum, { color: theme.primary }]}>{idx + 1}</Text>
              </View>
              <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>
                {suggestion}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recommendation Box */}
      <View style={[styles.recommendationCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
        <View style={styles.recomRow}>
          <View style={styles.recomTextCol}>
            <Text style={[styles.recomLabel, { color: theme.primary }]}>RECOMMENDED PATH</Text>
            <Text style={[styles.recomVal, { color: theme.text }]}>
              Practice {analysis.recommendedNextLevel} Level
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.recomBtn, { backgroundColor: theme.primary }]}
            onPress={() => handleNextLevelPress(analysis.recommendedNextLevel)}
          >
            <Text style={styles.recomBtnText}>Start Path</Text>
            <ArrowRight size={14} color="#FFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
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
  feedbackCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  feedbackDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  splitCard: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  splitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  splitTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  noItemsText: {
    fontSize: 11,
  },
  topicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  topicText: {
    fontSize: 11,
    fontWeight: 'bold',
    width: '100%',
    textAlign: 'center',
  },
  suggestionsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  suggestionsList: {
    marginTop: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  bulletNum: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  suggestionText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  recommendationCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 15,
  },
  recomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recomTextCol: {
    flex: 1,
    marginRight: 10,
  },
  recomLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  recomVal: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  recomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
  },
  recomBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default PerformanceAnalysis;
