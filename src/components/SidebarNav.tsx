import {
  BarChart3,
  BookOpen,
  CheckSquare,
  Compass,
  LogIn,
  LogOut,
  MessageSquare,
  Shield,
  User,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import type { LearnerProfile, UserAccount } from '../shared/types.ts';
import { ThemeToggle } from './ThemeToggle.tsx';

export type NavTab =
  | 'overview'
  | 'roadmap'
  | 'assessments'
  | 'mentor'
  | 'profile'
  | 'admin';

interface SidebarNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  profile: LearnerProfile;
  account: UserAccount;
  targetRoleTitle: string;
  remedialCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSignOut: () => void;
  onOpenAuthUpgrade: () => void;
}

const STUDENT_NAV_ITEMS: Array<{
  id: NavTab;
  label: string;
  icon: typeof BarChart3;
}> = [
  { id: 'overview', label: 'Overview & Gaps', icon: BarChart3 },
  { id: 'roadmap', label: 'Learning Roadmap', icon: BookOpen },
  { id: 'assessments', label: 'Skill Assessments', icon: CheckSquare },
  { id: 'mentor', label: 'AI Mentor & Agents', icon: MessageSquare },
  { id: 'profile', label: 'Learner Profile', icon: User },
];

export function SidebarNav({
  activeTab,
  onSelectTab,
  profile,
  account,
  targetRoleTitle,
  remedialCount,
  mobileOpen,
  onCloseMobile,
  onSignOut,
  onOpenAuthUpgrade,
}: SidebarNavProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const navItems =
    account.role === 'admin' || account.role === 'owner'
      ? [
          ...STUDENT_NAV_ITEMS,
          {
            id: 'admin' as const,
            label: account.role === 'owner' ? 'Owner & Cohort' : 'Admin & Cohort',
            icon: Shield,
          },
        ]
      : STUDENT_NAV_ITEMS;

  const roleDisplay =
    account.role === 'owner'
      ? 'Owner'
      : account.role === 'admin'
        ? 'Admin'
        : 'Student';

  const modeLabel = account.isGuest
    ? ' · Guest Mode'
    : account.isPreview
      ? ' · Preview'
      : '';

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 px-4 py-5 transition-colors">
      <div>
        <div className="flex items-center justify-between px-2 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white shadow-xs">
              <Compass className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              SkillPath
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Workspace navigation" className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-blue-800 dark:text-blue-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-bg"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/70"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2.5 truncate">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'roadmap' && remedialCount > 0 && (
                  <span
                    aria-label={`${remedialCount} remedial sprint`}
                    className="relative z-10 tabular-nums text-xs font-semibold text-amber-700 dark:text-amber-400 shrink-0 ml-2"
                  >
                    +{remedialCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2.5">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Theme
          </span>
          <ThemeToggle />
        </div>

        <button
          type="button"
          onClick={() => {
            onSelectTab('profile');
            onCloseMobile();
          }}
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
        >
          {!imgFailed && profile.avatarUrl && account.role === 'student' ? (
            <img
              src={profile.avatarUrl}
              alt={`${profile.name} portrait`}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {(account.role === 'student' ? profile.name : account.displayName)
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {account.role === 'student' ? profile.name : account.displayName}
            </div>
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">
              {roleDisplay}
              {modeLabel} · {targetRoleTitle}
            </div>
          </div>
        </button>

        {(account.isGuest || account.isPreview) && (
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              onOpenAuthUpgrade();
            }}
            className="flex w-full items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/70 px-3 py-2 text-xs font-semibold text-blue-800 dark:text-blue-300 transition-colors hover:bg-blue-100 dark:hover:bg-blue-950"
          >
            <LogIn className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Sign In to Sync Cloud</span>
          </button>
        )}

        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <LogOut className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <span>
            {account.isGuest
              ? 'Exit Guest Mode'
              : account.isPreview
                ? 'Exit Preview'
                : 'Sign Out'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block lg:w-[272px] lg:shrink-0">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
