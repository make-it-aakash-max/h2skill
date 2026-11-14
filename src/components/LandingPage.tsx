import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Mail,
  Shield,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { CAREER_ROLES } from '../shared/careerCatalog.ts';
import type { UserRole } from '../shared/types.ts';
import type { AuthModalTab } from './AuthOptionsModal.tsx';
import { SpotlightCard } from './SpotlightCard.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';

interface LandingPageProps {
  authLoading: boolean;
  authError: string | null;
  onOpenAuthModal: (options?: {
    tab?: AuthModalTab;
    role?: UserRole;
    careerId?: string;
  }) => void;
  onQuickGuestEnter: (role?: UserRole, careerId?: string) => void;
}

const FIVE_AGENTS = [
  {
    index: '01',
    name: 'Skill Analyst',
    role: 'Diagnostic Mapping',
    description:
      'Evaluates existing skills, certifications, and portfolio projects against target industry competency benchmarks to quantify readiness and isolate exact gaps.',
  },
  {
    index: '02',
    name: 'Market & Role Scout',
    role: 'Career Alignment',
    description:
      'Compares learner strengths across multiple career tracks, weights core vs. supporting skills, and surfaces high-fit adjacent career pivots.',
  },
  {
    index: '03',
    name: 'Curriculum Architect',
    role: 'Personalized Sequencing',
    description:
      'Constructs phased learning roadmaps combining courses, tutorials, and practical exercises while skipping competencies the learner has already mastered.',
  },
  {
    index: '04',
    name: 'Progress Evaluator',
    role: 'Adaptive Assessment',
    description:
      'Grades diagnostic checkpoints, tracks module velocity, and inserts targeted recovery sprints automatically whenever an assessment score falls below 60%.',
  },
  {
    index: '05',
    name: 'AI Mentor',
    role: 'Contextual Coaching',
    description:
      'Synthesizes findings from all four peer agents to explain roadmap changes, bridge existing knowledge to new tools, and recommend the next high-leverage action.',
  },
];

export function LandingPage({
  authLoading,
  authError,
  onOpenAuthModal,
  onQuickGuestEnter,
}: LandingPageProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const prefersReduced = useReducedMotion();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          {/* Zone 1: Single-line Wordmark */}
          <a
            href="#top"
            className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-700 text-white shadow-xs">
              <Compass className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>SkillPath</span>
          </a>

          {/* Zone 2: 4 Single-line Text Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-400"
          >
            <a
              href="#capabilities"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#five-agents"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Five AI Agents
            </a>
            <a
              href="#career-tracks"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Career Tracks
            </a>
            <a
              href="#role-portals"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Portal Login
            </a>
          </nav>

          {/* Zone 3: Theme Toggle + Guest Entry + Primary Sign In Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => onOpenAuthModal({ tab: 'guest', role: 'student' })}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span>Guest Mode</span>
            </button>
            <button
              type="button"
              disabled={authLoading}
              onClick={() => onOpenAuthModal({ tab: 'google', role: 'student' })}
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {authLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero Section with Atmospheric Dot-Grid & Radial Lighting */}
        <section className="relative overflow-hidden bg-dot-grid bg-hero-atmosphere">
          <div className="mx-auto max-w-6xl px-6 pt-12 pb-16 lg:pt-16 lg:pb-20">
            {authError && (
              <div
                role="alert"
                className="mb-8 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-800 dark:text-red-300"
              >
                {authError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-stretch">
              <motion.div
                initial={prefersReduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="lg:col-span-6 flex flex-col justify-between space-y-8"
              >
                <div className="space-y-5">
                  <div className="text-xs font-semibold tracking-wide uppercase text-blue-700 dark:text-blue-400">
                    Adaptive Career Navigation · Universities &amp; Engineering Teams
                  </div>
                  <h1
                    className="font-display font-bold tracking-tight text-slate-900 dark:text-white text-balance leading-[1.08]"
                    style={{ fontSize: 'clamp(2.25rem, 4.1vw, 3.4rem)' }}
                  >
                    Identify skill gaps and build{' '}
                    <span className="bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-600 dark:from-blue-400 dark:via-sky-300 dark:to-indigo-400 bg-clip-text text-transparent">
                      adaptive career roadmaps.
                    </span>
                  </h1>
                  <p className="max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    Instead of assigning identical courses to every student, SkillPath
                    maps existing skills, detects missing competencies for a target role,
                    and coordinates five specialized AI agents to guide and adapt every
                    study milestone.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onQuickGuestEnter('student', 'full-stack-dev')}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 whitespace-nowrap"
                    >
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      <span>Continue as Guest</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      disabled={authLoading}
                      onClick={() => onOpenAuthModal({ tab: 'google', role: 'student' })}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 whitespace-nowrap"
                    >
                      <span>Sign In / Options</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenAuthModal({ tab: 'email', role: 'student' })}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
                    >
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Email Login</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No account required for Guest Mode. Start with a fresh skill profile
                    or the pre-loaded Computer Science → Full Stack Developer scenario.
                  </p>
                </div>
              </motion.div>

              {/* Hero Studio Visual + Live Skill-Gap Snapshot Scrim Card */}
              <motion.div
                initial={prefersReduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}
                className="lg:col-span-6 relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg"
              >
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/hero_learning_studio_1794632268933.jpg"
                    alt="Students and engineers collaborating in a daylight-filled university learning studio"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="h-80 lg:h-full min-h-[380px] w-full object-cover dark:brightness-90"
                  />
                ) : (
                  <div className="flex h-80 lg:h-full min-h-[380px] w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <Compass className="h-12 w-12 text-slate-400" aria-hidden="true" />
                  </div>
                )}

                {/* Measured scrim overlay for legibility */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent"
                />

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white">
                  <div className="rounded-xl border border-white/15 bg-slate-950/75 backdrop-blur-md p-4">
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
                      <div>
                        <div className="text-[11px] font-medium text-sky-300">
                          Sample Diagnostic Snapshot
                        </div>
                        <div className="font-display text-sm font-semibold text-white">
                          CS Student → Full Stack Developer
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg font-bold text-white tabular-nums">
                          48%
                        </div>
                        <div className="text-[10px] text-slate-300">Readiness</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200">Python &amp; SQL</span>
                        <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                          Strong (75%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200">HTML &amp; CSS</span>
                        <span className="font-mono font-semibold text-amber-300 tabular-nums">
                          52%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200">JavaScript &amp; React</span>
                        <span className="font-mono font-semibold text-rose-300 tabular-nums">
                          Missing Gap
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200">Node.js APIs</span>
                        <span className="font-mono font-semibold text-rose-300 tabular-nums">
                          Missing Gap
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Proof Strip */}
        <section
          id="capabilities"
          className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-10"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                5 Agents
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Collaborative Planning
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Analyst, Scout, Architect, Evaluator, and Mentor share context across
                every update.
              </p>
            </div>
            <div>
              <div className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                &lt; 60% Gate
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Automatic Remediation
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Weak diagnostic scores automatically insert foundational recovery
                sprints first.
              </p>
            </div>
            <div>
              <div className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                4 Tracks
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Live Career Matching
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Switching target roles recalculates gaps, readiness scores, and
                curriculum modules immediately.
              </p>
            </div>
            <div>
              <div className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                Guest + Cloud
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Flexible Access Modes
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Explore instantly in Guest Mode or sign in via Google and Email for
                cloud persistence.
              </p>
            </div>
          </div>
        </section>

        {/* Five Collaborating AI Agents with SpotlightCards */}
        <section id="five-agents" className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Multi-Agent Architecture
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
              Five specialized agents that collaborate on every learner milestone
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Every profile edit, career switch, or diagnostic assessment runs a
              structured handoff across five distinct agents with an inspectable
              audit log.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-6">
            {FIVE_AGENTS.map((agent, idx) => (
              <SpotlightCard
                key={agent.name}
                delay={idx * 0.04}
                className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 ${
                  idx < 2 ? 'md:col-span-3' : 'md:col-span-2'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                    {agent.index}
                  </span>
                  <span>{agent.role}</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-slate-900 dark:text-white">
                  {agent.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {agent.description}
                </p>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* Career Tracks Overview */}
        <section
          id="career-tracks"
          className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-16"
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                  Competency Matrices
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Benchmarked career tracks ready out of the box
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onOpenAuthModal({ tab: 'guest', role: 'student' })}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <span>Customize Guest Track</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              {CAREER_ROLES.map((role, idx) => (
                <SpotlightCard
                  key={role.id}
                  delay={idx * 0.04}
                  onClick={() =>
                    onOpenAuthModal({
                      tab: 'guest',
                      role: 'student',
                      careerId: role.id,
                    })
                  }
                  className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/80 p-6 hover:border-blue-400 dark:hover:border-blue-600"
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>
                      {role.domain} · {role.typicalTimelineWeeks} weeks typical ramp
                    </span>
                    <ArrowRight
                      className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mt-1.5 font-display text-lg font-semibold text-slate-900 dark:text-white">
                    {role.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                    {role.summary}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-400">
                    Core skills:{' '}
                    <span className="font-medium text-slate-900 dark:text-slate-200">
                      {role.requiredSkills.map((s) => s.name).join(' · ')}
                    </span>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>
        </section>

        {/* Student / Admin / Owner Login Portal */}
        <section id="role-portals" className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Role-Based Access &amp; Guest Sandbox
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Dedicated portals for Students, Admins, and Owners
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Sign in with Google or Email &amp; Password to persist workspaces in
              Firestore, or launch any role immediately in Guest Mode.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Student Portal Card */}
            <SpotlightCard className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
                    <UserCheck className="h-4 w-4" aria-hidden="true" />
                    <span>Student Portal</span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Personalized Learner Workspace
                  </h3>
                  <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Maintain skills, certifications, and projects</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Inspect missing gaps and adaptive roadmaps</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Take diagnostic quizzes &amp; chat with AI Mentor</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={() => onOpenAuthModal({ tab: 'google', role: 'student' })}
                    className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                  >
                    Student Sign In (Google / Email)
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickGuestEnter('student', 'full-stack-dev')}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Enter Student Guest Mode
                  </button>
                </div>
              </div>
            </SpotlightCard>

            {/* Admin Portal Card */}
            <SpotlightCard className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    <span>Admin Portal</span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-white">
                    University &amp; Cohort Console
                  </h3>
                  <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Monitor cohort readiness and recurring skill gaps</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Calibrate target proficiency benchmarks per career</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Full access to learner assessment outcomes</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={() => onOpenAuthModal({ tab: 'google', role: 'admin' })}
                    className="w-full rounded-lg bg-slate-900 dark:bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-60"
                  >
                    Admin Sign In (Google / Email)
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickGuestEnter('admin', 'full-stack-dev')}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Enter Admin Guest Mode
                  </button>
                </div>
              </div>
            </SpotlightCard>

            {/* Owner Portal Card */}
            <SpotlightCard className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    <span>Owner Portal</span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Platform Governance &amp; RBAC
                  </h3>
                  <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Manage Admin privileges across workspace accounts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Enforce organization-wide career tracks &amp; benchmarks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Inspect cross-cohort agent adaptation telemetry</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={() => onOpenAuthModal({ tab: 'google', role: 'owner' })}
                    className="w-full rounded-lg bg-slate-900 dark:bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-60"
                  >
                    Owner Sign In (Google / Email)
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickGuestEnter('owner', 'full-stack-dev')}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Enter Owner Guest Mode
                  </button>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="font-display font-semibold text-slate-900 dark:text-white">
            SkillPath
          </div>
          <div className="flex items-center gap-6">
            <a href="#capabilities" className="hover:text-slate-900 dark:hover:text-white">
              Capabilities
            </a>
            <a href="#five-agents" className="hover:text-slate-900 dark:hover:text-white">
              Five AI Agents
            </a>
            <a href="#role-portals" className="hover:text-slate-900 dark:hover:text-white">
              Portal Login
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
