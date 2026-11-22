import type { TripEntry, TripWithBalance } from '../types/fleet';

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const BANGLA_MONTHS_SHORT = [
  'জানু',
  'ফেব্রু',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টে',
  'অক্টো',
  'নভে',
  'ডিসে',
];

export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (digit) => BANGLA_DIGITS[Number(digit)] ?? digit);
}

export function formatNumber(amount: number, useBanglaDigits = true): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const formatted = new Intl.NumberFormat('en-IN').format(Math.abs(safe));
  const signed = safe < 0 ? `-${formatted}` : formatted;
  return useBanglaDigits ? toBanglaDigits(signed) : signed;
}

export function formatBDT(amount: number, useBanglaDigits = true): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const absFormatted = new Intl.NumberFormat('en-IN').format(Math.abs(safe));
  const numPart = useBanglaDigits ? toBanglaDigits(absFormatted) : absFormatted;
  return safe < 0 ? `-৳ ${numPart}` : `৳ ${numPart}`;
}

export function formatShortDate(isoDate: string, useBanglaDigits = true): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || '—';
  const [yyyy, mm, dd] = isoDate.split('-');
  const raw = `${dd}.${mm}.${yyyy.slice(2)}`;
  return useBanglaDigits ? toBanglaDigits(raw) : raw;
}

export function formatMonthLabel(yearMonth: string, useBanglaDigits = true): string {
  const [yyyy, mm] = yearMonth.split('-');
  const monthIdx = Number(mm) - 1;
  const monthName = BANGLA_MONTHS_SHORT[monthIdx] || mm;
  const yearText = useBanglaDigits ? toBanglaDigits(yyyy) : yyyy;
  return `${monthName} ${yearText}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentYearMonth(): string {
  return getTodayISO().slice(0, 7);
}

function getTimestampMillis(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'object' && ts !== null) {
    const maybe = ts as { toMillis?: () => number; seconds?: number };
    if (typeof maybe.toMillis === 'function') return maybe.toMillis();
    if (typeof maybe.seconds === 'number') return maybe.seconds * 1000;
  }
  return 0;
}

/**
 * Dynamically calculates Running Balance chronologically:
 * Running Balance = Previous Balance + (Fair - Cost)
 */
export function calculateRunningBalances(trips: TripEntry[]): TripWithBalance[] {
  const sorted = [...trips].sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    const timeCmp = getTimestampMillis(a.createdAt) - getTimestampMillis(b.createdAt);
    if (timeCmp !== 0) return timeCmp;
    return a.id.localeCompare(b.id);
  });

  let runningBalance = 0;
  return sorted.map((trip) => {
    const fair = Number(trip.fair) || 0;
    const cost = Number(trip.cost) || 0;
    const netChange = fair - cost;
    runningBalance += netChange;
    return {
      ...trip,
      fair,
      cost,
      netChange,
      runningBalance,
    };
  });
}
