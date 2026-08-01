import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Settings as SettingsIcon, Award, LogOut, ChevronRight, X, HelpCircle, Info, CheckCircle } from 'lucide-react';

const Profile = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout, refreshUserProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  
  // Settings preferences
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  // Tabs switches
  const [activeTab, setActiveTab] = useState('stats'); // stats | settings | help | about
  
  // Certificate Modals
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const fetchProfileDetails = async () => {
    try {
      setLoading(true);
      const data = await refreshUserProfile();
      if (data) {
        setProfileData(data);
        setPushEnabled(data.settings.notificationsEnabled);
        setEmailEnabled(data.settings.emailNotifications);
      }
    } catch (error) {
      console.log('Failed loading profile settings:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const updatePreference = async (key, val) => {
    try {
      const body = {};
      if (key === 'push') {
        setPushEnabled(val);
        body.notificationsEnabled = val;
      } else {
        setEmailEnabled(val);
        body.emailNotifications = val;
      }
      await api.put('/api/profile/settings', body);
    } catch (error) {
      console.log('Failed updating preference:', error.message);
    }
  };

  const handleToggleDarkMode = async () => {
    toggleTheme();
    try {
      await api.put('/api/profile/settings', { darkMode: !isDarkMode });
    } catch (error) {
      console.log('Failed syncing dark mode to server:', error.message);
    }
  };

  const triggerLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to log out of your session?');
    if (confirmLogout) {
      logout();
    }
  };

  const viewCertificate = (cert) => {
    setSelectedCert(cert);
    setCertificateModalVisible(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Profile Info Header */}
      <div className="flex flex-col items-center p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[var(--primary-light)] flex items-center justify-center mb-3">
          <User size={36} className="text-[var(--primary)]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text)]">{user?.username || 'Learner'}</h2>
        <span className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">{user?.email}</span>
      </div>

      {/* Responsive Navigation Tabs */}
      <div className="flex justify-center border-b border-[var(--border)] overflow-x-auto scrollbar-none">
        {['stats', 'settings', 'help', 'about'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap border-b-2 ${
              activeTab === tab 
                ? 'text-[var(--primary)] border-[var(--primary)]' 
                : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text)]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 rounded-full border-3 border-[var(--border)] border-t-[var(--primary)] animate-spin mx-auto" />
        </div>
      ) : (
        <div className="min-h-[300px]">
          {/* STATS & CERTIFICATES */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="stats-card w-full">
                  <span className="stats-num text-xl sm:text-2xl">{profileData?.stats.totalQuizzes || 0}</span>
                  <span className="stats-label text-[10px] sm:text-xs">QUIZZES TAKEN</span>
                </div>
                <div className="stats-card w-full">
                  <span className="stats-num text-xl sm:text-2xl">{profileData?.stats.averageAccuracy || 0}%</span>
                  <span className="stats-label text-[10px] sm:text-xs">ACCURACY RATE</span>
                </div>
                <div className="stats-card w-full">
                  <span className="stats-num text-xl sm:text-2xl">{profileData?.stats.certificatesCount || 0}</span>
                  <span className="stats-label text-[10px] sm:text-xs">CERTIFICATES</span>
                </div>
                <div className="stats-card w-full">
                  <span className="stats-num text-xl sm:text-2xl">{Math.round((profileData?.stats.totalTimeSpent || 0) / 60)}m</span>
                  <span className="stats-label text-[10px] sm:text-xs">TOTAL MINUTES</span>
                </div>
              </div>

              {/* Certificates List */}
              <div>
                <h3 className="text-base sm:text-lg font-bold mb-3 text-[var(--text)]">Unlocked Certificates</h3>
                {profileData?.certificates.length === 0 ? (
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 flex flex-col items-center text-center">
                    <Award size={36} className="text-[var(--text-secondary)] opacity-50 mb-2" />
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                      Earn score &ge; 70% in any quiz to unlock a Certificate of Achievement.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {profileData?.certificates.map((cert, index) => (
                      <div 
                        key={index} 
                        onClick={() => viewCertificate(cert)}
                        className="flex items-center gap-3 p-3 sm:p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--primary)] transition-all"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#F59E0B15] flex items-center justify-center shrink-0">
                          <Award size={20} color="#F59E0B" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-[var(--text)] truncate">{cert.level} Level Certificate</h4>
                          <span className="text-xs text-[var(--text-secondary)]">
                            Score: {cert.score}/10 | Date: {new Date(cert.dateGenerated).toLocaleDateString()}
                          </span>
                        </div>
                        <ChevronRight size={16} className="text-[var(--text-secondary)] shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-sm divide-y divide-[var(--border)] space-y-4">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[var(--text)]">Dark Mode Theme</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Switch visual color scheme</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={isDarkMode} 
                  onChange={handleToggleDarkMode} 
                  className="w-10 h-5 cursor-pointer accent-[var(--primary)]"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[var(--text)]">Push Notifications</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Get live score updates and alerts</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={pushEnabled} 
                  onChange={(e) => updatePreference('push', e.target.checked)} 
                  className="w-10 h-5 cursor-pointer accent-[var(--primary)]"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[var(--text)]">Email Alerts</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Receive certificate updates by email</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={emailEnabled} 
                  onChange={(e) => updatePreference('email', e.target.checked)} 
                  className="w-10 h-5 cursor-pointer accent-[var(--primary)]"
                />
              </div>
            </div>
          )}

          {/* HELP CENTER */}
          {activeTab === 'help' && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[var(--text)] mb-1">How does the AI question generator work?</h4>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  The backend API connects to Google Gemini AI models to dynamically generate level-specific questions for your quiz session.
                </p>
              </div>
              <div className="border-t border-[var(--border)] pt-3">
                <h4 className="text-sm font-bold text-[var(--text)] mb-1">What score is required for a certificate?</h4>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  You must score at least 7 out of 10 correct answers (70% accuracy or higher) to unlock an official certificate.
                </p>
              </div>
              <div className="border-t border-[var(--border)] pt-3">
                <h4 className="text-sm font-bold text-[var(--text)] mb-1">Can I resume an active quiz?</h4>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Yes, session state is preserved on the server. If you leave or refresh, a resume banner will appear on the Dashboard.
                </p>
              </div>
            </div>
          )}

          {/* ABOUT */}
          {activeTab === 'about' && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎓</span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text)]">AI Aptitude Quiz Platform</h3>
                  <span className="text-xs text-[var(--text-secondary)]">Vite Single Page Web App v1.0.0</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                An adaptive testing platform built with React, Vite, Node.js Express APIs, MongoDB storage, and Google Gemini AI.
              </p>
              <div className="border-t border-[var(--border)] pt-3 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Core Architecture</span>
                  <span className="font-bold text-[var(--text)]">Node.js / Express / MongoDB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Client Frontend</span>
                  <span className="font-bold text-[var(--text)]">React + Vite + Tailwind CSS</span>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button 
            onClick={triggerLogout}
            className="w-full mt-6 h-12 flex items-center justify-center gap-2 border-2 border-[var(--danger)] text-[var(--danger)] rounded-xl font-bold hover:bg-[var(--danger-light)] transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            <span>Logout Session</span>
          </button>
        </div>
      )}

      {/* CERTIFICATE MODAL */}
      {selectedCert && certificateModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[var(--card)] rounded-2xl w-full max-w-md p-4 sm:p-6 relative shadow-2xl">
            <button 
              className="absolute top-3 right-3 p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-colors cursor-pointer" 
              onClick={() => setCertificateModalVisible(false)}
            >
              <X size={20} />
            </button>

            {/* Classical Certificate Card */}
            <div className="border-2 border-[#F59E0B] rounded-xl p-4 sm:p-6 text-center bg-[#FFFBF0] text-gray-900">
              <Award size={44} className="text-[#F59E0B] mx-auto mb-2" />
              <h2 className="text-base sm:text-lg font-black tracking-wider text-gray-900">CERTIFICATE OF ACHIEVEMENT</h2>
              <span className="text-[10px] font-bold text-gray-500 tracking-widest block mt-0.5">AI APTITUDE QUIZ PLATFORM</span>
              
              <div className="h-px bg-gray-300 w-3/4 mx-auto my-3" />
              
              <p className="text-xs italic text-gray-600">This certificate is proudly awarded to</p>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 my-1">{user?.username || 'Learner'}</h1>
              
              <p className="text-[11px] text-gray-500 my-1">
                for demonstrating knowledge in the
              </p>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                {selectedCert.level} Level Aptitude Quiz
              </h3>
              <span className="text-xs font-bold text-emerald-600 block mt-1">
                Score: {selectedCert.score}/10 (Accuracy: {selectedCert.score * 10}%)
              </span>

              <div className="h-px bg-gray-300 w-3/4 mx-auto my-3" />

              <div className="flex justify-between text-left text-[10px] text-gray-600 mt-3 pt-1">
                <div>
                  <span className="block font-bold text-gray-400">DATE GENERATED</span>
                  <span className="font-bold text-gray-800">{new Date(selectedCert.dateGenerated).toLocaleDateString()}</span>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-gray-400">VERIFICATION ID</span>
                  <span className="font-bold text-gray-800">{selectedCert.certificateId.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
