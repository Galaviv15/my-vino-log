import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 w-full bg-wine-600 text-white shadow-lg z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('common.app_name')}</h1>
        </div>

        <nav className="hidden md:flex items-center gap-3 text-sm sm:text-base ml-auto whitespace-nowrap flex-nowrap">
          <button
            onClick={() => handleNavigate('/dashboard')}
            className="px-2 py-1 rounded-md font-semibold whitespace-nowrap hover:bg-white/10 transition"
          >
            {t('dashboard.title')}
          </button>
          <button
            onClick={() => handleNavigate('/cellar')}
            className="px-2 py-1 rounded-md font-semibold whitespace-nowrap hover:bg-white/10 transition"
          >
            {t('cellar.title')}
          </button>
          <button
            onClick={() => handleNavigate('/profile')}
            className="px-2 py-1 rounded-md font-semibold whitespace-nowrap hover:bg-white/10 transition"
          >
            {t('profile.title')}
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-600 rounded-md hover:bg-red-700 transition text-sm font-semibold whitespace-nowrap"
          >
            {t('auth.logout')}
          </button>

          <label className="sr-only" htmlFor="header-language">
            {t('profile.language')}
          </label>
          <select
            id="header-language"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="px-2 py-1 bg-white/20 rounded-md border border-white/20 text-sm font-semibold text-white focus:ring-2 focus:ring-white/60 focus:border-transparent"
          >
            <option value="en" className="text-gray-900">
              EN
            </option>
            <option value="he" className="text-gray-900">
              HE
            </option>
          </select>
        </nav>

        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="md:hidden ml-auto inline-flex items-center justify-center w-10 h-10 rounded-md bg-white/10 hover:bg-white/20 transition"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
          type="button"
        >
          <span className="relative w-5 h-5">
            <span
              className={`absolute left-0 top-1 h-0.5 w-5 bg-white transition-transform duration-300 ${
                isMenuOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`absolute left-0 top-2.5 h-0.5 w-5 bg-white transition-opacity duration-200 ${
                isMenuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`absolute left-0 top-4 h-0.5 w-5 bg-white transition-transform duration-300 ${
                isMenuOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </span>
        </button>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 sm:px-6 pb-4 flex flex-col gap-4">
          <button
            onClick={() => handleNavigate('/dashboard')}
            className="text-center text-base font-semibold py-2 px-3 rounded-md hover:bg-white/10 transition"
          >
            {t('dashboard.title')}
          </button>
          <button
            onClick={() => handleNavigate('/cellar')}
            className="text-center text-base font-semibold py-2 px-3 rounded-md hover:bg-white/10 transition"
          >
            {t('cellar.title')}
          </button>
          <button
            onClick={() => handleNavigate('/profile')}
            className="text-center text-base font-semibold py-2 px-3 rounded-md hover:bg-white/10 transition"
          >
            {t('profile.title')}
          </button>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-600 rounded-md hover:bg-red-700 transition text-base font-semibold"
            >
              {t('auth.logout')}
            </button>
            <div className="flex justify-center">
              <label className="sr-only" htmlFor="header-language-mobile">
                {t('profile.language')}
              </label>
              <select
                id="header-language-mobile"
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="px-3 py-2 bg-white/20 rounded-md border border-white/20 text-base font-semibold text-white focus:ring-2 focus:ring-white/60 focus:border-transparent"
              >
                <option value="en" className="text-gray-900">
                  EN
                </option>
                <option value="he" className="text-gray-900">
                  HE
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
