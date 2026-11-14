import { CAREER_ROLES, DEFAULT_LEARNER_PROFILE } from '../shared/careerCatalog.ts';
import type {
  CareerRole,
  LearnerProfile,
  UserAccount,
  UserRole,
  WorkspaceState,
} from '../shared/types.ts';
import {
  analyzeSkillGaps,
  buildAdaptiveRecommendations,
  buildAdaptiveRoadmap,
  getRoleById,
} from './skillEngine.ts';

export type GuestPreset = 'demo' | 'fresh';

export interface GuestSessionConfig {
  guestName: string;
  targetCareerId: string;
  role: UserRole;
  preset: GuestPreset;
  weeklyHours?: number;
}

export interface PersistedGuestSession {
  account: UserAccount;
  workspace: WorkspaceState;
  preset: GuestPreset;
  createdAt: string;
}

export const GUEST_STORAGE_KEY = 'skillpath_guest_session_v1';

export function buildGuestSession(
  config: GuestSessionConfig,
  roles: CareerRole[] = CAREER_ROLES,
): PersistedGuestSession {
  const cleanName = config.guestName.trim() || 'Guest Learner';
  const targetRole = getRoleById(config.targetCareerId || 'full-stack-dev', roles);
  const weeklyHours = Math.max(2, Math.min(50, config.weeklyHours ?? 10));

  let profile: LearnerProfile;
  if (config.preset === 'demo') {
    profile = {
      ...structuredClone(DEFAULT_LEARNER_PROFILE),
      id: `guest-${config.role}`,
      name: cleanName === 'Guest Learner' ? DEFAULT_LEARNER_PROFILE.name : cleanName,
      targetCareerId: targetRole.id,
      weeklyHoursAvailable: weeklyHours,
    };
  } else {
    profile = {
      id: `guest-${config.role}-${Date.now()}`,
      name: cleanName,
      headline: `Guest Explorer · Targeting ${targetRole.title}`,
      organization: 'Guest Sandbox',
      avatarUrl: '',
      weeklyHoursAvailable: weeklyHours,
      targetCareerId: targetRole.id,
      skills: [
        {
          name: targetRole.requiredSkills[targetRole.requiredSkills.length - 1]?.name || 'Python',
          proficiency: 55,
          levelLabel: 'Intermediate',
          verified: false,
          source: 'Guest onboarding starter skill',
        },
      ],
      certifications: [],
      projects: [],
    };
  }

  const analysis = analyzeSkillGaps(profile, targetRole);
  const roadmap = buildAdaptiveRoadmap(profile, targetRole);
  const adaptiveRecommendations = buildAdaptiveRecommendations({
    profile,
    role: targetRole,
    analysis,
    roadmap,
    assessments: [],
    roles,
  });

  const now = new Date().toISOString();
  const displayName =
    config.role === 'owner'
      ? `${cleanName} (Owner Guest)`
      : config.role === 'admin'
        ? `${cleanName} (Admin Guest)`
        : cleanName;

  const account: UserAccount = {
    uid: `guest-${config.role}`,
    displayName,
    email: '',
    role: config.role,
    organization: profile.organization,
    isPreview: true,
    isGuest: true,
  };

  const workspace: WorkspaceState = {
    profile,
    analysis,
    roadmap,
    assessments: [],
    adaptiveRecommendations,
    agentTrace: [
      {
        id: `guest-trace-1-${Date.now()}`,
        agent: 'Skill Analyst',
        trigger: `Guest Session Started (${config.preset === 'demo' ? 'CS Demo' : 'Fresh Track'})`,
        action: `Evaluated ${profile.name}'s baseline skills against ${targetRole.title} requirements.`,
        finding: `${analysis.readinessScore}% readiness with ${analysis.missingCount} open competency gaps.`,
        timestamp: now,
      },
      {
        id: `guest-trace-2-${Date.now()}`,
        agent: 'Market & Role Scout',
        trigger: 'Guest Session Started',
        action: `Scanned ${roles.length} benchmarked career roles for adjacent skill fit.`,
        finding: `Mapped highest-value next skills for ${targetRole.title}.`,
        timestamp: now,
      },
      {
        id: `guest-trace-3-${Date.now()}`,
        agent: 'Curriculum Architect',
        trigger: 'Guest Session Started',
        action: `Sequenced ${roadmap.length} personalized modules at ${profile.weeklyHoursAvailable} hrs/week.`,
        finding: `Prioritized ${roadmap[0]?.skillTarget ?? 'core competencies'} first.`,
        timestamp: now,
      },
      {
        id: `guest-trace-4-${Date.now()}`,
        agent: 'Progress Evaluator',
        trigger: 'Guest Session Started',
        action: 'Enabled adaptive diagnostic quizzes with automatic <60% remediation.',
        finding: 'Progress is saved locally in your browser during Guest Mode.',
        timestamp: now,
      },
      {
        id: `guest-trace-5-${Date.now()}`,
        agent: 'AI Mentor',
        trigger: 'Guest Session Started',
        action: 'Synthesized starter coaching brief from all peer agents.',
        finding: `Ready to coach ${profile.name} toward ${targetRole.title}.`,
        timestamp: now,
      },
    ],
    mentorHistory: [
      {
        id: `guest-welcome-${Date.now()}`,
        sender: 'mentor',
        content: `Welcome to Guest Mode, ${profile.name}. You are exploring ${targetRole.title} (${analysis.readinessScore}% current readiness). Customize your skills in Learner Profile, take diagnostics, or sign in with Google anytime to sync to the cloud.`,
        timestamp: now,
        collaboratingAgents: [
          'Skill Analyst',
          'Market & Role Scout',
          'Curriculum Architect',
          'Progress Evaluator',
          'AI Mentor',
        ],
        recommendedAction: roadmap[0]
          ? `Start "${roadmap[0].title}" or customize your skills`
          : 'Explore your competency matrix',
      },
    ],
    lastAdaptedAt: now,
  };

  return {
    account,
    workspace,
    preset: config.preset,
    createdAt: now,
  };
}

export function serializeGuestSession(session: PersistedGuestSession): string {
  return JSON.stringify(session);
}

export function deserializeGuestSession(raw: string | null): PersistedGuestSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedGuestSession>;
    if (
      !parsed ||
      !parsed.account ||
      !parsed.workspace ||
      !parsed.workspace.profile ||
      !Array.isArray(parsed.workspace.roadmap)
    ) {
      return null;
    }
    return parsed as PersistedGuestSession;
  } catch {
    return null;
  }
}
