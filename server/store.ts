import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_LEARNER_PROFILE } from '../src/shared/careerCatalog.ts';
import type { LearnerProfile, WorkspaceState } from '../src/shared/types.ts';
import {
  analyzeSkillGaps,
  buildAdaptiveRecommendations,
  buildAdaptiveRoadmap,
  getRoleById,
} from '../src/utils/skillEngine.ts';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'workspace.json');

export function createInitialWorkspace(
  customProfile?: LearnerProfile,
): WorkspaceState {
  const profile = customProfile ?? structuredClone(DEFAULT_LEARNER_PROFILE);
  const role = getRoleById(profile.targetCareerId);
  const analysis = analyzeSkillGaps(profile, role);
  const roadmap = buildAdaptiveRoadmap(profile, role);
  const adaptiveRecommendations = buildAdaptiveRecommendations({
    profile,
    role,
    analysis,
    roadmap,
    assessments: [],
  });
  const now = new Date().toISOString();

  return {
    profile,
    analysis,
    roadmap,
    assessments: [],
    adaptiveRecommendations,
    agentTrace: [
      {
        id: 'trace-init-1',
        agent: 'Skill Analyst',
        trigger: 'Initial Profile Diagnostic',
        action: `Evaluated ${profile.name}'s skills (Python 82%, SQL 68%, HTML & CSS 45%) against ${role.title} competencies.`,
        finding: `Identified strong backend/data roots in Python and SQL; flagged JavaScript, React, Node.js, and Git & Testing as primary gaps.`,
        timestamp: now,
      },
      {
        id: 'trace-init-2',
        agent: 'Market & Role Scout',
        trigger: 'Initial Profile Diagnostic',
        action: `Benchmarked ${role.title} competency weights and scanned adjacent career tracks.`,
        finding: `Full Stack Developer readiness at ${analysis.readinessScore}%; noted Data Engineer as highest adjacent pivot fit from Python & SQL strengths.`,
        timestamp: now,
      },
      {
        id: 'trace-init-3',
        agent: 'Curriculum Architect',
        trigger: 'Initial Profile Diagnostic',
        action: `Constructed a ${roadmap.length}-module adaptive path prioritizing missing Core skills before capstone integration.`,
        finding: `Skipped introductory Python courses to save ~14 hours and opened with Modern JavaScript.`,
        timestamp: now,
      },
      {
        id: 'trace-init-4',
        agent: 'Progress Evaluator',
        trigger: 'Initial Profile Diagnostic',
        action: `Configured diagnostic readiness checkpoints across each missing and developing competency.`,
        finding: `Calibrated weekly pacing to ${profile.weeklyHoursAvailable} hours/week.`,
        timestamp: now,
      },
      {
        id: 'trace-init-5',
        agent: 'AI Mentor',
        trigger: 'Initial Profile Diagnostic',
        action: `Synthesized all 4 sibling agents into onboarding guidance linking Python/SQL background to JavaScript & Node.js concepts.`,
        finding: `Ready to adapt roadmap whenever career goals shift or assessments reveal weak spots.`,
        timestamp: now,
      },
    ],
    mentorHistory: [
      {
        id: 'msg-welcome',
        sender: 'mentor',
        content: `Welcome, ${profile.name}. Your Python (82%) and SQL (68%) foundations already cover key backend concepts for Full Stack Developer. Our 5 agents prioritized JavaScript, React, and Node.js first on your roadmap—start with Modern JavaScript or run a diagnostic quiz to verify your baseline.`,
        timestamp: now,
        collaboratingAgents: [
          'Skill Analyst',
          'Market & Role Scout',
          'Curriculum Architect',
          'Progress Evaluator',
          'AI Mentor',
        ],
        recommendedAction: 'Start Modern JavaScript or run a baseline diagnostic',
      },
    ],
    lastAdaptedAt: now,
  };
}

export function loadWorkspace(): WorkspaceState {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as WorkspaceState;
      if (parsed && parsed.profile && parsed.analysis && parsed.roadmap) {
        if (!Array.isArray(parsed.adaptiveRecommendations)) {
          const role = getRoleById(parsed.profile.targetCareerId);
          parsed.adaptiveRecommendations = buildAdaptiveRecommendations({
            profile: parsed.profile,
            role,
            analysis: parsed.analysis,
            roadmap: parsed.roadmap,
            assessments: parsed.assessments ?? [],
          });
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load workspace store, reinitializing:', err);
  }
  const initial = createInitialWorkspace();
  saveWorkspace(initial);
  return initial;
}

export function saveWorkspace(state: WorkspaceState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist workspace:', err);
  }
}
