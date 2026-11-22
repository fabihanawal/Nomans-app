import * as XLSX from 'xlsx';
import {
  FIELD_LIMITS,
  TRIP_CATEGORIES,
  type ImportPreviewRow,
  type TripCategory,
  type TripWithBalance,
} from '../types/fleet';

const BANGLA_TO_EN_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

function normalizeDigits(value: string): string {
  return value.replace(/[০-৯]/g, (d) => BANGLA_TO_EN_DIGITS[d] ?? d);
}

function parseExcelDate(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === '') return null;

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const parsed = XLSX.SSF.parse_date_code(raw);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      const y = String(parsed.y).padStart(4, '0');
      const m = String(parsed.m).padStart(2, '0');
      const d = String(parsed.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = normalizeDigits(String(raw).trim());
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD.MM.YY or DD/MM/YY or DD-MM-YY or DD.MM.YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    let year = Number(dmyMatch[3]);
    if (year < 100) {
      year += year >= 70 ? 1900 : 2000;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const dt = new Date(str);
  if (!Number.isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

function parseAmount(raw: unknown): number {
  if (raw === null || raw === undefined || raw === '') return 0;
  if (typeof raw === 'number') return Number.isFinite(raw) ? Math.max(0, Math.round(raw * 100) / 100) : 0;
  const cleaned = normalizeDigits(String(raw)).replace(/[^\d.-]/g, '');
  if (!cleaned) return 0;
  const num = Number(cleaned);
  return Number.isFinite(num) ? Math.max(0, Math.round(num * 100) / 100) : 0;
}

export function inferCategory(place: string, rawCategory?: string, fair = 0, cost = 0): TripCategory {
  if (rawCategory) {
    const found = TRIP_CATEGORIES.find(
      (cat) => cat.toLowerCase() === rawCategory.trim().toLowerCase(),
    );
    if (found) return found;
  }

  const text = `${place} ${rawCategory || ''}`.toLowerCase();
  if (
    /lpg|octane|অকটেন|cng|সিএনজি|গ্যাস|পেট্রোল|petrol|fuel|তেল|ডিজেল|diesel/.test(text)
  ) {
    return 'জ্বালানি [LPG, Octane, CNG]';
  }
  if (
    /টায়ার|tire|tyre|মবিল|mobil|পার্টস|parts|মেরামত|repair|গ্যারেজ|garage|সার্ভিস|service|ব্যাটারি|battery|ফিল্টার|filter|ওয়াশ|wash|ব্রেক|brake/.test(
      text,
    )
  ) {
    return 'মেরামত ও পার্টস';
  }
  if (
    /ট্যাক্স|tax|ফিটনেস|fitness|ইন্স্যুরেন্স|insurance|কাগজ|ব্লু-বুক|রুট|পারমিট|permit|ব্রিজ|টোল|toll/.test(
      text,
    )
  ) {
    return 'কাগজপত্র ও ট্যাক্স';
  }
  if (fair > 0 || /ট্রিপ|ভাড়া|রাজশাহী|নওগাঁ|বগুড়া|ঢাকা|রংপুর|সিলেট|চট্টগ্রাম|খুলনা/.test(text)) {
    return 'ট্রিপ ভাড়া';
  }
  if (cost > 0) {
    return 'অন্যান্য';
  }
  return 'ট্রিপ ভাড়া';
}

function getColumnValue(row: Record<string, unknown>, candidates: string[]): unknown {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const matchKey = keys.find(
      (k) => k.trim().toLowerCase().replace(/\s+/g, '') === candidate.toLowerCase().replace(/\s+/g, ''),
    );
    if (matchKey !== undefined) {
      return row[matchKey];
    }
  }
  return undefined;
}

export async function parseImportFile(file: File): Promise<ImportPreviewRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  return rawRows
    .map((row, idx): ImportPreviewRow | null => {
      const rawDate = getColumnValue(row, ['date', 'তারিখ', 'tripdate', 'entrydate']);
      const rawPlace = getColumnValue(row, [
        'place',
        'description',
        'details',
        'স্থান',
        'বিবরণ',
        'স্থান/বিবরণ',
        'স্থান ও বিবরণ',
      ]);
      const rawCategory = getColumnValue(row, ['category', 'type', 'ধরন', 'ক্যাটাগরি']);
      const rawFair = getColumnValue(row, ['fair', 'fare', 'income', 'ভাড়া', 'আয়', 'ভাড়া(আয়)']);
      const rawCost = getColumnValue(row, ['cost', 'expense', 'খরচ', 'ব্যয়']);
      const rawRemarks = getColumnValue(row, ['remarks', 'remark', 'note', 'notes', 'মন্তব্য']);

      const place = String(rawPlace ?? '').trim().slice(0, FIELD_LIMITS.PLACE_MAX);
      const fair = parseAmount(rawFair);
      const cost = parseAmount(rawCost);
      const remarks = String(rawRemarks ?? '').trim().slice(0, FIELD_LIMITS.REMARKS_MAX);
      const parsedDate = parseExcelDate(rawDate);

      // Skip completely blank trailing Excel rows
      if (!rawDate && !place && fair === 0 && cost === 0 && !remarks) {
        return null;
      }

      const category = inferCategory(
        place,
        rawCategory ? String(rawCategory) : undefined,
        fair,
        cost,
      );

      let isValid = true;
      let error: string | undefined;

      if (!parsedDate || !FIELD_LIMITS.DATE_PATTERN.test(parsedDate)) {
        isValid = false;
        error = 'তারিখ সঠিক ফরম্যাটে নেই';
      } else if (!place) {
        isValid = false;
        error = 'স্থান / বিবরণ খালি';
      }

      return {
        rowIndex: idx + 2,
        date: parsedDate || '',
        place,
        category,
        fair,
        cost,
        remarks,
        isValid,
        error,
      };
    })
    .filter((item): item is ImportPreviewRow => item !== null);
}

export function downloadSampleTemplate(): void {
  const sampleRows = [
    {
      Date: '2026-11-01',
      Place: 'নওগাঁ ট্রিপ',
      Category: 'ট্রিপ ভাড়া',
      Fair: 4500,
      Cost: 0,
      Remarks: 'মিটার: ১২০৪৫০ কিমি',
    },
    {
      Date: '2026-11-01',
      Place: 'LPG ফুল',
      Category: 'জ্বালানি [LPG, Octane, CNG]',
      Fair: 0,
      Cost: 1350,
      Remarks: 'বগুড়া পাম্প',
    },
    {
      Date: '2026-11-03',
      Place: 'মবিল পরিবর্তন',
      Category: 'মেরামত ও পার্টস',
      Fair: 0,
      Cost: 2600,
      Remarks: 'অয়েল ফিল্টার সহ',
    },
  ];
  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trips');
  XLSX.writeFile(workbook, 'sample_car_ledger.xlsx');
}

export function exportLedgerToExcel(rows: TripWithBalance[], vehicleLabel: string): void {
  const totalFair = rows.reduce((sum, r) => sum + r.fair, 0);
  const totalCost = rows.reduce((sum, r) => sum + r.cost, 0);
  const netProfit = totalFair - totalCost;

  const data = rows.map((row) => ({
    তারিখ: row.date,
    গাড়ি: row.vehicleName,
    ড্রাইভার: row.driverName || '—',
    'স্থান ও বিবরণ': row.place,
    ধরন: row.category,
    'ভাড়া (আয়)': row.fair,
    খরচ: row.cost,
    'চলমান ব্যালেন্স': row.runningBalance,
    মন্তব্য: row.remarks,
  }));

  data.push({
    তারিখ: 'মোট',
    গাড়ি: vehicleLabel,
    ড্রাইভার: '',
    'স্থান ও বিবরণ': `${rows.length} টি এন্ট্রি`,
    ধরন: 'সারাংশ' as TripCategory,
    'ভাড়া (আয়)': totalFair,
    খরচ: totalCost,
    'চলমান ব্যালেন্স': netProfit,
    মন্তব্য: `নিট লাভ: ${netProfit}`,
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'হিসাবের খাতা');
  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `car_ledger_${today}.xlsx`);
}

export function exportLedgerToCSV(rows: TripWithBalance[]): void {
  const headers = [
    'তারিখ',
    'গাড়ি',
    'ড্রাইভার',
    'স্থান ও বিবরণ',
    'ধরন',
    'ভাড়া (আয়)',
    'খরচ',
    'চলমান ব্যালেন্স',
    'মন্তব্য',
  ];

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.date,
        r.vehicleName,
        r.driverName || '',
        r.place,
        r.category,
        r.fair,
        r.cost,
        r.runningBalance,
        r.remarks,
      ]
        .map(escapeCsv)
        .join(','),
    ),
  ];

  const bom = '\uFEFF';
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `car_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
