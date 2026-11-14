import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle.tsx';
import type {
  CareerRole,
  CertificationItem,
  LearnerProfile,
  LearnerSkill,
  ProjectItem,
} from '../shared/types.ts';
import { proficiencyToLabel } from '../utils/skillEngine.ts';

interface ProfileViewProps {
  profile: LearnerProfile;
  roles: CareerRole[];
  saving: boolean;
  onSaveProfile: (updated: LearnerProfile) => Promise<void>;
  onResetDemo: () => Promise<void>;
}

export function ProfileView({
  profile,
  roles,
  saving,
  onSaveProfile,
  onResetDemo,
}: ProfileViewProps) {
  const [draft, setDraft] = useState<LearnerProfile>(profile);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProf, setNewSkillProf] = useState(60);
  const [newCertTitle, setNewCertTitle] = useState('');
  const [newCertIssuer, setNewCertIssuer] = useState('');
  const [newCertYear, setNewCertYear] = useState('2026');
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjSummary, setNewProjSummary] = useState('');
  const [newProjStack, setNewProjStack] = useState('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const handleAddSkill = () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    if (draft.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    const nextSkill: LearnerSkill = {
      name: trimmed,
      proficiency: newSkillProf,
      levelLabel: proficiencyToLabel(newSkillProf),
      verified: false,
      source: 'Self-reported in profile',
    };
    setDraft((prev) => ({ ...prev, skills: [...prev.skills, nextSkill] }));
    setNewSkillName('');
    setNewSkillProf(60);
  };

  const handleAddCert = () => {
    if (!newCertTitle.trim() || !newCertIssuer.trim()) return;
    const item: CertificationItem = {
      id: `cert-${Date.now()}`,
      title: newCertTitle.trim(),
      issuer: newCertIssuer.trim(),
      year: newCertYear.trim() || '2026',
    };
    setDraft((prev) => ({
      ...prev,
      certifications: [...prev.certifications, item],
    }));
    setNewCertTitle('');
    setNewCertIssuer('');
  };

  const handleAddProject = () => {
    if (!newProjTitle.trim() || !newProjSummary.trim()) return;
    const item: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: newProjTitle.trim(),
      summary: newProjSummary.trim(),
      techStack: newProjStack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    setDraft((prev) => ({
      ...prev,
      projects: [...prev.projects, item],
    }));
    setNewProjTitle('');
    setNewProjSummary('');
    setNewProjStack('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(null);
    await onSaveProfile(draft);
    setSavedNotice(
      'Profile saved and multi-agent roadmap adapted to your latest skills and career target.',
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Learner Record · Skills &amp; Career Goals
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Learner Profile &amp; Career Target
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Updating your existing skills or switching your target career
            automatically triggers Skill Analyst and Curriculum Architect
            re-planning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onResetDemo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset Demo Scenario
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>{saving ? 'Adapting Roadmap...' : 'Save & Re-Analyze'}</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300"
        >
          {savedNotice}
        </div>
      )}

      {/* Appearance & Display Theme Setting */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Appearance &amp; Display Theme
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Personalize your workspace palette. Choose between clean Light mode, focused Dark mode, or automatic System matching.
            </p>
          </div>
          <ThemeToggle showLabels size="md" />
        </div>
      </section>

      {/* Identity & Career Goal */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
          Learner Identity &amp; Target Career
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="profile-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <label
              htmlFor="profile-org"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              University or Organization
            </label>
            <input
              id="profile-org"
              type="text"
              value={draft.organization}
              onChange={(e) =>
                setDraft({ ...draft, organization: e.target.value })
              }
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <label
              htmlFor="profile-headline"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Current Role / Academic Standing
            </label>
            <input
              id="profile-headline"
              type="text"
              value={draft.headline}
              onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="profile-career"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Target Career Goal
              </label>
              <select
                id="profile-career"
                value={draft.targetCareerId}
                onChange={(e) =>
                  setDraft({ ...draft, targetCareerId: e.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="profile-hours"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Weekly Study Hours ({draft.weeklyHoursAvailable} hrs)
              </label>
              <input
                id="profile-hours"
                type="number"
                min={2}
                max={50}
                value={draft.weeklyHoursAvailable}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    weeklyHoursAvailable: Number(e.target.value) || 10,
                  })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Existing Skills */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Existing Skills &amp; Proficiency
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Adjust proficiency levels or add new skills you already have.
          </p>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {draft.skills.map((skill) => (
            <div
              key={skill.name}
              className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {skill.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    · {skill.levelLabel}
                    {skill.verified ? ' · Verified' : ''}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{skill.source}</div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`skill-range-${skill.name}`}
                    className="sr-only"
                  >
                    {skill.name} proficiency percentage
                  </label>
                  <input
                    id={`skill-range-${skill.name}`}
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={skill.proficiency}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDraft((prev) => ({
                        ...prev,
                        skills: prev.skills.map((s) =>
                          s.name === skill.name
                            ? {
                                ...s,
                                proficiency: val,
                                levelLabel: proficiencyToLabel(val),
                              }
                            : s,
                        ),
                      }));
                    }}
                    className="w-32 accent-blue-700"
                  />
                  <span className="w-11 text-right font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {skill.proficiency}%
                  </span>
                </div>

                <button
                  type="button"
                  aria-label={`Remove ${skill.name}`}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      skills: prev.skills.filter((s) => s.name !== skill.name),
                    }))
                  }
                  className="rounded-md p-1.5 text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex-1 min-w-[180px]">
            <label
              htmlFor="new-skill-name"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Add Skill (e.g., JavaScript, React, Docker)
            </label>
            <input
              id="new-skill-name"
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Skill name"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="new-skill-prof"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Proficiency ({newSkillProf}%)
            </label>
            <input
              id="new-skill-prof"
              type="range"
              min={15}
              max={100}
              step={5}
              value={newSkillProf}
              onChange={(e) => setNewSkillProf(Number(e.target.value))}
              className="mt-2.5 w-32 accent-blue-700"
            />
          </div>
          <button
            type="button"
            onClick={handleAddSkill}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Skill
          </button>
        </div>
      </section>

      {/* Certifications & Projects */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Certifications
          </h2>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {draft.certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {cert.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {cert.issuer} · {cert.year}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Delete certification ${cert.title}`}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      certifications: prev.certifications.filter(
                        (c) => c.id !== cert.id,
                      ),
                    }))
                  }
                  className="rounded-md p-1 text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 sm:grid-cols-3">
            <input
              type="text"
              aria-label="Certification title"
              placeholder="Certification title"
              value={newCertTitle}
              onChange={(e) => setNewCertTitle(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 sm:col-span-2"
            />
            <input
              type="text"
              aria-label="Certification year"
              placeholder="Year"
              value={newCertYear}
              onChange={(e) => setNewCertYear(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            />
            <input
              type="text"
              aria-label="Certification issuer"
              placeholder="Issuing organization"
              value={newCertIssuer}
              onChange={(e) => setNewCertIssuer(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 sm:col-span-2"
            />
            <button
              type="button"
              onClick={handleAddCert}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Completed Projects
          </h2>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {draft.projects.map((proj) => (
              <div
                key={proj.id}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {proj.title}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{proj.summary}</p>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Stack: {proj.techStack.join(' · ') || 'General'}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Delete project ${proj.title}`}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      projects: prev.projects.filter((p) => p.id !== proj.id),
                    }))
                  }
                  className="rounded-md p-1 text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <input
                type="text"
                aria-label="Project title"
                placeholder="Project title"
                value={newProjTitle}
                onChange={(e) => setNewProjTitle(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                aria-label="Project tech stack"
                placeholder="Stack (comma separated)"
                value={newProjStack}
                onChange={(e) => setNewProjStack(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                aria-label="Project summary"
                placeholder="Brief summary of what you built"
                value={newProjSummary}
                onChange={(e) => setNewProjSummary(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleAddProject}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add Project
              </button>
            </div>
          </div>
        </section>
      </div>
    </form>
  );
}
