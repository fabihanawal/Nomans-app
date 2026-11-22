import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { getTodayISO } from '../lib/formatters';
import {
  FIELD_LIMITS,
  TRIP_CATEGORIES,
  type Driver,
  type TripCategory,
  type TripEntry,
  type Vehicle,
} from '../types/fleet';
import type { TripInput } from '../lib/fleetService';

interface EntryModalProps {
  isOpen: boolean;
  editingTrip: TripEntry | null;
  vehicles: Vehicle[];
  drivers: Driver[];
  selectedVehicleId: string;
  existingPlaces: string[];
  onClose: () => void;
  onSave: (input: TripInput, editingId?: string) => Promise<void>;
}

const DEFAULT_PLACES = [
  'নওগাঁ',
  'রাজশাহী',
  'বগুড়া',
  'ঢাকা',
  'LPG ফুল',
  'অকটেন',
  'মবিল পরিবর্তন',
  'টায়ার কেনা',
  'ট্যাক্স টোকেন',
  'গাড়ি ওয়াশ',
];

const QUICK_CATEGORY_LABELS: Record<TripCategory, string> = {
  'ট্রিপ ভাড়া': 'ট্রিপ ভাড়া',
  'জ্বালানি [LPG, Octane, CNG]': 'জ্বালানি',
  'মেরামত ও পার্টস': 'মেরামত',
  'কাগজপত্র ও ট্যাক্স': 'কাগজপত্র',
  'অন্যান্য': 'অন্যান্য',
};

export function EntryModal({
  isOpen,
  editingTrip,
  vehicles,
  drivers,
  selectedVehicleId,
  existingPlaces,
  onClose,
  onSave,
}: EntryModalProps) {
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [date, setDate] = useState(getTodayISO());
  const [category, setCategory] = useState<TripCategory>('ট্রিপ ভাড়া');
  const [place, setPlace] = useState('');
  const [fair, setFair] = useState('');
  const [cost, setCost] = useState('');
  const [remarks, setRemarks] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (editingTrip) {
      setVehicleId(editingTrip.vehicleId);
      setDriverId(editingTrip.driverId || '');
      setDate(editingTrip.date);
      setCategory(editingTrip.category);
      setPlace(editingTrip.place);
      setFair(editingTrip.fair > 0 ? String(editingTrip.fair) : '');
      setCost(editingTrip.cost > 0 ? String(editingTrip.cost) : '');
      setRemarks(editingTrip.remarks || '');
    } else {
      const defaultVeh =
        selectedVehicleId !== 'all'
          ? selectedVehicleId
          : vehicles[0]?.id || '';
      setVehicleId(defaultVeh);
      const activeDrivers = drivers.filter((d) => d.status === 'সক্রিয়');
      setDriverId(activeDrivers.length === 1 ? activeDrivers[0].id : '');
      setDate(getTodayISO());
      setCategory('ট্রিপ ভাড়া');
      setPlace('');
      setFair('');
      setCost('');
      setRemarks('');
    }
  }, [isOpen, editingTrip, selectedVehicleId, vehicles, drivers]);

  const selectableDrivers = useMemo(() => {
    const active = drivers.filter((d) => d.status === 'সক্রিয়');
    if (
      editingTrip?.driverId &&
      !active.some((d) => d.id === editingTrip.driverId)
    ) {
      const found = drivers.find((d) => d.id === editingTrip.driverId);
      if (found) return [found, ...active];
    }
    return active;
  }, [drivers, editingTrip]);

  const placeSuggestions = useMemo(() => {
    const combined = Array.from(new Set([...existingPlaces, ...DEFAULT_PLACES]));
    const query = place.trim().toLowerCase();
    if (!query) return combined.slice(0, 8);
    return combined
      .filter((p) => p.toLowerCase().includes(query) && p.toLowerCase() !== query)
      .slice(0, 8);
  }, [existingPlaces, place]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) {
      setError('অনুগ্রহ করে একটি গাড়ি নির্বাচন করুন।');
      return;
    }
    if (!place.trim()) {
      setError('স্থান বা বিবরণ লিখুন।');
      return;
    }

    const fairNum = fair.trim() === '' ? 0 : Number(fair);
    const costNum = cost.trim() === '' ? 0 : Number(cost);

    if (Number.isNaN(fairNum) || fairNum < 0 || Number.isNaN(costNum) || costNum < 0) {
      setError('ভাড়া এবং খরচ ০ বা তার বেশি সংখ্যা হতে হবে।');
      return;
    }

    const selectedDriver = drivers.find((d) => d.id === driverId);
    const resolvedDriverId = selectedDriver ? selectedDriver.id : '';
    const resolvedDriverName = selectedDriver ? selectedDriver.name : '';

    setSubmitting(true);
    try {
      await onSave(
        {
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          driverId: resolvedDriverId,
          driverName: resolvedDriverName,
          date,
          place: place.trim(),
          category,
          fair: fairNum,
          cost: costNum,
          remarks: remarks.trim(),
        },
        editingTrip?.id,
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-modal-title"
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-lg sm:max-w-lg sm:rounded-2xl sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2
            id="entry-modal-title"
            className="font-display text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            {editingTrip ? 'এন্ট্রি সম্পাদনা করুন' : 'নতুন ট্রিপ বা খরচ যোগ করুন'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Quick Category Selector */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              ধরন নির্বাচন করুন
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TRIP_CATEGORIES.map((cat) => {
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      active
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {QUICK_CATEGORY_LABELS[cat]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vehicle & Date */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                গাড়ি
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                    {v.registrationNumber ? ` (${v.registrationNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                তারিখ
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Driver Dropdown */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              ড্রাইভার (ট্রিপ সম্পন্নকারী)
            </label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">নির্বাচন করুন / ড্রাইভার প্রযোজ্য নয়</option>
              {selectableDrivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.phone ? ` (${d.phone})` : ''}
                  {d.status !== 'সক্রিয়' ? ` · ${d.status}` : ''}
                </option>
              ))}
            </select>
            {drivers.length === 0 && (
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                ড্রাইভার তালিকা খালি। &apos;গাড়ি ও ড্রাইভার&apos; মেনু থেকে নতুন ড্রাইভার যুক্ত করতে পারবেন।
              </p>
            )}
          </div>

          {/* Place / Description with Autocomplete */}
          <div className="relative">
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              স্থান / বিবরণ
            </label>
            <input
              type="text"
              required
              maxLength={FIELD_LIMITS.PLACE_MAX}
              value={place}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onChange={(e) => {
                setPlace(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="যেমন: নওগাঁ, রাজশাহী, LPG ফুল, মবিল পরিবর্তন..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            {showSuggestions && placeSuggestions.length > 0 && (
              <div className="absolute right-0 left-0 z-20 mt-1 max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-md dark:border-slate-700 dark:bg-slate-800">
                {placeSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={() => {
                      setPlace(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <span>{suggestion}</span>
                    <span className="text-[11px] text-slate-400">বেছে নিন</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fair & Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-emerald-700 dark:text-emerald-400">
                ভাড়া / আয় (৳)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={fair}
                onChange={(e) => setFair(e.target.value)}
                placeholder="০"
                className="font-mono tabular-nums w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-rose-700 dark:text-rose-400">
                খরচ (৳)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="০"
                className="font-mono tabular-nums w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              মন্তব্য (ঐচ্ছিক)
            </label>
            <textarea
              rows={2}
              maxLength={FIELD_LIMITS.REMARKS_MAX}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="মিটার রিডিং, ড্রাইভার নোট বা বাড়তি তথ্য..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting
                ? 'সংরক্ষণ হচ্ছে...'
                : editingTrip
                  ? 'আপডেট করুন'
                  : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
