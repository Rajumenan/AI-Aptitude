import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';

const Login = ({ navigation }) => {
  const { theme } = useTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email.trim(), password);
      // Auth state update handles navigating in the navigation container
    } catch (err) {
      if (err.message && err.message.includes('not verified')) {
        setErrorMsg('Email not verified. Redirecting to OTP Verification...');
        setTimeout(() => {
          navigation.navigate('OTPVerification', { email: email.trim() });
        }, 1500);
      } else {
        setErrorMsg(err.message || 'Login failed. Please check credentials.');
      }
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
            <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Log in to challenge yourself with AI aptitude tests
            </Text>
          </View>

          {errorMsg ? (
            <View style={[styles.errorContainer, { backgroundColor: theme.danger + '15', borderColor: theme.danger }]}>
              <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
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

            <Text style={[styles.label, { color: theme.text }]}>Password</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.card, 
                color: theme.text,
                borderColor: theme.border
              }]}
              placeholder="Enter your password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPasswordButton}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 35,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
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
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Login;
