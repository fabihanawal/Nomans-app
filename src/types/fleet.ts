export const TRIP_CATEGORIES = [
  'ট্রিপ ভাড়া',
  'জ্বালানি [LPG, Octane, CNG]',
  'মেরামত ও পার্টস',
  'কাগজপত্র ও ট্যাক্স',
  'অন্যান্য',
] as const;

export type TripCategory = (typeof TRIP_CATEGORIES)[number];

export const DRIVER_STATUSES = ['সক্রিয়', 'বিরতি'] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

// Verbatim constraints synced from firebase-blueprint.json
export const FIELD_LIMITS = {
  ID_MAX: 128,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  VEHICLE_NAME_MAX: 80,
  REG_NUMBER_MAX: 40,
  MODEL_YEAR_MAX: 20,
  DRIVER_NAME_MAX: 80,
  PHONE_MAX: 30,
  LICENSE_MAX: 40,
  NOTES_MAX: 200,
  DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
  PLACE_MAX: 160,
  CATEGORY_MAX: 60,
  REMARKS_MAX: 500,
} as const;

export interface Vehicle {
  id: string;
  ownerId: string;
  name: string;
  registrationNumber: string;
  modelYear: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Driver {
  id: string;
  ownerId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  status: DriverStatus;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TripEntry {
  id: string;
  ownerId: string;
  vehicleId: string;
  vehicleName: string;
  driverId: string;
  driverName: string;
  date: string; // YYYY-MM-DD
  place: string;
  category: TripCategory;
  fair: number;
  cost: number;
  remarks: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TripWithBalance extends TripEntry {
  runningBalance: number;
  netChange: number;
}

export interface ImportPreviewRow {
  rowIndex: number;
  date: string;
  place: string;
  category: TripCategory;
  fair: number;
  cost: number;
  remarks: string;
  isValid: boolean;
  error?: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type ActiveTab = 'dashboard' | 'ledger' | 'vehicles';
