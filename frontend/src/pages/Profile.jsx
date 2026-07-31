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
    <div className="animated" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Profile Info Header */}
      <div style={styles.profileHeader}>
        <div style={styles.avatar}>
          <User size={38} color="var(--primary)" />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{user?.username || 'Learner'}</h2>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user?.email}</span>
      </div>

      {/* Tabs */}
      <div style={styles.tabsRow}>
        {['stats', 'settings', 'help', 'about'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'var(--transition)'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ width: '35px', height: '35px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
      ) : (
        <div style={{ minHeight: '300px' }}>
          {/* STATS & CERTIFICATES */}
          {activeTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="stats-grid">
                <div className="stats-card">
                  <span className="stats-num">{profileData?.stats.totalQuizzes || 0}</span>
                  <span className="stats-label">QUIZZES TAKEN</span>
                </div>
                <div className="stats-card">
                  <span className="stats-num">{profileData?.stats.averageAccuracy || 0}%</span>
                  <span className="stats-label">ACCURACY RATE</span>
                </div>
                <div className="stats-card">
                  <span className="stats-num">{profileData?.stats.certificatesCount || 0}</span>
                  <span className="stats-label">CERTIFICATES</span>
                </div>
                <div className="stats-card">
                  <span className="stats-num">{Math.round((profileData?.stats.totalTimeSpent || 0) / 60)}m</span>
                  <span className="stats-label">TOTAL MINUTES</span>
                </div>
              </div>

              {/* Certificates */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px' }}>Unlocked Certificates</h3>
                {profileData?.certificates.length === 0 ? (
                  <div style={styles.emptyBox}>
                    <Award size={36} style={{ color: 'var(--text-secondary)', opacity: 0.5, marginBottom: '8px' }} />
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                      Earn score &ge; 70% in any quiz to unlock a Certificate of Achievement.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {profileData?.certificates.map((cert, index) => (
                      <div 
                        key={index} 
                        style={styles.certRow}
                        onClick={() => viewCertificate(cert)}
                      >
                        <div style={styles.certIconBg}>
                          <Award size={20} color="#F59E0B" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{cert.level} Level Certificate</h4>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Score: {cert.score}/10 | Date: {new Date(cert.dateGenerated).toLocaleDateString()}
                          </span>
                        </div>
                        <ChevronRight size={16} color="var(--text-secondary)" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div style={styles.cardContainer}>
              <div style={styles.settingsRow}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Dark Mode Theme</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Switch visual colors scheme</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={isDarkMode} 
                  onChange={handleToggleDarkMode} 
                  style={styles.switch}
                />
              </div>

              <div style={styles.line} />

              <div style={styles.settingsRow}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Push Notifications</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Get live score updates and alerts</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={pushEnabled} 
                  onChange={(e) => updatePreference('push', e.target.checked)} 
                  style={styles.switch}
                />
              </div>

              <div style={styles.line} />

              <div style={styles.settingsRow}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Email Alerts</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Receive certificates pdf files by email</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={emailEnabled} 
                  onChange={(e) => updatePreference('email', e.target.checked)} 
                  style={styles.switch}
                />
              </div>
            </div>
          )}

          {/* HELP CENTER */}
          {activeTab === 'help' && (
            <div style={styles.cardContainer}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>How does the AI question generator work?</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    The backend API is integrated with the Google Gemini API to dynamically generate unique, level-specific questions for your quiz. A local fallback question bank is triggered if network issues arise.
                  </p>
                </div>
                <div style={styles.line} />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>What score is required for a certificate?</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    You must score at least 7 out of 10 correct answers (scoring 70% or more) in any quiz session to earn a certificate.
                  </p>
                </div>
                <div style={styles.line} />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>Can I resume an active quiz?</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    Yes, quiz states are stored on the server. If you accidentally close your browser, a resume warning card will be displayed on the Dashboard to let you continue from the same question.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ABOUT */}
          {activeTab === 'about' && (
            <div style={styles.cardContainer}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <span style={{ fontSize: '32px' }}>🎓</span>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '800' }}>AI Aptitude Quiz Platform</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Vite Web App v1.0.0 (Stable)</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                An enterprise-level adaptive testing platform compiling aptitude assessments. Powered by Express APIs, MongoDB storage clusters, and Google Gemini AI models.
              </p>
              <div style={styles.line} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Core Architecture</span>
                <span style={{ fontWeight: '700' }}>Node.js / Express / Mongoose</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Client Frontend</span>
                <span style={{ fontWeight: '700' }}>React Single Page App (Vite)</span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button 
            onClick={triggerLogout}
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', borderColor: 'var(--danger)', color: 'var(--danger)', marginTop: '20px' }}
          >
            <LogOut size={16} />
            <span>Logout Session</span>
          </button>
        </div>
      )}

      {/* MOCK CERTIFICATE VIEWER MODAL */}
      {selectedCert && certificateModalVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <button style={styles.closeBtn} onClick={() => setCertificateModalVisible(false)}>
              <X size={20} />
            </button>

            {/* Classical Certificate Design */}
            <div style={styles.certFrame}>
              <Award size={48} color="#F59E0B" style={{ marginBottom: '10px' }} />
              <h2 style={styles.certTitle}>CERTIFICATE OF ACHIEVEMENT</h2>
              <span style={styles.certSubTitle}>AI APTITUDE QUIZ PLATFORM</span>
              
              <div style={styles.certLine} />
              
              <p style={styles.certItalic}>This certificate is proudly awarded to</p>
              <h1 style={styles.certUser}>{user?.username || 'Learner'}</h1>
              
              <p style={{ fontSize: '11px', color: '#6B7280', margin: '8px 0' }}>
                for successfully demonstrating knowledge in the
              </p>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E1E24' }}>
                {selectedCert.level} Level Aptitude Quiz
              </h3>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#10B981' }}>
                Score: {selectedCert.score}/10 (Accuracy: {selectedCert.score * 10}%)
              </span>

              <div style={styles.certLine} />

              <div style={styles.certFooter}>
                <div>
                  <span style={styles.certFooterLabel}>DATE GENERATED</span>
                  <span style={styles.certFooterVal}>{new Date(selectedCert.dateGenerated).toLocaleDateString()}</span>
                </div>
                <div>
                  <span style={styles.certFooterLabel}>VERIFICATION ID</span>
                  <span style={styles.certFooterVal}>{selectedCert.certificateId.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  profileHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 4px 12px var(--shadow)',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  usernameText: {
    fontSize: '20px',
    fontWeight: '800',
  },
  emailText: {
    fontSize: '12px',
  },
  tabsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    borderBottom: '1px solid var(--border)',
    marginBottom: '5px',
  },
  emptyBox: {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  certRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '12px 20px',
    backgroundColor: 'var(--card)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  certIconBg: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#F59E0B15',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    boxShadow: '0 4px 12px var(--shadow)',
  },
  settingsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
  },
  switch: {
    width: '44px',
    height: '22px',
    cursor: 'pointer',
  },
  line: {
    height: '1px',
    backgroundColor: 'var(--border)',
    margin: '16px 0',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalCard: {
    backgroundColor: 'var(--card)',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '460px',
    padding: '16px',
    position: 'relative',
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  certFrame: {
    border: '2px solid #F59E0B',
    borderRadius: '10px',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#FFFBF0', // Traditional parchment styling
  },
  certTitle: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#1E1E24',
    letterSpacing: '1px',
    marginTop: '6px',
  },
  certSubTitle: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: '2px',
  },
  certLine: {
    height: '1px',
    backgroundColor: '#D1D5DB',
    margin: '12px auto',
    width: '80%',
  },
  certItalic: {
    fontSize: '11px',
    fontStyle: 'italic',
    color: '#6B7280',
  },
  certUser: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#111827',
    margin: '4px 0',
  },
  certFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    textAlign: 'left',
    marginTop: '15px',
    padding: '0 6px',
  },
  certFooterLabel: {
    display: 'block',
    fontSize: '7px',
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: '0.5px',
  },
  certFooterVal: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#374151',
  }
};

export default Profile;
