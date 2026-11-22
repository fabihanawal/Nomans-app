import { Car, Pencil, Phone, Plus, Trash2, UserCheck } from 'lucide-react';
import { formatBDT, formatNumber } from '../lib/formatters';
import type { Driver, TripEntry, Vehicle } from '../types/fleet';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: TripEntry[];
  useBanglaDigits: boolean;
  onAddVehicle: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vehicle: Vehicle) => void;
  onSelectVehicleLedger: (vehicleId: string) => void;
  onAddDriver: () => void;
  onEditDriver: (driver: Driver) => void;
  onDeleteDriver: (driver: Driver) => void;
}

export function VehiclesView({
  vehicles,
  drivers,
  trips,
  useBanglaDigits,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onSelectVehicleLedger,
  onAddDriver,
  onEditDriver,
  onDeleteDriver,
}: VehiclesViewProps) {
  return (
    <div className="space-y-10">
      {/* Section 1: Vehicles */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              গাড়ি ব্যবস্থাপনা (রেন্ট-এ-কার বহর)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Toyota X Corolla সহ আপনার বহরের সকল গাড়ির আলাদা ও সম্মিলিত হিসাব পরিচালনা করুন
            </p>
          </div>
          <button
            type="button"
            onClick={onAddVehicle}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন গাড়ি যুক্ত করুন</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => {
            const vehicleTrips = trips.filter((t) => t.vehicleId === vehicle.id);
            const totalFair = vehicleTrips.reduce((s, t) => s + t.fair, 0);
            const totalCost = vehicleTrips.reduce((s, t) => s + t.cost, 0);
            const netBalance = totalFair - totalCost;

            return (
              <div
                key={vehicle.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Car className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                          {vehicle.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {vehicle.registrationNumber || 'রেজিস্ট্রেশন নম্বর নেই'}
                          {vehicle.modelYear ? ` · ${vehicle.modelYear}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditVehicle(vehicle)}
                        aria-label="গাড়ির তথ্য সম্পাদনা"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {vehicles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteVehicle(vehicle)}
                          aria-label="গাড়ি মুছুন"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/60"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                    <div>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        মোট আয়
                      </span>
                      <span className="font-mono tabular-nums mt-0.5 block font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatBDT(totalFair, useBanglaDigits)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        মোট খরচ
                      </span>
                      <span className="font-mono tabular-nums mt-0.5 block font-semibold text-rose-600 dark:text-rose-400">
                        {formatBDT(totalCost, useBanglaDigits)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        নিট ব্যালেন্স
                      </span>
                      <span
                        className={`font-mono tabular-nums mt-0.5 block font-semibold ${
                          netBalance >= 0
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatBDT(netBalance, useBanglaDigits)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">
                    মোট এন্ট্রি: {formatNumber(vehicleTrips.length, useBanglaDigits)} টি
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectVehicleLedger(vehicle.id)}
                    className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    হিসাব দেখুন →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Drivers */}
      <section className="space-y-5 border-t border-slate-200 pt-8 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              ড্রাইভার ব্যবস্থাপনা
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              ট্রিপ এন্ট্রি করার সময় কোন ড্রাইভার ট্রিপ সম্পন্ন করেছে তা নির্বাচন করতে ড্রাইভারদের তথ্য যুক্ত করুন
            </p>
          </div>
          <button
            type="button"
            onClick={onAddDriver}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন ড্রাইভার যুক্ত করুন</span>
          </button>
        </div>

        {drivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <h3 className="font-display mt-3 text-base font-bold text-slate-900 dark:text-slate-100">
              এখনো কোনো ড্রাইভার যুক্ত করা হয়নি
            </h3>
            <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
              ড্রাইভারের নাম, মোবাইল ও লাইসেন্স নম্বর যুক্ত করলে প্রতিটি ট্রিপে ড্রাইভার নির্বাচন করতে পারবেন।
            </p>
            <button
              type="button"
              onClick={onAddDriver}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              <span>প্রথম ড্রাইভার যুক্ত করুন</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {drivers.map((driver) => {
              const driverTrips = trips.filter((t) => t.driverId === driver.id);
              const totalFair = driverTrips.reduce((s, t) => s + t.fair, 0);
              const totalCost = driverTrips.reduce((s, t) => s + t.cost, 0);

              return (
                <div
                  key={driver.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                            {driver.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span
                              className={
                                driver.status === 'সক্রিয়'
                                  ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                  : 'font-medium text-amber-600 dark:text-amber-400'
                              }
                            >
                              {driver.status}
                            </span>
                            {driver.licenseNumber ? (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span className="font-mono">{driver.licenseNumber}</span>
                              </>
                            ) : null}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditDriver(driver)}
                          aria-label="ড্রাইভারের তথ্য সম্পাদনা"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteDriver(driver)}
                          aria-label="ড্রাইভার মুছুন"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/60"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {driver.phone && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-mono tabular-nums">{driver.phone}</span>
                      </div>
                    )}

                    {driver.notes && (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                        {driver.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3.5 text-xs dark:border-slate-800">
                    <div>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        সম্পন্ন ট্রিপ
                      </span>
                      <span className="font-mono tabular-nums mt-0.5 block font-semibold text-slate-900 dark:text-slate-100">
                        {formatNumber(driverTrips.length, useBanglaDigits)} টি
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        ট্রিপ আয়
                      </span>
                      <span className="font-mono tabular-nums mt-0.5 block font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatBDT(totalFair, useBanglaDigits)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        সম্পৃক্ত খরচ
                      </span>
                      <span className="font-mono tabular-nums mt-0.5 block font-semibold text-rose-600 dark:text-rose-400">
                        {formatBDT(totalCost, useBanglaDigits)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
