import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const Splash = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, isLoading } = useAuth();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate based on auth status after delay
    const timer = setTimeout(() => {
      if (!isLoading) {
        // AppNavigation checks auth state globally, but this helps route correctly initially
        if (user) {
          navigation.replace('MainApp');
        } else {
          navigation.replace('Login');
        }
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isLoading, user]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[
        styles.logoContainer, 
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        <View style={[styles.iconPlaceholder, { backgroundColor: theme.primary }]}>
          <Text style={styles.iconText}>🎓</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>AI Aptitude Quiz</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Test & refine your analytical skill set
        </Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          Powered by Google Gemini AI
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  iconText: {
    fontSize: 45,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
  },
});

export default Splash;
