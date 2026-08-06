import React, { createContext, useState, useEffect, useContext } from 'react';
import { api, setCachedToken } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hydrateSession = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (accessToken && refreshToken) {
          setCachedToken(accessToken);
          try {
            const data = await api.get('/api/profile/me');
            setUser(data.profile);
          } catch (profileError) {
            console.log('Session hydration token refresh pending on access');
          }
        }
      } catch (error) {
        console.error('Session hydration failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    hydrateSession();
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const data = await api.post('/api/auth/login', { email, password });
      if (data.success) {
        setCachedToken(data.accessToken);
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: 'Invalid response' };
    } catch (error) {
      console.error('Login Auth Error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setIsLoading(true);
      return await api.post('/api/auth/register', { username, email, password });
    } catch (error) {
      console.error('Register Auth Error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (token) => {
    try {
      setIsLoading(true);
      const data = await api.post('/api/auth/google-login', { token });
      if (data.success) {
        setCachedToken(data.accessToken);
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: 'Invalid response' };
    } catch (error) {
      console.error('Google Login Auth Error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      setIsLoading(true);
      const data = await api.post('/api/auth/verify-otp', { email, otp });
      if (data.success) {
        setCachedToken(data.accessToken);
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: 'Verification failed' };
    } catch (error) {
      console.error('Verify OTP Auth Error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setIsLoading(true);
      return await api.post('/api/auth/forgot-password', { email });
    } catch (error) {
      console.error('Forgot Password Auth Error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async (email, type = 'verification') => {
    try {
      setIsLoading(true);
      return await api.post('/api/auth/resend-otp', { email, type });
    } catch (error) {
      console.error('Resend OTP Auth Error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      setIsLoading(true);
      return await api.post('/api/auth/reset-password', { email, otp, newPassword });
    } catch (error) {
      console.error('Reset Password Auth Error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/api/auth/logout', { refreshToken }).catch(() => {});
      }
    } catch (error) {
      console.log('Error during logout API call:', error.message);
    } finally {
      setCachedToken(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    try {
      const data = await api.get('/api/profile/me');
      setUser(data.profile);
      return data;
    } catch (error) {
      console.error('Failed refreshing stats profiles:', error.message);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      googleLogin,
      verifyOtp,
      forgotPassword,
      resetPassword,
      resendOtp,
      logout,
      refreshUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
