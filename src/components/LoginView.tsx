import { useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { Car, Lock, Mail, Moon, RefreshCw, ShieldCheck, Sun } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';

interface LoginViewProps {
  user: User | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

function mapAuthErrorToBengali(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'ইমেইল বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে আবার যাচাই করুন।';
    case 'auth/email-already-in-use':
      return 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে লগইন করুন।';
    case 'auth/weak-password':
      return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
    case 'auth/invalid-email':
      return 'সঠিক ইমেইল ঠিকানা লিখুন।';
    case 'auth/popup-closed-by-user':
      return 'Google লগইন পপ-আপ বন্ধ হয়ে গেছে। আবার চেষ্টা করুন।';
    case 'auth/operation-not-allowed':
      return 'Firebase Console থেকে Email/Password লগইন এখনো চালু করা হয়নি। অনুগ্রহ করে Google দিয়ে লগইন করুন অথবা Firebase Console -> Authentication -> Sign-in method থেকে Email/Password চালু করুন।';
    case 'auth/network-request-failed':
      return 'ইন্টারনেট সংযোগে সমস্যা হচ্ছে। নেটওয়ার্ক যাচাই করে আবার চেষ্টা করুন।';
    default:
      return 'লগইন করতে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
  }
}

export function LoginView({ user, darkMode, onToggleDarkMode }: LoginViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      setErrorMsg(mapAuthErrorToBengali(code));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(cred.user);
        setInfoMsg('আপনার ইমেইলে একটি ভেরিফিকেশন লিংক পাঠানো হয়েছে।');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      setErrorMsg(mapAuthErrorToBengali(code));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    try {
      await sendEmailVerification(user);
      setInfoMsg('ভেরিফিকেশন ইমেইল পুনরায় পাঠানো হয়েছে। ইনবক্স বা স্প্যাম ফোল্ডার দেখুন।');
    } catch {
      setErrorMsg('ইমেইল পাঠাতে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await reload(user);
      if (auth.currentUser?.emailVerified) {
        window.location.reload();
      } else {
        setErrorMsg('আপনার ইমেইল এখনো ভেরিফাই করা হয়নি। ইমেইলের লিংকে ক্লিক করে আবার যাচাই করুন।');
      }
    } catch {
      setErrorMsg('স্ট্যাটাস যাচাই করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  // Email verification gate for unverified email/password sign-in
  if (user && !user.emailVerified) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="থিম পরিবর্তন করুন"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            ইমেইল ভেরিফিকেশন প্রয়োজন
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            সুরক্ষিত হিসাব সংরক্ষণের জন্য <span className="font-medium text-slate-900 dark:text-slate-200">{user.email}</span> ঠিকানায় পাঠানো ভেরিফিকেশন লিংকে ক্লিক করুন।
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
              {errorMsg}
            </div>
          )}
          {infoMsg && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
              {infoMsg}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleCheckVerification}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>ভেরিফিকেশন যাচাই করুন</span>
            </button>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={loading}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              পুনরায় ভেরিফিকেশন ইমেইল পাঠান
            </button>
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="w-full rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              অন্য অ্যাকাউন্ট দিয়ে লগইন করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-12 dark:border-slate-800 dark:bg-slate-900">
        {/* Left Editorial / Overview Column */}
        <div className="flex flex-col justify-between bg-slate-900 p-8 text-white md:col-span-5 md:p-10 dark:bg-slate-950">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Car className="h-5 w-5" />
                </div>
                <span className="font-display text-lg font-bold tracking-tight">গাড়ির হিসাব</span>
              </div>
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label="থিম পরিবর্তন করুন"
                className="rounded-lg border border-slate-700 p-2 text-slate-300 transition-colors hover:bg-slate-800"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>

            <h1 className="font-display mt-10 text-3xl leading-tight font-bold text-balance">
              রেন্ট-এ-কার ও ব্যক্তিগত গাড়ির নিখুঁত হিসাবের খাতা
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Toyota X Corolla সহ আপনার বহরের প্রতিটি গাড়ির দৈনন্দিন ট্রিপ ভাড়া, জ্বালানি, রক্ষণাবেক্ষণ এবং চলমান ব্যালেন্স সংরক্ষণ করুন নির্ভুলভাবে।
            </p>
          </div>

          <div className="mt-10 space-y-3 border-t border-slate-800 pt-6 text-xs text-slate-400">
            <p>স্বয়ংক্রিয় চলমান ব্যালেন্স হিসাব (কখনো হিসাব ভাঙবে না)</p>
            <p>অফলাইন সাপোর্ট সহ ক্লাউড সিঙ্ক ও Excel ইমপোর্ট-এক্সপোর্ট</p>
            <p>একাধিক গাড়ি যুক্ত করার পূর্ণাঙ্গ সুবিধা</p>
          </div>
        </div>

        {/* Right Auth Column */}
        <div className="flex flex-col justify-center p-8 md:col-span-7 md:p-12">
          <div className="mx-auto w-full max-w-sm">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              {mode === 'login' ? 'অ্যাকাউন্টে প্রবেশ করুন' : 'নতুন অ্যাকাউন্ট খুলুন'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              কেবল অনুমোদিত মালিক বা ম্যানেজার হিসাব দেখতে ও পরিবর্তন করতে পারবেন।
            </p>

            {/* Primary Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>Google দিয়ে সাইন ইন করুন</span>
            </button>

            <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span>অথবা ইমেইল ও পাসওয়ার্ড</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                লগইন
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                }}
                className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                রেজিস্ট্রেশন
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs leading-relaxed text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
                {errorMsg}
              </div>
            )}
            {infoMsg && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs leading-relaxed text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                {infoMsg}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  ইমেইল ঠিকানা
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ন্যূনতম ৬ অক্ষর"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading
                  ? 'অপেক্ষা করুন...'
                  : mode === 'login'
                    ? 'লগইন করুন'
                    : 'অ্যাকাউন্ট তৈরি করুন'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
