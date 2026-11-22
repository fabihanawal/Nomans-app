import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  DRIVER_STATUSES,
  FIELD_LIMITS,
  TRIP_CATEGORIES,
  type Driver,
  type DriverStatus,
  type ImportPreviewRow,
  type TripCategory,
  type Vehicle,
} from '../types/fleet';

export interface VehicleInput {
  name: string;
  registrationNumber: string;
  modelYear: string;
}

export interface DriverInput {
  name: string;
  phone: string;
  licenseNumber: string;
  status: DriverStatus;
  notes: string;
}

export interface TripInput {
  vehicleId: string;
  vehicleName: string;
  driverId: string;
  driverName: string;
  date: string;
  place: string;
  category: TripCategory;
  fair: number;
  cost: number;
  remarks: string;
}

function sanitizeVehicleInput(input: VehicleInput) {
  const name = input.name.trim().slice(0, FIELD_LIMITS.VEHICLE_NAME_MAX);
  const registrationNumber = input.registrationNumber
    .trim()
    .slice(0, FIELD_LIMITS.REG_NUMBER_MAX);
  const modelYear = input.modelYear.trim().slice(0, FIELD_LIMITS.MODEL_YEAR_MAX);

  if (!name) {
    throw new Error('গাড়ির নাম আবশ্যক।');
  }
  return { name, registrationNumber, modelYear };
}

function sanitizeDriverInput(input: DriverInput) {
  const name = input.name.trim().slice(0, FIELD_LIMITS.DRIVER_NAME_MAX);
  const phone = input.phone.trim().slice(0, FIELD_LIMITS.PHONE_MAX);
  const licenseNumber = input.licenseNumber.trim().slice(0, FIELD_LIMITS.LICENSE_MAX);
  const status = DRIVER_STATUSES.includes(input.status) ? input.status : 'সক্রিয়';
  const notes = input.notes.trim().slice(0, FIELD_LIMITS.NOTES_MAX);

  if (!name) {
    throw new Error('ড্রাইভারের নাম আবশ্যক।');
  }
  return { name, phone, licenseNumber, status, notes };
}

function sanitizeTripInput(input: TripInput) {
  const vehicleId = input.vehicleId.trim();
  const vehicleName = input.vehicleName.trim().slice(0, FIELD_LIMITS.VEHICLE_NAME_MAX);
  const driverId = input.driverId.trim();
  const driverName = driverId
    ? input.driverName.trim().slice(0, FIELD_LIMITS.DRIVER_NAME_MAX)
    : '';
  const date = input.date.trim();
  const place = input.place.trim().slice(0, FIELD_LIMITS.PLACE_MAX);
  const category = TRIP_CATEGORIES.includes(input.category) ? input.category : 'অন্যান্য';
  const fair = Number.isFinite(input.fair) ? Math.max(0, Number(input.fair)) : 0;
  const cost = Number.isFinite(input.cost) ? Math.max(0, Number(input.cost)) : 0;
  const remarks = input.remarks.trim().slice(0, FIELD_LIMITS.REMARKS_MAX);

  if (!FIELD_LIMITS.ID_PATTERN.test(vehicleId) || vehicleId.length > FIELD_LIMITS.ID_MAX) {
    throw new Error('সঠিক গাড়ি নির্বাচন করুন।');
  }
  if (!vehicleName) {
    throw new Error('গাড়ির নাম সঠিক নয়।');
  }
  if (
    driverId &&
    (!FIELD_LIMITS.ID_PATTERN.test(driverId) || driverId.length > FIELD_LIMITS.ID_MAX)
  ) {
    throw new Error('সঠিক ড্রাইভার নির্বাচন করুন।');
  }
  if (!FIELD_LIMITS.DATE_PATTERN.test(date)) {
    throw new Error('তারিখ YYYY-MM-DD ফরম্যাটে হতে হবে।');
  }
  if (!place) {
    throw new Error('স্থান / বিবরণ লিখুন।');
  }

  return {
    vehicleId,
    vehicleName,
    driverId,
    driverName,
    date,
    place,
    category,
    fair,
    cost,
    remarks,
  };
}

export async function ensureDefaultVehicle(
  ownerId: string,
  existingVehicles: Vehicle[],
): Promise<string | null> {
  if (existingVehicles.length > 0) return null;

  const defaultId = `veh_${ownerId.slice(0, 16)}_corolla`;
  const ref = doc(db, 'vehicles', defaultId);
  try {
    await setDoc(ref, {
      ownerId,
      name: 'Toyota X Corolla',
      registrationNumber: '',
      modelYear: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return defaultId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `vehicles/${defaultId}`);
  }
}

export async function createVehicle(ownerId: string, input: VehicleInput): Promise<string> {
  const clean = sanitizeVehicleInput(input);
  const ref = doc(collection(db, 'vehicles'));
  try {
    await setDoc(ref, {
      ownerId,
      ...clean,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `vehicles/${ref.id}`);
  }
}

export async function updateVehicle(vehicleId: string, input: VehicleInput): Promise<void> {
  const clean = sanitizeVehicleInput(input);
  const ref = doc(db, 'vehicles', vehicleId);
  try {
    await updateDoc(ref, {
      ...clean,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `vehicles/${vehicleId}`);
  }
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  const ref = doc(db, 'vehicles', vehicleId);
  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `vehicles/${vehicleId}`);
  }
}

export async function createDriver(ownerId: string, input: DriverInput): Promise<string> {
  const clean = sanitizeDriverInput(input);
  const ref = doc(collection(db, 'drivers'));
  try {
    await setDoc(ref, {
      ownerId,
      ...clean,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `drivers/${ref.id}`);
  }
}

export async function updateDriver(driverId: string, input: DriverInput): Promise<void> {
  const clean = sanitizeDriverInput(input);
  const ref = doc(db, 'drivers', driverId);
  try {
    await updateDoc(ref, {
      ...clean,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `drivers/${driverId}`);
  }
}

export async function deleteDriver(driverId: string): Promise<void> {
  const ref = doc(db, 'drivers', driverId);
  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `drivers/${driverId}`);
  }
}

export async function createTrip(ownerId: string, input: TripInput): Promise<string> {
  const clean = sanitizeTripInput(input);
  const ref = doc(collection(db, 'trips'));
  try {
    await setDoc(ref, {
      ownerId,
      ...clean,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `trips/${ref.id}`);
  }
}

export async function updateTrip(tripId: string, input: TripInput): Promise<void> {
  const clean = sanitizeTripInput(input);
  const ref = doc(db, 'trips', tripId);
  try {
    await updateDoc(ref, {
      ...clean,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `trips/${tripId}`);
  }
}

export async function deleteTrip(tripId: string): Promise<void> {
  const ref = doc(db, 'trips', tripId);
  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `trips/${tripId}`);
  }
}

export async function bulkImportTrips(
  ownerId: string,
  vehicle: Vehicle,
  driver: Driver | null,
  rows: ImportPreviewRow[],
): Promise<number> {
  const validRows = rows.filter((r) => r.isValid);
  if (validRows.length === 0) return 0;

  const CHUNK_SIZE = 400;
  let importedCount = 0;

  for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
    const chunk = validRows.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const row of chunk) {
      const clean = sanitizeTripInput({
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        driverId: driver?.id || '',
        driverName: driver?.name || '',
        date: row.date,
        place: row.place,
        category: row.category,
        fair: row.fair,
        cost: row.cost,
        remarks: row.remarks,
      });

      const ref = doc(collection(db, 'trips'));
      batch.set(ref, {
        ownerId,
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
      importedCount += chunk.length;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'trips (bulk import)');
    }
  }

  return importedCount;
}
