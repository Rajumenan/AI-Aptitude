import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import { Bell, Trophy, BookOpen, AlertCircle, CheckCircle } from 'lucide-react-native';

const Notifications = () => {
  const { theme } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (error) {
      console.log('Error pulling notifications:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const handleMarkAsRead = async (id) => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      await api.put(`/api/notifications/${id}/read`);
    } catch (error) {
      console.log('Error marking notification read:', error.message);
    }
  };

  const handleMarkAllRead = async () => {
    if (notifications.filter(n => !n.isRead).length === 0) return;
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await api.put('/api/notifications/read-all');
    } catch (error) {
      console.log('Error marking all as read:', error.message);
    }
  };

  const getNotificationIcon = (type, isRead) => {
    const size = 20;
    const color = isRead ? theme.textSecondary : theme.primary;
    if (type === 'Achievement') return <Trophy size={size} color="#F59E0B" fill={isRead ? 'none' : '#F59E0B'} />;
    if (type === 'Quiz') return <BookOpen size={size} color={color} />;
    return <AlertCircle size={size} color={color} />;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notifyCard, 
        { 
          backgroundColor: theme.card, 
          borderColor: theme.border,
          borderLeftColor: item.isRead ? theme.border : theme.primary,
          borderLeftWidth: 4
        }
      ]}
      onPress={() => handleMarkAsRead(item._id)}
      disabled={item.isRead}
    >
      <View style={styles.iconContainer}>
        {getNotificationIcon(item.type, item.isRead)}
      </View>
      
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[
            styles.notifyTitle, 
            { 
              color: theme.text,
              fontWeight: item.isRead ? '600' : 'bold'
            }
          ]}>
            {item.title}
          </Text>
          {!item.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
          )}
        </View>
        <Text style={[styles.notifyMessage, { color: theme.textSecondary }]} numberOfLines={3}>
          {item.message}
        </Text>
        <Text style={[styles.notifyTime, { color: theme.textSecondary }]}>
          {new Date(item.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <CheckCircle size={14} color={theme.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.markAllText, { color: theme.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Bell size={48} color={theme.textSecondary} style={{ marginBottom: 12, opacity: 0.5 }} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>All Caught Up!</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  You don't have any notifications right now. Complete quizzes to earn achievements!
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexGrow: 1,
  },
  notifyCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifyTitle: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifyMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  notifyTime: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
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

export default Notifications;
