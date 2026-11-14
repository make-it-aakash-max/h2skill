import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { CAREER_ROLES } from '../src/shared/careerCatalog.ts';
import type {
  AgentName,
  AgentTraceStep,
  AssessmentRecord,
  CareerRole,
  LearnerProfile,
  LearningModule,
  MentorMessage,
  SkillAnalysisResult,
} from '../src/shared/types.ts';
import { analyzeSkillGaps } from '../src/utils/skillEngine.ts';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Gemini request timed out after ${ms}ms`));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function makeStep(
  agent: AgentName,
  trigger: string,
  action: string,
  finding: string,
): AgentTraceStep {
  return {
    id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    agent,
    trigger,
    action,
    finding,
    timestamp: new Date().toISOString(),
  };
}

export async function runMultiAgentSync(params: {
  trigger: string;
  profile: LearnerProfile;
  role: CareerRole;
  analysis: SkillAnalysisResult;
  roadmap: LearningModule[];
  assessments: AssessmentRecord[];
}): Promise<{
  analystSummary: string;
  moduleReasons: Record<string, string>;
  mentorNote: string;
  traceSteps: AgentTraceStep[];
  usedLiveGemini: boolean;
}> {
  const { trigger, profile, role, analysis, roadmap, assessments } = params;
  const missing = analysis.items
    .filter((i) => i.status === 'missing')
    .map((i) => i.skillName);
  const developing = analysis.items
    .filter((i) => i.status === 'developing')
    .map((i) => `${i.skillName} (${i.currentLevel}%/${i.requiredLevel}%)`);
  const strong = analysis.items
    .filter((i) => i.status === 'strong')
    .map((i) => `${i.skillName} (${i.currentLevel}%)`);

  const altRoles = CAREER_ROLES.filter((r) => r.id !== role.id)
    .map((r) => ({
      title: r.title,
      score: analyzeSkillGaps(profile, r).readinessScore,
    }))
    .sort((a, b) => b.score - a.score);
  const topPivot = altRoles[0];

  const deterministicFallback = () => {
    const analystSummary =
      missing.length > 0
        ? `${profile.name} is ${analysis.readinessScore}% ready for ${role.title}. Strongest foundations in ${
            strong.length > 0 ? strong.join(', ') : 'core problem solving'
          }; priority skill gaps are ${missing.join(', ')}.`
        : `${profile.name} is ${analysis.readinessScore}% ready for ${role.title} with no completely missing competencies. Focus on raising developing skills to target mastery.`;

    const moduleReasons: Record<string, string> = {};
    for (const mod of roadmap) {
      if (mod.isRemedial) {
        moduleReasons[mod.id] =
          mod.adaptationReason ??
          `Remedial sprint inserted by Progress Evaluator to solidify ${mod.skillTarget} fundamentals.`;
      } else if (missing.includes(mod.skillTarget)) {
        moduleReasons[mod.id] =
          `Bridges missing ${mod.skillTarget} requirement for ${role.title}, building on your existing ${
            strong[0]?.split(' ')[0] ?? 'analytical'
          } fluency.`;
      } else {
        moduleReasons[mod.id] =
          mod.adaptationReason ??
          `Elevates ${mod.skillTarget} toward the ${role.title} production benchmark.`;
      }
    }

    const recentFail = assessments.find((a) => !a.passed);
    const scoutFinding = topPivot
      ? `Top adjacent career fit: ${topPivot.title} (${topPivot.score}% current readiness); ${role.title} remains primary track with ${missing.length} open gap${missing.length === 1 ? '' : 's'}.`
      : `${role.title} competencies benchmarked across ${role.requiredSkills.length} role criteria.`;

    const mentorNote = recentFail
      ? `Based on your ${recentFail.score}% result in ${recentFail.skillName}, our Progress Evaluator and Curriculum Architect placed a recovery sprint first. Complete the guided drills before retaking the diagnostic.`
      : missing.length > 0
        ? `Your ${strong.map((s) => s.split(' ')[0]).join(' and ') || 'existing'} background gives you a strong launchpad for ${role.title}. Start with "${
            roadmap[0]?.title ?? missing[0]
          }" this week (${profile.weeklyHoursAvailable} hrs/wk pace).`
        : `You have strong coverage across ${role.title} requirements. Focus on your integration capstone and verify remaining developing skills.`;

    const traceSteps: AgentTraceStep[] = [
      makeStep(
        'Skill Analyst',
        trigger,
        `Evaluated ${profile.skills.length} learner skills, ${profile.projects.length} projects, and ${profile.certifications.length} certifications against ${role.title}`,
        `Readiness ${analysis.readinessScore}% · Strong: ${strong.length} · Developing: ${developing.length} · Missing: ${missing.join(', ') || 'None'}`,
      ),
      makeStep(
        'Market & Role Scout',
        trigger,
        `Benchmarked ${role.title} role weights and evaluated ${altRoles.length} adjacent career tracks`,
        scoutFinding,
      ),
      makeStep(
        'Curriculum Architect',
        trigger,
        `Ordered ${roadmap.length} personalized modules across Foundations, Core Stack, and Applied Systems`,
        `Prioritized ${roadmap[0]?.skillTarget ?? role.title} (${roadmap[0]?.estimatedHours ?? 10}h) to close highest-impact gap first.`,
      ),
      makeStep(
        'Progress Evaluator',
        trigger,
        `Reviewed ${assessments.length} completed assessment${assessments.length === 1 ? '' : 's'} and module completion states`,
        recentFail
          ? `Flagged ${recentFail.skillName} (${recentFail.score}%) for remedial reinforcement.`
          : `No active assessment blockers; pacing calibrated for ${profile.weeklyHoursAvailable} hrs/week.`,
      ),
      makeStep(
        'AI Mentor',
        trigger,
        `Synthesized findings from all 4 peer agents into actionable coaching guidance`,
        mentorNote,
      ),
    ];

    return {
      analystSummary,
      moduleReasons,
      mentorNote,
      traceSteps,
      usedLiveGemini: false,
    };
  };

  const ai = getGeminiClient();
  if (!ai) {
    return deterministicFallback();
  }

  try {
    const prompt = `You are orchestrating 5 specialized collaborating AI agents in an adaptive career-learning platform.
Trigger event: ${trigger}
Learner: ${profile.name} (${profile.headline}), ${profile.weeklyHoursAvailable} hrs/week.
Existing skills: ${profile.skills.map((s) => `${s.name}: ${s.proficiency}% (${s.levelLabel})`).join(', ') || 'None'}
Certifications: ${profile.certifications.map((c) => c.title).join(', ') || 'None'}
Projects: ${profile.projects.map((p) => `${p.title} [${p.techStack.join(', ')}]`).join('; ') || 'None'}
Target Role: ${role.title} (${role.domain})
Computed Readiness: ${analysis.readinessScore}%
Adjacent Role Fit: ${topPivot ? `${topPivot.title} (${topPivot.score}%)` : 'None'}
Strong skills: ${strong.join(', ') || 'None'}
Developing skills: ${developing.join(', ') || 'None'}
Missing skills: ${missing.join(', ') || 'None'}
Recent Assessments: ${assessments.slice(0, 4).map((a) => `${a.skillName}: ${a.score}% (${a.passed ? 'passed' : 'needs remediation'})`).join('; ') || 'None yet'}
Planned Roadmap Module IDs and Titles: ${roadmap.map((m) => `${m.id}: ${m.title} [target: ${m.skillTarget}${m.isRemedial ? ', REMEDIAL' : ''}]`).join(' | ')}

Return concise, concrete outputs from all 5 collaborating agents:
1. analystSummary: 1-2 sentences from Skill Analyst summarizing strengths, gaps, and readiness for ${role.title}.
2. marketScoutFinding: 1 crisp sentence from Market & Role Scout evaluating role demand and adjacent career pivot fit (${topPivot?.title ?? role.title}).
3. moduleRationales: array of { moduleId, rationale } from Curriculum Architect (1 crisp sentence each explaining why this module fits this learner).
4. evaluatorFinding: 1 crisp sentence from Progress Evaluator assessing pacing/assessment readiness.
5. mentorGuidance: 2 concise sentences from AI Mentor giving direct coaching advice referencing their specific skills and first roadmap module.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analystSummary: { type: Type.STRING },
              marketScoutFinding: { type: Type.STRING },
              evaluatorFinding: { type: Type.STRING },
              mentorGuidance: { type: Type.STRING },
              moduleRationales: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    moduleId: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                  },
                  required: ['moduleId', 'rationale'],
                },
              },
            },
            required: [
              'analystSummary',
              'marketScoutFinding',
              'evaluatorFinding',
              'mentorGuidance',
              'moduleRationales',
            ],
          },
        },
      }),
      6000,
    );

    const parsed = JSON.parse((response.text ?? '{}').trim()) as {
      analystSummary?: string;
      marketScoutFinding?: string;
      evaluatorFinding?: string;
      mentorGuidance?: string;
      moduleRationales?: Array<{ moduleId: string; rationale: string }>;
    };

    const fallback = deterministicFallback();
    const moduleReasons = { ...fallback.moduleReasons };
    for (const item of parsed.moduleRationales ?? []) {
      if (item.moduleId && item.rationale) {
        moduleReasons[item.moduleId] = item.rationale;
      }
    }

    const analystSummary = parsed.analystSummary?.trim() || fallback.analystSummary;
    const marketScoutFinding =
      parsed.marketScoutFinding?.trim() || fallback.traceSteps[1].finding;
    const evaluatorFinding =
      parsed.evaluatorFinding?.trim() ||
      `Calibrated ${roadmap.length} modules to ${profile.weeklyHoursAvailable} hrs/week pace.`;
    const mentorNote = parsed.mentorGuidance?.trim() || fallback.mentorNote;

    const traceSteps: AgentTraceStep[] = [
      makeStep(
        'Skill Analyst',
        trigger,
        `Benchmarked ${profile.skills.length} skills & portfolio against ${role.title}`,
        analystSummary,
      ),
      makeStep(
        'Market & Role Scout',
        trigger,
        `Evaluated ${role.title} competency weights and ${altRoles.length} adjacent career tracks`,
        marketScoutFinding,
      ),
      makeStep(
        'Curriculum Architect',
        trigger,
        `Sequenced ${roadmap.length} personalized modules bridging ${missing.length} missing and ${developing.length} developing skills`,
        `Top priority: ${roadmap[0]?.title ?? 'Capstone Integration'}`,
      ),
      makeStep(
        'Progress Evaluator',
        trigger,
        `Audited ${assessments.length} diagnostic records and pacing capacity`,
        evaluatorFinding,
      ),
      makeStep(
        'AI Mentor',
        trigger,
        `Synthesized all 4 peer agents into personalized study guidance`,
        mentorNote,
      ),
    ];

    return {
      analystSummary,
      moduleReasons,
      mentorNote,
      traceSteps,
      usedLiveGemini: true,
    };
  } catch (err) {
    console.warn('Gemini 5-agent sync fallback triggered:', err);
    return deterministicFallback();
  }
}

export async function generateMentorReply(params: {
  question: string;
  profile: LearnerProfile;
  role: CareerRole;
  analysis: SkillAnalysisResult;
  roadmap: LearningModule[];
  assessments: AssessmentRecord[];
  history: MentorMessage[];
}): Promise<{
  reply: string;
  collaboratingAgents: AgentName[];
  recommendedAction: string;
}> {
  const { question, profile, role, analysis, roadmap, assessments, history } = params;
  const missing = analysis.items
    .filter((i) => i.status === 'missing')
    .map((i) => i.skillName);
  const nextModule = roadmap.find((m) => m.status !== 'completed') ?? roadmap[0];
  const latestAssessment = assessments[0];

  const fallbackReply = () => {
    const qLower = question.toLowerCase();
    let reply = '';
    let recommendedAction = nextModule
      ? `Open "${nextModule.title}" in Learning Roadmap`
      : 'Take a diagnostic assessment to verify your readiness';
    const collaboratingAgents: AgentName[] = ['AI Mentor', 'Skill Analyst'];

    if (qLower.includes('fail') || qLower.includes('score') || qLower.includes('quiz') || qLower.includes('test')) {
      collaboratingAgents.push('Progress Evaluator', 'Curriculum Architect');
      reply = latestAssessment
        ? `Your latest diagnostic in ${latestAssessment.skillName} scored ${latestAssessment.score}%. ${
            latestAssessment.passed
              ? 'You met the passing benchmark—focus on the hands-on exercise to solidify practical fluency.'
              : `Because that fell below 60%, our Progress Evaluator and Curriculum Architect inserted "${latestAssessment.triggeredRemediation}" at the top of your roadmap so you can rebuild core intuition before retaking.`
          }`
        : `You haven't submitted a diagnostic assessment yet. Taking a quick check on ${
            missing[0] ?? role.requiredSkills[0]?.name
          } will let our Progress Evaluator calibrate your exact starting difficulty.`;
      recommendedAction = latestAssessment && !latestAssessment.passed
        ? `Start ${latestAssessment.skillName} Foundations Recovery Sprint`
        : `Take ${missing[0] ?? role.requiredSkills[0]?.name} Diagnostic`;
    } else if (qLower.includes('career') || qLower.includes('role') || qLower.includes('pivot') || qLower.includes('match')) {
      collaboratingAgents.push('Market & Role Scout');
      const alt = CAREER_ROLES.filter((r) => r.id !== role.id)
        .map((r) => ({ title: r.title, score: analyzeSkillGaps(profile, r).readinessScore }))
        .sort((a, b) => b.score - a.score)[0];
      reply = `For your primary target (${role.title}), you are at ${analysis.readinessScore}% readiness. Our Market & Role Scout also notes ${
        alt ? `${alt.title} as your strongest adjacent match at ${alt.score}% fit` : 'strong overlap with core engineering roles'
      } based on your existing ${profile.skills.map((s) => s.name).slice(0, 3).join(', ')} background.`;
      recommendedAction = alt ? `Compare ${alt.title} fit in Overview` : 'Review Career Match Matrix';
    } else if (qLower.includes('next') || qLower.includes('start') || qLower.includes('learn') || qLower.includes('roadmap')) {
      collaboratingAgents.push('Curriculum Architect', 'Market & Role Scout');
      reply = nextModule
        ? `For ${role.title} (${analysis.readinessScore}% current readiness), your highest-leverage next step is "${nextModule.title}" (${nextModule.estimatedHours} hrs). ${
            missing.length > 0
              ? `Closing ${missing.slice(0, 2).join(' and ')} unlocks the largest jump in role match while leveraging your existing strength in ${
                  profile.skills[0]?.name ?? 'core engineering'
                }.`
              : 'Completing this module moves you directly toward capstone readiness.'
          }`
        : `You've completed every scheduled module for ${role.title}! Consider adding a new portfolio project or switching to a more senior target track.`;
    } else {
      collaboratingAgents.push('Market & Role Scout', 'Curriculum Architect', 'Progress Evaluator');
      reply = `Right now you are at ${analysis.readinessScore}% readiness for ${role.title}. Your strengths (${
        analysis.items.filter((i) => i.status === 'strong').map((i) => i.skillName).join(', ') || 'foundational coding'
      }) transfer well, while ${
        missing.length > 0 ? missing.join(', ') : 'deepening applied systems'
      } remain your top priority. At ${profile.weeklyHoursAvailable} hrs/week, focusing on "${
        nextModule?.title ?? 'your next hands-on exercise'
      }" keeps you on track.`;
    }

    return {
      reply,
      collaboratingAgents,
      recommendedAction,
    };
  };

  const ai = getGeminiClient();
  if (!ai) {
    return fallbackReply();
  }

  try {
    const recentChat = history
      .slice(-6)
      .map((m) => `${m.sender === 'learner' ? profile.name : 'AI Mentor'}: ${m.content}`)
      .join('\n');

    const prompt = `You are the AI Career Mentor collaborating with Skill Analyst, Market & Role Scout, Curriculum Architect, and Progress Evaluator.
Learner: ${profile.name} (${profile.headline}), ${profile.weeklyHoursAvailable} hrs/week
Target Role: ${role.title} (${analysis.readinessScore}% readiness)
Skills: ${profile.skills.map((s) => `${s.name} ${s.proficiency}%`).join(', ')}
Missing Skills: ${missing.join(', ') || 'None'}
Next Roadmap Module: ${nextModule ? `${nextModule.title} (${nextModule.format}, ${nextModule.estimatedHours}h)` : 'All completed'}
Latest Assessment: ${latestAssessment ? `${latestAssessment.skillName} ${latestAssessment.score}% (${latestAssessment.passed ? 'passed' : 'remediation active'})` : 'None'}

Recent conversation:
${recentChat}

Learner asks: "${question}"

Respond directly in 2-4 crisp, practical sentences. Reference their actual skills, gaps, or recent assessment. Also provide a short 4-8 word recommendedAction and list which of the 5 agents contributed.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              recommendedAction: { type: Type.STRING },
              collaboratingAgents: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['reply', 'recommendedAction', 'collaboratingAgents'],
          },
        },
      }),
      6000,
    );

    const parsed = JSON.parse((response.text ?? '{}').trim()) as {
      reply?: string;
      recommendedAction?: string;
      collaboratingAgents?: string[];
    };

    const validAgents = new Set<AgentName>([
      'Skill Analyst',
      'Market & Role Scout',
      'Curriculum Architect',
      'Progress Evaluator',
      'AI Mentor',
    ]);
    const agents = (parsed.collaboratingAgents ?? ['AI Mentor', 'Skill Analyst'])
      .filter((a): a is AgentName => validAgents.has(a as AgentName));

    return {
      reply: parsed.reply?.trim() || fallbackReply().reply,
      recommendedAction: parsed.recommendedAction?.trim() || fallbackReply().recommendedAction,
      collaboratingAgents: agents.length > 0 ? agents : ['AI Mentor', 'Skill Analyst'],
    };
  } catch (err) {
    console.warn('Gemini mentor chat fallback triggered:', err);
    return fallbackReply();
  }
}
