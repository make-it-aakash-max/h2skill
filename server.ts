import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { CAREER_ROLES } from './src/shared/careerCatalog.ts';
import type {
  AssessmentRecord,
  CareerRole,
  LearnerProfile,
  LearningModule,
  MentorMessage,
  ModuleStatus,
} from './src/shared/types.ts';
import {
  analyzeSkillGaps,
  applyAssessmentOutcome,
  buildAdaptiveRecommendations,
  buildAdaptiveRoadmap,
  getQuizForSkill,
  getRoleById,
} from './src/utils/skillEngine.ts';
import { generateMentorReply, runMultiAgentSync } from './server/agents.ts';
import {
  createInitialWorkspace,
  loadWorkspace,
  saveWorkspace,
} from './server/store.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  let workspace = loadWorkspace();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/workspace', (_req, res) => {
    res.json({
      workspace,
      roles: CAREER_ROLES,
    });
  });

  app.post('/api/reset', (_req, res) => {
    workspace = createInitialWorkspace();
    saveWorkspace(workspace);
    res.json({
      workspace,
      roles: CAREER_ROLES,
    });
  });

  // Stateless 5-agent adaptation endpoint for Firebase-authenticated learners
  app.post('/api/agents/adapt-state', async (req, res) => {
    try {
      const {
        trigger,
        profile,
        roadmap,
        assessments,
        roles,
      } = req.body as {
        trigger: string;
        profile: LearnerProfile;
        roadmap: LearningModule[];
        assessments: AssessmentRecord[];
        roles?: CareerRole[];
      };

      if (!profile || !profile.targetCareerId) {
        res.status(400).json({ error: 'Valid learner profile is required.' });
        return;
      }

      const activeRoles = Array.isArray(roles) && roles.length > 0 ? roles : CAREER_ROLES;
      const role = getRoleById(profile.targetCareerId, activeRoles);
      const analysis = analyzeSkillGaps(profile, role);
      const nextRoadmap = buildAdaptiveRoadmap(profile, role, roadmap ?? []);

      const agentSync = await runMultiAgentSync({
        trigger: trigger || '5-Agent Collaborative Sync',
        profile,
        role,
        analysis,
        roadmap: nextRoadmap,
        assessments: assessments ?? [],
      });

      const adaptedRoadmap = nextRoadmap.map((mod) => ({
        ...mod,
        adaptationReason: mod.isRemedial
          ? mod.adaptationReason
          : (agentSync.moduleReasons[mod.id] ?? mod.adaptationReason),
      }));

      const adaptiveRecommendations = buildAdaptiveRecommendations({
        profile,
        role,
        analysis,
        roadmap: adaptedRoadmap,
        assessments: assessments ?? [],
        roles: activeRoles,
      });

      res.json({
        analysis: {
          ...analysis,
          analystSummary: agentSync.analystSummary,
        },
        roadmap: adaptedRoadmap,
        adaptiveRecommendations,
        traceSteps: agentSync.traceSteps,
        mentorNote: agentSync.mentorNote,
        usedLiveGemini: agentSync.usedLiveGemini,
      });
    } catch (err) {
      console.error('Error in stateless 5-agent adapt:', err);
      res.status(500).json({ error: '5-agent adaptation failed.' });
    }
  });

  // Stateless mentor chat endpoint for Firebase-authenticated learners
  app.post('/api/mentor/stateless-chat', async (req, res) => {
    try {
      const {
        message,
        profile,
        roadmap,
        assessments,
        history,
        roles,
      } = req.body as {
        message: string;
        profile: LearnerProfile;
        roadmap: LearningModule[];
        assessments: AssessmentRecord[];
        history: MentorMessage[];
        roles?: CareerRole[];
      };

      if (!message || !message.trim() || !profile) {
        res.status(400).json({ error: 'Message and profile are required.' });
        return;
      }

      const activeRoles = Array.isArray(roles) && roles.length > 0 ? roles : CAREER_ROLES;
      const role = getRoleById(profile.targetCareerId, activeRoles);
      const analysis = analyzeSkillGaps(profile, role);

      const replyData = await generateMentorReply({
        question: message.trim(),
        profile,
        role,
        analysis,
        roadmap: roadmap ?? [],
        assessments: assessments ?? [],
        history: history ?? [],
      });

      res.json(replyData);
    } catch (err) {
      console.error('Error in stateless mentor chat:', err);
      res.status(500).json({ error: 'AI Mentor could not respond.' });
    }
  });

  app.put('/api/profile', async (req, res) => {
    try {
      const incoming = req.body as Partial<LearnerProfile>;
      if (!incoming || typeof incoming !== 'object') {
        res.status(400).json({ error: 'Invalid profile payload.' });
        return;
      }

      const prevRoleId = workspace.profile.targetCareerId;
      const updatedProfile: LearnerProfile = {
        ...workspace.profile,
        name:
          typeof incoming.name === 'string' && incoming.name.trim()
            ? incoming.name.trim()
            : workspace.profile.name,
        headline:
          typeof incoming.headline === 'string' && incoming.headline.trim()
            ? incoming.headline.trim()
            : workspace.profile.headline,
        organization:
          typeof incoming.organization === 'string' && incoming.organization.trim()
            ? incoming.organization.trim()
            : workspace.profile.organization,
        weeklyHoursAvailable:
          typeof incoming.weeklyHoursAvailable === 'number' &&
          incoming.weeklyHoursAvailable >= 1 &&
          incoming.weeklyHoursAvailable <= 60
            ? Math.round(incoming.weeklyHoursAvailable)
            : workspace.profile.weeklyHoursAvailable,
        targetCareerId:
          typeof incoming.targetCareerId === 'string' && incoming.targetCareerId.trim()
            ? incoming.targetCareerId.trim()
            : workspace.profile.targetCareerId,
        skills: Array.isArray(incoming.skills)
          ? incoming.skills
          : workspace.profile.skills,
        certifications: Array.isArray(incoming.certifications)
          ? incoming.certifications
          : workspace.profile.certifications,
        projects: Array.isArray(incoming.projects)
          ? incoming.projects
          : workspace.profile.projects,
      };

      const role = getRoleById(updatedProfile.targetCareerId);
      const roleChanged = prevRoleId !== updatedProfile.targetCareerId;
      const analysis = analyzeSkillGaps(updatedProfile, role);
      const roadmap = buildAdaptiveRoadmap(
        updatedProfile,
        role,
        roleChanged ? [] : workspace.roadmap,
      );

      const trigger = roleChanged
        ? `Career Goal Changed → ${role.title}`
        : 'Learner Profile & Skills Updated';

      const agentSync = await runMultiAgentSync({
        trigger,
        profile: updatedProfile,
        role,
        analysis,
        roadmap,
        assessments: workspace.assessments,
      });

      const adaptedRoadmap = roadmap.map((mod) => ({
        ...mod,
        adaptationReason: agentSync.moduleReasons[mod.id] ?? mod.adaptationReason,
      }));

      const adaptiveRecommendations = buildAdaptiveRecommendations({
        profile: updatedProfile,
        role,
        analysis,
        roadmap: adaptedRoadmap,
        assessments: workspace.assessments,
      });

      const mentorMessage = {
        id: `msg-${Date.now()}`,
        sender: 'mentor' as const,
        content: agentSync.mentorNote,
        timestamp: new Date().toISOString(),
        collaboratingAgents: [
          'Skill Analyst' as const,
          'Market & Role Scout' as const,
          'Curriculum Architect' as const,
          'Progress Evaluator' as const,
          'AI Mentor' as const,
        ],
        recommendedAction: adaptedRoadmap[0]
          ? `Review "${adaptedRoadmap[0].title}"`
          : undefined,
      };

      workspace = {
        ...workspace,
        profile: updatedProfile,
        analysis: {
          ...analysis,
          analystSummary: agentSync.analystSummary,
        },
        roadmap: adaptedRoadmap,
        adaptiveRecommendations,
        agentTrace: [...agentSync.traceSteps, ...workspace.agentTrace].slice(0, 40),
        mentorHistory: [...workspace.mentorHistory, mentorMessage].slice(-30),
        lastAdaptedAt: new Date().toISOString(),
      };

      saveWorkspace(workspace);
      res.json({ workspace, usedLiveGemini: agentSync.usedLiveGemini });
    } catch (err) {
      console.error('Error updating profile:', err);
      res.status(500).json({ error: 'Failed to update profile and adapt roadmap.' });
    }
  });

  app.post('/api/agents/sync', async (req, res) => {
    try {
      const trigger =
        typeof req.body?.trigger === 'string' && req.body.trigger.trim()
          ? req.body.trigger.trim()
          : 'Manual 5-Agent Collaboration Sync';
      const role = getRoleById(workspace.profile.targetCareerId);
      const analysis = analyzeSkillGaps(workspace.profile, role);
      const roadmap = buildAdaptiveRoadmap(
        workspace.profile,
        role,
        workspace.roadmap,
      );

      const agentSync = await runMultiAgentSync({
        trigger,
        profile: workspace.profile,
        role,
        analysis,
        roadmap,
        assessments: workspace.assessments,
      });

      const adaptedRoadmap = roadmap.map((mod) => ({
        ...mod,
        adaptationReason: agentSync.moduleReasons[mod.id] ?? mod.adaptationReason,
      }));

      const adaptiveRecommendations = buildAdaptiveRecommendations({
        profile: workspace.profile,
        role,
        analysis,
        roadmap: adaptedRoadmap,
        assessments: workspace.assessments,
      });

      workspace = {
        ...workspace,
        analysis: {
          ...analysis,
          analystSummary: agentSync.analystSummary,
        },
        roadmap: adaptedRoadmap,
        adaptiveRecommendations,
        agentTrace: [...agentSync.traceSteps, ...workspace.agentTrace].slice(0, 40),
        mentorHistory: [
          ...workspace.mentorHistory,
          {
            id: `msg-${Date.now()}`,
            sender: 'mentor' as const,
            content: agentSync.mentorNote,
            timestamp: new Date().toISOString(),
            collaboratingAgents: [
              'Skill Analyst' as const,
              'Market & Role Scout' as const,
              'Curriculum Architect' as const,
              'Progress Evaluator' as const,
              'AI Mentor' as const,
            ],
          },
        ].slice(-30),
        lastAdaptedAt: new Date().toISOString(),
      };

      saveWorkspace(workspace);
      res.json({ workspace, usedLiveGemini: agentSync.usedLiveGemini });
    } catch (err) {
      console.error('Error in multi-agent sync:', err);
      res.status(500).json({ error: 'Multi-agent synchronization failed.' });
    }
  });

  app.patch('/api/roadmap/:moduleId', (req, res) => {
    const { moduleId } = req.params;
    const { status, progressPercent } = req.body as {
      status?: ModuleStatus;
      progressPercent?: number;
    };

    const targetMod = workspace.roadmap.find((m) => m.id === moduleId);
    if (!targetMod) {
      res.status(404).json({ error: 'Learning module not found.' });
      return;
    }

    const nextStatus: ModuleStatus = status ?? targetMod.status;
    const nextProgress =
      typeof progressPercent === 'number'
        ? Math.max(0, Math.min(100, Math.round(progressPercent)))
        : nextStatus === 'completed'
          ? 100
          : nextStatus === 'in_progress'
            ? Math.max(targetMod.progressPercent, 40)
            : 0;

    const updatedRoadmap = workspace.roadmap.map((m) =>
      m.id === moduleId
        ? { ...m, status: nextStatus, progressPercent: nextProgress }
        : m,
    );

    let updatedProfile = workspace.profile;
    if (nextStatus === 'completed' && targetMod.status !== 'completed') {
      const existing = updatedProfile.skills.find(
        (s) => s.name.toLowerCase() === targetMod.skillTarget.toLowerCase(),
      );
      if (existing) {
        const lifted = Math.min(95, existing.proficiency + 15);
        updatedProfile = {
          ...updatedProfile,
          skills: updatedProfile.skills.map((s) =>
            s.name === existing.name
              ? {
                  ...s,
                  proficiency: lifted,
                  levelLabel:
                    lifted >= 75
                      ? 'Advanced'
                      : lifted >= 45
                        ? 'Intermediate'
                        : 'Beginner',
                  source: `Completed "${targetMod.title}"`,
                }
              : s,
          ),
        };
      } else {
        updatedProfile = {
          ...updatedProfile,
          skills: [
            ...updatedProfile.skills,
            {
              name: targetMod.skillTarget,
              proficiency: 55,
              levelLabel: 'Intermediate',
              verified: false,
              source: `Completed "${targetMod.title}"`,
            },
          ],
        };
      }
    }

    const role = getRoleById(updatedProfile.targetCareerId);
    const analysis = analyzeSkillGaps(updatedProfile, role);
    const adaptiveRecommendations = buildAdaptiveRecommendations({
      profile: updatedProfile,
      role,
      analysis,
      roadmap: updatedRoadmap,
      assessments: workspace.assessments,
    });

    const traceStep = {
      id: `trace-${Date.now()}`,
      agent: 'Progress Evaluator' as const,
      trigger: 'Module Progress Update',
      action: `Updated "${targetMod.title}" to ${nextStatus.replace('_', ' ')} (${nextProgress}%).`,
      finding:
        nextStatus === 'completed'
          ? `Readiness for ${role.title} updated to ${analysis.readinessScore}%.`
          : `Tracked active study progress in ${targetMod.skillTarget}.`,
      timestamp: new Date().toISOString(),
    };

    workspace = {
      ...workspace,
      profile: updatedProfile,
      analysis,
      roadmap: updatedRoadmap,
      adaptiveRecommendations,
      agentTrace: [traceStep, ...workspace.agentTrace].slice(0, 40),
      lastAdaptedAt: new Date().toISOString(),
    };

    saveWorkspace(workspace);
    res.json({ workspace });
  });

  app.get('/api/assessments/:skillName/quiz', (req, res) => {
    const skillName = decodeURIComponent(req.params.skillName);
    const questions = getQuizForSkill(skillName);
    res.json({ skillName, questions });
  });

  app.post('/api/assessments/submit', async (req, res) => {
    try {
      const { skillName, moduleId, answers } = req.body as {
        skillName: string;
        moduleId?: string;
        answers: number[];
      };

      if (!skillName || !Array.isArray(answers)) {
        res.status(400).json({ error: 'skillName and answers array are required.' });
        return;
      }

      const questions = getQuizForSkill(skillName);
      const outcome = applyAssessmentOutcome({
        profile: workspace.profile,
        roadmap: workspace.roadmap,
        skillName,
        moduleId,
        answers,
        questions,
      });

      const role = getRoleById(outcome.updatedProfile.targetCareerId);
      const analysis = analyzeSkillGaps(outcome.updatedProfile, role);
      const nextAssessments = [outcome.record, ...workspace.assessments];

      const trigger = outcome.remediationTriggered
        ? `Low Assessment Score (${outcome.record.score}%) in ${skillName}`
        : `Passed Assessment (${outcome.record.score}%) in ${skillName}`;

      const agentSync = await runMultiAgentSync({
        trigger,
        profile: outcome.updatedProfile,
        role,
        analysis,
        roadmap: outcome.updatedRoadmap,
        assessments: nextAssessments,
      });

      const adaptedRoadmap = outcome.updatedRoadmap.map((mod) => ({
        ...mod,
        adaptationReason:
          mod.isRemedial
            ? mod.adaptationReason
            : (agentSync.moduleReasons[mod.id] ?? mod.adaptationReason),
      }));

      const adaptiveRecommendations = buildAdaptiveRecommendations({
        profile: outcome.updatedProfile,
        role,
        analysis,
        roadmap: adaptedRoadmap,
        assessments: nextAssessments,
      });

      const mentorMsg = {
        id: `msg-${Date.now()}`,
        sender: 'mentor' as const,
        content: outcome.remediationTriggered
          ? `${outcome.record.evaluatorFeedback} ${agentSync.mentorNote}`
          : `Nice work scoring ${outcome.record.score}% on ${skillName}! ${agentSync.mentorNote}`,
        timestamp: new Date().toISOString(),
        collaboratingAgents: [
          'Progress Evaluator' as const,
          'Curriculum Architect' as const,
          'Market & Role Scout' as const,
          'AI Mentor' as const,
        ],
        recommendedAction: outcome.remediationTriggered
          ? `Complete ${skillName} Foundations Recovery Sprint`
          : 'Continue to next core module',
      };

      workspace = {
        ...workspace,
        profile: outcome.updatedProfile,
        analysis: {
          ...analysis,
          analystSummary: agentSync.analystSummary,
        },
        roadmap: adaptedRoadmap,
        assessments: nextAssessments,
        adaptiveRecommendations,
        agentTrace: [...agentSync.traceSteps, ...workspace.agentTrace].slice(0, 40),
        mentorHistory: [...workspace.mentorHistory, mentorMsg].slice(-30),
        lastAdaptedAt: new Date().toISOString(),
      };

      saveWorkspace(workspace);
      res.json({
        workspace,
        record: outcome.record,
        remediationTriggered: outcome.remediationTriggered,
        questions,
      });
    } catch (err) {
      console.error('Error submitting assessment:', err);
      res.status(500).json({ error: 'Failed to evaluate assessment.' });
    }
  });

  app.post('/api/mentor/chat', async (req, res) => {
    try {
      const { message } = req.body as { message: string };
      if (!message || !message.trim()) {
        res.status(400).json({ error: 'Message cannot be empty.' });
        return;
      }

      const learnerMsg = {
        id: `msg-${Date.now()}-user`,
        sender: 'learner' as const,
        content: message.trim(),
        timestamp: new Date().toISOString(),
      };

      const role = getRoleById(workspace.profile.targetCareerId);
      const replyData = await generateMentorReply({
        question: message.trim(),
        profile: workspace.profile,
        role,
        analysis: workspace.analysis,
        roadmap: workspace.roadmap,
        assessments: workspace.assessments,
        history: [...workspace.mentorHistory, learnerMsg],
      });

      const mentorMsg = {
        id: `msg-${Date.now()}-mentor`,
        sender: 'mentor' as const,
        content: replyData.reply,
        timestamp: new Date().toISOString(),
        collaboratingAgents: replyData.collaboratingAgents,
        recommendedAction: replyData.recommendedAction,
      };

      const traceStep = {
        id: `trace-${Date.now()}`,
        agent: 'AI Mentor' as const,
        trigger: 'Learner Coaching Query',
        action: `Consulted ${replyData.collaboratingAgents.join(', ')} to answer "${message.trim().slice(0, 48)}${message.trim().length > 48 ? '...' : ''}"`,
        finding: `Recommended next action: ${replyData.recommendedAction}`,
        timestamp: new Date().toISOString(),
      };

      workspace = {
        ...workspace,
        mentorHistory: [...workspace.mentorHistory, learnerMsg, mentorMsg].slice(-40),
        agentTrace: [traceStep, ...workspace.agentTrace].slice(0, 40),
      };

      saveWorkspace(workspace);
      res.json({ workspace, reply: mentorMsg });
    } catch (err) {
      console.error('Error in mentor chat:', err);
      res.status(500).json({ error: 'AI Mentor could not respond.' });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SkillPath server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
