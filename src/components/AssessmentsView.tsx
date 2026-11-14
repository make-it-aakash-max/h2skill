import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchSkillQuiz } from '../api/workspaceClient.ts';
import type {
  AssessmentRecord,
  QuizQuestion,
  SkillGapItem,
} from '../shared/types.ts';

interface AssessmentsViewProps {
  skills: SkillGapItem[];
  assessments: AssessmentRecord[];
  initialSkill?: string | null;
  initialModuleId?: string;
  onSubmitAssessment: (payload: {
    skillName: string;
    moduleId?: string;
    answers: number[];
  }) => Promise<{
    record: AssessmentRecord;
    remediationTriggered: boolean;
    questions: QuizQuestion[];
  }>;
  onOpenRoadmap: () => void;
}

export function AssessmentsView({
  skills,
  assessments,
  initialSkill,
  initialModuleId,
  onSubmitAssessment,
  onOpenRoadmap,
}: AssessmentsViewProps) {
  const defaultSkill =
    initialSkill ||
    skills.find((s) => s.status === 'missing')?.skillName ||
    skills[0]?.skillName ||
    'JavaScript';

  const [selectedSkill, setSelectedSkill] = useState<string>(defaultSkill);
  const [moduleId, setModuleId] = useState<string | undefined>(initialModuleId);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<{
    record: AssessmentRecord;
    remediationTriggered: boolean;
    questions: QuizQuestion[];
    submittedAnswers: number[];
  } | null>(null);

  useEffect(() => {
    if (initialSkill) {
      setSelectedSkill(initialSkill);
      setModuleId(initialModuleId);
    }
  }, [initialSkill, initialModuleId]);

  useEffect(() => {
    let active = true;
    setLoadingQuiz(true);
    setError(null);
    setLatestResult(null);
    setAnswers({});

    fetchSkillQuiz(selectedSkill)
      .then((res) => {
        if (!active) return;
        setQuestions(res.questions);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load diagnostic.');
      })
      .finally(() => {
        if (active) setLoadingQuiz(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSkill]);

  const allAnswered =
    questions.length > 0 &&
    questions.every((_, idx) => typeof answers[idx] === 'number');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered || submitting) return;

    setSubmitting(true);
    setError(null);
    const orderedAnswers = questions.map((_, idx) => answers[idx]);
    try {
      const res = await onSubmitAssessment({
        skillName: selectedSkill,
        moduleId,
        answers: orderedAnswers,
      });
      setLatestResult({
        record: res.record,
        remediationTriggered: res.remediationTriggered,
        questions: res.questions,
        submittedAnswers: orderedAnswers,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Progress Evaluator · Adaptive Diagnostics
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Skill Assessments &amp; Mastery Checks
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Verify competencies to update role readiness. Scoring below 60%
            automatically triggers a targeted Remedial Sprint in your roadmap.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="assessment-skill-select"
            className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap"
          >
            Select Skill
          </label>
          <select
            id="assessment-skill-select"
            value={selectedSkill}
            onChange={(e) => {
              setSelectedSkill(e.target.value);
              setModuleId(undefined);
            }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            {skills.map((s) => (
              <option key={s.skillName} value={s.skillName}>
                {s.skillName} ({s.currentLevel}% current)
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-sm text-red-800 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Diagnostic Quiz Area */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          {loadingQuiz ? (
            <div className="space-y-4">
              <div className="h-5 w-48 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-20 w-full rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-20 w-full rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ) : latestResult ? (
            <div className="space-y-5">
              <div
                className={`rounded-lg border p-4 ${
                  latestResult.record.passed
                    ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40'
                    : 'border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {latestResult.record.passed ? (
                      <CheckCircle2
                        className="h-5 w-5 text-emerald-700 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                    ) : (
                      <AlertTriangle
                        className="h-5 w-5 text-amber-700 dark:text-amber-400"
                        aria-hidden="true"
                      />
                    )}
                    <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {latestResult.record.skillName} Score:{' '}
                      <span className="font-mono tabular-nums">
                        {latestResult.record.score}%
                      </span>
                    </h2>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                    {latestResult.record.correctCount} /{' '}
                    {latestResult.record.totalQuestions} correct
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  {latestResult.record.evaluatorFeedback}
                </p>
                {latestResult.remediationTriggered && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={onOpenRoadmap}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 dark:bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-800 dark:hover:bg-amber-700 whitespace-nowrap"
                    >
                      <span>View Remedial Roadmap Update</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Answer Review
                </h3>
                {latestResult.questions.map((q, idx) => {
                  const chosen = latestResult.submittedAnswers[idx];
                  const isCorrect = chosen === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 p-4 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {idx + 1}. {q.prompt}
                        </div>
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Correct
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400 shrink-0">
                            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            Missed
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Correct answer:
                        </span>{' '}
                        {q.options[q.correctIndex]}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setLatestResult(null);
                  setAnswers({});
                }}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Retake {selectedSkill} Assessment
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {selectedSkill} Diagnostic ({questions.length} Questions)
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  Pass benchmark: 60%
                </span>
              </div>

              {questions.map((q, qIdx) => (
                <fieldset key={q.id} className="space-y-2.5">
                  <legend className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {qIdx + 1}. {q.prompt}
                  </legend>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const checked = answers[qIdx] === optIdx;
                      return (
                        <label
                          key={opt}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                            checked
                              ? 'border-blue-600 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-slate-900 dark:text-slate-100'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={optIdx}
                            checked={checked}
                            onChange={() =>
                              setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))
                            }
                            className="mt-0.5 h-4 w-4 text-blue-700 focus:ring-blue-600 dark:bg-slate-800 dark:border-slate-700"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {Object.keys(answers).length} of {questions.length} answered
                </span>
                <button
                  type="submit"
                  disabled={!allAnswered || submitting}
                  className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Evaluating...' : 'Submit Assessment'}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Assessment History */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Assessment History
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Every submitted diagnostic updates your skill profile and triggers
            Progress Evaluator adaptation if score &lt; 60%.
          </p>

          {assessments.length === 0 ? (
            <div className="mt-8 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
              <ClipboardCheck
                className="mx-auto h-7 w-7 text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                No diagnostics submitted yet
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Complete the {selectedSkill} quiz on the left to record your first
                verified benchmark.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
              {assessments.map((rec) => (
                <div key={rec.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {rec.skillName}
                    </span>
                    <span
                      className={`font-mono text-sm font-semibold tabular-nums ${
                        rec.passed
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {rec.score}% · {rec.passed ? 'Passed' : 'Remedial'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {rec.evaluatorFeedback}
                  </p>
                  <div className="mt-1 text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                    {new Date(rec.takenAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
