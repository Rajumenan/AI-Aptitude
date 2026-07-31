import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Layout Components
import Navbar from './components/Navbar';

// Import Pages
import Splash from './pages/Splash';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import OTPVerification from './pages/OTPVerification';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import QuizScreen from './pages/QuizScreen';
import ResultScreen from './pages/ResultScreen';
import QuestionReview from './pages/QuestionReview';
import PerformanceAnalysis from './pages/PerformanceAnalysis';

// Route protection middleware
const PrivateRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--background)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>Verifying credentials...</span>
        </div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Access Paths */}
                <Route path="/" element={<Splash />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/otp-verification" element={<OTPVerification />} />

                {/* Secured Dashboard Paths */}
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
                <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/quiz/:sessionId" element={<PrivateRoute><QuizScreen /></PrivateRoute>} />
                <Route path="/results/:sessionId" element={<PrivateRoute><ResultScreen /></PrivateRoute>} />
                <Route path="/review/:sessionId" element={<PrivateRoute><QuestionReview /></PrivateRoute>} />
                <Route path="/analysis/:sessionId" element={<PrivateRoute><PerformanceAnalysis /></PrivateRoute>} />

                {/* Catch-all Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
