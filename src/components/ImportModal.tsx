import { useEffect, useState, type ChangeEvent } from 'react';
import { Download, FileSpreadsheet, Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { downloadSampleTemplate, parseImportFile } from '../lib/excelUtils';
import { formatBDT, formatShortDate } from '../lib/formatters';
import type { Driver, ImportPreviewRow, Vehicle } from '../types/fleet';

interface ImportModalProps {
  isOpen: boolean;
  vehicles: Vehicle[];
  drivers: Driver[];
  selectedVehicleId: string;
  useBanglaDigits: boolean;
  onClose: () => void;
  onConfirmImport: (
    vehicle: Vehicle,
    driver: Driver | null,
    rows: ImportPreviewRow[],
  ) => Promise<number>;
}

export function ImportModal({
  isOpen,
  vehicles,
  drivers,
  selectedVehicleId,
  useBanglaDigits,
  onClose,
  onConfirmImport,
}: ImportModalProps) {
  const [targetVehicleId, setTargetVehicleId] = useState('');
  const [targetDriverId, setTargetDriverId] = useState('');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ImportPreviewRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setFileName('');
    setRows([]);
    setTargetVehicleId(
      selectedVehicleId !== 'all' ? selectedVehicleId : vehicles[0]?.id || '',
    );
    setTargetDriverId('');
  }, [isOpen, selectedVehicleId, vehicles]);

  if (!isOpen) return null;

  const validRows = rows.filter((r) => r.isValid);
  const invalidRows = rows.filter((r) => !r.isValid);
  const totalFair = validRows.reduce((s, r) => s + r.fair, 0);
  const totalCost = validRows.reduce((s, r) => s + r.cost, 0);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setParsing(true);
    setFileName(file.name);
    try {
      const parsed = await parseImportFile(file);
      if (parsed.length === 0) {
        setError('ফাইলে কোনো ডেটা পাওয়া যায়নি। কলাম নাম Date, Place, Fair, Cost, Remarks আছে কিনা যাচাই করুন।');
      }
      setRows(parsed);
    } catch {
      setError('ফাইলটি পড়তে সমস্যা হয়েছে। সঠিক .xlsx, .xls অথবা .csv ফাইল আপলোড করুন।');
      setRows([]);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    const vehicle = vehicles.find((v) => v.id === targetVehicleId);
    if (!vehicle) {
      setError('অনুগ্রহ করে গাড়ি নির্বাচন করুন।');
      return;
    }
    if (validRows.length === 0) {
      setError('ইমপোর্ট করার জন্য কোনো বৈধ সারি নেই।');
      return;
    }

    const driver = drivers.find((d) => d.id === targetDriverId) || null;

    setImporting(true);
    setError('');
    try {
      await onConfirmImport(vehicle, driver, validRows);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ইমপোর্ট করতে সমস্যা হয়েছে।');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="import-modal-title"
                className="font-display text-lg font-bold text-slate-900 dark:text-slate-100"
              >
                Excel / CSV থেকে পুরোনো হিসাব ইমপোর্ট করুন
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সাপোর্টেড কলাম: Date, Place, Fair, Cost, Remarks (অথবা বাংলা শিরোনাম)
              </p>
            </div>
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

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                কোন গাড়ির হিসাবে যোগ হবে?
              </label>
              <select
                value={targetVehicleId}
                onChange={(e) => setTargetVehicleId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                ড্রাইভার (ঐচ্ছিক)
              </label>
              <select
                value={targetDriverId}
                onChange={(e) => setTargetDriverId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">নির্ধারিত নয়</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end justify-start sm:justify-end">
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                <span>নমুনা Excel ডাউনলোড</span>
              </button>
            </div>
          </div>

          {/* File Upload Area */}
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-6 py-7 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-50/30 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-emerald-500">
            <Upload className="h-7 w-7 text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              {fileName ? fileName : '.xlsx, .xls অথবা .csv ফাইল বেছে নিতে ক্লিক করুন'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              আপলোড করার পর নিচে প্রিভিউ দেখাবে — নিশ্চিত হয়ে সেভ করুন
            </p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {parsing && (
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              ফাইল বিশ্লেষণ করা হচ্ছে...
            </p>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs dark:border-slate-800 dark:bg-slate-800/60">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    বৈধ সারি: {validRows.length} টি
                  </span>
                  {invalidRows.length > 0 && (
                    <span className="flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
                      <AlertCircle className="h-4 w-4" />
                      ত্রুটিপূর্ণ: {invalidRows.length} টি (বাদ পড়বে)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 tabular-nums">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    মোট ভাড়া: <strong>{formatBDT(totalFair, useBanglaDigits)}</strong>
                  </span>
                  <span className="text-rose-600 dark:text-rose-400">
                    মোট খরচ: <strong>{formatBDT(totalCost, useBanglaDigits)}</strong>
                  </span>
                </div>
              </div>

              <div className="max-h-72 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">তারিখ</th>
                      <th className="px-3 py-2.5 font-semibold">স্থান ও বিবরণ</th>
                      <th className="px-3 py-2.5 font-semibold">ধরন</th>
                      <th className="px-3 py-2.5 text-right font-semibold">ভাড়া</th>
                      <th className="px-3 py-2.5 text-right font-semibold">খরচ</th>
                      <th className="px-3 py-2.5 font-semibold">মন্তব্য</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.slice(0, 150).map((row) => (
                      <tr
                        key={row.rowIndex}
                        className={
                          row.isValid
                            ? 'bg-white dark:bg-slate-900'
                            : 'bg-rose-50/70 dark:bg-rose-950/30'
                        }
                      >
                        <td className="font-mono tabular-nums px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {row.isValid ? formatShortDate(row.date, useBanglaDigits) : row.error}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                          {row.place || '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                          {row.category}
                        </td>
                        <td className="font-mono tabular-nums px-3 py-2 text-right text-emerald-600 dark:text-emerald-400">
                          {row.fair > 0 ? formatBDT(row.fair, useBanglaDigits) : '—'}
                        </td>
                        <td className="font-mono tabular-nums px-3 py-2 text-right text-rose-600 dark:text-rose-400">
                          {row.cost > 0 ? formatBDT(row.cost, useBanglaDigits) : '—'}
                        </td>
                        <td className="max-w-[180px] truncate px-3 py-2 text-slate-500 dark:text-slate-400">
                          {row.remarks || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 150 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  প্রিভিউতে প্রথম ১৫০টি সারি দেখানো হচ্ছে; সংরক্ষণের সময় সব {validRows.length}টি বৈধ সারি সেভ হবে।
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || validRows.length === 0}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {importing
              ? 'ডাটাবেজে সেভ হচ্ছে...'
              : `${validRows.length}টি এন্ট্রি সেভ করুন`}
          </button>
        </div>
      </div>
    </div>
  );
}
