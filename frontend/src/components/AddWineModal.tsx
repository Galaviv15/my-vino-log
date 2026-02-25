import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { discoverWine, DiscoveredWine, searchWinesByName } from '../services/wineDiscovery';
import { getImageUrl } from '../services/imageUpload';
import ManualWineForm from './ManualWineForm';
import '../styles/AddWineModal.css';

interface AddWineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWineAdded: (wine: DiscoveredWine, details: WineAddDetails, imageFile?: File) => void;
  isLoading?: boolean;
}

export interface WineAddDetails {
  quantity: number;
  location?: string;
  shelf?: number;
  row?: number;
  vintage?: string;
  saveToDatabase?: boolean;
}

type ModalStep = 'search' | 'preview' | 'manual';

const GRAPE_VARIETY_OPTIONS = [
  'Cabernet Sauvignon',
  'Merlot',
  'Pinot Noir',
  'Syrah',
  'Chardonnay',
  'Sauvignon Blanc',
  'Riesling',
  'Pinot Grigio',
  'Chenin Blanc',
  'Viognier',
  'Tempranillo',
  'Sangiovese',
  'Nebbiolo',
  'Barbera',
  'Cabernet Franc',
  'Petit Verdot',
  'Grenache',
  'Cinsault',
  'Mourvèdre',
  'Garnacha',
];

const generateYearOptions = () => {
  const years = [];
  for (let year = 2030; year >= 1975; year--) {
    years.push(year.toString());
  }
  return years;
};

export default function AddWineModal({
  isOpen,
  onClose,
  onWineAdded,
  isLoading = false,
}: AddWineModalProps) {
  const { t } = useTranslation();

  // Search state
  const [wineName, setWineName] = useState('');
  const [suggestions, setSuggestions] = useState<DiscoveredWine[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Flow state
  const [currentStep, setCurrentStep] = useState<ModalStep>('search');
  const [selectedWine, setSelectedWine] = useState<DiscoveredWine | null>(null);
  const [wineSource, setWineSource] = useState<'database' | 'serper' | 'manual'>('database');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Preview/Add state
  const [quantity, setQuantity] = useState(1);
  const [vintage, setVintage] = useState('');
  const [location, setLocation] = useState('FRIDGE');
  const [grapeVariety, setGrapeVariety] = useState<string[]>([]);
  const [shelf, setShelf] = useState(1);
  const [row, setRow] = useState(1);
  const [saveToDb, setSaveToDb] = useState(false);

  // Autocomplete search
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

    const timer = setTimeout(searchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [wineName]);

  const handleSelectSuggestion = (wine: DiscoveredWine) => {
    setSelectedWine(wine);
    setWineSource('database');
    setVintage(wine.vintage || '');
    setGrapeVariety(wine.grapes || []);
    setCurrentStep('preview');
    setWineName('');
    setSuggestions([]);
    setShowSuggestions(false);
    setError('');
  };

  const handleSearchSerper = async () => {
    if (!wineName.trim()) {
      setError(t('wine_discovery.fill_required_fields') || 'Please enter a wine name');
      return;
    }

    setSearching(true);
    setError('');
    try {
      const result = await discoverWine({
        wineName: wineName.trim(),
        winery: '',
        vintage: undefined,
      });

      if (result) {
        setSelectedWine(result);
        setWineSource('serper');
        setVintage(result.vintage || '');
        setGrapeVariety(result.grapes || []);
        setCurrentStep('preview');
      } else {
        setError(t('wine_discovery.no_results') || 'Wine not found. Try adding manually.');
      }
    } catch (err) {
      setError(t('common.error') || 'An error occurred');
    } finally {
      setSearching(false);
    }
  };

  const handleAddWine = () => {
    if (!vintage.trim()) {
      setError('Vintage year is required');
      return;
    }
    if (selectedWine) {
      const details: WineAddDetails = {
        quantity: Math.max(1, quantity),
        location: location || undefined,
        shelf: shelf > 0 ? shelf : undefined,
        row: row > 0 ? row : undefined,
        vintage: vintage || undefined,
        saveToDatabase: wineSource === 'serper' ? saveToDb : undefined,
      };
      onWineAdded(selectedWine, details);
      resetForm();
    }
  };

  const handleManualEntry = () => {
    setCurrentStep('manual');
    setError('');
  };

  const handleManualWineSubmit = (wine: DiscoveredWine, shouldSaveToDb: boolean, imageFile?: File) => {
    const details: WineAddDetails = {
      quantity: Math.max(1, quantity),
      location: location || undefined,
      shelf: shelf > 0 ? shelf : undefined,
      row: row > 0 ? row : undefined,
      saveToDatabase: shouldSaveToDb,
    };
    onWineAdded(wine, details, imageFile);
    resetForm();
  };

  const resetForm = () => {
    setWineName('');
    setSuggestions([]);
    setShowSuggestions(false);
    setCurrentStep('search');
    setSelectedWine(null);
    setQuantity(1);
    setVintage('');
    setLocation('FRIDGE');
    setGrapeVariety([]);
    setShelf(1);
    setRow(1);
    setSaveToDb(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={resetForm}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {currentStep === 'search' && (t('wine_discovery.add_wine') || 'Add Wine to Cellar')}
            {currentStep === 'preview' && (t('wine_discovery.wine_details') || 'Wine Details')}
            {currentStep === 'manual' && (t('wine_discovery.add_manually') || 'Add Wine Manually')}
          </h2>
          <button className="modal-close" onClick={resetForm}>✕</button>
        </div>

        <div className="modal-body">
          {currentStep === 'search' && (
            <SearchStep
              wineName={wineName}
              setWineName={setWineName}
              suggestions={suggestions}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              onSelectSuggestion={handleSelectSuggestion}
              onSearchSerper={handleSearchSerper}
              searching={searching}
              error={error}
              setError={setError}
              onManualEntry={handleManualEntry}
              t={t}
            />
          )}

          {currentStep === 'preview' && selectedWine && (
            <PreviewStep
              wine={selectedWine}
              source={wineSource}
              quantity={quantity}
              setQuantity={setQuantity}
              vintage={vintage}
              setVintage={setVintage}
              location={location}
              setLocation={setLocation}
              grapeVariety={grapeVariety}
              setGrapeVariety={setGrapeVariety}
              shelf={shelf}
              setShelf={setShelf}
              row={row}
              setRow={setRow}
              saveToDb={saveToDb}
              setSaveToDb={setSaveToDb}
              onAdd={handleAddWine}
              onBack={() => {
                setCurrentStep('search');
                setWineName('');
                setSelectedWine(null);
                setError('');
              }}
              t={t}
            />
          )}

          {currentStep === 'manual' && (
            <ManualWineForm
              onSubmit={handleManualWineSubmit}
              onCancel={() => {
                setCurrentStep('search');
                setError('');
              }}
              t={t as (key: string, defaultValue?: string) => string}
              location={location}
              setLocation={setLocation}
              row={row}
              setRow={setRow}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Search Step Component
function SearchStep({
  wineName,
  setWineName,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  onSelectSuggestion,
  onSearchSerper,
  searching,
  error,
  setError,
  onManualEntry,
  t,
}: any) {
  return (
    <div className="search-step">
      <p className="step-description">
        {t('wine_discovery.search_db') || 'Search our wine database'}
      </p>

      <div className="search-input-wrapper">
        <input
          type="text"
          value={wineName}
          onChange={(e) => {
            setWineName(e.target.value);
            setError('');
          }}
          onFocus={() => wineName.trim().length >= 2 && setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSearchSerper();
            }
          }}
          placeholder={t('wine_discovery.wine_name_placeholder') || 'Type wine name...'}
          autoComplete="off"
          disabled={searching}
          className="search-input"
        />

        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map((wine: DiscoveredWine) => (
              <div
                key={wine.id}
                className="suggestion-item"
                onClick={() => onSelectSuggestion(wine)}
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

      {error && <div className="error-message">{error}</div>}

      <div className="search-actions">
        <button
          className="btn btn-primary"
          onClick={onSearchSerper}
          disabled={searching || !wineName.trim()}
        >
          {searching ? (t('common.searching') || 'Searching...') : (t('common.search') || 'Search')}
        </button>
        <button className="btn btn-secondary" onClick={onManualEntry}>
          {t('wine_discovery.add_manually') || '➕ Add Manually'}
        </button>
      </div>
    </div>
  );
}

// Preview Step Component
function PreviewStep({
  wine,
  source,
  quantity,
  setQuantity,
  vintage,
  setVintage,
  location,
  setLocation,
  grapeVariety,
  setGrapeVariety,
  shelf,
  setShelf,
  row,
  setRow,
  saveToDb,
  setSaveToDb,
  onAdd,
  onBack,
 t,
}: any) {
  const yearOptions = generateYearOptions();
  
  const handleGrapeVarietyChange = (grape: string) => {
    setGrapeVariety((prev: string[]) =>
      prev.includes(grape) ? prev.filter((g) => g !== grape) : [...prev, grape]
    );
  };

  return (
    <div className="preview-step">
      {/* Wine Image */}
      {wine.imageUrl && (
        <div className="wine-image-container">
          <img 
            src={getImageUrl(wine.imageUrl)} 
            alt={wine.wineName}
            className="wine-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/wine-placeholder.svg';
            }}
          />
        </div>
      )}
      
      {/* Wine Info - Read Only */}
      <div className="wine-info">
        <div className="info-row">
          <span className="label">{t('wine_discovery.wine_name') || 'Wine Name'}:</span>
          <span className="value">{wine.wineName}</span>
        </div>
        <div className="info-row">
          <span className="label">{t('wine_discovery.winery') || 'Winery'}:</span>
          <span className="value">{wine.winery}</span>
        </div>
        {wine.vintage && (
          <div className="info-row">
            <span className="label">{t('wine_discovery.vintage') || 'Vintage'}:</span>
            <span className="value">{wine.vintage}</span>
          </div>
        )}
        {wine.country && (
          <div className="info-row">
            <span className="label">{t('wine_discovery.country') || 'Country'}:</span>
            <span className="value">{wine.country}</span>
          </div>
        )}
        {wine.region && (
          <div className="info-row">
            <span className="label">{t('wine_discovery.region') || 'Region'}:</span>
            <span className="value">{wine.region}</span>
          </div>
        )}
        {wine.grapes && wine.grapes.length > 0 && (
          <div className="info-row">
            <span className="label">{t('wine_discovery.grapes') || 'Grapes'}:</span>
            <span className="value">{wine.grapes.join(', ')}</span>
          </div>
        )}
        {wine.alcoholContent && (
          <div className="info-row">
            <span className="label">{t('wine_discovery.alcohol_content') || 'Alcohol Content'}:</span>
            <span className="value">{wine.alcoholContent}%</span>
          </div>
        )}
        <div className="info-row source-badge">
          <span className={`badge badge-${source}`}>
            {source === 'database' && '📚 From Database'}
            {source === 'serper' && '🔍 From Serper'}
            {source === 'manual' && '✏️ Manual Entry'}
          </span>
        </div>
      </div>

      {/* Cellar Details - Editable */}
      <div className="cellar-details">
        <h3>{t('wine_discovery.cellar_details') || 'Cellar Details'}</h3>

        <div className="form-group">
          <label>
            {t('wine_discovery.vintage') || 'Vintage'}
            <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            value={vintage}
            onChange={(e) => setVintage(e.target.value)}
            className="input-field"
          >
            <option value="">{t('wine_discovery.select_vintage') || 'Select year...'}</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>{t('wine_discovery.quantity') || 'Quantity'}</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="input-field"
          />
        </div>

        <div className="form-group">
          <label>{t('wine_discovery.location') || 'Location'}</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input-field"
          >
            <option value="CELLAR">🍷 {t('wines.cellar') || 'Cellar'}</option>
            <option value="FRIDGE">🧊 {t('wines.fridge') || 'Fridge'}</option>
          </select>
        </div>

        <div className="form-group">
          <label>{t('wine_discovery.row') || 'Row #'}</label>
          <input
            type="number"
            min="1"
            value={row}
            onChange={(e) => setRow(parseInt(e.target.value) || 1)}
            className="input-field"
          />
        </div>
      </div>

      {/* Save to DB option for Serper */}
      {source === 'serper' && (
        <div className="save-to-db-option">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={saveToDb}
              onChange={(e) => setSaveToDb(e.target.checked)}
            />
            <span>{t('wine_discovery.save_to_global_db') || 'Save this wine to global database'}</span>
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="preview-actions">
        <button className="btn btn-primary" onClick={onAdd}>
          {t('wine_discovery.add_to_cellar') || '✅ Add to Cellar'}
        </button>
        <button className="btn btn-secondary" onClick={onBack}>
          {t('common.back') || 'Back'}
        </button>
      </div>
    </div>
  );
}
