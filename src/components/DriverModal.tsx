import { useEffect, useState, type FormEvent } from 'react';
import { UserCheck, X } from 'lucide-react';
import {
  DRIVER_STATUSES,
  FIELD_LIMITS,
  type Driver,
  type DriverStatus,
} from '../types/fleet';
import type { DriverInput } from '../lib/fleetService';

interface DriverModalProps {
  isOpen: boolean;
  editingDriver: Driver | null;
  onClose: () => void;
  onSave: (input: DriverInput, editingId?: string) => Promise<void>;
}

export function DriverModal({
  isOpen,
  editingDriver,
  onClose,
  onSave,
}: DriverModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [status, setStatus] = useState<DriverStatus>('সক্রিয়');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (editingDriver) {
      setName(editingDriver.name);
      setPhone(editingDriver.phone || '');
      setLicenseNumber(editingDriver.licenseNumber || '');
      setStatus(editingDriver.status || 'সক্রিয়');
      setNotes(editingDriver.notes || '');
    } else {
      setName('');
      setPhone('');
      setLicenseNumber('');
      setStatus('সক্রিয়');
      setNotes('');
    }
  }, [isOpen, editingDriver]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('ড্রাইভারের নাম লিখুন।');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(
        {
          name: name.trim(),
          phone: phone.trim(),
          licenseNumber: licenseNumber.trim(),
          status,
          notes: notes.trim(),
        },
        editingDriver?.id,
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
      aria-labelledby="driver-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <h2
              id="driver-modal-title"
              className="font-display text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              {editingDriver ? 'ড্রাইভারের তথ্য আপডেট করুন' : 'নতুন ড্রাইভার যুক্ত করুন'}
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
              ড্রাইভারের নাম
            </label>
            <input
              type="text"
              required
              maxLength={FIELD_LIMITS.DRIVER_NAME_MAX}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: মোঃ করিম মিয়া"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                মোবাইল নম্বর (ঐচ্ছিক)
              </label>
              <input
                type="tel"
                maxLength={FIELD_LIMITS.PHONE_MAX}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="০১৭XXXXXXXX"
                className="font-mono tabular-nums w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                অবস্থা
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DriverStatus)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {DRIVER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              ড্রাইভিং লাইসেন্স নম্বর (ঐচ্ছিক)
            </label>
            <input
              type="text"
              maxLength={FIELD_LIMITS.LICENSE_MAX}
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="যেমন: DK0123456C00001"
              className="font-mono w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              ঠিকানা বা নোট (ঐচ্ছিক)
            </label>
            <textarea
              rows={2}
              maxLength={FIELD_LIMITS.NOTES_MAX}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="বেতন, এনআইডি বা জরুরি যোগাযোগ নোট..."
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
              {submitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
