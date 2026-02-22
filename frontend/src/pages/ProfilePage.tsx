import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ProfilePage() {
  const { t } = useTranslation();
  const wineTypeOptions = useMemo(
    () => [
      { value: 'RED', label: t('wines_types.red') },
      { value: 'WHITE', label: t('wines_types.white') },
      { value: 'SPARKLING', label: t('wines_types.sparkling') },
      { value: 'ROSE', label: t('wines_types.rose') },
      { value: 'DESSERT', label: t('wines_types.dessert') },
      { value: 'FORTIFIED', label: t('wines_types.fortified') },
    ],
    [t],
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [favoriteWinery, setFavoriteWinery] = useState('');
  const [grapeVariety, setGrapeVariety] = useState('');
  const [kosherPreferred, setKosherPreferred] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('vinoPreferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedTypes(parsed.selectedTypes || []);
        setFavoriteWinery(parsed.favoriteWinery || '');
        setGrapeVariety(parsed.grapeVariety || '');
        setKosherPreferred(Boolean(parsed.kosherPreferred));
      } catch (error) {
        // Ignore invalid saved data.
      }
    }
  }, []);

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((type) => type !== value) : [...prev, value],
    );
  };

  const handleSave = () => {
    localStorage.setItem(
      'vinoPreferences',
      JSON.stringify({ selectedTypes, favoriteWinery, grapeVariety, kosherPreferred }),
    );
  };

  return (
    <div className="min-h-screen bg-cream px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-wine-900 mb-6">{t('profile.title')}</h1>
        <p className="text-gray-600 mb-8">{t('profile.settings')}</p>

        <div className="card">
          <h2 className="text-xl font-semibold text-wine-900 mb-2">{t('profile.my_preferences')}</h2>
          <p className="text-gray-600 mb-6">{t('onboarding.preferences_desc')}</p>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('onboarding.wine_types')}</h3>
            <div className="flex flex-wrap gap-2">
              {wineTypeOptions.map((option) => {
                const isActive = selectedTypes.includes(option.value);
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => toggleType(option.value)}
                    className={`px-4 py-1.5 rounded-full border transition ${
                      isActive
                        ? 'bg-wine-600 text-white border-wine-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-wine-400'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('onboarding.favorite_winery')}
              </label>
              <input
                type="text"
                value={favoriteWinery}
                onChange={(e) => setFavoriteWinery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('onboarding.grape_variety')}
              </label>
              <input
                type="text"
                value={grapeVariety}
                onChange={(e) => setGrapeVariety(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-6">
            <button
              type="button"
              onClick={() => setKosherPreferred((prev) => !prev)}
              className={`px-4 py-2 rounded-full border transition ${
                kosherPreferred
                  ? 'bg-wine-600 text-white border-wine-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-wine-400'
              }`}
            >
              {t('onboarding.kosher_preference')}
            </button>
          </div>

          <button type="button" onClick={handleSave} className="btn-primary">
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
