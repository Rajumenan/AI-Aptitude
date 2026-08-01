import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, LayoutDashboard, Trophy, Bell, User, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { label: 'Alerts', path: '/notifications', icon: Bell },
    { label: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[var(--card)] border-b border-[var(--border)] shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-2 font-[var(--font-heading)] font-extrabold text-lg sm:text-xl text-[var(--text)] cursor-pointer select-none"
          onClick={() => handleNavClick('/dashboard')}
        >
          <span className="text-2xl">🎓</span>
          <span className="truncate">AI Quiz Platform</span>
        </div>

        {/* Desktop Navigation Links (md:flex) */}
        <nav className="hidden md:flex items-center gap-2 sm:gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] text-sm font-semibold transition-all cursor-pointer ${
                  active 
                    ? 'text-[var(--primary)] bg-[var(--primary-light)]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)]'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="h-5 w-px bg-[var(--border)] mx-1" />

          {/* Theme Toggle Button */}
          <button 
            className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-colors cursor-pointer"
            onClick={toggleTheme} 
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Logout Button */}
          <button 
            onClick={logout} 
            className="p-2 rounded-full text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors cursor-pointer" 
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        </nav>

        {/* Mobile Header Actions (md:hidden) */}
        <div className="flex md:hidden items-center gap-2">
          <button 
            className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-colors cursor-pointer"
            onClick={toggleTheme} 
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[var(--text)] hover:bg-[var(--border)] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--card)] px-4 pt-2 pb-4 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors w-full text-left cursor-pointer ${
                    active 
                      ? 'text-[var(--primary)] bg-[var(--primary-light)] font-bold' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)]'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="my-2 border-t border-[var(--border)]" />

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors w-full text-left cursor-pointer"
            >
              <LogOut size={20} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
