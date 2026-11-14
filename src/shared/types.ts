export type SkillLevelLabel = 'Beginner' | 'Intermediate' | 'Advanced';
export type UserRole = 'student' | 'admin' | 'owner';

export interface UserAccount {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  organization: string;
  isPreview?: boolean;
  isGuest?: boolean;
}

export interface LearnerSkill {
  name: string;
  proficiency: number; // 0-100
  levelLabel: SkillLevelLabel;
  verified: boolean;
  source: string;
}

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  year: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  summary: string;
  techStack: string[];
}

export interface LearnerProfile {
  id: string;
  name: string;
  headline: string;
  organization: string;
  avatarUrl: string;
  weeklyHoursAvailable: number;
  targetCareerId: string;
  skills: LearnerSkill[];
  certifications: CertificationItem[];
  projects: ProjectItem[];
}

export interface RoleSkillRequirement {
  name: string;
  requiredLevel: number; // 0-100 target threshold
  priority: 'Core' | 'Important' | 'Supporting';
  category: string;
  description: string;
}

export interface CareerRole {
  id: string;
  title: string;
  domain: string;
  summary: string;
  typicalTimelineWeeks: number;
  requiredSkills: RoleSkillRequirement[];
}

export interface SkillGapItem {
  skillName: string;
  category: string;
  priority: 'Core' | 'Important' | 'Supporting';
  currentLevel: number;
  requiredLevel: number;
  gapPoints: number;
  status: 'strong' | 'developing' | 'missing';
  rationale: string;
}

export interface SkillAnalysisResult {
  targetRoleId: string;
  targetRoleTitle: string;
  readinessScore: number; // 0-100
  strongCount: number;
  developingCount: number;
  missingCount: number;
  items: SkillGapItem[];
  analystSummary: string;
}

export type ModulePhase = 'Foundations' | 'Core Stack' | 'Applied Systems' | 'Remedial Sprint';
export type ModuleFormat = 'Course' | 'Tutorial' | 'Practical Exercise' | 'Capstone Project';
export type ModuleStatus = 'not_started' | 'in_progress' | 'completed';

export interface LearningModule {
  id: string;
  title: string;
  skillTarget: string;
  phase: ModulePhase;
  format: ModuleFormat;
  provider: string;
  estimatedHours: number;
  difficulty: SkillLevelLabel;
  status: ModuleStatus;
  progressPercent: number;
  isRemedial?: boolean;
  adaptationReason?: string;
  objectives: string[];
  exercisePrompt: string;
}

export interface AdaptiveRecommendation {
  id: string;
  title: string;
  type: 'Remedial Sprint' | 'Course' | 'Practical Exercise' | 'Career Pivot';
  skillTarget: string;
  priority: 'Urgent' | 'High' | 'Recommended';
  triggerReason: string;
  estimatedHours: number;
  expectedReadinessGain: number;
  actionLabel: string;
  actionTargetTab: 'roadmap' | 'assessments' | 'overview';
  targetRoleId?: string;
}

export interface QuizQuestion {
  id: string;
  skillName: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AssessmentRecord {
  id: string;
  skillName: string;
  moduleId?: string;
  score: number; // 0-100
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  takenAt: string;
  evaluatorFeedback: string;
  triggeredRemediation?: string;
}

export type AgentName =
  | 'Skill Analyst'
  | 'Market & Role Scout'
  | 'Curriculum Architect'
  | 'Progress Evaluator'
  | 'AI Mentor';

export interface AgentTraceStep {
  id: string;
  agent: AgentName;
  trigger: string;
  action: string;
  finding: string;
  timestamp: string;
}

export interface MentorMessage {
  id: string;
  sender: 'learner' | 'mentor';
  content: string;
  timestamp: string;
  collaboratingAgents?: AgentName[];
  recommendedAction?: string;
}

export interface WorkspaceState {
  profile: LearnerProfile;
  analysis: SkillAnalysisResult;
  roadmap: LearningModule[];
  assessments: AssessmentRecord[];
  adaptiveRecommendations: AdaptiveRecommendation[];
  agentTrace: AgentTraceStep[];
  mentorHistory: MentorMessage[];
  lastAdaptedAt: string;
}

export interface CohortLearnerSummary {
  uid: string;
  name: string;
  organization: string;
  targetCareerId: string;
  targetRoleTitle: string;
  readinessScore: number;
  missingSkills: string[];
  assessmentsCount: number;
  avgScore: number | null;
  updatedAt: string;
}
