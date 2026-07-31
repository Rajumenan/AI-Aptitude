import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import { User, Settings as SettingsIcon, ShieldQuestion, HelpCircle, Info, LogOut, Award, Calendar, CheckCircle2, ChevronRight, X } from 'lucide-react-native';

const Profile = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, logout, refreshUserProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  
  // Settings switches
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  
  // Modals state
  const [activeTab, setActiveTab] = useState('stats'); // stats | settings | help | about
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await refreshUserProfile();
      if (data) {
        setProfileData(data);
        setPushEnabled(data.settings.notificationsEnabled);
        setEmailEnabled(data.settings.emailNotifications);
      }
    } catch (error) {
      console.log('Error pulling profile details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const updateSettingState = async (settingKey, value) => {
    try {
      const payload = {};
      if (settingKey === 'push') {
        setPushEnabled(value);
        payload.notificationsEnabled = value;
      } else if (settingKey === 'email') {
        setEmailEnabled(value);
        payload.emailNotifications = value;
      }
      await api.put('/api/profile/settings', payload);
    } catch (error) {
      console.log('Failed updating preference on backend:', error.message);
    }
  };

  const handleToggleDarkMode = async () => {
    toggleTheme();
    try {
      // Persist the opposite dark mode setting to backend
      await api.put('/api/profile/settings', { darkMode: !isDarkMode });
    } catch (error) {
      console.log('Failed syncing dark mode to backend:', error.message);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', onPress: logout, style: 'destructive' }
    ]);
  };

  const openCertificate = (cert) => {
    setSelectedCert(cert);
    setCertificateModalVisible(true);
  };

  return (
    <ScreenWrapper scroll contentContainerStyle={styles.container}>
      {/* Profile Header Card */}
      <View style={[styles.profileHeader, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
          <User size={38} color={theme.primary} />
        </View>
        <Text style={[styles.usernameText, { color: theme.text }]}>{user?.username || 'Learner'}</Text>
        <Text style={[styles.emailText, { color: theme.textSecondary }]}>{user?.email || ''}</Text>
      </View>

      {/* Tabs Switcher */}
      <View style={[styles.tabsRow, { borderBottomColor: theme.border }]}>
        {['stats', 'settings', 'help', 'about'].map((tab) => (
          <TouchableOpacity 
            key={tab}
            style={[
              styles.tabItem, 
              activeTab === tab && { borderBottomColor: theme.primary, borderBottomWidth: 3 }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabItemText, 
              { color: activeTab === tab ? theme.primary : theme.textSecondary }
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Contents */}
      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.tabContentContainer}>
          {/* STATS & CERTIFICATES TAB */}
          {activeTab === 'stats' && (
            <View>
              {/* Performance Cards */}
              <View style={styles.grid}>
                <View style={[styles.gridCell, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.cellNum, { color: theme.primary }]}>
                    {profileData?.stats.totalQuizzes || 0}
                  </Text>
                  <Text style={[styles.cellLabel, { color: theme.textSecondary }]}>Quizzes Taken</Text>
                </View>
                <View style={[styles.gridCell, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.cellNum, { color: theme.primary }]}>
                    {profileData?.stats.averageAccuracy || 0}%
                  </Text>
                  <Text style={[styles.cellLabel, { color: theme.textSecondary }]}>Avg Accuracy</Text>
                </View>
                <View style={[styles.gridCell, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.cellNum, { color: theme.primary }]}>
                    {profileData?.stats.certificatesCount || 0}
                  </Text>
                  <Text style={[styles.cellLabel, { color: theme.textSecondary }]}>Certificates</Text>
                </View>
                <View style={[styles.gridCell, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.cellNum, { color: theme.primary }]}>
                    {Math.round((profileData?.stats.totalTimeSpent || 0) / 60)}m
                  </Text>
                  <Text style={[styles.cellLabel, { color: theme.textSecondary }]}>Total Time</Text>
                </View>
                <View style={[styles.gridCell, { backgroundColor: '#FF6B3510', borderColor: '#FF6B3540' }]}>
                  <Text style={[styles.cellNum, { color: '#FF6B35' }]}>
                    🔥 {profileData?.stats.currentStreak || 0}
                  </Text>
                  <Text style={[styles.cellLabel, { color: '#FF6B35' }]}>Day Streak</Text>
                </View>
                <View style={[styles.gridCell, { backgroundColor: '#F59E0B10', borderColor: '#F59E0B40' }]}>
                  <Text style={[styles.cellNum, { color: '#F59E0B' }]}>
                    🪙 {profileData?.stats.tokens || 0}
                  </Text>
                  <Text style={[styles.cellLabel, { color: '#F59E0B' }]}>Tokens</Text>
                </View>
              </View>

              {/* Certificates List */}
              <View style={styles.certListContainer}>
                <Text style={[styles.subSectionTitle, { color: theme.text }]}>Unlocked Certificates</Text>
                {profileData?.certificates.length === 0 ? (
                  <View style={[styles.noCertCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Award size={36} color={theme.textSecondary} style={{ opacity: 0.5, marginBottom: 8 }} />
                    <Text style={[styles.noCertText, { color: theme.textSecondary }]}>
                      Score 70% or higher in any quiz to earn a Certificate.
                    </Text>
                  </View>
                ) : (
                  profileData?.certificates.map((cert, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.certRow, { backgroundColor: theme.card, borderColor: theme.border }]}
                      onPress={() => openCertificate(cert)}
                    >
                      <View style={[styles.certIconBg, { backgroundColor: '#F59E0B' + '20' }]}>
                        <Award size={20} color="#F59E0B" />
                      </View>
                      <View style={styles.certTextCol}>
                        <Text style={[styles.certLevelText, { color: theme.text }]}>{cert.level} Level</Text>
                        <Text style={[styles.certMetaText, { color: theme.textSecondary }]}>
                          Score: {cert.score}/10 | {new Date(cert.dateGenerated).toLocaleDateString()}
                        </Text>
                      </View>
                      <ChevronRight size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {/* Dark Mode */}
              <View style={styles.settingsRow}>
                <View style={styles.settingLabelContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Dark Mode</Text>
                  <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>Switch visual interface appearance</Text>
                </View>
                <Switch value={isDarkMode} onValueChange={handleToggleDarkMode} />
              </View>

              <View style={styles.settingLine} />

              {/* Push Notification */}
              <View style={styles.settingsRow}>
                <View style={styles.settingLabelContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Push Notifications</Text>
                  <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>Earn alerts on quiz score releases</Text>
                </View>
                <Switch value={pushEnabled} onValueChange={(val) => updateSettingState('push', val)} />
              </View>

              <View style={styles.settingLine} />

              {/* Email Notifications */}
              <View style={styles.settingsRow}>
                <View style={styles.settingLabelContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Email Notifications</Text>
                  <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>Receive quiz progress newsletters</Text>
                </View>
                <Switch value={emailEnabled} onValueChange={(val) => updateSettingState('email', val)} />
              </View>
            </View>
          )}

          {/* HELP CENTER TAB */}
          {activeTab === 'help' && (
            <View style={[styles.helpCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: theme.text }]}>How does the AI generate questions?</Text>
                <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                  The platform integrates Google Gemini API to generate unique conceptual aptitude questions tailored to your selected difficulty level on demand.
                </Text>
              </View>
              <View style={styles.faqLine} />
              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: theme.text }]}>What are the requirements for certificate?</Text>
                <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                  You must answer at least 7 out of 10 questions correctly (scoring 70% or more) in any quiz session to unlock a Certificate of Achievement.
                </Text>
              </View>
              <View style={styles.faqLine} />
              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: theme.text }]}>Can I resume a quiz after closing the app?</Text>
                <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                  Yes, active sessions are saved to the server. Tapping the "Resume Quiz" banner on your dashboard lets you continue right where you left off.
                </Text>
              </View>
            </View>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <View style={[styles.aboutCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.aboutTitle, { color: theme.text }]}>AI Aptitude Quiz Platform</Text>
              <Text style={[styles.aboutDesc, { color: theme.textSecondary }]}>
                A complete enterprise-grade aptitude testing interface powered by generative artificial intelligence.
              </Text>
              <View style={styles.aboutMetaRow}>
                <Text style={[styles.aboutMetaLabel, { color: theme.textSecondary }]}>App Version</Text>
                <Text style={[styles.aboutMetaValue, { color: theme.text }]}>1.0.0 (Stable)</Text>
              </View>
              <View style={styles.aboutMetaRow}>
                <Text style={[styles.aboutMetaLabel, { color: theme.textSecondary }]}>Developer Platform</Text>
                <Text style={[styles.aboutMetaValue, { color: theme.text }]}>React Native / Node.js</Text>
              </View>
            </View>
          )}

          {/* Logout Button */}
          <TouchableOpacity 
            style={[styles.logoutBtn, { borderColor: theme.danger }]}
            onPress={handleLogout}
          >
            <LogOut size={18} color={theme.danger} style={{ marginRight: 8 }} />
            <Text style={[styles.logoutText, { color: theme.danger }]}>Log Out Session</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CERTIFICATE MODAL VIEW */}
      {selectedCert && (
        <Modal
          visible={certificateModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCertificateModalVisible(false)}
        >
          <View style={styles.modalBg}>
            <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
              {/* Header Close */}
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setCertificateModalVisible(false)}
              >
                <X size={22} color={theme.text} />
              </TouchableOpacity>

              {/* Certificate Border frame */}
              <View style={[styles.certFrame, { borderColor: '#F59E0B' }]}>
                <Award size={48} color="#F59E0B" style={styles.certBadge} />
                <Text style={styles.certHeader}>CERTIFICATE OF ACHIEVEMENT</Text>
                <Text style={styles.certSubHeader}>AI APTITUDE QUIZ PLATFORM</Text>
                
                <View style={styles.dividerLine} />

                <Text style={styles.certBodyLabel}>This certificate is proudly awarded to</Text>
                <Text style={styles.certUser}>{user?.username || 'Learner'}</Text>
                
                <Text style={styles.certTextDetails}>
                  for successfully demonstrating skills in the
                </Text>
                <Text style={styles.certLevel}>{selectedCert.level} Level Quiz</Text>
                <Text style={styles.certScore}>Score: {selectedCert.score}/10 (Accuracy: {selectedCert.score * 10}%)</Text>

                <View style={styles.dividerLine} />

                <View style={styles.certFooter}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.certFooterLabel}>DATE GENERATED</Text>
                    <Text style={styles.certFooterValue}>{new Date(selectedCert.dateGenerated).toLocaleDateString()}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.certFooterLabel}>VERIFICATION CODE</Text>
                    <Text style={styles.certFooterValue} numberOfLines={1}>
                      {selectedCert.certificateId.slice(0, 8).toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  usernameText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 13,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tabItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContentContainer: {
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridCell: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  cellNum: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cellLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  certListContainer: {
    marginTop: 10,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  noCertCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  noCertText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  certIconBg: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  certTextCol: {
    flex: 1,
  },
  certLevelText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  certMetaText: {
    fontSize: 11,
  },
  settingsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 11,
  },
  settingLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  helpCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  faqItem: {
    paddingVertical: 6,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
  },
  faqLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  aboutCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  aboutDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  aboutMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  aboutMetaLabel: {
    fontSize: 13,
  },
  aboutMetaValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 25,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalCloseBtn: {
    alignSelf: 'flex-end',
    padding: 6,
    marginBottom: 5,
  },
  certFrame: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFFBF0', // Classical certificate background
  },
  certBadge: {
    marginBottom: 12,
  },
  certHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E1E24',
    textAlign: 'center',
    letterSpacing: 1,
  },
  certSubHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 2,
  },
  dividerLine: {
    width: '80%',
    height: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: 14,
  },
  certBodyLabel: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#6B7280',
    marginBottom: 8,
  },
  certUser: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  certTextDetails: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
  },
  certLevel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E1E24',
    marginBottom: 4,
  },
  certScore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F9D58',
    marginBottom: 10,
  },
  certFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  certFooterLabel: {
    fontSize: 8,
    color: '#9CA3AF',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  certFooterValue: {
    fontSize: 10,
    color: '#374151',
    fontWeight: 'bold',
  },
});

export default Profile;
