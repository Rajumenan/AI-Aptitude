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
    return <span className="font-bold text-[var(--text-secondary)]">{rank}</span>;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)]">Global Standings</h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">Compete with learners worldwide for the top spot</p>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none max-w-full">
        {levels.map((lvl) => {
          const isSelected = selectedLevel === lvl;
          return (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`whitespace-nowrap h-10 px-4 sm:px-5 text-xs sm:text-sm rounded-full border transition-all cursor-pointer font-semibold shrink-0 ${
                isSelected 
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md' 
                  : 'bg-[var(--card)] text-[var(--text)] border-[var(--border)] hover:border-[var(--primary)]'
              }`}
            >
              {lvl}
            </button>
          );
        })}
      </div>

      {/* Rankings Board Table Container */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 rounded-full border-3 border-[var(--border)] border-t-[var(--primary)] animate-spin mx-auto" />
          </div>
        ) : rankings.length === 0 ? (
          <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
            <Trophy size={48} className="text-[var(--text-secondary)] opacity-40 mb-3" />
            <h3 className="text-base font-bold text-[var(--text)]">No Rankings Recorded</h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-sm">
              Be the first to complete a quiz at this level and lock in your score!
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                  <th className="py-3 px-4 text-xs font-bold text-[var(--text-secondary)]">RANK</th>
                  <th className="py-3 px-4 text-xs font-bold text-[var(--text-secondary)]">USER</th>
                  <th className="py-3 px-4 text-xs font-bold text-[var(--text-secondary)] text-center">TIME</th>
                  <th className="py-3 px-4 text-xs font-bold text-[var(--text-secondary)] text-right">SCORE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rankings.map((item, index) => (
                  <tr key={index} className="hover:bg-[var(--primary-light)]/40 transition-colors">
                    <td className="py-4 px-4 flex items-center gap-2">
                      {renderRankBadge(item.rank)}
                    </td>
                    <td className="py-4 px-4 font-semibold text-sm text-[var(--text)]">{item.username}</td>
                    <td className="py-4 px-4 text-center text-xs sm:text-sm">
                      <div className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
                        <Clock size={14} />
                        <span>{formatTime(item.timeTaken)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-[var(--primary)] text-base sm:text-lg">
                      {item.score}<span className="text-xs font-normal text-[var(--text-secondary)]">/10</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
