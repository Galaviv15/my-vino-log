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
  const [expandedShelf, setExpandedShelf] = useState<string | null>(null);
  const [selectedWine, setSelectedWine] = useState<LocalWine | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
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
    setShowAddForm(true);
  };

  const handleEditCancel = () => {
    setEditingWine(null);
    setFormData({ name: '', type: '', vintage: '', quantity: '1', location: 'CELLAR', rowId: '' });
    setFormErrors({});
    setShowSuggestions(false);
    setShowAddForm(false);
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-wine-900">{t('cellar.title')}</h1>
          <button
            onClick={() => {
              setEditingWine(null);
              setFormData({ name: '', type: '', vintage: '', quantity: '1', location: 'CELLAR', rowId: '' });
              setFormErrors({});
              setShowAddForm(true);
            }}
            className="px-6 py-3 rounded-lg bg-wine-600 text-white font-semibold hover:bg-wine-700 shadow-lg transition"
          >
            + {t('wines.add_wine')}
          </button>
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
                <div key={wine.id} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-lg cursor-pointer transition" onClick={() => setSelectedWine(wine)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <img
                        src={wine.imageUrl || '/wine-placeholder.svg'}
                        alt="Wine"
                        className="w-10 h-10 rounded-md object-cover border border-cream"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-wine-900">{wine.name}</div>
                        <div className="text-sm text-gray-500">
                            {wine.type || 'Type'} · {wine.vintage || 'Vintage'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-wine-600">x{wine.quantity}</div>
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
              <div className="grid gap-8">
                {['FRIDGE', 'CELLAR'].map((location) => {
                  const locationWines = wines.filter((w) => (w.location || 'CELLAR') === location);
                  if (locationWines.length === 0) return null;

                  const winesByRow = locationWines.reduce((acc, wine) => {
                    const row = wine.rowId || 0;
                    if (!acc[row]) acc[row] = [];
                    acc[row].push(wine);
                    return acc;
                  }, {} as Record<number, LocalWine[]>);

                  const isFridge = location === 'FRIDGE';
                  const shelfIds = Object.keys(winesByRow).sort((a, b) => Number(a) - Number(b));

                  return (
                    <div
                      key={location}
                      className={`relative rounded-lg overflow-hidden shadow-2xl ${
                        isFridge
                          ? 'bg-gradient-to-b from-slate-400 to-slate-500 border-4 border-slate-600'
                          : 'bg-gradient-to-b from-amber-900 to-amber-800 border-4 border-amber-950'
                      }`}
                    >
                      {/* Fridge header */}
                      <div
                        className={`px-6 py-4 ${
                          isFridge
                            ? 'bg-gradient-to-r from-slate-500 to-slate-600'
                            : 'bg-gradient-to-r from-amber-800 to-amber-900'
                        } text-white flex items-center justify-between`}
                      >
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                          {isFridge ? '🧊 Fridge' : '🍷 Wine Cellar'}
                        </h3>
                        <div className="text-sm font-semibold opacity-75">
                          {locationWines.length} wine{locationWines.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Shelves container */}
                      <div className={`p-4 space-y-3 ${isFridge ? 'bg-slate-100' : 'bg-amber-100'}`}>
                        {shelfIds.map((shelfId) => {
                          const shelfKey = `${location}-${shelfId}`;
                          const isExpanded = expandedShelf === shelfKey;
                          const shelfWines = winesByRow[shelfId];
                          const shelfLabel = shelfId === '0' ? 'Unsorted' : `Row ${shelfId}`;

                          return (
                            <div
                              key={shelfId}
                              className={`transition-all duration-300 rounded-lg overflow-hidden ${
                                isFridge ? 'bg-white' : 'bg-yellow-50'
                              } border-2 ${isFridge ? 'border-slate-300' : 'border-amber-300'}`}
                            >
                              {/* Shelf header (clickable) */}
                              <button
                                onClick={() =>
                                  setExpandedShelf(isExpanded ? null : shelfKey)
                                }
                                className={`w-full px-4 py-3 flex items-center justify-between font-semibold transition-all hover:opacity-90 ${
                                  isExpanded
                                    ? isFridge
                                      ? 'bg-slate-300'
                                      : 'bg-amber-300'
                                    : isFridge
                                    ? 'bg-slate-200'
                                    : 'bg-amber-200'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="text-lg">
                                    {isExpanded ? '▼' : '▶'}
                                  </span>
                                  <span className="text-gray-900">{shelfLabel}</span>
                                  <span className="text-xs font-normal text-gray-600">
                                    ({shelfWines.length})
                                  </span>
                                </span>
                              </button>

                              {/* Shelf contents (expandable) */}
                              {isExpanded && (
                                <div
                                  className={`px-4 py-3 space-y-2 border-t-2 ${
                                    isFridge ? 'border-slate-200' : 'border-amber-200'
                                  } transition-all duration-300`}
                                >
                                  {shelfWines.length === 0 ? (
                                    <p className="text-gray-500 text-sm py-2">
                                      No wines in this shelf
                                    </p>
                                  ) : (
                                    shelfWines.map((wine) => (
                                      <div
                                        key={wine.id}
                                        className={`flex items-center justify-between gap-3 p-2 rounded transition-all cursor-pointer hover:shadow-md ${
                                          isFridge
                                            ? 'bg-blue-50 hover:bg-blue-100'
                                            : 'bg-amber-50 hover:bg-amber-100'
                                        }`}
                                        onClick={() => setSelectedWine(wine)}
                                      >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <img
                                            src={
                                              wine.imageUrl ||
                                              '/wine-placeholder.svg'
                                            }
                                            alt="Wine"
                                            className="w-10 h-10 rounded object-cover border-2 border-gray-300"
                                          />
                                          <div className="min-w-0">
                                            <div className="font-semibold text-gray-900 truncate">
                                              {wine.name}
                                            </div>
                                            <div className="text-xs text-gray-600 truncate">
                                              {wine.type || 'Type'} ·{' '}
                                              {wine.vintage || 'Vintage'}
                                            </div>
                                          </div>
                                        </div>
                                        <span className="font-semibold text-wine-600 bg-white px-2 py-1 rounded text-sm whitespace-nowrap">
                                          ×{wine.quantity}
                                        </span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          )}
        </div>

        {/* Wine Detail Modal */}
        {selectedWine && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setSelectedWine(null)}
          >
            <div
              className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                <img
                  src={selectedWine.imageUrl || '/wine-placeholder.svg'}
                  alt={selectedWine.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedWine(null)}
                  className="absolute top-2 right-2 bg-white rounded-full p-2 hover:bg-gray-100 transition shadow-lg"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <h2 className="text-2xl font-bold text-wine-900">
                    {selectedWine.name}
                  </h2>
                </div>

                {/* Basic Info Grid */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Type
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedWine.type || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Vintage
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedWine.vintage || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Quantity
                    </p>
                    <p className="text-sm font-semibold text-wine-600 mt-1">
                      ×{selectedWine.quantity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Location
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedWine.location === 'FRIDGE' ? '🧊 Fridge' : '🍷 Cellar'}
                    </p>
                  </div>
                </div>

                {/* Details */}
                {(selectedWine.winery || selectedWine.region || selectedWine.country) && (
                  <div className="space-y-2">
                    {selectedWine.winery && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Winery
                        </p>
                        <p className="text-sm text-gray-700">{selectedWine.winery}</p>
                      </div>
                    )}
                    {selectedWine.region && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Region
                        </p>
                        <p className="text-sm text-gray-700">{selectedWine.region}</p>
                      </div>
                    )}
                    {selectedWine.country && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Country
                        </p>
                        <p className="text-sm text-gray-700">{selectedWine.country}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedWine.rowId && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Row ID
                    </p>
                    <p className="text-sm text-gray-700">Row {selectedWine.rowId}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleEditStart(selectedWine);
                      setSelectedWine(null);
                    }}
                    className="flex-1 px-4 py-2 bg-wine-600 text-white font-semibold rounded-lg hover:bg-wine-700 transition"
                  >
                    {t('wines.edit_wine')}
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(selectedWine.id);
                      setSelectedWine(null);
                    }}
                    disabled={deletingWineId === selectedWine.id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('wines.delete_wine')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Wine Modal */}
        {showAddForm && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => handleEditCancel()}
          >
            <div
              className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
                <h2 className="text-xl font-bold text-wine-900">
                  {editingWine ? t('wines.edit_wine') : t('wines.add_wine')}
                </h2>
                <button
                  onClick={() => handleEditCancel()}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
                {/* Wine Name */}
                <div>
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

                {/* Type & Vintage */}
                <div className="grid grid-cols-2 gap-3">
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
                </div>

                {/* Quantity & Location */}
                <div className="grid grid-cols-2 gap-3">
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
                </div>

                {/* Row ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Row ID (Optional)
                  </label>
                  <input
                    type="number"
                    name="rowId"
                    min={1}
                    value={formData.rowId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-transparent"
                    placeholder="e.g. 1, 2, 3..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={savingWine}
                    className="flex-1 px-4 py-2 bg-wine-600 text-white font-semibold rounded-lg hover:bg-wine-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingWine ? t('wines.edit_wine') : t('wines.add_wine')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditCancel()}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
