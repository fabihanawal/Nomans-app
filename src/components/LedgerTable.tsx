import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { exportLedgerToCSV, exportLedgerToExcel } from '../lib/excelUtils';
import { formatBDT, formatNumber, formatShortDate } from '../lib/formatters';
import {
  TRIP_CATEGORIES,
  type Driver,
  type TripEntry,
  type TripWithBalance,
} from '../types/fleet';

interface LedgerTableProps {
  trips: TripWithBalance[];
  drivers: Driver[];
  loading: boolean;
  showVehicleColumn: boolean;
  vehicleLabel: string;
  useBanglaDigits: boolean;
  onAddNew: () => void;
  onOpenImport: () => void;
  onEdit: (trip: TripEntry) => void;
  onDelete: (trip: TripEntry) => void;
  onPrint: (rows: TripWithBalance[]) => void;
}

export function LedgerTable({
  trips,
  drivers,
  loading,
  showVehicleColumn,
  vehicleLabel,
  useBanglaDigits,
  onAddNew,
  onOpenImport,
  onEdit,
  onDelete,
  onPrint,
}: LedgerTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredTrips = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = trips.filter((t) => {
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (driverFilter !== 'all' && t.driverId !== driverFilter) return false;
      if (query) {
        const matchesPlace = t.place.toLowerCase().includes(query);
        const matchesRemarks = t.remarks.toLowerCase().includes(query);
        const matchesVehicle = t.vehicleName.toLowerCase().includes(query);
        const matchesDriver = (t.driverName || '').toLowerCase().includes(query);
        if (!matchesPlace && !matchesRemarks && !matchesVehicle && !matchesDriver) {
          return false;
        }
      }
      return true;
    });

    return sortOrder === 'desc' ? [...list].reverse() : list;
  }, [trips, searchQuery, startDate, endDate, categoryFilter, driverFilter, sortOrder]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    startDate !== '' ||
    endDate !== '' ||
    categoryFilter !== 'all' ||
    driverFilter !== 'all';

  const totalFair = filteredTrips.reduce((sum, t) => sum + t.fair, 0);
  const totalCost = filteredTrips.reduce((sum, t) => sum + t.cost, 0);
  const netProfit = totalFair - totalCost;

  const resetFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setCategoryFilter('all');
    setDriverFilter('all');
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 h-9 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-11 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/70"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Toolbar & Filters */}
      <div className="border-b border-slate-200 p-4 sm:p-5 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              হিসাবের খাতা (লেজার)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              মোট {formatNumber(filteredTrips.length, useBanglaDigits)}টি এন্ট্রি প্রদর্শিত হচ্ছে
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSortOrder((s) => (s === 'desc' ? 'asc' : 'desc'))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>{sortOrder === 'desc' ? 'নতুন আগে' : 'তারিখের ক্রম'}</span>
            </button>

            <button
              type="button"
              onClick={() => exportLedgerToExcel(filteredTrips, vehicleLabel)}
              disabled={filteredTrips.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={() => exportLedgerToCSV(filteredTrips)}
              disabled={filteredTrips.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={() => onPrint(filteredTrips)}
              disabled={filteredTrips.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>প্রিন্ট / PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs */}
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
          <div className="relative lg:col-span-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="স্থান, ড্রাইভার বা মন্তব্য..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="ধরন অনুযায়ী ফিল্টার"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">সকল ধরন</option>
              {TRIP_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              aria-label="ড্রাইভার অনুযায়ী ফিল্টার"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">সকল ড্রাইভার</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 lg:col-span-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="শুরুর তারিখ"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <span className="text-xs text-slate-400">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="শেষ তারিখ"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center lg:col-span-1">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                title="ফিল্টার রিসেট করুন"
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="lg:hidden">রিসেট</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <p className="font-display text-base font-semibold text-slate-800 dark:text-slate-200">
            {hasActiveFilters
              ? 'ফিল্টার অনুযায়ী কোনো হিসাব পাওয়া যায়নি'
              : 'এখনো কোনো ট্রিপ বা খরচের হিসাব যোগ করা হয়নি'}
          </p>
          <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
            {hasActiveFilters
              ? 'অনুগ্রহ করে তারিখ বা সার্চ ফিল্টার পরিবর্তন করে আবার দেখুন।'
              : 'নতুন ট্রিপ যোগ করুন অথবা আপনার পুরোনো Excel/CSV ফাইল এক ক্লিকে ইমপোর্ট করুন।'}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>সকল ফিল্টার মুছুন</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onAddNew}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>প্রথম এন্ট্রি যোগ করুন</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenImport}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Excel ইমপোর্ট করুন</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Ledger Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                  <th className="px-4 py-3 whitespace-nowrap">তারিখ</th>
                  {showVehicleColumn && (
                    <th className="px-4 py-3 whitespace-nowrap">গাড়ি</th>
                  )}
                  <th className="px-4 py-3">স্থান ও বিবরণ</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">ভাড়া (আয়)</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">খরচ</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">চলমান ব্যালেন্স</th>
                  <th className="px-4 py-3">মন্তব্য</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredTrips.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="font-mono tabular-nums px-4 py-3 text-xs whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {formatShortDate(row.date, useBanglaDigits)}
                    </td>
                    {showVehicleColumn && (
                      <td className="px-4 py-3 text-xs font-medium whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {row.vehicleName}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {row.place}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>{row.category}</span>
                        {row.driverName && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              ড্রাইভার: {row.driverName}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="font-mono tabular-nums px-4 py-3 text-right text-xs font-semibold whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                      {row.fair > 0 ? formatBDT(row.fair, useBanglaDigits) : '—'}
                    </td>
                    <td className="font-mono tabular-nums px-4 py-3 text-right text-xs font-semibold whitespace-nowrap text-rose-600 dark:text-rose-400">
                      {row.cost > 0 ? formatBDT(row.cost, useBanglaDigits) : '—'}
                    </td>
                    <td
                      className={`font-mono tabular-nums px-4 py-3 text-right text-xs font-semibold whitespace-nowrap ${
                        row.runningBalance >= 0
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatBDT(row.runningBalance, useBanglaDigits)}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {row.remarks || '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          aria-label="সম্পাদনা করুন"
                          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          aria-label="মুছে ফেলুন"
                          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/60 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 text-xs font-bold dark:border-slate-700 dark:bg-slate-800/70">
                  <td colSpan={showVehicleColumn ? 3 : 2} className="px-4 py-3.5 text-slate-800 dark:text-slate-200">
                    ফিল্টার করা ফলাফলের মোট ({formatNumber(filteredTrips.length, useBanglaDigits)}টি এন্ট্রি)
                  </td>
                  <td className="font-mono tabular-nums px-4 py-3.5 text-right whitespace-nowrap text-emerald-700 dark:text-emerald-400">
                    {formatBDT(totalFair, useBanglaDigits)}
                  </td>
                  <td className="font-mono tabular-nums px-4 py-3.5 text-right whitespace-nowrap text-rose-700 dark:text-rose-400">
                    {formatBDT(totalCost, useBanglaDigits)}
                  </td>
                  <td
                    className={`font-mono tabular-nums px-4 py-3.5 text-right whitespace-nowrap ${
                      netProfit >= 0
                        ? 'text-indigo-700 dark:text-indigo-300'
                        : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    নিট লাভ: {formatBDT(netProfit, useBanglaDigits)}
                  </td>
                  <td colSpan={2} className="px-4 py-3.5" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Responsive Card View */}
          <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
            {filteredTrips.map((row) => (
              <div key={row.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono tabular-nums">
                        {formatShortDate(row.date, useBanglaDigits)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{row.category}</span>
                      {showVehicleColumn && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {row.vehicleName}
                          </span>
                        </>
                      )}
                      {row.driverName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            ড্রাইভার: {row.driverName}
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {row.place}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      aria-label="সম্পাদনা করুন"
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      aria-label="মুছে ফেলুন"
                      className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/60"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-slate-800/60">
                  <div>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      ভাড়া (আয়)
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {row.fair > 0 ? formatBDT(row.fair, useBanglaDigits) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      খরচ
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                      {row.cost > 0 ? formatBDT(row.cost, useBanglaDigits) : '—'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      চলমান ব্যালেন্স
                    </span>
                    <span
                      className={`font-mono tabular-nums font-semibold ${
                        row.runningBalance >= 0
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatBDT(row.runningBalance, useBanglaDigits)}
                    </span>
                  </div>
                </div>

                {row.remarks && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    মন্তব্য: {row.remarks}
                  </p>
                )}
              </div>
            ))}

            {/* Mobile Footer Summary */}
            <div className="bg-slate-50 p-4 text-xs dark:bg-slate-800/70">
              <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                <span>মোট ভাড়া:</span>
                <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatBDT(totalFair, useBanglaDigits)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                <span>মোট খরচ:</span>
                <span className="font-mono tabular-nums text-rose-600 dark:text-rose-400">
                  {formatBDT(totalCost, useBanglaDigits)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 font-bold dark:border-slate-700">
                <span>নিট লাভ:</span>
                <span
                  className={`font-mono tabular-nums ${
                    netProfit >= 0
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatBDT(netProfit, useBanglaDigits)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
