import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Trophy, Clock, Medal } from 'lucide-react';

const Leaderboard = () => {
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
      console.log('Error pulling leaderboard data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings(selectedLevel);
  }, [selectedLevel]);

  const renderRankBadge = (rank) => {
    if (rank === 1) return <Trophy size={18} color="#F59E0B" fill="#F59E0B" />;
    if (rank === 2) return <Medal size={18} color="#9CA3AF" fill="#9CA3AF" />;
    if (rank === 3) return <Medal size={18} color="#B45309" fill="#B45309" />;
    return <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>{rank}</span>;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="animated" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Global Standings</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Compete with learners worldwide for the top spot</p>
      </div>

      {/* Horizontal Tabs */}
      <div style={styles.tabsContainer}>
        {levels.map((lvl) => {
          const isSelected = selectedLevel === lvl;
          return (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className="btn"
              style={{
                height: '40px',
                borderRadius: '20px',
                padding: '0 20px',
                fontSize: '13px',
                border: '1px solid var(--border)',
                backgroundColor: isSelected ? 'var(--primary)' : 'var(--card)',
                color: isSelected ? '#FFF' : 'var(--text)',
                boxShadow: isSelected ? '0 4px 10px rgba(98,0,238,0.2)' : 'none',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              {lvl}
            </button>
          );
        })}
      </div>

      {/* Rankings Board Table */}
      <div style={styles.tableWrapper}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : rankings.length === 0 ? (
          <div style={styles.emptyContainer}>
            <Trophy size={48} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '15px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>No Rankings Recorded</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'center' }}>
              Be the first to complete a quiz at this level and lock in your score!
            </p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>RANK</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>USER</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textAlign: 'center' }}>TIME</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textAlign: 'right' }}>SCORE</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {renderRankBadge(item.rank)}
                  </td>
                  <td style={{ padding: '16px', fontWeight: '600' }}>{item.username}</td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <Clock size={14} />
                      <span>{formatTime(item.timeTaken)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: 'var(--primary)', fontSize: '17px' }}>
                    {item.score}<span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>/10</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  tabsContainer: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    paddingBottom: '5px',
    scrollbarWidth: 'none',
  },
  tableWrapper: {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: '0 4px 12px var(--shadow)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  emptyContainer: {
    padding: '60px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  }
};

export default Leaderboard;
