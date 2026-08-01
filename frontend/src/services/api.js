// Let's use standard localStorage wrappers for simplicity and compatibility!

export const API_URL = 'https://ai-aptitude-wdn5.onrender.com';

let cachedAccessToken = null;

export const setCachedToken = (token) => {
  cachedAccessToken = token;
};

export const getCachedToken = () => cachedAccessToken;

const request = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let token = cachedAccessToken;
  if (!token) {
    token = localStorage.getItem('access_token');
    if (token) {
      cachedAccessToken = token;
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    let response = await fetch(url, config);

    // Auto-refresh token on 401 Unauthorized
    if (response.status === 401 && endpoint !== '/api/auth/login' && endpoint !== '/api/auth/refresh-token') {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${cachedAccessToken}`;
        response = await fetch(url, { ...config, headers });
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
};

const attemptTokenRefresh = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();
    if (response.ok && data.accessToken) {
      cachedAccessToken = data.accessToken;
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      return true;
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      cachedAccessToken = null;
      return false;
    }
  } catch (error) {
    console.error('Token Refresh Interceptor Error:', error.message);
    return false;
  }
};

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};
