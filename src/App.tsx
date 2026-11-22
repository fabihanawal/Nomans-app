import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  BookOpen,
  Car,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import {
  bulkImportTrips,
  createDriver,
  createTrip,
  createVehicle,
  deleteDriver,
  deleteTrip,
  deleteVehicle,
  ensureDefaultVehicle,
  updateDriver,
  updateTrip,
  updateVehicle,
  type DriverInput,
  type TripInput,
  type VehicleInput,
} from './lib/fleetService';
import { calculateRunningBalances } from './lib/formatters';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginView } from './components/LoginView';
import { SummaryCards } from './components/SummaryCards';
import { MonthlyChart } from './components/MonthlyChart';
import { LedgerTable } from './components/LedgerTable';
import { VehiclesView } from './components/VehiclesView';
import { EntryModal } from './components/EntryModal';
import { VehicleModal } from './components/VehicleModal';
import { DriverModal } from './components/DriverModal';
import { ImportModal } from './components/ImportModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ToastContainer } from './components/ToastContainer';
import { PrintReportView } from './components/PrintReportView';
import type {
  ActiveTab,
  Driver,
  DriverStatus,
  ImportPreviewRow,
  ToastItem,
  TripEntry,
  Vehicle,
} from './types/fleet';

function FleetWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<TripEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('car_ledger_theme') === 'dark';
    } catch {
      return false;
    }
  });
  const [useBanglaDigits, setUseBanglaDigits] = useState<boolean>(() => {
    try {
      return localStorage.getItem('car_ledger_digits') !== 'en';
    } catch {
      return true;
    }
  });

  // Modals state
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripEntry | null>(null);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const [deletingTrip, setDeletingTrip] = useState<TripEntry | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [printTrips, setPrintTrips] = useState<
    ReturnType<typeof calculateRunningBalances> | null
  >(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastItem['type'] = 'success') => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('car_ledger_theme', darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage error
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem('car_ledger_digits', useBanglaDigits ? 'bn' : 'en');
    } catch {
      // Ignore storage error
    }
  }, [useBanglaDigits]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Firestore vehicles, drivers & trips when verified user is signed in
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setVehicles([]);
      setDrivers([]);
      setTrips([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    let vehiclesLoaded = false;
    let driversLoaded = false;
    let tripsLoaded = false;
    let provisionedDefault = false;

    const markLoadedIfReady = () => {
      if (vehiclesLoaded && driversLoaded && tripsLoaded) {
        setLoadingData(false);
      }
    };

    const vehiclesQuery = query(
      collection(db, 'vehicles'),
      where('ownerId', '==', user.uid),
    );
    const driversQuery = query(
      collection(db, 'drivers'),
      where('ownerId', '==', user.uid),
    );
    const tripsQuery = query(
      collection(db, 'trips'),
      where('ownerId', '==', user.uid),
    );

    const unsubVehicles = onSnapshot(
      vehiclesQuery,
      (snapshot) => {
        const list: Vehicle[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ownerId: String(data.ownerId || ''),
            name: String(data.name || ''),
            registrationNumber: String(data.registrationNumber || ''),
            modelYear: String(data.modelYear || ''),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });

        setVehicles(list);
        vehiclesLoaded = true;
        markLoadedIfReady();

        if (list.length === 0 && !provisionedDefault) {
          provisionedDefault = true;
          void ensureDefaultVehicle(user.uid, list).catch(() => {
            // Handled inside service
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'vehicles');
      },
    );

    const unsubDrivers = onSnapshot(
      driversQuery,
      (snapshot) => {
        const list: Driver[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ownerId: String(data.ownerId || ''),
            name: String(data.name || ''),
            phone: String(data.phone || ''),
            licenseNumber: String(data.licenseNumber || ''),
            status: (data.status === 'বিরতি' ? 'বিরতি' : 'সক্রিয়') as DriverStatus,
            notes: String(data.notes || ''),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });
        setDrivers(list);
        driversLoaded = true;
        markLoadedIfReady();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'drivers');
      },
    );

    const unsubTrips = onSnapshot(
      tripsQuery,
      (snapshot) => {
        const list: TripEntry[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ownerId: String(data.ownerId || ''),
            vehicleId: String(data.vehicleId || ''),
            vehicleName: String(data.vehicleName || ''),
            driverId: String(data.driverId || ''),
            driverName: String(data.driverName || ''),
            date: String(data.date || ''),
            place: String(data.place || ''),
            category: data.category,
            fair: Number(data.fair) || 0,
            cost: Number(data.cost) || 0,
            remarks: String(data.remarks || ''),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });

        setTrips(list);
        tripsLoaded = true;
        markLoadedIfReady();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'trips');
      },
    );

    return () => {
      unsubVehicles();
      unsubDrivers();
      unsubTrips();
    };
  }, [authReady, user]);

  // Filter trips by selected vehicle and calculate dynamic Running Balance chronologically
  const vehicleScopedTrips = useMemo(() => {
    const filtered =
      selectedVehicleId === 'all'
        ? trips
        : trips.filter((t) => t.vehicleId === selectedVehicleId);
    return calculateRunningBalances(filtered);
  }, [trips, selectedVehicleId]);

  const existingPlaces = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of trips) {
      const p = t.place.trim();
      if (p) counts.set(p, (counts.get(p) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [trips]);

  const selectedVehicleLabel = useMemo(() => {
    if (selectedVehicleId === 'all') return 'সকল গাড়ি (সম্মিলিত)';
    return vehicles.find((v) => v.id === selectedVehicleId)?.name || 'গাড়ি';
  }, [selectedVehicleId, vehicles]);

  // CRUD Handlers
  const handleSaveTrip = async (input: TripInput, editingId?: string) => {
    if (!user) return;
    if (editingId) {
      await updateTrip(editingId, input);
      showToast('এন্ট্রি সফলভাবে আপডেট হয়েছে!');
    } else {
      await createTrip(user.uid, input);
      showToast('সফলভাবে সংরক্ষিত হয়েছে!');
    }
  };

  const handleConfirmDeleteTrip = async () => {
    if (!deletingTrip) return;
    setDeletingLoading(true);
    try {
      await deleteTrip(deletingTrip.id);
      setDeletingTrip(null);
      showToast('এন্ট্রি মুছে ফেলা হয়েছে।', 'info');
    } catch {
      showToast('এন্ট্রি মুছতে সমস্যা হয়েছে।', 'error');
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleSaveVehicle = async (input: VehicleInput, editingId?: string) => {
    if (!user) return;
    if (editingId) {
      await updateVehicle(editingId, input);
      showToast('গাড়ির তথ্য আপডেট হয়েছে!');
    } else {
      const newId = await createVehicle(user.uid, input);
      setSelectedVehicleId(newId);
      showToast('নতুন গাড়ি সফলভাবে যুক্ত হয়েছে!');
    }
  };

  const handleConfirmDeleteVehicle = async () => {
    if (!deletingVehicle) return;
    const hasTrips = trips.some((t) => t.vehicleId === deletingVehicle.id);
    if (hasTrips) {
      setDeletingVehicle(null);
      showToast('এই গাড়ির নামে হিসাবের এন্ট্রি রয়েছে। আগে এন্ট্রিগুলো সরিয়ে নিন।', 'error');
      return;
    }
    setDeletingLoading(true);
    try {
      await deleteVehicle(deletingVehicle.id);
      if (selectedVehicleId === deletingVehicle.id) {
        setSelectedVehicleId('all');
      }
      setDeletingVehicle(null);
      showToast('গাড়ি তালিকা থেকে মুছে ফেলা হয়েছে।', 'info');
    } catch {
      showToast('গাড়ি মুছতে সমস্যা হয়েছে।', 'error');
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleSaveDriver = async (input: DriverInput, editingId?: string) => {
    if (!user) return;
    if (editingId) {
      await updateDriver(editingId, input);
      showToast('ড্রাইভারের তথ্য আপডেট হয়েছে!');
    } else {
      await createDriver(user.uid, input);
      showToast('নতুন ড্রাইভার সফলভাবে যুক্ত হয়েছে!');
    }
  };

  const handleConfirmDeleteDriver = async () => {
    if (!deletingDriver) return;
    setDeletingLoading(true);
    try {
      await deleteDriver(deletingDriver.id);
      setDeletingDriver(null);
      showToast('ড্রাইভার তালিকা থেকে মুছে ফেলা হয়েছে।', 'info');
    } catch {
      showToast('ড্রাইভার মুছতে সমস্যা হয়েছে।', 'error');
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleBulkImport = async (
    vehicle: Vehicle,
    driver: Driver | null,
    rows: ImportPreviewRow[],
  ) => {
    if (!user) return 0;
    const count = await bulkImportTrips(user.uid, vehicle, driver, rows);
    showToast(`${count}টি এন্ট্রি সফলভাবে ইমপোর্ট হয়েছে!`);
    return count;
  };

  const handlePrint = useCallback((rows: typeof vehicleScopedTrips) => {
    setPrintTrips(rows);
    setTimeout(() => {
      window.print();
    }, 60);
  }, []);

  // Auth loading state
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-slate-600 dark:text-slate-400">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // Require verified authentication
  if (!user || !user.emailVerified) {
    return (
      <LoginView
        user={user}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
      />
    );
  }

  const navItems: { id: ActiveTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'ledger', label: 'হিসাবের খাতা', icon: BookOpen },
    { id: 'vehicles', label: 'গাড়ি ও ড্রাইভার', icon: Car },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="no-print flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-6 dark:border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Car className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap">
                গাড়ির হিসাব
              </span>
            </div>

            <nav className="space-y-1 p-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setImportModalOpen(true)}
                className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <Upload className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Excel ইমপোর্ট</span>
              </button>
            </nav>
          </div>

          <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setUseBanglaDigits((b) => !b)}
                className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                অঙ্ক: {useBanglaDigits ? '১২৩ (বাংলা)' : '123 (EN)'}
              </button>
              <button
                type="button"
                onClick={() => setDarkMode((d) => !d)}
                aria-label="ডার্ক/লাইট মোড"
                className="rounded-lg border border-slate-200 p-1.5 text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {user.displayName || 'মালিক / ম্যানেজার'}
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOut(auth)}
                title="সাইন আউট"
                aria-label="সাইন আউট"
                className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-950/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 flex w-72 flex-col justify-between bg-white p-4 dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <Car className="h-5 w-5" />
                    </div>
                    <span className="font-display text-lg font-bold">গাড়ির হিসাব</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg p-1.5 text-slate-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="mt-4 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium ${
                          active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setImportModalOpen(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Excel ইমপোর্ট</span>
                  </button>
                </nav>
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUseBanglaDigits((b) => !b)}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium dark:border-slate-700"
                  >
                    অঙ্ক: {useBanglaDigits ? '১২৩ (বাংলা)' : '123 (EN)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDarkMode((d) => !d)}
                    className="rounded-lg border border-slate-200 p-2 dark:border-slate-700"
                  >
                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => signOut(auth)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-900/60 dark:text-rose-400"
                >
                  <LogOut className="h-4 w-4" />
                  <span>সাইন আউট ({user.email})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="মেনু খুলুন"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Vehicle Switcher */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  aria-label="গাড়ি নির্বাচন করুন"
                  className="max-w-[190px] truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 sm:max-w-xs sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="all">সকল গাড়ি (সম্মিলিত)</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setEditingVehicle(null);
                    setVehicleModalOpen(true);
                  }}
                  title="নতুন গাড়ি যুক্ত করুন"
                  className="hidden items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-50 sm:inline-flex dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>গাড়ি</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingTrip(null);
                  setEntryModalOpen(true);
                }}
                disabled={vehicles.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 sm:px-4 sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>নতুন এন্ট্রি</span>
              </button>
            </div>
          </header>

          {/* Workspace Body */}
          <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 pb-24 sm:p-6 lg:pb-8">
            {activeTab === 'dashboard' && (
              <>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h1 className="font-display text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-100">
                      {selectedVehicleLabel} — ড্যাশবোর্ড
                    </h1>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      দৈনন্দিন ট্রিপ ভাড়া, জ্বালানি, রক্ষণাবেক্ষণ ও স্বয়ংক্রিয় চলমান ব্যালেন্সের সারসংক্ষেপ
                    </p>
                  </div>
                </div>

                <SummaryCards
                  trips={vehicleScopedTrips}
                  loading={loadingData}
                  useBanglaDigits={useBanglaDigits}
                />

                <MonthlyChart
                  trips={vehicleScopedTrips}
                  loading={loadingData}
                  useBanglaDigits={useBanglaDigits}
                  darkMode={darkMode}
                />

                <LedgerTable
                  trips={vehicleScopedTrips}
                  drivers={drivers}
                  loading={loadingData}
                  showVehicleColumn={selectedVehicleId === 'all' && vehicles.length > 1}
                  vehicleLabel={selectedVehicleLabel}
                  useBanglaDigits={useBanglaDigits}
                  onAddNew={() => {
                    setEditingTrip(null);
                    setEntryModalOpen(true);
                  }}
                  onOpenImport={() => setImportModalOpen(true)}
                  onEdit={(trip) => {
                    setEditingTrip(trip);
                    setEntryModalOpen(true);
                  }}
                  onDelete={(trip) => setDeletingTrip(trip)}
                  onPrint={handlePrint}
                />
              </>
            )}

            {activeTab === 'ledger' && (
              <LedgerTable
                trips={vehicleScopedTrips}
                drivers={drivers}
                loading={loadingData}
                showVehicleColumn={selectedVehicleId === 'all' && vehicles.length > 1}
                vehicleLabel={selectedVehicleLabel}
                useBanglaDigits={useBanglaDigits}
                onAddNew={() => {
                  setEditingTrip(null);
                  setEntryModalOpen(true);
                }}
                onOpenImport={() => setImportModalOpen(true)}
                onEdit={(trip) => {
                  setEditingTrip(trip);
                  setEntryModalOpen(true);
                }}
                onDelete={(trip) => setDeletingTrip(trip)}
                onPrint={handlePrint}
              />
            )}

            {activeTab === 'vehicles' && (
              <VehiclesView
                vehicles={vehicles}
                drivers={drivers}
                trips={trips}
                useBanglaDigits={useBanglaDigits}
                onAddVehicle={() => {
                  setEditingVehicle(null);
                  setVehicleModalOpen(true);
                }}
                onEditVehicle={(v) => {
                  setEditingVehicle(v);
                  setVehicleModalOpen(true);
                }}
                onDeleteVehicle={(v) => setDeletingVehicle(v)}
                onSelectVehicleLedger={(vehId) => {
                  setSelectedVehicleId(vehId);
                  setActiveTab('ledger');
                }}
                onAddDriver={() => {
                  setEditingDriver(null);
                  setDriverModalOpen(true);
                }}
                onEditDriver={(d) => {
                  setEditingDriver(d);
                  setDriverModalOpen(true);
                }}
                onDeleteDriver={(d) => setDeletingDriver(d)}
              />
            )}
          </main>
        </div>

        {/* Mobile Bottom Tab Bar (Compact <= 56px, well under 15% mobile height cap) */}
        <nav className="fixed right-0 bottom-0 left-0 z-30 flex h-14 items-center justify-around border-t border-slate-200 bg-white lg:hidden dark:border-slate-800 dark:bg-slate-900">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium ${
                  active
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Print-Only PDF Report */}
      <PrintReportView
        trips={printTrips ?? vehicleScopedTrips}
        vehicleLabel={selectedVehicleLabel}
        useBanglaDigits={useBanglaDigits}
      />

      {/* Modals */}
      <EntryModal
        isOpen={entryModalOpen}
        editingTrip={editingTrip}
        vehicles={vehicles}
        drivers={drivers}
        selectedVehicleId={selectedVehicleId}
        existingPlaces={existingPlaces}
        onClose={() => {
          setEntryModalOpen(false);
          setEditingTrip(null);
        }}
        onSave={handleSaveTrip}
      />

      <VehicleModal
        isOpen={vehicleModalOpen}
        editingVehicle={editingVehicle}
        onClose={() => {
          setVehicleModalOpen(false);
          setEditingVehicle(null);
        }}
        onSave={handleSaveVehicle}
      />

      <DriverModal
        isOpen={driverModalOpen}
        editingDriver={editingDriver}
        onClose={() => {
          setDriverModalOpen(false);
          setEditingDriver(null);
        }}
        onSave={handleSaveDriver}
      />

      <ImportModal
        isOpen={importModalOpen}
        vehicles={vehicles}
        drivers={drivers}
        selectedVehicleId={selectedVehicleId}
        useBanglaDigits={useBanglaDigits}
        onClose={() => setImportModalOpen(false)}
        onConfirmImport={handleBulkImport}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingTrip)}
        title="এন্ট্রিটি মুছে ফেলবেন?"
        description={
          deletingTrip
            ? `আপনি কি নিশ্চিত যে "${deletingTrip.place}" এন্ট্রিটি মুছে ফেলতে চান? মুছে ফেলার পর চলমান ব্যালেন্স স্বয়ংক্রিয়ভাবে সমন্বয় হবে।`
            : ''
        }
        loading={deletingLoading}
        onCancel={() => setDeletingTrip(null)}
        onConfirm={handleConfirmDeleteTrip}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingVehicle)}
        title="গাড়িটি তালিকা থেকে মুছবেন?"
        description={
          deletingVehicle
            ? `আপনি কি "${deletingVehicle.name}" গাড়িটি মুছে ফেলতে চান?`
            : ''
        }
        loading={deletingLoading}
        onCancel={() => setDeletingVehicle(null)}
        onConfirm={handleConfirmDeleteVehicle}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingDriver)}
        title="ড্রাইভারকে তালিকা থেকে মুছবেন?"
        description={
          deletingDriver
            ? `আপনি কি "${deletingDriver.name}"-এর প্রোফাইল মুছে ফেলতে চান? পূর্বের ট্রিপগুলোর রেকর্ডে তাঁর নাম সংরক্ষিত থাকবে।`
            : ''
        }
        loading={deletingLoading}
        onCancel={() => setDeletingDriver(null)}
        onConfirm={handleConfirmDeleteDriver}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FleetWorkspace />
    </ErrorBoundary>
  );
}
