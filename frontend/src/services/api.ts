import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE = 'http://localhost:8080/api';

// Safe localStorage access
const getStorageItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const setStorageItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage not available');
  }
};

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getStorageItem('accessToken');
    const hadAuth = Boolean(token);
    console.log('API Request interceptor:', { 
      url: config.url, 
      method: config.method,
      hasToken: hadAuth,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
    });
    if (hadAuth) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set:', config.headers.Authorization?.substring(0, 30) + '...');
    }
    (config as typeof config & { _hadAuth?: boolean })._hadAuth = hadAuth;
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean; _hadAuth?: boolean };
    const hadAuth = Boolean(originalRequest?._hadAuth);

    if (error.response?.status === 401 && !originalRequest._retry && hadAuth) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      // If no refresh token, immediately logout
      if (!refreshToken) {
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE}/auth/refresh`, 
          { refreshToken },
          { timeout: 5000 } // 5 second timeout for refresh
        );
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Clear auth and redirect to login
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
