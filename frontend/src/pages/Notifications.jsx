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
    if (type === 'Quiz') return <BookOpen size={size} className={isRead ? 'text-[var(--text-secondary)]' : 'text-[var(--primary)]'} />;
    return <AlertCircle size={size} className={isRead ? 'text-[var(--text-secondary)]' : 'text-[var(--primary)]'} />;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)]">Inbox Notifications</h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">Track your unlocked milestones and quiz reports</p>
        </div>
        {notifications.length > 0 && (
          <button 
            className="btn btn-outline h-9 px-3.5 text-xs gap-1.5 rounded-lg shrink-0 cursor-pointer self-start sm:self-auto" 
            onClick={handleMarkAllRead}
          >
            <Check size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 rounded-full border-3 border-[var(--border)] border-t-[var(--primary)] animate-spin mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-xs">
            <Bell size={48} className="text-[var(--text-secondary)] opacity-40 mb-3" />
            <h3 className="text-base font-bold text-[var(--text)]">All Caught Up</h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-sm">
              You don't have any notifications right now. Keep practicing quizzes to trigger achievements!
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item._id}
              onClick={() => !item.isRead && handleMarkAsRead(item._id)}
              className={`p-4 sm:p-5 bg-[var(--card)] border border-[var(--border)] rounded-2xl flex gap-3.5 sm:gap-4 transition-all ${
                item.isRead ? 'border-l-4 border-l-[var(--border)] shadow-none' : 'border-l-4 border-l-[var(--primary)] shadow-xs cursor-pointer'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--background)] flex items-center justify-center shrink-0 mt-0.5">
                {getNotificationIcon(item.type, item.isRead)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <h4 className={`text-xs sm:text-sm truncate text-[var(--text)] ${item.isRead ? 'font-semibold' : 'font-extrabold'}`}>
                    {item.title}
                  </h4>
                  {!item.isRead && (
                    <div className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0" />
                  )}
                </div>
                
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                  {item.message}
                </p>
                
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] block mt-2">
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

export default Notifications;
