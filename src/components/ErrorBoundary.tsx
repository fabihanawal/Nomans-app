import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'অপ্রত্যাশিত ত্রুটি ঘটেছে।',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Application ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let friendlyMessage =
        'সিস্টেমে সাময়িক ত্রুটি হয়েছে। অনুগ্রহ করে পেজটি রিলোড করে আবার চেষ্টা করুন।';
      if (this.state.errorMessage.includes('PERMISSION_DENIED') || this.state.errorMessage.includes('insufficient permissions')) {
        friendlyMessage =
          'এই তথ্য অ্যাক্সেস বা পরিবর্তন করার অনুমতি পাওয়া যায়নি। অনুগ্রহ করে পুনরায় সাইন ইন করুন।';
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              একটি ত্রুটি ঘটেছে
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {friendlyMessage}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              <RotateCcw className="h-4 w-4" />
              <span>রিলোড করুন</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
