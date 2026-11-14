import {
  ArrowRight,
  Compass,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Shield,
  Sparkles,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { type FormEvent, useEffect, useState } from 'react';
import { CAREER_ROLES } from '../shared/careerCatalog.ts';
import type { CareerRole, UserRole } from '../shared/types.ts';
import type { GuestPreset, GuestSessionConfig } from '../utils/guestSession.ts';

export type AuthModalTab = 'guest' | 'google' | 'email';
export type EmailAuthMode = 'signin' | 'signup' | 'reset';

interface AuthOptionsModalProps {
  open: boolean;
  initialTab?: AuthModalTab;
  initialRole?: UserRole;
  initialCareerId?: string;
  roles?: CareerRole[];
  authLoading: boolean;
  authError: string | null;
  authNotice: string | null;
  pendingVerificationEmail: string | null;
  onClose: () => void;
  onGoogleSignIn: (preferredPortal?: UserRole) => Promise<void>;
  onEmailSignIn: (payload: {
    email: string;
    password: string;
    preferredPortal?: UserRole;
  }) => Promise<void>;
  onEmailSignUp: (payload: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  onResendVerification: () => Promise<void>;
  onRefreshVerification: () => Promise<void>;
  onStartGuest: (config: GuestSessionConfig) => void;
}

export function AuthOptionsModal({
  open,
  initialTab = 'guest',
  initialRole = 'student',
  initialCareerId = 'full-stack-dev',
  roles = CAREER_ROLES,
  authLoading,
  authError,
  authNotice,
  pendingVerificationEmail,
  onClose,
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp,
  onResetPassword,
  onResendVerification,
  onRefreshVerification,
  onStartGuest,
}: AuthOptionsModalProps) {
  const prefersReduced = useReducedMotion();
  const [activeTab, setActiveTab] = useState<AuthModalTab>(initialTab);
  const [portalRole, setPortalRole] = useState<UserRole>(initialRole);

  // Guest configurator state
  const [guestName, setGuestName] = useState('Guest Learner');
  const [guestCareerId, setGuestCareerId] = useState(initialCareerId);
  const [guestPreset, setGuestPreset] = useState<GuestPreset>('demo');

  // Email & Password extra login option state
  const [emailMode, setEmailMode] = useState<EmailAuthMode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setPortalRole(initialRole);
      setGuestCareerId(initialCareerId);
      setLocalError(null);
    }
  }, [open, initialTab, initialRole, initialCareerId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleGuestSubmit = (e: FormEvent) => {
    e.preventDefault();
    onStartGuest({
      guestName: guestName.trim() || 'Guest Learner',
      targetCareerId: guestCareerId,
      role: portalRole,
      preset: guestPreset,
    });
    onClose();
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setLocalError('Enter a valid email address.');
      return;
    }

    if (emailMode === 'reset') {
      await onResetPassword(trimmedEmail);
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    if (emailMode === 'signup') {
      await onEmailSignUp({
        name: fullName.trim() || trimmedEmail.split('@')[0],
        email: trimmedEmail,
        password,
      });
    } else {
      await onEmailSignIn({
        email: trimmedEmail,
        password,
        preferredPortal: portalRole,
      });
    }
  };

  const displayError = localError || authError;

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Modal Panel */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 px-6 py-5 bg-slate-50/70 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white shrink-0">
                  <Compass className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="auth-modal-title"
                    className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                  >
                    Access SkillPath Workspace
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose Guest Mode, Google Sync, or Email &amp; Password sign-in.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close sign in options"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* 3 Access Method Tabs */}
            <div
              role="tablist"
              aria-label="Sign in methods"
              className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 px-4 pt-3 gap-2"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'guest'}
                onClick={() => {
                  setActiveTab('guest');
                  setLocalError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-t-lg px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'guest'
                    ? 'border-blue-700 dark:border-blue-500 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Guest Mode</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'google'}
                onClick={() => {
                  setActiveTab('google');
                  setLocalError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-t-lg px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'google'
                    ? 'border-blue-700 dark:border-blue-500 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Google Sync</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'email'}
                onClick={() => {
                  setActiveTab('email');
                  setLocalError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-t-lg px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'email'
                    ? 'border-blue-700 dark:border-blue-500 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Email Login</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {displayError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs text-red-800 dark:text-red-300"
                >
                  {displayError}
                </div>
              )}

              {authNotice && (
                <div className="rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 px-4 py-3 text-xs text-blue-900 dark:text-blue-200 space-y-2">
                  <div>{authNotice}</div>
                  {pendingVerificationEmail && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={authLoading}
                        onClick={() => void onRefreshVerification()}
                        className="rounded-md bg-blue-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                      >
                        I&apos;ve Verified — Continue
                      </button>
                      <button
                        type="button"
                        disabled={authLoading}
                        onClick={() => void onResendVerification()}
                        className="rounded-md border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-blue-800 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800"
                      >
                        Resend Verification Email
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onStartGuest({
                            guestName: fullName.trim() || pendingVerificationEmail.split('@')[0],
                            targetCareerId: guestCareerId,
                            role: 'student',
                            preset: 'demo',
                          });
                          onClose();
                        }}
                        className="text-[11px] font-semibold underline text-slate-700 dark:text-slate-300"
                      >
                        Continue in Guest Mode Meanwhile
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 1: GUEST MODE */}
              {activeTab === 'guest' && (
                <form onSubmit={handleGuestSubmit} className="space-y-4">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Launch the full 5-agent skill analyzer, adaptive roadmap, diagnostic
                    assessments, and AI Mentor instantly without creating an account.
                    Changes save automatically to this browser.
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="guest-name-input"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Guest Name
                      </label>
                      <input
                        id="guest-name-input"
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        maxLength={60}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="guest-career-select"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Target Career
                      </label>
                      <select
                        id="guest-career-select"
                        value={guestCareerId}
                        onChange={(e) => setGuestCareerId(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preset selector */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Starting Workspace
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setGuestPreset('demo')}
                        className={`rounded-xl border p-3 text-left transition-colors ${
                          guestPreset === 'demo'
                            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          Pre-loaded CS Demo
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          Python, SQL &amp; HTML baseline ready for gap exploration.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGuestPreset('fresh')}
                        className={`rounded-xl border p-3 text-left transition-colors ${
                          guestPreset === 'fresh'
                            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          Fresh Starter Track
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          Clean slate to add your own verified skills and build from zero.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Portal Explorer Role */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Explore Role Experience
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'student', label: 'Student', icon: UserCheck },
                          { id: 'admin', label: 'Admin', icon: Users },
                          { id: 'owner', label: 'Owner', icon: Shield },
                        ] as const
                      ).map((item) => {
                        const Icon = item.icon;
                        const active = portalRole === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setPortalRole(item.id)}
                            className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                              active
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                  >
                    <span>Continue as Guest</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </form>
              )}

              {/* TAB 2: GOOGLE SYNC */}
              {activeTab === 'google' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Sign in with Google to synchronize your skill profile, diagnostic
                    assessments, and cohort analytics securely to Cloud Firestore across
                    sessions.
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      disabled={authLoading}
                      onClick={() => void onGoogleSignIn('student')}
                      className="flex w-full items-center justify-between rounded-xl border border-blue-700 bg-blue-700 px-4 py-3 text-left text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                        <div>
                          <div className="text-sm font-semibold">
                            {authLoading ? 'Connecting...' : 'Sign In as Student (Google)'}
                          </div>
                          <div className="text-[11px] text-blue-100">
                            Personal skill profile, roadmap, diagnostics &amp; AI Mentor
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      disabled={authLoading}
                      onClick={() => void onGoogleSignIn('admin')}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-left text-slate-900 dark:text-white transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/80 disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300 shrink-0" aria-hidden="true" />
                        <div>
                          <div className="text-sm font-semibold">
                            Sign In for Admin Console (Google)
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Cohort analytics &amp; career benchmark calibration
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      disabled={authLoading}
                      onClick={() => void onGoogleSignIn('owner')}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-left text-slate-900 dark:text-white transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/80 disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300 shrink-0" aria-hidden="true" />
                        <div>
                          <div className="text-sm font-semibold">
                            Sign In for Owner Portal (Google)
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Platform governance &amp; organization RBAC management
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: EMAIL & PASSWORD (EXTRA LOGIN OPTION) */}
              {activeTab === 'email' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                    {(
                      [
                        { id: 'signin', label: 'Sign In' },
                        { id: 'signup', label: 'Create Account' },
                        { id: 'reset', label: 'Reset Password' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setEmailMode(m.id);
                          setLocalError(null);
                        }}
                        className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          emailMode === m.id
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                    {emailMode === 'signup' && (
                      <div className="space-y-1.5">
                        <label
                          htmlFor="email-auth-name"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                          Full Name
                        </label>
                        <div className="relative">
                          <User
                            className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
                            aria-hidden="true"
                          />
                          <input
                            id="email-auth-name"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Maya Lin"
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label
                        htmlFor="email-auth-address"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
                          aria-hidden="true"
                        />
                        <input
                          id="email-auth-address"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="student@university.edu"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                        />
                      </div>
                    </div>

                    {emailMode !== 'reset' && (
                      <div className="space-y-1.5">
                        <label
                          htmlFor="email-auth-password"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <KeyRound
                            className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
                            aria-hidden="true"
                          />
                          <input
                            id="email-auth-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimum 6 characters"
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-10 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-2.5 top-2 rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-60"
                    >
                      <span>
                        {authLoading
                          ? 'Processing...'
                          : emailMode === 'signin'
                            ? 'Sign In with Email'
                            : emailMode === 'signup'
                              ? 'Create Cloud Account'
                              : 'Send Password Reset Link'}
                      </span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </form>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    New email accounts send a verification link before enabling cloud
                    sync. Want to test right away without verifying? Switch to the{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('guest')}
                      className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                    >
                      Guest Mode
                    </button>{' '}
                    tab.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
