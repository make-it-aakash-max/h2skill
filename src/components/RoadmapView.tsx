import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  PlayCircle,
} from 'lucide-react';
import { useState } from 'react';
import type {
  LearningModule,
  ModulePhase,
  ModuleStatus,
} from '../shared/types.ts';

interface RoadmapViewProps {
  targetRoleTitle: string;
  roadmap: LearningModule[];
  weeklyHoursAvailable: number;
  onUpdateStatus: (moduleId: string, status: ModuleStatus) => void;
  onStartQuizForSkill: (skillName: string, moduleId: string) => void;
}

type PhaseFilter = 'All' | ModulePhase;

export function RoadmapView({
  targetRoleTitle,
  roadmap,
  weeklyHoursAvailable,
  onUpdateStatus,
  onStartQuizForSkill,
}: RoadmapViewProps) {
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('All');

  const filteredModules =
    phaseFilter === 'All'
      ? roadmap
      : roadmap.filter((m) => m.phase === phaseFilter);

  const totalHours = roadmap.reduce((sum, m) => sum + m.estimatedHours, 0);
  const completedCount = roadmap.filter((m) => m.status === 'completed').length;
  const remedialCount = roadmap.filter((m) => m.isRemedial).length;

  const filterTabs: PhaseFilter[] = [
    'All',
    ...(remedialCount > 0 ? (['Remedial Sprint'] as const) : []),
    'Foundations',
    'Core Stack',
    'Applied Systems',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Personalized Curriculum</span>
            <span aria-hidden="true"> · </span>
            <span>{targetRoleTitle}</span>
            <span aria-hidden="true"> · </span>
            <span className="tabular-nums">{totalHours} total hours</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Adaptive Learning Roadmap
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Ordered by our Curriculum Architect to close missing competencies first
            at your {weeklyHoursAvailable} hrs/week pace ({completedCount} of{' '}
            {roadmap.length} completed).
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Filter roadmap by phase"
          className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1"
        >
          {filterTabs.map((tab) => {
            const active = phaseFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setPhaseFilter(tab)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {filteredModules.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <h2 className="mt-3 font-display text-base font-semibold text-slate-900 dark:text-white">
            No modules in this phase
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Switch to &ldquo;All&rdquo; to inspect your complete learning sequence.
          </p>
          <button
            type="button"
            onClick={() => setPhaseFilter('All')}
            className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            Show All Modules
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredModules.map((mod, index) => {
            const isCompleted = mod.status === 'completed';
            const isInProgress = mod.status === 'in_progress';

            return (
              <article
                key={mod.id}
                className={`rounded-xl border bg-white dark:bg-slate-900 p-6 transition-colors ${
                  mod.isRemedial
                    ? 'border-amber-300 dark:border-amber-700'
                    : isCompleted
                      ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {mod.isRemedial && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-300">
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400"
                      aria-hidden="true"
                    />
                    <div>
                      <span className="font-semibold">
                        Adaptive Remedial Intervention:
                      </span>{' '}
                      {mod.adaptationReason}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{mod.phase}</span>
                      <span aria-hidden="true">·</span>
                      <span>{mod.format}</span>
                      <span aria-hidden="true">·</span>
                      <span>Target: {mod.skillTarget}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{mod.estimatedHours} hrs</span>
                      <span aria-hidden="true">·</span>
                      <span>{mod.difficulty}</span>
                    </div>

                    <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                      {mod.title}
                    </h2>

                    {!mod.isRemedial && mod.adaptationReason && (
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {mod.adaptationReason}
                      </p>
                    )}

                    <div className="pt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Key Learning Objectives
                        </div>
                        <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                          {mod.objectives.map((obj) => (
                            <li key={obj} className="flex items-start gap-2">
                              <span
                                className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500"
                                aria-hidden="true"
                              />
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/70 p-3.5 border border-slate-200/80 dark:border-slate-700/80">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Hands-On Practical Exercise
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          {mod.exercisePrompt}
                        </p>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Provider: {mod.provider}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2.5 lg:w-52 lg:items-end">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Completed (100%)
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                          <Clock className="h-4 w-4" aria-hidden="true" />
                          In Progress ({mod.progressPercent}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Circle className="h-4 w-4" aria-hidden="true" />
                          Not Started
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:flex-col lg:w-full">
                      {!isCompleted ? (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(mod.id, 'completed')}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Mark Complete
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(mod.id, 'in_progress')}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
                        >
                          Reopen Module
                        </button>
                      )}

                      {!isInProgress && !isCompleted && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(mod.id, 'in_progress')}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
                        >
                          <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          Start Module
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onStartQuizForSkill(mod.skillTarget, mod.id)}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
                      >
                        Take {mod.skillTarget} Quiz
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
