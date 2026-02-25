import React, { useState } from 'react';
import { DiscoveredWine } from '../services/wineDiscovery';

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

interface ManualWineFormProps {
  onSubmit: (wine: DiscoveredWine, saveToDb: boolean, imageFile?: File) => void;
  onCancel: () => void;
  t: (key: string, defaultValue?: string) => string;
  location?: string;
  setLocation?: (location: string) => void;
  row?: number;
  setRow?: (row: number) => void;
}

export default function ManualWineForm({ onSubmit, onCancel, t, location = 'FRIDGE', setLocation, row = 1, setRow }: ManualWineFormProps) {
  const [wineName, setWineName] = useState('');
  const [winery, setWinery] = useState('');
  const [type, setType] = useState('');
  const [vintage, setVintage] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [grapeVariety, setGrapeVariety] = useState<string[]>([]);
  const [alcoholContent, setAlcoholContent] = useState('');
  const [saveToDb, setSaveToDb] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!wineName.trim() || !winery.trim()) {
      setError(t('wine_discovery.fill_required_fields') || 'Wine name and winery are required');
      return;
    }
    if (!vintage.trim()) {
      setError('Vintage year is required');
      return;
    }

    const wine: DiscoveredWine = {
      wineName: wineName.trim(),
      winery: winery.trim(),
      vintage: vintage.trim(),
      type: type.trim(),
      region: region.trim(),
      country: country.trim(),
      grapes: grapeVariety,
      alcoholContent: alcoholContent ? parseFloat(alcoholContent) : 0,
      source: 'manual',
    };

    onSubmit(wine, saveToDb, imageFile || undefined);
    resetForm();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleGrapeVarietyChange = (grape: string) => {
    setGrapeVariety((prev) =>
      prev.includes(grape) ? prev.filter((g) => g !== grape) : [...prev, grape]
    );
  };

  const resetForm = () => {
    setWineName('');
    setWinery('');
    setType('');
    setVintage('');
    setRegion('');
    setCountry('');
    setGrapeVariety([]);
    setAlcoholContent('');
    setSaveToDb(false);
    setError('');
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="manual-wine-form">
      <p className="form-description">
        {t('wine_discovery.manual_entry_description') || 'Fill in the wine details below'}
      </p>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label>
          {t('wine_discovery.wine_name') || 'Wine Name'}
          <span className="required">*</span>
        </label>
        <input
          type="text"
          value={wineName}
          onChange={(e) => {
            setWineName(e.target.value);
            setError('');
          }}
          placeholder={t('wine_discovery.wine_name_placeholder') || 'e.g., La Tâche'}
          className="input-field"
        />
      </div>

      <div className="form-group">
        <label>
          {t('wine_discovery.winery') || 'Winery'}
          <span className="required">*</span>
        </label>
        <input
          type="text"
          value={winery}
          onChange={(e) => {
            setWinery(e.target.value);
            setError('');
          }}
          placeholder={t('wine_discovery.winery_placeholder') || 'e.g., Domaine de la Romanée-Conti'}
          className="input-field"
        />
      </div>

      <div className="form-group">
        <label>{t('wines.wine_type') || 'Wine Type'}</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input-field"
        >
          <option value="">Select wine type...</option>
          <option value="Red">Red</option>
          <option value="White">White</option>
          <option value="Rosé">Rosé</option>
          <option value="Sparkling">Sparkling</option>
          <option value="Dessert">Dessert</option>
          <option value="Fortified">Fortified</option>
        </select>
      </div>

      <div className="form-group">
        <label>{t('wine_discovery.vintage') || 'Vintage'}</label>
        <select
          value={vintage}
          onChange={(e) => setVintage(e.target.value)}
          className="input-field"
        >
          <option value="">{t('wine_discovery.select_vintage') || 'Select year...'}</option>
          {generateYearOptions().map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>{t('wine_discovery.location') || 'Location'}</label>
          <select
            value={location}
            onChange={(e) => setLocation?.(e.target.value)}
            className="input-field"
          >
            <option value="CELLAR">🍷 {t('wines.cellar') || 'Cellar'}</option>
            <option value="FRIDGE">🧊 {t('wines.fridge') || 'Fridge'}</option>
          </select>
        </div>
        <div className="form-group">
          <label>{t('wine_discovery.row') || 'Row'}</label>
          <input
            type="number"
            min="1"
            value={row}
            onChange={(e) => setRow?.(Math.max(1, parseInt(e.target.value) || 1))}
            className="input-field"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>{t('wine_discovery.region') || 'Region'}</label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder={t('wine_discovery.region_placeholder') || 'e.g., Burgundy'}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label>{t('wine_discovery.country') || 'Country'}</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder={t('wine_discovery.country_placeholder') || 'e.g., France'}
            className="input-field"
          />
        </div>
      </div>

      <div className="form-group">
        <label>{t('wine_discovery.grapes') || 'Grapes'}</label>
        <div className="grape-variety-grid">
          {GRAPE_VARIETY_OPTIONS.map((grape) => (
            <label key={grape} className="checkbox-label">
              <input
                type="checkbox"
                checked={grapeVariety.includes(grape)}
                onChange={() => handleGrapeVarietyChange(grape)}
              />
              <span>{grape}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>{t('wine_discovery.alcohol_content') || 'Alcohol Content (%)'}</label>
        <input
          type="number"
          min="0"
          max="20"
          step="0.1"
          value={alcoholContent}
          onChange={(e) => setAlcoholContent(e.target.value)}
          placeholder={t('wine_discovery.alcohol_placeholder') || 'e.g., 13.5'}
          className="input-field"
        />
      </div>

      <div className="form-group">
        <label>{t('wine_discovery.image') || 'Wine Image'}</label>
        
        {/* Image Preview */}
        <div
          className="image-preview"
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            border: '2px dashed #ccc',
            borderRadius: '8px',
            textAlign: 'center',
            minHeight: '150px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9f9f9',
          }}
        >
          {imagePreview ? (
            <div style={{ position: 'relative', width: '100%' }}>
              <img
                src={imagePreview}
                alt="Wine preview"
                style={{ maxHeight: '150px', maxWidth: '100%' }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                ✕ {t('common.remove') || 'Remove'}
              </button>
            </div>
          ) : (
            <span style={{ color: '#999' }}>
              {t('wine_discovery.no_image_selected') || 'No image selected'}
            </span>
          )}
        </div>

        {/* File Input */}
        <input
          id="wine-image-input"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageFileChange}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={() => document.getElementById('wine-image-input')?.click()}
          className="btn btn-secondary"
          style={{ width: '100%', marginBottom: '0.5rem' }}
        >
          🖼️ {t('wine_discovery.choose_image') || 'Choose Image'}
        </button>
        <small style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>
          {t('wine_discovery.image_hint') || 'JPG, PNG, GIF or WebP (max 5MB)'}
        </small>
      </div>

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

      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleSubmit}>
          {t('wine_discovery.add_to_cellar') || '✅ Add to Cellar'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          {t('common.cancel') || 'Cancel'}
        </button>
      </div>
    </div>
  );
}
