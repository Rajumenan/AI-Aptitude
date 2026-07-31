import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, LayoutDashboard, Trophy, Bell, User } from 'lucide-react';

const Navbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null; // Hide navbar for logged out users

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => navigate('/dashboard')}>
        <span className="nav-logo">🎓</span>
        <span>AI Quiz Platform</span>
      </div>

      <div className="nav-links">
        <a 
          className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </a>
        
        <a 
          className={`nav-link ${isActive('/leaderboard') ? 'active' : ''}`}
          onClick={() => navigate('/leaderboard')}
        >
          <Trophy size={16} />
          <span>Leaderboard</span>
        </a>

        <a 
          className={`nav-link ${isActive('/notifications') ? 'active' : ''}`}
          onClick={() => navigate('/notifications')}
        >
          <Bell size={16} />
          <span>Alerts</span>
        </a>

        <a 
          className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <User size={16} />
          <span>Profile</span>
        </a>

        <button className="theme-toggle" onClick={toggleTheme} title="Toggle visual theme">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <a className="nav-link" onClick={logout} style={{ color: 'var(--danger)', cursor: 'pointer' }} title="Log out">
          <LogOut size={16} />
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
