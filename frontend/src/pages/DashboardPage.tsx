import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-wine-900 mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-600">{t('dashboard.my_collection')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card text-center">
            <div className="text-3xl font-bold text-wine-600">0</div>
            <p className="text-gray-600 text-sm">{t('dashboard.total_bottles')}</p>
          </div>

          <div className="card text-center">
            <div className="text-3xl font-bold text-wine-600">0</div>
            <p className="text-gray-600 text-sm">{t('dashboard.optimal_dates')}</p>
          </div>
        </div>

        <div className="mt-6 card text-center text-gray-600">
          {t('dashboard.recent_additions')} · No wines yet.
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate('/cellar')}
            className="btn-primary"
          >
            {t('wines.add_wine')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/cellar')}
            className="btn-secondary"
          >
            {t('dashboard.view_cellar')}
          </button>
        </div>
      </div>
    </div>
  );
}
