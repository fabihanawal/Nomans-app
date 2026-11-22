import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatBDT, formatMonthLabel, formatNumber } from '../lib/formatters';
import type { TripWithBalance } from '../types/fleet';

interface MonthlyChartProps {
  trips: TripWithBalance[];
  loading: boolean;
  useBanglaDigits: boolean;
  darkMode: boolean;
}

interface MonthlyDataPoint {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
  profit: number;
}

export function MonthlyChart({
  trips,
  loading,
  useBanglaDigits,
  darkMode,
}: MonthlyChartProps) {
  const data = useMemo<MonthlyDataPoint[]>(() => {
    const grouped = new Map<string, { income: number; expense: number }>();

    for (const trip of trips) {
      const monthKey = trip.date.slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(monthKey)) continue;
      const existing = grouped.get(monthKey) || { income: 0, expense: 0 };
      existing.income += trip.fair;
      existing.expense += trip.cost;
      grouped.set(monthKey, existing);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([monthKey, val]) => ({
        monthKey,
        label: formatMonthLabel(monthKey, useBanglaDigits),
        income: val.income,
        expense: val.expense,
        profit: val.income - val.expense,
      }));
  }, [trips, useBanglaDigits]);

  if (loading) {
    return (
      <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-6 h-56 w-full rounded-lg bg-slate-100 dark:bg-slate-800/60" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
            মাসভিত্তিক আয় বনাম খরচ
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            সর্বশেষ ১২ মাসের তুলনামূলক হিসাব
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          গ্রাফ দেখার জন্য এখনো পর্যাপ্ত এন্ট্রি যোগ করা হয়নি।
        </div>
      ) : (
        <div className="h-68 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={darkMode ? '#1e293b' : '#e2e8f0'}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
                axisLine={{ stroke: darkMode ? '#334155' : '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(val: number) => formatNumber(val, useBanglaDigits)}
                tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={65}
              />
              <Tooltip
                cursor={{ fill: darkMode ? 'rgba(51,65,85,0.3)' : 'rgba(241,245,249,0.8)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const point = payload[0]?.payload as MonthlyDataPoint;
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900">
                      <p className="font-display mb-1.5 font-bold text-slate-900 dark:text-slate-100">
                        {label}
                      </p>
                      <div className="space-y-1 tabular-nums">
                        <p className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                          <span>মোট আয়:</span>
                          <span className="font-mono font-semibold">
                            {formatBDT(point.income, useBanglaDigits)}
                          </span>
                        </p>
                        <p className="flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400">
                          <span>মোট খরচ:</span>
                          <span className="font-mono font-semibold">
                            {formatBDT(point.expense, useBanglaDigits)}
                          </span>
                        </p>
                        <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                        <p className="flex items-center justify-between gap-4 text-indigo-600 dark:text-indigo-400">
                          <span>নিট লাভ:</span>
                          <span className="font-mono font-semibold">
                            {formatBDT(point.profit, useBanglaDigits)}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                formatter={(value) =>
                  value === 'income' ? 'আয় (ভাড়া)' : 'খরচ'
                }
              />
              <Bar
                dataKey="income"
                name="income"
                fill="#059669"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="expense"
                name="expense"
                fill="#e11d48"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
