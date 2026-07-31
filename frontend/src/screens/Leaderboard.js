import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import { Trophy, Clock, Medal } from 'lucide-react-native';

const Leaderboard = () => {
  const { theme } = useTheme();

  const levels = ['Basic', 'Intermediate', 'Advance', 'Company Related', 'Government Exams'];
  const [selectedLevel, setSelectedLevel] = useState('Basic');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRankings = async (level) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/leaderboard/${level}`);
      if (res.success) {
        setRankings(res.rankings);
      }
    } catch (error) {
      console.log('Error fetching leaderboard rankings:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings(selectedLevel);
  }, [selectedLevel]);

  const renderRankBadge = (rank) => {
    if (rank === 1) return <Trophy size={20} color="#F59E0B" fill="#F59E0B" />;
    if (rank === 2) return <Medal size={20} color="#9CA3AF" fill="#9CA3AF" />;
    if (rank === 3) return <Medal size={20} color="#B45309" fill="#B45309" />;
    return <Text style={[styles.rankText, { color: theme.textSecondary }]}>{rank}</Text>;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const renderItem = ({ item }) => (
    <View style={[styles.rankRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.rankNumCol}>
        {renderRankBadge(item.rank)}
      </View>
      
      <View style={styles.userCol}>
        <Text style={[styles.usernameText, { color: theme.text }]} numberOfLines={1}>
          {item.username}
        </Text>
        <View style={styles.timeMeta}>
          <Clock size={12} color={theme.textSecondary} />
          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
            {formatTime(item.timeTaken)}
          </Text>
        </View>
      </View>
      
      <View style={styles.scoreCol}>
        <Text style={[styles.scoreText, { color: theme.primary }]}>{item.score}</Text>
        <Text style={[styles.scoreTotalText, { color: theme.textSecondary }]}>/10</Text>
      </View>
    </View>
  );

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      {/* Header Tabs */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text, paddingHorizontal: 20 }]}>Global Leaderboard</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {levels.map((lvl) => {
            const isSelected = selectedLevel === lvl;
            return (
              <TouchableOpacity
                key={lvl}
                onPress={() => setSelectedLevel(lvl)}
                style={[
                  styles.tabBtn, 
                  { 
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: theme.border
                  }
                ]}
              >
                <Text style={[
                  styles.tabText, 
                  { color: isSelected ? '#FFF' : theme.text }
                ]}>
                  {lvl}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Board */}
      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={rankings}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Trophy size={48} color={theme.textSecondary} style={{ marginBottom: 12, opacity: 0.5 }} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Rankings Yet</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  Be the first to complete a quiz at this level and take the lead!
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 10,
    paddingBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexGrow: 1,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 1,
  },
  rankNumCol: {
    width: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  userCol: {
    flex: 1,
  },
  usernameText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  scoreCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreTotalText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default Leaderboard;
