import {
  CAREER_ROLES,
  QUIZ_BANK,
  SKILL_MODULE_CATALOG,
} from '../shared/careerCatalog.ts';
import type {
  AdaptiveRecommendation,
  AssessmentRecord,
  CareerRole,
  LearnerProfile,
  LearnerSkill,
  LearningModule,
  QuizQuestion,
  SkillAnalysisResult,
  SkillGapItem,
  SkillLevelLabel,
} from '../shared/types.ts';

export function getRoleById(roleId: string, customRoles: CareerRole[] = CAREER_ROLES): CareerRole {
  return customRoles.find((r) => r.id === roleId) ?? customRoles[0] ?? CAREER_ROLES[0];
}

export function proficiencyToLabel(proficiency: number): SkillLevelLabel {
  if (proficiency >= 75) return 'Advanced';
  if (proficiency >= 45) return 'Intermediate';
  return 'Beginner';
}

export function normalizeSkillName(name: string): string {
  const lower = name.trim().toLowerCase();
  if (lower === 'html' || lower === 'css' || lower === 'basic html' || lower === 'html/css') {
    return 'html & css';
  }
  if (lower === 'js' || lower === 'typescript/javascript') {
    return 'javascript';
  }
  if (lower === 'node' || lower === 'nodejs' || lower === 'express') {
    return 'node.js';
  }
  if (lower === 'git' || lower === 'testing') {
    return 'git & testing';
  }
  return lower;
}

export function findLearnerSkill(
  skills: LearnerSkill[],
  targetSkillName: string,
): LearnerSkill | undefined {
  const normalizedTarget = normalizeSkillName(targetSkillName);
  return skills.find((s) => normalizeSkillName(s.name) === normalizedTarget);
}

export function analyzeSkillGaps(
  profile: LearnerProfile,
  role: CareerRole,
): SkillAnalysisResult {
  const items: SkillGapItem[] = role.requiredSkills.map((req) => {
    const existing = findLearnerSkill(profile.skills, req.name);
    const currentLevel = existing ? Math.max(0, Math.min(100, existing.proficiency)) : 0;
    const gapPoints = Math.max(0, req.requiredLevel - currentLevel);

    let status: SkillGapItem['status'];
    if (currentLevel >= req.requiredLevel) {
      status = 'strong';
    } else if (currentLevel > 0) {
      status = 'developing';
    } else {
      status = 'missing';
    }

    let rationale = '';
    if (status === 'strong') {
      rationale = `Meets the ${req.requiredLevel}% benchmark for ${role.title} (${currentLevel}% current).`;
    } else if (status === 'developing') {
      rationale = `Partial foundation at ${currentLevel}%; needs +${gapPoints}% to reach the ${req.requiredLevel}% role target.`;
    } else {
      rationale = `No recorded proficiency yet; required at ${req.requiredLevel}% (${req.priority} competency).`;
    }

    return {
      skillName: req.name,
      category: req.category,
      priority: req.priority,
      currentLevel,
      requiredLevel: req.requiredLevel,
      gapPoints,
      status,
      rationale,
    };
  });

  const statusWeight: Record<SkillGapItem['status'], number> = {
    missing: 0,
    developing: 1,
    strong: 2,
  };
  const priorityWeight: Record<SkillGapItem['priority'], number> = {
    Core: 0,
    Important: 1,
    Supporting: 2,
  };

  items.sort((a, b) => {
    if (statusWeight[a.status] !== statusWeight[b.status]) {
      return statusWeight[a.status] - statusWeight[b.status];
    }
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[a.priority] - priorityWeight[b.priority];
    }
    return b.gapPoints - a.gapPoints;
  });

  let weightedEarned = 0;
  let weightedTotal = 0;
  for (const item of items) {
    const w = item.priority === 'Core' ? 1.5 : item.priority === 'Important' ? 1.2 : 1.0;
    const ratio = Math.min(1, item.currentLevel / Math.max(1, item.requiredLevel));
    weightedEarned += ratio * w;
    weightedTotal += w;
  }

  const readinessScore =
    weightedTotal > 0 ? Math.round((weightedEarned / weightedTotal) * 100) : 0;

  const strongCount = items.filter((i) => i.status === 'strong').length;
  const developingCount = items.filter((i) => i.status === 'developing').length;
  const missingCount = items.filter((i) => i.status === 'missing').length;

  const missingNames = items.filter((i) => i.status === 'missing').map((i) => i.skillName);
  const strongNames = items.filter((i) => i.status === 'strong').map((i) => i.skillName);

  const analystSummary =
    missingNames.length > 0
      ? `${profile.name} brings solid foundations in ${
          strongNames.length > 0 ? strongNames.join(', ') : 'core computing'
        }, with ${missingNames.length} critical missing skill${
          missingNames.length > 1 ? 's' : ''
        } (${missingNames.join(', ')}) prioritized for ${role.title} readiness.`
      : `${profile.name} meets or is actively developing all core competencies for ${role.title}. Focus on applied capstone integration.`;

  return {
    targetRoleId: role.id,
    targetRoleTitle: role.title,
    readinessScore,
    strongCount,
    developingCount,
    missingCount,
    items,
    analystSummary,
  };
}

export function buildAdaptiveRoadmap(
  profile: LearnerProfile,
  role: CareerRole,
  existingRoadmap: LearningModule[] = [],
): LearningModule[] {
  const analysis = analyzeSkillGaps(profile, role);
  const existingMap = new Map(existingRoadmap.map((m) => [m.id, m]));
  const modules: LearningModule[] = [];

  const roleSkillSet = new Set(role.requiredSkills.map((r) => normalizeSkillName(r.name)));
  for (const existing of existingRoadmap) {
    if (
      existing.isRemedial &&
      roleSkillSet.has(normalizeSkillName(existing.skillTarget))
    ) {
      modules.push(existing);
    }
  }

  for (const item of analysis.items) {
    if (item.status === 'strong') {
      continue;
    }

    const template = SKILL_MODULE_CATALOG[item.skillName];
    if (template) {
      const prior = existingMap.get(template.id);
      modules.push({
        ...template,
        status: prior?.status ?? 'not_started',
        progressPercent: prior?.progressPercent ?? 0,
        adaptationReason:
          prior?.adaptationReason ??
          (item.status === 'missing'
            ? `Added to bridge missing ${item.priority.toLowerCase()} skill (${item.skillName}) for ${role.title}.`
            : `Targeted to lift ${item.skillName} from ${item.currentLevel}% to ${item.requiredLevel}%.`),
      });
    } else {
      const generatedId = `mod-${normalizeSkillName(item.skillName).replace(/[^a-z0-9]+/g, '-')}`;
      const prior = existingMap.get(generatedId);
      modules.push({
        id: generatedId,
        title: `${item.skillName} Applied Studio for ${role.title}`,
        skillTarget: item.skillName,
        phase: item.status === 'missing' ? 'Foundations' : 'Core Stack',
        format: 'Practical Exercise',
        provider: 'SkillPath Adaptive Track',
        estimatedHours: 12,
        difficulty: item.currentLevel < 40 ? 'Beginner' : 'Intermediate',
        status: prior?.status ?? 'not_started',
        progressPercent: prior?.progressPercent ?? 0,
        adaptationReason: `Personalized module created for ${item.skillName} gap (+${item.gapPoints}% needed).`,
        objectives: [
          `Establish practical fluency in ${item.skillName}`,
          `Complete a role-aligned project exercise targeting ${role.title} standards`,
        ],
        exercisePrompt: `Build a small, verified deliverable demonstrating ${item.skillName} in a ${role.title} workflow.`,
      });
    }
  }

  if (modules.length > 0) {
    const capstoneId = `mod-capstone-${role.id}`;
    const priorCap = existingMap.get(capstoneId);
    const focusSkills = analysis.items
      .filter((i) => i.status !== 'strong')
      .slice(0, 3)
      .map((i) => i.skillName);

    modules.push({
      id: capstoneId,
      title: `${role.title} End-to-End Integration Capstone`,
      skillTarget: focusSkills[0] ?? role.requiredSkills[0]?.name ?? 'Architecture',
      phase: 'Applied Systems',
      format: 'Capstone Project',
      provider: 'SkillPath Project Studio',
      estimatedHours: 16,
      difficulty: 'Advanced',
      status: priorCap?.status ?? 'not_started',
      progressPercent: priorCap?.progressPercent ?? 0,
      adaptationReason: `Synthesizes ${focusSkills.join(', ') || 'core stack'} into a portfolio-ready ${role.title} artifact.`,
      objectives: [
        `Combine newly learned skills with existing strengths (${profile.skills.map((s) => s.name).slice(0, 2).join(', ')})`,
        'Document architecture decisions and verify automated tests',
      ],
      exercisePrompt: `Ship a complete ${role.title} project connecting your strongest existing skills with ${focusSkills.join(' and ')}.`,
    });
  }

  return modules;
}

export function buildAdaptiveRecommendations(params: {
  profile: LearnerProfile;
  role: CareerRole;
  analysis: SkillAnalysisResult;
  roadmap: LearningModule[];
  assessments: AssessmentRecord[];
  roles?: CareerRole[];
}): AdaptiveRecommendation[] {
  const {
    profile,
    role,
    analysis,
    roadmap,
    assessments,
    roles = CAREER_ROLES,
  } = params;
  const recommendations: AdaptiveRecommendation[] = [];

  // 1. Urgent remedial sprint recommendations if any assessment failed
  const remedialMods = roadmap.filter((m) => m.isRemedial && m.status !== 'completed');
  for (const rem of remedialMods) {
    const failedRec = assessments.find(
      (a) => !a.passed && normalizeSkillName(a.skillName) === normalizeSkillName(rem.skillTarget),
    );
    recommendations.push({
      id: `rec-${rem.id}`,
      title: rem.title,
      type: 'Remedial Sprint',
      skillTarget: rem.skillTarget,
      priority: 'Urgent',
      triggerReason: failedRec
        ? `Triggered by ${failedRec.score}% diagnostic score in ${rem.skillTarget} (< 60% pass threshold).`
        : rem.adaptationReason ?? `Targeted recovery sprint for ${rem.skillTarget}.`,
      estimatedHours: rem.estimatedHours,
      expectedReadinessGain: 12,
      actionLabel: 'Open Recovery Sprint',
      actionTargetTab: 'roadmap',
    });
  }

  // 2. Highest-leverage missing/developing skill modules
  const activeCoreMods = roadmap
    .filter((m) => !m.isRemedial && m.status !== 'completed' && m.format !== 'Capstone Project')
    .slice(0, 2);

  for (const mod of activeCoreMods) {
    const gap = analysis.items.find(
      (i) => normalizeSkillName(i.skillName) === normalizeSkillName(mod.skillTarget),
    );
    const estGain = gap
      ? Math.max(5, Math.min(22, Math.round((gap.gapPoints / Math.max(1, analysis.items.length)) * 0.25)))
      : 8;

    recommendations.push({
      id: `rec-${mod.id}`,
      title: mod.title,
      type: mod.format === 'Practical Exercise' ? 'Practical Exercise' : 'Course',
      skillTarget: mod.skillTarget,
      priority: gap?.status === 'missing' && gap.priority === 'Core' ? 'High' : 'Recommended',
      triggerReason:
        mod.adaptationReason ??
        `Closes ${gap?.gapPoints ?? 40}% gap in ${mod.skillTarget} for ${role.title} (${profile.weeklyHoursAvailable} hrs/wk pace).`,
      estimatedHours: mod.estimatedHours,
      expectedReadinessGain: estGain,
      actionLabel: 'Start in Roadmap',
      actionTargetTab: 'roadmap',
    });
  }

  // 3. Unverified developing skill diagnostic check
  const unverifiedGap = analysis.items.find(
    (i) => i.status === 'developing' && !assessments.some((a) => normalizeSkillName(a.skillName) === normalizeSkillName(i.skillName)),
  );
  if (unverifiedGap) {
    recommendations.push({
      id: `rec-assess-${normalizeSkillName(unverifiedGap.skillName)}`,
      title: `Verify ${unverifiedGap.skillName} Baseline Diagnostic`,
      type: 'Practical Exercise',
      skillTarget: unverifiedGap.skillName,
      priority: 'Recommended',
      triggerReason: `You hold ${unverifiedGap.currentLevel}% in ${unverifiedGap.skillName}; verifying baseline unlocks targeted pacing.`,
      estimatedHours: 1,
      expectedReadinessGain: 6,
      actionLabel: 'Take Diagnostic',
      actionTargetTab: 'assessments',
    });
  }

  // 4. Market & Role Scout: best alternative career match pivot
  const alternateMatches = roles
    .filter((r) => r.id !== role.id)
    .map((candidate) => ({
      role: candidate,
      score: analyzeSkillGaps(profile, candidate).readinessScore,
    }))
    .sort((a, b) => b.score - a.score);

  const bestAlt = alternateMatches[0];
  if (bestAlt) {
    recommendations.push({
      id: `rec-pivot-${bestAlt.role.id}`,
      title: `Adjacent Career Match: ${bestAlt.role.title} (${bestAlt.score}% Fit)`,
      type: 'Career Pivot',
      skillTarget: bestAlt.role.title,
      priority: bestAlt.score > analysis.readinessScore ? 'High' : 'Recommended',
      triggerReason:
        bestAlt.score > analysis.readinessScore
          ? `Market & Role Scout detected ${bestAlt.score}% current readiness for ${bestAlt.role.title} (+${bestAlt.score - analysis.readinessScore}% higher than ${role.title}) using your existing strengths.`
          : `Strong secondary fit (${bestAlt.score}% readiness) leveraging your current ${profile.skills[0]?.name ?? 'core'} profile.`,
      estimatedHours: bestAlt.role.typicalTimelineWeeks * Math.min(10, profile.weeklyHoursAvailable),
      expectedReadinessGain: Math.max(0, bestAlt.score - analysis.readinessScore),
      actionLabel: `Switch to ${bestAlt.role.title}`,
      actionTargetTab: 'overview',
      targetRoleId: bestAlt.role.id,
    });
  }

  return recommendations;
}

export function createRemedialModule(
  skillName: string,
  score: number,
  roleTitle: string,
): LearningModule {
  const cleanSlug = normalizeSkillName(skillName).replace(/[^a-z0-9]+/g, '-');
  return {
    id: `remedial-${cleanSlug}`,
    title: `${skillName} Foundations Recovery Sprint`,
    skillTarget: skillName,
    phase: 'Remedial Sprint',
    format: 'Practical Exercise',
    provider: 'AI Mentor Adaptive Lab',
    estimatedHours: 6,
    difficulty: 'Beginner',
    status: 'in_progress',
    progressPercent: 10,
    isRemedial: true,
    adaptationReason: `Triggered automatically after scoring ${score}% on the ${skillName} diagnostic for ${roleTitle}.`,
    objectives: [
      `Reinforce core mental models in ${skillName} before advancing`,
      'Complete 3 guided micro-drills with immediate verification',
      'Retake the diagnostic assessment to unlock 70%+ mastery',
    ],
    exercisePrompt: `Work through three step-by-step ${skillName} repair exercises focusing on the concepts missed in your recent assessment.`,
  };
}

export function applyAssessmentOutcome(params: {
  profile: LearnerProfile;
  roadmap: LearningModule[];
  skillName: string;
  moduleId?: string;
  answers: number[];
  questions: QuizQuestion[];
}): {
  updatedProfile: LearnerProfile;
  updatedRoadmap: LearningModule[];
  record: AssessmentRecord;
  remediationTriggered: boolean;
} {
  const { profile, roadmap, skillName, moduleId, answers, questions } = params;
  const role = getRoleById(profile.targetCareerId);
  const totalQuestions = Math.max(1, questions.length);
  let correctCount = 0;

  questions.forEach((q, idx) => {
    if (answers[idx] === q.correctIndex) {
      correctCount += 1;
    }
  });

  const score = Math.round((correctCount / totalQuestions) * 100);
  const passed = score >= 60;
  const normalizedTarget = normalizeSkillName(skillName);

  const existingSkill = findLearnerSkill(profile.skills, skillName);
  let nextSkills: LearnerSkill[];
  if (existingSkill) {
    const adjustedProficiency = passed
      ? Math.max(existingSkill.proficiency, Math.min(95, Math.round(existingSkill.proficiency * 0.4 + score * 0.65)))
      : Math.max(20, Math.min(existingSkill.proficiency, Math.round((existingSkill.proficiency + score) / 2)));

    nextSkills = profile.skills.map((s) =>
      normalizeSkillName(s.name) === normalizedTarget
        ? {
            ...s,
            proficiency: adjustedProficiency,
            levelLabel: proficiencyToLabel(adjustedProficiency),
            verified: passed,
            source: passed
              ? `Verified via ${skillName} Assessment (${score}%)`
              : `Needs reinforcement (${score}% assessment)`,
          }
        : s,
    );
  } else {
    const initialProficiency = passed ? Math.max(55, Math.round(score * 0.85)) : Math.max(18, Math.round(score * 0.6));
    nextSkills = [
      ...profile.skills,
      {
        name: skillName,
        proficiency: initialProficiency,
        levelLabel: proficiencyToLabel(initialProficiency),
        verified: passed,
        source: passed
          ? `Diagnostic Assessment (${score}%)`
          : `Diagnostic Baseline (${score}% — remedial assigned)`,
      },
    ];
  }

  const updatedProfile: LearnerProfile = {
    ...profile,
    skills: nextSkills,
  };

  let updatedRoadmap = roadmap.map((mod) => {
    const matchesModule =
      (moduleId && mod.id === moduleId) ||
      normalizeSkillName(mod.skillTarget) === normalizedTarget;

    if (!matchesModule) return mod;

    if (score >= 80) {
      return {
        ...mod,
        status: 'completed' as const,
        progressPercent: 100,
      };
    }
    if (passed) {
      return {
        ...mod,
        status: 'in_progress' as const,
        progressPercent: Math.max(mod.progressPercent, 65),
      };
    }
    return {
      ...mod,
      status: 'in_progress' as const,
      progressPercent: Math.max(mod.progressPercent, 20),
    };
  });

  let remediationTriggered = false;
  let triggeredRemediation: string | undefined;

  if (!passed) {
    remediationTriggered = true;
    const remedial = createRemedialModule(skillName, score, role.title);
    triggeredRemediation = remedial.title;
    const withoutDuplicateRemedial = updatedRoadmap.filter(
      (m) => m.id !== remedial.id,
    );
    updatedRoadmap = [remedial, ...withoutDuplicateRemedial];
  }

  const evaluatorFeedback = passed
    ? score >= 85
      ? `Strong mastery demonstrated in ${skillName} (${correctCount}/${totalQuestions}). Module marked complete and readiness increased.`
      : `Solid passing benchmark in ${skillName} (${correctCount}/${totalQuestions}). Continue hands-on exercises to reach full role mastery.`
    : `Score of ${score}% (${correctCount}/${totalQuestions}) indicates foundational gaps in ${skillName}. Added "${triggeredRemediation}" at the front of your roadmap.`;

  const record: AssessmentRecord = {
    id: `assess-${Date.now()}`,
    skillName,
    moduleId,
    score,
    correctCount,
    totalQuestions,
    passed,
    takenAt: new Date().toISOString(),
    evaluatorFeedback,
    triggeredRemediation,
  };

  return {
    updatedProfile,
    updatedRoadmap,
    record,
    remediationTriggered,
  };
}

export function getQuizForSkill(skillName: string): QuizQuestion[] {
  const direct = QUIZ_BANK[skillName];
  if (direct && direct.length > 0) {
    return direct;
  }

  const normalized = normalizeSkillName(skillName);
  const foundKey = Object.keys(QUIZ_BANK).find(
    (k) => normalizeSkillName(k) === normalized,
  );
  if (foundKey) {
    return QUIZ_BANK[foundKey];
  }

  return [
    {
      id: `${normalized}-gen-1`,
      skillName,
      prompt: `In a production ${skillName} workflow, what is the most reliable way to verify changes before deployment?`,
      options: [
        'Automated reproducible tests with deterministic fixtures and edge-case checks',
        'Manual spot-checking in production logs after release',
        'Skipping validation when schemas appear unchanged',
        'Hardcoding sample credentials directly into source files',
      ],
      correctIndex: 0,
      explanation: `Automated deterministic verification ensures ${skillName} changes remain safe and repeatable.`,
    },
    {
      id: `${normalized}-gen-2`,
      skillName,
      prompt: `When troubleshooting a bottleneck in ${skillName}, which approach isolates the root cause fastest?`,
      options: [
        'Rewrite the entire system from scratch before measuring',
        'Measure latency/throughput metrics first, then profile the slowest stage',
        'Increase hardware memory limits without inspecting execution plans',
        'Disable error logging to reduce disk writes',
      ],
      correctIndex: 1,
      explanation: 'Profiling and telemetry isolate true bottlenecks before optimization.',
    },
    {
      id: `${normalized}-gen-3`,
      skillName,
      prompt: `What distinguishes maintainable ${skillName} architecture in team environments?`,
      options: [
        'Clear module boundaries, explicit contracts, and documented failure handling',
        'Single monolithic scripts with implicit global state',
        'Avoiding version control for configuration changes',
        'Coupling UI rendering directly to raw storage internals',
      ],
      correctIndex: 0,
      explanation: 'Explicit interfaces and failure boundaries keep collaborative engineering velocity high.',
    },
  ];
}

export function calculateProgressMetrics(
  roadmap: LearningModule[],
  assessments: AssessmentRecord[],
  weeklyHours: number,
) {
  const totalModules = roadmap.length;
  const completedModules = roadmap.filter((m) => m.status === 'completed').length;
  const inProgressModules = roadmap.filter((m) => m.status === 'in_progress').length;
  const remainingHours = roadmap
    .filter((m) => m.status !== 'completed')
    .reduce((sum, m) => sum + Math.round(m.estimatedHours * (1 - m.progressPercent / 100)), 0);

  const estimatedWeeksLeft =
    weeklyHours > 0 ? Math.max(1, Math.ceil(remainingHours / weeklyHours)) : 0;

  const avgAssessmentScore =
    assessments.length > 0
      ? Math.round(
          assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length,
        )
      : null;

  return {
    totalModules,
    completedModules,
    inProgressModules,
    remainingHours,
    estimatedWeeksLeft,
    avgAssessmentScore,
  };
}
