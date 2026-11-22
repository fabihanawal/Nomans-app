import { formatBDT, formatNumber, formatShortDate, getTodayISO } from '../lib/formatters';
import type { TripWithBalance } from '../types/fleet';

interface PrintReportViewProps {
  trips: TripWithBalance[];
  vehicleLabel: string;
  useBanglaDigits: boolean;
}

export function PrintReportView({
  trips,
  vehicleLabel,
  useBanglaDigits,
}: PrintReportViewProps) {
  const totalFair = trips.reduce((s, t) => s + t.fair, 0);
  const totalCost = trips.reduce((s, t) => s + t.cost, 0);
  const netBalance = totalFair - totalCost;

  return (
    <div className="print-only hidden bg-white p-4 text-slate-900">
      <div className="border-b-2 border-slate-900 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">গাড়ির হিসাব ও ট্রিপ রিপোর্ট</h1>
            <p className="mt-0.5 text-sm text-slate-700">গাড়ি: {vehicleLabel}</p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p>প্রিন্ট তারিখ: {formatShortDate(getTodayISO(), useBanglaDigits)}</p>
            <p>মোট এন্ট্রি: {formatNumber(trips.length, useBanglaDigits)} টি</p>
          </div>
        </div>
      </div>

      <div className="my-4 grid grid-cols-3 gap-4 border border-slate-300 p-3 text-sm">
        <div>
          <span className="block text-xs text-slate-600">মোট আয় (ভাড়া)</span>
          <span className="font-mono tabular-nums font-bold text-emerald-700">
            {formatBDT(totalFair, useBanglaDigits)}
          </span>
        </div>
        <div>
          <span className="block text-xs text-slate-600">মোট খরচ</span>
          <span className="font-mono tabular-nums font-bold text-rose-700">
            {formatBDT(totalCost, useBanglaDigits)}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-xs text-slate-600">নিট ব্যালেন্স</span>
          <span className="font-mono tabular-nums font-bold text-slate-900">
            {formatBDT(netBalance, useBanglaDigits)}
          </span>
        </div>
      </div>

      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-y border-slate-800 bg-slate-100">
            <th className="px-2 py-2">তারিখ</th>
            <th className="px-2 py-2">স্থান ও বিবরণ</th>
            <th className="px-2 py-2">ড্রাইভার</th>
            <th className="px-2 py-2">ধরন</th>
            <th className="px-2 py-2 text-right">ভাড়া</th>
            <th className="px-2 py-2 text-right">খরচ</th>
            <th className="px-2 py-2 text-right">চলমান ব্যালেন্স</th>
            <th className="px-2 py-2">মন্তব্য</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {trips.map((row) => (
            <tr key={row.id}>
              <td className="font-mono tabular-nums px-2 py-1.5 whitespace-nowrap">
                {formatShortDate(row.date, useBanglaDigits)}
              </td>
              <td className="px-2 py-1.5 font-medium">{row.place}</td>
              <td className="px-2 py-1.5 text-slate-700">{row.driverName || '—'}</td>
              <td className="px-2 py-1.5 text-slate-600">{row.category}</td>
              <td className="font-mono tabular-nums px-2 py-1.5 text-right">
                {row.fair > 0 ? formatBDT(row.fair, useBanglaDigits) : '—'}
              </td>
              <td className="font-mono tabular-nums px-2 py-1.5 text-right">
                {row.cost > 0 ? formatBDT(row.cost, useBanglaDigits) : '—'}
              </td>
              <td className="font-mono tabular-nums px-2 py-1.5 text-right font-semibold">
                {formatBDT(row.runningBalance, useBanglaDigits)}
              </td>
              <td className="px-2 py-1.5 text-slate-600">{row.remarks || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
