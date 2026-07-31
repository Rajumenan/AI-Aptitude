import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Import Screens
import Splash from '../screens/Splash';
import Login from '../screens/Login';
import Register from '../screens/Register';
import ForgotPassword from '../screens/ForgotPassword';
import OTPVerification from '../screens/OTPVerification';
import Dashboard from '../screens/Dashboard';
import Leaderboard from '../screens/Leaderboard';
import Notifications from '../screens/Notifications';
import Profile from '../screens/Profile';
import QuizScreen from '../screens/QuizScreen';
import ResultScreen from '../screens/ResultScreen';
import QuestionReview from '../screens/QuestionReview';
import PerformanceAnalysis from '../screens/PerformanceAnalysis';

// Import Icons
import { LayoutDashboard, Trophy, Bell, User as UserIcon } from 'lucide-react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for logged in users
const AppTabs = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const iconSize = 22;
          if (route.name === 'Dashboard') {
            return <LayoutDashboard size={iconSize} color={color} />;
          } else if (route.name === 'Leaderboard') {
            return <Trophy size={iconSize} color={color} />;
          } else if (route.name === 'Notifications') {
            return <Bell size={iconSize} color={color} />;
          } else if (route.name === 'Profile') {
            return <UserIcon size={iconSize} color={color} />;
          }
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: theme.card,
          borderBottomColor: theme.border,
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} options={{ title: 'AI Quiz Platform' }} />
      <Tab.Screen name="Leaderboard" component={Leaderboard} options={{ title: 'Rankings' }} />
      <Tab.Screen name="Notifications" component={Notifications} options={{ title: 'Alerts' }} />
      <Tab.Screen name="Profile" component={Profile} options={{ title: 'My Account' }} />
    </Tab.Navigator>
  );
};

// Root Stack Navigator
const AppNavigation = () => {
  const { theme, isDarkMode } = useTheme();
  const { user, isLoading } = useAuth();

  // Custom theme mapping for React Navigation
  const navigationTheme = {
    dark: isDarkMode,
    colors: {
      ... (isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
    },
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.card,
            borderBottomColor: theme.border,
            borderBottomWidth: 1,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 17,
          },
          headerBackTitleVisible: false,
        }}
      >
        {user === null ? (
          // Auth Stack
          <>
            <Stack.Screen name="Splash" component={Splash} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: 'Reset Credentials' }} />
            <Stack.Screen name="OTPVerification" component={OTPVerification} options={{ title: 'OTP Verification' }} />
          </>
        ) : (
          // App Stack (Authenticated)
          <>
            <Stack.Screen name="MainApp" component={AppTabs} options={{ headerShown: false }} />
            <Stack.Screen 
              name="QuizScreen" 
              component={QuizScreen} 
              options={{ 
                title: 'Aptitude Challenge',
                headerLeft: () => null, // Lock back gesture during ongoing quiz
                gestureEnabled: false, 
              }} 
            />
            <Stack.Screen 
              name="ResultScreen" 
              component={ResultScreen} 
              options={{ 
                title: 'Quiz Result',
                headerLeft: () => null,
                gestureEnabled: false,
              }} 
            />
            <Stack.Screen name="QuestionReview" component={QuestionReview} options={{ title: 'Review Answers' }} />
            <Stack.Screen name="PerformanceAnalysis" component={PerformanceAnalysis} options={{ title: 'AI Report' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;
