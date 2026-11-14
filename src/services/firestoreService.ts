import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, PLATFORM_OWNER_EMAIL } from '../firebase.ts';
import { CAREER_ROLES, DEFAULT_LEARNER_PROFILE } from '../shared/careerCatalog.ts';
import type {
  CareerRole,
  CohortLearnerSummary,
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
} from '../utils/skillEngine.ts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: Array<{
      providerId?: string | null;
      email?: string | null;
    }>;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function buildStarterWorkspaceForUser(user: User): WorkspaceState {
  const displayName = (user.displayName || 'Maya Lin').slice(0, 120);
  const profile: LearnerProfile = {
    ...structuredClone(DEFAULT_LEARNER_PROFILE),
    id: user.uid,
    name: displayName,
    avatarUrl: user.photoURL || DEFAULT_LEARNER_PROFILE.avatarUrl,
  };
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
        id: `trace-init-1-${Date.now()}`,
        agent: 'Skill Analyst',
        trigger: 'Authenticated Profile Setup',
        action: `Evaluated ${profile.name}'s skills against ${role.title} competencies.`,
        finding: `Baseline readiness at ${analysis.readinessScore}%; identified JavaScript, React, Node.js, and Git & Testing as primary gaps.`,
        timestamp: now,
      },
      {
        id: `trace-init-2-${Date.now()}`,
        agent: 'Market & Role Scout',
        trigger: 'Authenticated Profile Setup',
        action: `Benchmarked ${role.title} market requirements and scanned adjacent tracks.`,
        finding: `Identified Data Engineer as highest adjacent career match from existing Python & SQL strengths.`,
        timestamp: now,
      },
      {
        id: `trace-init-3-${Date.now()}`,
        agent: 'Curriculum Architect',
        trigger: 'Authenticated Profile Setup',
        action: `Ordered ${roadmap.length} personalized modules skipping mastered Python basics.`,
        finding: `Prioritized Modern JavaScript first (${roadmap[0]?.estimatedHours ?? 14} hrs).`,
        timestamp: now,
      },
      {
        id: `trace-init-4-${Date.now()}`,
        agent: 'Progress Evaluator',
        trigger: 'Authenticated Profile Setup',
        action: `Armed adaptive diagnostic thresholds (60% pass benchmark).`,
        finding: `Calibrated study velocity to ${profile.weeklyHoursAvailable} hrs/week.`,
        timestamp: now,
      },
      {
        id: `trace-init-5-${Date.now()}`,
        agent: 'AI Mentor',
        trigger: 'Authenticated Profile Setup',
        action: `Synthesized peer agent outputs into personalized onboarding plan.`,
        finding: `Ready to coach and re-plan whenever goals or quiz results change.`,
        timestamp: now,
      },
    ],
    mentorHistory: [
      {
        id: `msg-welcome-${Date.now()}`,
        sender: 'mentor',
        content: `Welcome, ${profile.name}. Your workspace is synced to Firestore. Our 5 collaborating agents analyzed your baseline skills for Full Stack Developer and prioritized JavaScript, React, and Node.js first.`,
        timestamp: now,
        collaboratingAgents: [
          'Skill Analyst',
          'Market & Role Scout',
          'Curriculum Architect',
          'Progress Evaluator',
          'AI Mentor',
        ],
        recommendedAction: 'Review Adaptive Recommendations or take a diagnostic quiz',
      },
    ],
    lastAdaptedAt: now,
  };
}

export async function initializeAuthenticatedAccount(
  user: User,
): Promise<{ account: UserAccount; workspace: WorkspaceState }> {
  const uid = user.uid;
  const email = user.email || '';
  const isOwnerEmail =
    email.toLowerCase() === PLATFORM_OWNER_EMAIL && user.emailVerified;

  // 1. Check /admins/{uid}
  let hasAdminGrant = false;
  if (!isOwnerEmail) {
    const adminPath = `admins/${uid}`;
    try {
      const adminSnap = await getDoc(doc(db, 'admins', uid));
      hasAdminGrant = adminSnap.exists();
    } catch {
      hasAdminGrant = false;
    }
    void adminPath;
  }

  const resolvedRole: UserRole = isOwnerEmail
    ? 'owner'
    : hasAdminGrant
      ? 'admin'
      : 'student';

  // 2. Ensure /users/{uid} public profile exists
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);
  let organization = 'Pacific State University';
  let displayName = (user.displayName || 'Maya Lin').slice(0, 120);

  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid,
        displayName,
        role: isOwnerEmail ? 'owner' : 'student',
        organization,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const data = userSnap.data();
      organization = String(data.organization || organization);
      displayName = String(data.displayName || displayName);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  // 3. Ensure PII-isolated /users/{uid}/private/account exists
  const privatePath = `users/${uid}/private/account`;
  const privateRef = doc(db, 'users', uid, 'private', 'account');
  try {
    const privSnap = await getDoc(privateRef);
    if (!privSnap.exists() && email) {
      await setDoc(privateRef, {
        uid,
        email: email.slice(0, 200),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privatePath);
  }

  // 4. Ensure /learners/{uid} workspace exists
  const learnerPath = `learners/${uid}`;
  const learnerRef = doc(db, 'learners', uid);
  let workspace: WorkspaceState;

  try {
    const learnerSnap = await getDoc(learnerRef);
    if (!learnerSnap.exists()) {
      workspace = buildStarterWorkspaceForUser(user);
      await setDoc(learnerRef, {
        uid,
        name: workspace.profile.name.slice(0, 120),
        headline: workspace.profile.headline.slice(0, 180),
        organization: workspace.profile.organization.slice(0, 120),
        avatarUrl: (workspace.profile.avatarUrl || '').slice(0, 500),
        weeklyHoursAvailable: workspace.profile.weeklyHoursAvailable,
        targetCareerId: workspace.profile.targetCareerId,
        readinessScore: workspace.analysis.readinessScore,
        skills: workspace.profile.skills.slice(0, 40),
        certifications: workspace.profile.certifications.slice(0, 30),
        projects: workspace.profile.projects.slice(0, 30),
        analysis: workspace.analysis,
        roadmap: workspace.roadmap.slice(0, 40),
        assessments: workspace.assessments.slice(0, 50),
        adaptiveRecommendations: workspace.adaptiveRecommendations.slice(0, 30),
        agentTrace: workspace.agentTrace.slice(0, 50),
        mentorHistory: workspace.mentorHistory.slice(0, 50),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const d = learnerSnap.data();
      const profile: LearnerProfile = {
        id: uid,
        name: String(d.name || displayName),
        headline: String(d.headline || 'Learner'),
        organization: String(d.organization || organization),
        avatarUrl: String(d.avatarUrl || DEFAULT_LEARNER_PROFILE.avatarUrl),
        weeklyHoursAvailable: Number(d.weeklyHoursAvailable || 12),
        targetCareerId: String(d.targetCareerId || 'full-stack-dev'),
        skills: Array.isArray(d.skills) ? d.skills : [],
        certifications: Array.isArray(d.certifications) ? d.certifications : [],
        projects: Array.isArray(d.projects) ? d.projects : [],
      };
      const role = getRoleById(profile.targetCareerId);
      const analysis = d.analysis ?? analyzeSkillGaps(profile, role);
      const roadmap = Array.isArray(d.roadmap)
        ? d.roadmap
        : buildAdaptiveRoadmap(profile, role);
      const assessments = Array.isArray(d.assessments) ? d.assessments : [];
      const adaptiveRecommendations = Array.isArray(d.adaptiveRecommendations)
        ? d.adaptiveRecommendations
        : buildAdaptiveRecommendations({
            profile,
            role,
            analysis,
            roadmap,
            assessments,
          });

      workspace = {
        profile,
        analysis,
        roadmap,
        assessments,
        adaptiveRecommendations,
        agentTrace: Array.isArray(d.agentTrace) ? d.agentTrace : [],
        mentorHistory: Array.isArray(d.mentorHistory) ? d.mentorHistory : [],
        lastAdaptedAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, learnerPath);
  }

  return {
    account: {
      uid,
      displayName,
      email,
      role: resolvedRole,
      organization,
    },
    workspace,
  };
}

export async function saveLearnerWorkspaceToFirestore(
  uid: string,
  workspace: WorkspaceState,
): Promise<void> {
  const path = `learners/${uid}`;
  try {
    await updateDoc(doc(db, 'learners', uid), {
      name: workspace.profile.name.slice(0, 120),
      headline: workspace.profile.headline.slice(0, 180),
      organization: workspace.profile.organization.slice(0, 120),
      avatarUrl: (workspace.profile.avatarUrl || '').slice(0, 500),
      weeklyHoursAvailable: Math.max(1, Math.min(80, workspace.profile.weeklyHoursAvailable)),
      targetCareerId: workspace.profile.targetCareerId.slice(0, 64),
      readinessScore: Math.max(0, Math.min(100, workspace.analysis.readinessScore)),
      skills: workspace.profile.skills.slice(0, 40),
      certifications: workspace.profile.certifications.slice(0, 30),
      projects: workspace.profile.projects.slice(0, 30),
      analysis: workspace.analysis,
      roadmap: workspace.roadmap.slice(0, 40),
      assessments: workspace.assessments.slice(0, 50),
      adaptiveRecommendations: workspace.adaptiveRecommendations.slice(0, 30),
      agentTrace: workspace.agentTrace.slice(0, 50),
      mentorHistory: workspace.mentorHistory.slice(0, 50),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchCareerRolesFromFirestore(): Promise<CareerRole[]> {
  const path = 'careers';
  try {
    const snap = await getDocs(collection(db, 'careers'));
    if (snap.empty) {
      return CAREER_ROLES;
    }
    const firestoreRoles = snap.docs.map((docSnap) => docSnap.data() as CareerRole);
    const mergedMap = new Map(CAREER_ROLES.map((r) => [r.id, r]));
    for (const r of firestoreRoles) {
      if (r && r.id && Array.isArray(r.requiredSkills)) {
        mergedMap.set(r.id, r);
      }
    }
    return Array.from(mergedMap.values());
  } catch {
    return CAREER_ROLES;
  }
}

export async function saveCareerRoleToFirestore(
  role: CareerRole,
  adminUid: string,
): Promise<void> {
  const path = `careers/${role.id}`;
  try {
    await setDoc(doc(db, 'careers', role.id), {
      id: role.id.slice(0, 64),
      title: role.title.slice(0, 120),
      domain: role.domain.slice(0, 120),
      summary: role.summary.slice(0, 500),
      typicalTimelineWeeks: Math.max(1, Math.min(104, role.typicalTimelineWeeks)),
      requiredSkills: role.requiredSkills.slice(0, 25),
      updatedBy: adminUid.slice(0, 128),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchAllLearnersForAdmin(): Promise<CohortLearnerSummary[]> {
  const path = 'learners';
  try {
    const snap = await getDocs(collection(db, 'learners'));
    return snap.docs.map((d) => {
      const data = d.data();
      const assessments = Array.isArray(data.assessments) ? data.assessments : [];
      const avgScore =
        assessments.length > 0
          ? Math.round(
              assessments.reduce(
                (sum: number, a: { score?: number }) => sum + Number(a.score || 0),
                0,
              ) / assessments.length,
            )
          : null;

      const items = Array.isArray(data.analysis?.items) ? data.analysis.items : [];
      const missingSkills = items
        .filter((i: { status?: string }) => i.status === 'missing')
        .map((i: { skillName?: string }) => String(i.skillName || ''));

      return {
        uid: d.id,
        name: String(data.name || 'Learner'),
        organization: String(data.organization || 'University'),
        targetCareerId: String(data.targetCareerId || 'full-stack-dev'),
        targetRoleTitle: String(data.analysis?.targetRoleTitle || 'Full Stack Developer'),
        readinessScore: Number(data.readinessScore || 0),
        missingSkills,
        assessmentsCount: assessments.length,
        avgScore,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAllUsersForOwner(): Promise<UserAccount[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    const adminsSnap = await getDocs(collection(db, 'admins'));
    const adminSet = new Set(adminsSnap.docs.map((a) => a.id));

    return snap.docs.map((d) => {
      const data = d.data();
      const uid = d.id;
      const storedRole = String(data.role || 'student') as UserRole;
      const role: UserRole =
        storedRole === 'owner' ? 'owner' : adminSet.has(uid) ? 'admin' : 'student';

      return {
        uid,
        displayName: String(data.displayName || 'Member'),
        email: '', // PII kept isolated unless needed
        role,
        organization: String(data.organization || 'Organization'),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function grantAdminRole(
  targetUid: string,
  targetEmail: string,
  ownerUid: string,
): Promise<void> {
  const adminPath = `admins/${targetUid}`;
  try {
    await setDoc(doc(db, 'admins', targetUid), {
      uid: targetUid,
      email: (targetEmail || 'member@skillpath.edu').slice(0, 200),
      grantedBy: ownerUid,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'users', targetUid), {
      role: 'admin',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, adminPath);
  }
}

export async function revokeAdminRole(targetUid: string): Promise<void> {
  const adminPath = `admins/${targetUid}`;
  try {
    await deleteDoc(doc(db, 'admins', targetUid));
    await updateDoc(doc(db, 'users', targetUid), {
      role: 'student',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, adminPath);
  }
}
