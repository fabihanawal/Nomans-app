import { Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmModal({
  isOpen,
  title,
  description,
  loading,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
          <Trash2 className="h-5 w-5" />
        </div>
        <h3 className="font-display mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
          >
            {loading ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
