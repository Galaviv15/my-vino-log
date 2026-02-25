import { create } from 'zustand';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  preferredLanguage: 'EN' | 'HE';
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
}

// Safe localStorage access with fallback
const getStorageItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn('localStorage not available:', e);
    return null;
  }
};

const setStorageItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage not available:', e);
  }
};

const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('localStorage not available:', e);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!getStorageItem('accessToken'),
  user: JSON.parse(getStorageItem('user') || 'null'),
  accessToken: getStorageItem('accessToken'),
  refreshToken: getStorageItem('refreshToken'),
  
  setAuth: (user, accessToken, refreshToken) => {
    setStorageItem('user', JSON.stringify(user));
    setStorageItem('accessToken', accessToken);
    setStorageItem('refreshToken', refreshToken);
    set({ isAuthenticated: true, user, accessToken, refreshToken });
  },
  
  logout: () => {
    removeStorageItem('user');
    removeStorageItem('accessToken');
    removeStorageItem('refreshToken');
    set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null });
  },
  
  setUser: (user) => {
    setStorageItem('user', JSON.stringify(user));
    set({ user });
  },
}));
