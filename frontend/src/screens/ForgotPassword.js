import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';

const ForgotPassword = ({ navigation }) => {
  const { theme } = useTheme();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword(email.trim());
      if (res.success) {
        setSuccessMsg('A password reset OTP has been sent to your email.');
        setTimeout(() => {
          navigation.navigate('OTPVerification', { 
            email: email.trim(), 
            isPasswordReset: true 
          });
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to request reset OTP. Ensure the email is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Forgot Password</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Enter your registered email address. We will send you a 6-digit OTP to reset your password.
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
          <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.card, 
              color: theme.text,
              borderColor: theme.border
            }]}
            placeholder="e.g. name@domain.com"
            placeholderTextColor={theme.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleRequestOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: theme.primary }]}>Back to Log In</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
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
    marginBottom: 20,
  },
  button: {
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default ForgotPassword;
