import { Save, Shield, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  fetchAllLearnersForAdmin,
  fetchAllUsersForOwner,
  grantAdminRole,
  revokeAdminRole,
  saveCareerRoleToFirestore,
} from '../services/firestoreService.ts';
import type {
  CareerRole,
  CohortLearnerSummary,
  UserAccount,
} from '../shared/types.ts';

interface AdminConsoleViewProps {
  account: UserAccount;
  roles: CareerRole[];
  currentLearnerSummary: CohortLearnerSummary;
  onRolesUpdated: (nextRoles: CareerRole[]) => void;
}

const PREVIEW_COHORT: CohortLearnerSummary[] = [
  {
    uid: 'cohort-2',
    name: 'Liam Carter',
    organization: 'Pacific State University',
    targetCareerId: 'data-engineer',
    targetRoleTitle: 'Data Engineer',
    readinessScore: 61,
    missingSkills: ['Apache Spark', 'Cloud Warehousing'],
    assessmentsCount: 3,
    avgScore: 78,
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'cohort-3',
    name: 'Priya Nair',
    organization: 'Pacific State University',
    targetCareerId: 'ml-engineer',
    targetRoleTitle: 'Machine Learning Engineer',
    readinessScore: 48,
    missingSkills: ['PyTorch & ML', 'MLOps & Evaluation'],
    assessmentsCount: 2,
    avgScore: 55,
    updatedAt: new Date().toISOString(),
  },
];

export function AdminConsoleView({
  account,
  roles,
  currentLearnerSummary,
  onRolesUpdated,
}: AdminConsoleViewProps) {
  const [cohort, setCohort] = useState<CohortLearnerSummary[]>([
    currentLearnerSummary,
    ...PREVIEW_COHORT,
  ]);
  const [members, setMembers] = useState<UserAccount[]>([
    account,
    {
      uid: 'preview-student-1',
      displayName: 'Liam Carter',
      email: '',
      role: 'student',
      organization: 'Pacific State University',
    },
    {
      uid: 'preview-admin-1',
      displayName: 'Dr. Elena Rostova',
      email: '',
      role: 'admin',
      organization: 'Pacific State University',
    },
  ]);
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? 'full-stack-dev');
  const [editingRole, setEditingRole] = useState<CareerRole>(roles[0]);
  const [savingRole, setSavingRole] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = account.role === 'owner';

  useEffect(() => {
    const found = roles.find((r) => r.id === selectedRoleId) ?? roles[0];
    if (found) setEditingRole(structuredClone(found));
  }, [selectedRoleId, roles]);

  useEffect(() => {
    if (account.isPreview) {
      setCohort([currentLearnerSummary, ...PREVIEW_COHORT]);
      return;
    }

    fetchAllLearnersForAdmin()
      .then((rows) => {
        if (rows.length > 0) setCohort(rows);
      })
      .catch(() => {
        // Keep current learner summary if collection empty or restricted
      });

    if (isOwner) {
      fetchAllUsersForOwner()
        .then((usersList) => {
          if (usersList.length > 0) setMembers(usersList);
        })
        .catch(() => {
          // ignore if preview
        });
    }
  }, [account.isPreview, isOwner, currentLearnerSummary]);

  const handleSaveBenchmarks = async () => {
    if (!editingRole) return;
    setSavingRole(true);
    setNotice(null);
    setError(null);

    try {
      if (!account.isPreview) {
        await saveCareerRoleToFirestore(editingRole, account.uid);
      }
      const nextRoles = roles.map((r) =>
        r.id === editingRole.id ? editingRole : r,
      );
      onRolesUpdated(nextRoles);
      setNotice(
        account.isPreview
          ? `Updated ${editingRole.title} competency benchmarks in preview session.`
          : `Saved ${editingRole.title} competency benchmarks to Firestore.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save career track benchmarks.',
      );
    } finally {
      setSavingRole(false);
    }
  };

  const handleToggleAdmin = async (member: UserAccount) => {
    if (!isOwner || member.role === 'owner') return;
    setNotice(null);
    setError(null);

    const promote = member.role !== 'admin';
    try {
      if (!account.isPreview) {
        if (promote) {
          await grantAdminRole(member.uid, member.email || 'admin@skillpath.edu', account.uid);
        } else {
          await revokeAdminRole(member.uid);
        }
      }
      setMembers((prev) =>
        prev.map((m) =>
          m.uid === member.uid ? { ...m, role: promote ? 'admin' : 'student' } : m,
        ),
      );
      setNotice(
        `${member.displayName} role updated to ${promote ? 'Admin' : 'Student'}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member role.');
    }
  };

  const avgCohortReadiness =
    cohort.length > 0
      ? Math.round(
          cohort.reduce((sum, l) => sum + l.readinessScore, 0) / cohort.length,
        )
      : 0;

  const gapCounts = new Map<string, number>();
  for (const l of cohort) {
    for (const s of l.missingSkills) {
      gapCounts.set(s, (gapCounts.get(s) ?? 0) + 1);
    }
  }
  const topGap = Array.from(gapCounts.entries()).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {isOwner ? 'Owner Governance Console' : 'Admin Cohort Console'} ·{' '}
            {account.organization}
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {isOwner
              ? 'Cohort Analytics, Career Benchmarks & RBAC'
              : 'Cohort Skill Gaps & Career Benchmarks'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Track learner readiness across the organization, calibrate role skill
            thresholds, and govern workspace permissions.
          </p>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300"
        >
          {notice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-sm text-red-800 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {/* Cohort KPI Strip */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Learners</div>
          <div className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {cohort.length}
          </div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Across {roles.length} career tracks
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Average Cohort Readiness
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {avgCohortReadiness}%
          </div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Weighted by Core &amp; Important role criteria
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Top Cohort Skill Gap
          </div>
          <div className="mt-2 font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
            {topGap ? topGap[0] : 'None'}
          </div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            {topGap ? `Missing for ${topGap[1]} learner(s)` : 'All skills covered'}
          </div>
        </div>
      </section>

      {/* Cohort Roster Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Cohort Readiness &amp; Missing Skills
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="px-6 py-3">Learner</th>
                <th className="px-4 py-3">Target Career</th>
                <th className="px-4 py-3 text-right">Readiness</th>
                <th className="px-4 py-3">Critical Gaps</th>
                <th className="px-6 py-3 text-right">Quiz Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {cohort.map((row) => (
                <tr key={row.uid} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-3.5">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{row.organization}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                    {row.targetRoleTitle}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {row.readinessScore}%
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                    {row.missingSkills.length > 0
                      ? row.missingSkills.join(' · ')
                      : 'No unstarted gaps'}
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                    {row.avgScore !== null ? `${row.avgScore}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Career Competency Benchmark Editor */}
      {editingRole && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                Career Competency Benchmarks
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adjust required skill levels used by Skill Analyst &amp; Market
                Scout agents across all learners.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="admin-role-select" className="sr-only">
                Select Career Track
              </label>
              <select
                id="admin-role-select"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={savingRole}
                onClick={handleSaveBenchmarks}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{savingRole ? 'Saving...' : 'Save Benchmarks'}</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {editingRole.requiredSkills.map((req, idx) => (
              <div
                key={req.name}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {req.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {req.priority} · {req.category}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor={`bench-${req.name}`}
                    className="text-xs text-slate-600 dark:text-slate-400"
                  >
                    Target:
                  </label>
                  <input
                    id={`bench-${req.name}`}
                    type="range"
                    min={40}
                    max={95}
                    step={5}
                    value={req.requiredLevel}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditingRole((prev) => ({
                        ...prev,
                        requiredSkills: prev.requiredSkills.map((s, sIdx) =>
                          sIdx === idx ? { ...s, requiredLevel: val } : s,
                        ),
                      }));
                    }}
                    className="w-32 accent-blue-700"
                  />
                  <span className="w-10 text-right font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {req.requiredLevel}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {isOwner && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-700 dark:text-slate-300" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                Owner Access Control (RBAC)
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Only the verified Platform Owner can grant or revoke Admin privileges
              in Firestore.
            </p>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 px-6">
            {members.map((member) => (
              <div
                key={member.uid}
                className="flex flex-wrap items-center justify-between gap-4 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {member.role === 'owner' ? (
                      <Shield className="h-4 w-4" aria-hidden="true" />
                    ) : member.role === 'admin' ? (
                      <Users className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <UserCheck className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {member.displayName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {member.organization} · Role:{' '}
                      <span className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                        {member.role}
                      </span>
                    </div>
                  </div>
                </div>

                {member.role !== 'owner' && (
                  <button
                    type="button"
                    onClick={() => handleToggleAdmin(member)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    {member.role === 'admin' ? 'Revoke Admin' : 'Grant Admin'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
