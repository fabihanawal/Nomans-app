import { CheckCircle2, Info, X, AlertCircle } from 'lucide-react';
import type { ToastItem } from '../types/fleet';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="no-print fixed right-4 bottom-20 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 md:bottom-6"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            role="status"
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm transition-all duration-200 ${
              isSuccess
                ? 'border-emerald-200 bg-white text-emerald-800 dark:border-emerald-900/60 dark:bg-slate-900 dark:text-emerald-300'
                : isError
                  ? 'border-rose-200 bg-white text-rose-800 dark:border-rose-900/60 dark:bg-slate-900 dark:text-rose-300'
                  : 'border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isSuccess ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : isError ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              ) : (
                <Info className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="বন্ধ করুন"
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
