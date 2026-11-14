import test from 'node:test';
import assert from 'node:assert/strict';
import { CAREER_ROLES, DEFAULT_LEARNER_PROFILE } from '../shared/careerCatalog.ts';
import {
  analyzeSkillGaps,
  applyAssessmentOutcome,
  buildAdaptiveRecommendations,
  buildAdaptiveRoadmap,
  calculateProgressMetrics,
  getQuizForSkill,
  getRoleById,
} from './skillEngine.ts';

test('Full Stack Developer gap analysis identifies Python/SQL strengths and JavaScript/React/Node.js missing skills', () => {
  const role = getRoleById('full-stack-dev');
  const analysis = analyzeSkillGaps(DEFAULT_LEARNER_PROFILE, role);

  assert.equal(analysis.targetRoleTitle, 'Full Stack Developer');
  const jsItem = analysis.items.find((i) => i.skillName === 'JavaScript');
  const reactItem = analysis.items.find((i) => i.skillName === 'React');
  const nodeItem = analysis.items.find((i) => i.skillName === 'Node.js');
  const pythonItem = analysis.items.find((i) => i.skillName === 'Python');

  assert.equal(jsItem?.status, 'missing');
  assert.equal(reactItem?.status, 'missing');
  assert.equal(nodeItem?.status, 'missing');
  assert.equal(pythonItem?.status, 'strong');
  assert.ok(analysis.readinessScore > 0 && analysis.readinessScore < 65);
});

test('Adaptive roadmap skips mastered skills and prioritizes missing Core competencies', () => {
  const role = getRoleById('full-stack-dev');
  const roadmap = buildAdaptiveRoadmap(DEFAULT_LEARNER_PROFILE, role);

  const targets = roadmap.map((m) => m.skillTarget);
  assert.ok(targets.includes('JavaScript'));
  assert.ok(targets.includes('React'));
  assert.ok(targets.includes('Node.js'));
  const nonCapstonePython = roadmap.filter(
    (m) => m.skillTarget === 'Python' && m.format !== 'Capstone Project',
  );
  assert.equal(nonCapstonePython.length, 0);
});

test('Poor assessment score (<60%) injects a Remedial Sprint module and Urgent recommendation', () => {
  const role = getRoleById('full-stack-dev');
  const initialRoadmap = buildAdaptiveRoadmap(DEFAULT_LEARNER_PROFILE, role);
  const questions = getQuizForSkill('JavaScript');
  const wrongAnswers = questions.map((q) => (q.correctIndex + 1) % q.options.length);

  const result = applyAssessmentOutcome({
    profile: DEFAULT_LEARNER_PROFILE,
    roadmap: initialRoadmap,
    skillName: 'JavaScript',
    answers: wrongAnswers,
    questions,
  });

  assert.equal(result.remediationTriggered, true);
  assert.equal(result.record.passed, false);
  assert.equal(result.updatedRoadmap[0].isRemedial, true);

  const analysis = analyzeSkillGaps(result.updatedProfile, role);
  const recs = buildAdaptiveRecommendations({
    profile: result.updatedProfile,
    role,
    analysis,
    roadmap: result.updatedRoadmap,
    assessments: [result.record],
  });

  assert.equal(recs[0].priority, 'Urgent');
  assert.equal(recs[0].type, 'Remedial Sprint');
  assert.ok(recs.some((r) => r.type === 'Career Pivot'));
});

test('High assessment score (>=80%) marks target module completed and verifies skill', () => {
  const role = getRoleById('full-stack-dev');
  const initialRoadmap = buildAdaptiveRoadmap(DEFAULT_LEARNER_PROFILE, role);
  const questions = getQuizForSkill('JavaScript');
  const correctAnswers = questions.map((q) => q.correctIndex);

  const result = applyAssessmentOutcome({
    profile: DEFAULT_LEARNER_PROFILE,
    roadmap: initialRoadmap,
    skillName: 'JavaScript',
    answers: correctAnswers,
    questions,
  });

  assert.equal(result.remediationTriggered, false);
  assert.equal(result.record.passed, true);
  assert.equal(result.record.score, 100);
  const jsModule = result.updatedRoadmap.find(
    (m) => m.skillTarget === 'JavaScript' && m.format !== 'Capstone Project',
  );
  assert.equal(jsModule?.status, 'completed');
  const jsSkill = result.updatedProfile.skills.find((s) => s.name === 'JavaScript');
  assert.equal(jsSkill?.verified, true);
});

test('Switching career goal to Data Engineer recalculates gaps and Market Scout pivot options', () => {
  const dataRole = CAREER_ROLES.find((r) => r.id === 'data-engineer')!;
  const switchedProfile = {
    ...DEFAULT_LEARNER_PROFILE,
    targetCareerId: dataRole.id,
  };
  const analysis = analyzeSkillGaps(switchedProfile, dataRole);
  const roadmap = buildAdaptiveRoadmap(switchedProfile, dataRole);
  const recs = buildAdaptiveRecommendations({
    profile: switchedProfile,
    role: dataRole,
    analysis,
    roadmap,
    assessments: [],
  });

  const sparkGap = analysis.items.find((i) => i.skillName === 'Apache Spark');
  const etlGap = analysis.items.find((i) => i.skillName === 'ETL & Airflow');
  assert.equal(sparkGap?.status, 'missing');
  assert.equal(etlGap?.status, 'missing');
  assert.ok(roadmap.some((m) => m.skillTarget === 'ETL & Airflow'));
  assert.ok(recs.some((r) => r.type === 'Career Pivot' && r.targetRoleId !== 'data-engineer'));
});

test('calculateProgressMetrics computes remaining hours and estimated weeks accurately', () => {
  const role = getRoleById('full-stack-dev');
  const roadmap = buildAdaptiveRoadmap(DEFAULT_LEARNER_PROFILE, role);
  const metrics = calculateProgressMetrics(roadmap, [], 10);

  assert.ok(metrics.totalModules >= 5);
  assert.equal(metrics.completedModules, 0);
  assert.ok(metrics.remainingHours > 40);
  assert.equal(metrics.estimatedWeeksLeft, Math.ceil(metrics.remainingHours / 10));
});
