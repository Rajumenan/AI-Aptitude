import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Bell, Trophy, BookOpen, AlertCircle, Check } from 'lucide-react';

const Notifications = () => {
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

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
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
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await api.put('/api/notifications/read-all');
    } catch (error) {
      console.log('Error marking all as read:', error.message);
    }
  };

  const getNotificationIcon = (type, isRead) => {
    const size = 18;
    if (type === 'Achievement') return <Trophy size={size} color="#F59E0B" fill={isRead ? 'none' : '#F59E0B'} />;
    if (type === 'Quiz') return <BookOpen size={size} color={isRead ? 'var(--text-secondary)' : 'var(--primary)'} />;
    return <AlertCircle size={size} color={isRead ? 'var(--text-secondary)' : 'var(--primary)'} />;
  };

  return (
    <div className="animated" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Inbox Notifications</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Track your unlocked milestones and quiz reports</p>
        </div>
        {notifications.length > 0 && (
          <button 
            className="btn btn-outline" 
            onClick={handleMarkAllRead}
            style={{ height: '36px', padding: '0 14px', fontSize: '12px', gap: '6px' }}
          >
            <Check size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={styles.emptyCard}>
            <Bell size={48} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '15px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>All Caught Up</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'center' }}>
              You don't have any notifications right now. Keep practicing quizzes to trigger achievements!
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item._id}
              onClick={() => !item.isRead && handleMarkAsRead(item._id)}
              style={{
                backgroundColor: 'var(--card)',
                border: '1.5px solid var(--border)',
                borderLeft: `4px solid ${item.isRead ? 'var(--border)' : 'var(--primary)'}`,
                borderRadius: 'var(--radius)',
                padding: '16px 20px',
                display: 'flex',
                gap: '15px',
                cursor: item.isRead ? 'default' : 'pointer',
                boxShadow: item.isRead ? 'none' : '0 4px 8px var(--shadow)',
                transition: 'var(--transition)'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--background)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {getNotificationIcon(item.type, item.isRead)}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <h4 style={{ 
                    fontSize: '14px', 
                    fontWeight: item.isRead ? '600' : '800',
                    color: 'var(--text)'
                  }}>
                    {item.title}
                  </h4>
                  {!item.isRead && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', flexShrink: 0 }} />
                  )}
                </div>
                
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.5' }}>
                  {item.message}
                </p>
                
                <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginTop: '10px' }}>
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  emptyCard: {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '60px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px var(--shadow)',
  }
};

export default Notifications;
