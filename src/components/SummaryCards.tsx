import { ArrowDownLeft, ArrowUpRight, CalendarCheck2, Wallet } from 'lucide-react';
import { formatBDT, formatNumber, getCurrentYearMonth } from '../lib/formatters';
import type { TripWithBalance } from '../types/fleet';

interface SummaryCardsProps {
  trips: TripWithBalance[];
  loading: boolean;
  useBanglaDigits: boolean;
}

export function SummaryCards({ trips, loading, useBanglaDigits }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-4 h-7 w-36 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 h-3 w-28 rounded bg-slate-100 dark:bg-slate-800/70" />
          </div>
        ))}
      </div>
    );
  }

  const totalFair = trips.reduce((sum, t) => sum + t.fair, 0);
  const totalCost = trips.reduce((sum, t) => sum + t.cost, 0);
  const currentBalance =
    trips.length > 0 ? trips[trips.length - 1].runningBalance : 0;

  const currentYM = getCurrentYearMonth();
  const currentMonthTrips = trips.filter((t) => t.date.startsWith(currentYM));
  const monthFair = currentMonthTrips.reduce((sum, t) => sum + t.fair, 0);
  const monthCost = currentMonthTrips.reduce((sum, t) => sum + t.cost, 0);
  const monthProfit = monthFair - monthCost;
  const tripCount = trips.filter((t) => t.category === 'ট্রিপ ভাড়া' || t.fair > 0).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Card 1: Total Income */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            মোট আয় (ভাড়া)
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
        <p className="font-mono tabular-nums mt-3 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
          {formatBDT(totalFair, useBanglaDigits)}
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          চলতি মাসে আয়: <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">{formatBDT(monthFair, useBanglaDigits)}</span>
        </p>
      </div>

      {/* Card 2: Total Expense */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            মোট খরচ
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <ArrowDownLeft className="h-4 w-4" />
          </span>
        </div>
        <p className="font-mono tabular-nums mt-3 text-2xl font-semibold text-rose-600 dark:text-rose-400">
          {formatBDT(totalCost, useBanglaDigits)}
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          চলতি মাসে খরচ: <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">{formatBDT(monthCost, useBanglaDigits)}</span>
        </p>
      </div>

      {/* Card 3: Current Net Balance */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
            বর্তমান নিট ব্যালেন্স
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
            <Wallet className="h-4 w-4" />
          </span>
        </div>
        <p
          className={`font-mono tabular-nums mt-3 text-2xl font-semibold ${
            currentBalance >= 0
              ? 'text-indigo-700 dark:text-indigo-300'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {formatBDT(currentBalance, useBanglaDigits)}
        </p>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          সর্বশেষ হিসাব অনুযায়ী স্থিতি
        </p>
      </div>

      {/* Card 4: Current Month Profit & Total Trips */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            চলতি মাসের নিট লাভ ও ট্রিপ
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <CalendarCheck2 className="h-4 w-4" />
          </span>
        </div>
        <p
          className={`font-mono tabular-nums mt-3 text-2xl font-semibold ${
            monthProfit >= 0
              ? 'text-slate-900 dark:text-slate-100'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {formatBDT(monthProfit, useBanglaDigits)}
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          মোট ট্রিপ: <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-200">{formatNumber(tripCount, useBanglaDigits)} টি</span>
          <span className="mx-1.5" aria-hidden="true">·</span>
          <span>মোট এন্ট্রি: {formatNumber(trips.length, useBanglaDigits)}</span>
        </p>
      </div>
    </div>
  );
}
