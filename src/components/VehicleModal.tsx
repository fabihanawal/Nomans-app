import { useEffect, useState, type FormEvent } from 'react';
import { Car, X } from 'lucide-react';
import { FIELD_LIMITS, type Vehicle } from '../types/fleet';
import type { VehicleInput } from '../lib/fleetService';

interface VehicleModalProps {
  isOpen: boolean;
  editingVehicle: Vehicle | null;
  onClose: () => void;
  onSave: (input: VehicleInput, editingId?: string) => Promise<void>;
}

export function VehicleModal({
  isOpen,
  editingVehicle,
  onClose,
  onSave,
}: VehicleModalProps) {
  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [modelYear, setModelYear] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (editingVehicle) {
      setName(editingVehicle.name);
      setRegistrationNumber(editingVehicle.registrationNumber || '');
      setModelYear(editingVehicle.modelYear || '');
    } else {
      setName('');
      setRegistrationNumber('');
      setModelYear('');
    }
  }, [isOpen, editingVehicle]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('গাড়ির নাম লিখুন।');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(
        {
          name: name.trim(),
          registrationNumber: registrationNumber.trim(),
          modelYear: modelYear.trim(),
        },
        editingVehicle?.id,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Car className="h-5 w-5" />
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              {editingVehicle ? 'গাড়ির তথ্য আপডেট করুন' : 'নতুন গাড়ি যুক্ত করুন'}
            </h2>
          </div>
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

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              গাড়ির নাম / মডেল
            </label>
            <input
              type="text"
              required
              maxLength={FIELD_LIMITS.VEHICLE_NAME_MAX}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: Toyota X Corolla, Toyota Noah, HiAce..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              রেজিস্ট্রেশন নম্বর (ঐচ্ছিক)
            </label>
            <input
              type="text"
              maxLength={FIELD_LIMITS.REG_NUMBER_MAX}
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="যেমন: ঢাকা মেট্রো-গ ১৯-৪৫৮২"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              মডেল বছর / নোট (ঐচ্ছিক)
            </label>
            <input
              type="text"
              maxLength={FIELD_LIMITS.MODEL_YEAR_MAX}
              value={modelYear}
              onChange={(e) => setModelYear(e.target.value)}
              placeholder="যেমন: ২০০৮ / LPG কনভার্টেড"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
