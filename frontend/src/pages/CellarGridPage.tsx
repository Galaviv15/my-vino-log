import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';

interface LocalWine {
  id: number;
  name: string;
  type: string | null;
  vintage: string | null;
  quantity: number;
  imageUrl?: string;
  winery?: string;
  region?: string;
  country?: string;
  location?: string;
  rowId?: number;
}

interface WineSuggestion {
  name: string;
  type: string;
  vintage: string;
  winery: string;
  region: string;
  country: string;
  imageUrl: string;
}

export default function CellarGridPage() {
  const { t } = useTranslation();
  const [wines, setWines] = useState<LocalWine[]>([]);
  const [loadingWines, setLoadingWines] = useState(true);
  const [wineError, setWineError] = useState('');
  const [savingWine, setSavingWine] = useState(false);
  const [deletingWineId, setDeletingWineId] = useState<number | null>(null);
  const [editingWine, setEditingWine] = useState<LocalWine | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [viewMode, setViewMode] = useState<'list' | 'fridge'>('list');
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    vintage: '',
    quantity: '1',
    location: 'CELLAR',
    rowId: '',
  });
  const [suggestions, setSuggestions] = useState<WineSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? value : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
    if (name === 'name') {
      setShowSuggestions(true);
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadWines = async () => {
      setLoadingWines(true);
      setWineError('');
      try {
        const response = await apiClient.get<LocalWine[]>('/wines');
        if (isActive) {
          setWines(response.data || []);
          setPage(1);
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

  useEffect(() => {
    const query = formData.name.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const response = await apiClient.get<WineSuggestion[]>('/wines/search', {
          params: { query },
        });
        setSuggestions(response.data || []);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [formData.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: {[key: string]: string} = {};
    const nameValue = formData.name.trim();
    const typeValue = formData.type.trim();
    const vintageValue = formData.vintage.trim();
    const quantityValue = formData.quantity.trim();

    if (!nameValue) {
      nextErrors.name = t('validation.required');
    }
    if (!typeValue) {
      nextErrors.type = t('validation.required');
    }
    if (!vintageValue) {
      nextErrors.vintage = t('validation.required');
    }
    if (!quantityValue) {
      nextErrors.quantity = t('validation.required');
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    const parsedQuantity = Number(quantityValue);
    const normalizedQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;

    setSavingWine(true);
    setWineError('');
    try {
      if (editingWine) {
        const response = await apiClient.put<LocalWine>(`/wines/${editingWine.id}`, {
          name: nameValue,
          type: formData.type || null,
          vintage: vintageValue || null,
          quantity: normalizedQuantity,
          location: formData.location || 'CELLAR',
          rowId: formData.rowId ? Number(formData.rowId) : null,
          winery: editingWine.winery || null,
          region: editingWine.region || null,
          country: editingWine.country || null,
          imageUrl: editingWine.imageUrl || '/wine-placeholder.svg',
        });
        setWines((prev) =>
          prev.map((wine) => (wine.id === editingWine.id ? response.data : wine)),
        );
        setEditingWine(null);
      } else {
        const response = await apiClient.post<LocalWine>('/wines', {
          name: nameValue,
          type: formData.type || null,
          vintage: vintageValue || null,
          quantity: normalizedQuantity,
          location: formData.location || 'CELLAR',
          rowId: formData.rowId ? Number(formData.rowId) : null,
          imageUrl: '/wine-placeholder.svg',
        });
        setWines((prev) => [response.data, ...prev]);
        setPage(1);
      }
      setFormData({ name: '', type: '', vintage: '', quantity: '1', location: 'CELLAR', rowId: '' });
      setFormErrors({});
      setShowSuggestions(false);
    } catch (error) {
      setWineError(t('common.error'));
    } finally {
      setSavingWine(false);
    }
  };

  const handleSuggestionPick = (suggestion: WineSuggestion) => {
    setFormData({
      name: suggestion.name,
      type: suggestion.type,
      vintage: suggestion.vintage,
      quantity: '1',
      location: 'CELLAR',
      rowId: '',
    });
    setFormErrors((prev) => ({
      ...prev,
      name: '',
      type: '',
      vintage: '',
    }));
    setShowSuggestions(false);
  };

  const handleEditStart = (wine: LocalWine) => {
    setEditingWine(wine);
    setFormData({
      name: wine.name,
      type: wine.type || '',
      vintage: wine.vintage || '',
      quantity: String(wine.quantity || 1),
      location: wine.location || 'CELLAR',
      rowId: wine.rowId ? String(wine.rowId) : '',
    });
    setFormErrors({});
    setShowSuggestions(false);
  };

  const handleEditCancel = () => {
    setEditingWine(null);
    setFormData({ name: '', type: '', vintage: '', quantity: '1', location: 'CELLAR', rowId: '' });
    setFormErrors({});
    setShowSuggestions(false);
  };

  const handleDelete = async (wineId: number) => {
    const shouldDelete = window.confirm('Are you sure you want to delete this wine?');
    if (!shouldDelete) {
      return;
    }
    setDeletingWineId(wineId);
    setWineError('');
    try {
      await apiClient.delete(`/wines/${wineId}`);
      setWines((prev) => prev.filter((wine) => wine.id !== wineId));
      if (editingWine?.id === wineId) {
        handleEditCancel();
      }
    } catch (error) {
      setWineError(t('common.error'));
    } finally {
      setDeletingWineId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(wines.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedWines = wines.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen bg-cream px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-wine-900 mb-6">{t('cellar.title')}</h1>

        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-wine-900 mb-4">
            {editingWine ? t('wines.edit_wine') : t('wines.add_wine')}
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" autoComplete="off">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('wines.wine_name')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-transparent"
                  placeholder="Cabernet Sauvignon"
                  required
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                )}
                {showSuggestions && (loadingSuggestions || suggestions.length > 0) && (
                  <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                    {loadingSuggestions ? (
                      <div className="px-4 py-3 text-sm text-gray-500">{t('common.loading')}</div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {suggestions.map((suggestion) => (
                          <button
                            type="button"
                            key={`${suggestion.name}-${suggestion.vintage}-${suggestion.winery}`}
                            onClick={() => handleSuggestionPick(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-cream/60 transition flex items-center gap-3"
                          >
                            <img
                              src={suggestion.imageUrl || '/wine-placeholder.svg'}
                              alt="Wine"
                              className="w-10 h-10 rounded-md object-cover border border-cream"
                            />
                            <div>
                              <div className="font-medium text-wine-900">{suggestion.name}</div>
                              <div className="text-xs text-gray-500">
                                {suggestion.winery} · {suggestion.region} · {suggestion.country}
                              </div>
                            </div>
                          </button>
                        ))}
                        {suggestions.length === 0 && (
                          <div className="px-4 py-3 text-sm text-gray-500">No matches found.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('wines.wine_type')}
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-transparent"
                required
              >
                <option value="">Select</option>
                {wineTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.type && (
                <p className="mt-1 text-xs text-red-600">{formErrors.type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('wines.vintage')}
              </label>
              <input
                type="text"
                name="vintage"
                value={formData.vintage}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-transparent"
                placeholder="2018"
                required
              />
              {formErrors.vintage && (
                <p className="mt-1 text-xs text-red-600">{formErrors.vintage}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('wines.quantity')}
              </label>
              <input
                type="number"
                name="quantity"
                min={1}
                value={formData.quantity}
                onChange={handleChange}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-transparent"
                required
              />
              {formErrors.quantity && (
                <p className="mt-1 text-xs text-red-600">{formErrors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('wines.location')}
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-transparent"
              >
                <option value="CELLAR">Cellar</option>
                <option value="FRIDGE">Fridge</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Row ID
              </label>
              <input
                type="number"
                name="rowId"
                min={1}
                value={formData.rowId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-transparent"
                placeholder="Optional row number"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={savingWine}
                  className="px-5 py-2.5 rounded-lg bg-wine-600 text-white font-semibold shadow-sm hover:bg-wine-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingWine ? t('wines.edit_wine') : t('wines.add_wine')}
                </button>
                {editingWine && (
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    className="px-5 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 font-semibold shadow-sm hover:bg-gray-50 transition"
                  >
                    {t('common.cancel')}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              viewMode === 'list'
                ? 'bg-wine-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('wines.list_view')}
          </button>
          <button
            onClick={() => setViewMode('fridge')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              viewMode === 'fridge'
                ? 'bg-wine-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('wines.fridge_view')}
          </button>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-wine-900 mb-4">{t('dashboard.my_collection')}</h2>
          {loadingWines ? (
            <p className="text-gray-600">{t('common.loading')}</p>
          ) : wineError ? (
            <p className="text-red-600 text-sm">{wineError}</p>
          ) : wines.length === 0 ? (
            <p className="text-gray-600">{t('cellar.empty')}</p>
          ) : (
            <div>
              {viewMode === 'list' ? (
                // LIST VIEW
                <div className="grid gap-3">
                  {pagedWines.map((wine) => (
                <div key={wine.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <img
                        src={wine.imageUrl || '/wine-placeholder.svg'}
                        alt="Wine"
                        className="w-10 h-10 rounded-md object-cover border border-cream"
                      />
                      <div>
                        <div className="font-medium text-wine-900">{wine.name}</div>
                        <div className="text-sm text-gray-500">
                            {wine.type || 'Type'} · {wine.vintage || 'Vintage'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-wine-600">x{wine.quantity}</div>
                    <button
                      type="button"
                      onClick={() => handleEditStart(wine)}
                      className="px-3 py-1.5 rounded-md bg-wine-50 text-wine-700 text-xs font-semibold border border-wine-100 hover:bg-wine-100 transition"
                    >
                      {t('wines.edit_wine')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(wine.id)}
                      disabled={deletingWineId === wine.id}
                      className="px-3 py-1.5 rounded-md bg-red-50 text-red-700 text-xs font-semibold border border-red-100 hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('wines.delete_wine')}
                    </button>
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNumber = index + 1;
                    const isActive = pageNumber === currentPage;
                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                          isActive
                            ? 'bg-wine-600 text-white border-wine-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            ) : (
              // FRIDGE VIEW
              <div className="grid gap-6">
                  {['FRIDGE', 'CELLAR'].map((location) => {
                    const locationWines = wines.filter((w) => (w.location || 'CELLAR') === location);
                    if (locationWines.length === 0) return null;

                    const winesByRow = locationWines.reduce((acc, wine) => {
                      const row = wine.rowId || 0;
                      if (!acc[row]) acc[row] = [];
                      acc[row].push(wine);
                      return acc;
                    }, {} as Record<number, LocalWine[]>);

                    return (
                      <div key={location} className="border rounded-lg p-4 bg-white">
                        <h3 className="text-lg font-semibold text-wine-900 mb-4">
                          {location === 'FRIDGE' ? '🧊 Fridge' : '🍷 Cellar'}
                        </h3>
                        <div className="grid gap-3">
                          {Object.entries(winesByRow)
                            .sort(([rowA], [rowB]) => Number(rowA) - Number(rowB))
                            .map(([row, rowWines]) => (
                              <div key={row} className="border-l-4 border-wine-300 pl-4">
                                {row !== '0' && (
                                  <p className="text-sm font-medium text-gray-600 mb-2">Row {row}</p>
                                )}
                                <div className="grid gap-2">
                                  {rowWines.map((wine) => (
                                    <div key={wine.id} className="flex flex-wrap items-center justify-between gap-3 p-2 bg-cream/50 rounded">
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={wine.imageUrl || '/wine-placeholder.svg'}
                                          alt="Wine"
                                          className="w-8 h-8 rounded object-cover border border-cream"
                                        />
                                        <div>
                                          <div className="font-medium text-wine-900 text-sm">{wine.name}</div>
                                          <div className="text-xs text-gray-500">
                                            {wine.type || 'Type'} · {wine.vintage || 'Vintage'}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="text-sm font-semibold text-wine-600">x{wine.quantity}</div>
                                        <button
                                          type="button"
                                          onClick={() => handleEditStart(wine)}
                                          className="px-2 py-1 rounded-md bg-wine-50 text-wine-700 text-xs font-semibold border border-wine-100 hover:bg-wine-100 transition"
                                        >
                                          {t('wines.edit_wine')}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDelete(wine.id)}
                                          disabled={deletingWineId === wine.id}
                                          className="px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-semibold border border-red-100 hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {t('wines.delete_wine')}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
