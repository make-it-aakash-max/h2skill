import type {
  AssessmentRecord,
  CareerRole,
  LearnerProfile,
  ModuleStatus,
  QuizQuestion,
  WorkspaceState,
} from '../shared/types.ts';

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const errBody = (await res.json()) as { error?: string };
      if (errBody?.error) message = errBody.error;
    } catch {
      // ignore json parse failure
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function fetchWorkspace(): Promise<{
  workspace: WorkspaceState;
  roles: CareerRole[];
}> {
  const res = await fetch('/api/workspace');
  return handleJson(res);
}

export async function updateProfile(
  profile: Partial<LearnerProfile>,
): Promise<{ workspace: WorkspaceState; usedLiveGemini?: boolean }> {
  const res = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  return handleJson(res);
}

export async function syncAgents(
  trigger?: string,
): Promise<{ workspace: WorkspaceState; usedLiveGemini?: boolean }> {
  const res = await fetch('/api/agents/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trigger }),
  });
  return handleJson(res);
}

export async function updateModuleProgress(
  moduleId: string,
  payload: { status?: ModuleStatus; progressPercent?: number },
): Promise<{ workspace: WorkspaceState }> {
  const res = await fetch(`/api/roadmap/${encodeURIComponent(moduleId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function fetchSkillQuiz(
  skillName: string,
): Promise<{ skillName: string; questions: QuizQuestion[] }> {
  const res = await fetch(`/api/assessments/${encodeURIComponent(skillName)}/quiz`);
  return handleJson(res);
}

export async function submitSkillQuiz(payload: {
  skillName: string;
  moduleId?: string;
  answers: number[];
}): Promise<{
  workspace: WorkspaceState;
  record: AssessmentRecord;
  remediationTriggered: boolean;
  questions: QuizQuestion[];
}> {
  const res = await fetch('/api/assessments/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function sendMentorQuestion(message: string): Promise<{
  workspace: WorkspaceState;
}> {
  const res = await fetch('/api/mentor/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return handleJson(res);
}

export async function resetWorkspace(): Promise<{
  workspace: WorkspaceState;
  roles: CareerRole[];
}> {
  const res = await fetch('/api/reset', {
    method: 'POST',
  });
  return handleJson(res);
}

export async function adaptStatelessWorkspace(payload: {
  trigger: string;
  profile: LearnerProfile;
  roadmap: WorkspaceState['roadmap'];
  assessments: AssessmentRecord[];
  roles?: CareerRole[];
}): Promise<{
  analysis: WorkspaceState['analysis'];
  roadmap: WorkspaceState['roadmap'];
  adaptiveRecommendations: WorkspaceState['adaptiveRecommendations'];
  traceSteps: WorkspaceState['agentTrace'];
  mentorNote: string;
}> {
  const res = await fetch('/api/agents/adapt-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function sendStatelessMentorQuestion(payload: {
  message: string;
  profile: LearnerProfile;
  roadmap: WorkspaceState['roadmap'];
  assessments: AssessmentRecord[];
  history: WorkspaceState['mentorHistory'];
  roles?: CareerRole[];
}): Promise<{
  reply: string;
  collaboratingAgents: WorkspaceState['agentTrace'][number]['agent'][];
  recommendedAction: string;
}> {
  const res = await fetch('/api/mentor/stateless-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

