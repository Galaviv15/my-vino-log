import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';

interface LocalWine {
  id: number;
  name: string;
  quantity: number;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [wines, setWines] = useState<LocalWine[]>([]);
  const [loadingWines, setLoadingWines] = useState(true);
  const [wineError, setWineError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadWines = async () => {
      setLoadingWines(true);
      setWineError('');
      try {
        const response = await apiClient.get<LocalWine[]>('/wines');
        if (isActive) {
          setWines(response.data || []);
        }
      } catch (error) {
        if (isActive) {
          setWineError(t('common.error'));
        }
      } finally {
        if (isActive) {
          setLoadingWines(false);
        }
      }
    };

    loadWines();

    return () => {
      isActive = false;
    };
  }, [t]);

  const totalBottles = useMemo(
    () => wines.reduce((sum, wine) => sum + (wine.quantity || 0), 0),
    [wines],
  );

  return (
    <div className="min-h-screen bg-cream px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-wine-900 mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-600">{t('dashboard.my_collection')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card text-center">
            <div className="text-3xl font-bold text-wine-600">
              {loadingWines ? '—' : totalBottles}
            </div>
            <p className="text-gray-600 text-sm">{t('dashboard.total_bottles')}</p>
          </div>

          <div className="card text-center">
            <div className="text-3xl font-bold text-wine-600">0</div>
            <p className="text-gray-600 text-sm">{t('dashboard.optimal_dates')}</p>
          </div>
        </div>

        <div className="mt-6 card text-center text-gray-600">
          {wineError
            ? wineError
            : loadingWines
            ? t('common.loading')
            : wines.length === 0
            ? `${t('dashboard.recent_additions')} · No wines yet.`
            : `${t('dashboard.recent_additions')} · ${wines
                .slice(0, 3)
                .map((wine) => wine.name)
                .join(', ')}`}
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
