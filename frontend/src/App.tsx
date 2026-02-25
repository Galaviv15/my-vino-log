import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n/config';
import './index.css';
import { useAuthStore } from './store/authStore';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OnboardingPage from './pages/OnboardingPage';
import CellarGridPage from './pages/CellarGridPage';
import ProfilePage from './pages/ProfilePage';

// Components
import PrivateRoute from './components/PrivateRoute';
import Header from './components/Header';

function AuthRedirect() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login' && location.pathname !== '/register') {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return null;
}

function App() {
  const { i18n } = useTranslation();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    i18n.changeLanguage(savedLanguage);
    const applyLanguageSettings = (lang: string) => {
      localStorage.setItem('language', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    };

    applyLanguageSettings(savedLanguage);
    i18n.on('languageChanged', applyLanguageSettings);

    return () => {
      i18n.off('languageChanged', applyLanguageSettings);
    };
  }, [i18n]);

  return (
    <Router>
      <AuthRedirect />
      <div className="min-h-screen flex flex-col">
        {isAuthenticated && <Header />}
        {!isAuthenticated && (
          <div className="fixed top-4 right-4 z-50">
            <label className="sr-only" htmlFor="global-language">
              {i18n.t('profile.language')}
            </label>
            <select
              id="global-language"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white/90 backdrop-blur shadow-sm focus:ring-2 focus:ring-wine-500 focus:border-transparent"
            >
              <option value="en">EN</option>
              <option value="he">HE</option>
            </select>
          </div>
        )}
        <main className={`flex-1 ${isAuthenticated ? 'pt-16' : ''}`}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Private Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <PrivateRoute>
                  <OnboardingPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/cellar"
              element={
                <PrivateRoute>
                  <CellarGridPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />

            {/* Redirect */}
            <Route
              path="/"
              element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
            />
          </Routes>
        </main>
        <footer
          className={`border-t py-4 text-center text-xs ${
            isAuthenticated
              ? 'border-gray-200 bg-cream text-gray-500'
              : 'border-white/20 bg-gradient-to-br from-wine-600 to-wine-900 text-white/80'
          }`}
        >
          © 2026 All rights reserved | Developed by Gal Aviv
        </footer>
      </div>
    </Router>
  );
}

export default App;
