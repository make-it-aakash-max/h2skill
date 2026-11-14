import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  Clock,
  Compass,
  Gauge,
  MessageSquare,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import type {
  CareerRole,
  WorkspaceState,
} from '../shared/types.ts';
import { calculateProgressMetrics } from '../utils/skillEngine.ts';
import { AdaptiveRecommendationsPanel } from './AdaptiveRecommendationsPanel.tsx';
import { ReadinessRing } from './ReadinessRing.tsx';
import type { NavTab } from './SidebarNav.tsx';
import { SpotlightCard } from './SpotlightCard.tsx';

interface OverviewViewProps {
  workspace: WorkspaceState;
  roles: CareerRole[];
  isAdapting: boolean;
  onChangeTargetRole: (roleId: string) => void;
  onNavigate: (tab: NavTab) => void;
  onStartQuizForSkill: (skillName: string) => void;
}

export function OverviewView({
  workspace,
  roles,
  isAdapting,
  onChangeTargetRole,
  onNavigate,
  onStartQuizForSkill,
}: OverviewViewProps) {
  const [bannerFailed, setBannerFailed] = useState(false);
  const { profile, analysis, roadmap, assessments } = workspace;
  const activeRole =
    roles.find((r) => r.id === profile.targetCareerId) ?? roles[0];

  const metrics = calculateProgressMetrics(
    roadmap,
    assessments,
    profile.weeklyHoursAvailable,
  );
  const nextModule = roadmap.find((m) => m.status !== 'completed') ?? roadmap[0];
  const remedialCount = roadmap.filter((m) => m.isRemedial).length;

  return (
    <div className="space-y-8">
      {/* Hero & Career Goal Strip with ReadinessRing */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 shadow-xl shadow-slate-950/5 dark:shadow-slate-950/30 p-6 sm:p-8 relative overflow-hidden transition-all duration-200 hover:border-blue-500/40">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>Career Trajectory</span>
                <span aria-hidden="true"> · </span>
                <span>{activeRole.domain}</span>
                <span aria-hidden="true"> · </span>
                <span>{profile.weeklyHoursAvailable} hrs/week pace</span>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="overview-career-select"
                  className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap"
                >
                  Target Role
                </label>
                <select
                  id="overview-career-select"
                  value={profile.targetCareerId}
                  disabled={isAdapting}
                  onChange={(e) => onChangeTargetRole(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:opacity-60"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <ReadinessRing score={analysis.readinessScore} size={112} strokeWidth={9} />
              <div className="space-y-2 min-w-0">
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                  {activeRole.title} Readiness &amp; Skill Gap Analysis
                </h1>
                <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  {analysis.analystSummary}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onNavigate('roadmap')}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
            >
              <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {nextModule
                  ? `Continue: ${nextModule.skillTarget}`
                  : 'Open Learning Roadmap'}
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              <CheckSquare className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span>Run Diagnostic Quiz</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('mentor')}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <span>Ask AI Mentor</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
          {!bannerFailed ? (
            <img
              src="/src/assets/images/banner_career_atlas_1794630199932.jpg"
              alt="Architectural diagram representing personalized career learning nodes"
              referrerPolicy="no-referrer"
              onError={() => setBannerFailed(true)}
              className="h-44 lg:h-48 w-full object-cover border-b border-slate-200 dark:border-slate-800 dark:brightness-90"
            />
          ) : (
            <div className="flex h-44 lg:h-48 w-full items-center justify-center bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
              <Compass className="h-10 w-10 text-slate-400" aria-hidden="true" />
            </div>
          )}
          <div className="flex flex-1 flex-col justify-between p-5">
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Top Recommended Action
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {nextModule ? nextModule.title : 'All roadmap modules complete'}
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {nextModule
                  ? nextModule.adaptationReason
                  : 'Add new projects or select an advanced target role.'}
              </p>
            </div>
            {remedialCount > 0 && (
              <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-900 dark:text-amber-300">
                <span className="font-semibold">Adaptive Remediation Active:</span>{' '}
                {remedialCount} recovery sprint prioritized from recent diagnostic feedback.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4-Column Interactive Spotlight KPI Strip */}
      <section
        aria-label="Key readiness metrics"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <SpotlightCard
          delay={0.02}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Role Readiness</span>
            <Gauge className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {analysis.readinessScore}%
          </div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            {analysis.strongCount} strong · {analysis.developingCount} developing ·{' '}
            {analysis.missingCount} missing
          </div>
        </SpotlightCard>

        <SpotlightCard
          delay={0.05}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Missing Skills</span>
            <Target className="h-4 w-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {analysis.missingCount}
          </div>
          <div className="mt-1 truncate text-xs text-slate-600 dark:text-slate-400">
            {analysis.items
              .filter((i) => i.status === 'missing')
              .map((i) => i.skillName)
              .slice(0, 3)
              .join(', ') || 'No unstarted gaps'}
          </div>
        </SpotlightCard>

        <SpotlightCard
          delay={0.08}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Roadmap Progress</span>
            <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {metrics.completedModules}/{metrics.totalModules}
          </div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            {metrics.remainingHours} hrs remaining (~{metrics.estimatedWeeksLeft}{' '}
            wks)
          </div>
        </SpotlightCard>

        <SpotlightCard
          delay={0.11}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Assessment Average</span>
            <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {metrics.avgAssessmentScore !== null
              ? `${metrics.avgAssessmentScore}%`
              : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            {assessments.length} diagnostic{assessments.length === 1 ? '' : 's'}{' '}
            completed
          </div>
        </SpotlightCard>
      </section>

      {/* Live Adaptive Recommendations */}
      <AdaptiveRecommendationsPanel
        recommendations={workspace.adaptiveRecommendations ?? []}
        onNavigate={onNavigate}
        onSwitchTargetRole={onChangeTargetRole}
        onStartQuizForSkill={onStartQuizForSkill}
        isAdapting={isAdapting}
      />

      {/* Competency Matrix */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Competency Matrix: {activeRole.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Compares your verified skills against target role benchmarks. Missing
              competencies are automatically scheduled first.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 whitespace-nowrap"
          >
            Edit Existing Skills
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="px-6 py-3">Competency</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Current</th>
                <th className="px-4 py-3 text-right">Target</th>
                <th className="px-4 py-3 min-w-[180px]">Gap Coverage</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {analysis.items.map((item) => {
                const statusMeta =
                  item.status === 'strong'
                    ? {
                        label: 'Strong',
                        color: 'text-emerald-700 dark:text-emerald-400',
                        bar: 'bg-emerald-600 dark:bg-emerald-500',
                        Icon: CheckCircle2,
                      }
                    : item.status === 'developing'
                      ? {
                          label: 'Developing',
                          color: 'text-amber-700 dark:text-amber-400',
                          bar: 'bg-amber-500',
                          Icon: Clock,
                        }
                      : {
                          label: 'Missing Gap',
                          color: 'text-red-700 dark:text-red-400',
                          bar: 'bg-red-500',
                          Icon: AlertCircle,
                        };
                const StatusIcon = statusMeta.Icon;

                return (
                  <tr
                    key={item.skillName}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.skillName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {item.priority} · {item.category}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusMeta.color}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{statusMeta.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-900 dark:text-slate-100 tabular-nums">
                      {item.currentLevel}%
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                      {item.requiredLevel}%
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${statusMeta.bar}`}
                          style={{ width: `${item.currentLevel}%` }}
                        />
                        <div
                          aria-hidden="true"
                          title={`Target: ${item.requiredLevel}%`}
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-900/50 dark:bg-white/60"
                          style={{ left: `${item.requiredLevel}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-[280px]">
                        {item.rationale}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onStartQuizForSkill(item.skillName)}
                        aria-label={`Assess ${item.skillName}`}
                        className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                      >
                        Assess
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
