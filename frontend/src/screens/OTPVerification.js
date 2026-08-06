import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';

const OTPVerification = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { verifyOtp, resetPassword, resendOtp } = useAuth();
  
  const { email, isPasswordReset = false } = route.params || {};

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  React.useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      setLoading(true);
      const res = await resendOtp(email, isPasswordReset ? 'reset' : 'verification');
      if (res.success) {
        setSuccessMsg(res.message || 'OTP resent successfully!');
        setResendCooldown(60); // 60 seconds cooldown
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!otp || otp.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit OTP.');
      return;
    }

    if (isPasswordReset && (!newPassword || newPassword.length < 6)) {
      setErrorMsg('Please enter a new password (min. 6 characters).');
      return;
    }

    try {
      setLoading(true);
      if (isPasswordReset) {
        // Reset password mode
        const res = await resetPassword(email, otp.trim(), newPassword);
        if (res.success) {
          setSuccessMsg('Password reset successfully. Redirecting to Login...');
          setTimeout(() => {
            navigation.navigate('Login');
          }, 2000);
        }
      } else {
        // Standard registration verification mode
        const res = await verifyOtp(email, otp.trim());
        if (res.success) {
          setSuccessMsg('Account verified! Logging you in...');
          // Logging in sets 'user' which navigates to MainApp automatically
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Please check the OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Enter Verification Code</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              We sent a 6-digit code to <Text style={{ fontWeight: 'bold' }}>{email}</Text>. Check your email inbox.
            </Text>
          </View>

          {errorMsg ? (
            <View style={[styles.messageContainer, { backgroundColor: theme.danger + '15', borderColor: theme.danger }]}>
              <Text style={[styles.messageText, { color: theme.danger }]}>{errorMsg}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={[styles.messageContainer, { backgroundColor: theme.success + '15', borderColor: theme.success }]}>
              <Text style={[styles.messageText, { color: theme.success }]}>{successMsg}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.text }]}>One-Time Password (OTP)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.card, 
                color: theme.text,
                borderColor: theme.border
              }]}
              placeholder="123456"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              autoCapitalize="none"
              value={otp}
              onChangeText={setOtp}
            />

            {isPasswordReset ? (
              <>
                <Text style={[styles.label, { color: theme.text }]}>New Password</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.card, 
                    color: theme.text,
                    borderColor: theme.border
                  }]}
                  placeholder="Enter new password"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </>
            ) : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {isPasswordReset ? 'Reset Password' : 'Verify & Log In'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: theme.textSecondary }]}>Didn't receive the OTP? </Text>
            {resendCooldown > 0 ? (
              <Text style={[styles.resendLink, { color: theme.textSecondary, textDecorationLine: 'none' }]}>
                Resend in {resendCooldown}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                <Text style={[styles.resendLink, { color: theme.primary }]}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            style={styles.backButton}
          >
            <Text style={[styles.backText, { color: theme.primary }]}>Back to Log In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 4,
  },
  button: {
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 15,
    padding: 10,
  },
  backText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default OTPVerification;
