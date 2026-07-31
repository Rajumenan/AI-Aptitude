import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';

const Register = ({ navigation }) => {
  const { theme } = useTheme();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setErrorMsg('');

    if (!username || !email || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (username.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      const data = await register(username.trim(), email.trim(), password);
      
      if (data.success) {
        // Navigate to verification screen
        navigation.navigate('OTPVerification', { email: email.trim() });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
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
            <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Join the AI Aptitude Quiz Platform to start learning
            </Text>
          </View>

          {errorMsg ? (
            <View style={[styles.errorContainer, { backgroundColor: theme.danger + '15', borderColor: theme.danger }]}>
              <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.text }]}>Username</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.card, 
                color: theme.text,
                borderColor: theme.border
              }]}
              placeholder="e.g. smartCoder"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />

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
              placeholder="Min. 6 characters"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>Log In</Text>
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
    marginBottom: 30,
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

export default Register;
