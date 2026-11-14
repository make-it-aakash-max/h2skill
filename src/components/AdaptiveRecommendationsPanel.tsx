import { AlertTriangle, ArrowRight, Compass, Sparkles, TrendingUp } from 'lucide-react';
import type { AdaptiveRecommendation } from '../shared/types.ts';
import type { NavTab } from './SidebarNav.tsx';

interface AdaptiveRecommendationsPanelProps {
  recommendations: AdaptiveRecommendation[];
  onNavigate: (tab: NavTab) => void;
  onSwitchTargetRole: (roleId: string) => void;
  onStartQuizForSkill: (skillName: string) => void;
  isAdapting?: boolean;
}

export function AdaptiveRecommendationsPanel({
  recommendations,
  onNavigate,
  onSwitchTargetRole,
  onStartQuizForSkill,
  isAdapting = false,
}: AdaptiveRecommendationsPanelProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const handleAction = (rec: AdaptiveRecommendation) => {
    if (rec.type === 'Career Pivot' && rec.targetRoleId) {
      onSwitchTargetRole(rec.targetRoleId);
      return;
    }
    if (rec.actionTargetTab === 'assessments') {
      onStartQuizForSkill(rec.skillTarget);
      return;
    }
    onNavigate(rec.actionTargetTab);
  };

  return (
    <section
      aria-label="Adaptive recommendations"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Adaptive Recommendations
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Recalculated automatically by our 5 collaborating agents whenever your
            career goals, skills, or assessment results change.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
          {recommendations.length} active recommendation
          {recommendations.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {recommendations.map((rec) => {
          const isUrgent = rec.priority === 'Urgent';
          const isPivot = rec.type === 'Career Pivot';

          return (
            <div
              key={rec.id}
              className={`flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between ${
                isUrgent
                  ? 'bg-amber-50/50 dark:bg-amber-950/25'
                  : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      isUrgent
                        ? 'text-amber-800 dark:text-amber-400'
                        : rec.priority === 'High'
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isUrgent ? (
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : isPivot ? (
                      <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>{rec.priority}</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{rec.type}</span>
                  <span aria-hidden="true">·</span>
                  <span>Target: {rec.skillTarget}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{rec.estimatedHours} hrs</span>
                  {rec.expectedReadinessGain > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                        +{rec.expectedReadinessGain}% readiness
                      </span>
                    </>
                  )}
                </div>

                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  {rec.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {rec.triggerReason}
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  disabled={isAdapting}
                  onClick={() => handleAction(rec)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap disabled:opacity-50 ${
                    isUrgent
                      ? 'bg-amber-700 text-white hover:bg-amber-800'
                      : isPivot
                        ? 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                        : 'bg-blue-700 text-white hover:bg-blue-800'
                  }`}
                >
                  {isPivot && <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
                  <span>{rec.actionLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
