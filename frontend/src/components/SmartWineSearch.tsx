import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { discoverWine, DiscoveredWine, searchWinesByName } from '../services/wineDiscovery';
import '../styles/SmartWineSearch.css';

interface SmartWineSearchProps {
  onWineSelected: (wine: DiscoveredWine) => void;
  isLoading: boolean;
}

export default function SmartWineSearch({ onWineSelected, isLoading }: SmartWineSearchProps) {
  const { t } = useTranslation();
  const [winery, setWinery] = useState('');
  const [wineName, setWineName] = useState('');
  const [vintage, setVintage] = useState('');
  const [searchResults, setSearchResults] = useState<DiscoveredWine | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<DiscoveredWine[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Autocomplete: Search database as user types wine name
  useEffect(() => {
    const searchSuggestions = async () => {
      if (wineName.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const results = await searchWinesByName(wineName.trim());
        setSuggestions(results || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Error searching suggestions:', err);
        setSuggestions([]);
      }
    };

    const timer = setTimeout(searchSuggestions, 300); // Debounce
    return () => clearTimeout(timer);
  }, [wineName]);

  const handleSelectSuggestion = (wine: DiscoveredWine) => {
    setWineName(wine.wineName);
    setWinery(wine.winery);
    setVintage(wine.vintage || '');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSearch = async () => {
    setError('');
    setSearchResults(null);

    if (!winery.trim() || !wineName.trim()) {
      setError(t('wine_discovery.fill_required_fields') || 'Please fill in winery and wine name');
      return;
    }

    setSearching(true);
    try {
      const result = await discoverWine({
        winery: winery.trim(),
        wineName: wineName.trim(),
        vintage: vintage.trim() || undefined,
      });

      if (result) {
        setSearchResults(result);
      } else {
        setError(t('wine_discovery.no_results') || 'Could not find wine details. Please enter manually.');
      }
    } catch (err) {
      setError(t('common.error') || 'An error occurred');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = () => {
    if (searchResults) {
      onWineSelected(searchResults);
      setShowSearch(false);
      setWinery('');
      setWineName('');
      setVintage('');
      setSearchResults(null);
    }
  };

  return (
    <div className="smart-wine-search">
      <button
        type="button"
        onClick={() => setShowSearch(!showSearch)}
        className="search-toggle-btn"
        disabled={isLoading}
      >
        🔍 {t('wine_discovery.smart_search') || 'Smart Wine Search'}
      </button>

      {showSearch && (
        <div className="search-panel">
          <h3>{t('wine_discovery.title') || 'Smart Wine Discovery'}</h3>
          <p className="search-description">
            {t('wine_discovery.description') || 'Search our database or use AI to discover wine details'}
          </p>

          <div
            className="search-form"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
          >
            <div className="form-group">
              <label htmlFor="winery">{t('wine_discovery.winery') || 'Winery'}*</label>
              <input
                id="winery"
                type="text"
                value={winery}
                onChange={(e) => setWinery(e.target.value)}
                placeholder={t('wine_discovery.winery_placeholder') || 'e.g., Domaine de la Romanée'}
                disabled={searching}
              />
            </div>

            <div className="form-group">
              <label htmlFor="wineName">{t('wine_discovery.wine_name') || 'Wine Name'}*</label>
              <input
                id="wineName"
                type="text"
                value={wineName}
                onChange={(e) => setWineName(e.target.value)}
                onFocus={() => wineName.trim().length >= 2 && setShowSuggestions(true)}
                placeholder={t('wine_discovery.wine_name_placeholder') || 'e.g., La Tâche'}
                disabled={searching}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {suggestions.map((wine) => (
                    <div
                      key={wine.id}
                      className="suggestion-item"
                      onClick={() => handleSelectSuggestion(wine)}
                    >
                      <div className="suggestion-name">
                        {wine.wineName}
                        {wine.vintage && <span className="suggestion-vintage"> ({wine.vintage})</span>}
                      </div>
                      <div className="suggestion-winery">{wine.winery}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="vintage">{t('wine_discovery.vintage') || 'Vintage'}</label>
              <input
                id="vintage"
                type="text"
                value={vintage}
                onChange={(e) => setVintage(e.target.value)}
                placeholder={t('wine_discovery.vintage_placeholder') || 'e.g., 2019 or leave blank'}
                disabled={searching}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={searching || isLoading}
              className="search-btn"
            >
              {searching ? (t('common.searching') || 'Searching...') : (t('common.search') || 'Search')}
            </button>
          </div>

          {searchResults && (
            <div className="search-result">
              <h4>{t('wine_discovery.found') || 'Wine Found'}</h4>
              <div className="result-details">
                <p>
                  <strong>{t('wine_discovery.winery') || 'Winery'}:</strong> {searchResults.winery}
                </p>
                <p>
                  <strong>{t('wine_discovery.wine_name') || 'Wine Name'}:</strong> {searchResults.wineName}
                </p>
                {searchResults.vintage && (
                  <p>
                    <strong>{t('wine_discovery.vintage') || 'Vintage'}:</strong> {searchResults.vintage}
                  </p>
                )}
                {searchResults.grapes && searchResults.grapes.length > 0 && (
                  <p>
                    <strong>{t('wine_discovery.grapes') || 'Grapes'}:</strong> {searchResults.grapes.join(', ')}
                  </p>
                )}
                {searchResults.region && (
                  <p>
                    <strong>{t('wine_discovery.region') || 'Region'}:</strong> {searchResults.region}
                  </p>
                )}
                {searchResults.country && (
                  <p>
                    <strong>{t('wine_discovery.country') || 'Country'}:</strong> {searchResults.country}
                  </p>
                )}
                {searchResults.alcoholContent && (
                  <p>
                    <strong>{t('wine_discovery.alcohol_content') || 'Alcohol Content'}:</strong>{' '}
                    {searchResults.alcoholContent}%
                  </p>
                )}
                {searchResults.aiValidated && (
                  <p className="validated-badge">
                    ✓ {t('wine_discovery.ai_validated') || 'AI Validated'}
                  </p>
                )}
              </div>
              <button type="button" onClick={handleSelectResult} className="select-btn">
                {t('wine_discovery.use_result') || 'Use This Wine'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
