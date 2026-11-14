import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateFirebaseProfile,
  type User,
} from 'firebase/auth';
import { Menu, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import {
  adaptStatelessWorkspace,
  fetchWorkspace,
  resetWorkspace,
  sendMentorQuestion,
  sendStatelessMentorQuestion,
  submitSkillQuiz,
  syncAgents,
  updateModuleProgress,
  updateProfile,
} from './api/workspaceClient.ts';
import { AdminConsoleView } from './components/AdminConsoleView.tsx';
import { AssessmentsView } from './components/AssessmentsView.tsx';
import {
  type AuthModalTab,
  AuthOptionsModal,
} from './components/AuthOptionsModal.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { MentorAgentsView } from './components/MentorAgentsView.tsx';
import { OverviewView } from './components/OverviewView.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { RoadmapView } from './components/RoadmapView.tsx';
import { type NavTab, SidebarNav } from './components/SidebarNav.tsx';
import { ThemeToggle } from './components/ThemeToggle.tsx';
import { auth, googleProvider } from './firebase.ts';
import {
  fetchCareerRolesFromFirestore,
  initializeAuthenticatedAccount,
  saveLearnerWorkspaceToFirestore,
} from './services/firestoreService.ts';
import { CAREER_ROLES } from './shared/careerCatalog.ts';
import type {
  AssessmentRecord,
  CareerRole,
  LearnerProfile,
  ModuleStatus,
  QuizQuestion,
  UserAccount,
  UserRole,
  WorkspaceState,
} from './shared/types.ts';
import {
  buildGuestSession,
  deserializeGuestSession,
  GUEST_STORAGE_KEY,
  type GuestPreset,
  type GuestSessionConfig,
  serializeGuestSession,
} from './utils/guestSession.ts';
import {
  analyzeSkillGaps,
  applyAssessmentOutcome,
  buildAdaptiveRecommendations,
  getQuizForSkill,
  getRoleById,
} from './utils/skillEngine.ts';

const TAB_LABELS: Record<NavTab, string> = {
  overview: 'Overview & Gaps',
  roadmap: 'Learning Roadmap',
  assessments: 'Skill Assessments',
  mentor: 'AI Mentor & Agents',
  profile: 'Learner Profile',
  admin: 'Admin & Cohort Console',
};

function formatAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password')) {
    return 'Incorrect email or password. Please check your credentials and try again.';
  }
  if (raw.includes('auth/user-not-found')) {
    return 'No account found with that email address. Switch to Create Account to register.';
  }
  if (raw.includes('auth/email-already-in-use')) {
    return 'An account already exists with this email. Switch to Sign In instead.';
  }
  if (raw.includes('auth/weak-password')) {
    return 'Please choose a stronger password (at least 6 characters).';
  }
  if (raw.includes('auth/operation-not-allowed')) {
    return 'Email & Password sign-in is not yet enabled in this Firebase project. Use Google Sync or Guest Mode.';
  }
  if (raw.includes('auth/popup-closed-by-user')) {
    return 'Google Sign-In popup was closed before completing sign-in.';
  }
  return raw;
}

export default function App() {
  const prefersReduced = useReducedMotion();
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(
    null,
  );

  // Auth / Guest Options Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('guest');
  const [authModalRole, setAuthModalRole] = useState<UserRole>('student');
  const [authModalCareerId, setAuthModalCareerId] = useState<string>('full-stack-dev');

  const [account, setAccount] = useState<UserAccount | null>(null);
  const [guestPreset, setGuestPreset] = useState<GuestPreset>('demo');
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [roles, setRoles] = useState<CareerRole[]>(CAREER_ROLES);
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [adapting, setAdapting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quizTargetSkill, setQuizTargetSkill] = useState<string | null>(null);
  const [quizTargetModuleId, setQuizTargetModuleId] = useState<
    string | undefined
  >(undefined);

  const openAuthModal = (options?: {
    tab?: AuthModalTab;
    role?: UserRole;
    careerId?: string;
  }) => {
    setAuthError(null);
    setAuthNotice(null);
    setAuthModalTab(options?.tab ?? 'guest');
    setAuthModalRole(options?.role ?? 'student');
    setAuthModalCareerId(options?.careerId ?? 'full-stack-dev');
    setAuthModalOpen(true);
  };

  const saveGuestToStorage = (
    acc: UserAccount,
    ws: WorkspaceState,
    preset: GuestPreset = guestPreset,
  ) => {
    try {
      const payload = serializeGuestSession({
        account: acc,
        workspace: ws,
        preset,
        createdAt: new Date().toISOString(),
      });
      window.localStorage.setItem(GUEST_STORAGE_KEY, payload);
    } catch {
      // ignore storage quota errors gracefully
    }
  };

  const clearGuestStorage = () => {
    try {
      window.localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Restore saved Guest session or check ?autostart=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart');
    if (autostart === '1') {
      void enterPreviewSession('student');
      return;
    }

    try {
      const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
      const restored = deserializeGuestSession(raw);
      if (restored && !auth.currentUser) {
        setAccount(restored.account);
        setWorkspace(restored.workspace);
        setGuestPreset(restored.preset);
        setActiveTab(restored.account.role === 'student' ? 'overview' : 'admin');
      }
    } catch {
      // ignore invalid storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeTab, account?.uid]);

  const hydrateVerifiedCloudUser = async (
    user: User,
    preferredPortal?: UserRole,
  ) => {
    const [{ account: acc, workspace: ws }, loadedRoles] = await Promise.all([
      initializeAuthenticatedAccount(user),
      fetchCareerRolesFromFirestore(),
    ]);
    clearGuestStorage();
    setAccount(acc);
    setWorkspace(ws);
    setRoles(loadedRoles);
    setPendingVerificationEmail(null);
    setAuthNotice(null);
    setAuthModalOpen(false);
    if (
      (preferredPortal === 'admin' || preferredPortal === 'owner') &&
      (acc.role === 'admin' || acc.role === 'owner')
    ) {
      setActiveTab('admin');
    } else {
      setActiveTab('overview');
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthReady(true);
        return;
      }

      if (!user.emailVerified) {
        setPendingVerificationEmail(user.email || null);
        setAuthNotice(
          `Verification link sent to ${user.email || 'your email'}. Please verify your inbox to unlock Cloud Firestore sync, or continue in Guest Mode meanwhile.`,
        );
        setAuthReady(true);
        return;
      }

      setLoadingWorkspace(true);
      setAuthError(null);
      try {
        await hydrateVerifiedCloudUser(user);
      } catch (err) {
        setAuthError(
          err instanceof Error
            ? err.message
            : 'Unable to initialize your Firestore account.',
        );
      } finally {
        setLoadingWorkspace(false);
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enterPreviewSession = async (previewRole: UserRole) => {
    setLoadingWorkspace(true);
    setAuthError(null);
    setError(null);
    try {
      const data = await fetchWorkspace();
      setWorkspace(data.workspace);
      setRoles(data.roles);
      setAccount({
        uid: `preview-${previewRole}`,
        displayName:
          previewRole === 'owner'
            ? 'Platform Owner'
            : previewRole === 'admin'
              ? 'Cohort Admin'
              : data.workspace.profile.name,
        email: '',
        role: previewRole,
        organization: data.workspace.profile.organization,
        isPreview: true,
      });
      setActiveTab(previewRole === 'student' ? 'overview' : 'admin');
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Unable to load preview workspace.',
      );
    } finally {
      setLoadingWorkspace(false);
      setAuthReady(true);
    }
  };

  const enterGuestSession = (config: GuestSessionConfig) => {
    setAuthError(null);
    setAuthNotice(null);
    setError(null);
    const session = buildGuestSession(config, roles);
    setGuestPreset(session.preset);
    setAccount(session.account);
    setWorkspace(session.workspace);
    saveGuestToStorage(session.account, session.workspace, session.preset);
    setActiveTab(session.account.role === 'student' ? 'overview' : 'admin');
    setAuthModalOpen(false);
    setAuthReady(true);
  };

  const handleQuickGuestEnter = (
    role: UserRole = 'student',
    careerId = 'full-stack-dev',
  ) => {
    enterGuestSession({
      guestName: 'Guest Learner',
      targetCareerId: careerId,
      role,
      preset: 'demo',
    });
  };

  const handleGoogleSignIn = async (preferredPortal?: UserRole) => {
    setAuthLoading(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await hydrateVerifiedCloudUser(cred.user, preferredPortal);
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignIn = async (payload: {
    email: string;
    password: string;
    preferredPortal?: UserRole;
  }) => {
    setAuthLoading(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        payload.email,
        payload.password,
      );
      if (!cred.user.emailVerified) {
        setPendingVerificationEmail(cred.user.email || payload.email);
        setAuthNotice(
          `Your email (${payload.email}) is not verified yet. Check your inbox or resend the verification email below.`,
        );
        return;
      }
      await hydrateVerifiedCloudUser(cred.user, payload.preferredPortal);
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignUp = async (payload: {
    name: string;
    email: string;
    password: string;
  }) => {
    setAuthLoading(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        payload.email,
        payload.password,
      );
      if (payload.name.trim()) {
        await updateFirebaseProfile(cred.user, {
          displayName: payload.name.trim(),
        });
      }
      await sendEmailVerification(cred.user);
      setPendingVerificationEmail(payload.email);
      setAuthNotice(
        `Account created! We sent a verification link to ${payload.email}. Click it and press "I've Verified — Continue", or explore in Guest Mode meanwhile.`,
      );
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async (targetEmail: string) => {
    setAuthLoading(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setAuthNotice(
        `Password reset email sent to ${targetEmail}. Check your inbox to choose a new password.`,
      );
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setAuthNotice(
        `A fresh verification email has been sent to ${auth.currentUser.email}.`,
      );
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRefreshVerification = async () => {
    if (!auth.currentUser) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        await hydrateVerifiedCloudUser(auth.currentUser, authModalRole);
      } else {
        setAuthNotice(
          'Email is still pending verification. Please click the link inside your inbox first.',
        );
      }
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (account && !account.isPreview && !account.isGuest) {
      await signOut(auth);
    }
    clearGuestStorage();
    setAccount(null);
    setWorkspace(null);
    setActiveTab('overview');
  };

  const persistWorkspaceState = async (nextWs: WorkspaceState) => {
    setWorkspace(nextWs);
    if (!account) return;
    if (account.isGuest) {
      saveGuestToStorage(account, nextWs, guestPreset);
      return;
    }
    if (!account.isPreview) {
      await saveLearnerWorkspaceToFirestore(account.uid, nextWs);
    }
  };

  const handleChangeTargetRole = async (roleId: string) => {
    if (!workspace || !account || adapting) return;
    setAdapting(true);
    setError(null);
    try {
      if (account.isPreview && !account.isGuest) {
        const res = await updateProfile({ targetCareerId: roleId });
        setWorkspace(res.workspace);
      } else {
        const updatedProfile: LearnerProfile = {
          ...workspace.profile,
          targetCareerId: roleId,
        };
        const role = getRoleById(roleId, roles);
        const adapted = await adaptStatelessWorkspace({
          trigger: `Career Goal Changed → ${role.title}`,
          profile: updatedProfile,
          roadmap: [],
          assessments: workspace.assessments,
          roles,
        });
        const nextWs: WorkspaceState = {
          ...workspace,
          profile: updatedProfile,
          analysis: adapted.analysis,
          roadmap: adapted.roadmap,
          adaptiveRecommendations: adapted.adaptiveRecommendations,
          agentTrace: [...adapted.traceSteps, ...workspace.agentTrace].slice(0, 40),
          mentorHistory: [
            ...workspace.mentorHistory,
            {
              id: `msg-${Date.now()}`,
              sender: 'mentor' as const,
              content: adapted.mentorNote,
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
        await persistWorkspaceState(nextWs);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to switch career target.',
      );
    } finally {
      setAdapting(false);
    }
  };

  const handleSaveProfile = async (updated: LearnerProfile) => {
    if (!workspace || !account) return;
    setAdapting(true);
    setError(null);
    try {
      if (account.isPreview && !account.isGuest) {
        const res = await updateProfile(updated);
        setWorkspace(res.workspace);
      } else {
        const roleChanged =
          workspace.profile.targetCareerId !== updated.targetCareerId;
        const role = getRoleById(updated.targetCareerId, roles);
        const adapted = await adaptStatelessWorkspace({
          trigger: roleChanged
            ? `Career Goal Changed → ${role.title}`
            : 'Learner Profile & Skills Updated',
          profile: updated,
          roadmap: roleChanged ? [] : workspace.roadmap,
          assessments: workspace.assessments,
          roles,
        });
        const nextWs: WorkspaceState = {
          ...workspace,
          profile: updated,
          analysis: adapted.analysis,
          roadmap: adapted.roadmap,
          adaptiveRecommendations: adapted.adaptiveRecommendations,
          agentTrace: [...adapted.traceSteps, ...workspace.agentTrace].slice(0, 40),
          mentorHistory: [
            ...workspace.mentorHistory,
            {
              id: `msg-${Date.now()}`,
              sender: 'mentor' as const,
              content: adapted.mentorNote,
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
        await persistWorkspaceState(nextWs);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save learner profile.',
      );
    } finally {
      setAdapting(false);
    }
  };

  const handleSyncAgents = async () => {
    if (!workspace || !account || adapting) return;
    setAdapting(true);
    setError(null);
    try {
      if (account.isPreview && !account.isGuest) {
        const res = await syncAgents('Manual 5-Agent Collaboration Sync');
        setWorkspace(res.workspace);
      } else {
        const adapted = await adaptStatelessWorkspace({
          trigger: 'Manual 5-Agent Collaboration Sync',
          profile: workspace.profile,
          roadmap: workspace.roadmap,
          assessments: workspace.assessments,
          roles,
        });
        const nextWs: WorkspaceState = {
          ...workspace,
          analysis: adapted.analysis,
          roadmap: adapted.roadmap,
          adaptiveRecommendations: adapted.adaptiveRecommendations,
          agentTrace: [...adapted.traceSteps, ...workspace.agentTrace].slice(0, 40),
          mentorHistory: [
            ...workspace.mentorHistory,
            {
              id: `msg-${Date.now()}`,
              sender: 'mentor' as const,
              content: adapted.mentorNote,
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
        await persistWorkspaceState(nextWs);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Agent synchronization failed.',
      );
    } finally {
      setAdapting(false);
    }
  };

  const handleUpdateModuleStatus = async (
    moduleId: string,
    status: ModuleStatus,
  ) => {
    if (!workspace || !account) return;
    setError(null);
    try {
      if (account.isPreview && !account.isGuest) {
        const res = await updateModuleProgress(moduleId, { status });
        setWorkspace(res.workspace);
      } else {
        const target = workspace.roadmap.find((m) => m.id === moduleId);
        if (!target) return;
        const nextProgress =
          status === 'completed' ? 100 : status === 'in_progress' ? 40 : 0;
        const nextRoadmap = workspace.roadmap.map((m) =>
          m.id === moduleId ? { ...m, status, progressPercent: nextProgress } : m,
        );
        const role = getRoleById(workspace.profile.targetCareerId, roles);
        const nextAnalysis = analyzeSkillGaps(workspace.profile, role);
        const nextRecs = buildAdaptiveRecommendations({
          profile: workspace.profile,
          role,
          analysis: nextAnalysis,
          roadmap: nextRoadmap,
          assessments: workspace.assessments,
          roles,
        });
        const nextWs: WorkspaceState = {
          ...workspace,
          analysis: nextAnalysis,
          roadmap: nextRoadmap,
          adaptiveRecommendations: nextRecs,
          lastAdaptedAt: new Date().toISOString(),
        };
        await persistWorkspaceState(nextWs);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update module status.',
      );
    }
  };

  const handleSubmitAssessment = async (payload: {
    skillName: string;
    moduleId?: string;
    answers: number[];
  }): Promise<{
    record: AssessmentRecord;
    remediationTriggered: boolean;
    questions: QuizQuestion[];
  }> => {
    if (!workspace || !account) {
      throw new Error('Workspace not initialized.');
    }

    if (account.isPreview && !account.isGuest) {
      const res = await submitSkillQuiz(payload);
      setWorkspace(res.workspace);
      return {
        record: res.record,
        remediationTriggered: res.remediationTriggered,
        questions: res.questions,
      };
    }

    const questions = getQuizForSkill(payload.skillName);
    const outcome = applyAssessmentOutcome({
      profile: workspace.profile,
      roadmap: workspace.roadmap,
      skillName: payload.skillName,
      moduleId: payload.moduleId,
      answers: payload.answers,
      questions,
    });
    const nextAssessments = [outcome.record, ...workspace.assessments];
    const adapted = await adaptStatelessWorkspace({
      trigger: outcome.remediationTriggered
        ? `Low Assessment Score (${outcome.record.score}%) in ${payload.skillName}`
        : `Passed Assessment (${outcome.record.score}%) in ${payload.skillName}`,
      profile: outcome.updatedProfile,
      roadmap: outcome.updatedRoadmap,
      assessments: nextAssessments,
      roles,
    });
    const nextWs: WorkspaceState = {
      ...workspace,
      profile: outcome.updatedProfile,
      analysis: adapted.analysis,
      roadmap: adapted.roadmap,
      assessments: nextAssessments,
      adaptiveRecommendations: adapted.adaptiveRecommendations,
      agentTrace: [...adapted.traceSteps, ...workspace.agentTrace].slice(0, 40),
      mentorHistory: [
        ...workspace.mentorHistory,
        {
          id: `msg-${Date.now()}`,
          sender: 'mentor' as const,
          content: outcome.remediationTriggered
            ? `${outcome.record.evaluatorFeedback} ${adapted.mentorNote}`
            : `Nice work scoring ${outcome.record.score}% on ${payload.skillName}! ${adapted.mentorNote}`,
          timestamp: new Date().toISOString(),
          collaboratingAgents: [
            'Progress Evaluator' as const,
            'Curriculum Architect' as const,
            'Market & Role Scout' as const,
            'AI Mentor' as const,
          ],
        },
      ].slice(-30),
      lastAdaptedAt: new Date().toISOString(),
    };
    await persistWorkspaceState(nextWs);

    return {
      record: outcome.record,
      remediationTriggered: outcome.remediationTriggered,
      questions,
    };
  };

  const handleSendChatMessage = async (message: string) => {
    if (!workspace || !account) return;
    if (account.isPreview && !account.isGuest) {
      const res = await sendMentorQuestion(message);
      setWorkspace(res.workspace);
      return;
    }

    const learnerMsg = {
      id: `msg-${Date.now()}-user`,
      sender: 'learner' as const,
      content: message,
      timestamp: new Date().toISOString(),
    };
    const replyData = await sendStatelessMentorQuestion({
      message,
      profile: workspace.profile,
      roadmap: workspace.roadmap,
      assessments: workspace.assessments,
      history: [...workspace.mentorHistory, learnerMsg],
      roles,
    });
    const mentorMsg = {
      id: `msg-${Date.now()}-mentor`,
      sender: 'mentor' as const,
      content: replyData.reply,
      timestamp: new Date().toISOString(),
      collaboratingAgents: replyData.collaboratingAgents,
      recommendedAction: replyData.recommendedAction,
    };
    const nextWs: WorkspaceState = {
      ...workspace,
      mentorHistory: [...workspace.mentorHistory, learnerMsg, mentorMsg].slice(-40),
    };
    await persistWorkspaceState(nextWs);
  };

  const handleResetDemo = async () => {
    if (!account) return;
    setAdapting(true);
    setError(null);
    try {
      if (account.isGuest) {
        const fresh = buildGuestSession(
          {
            guestName: account.displayName.replace(/\s*\((Admin|Owner)\s+Guest\)$/i, ''),
            targetCareerId: 'full-stack-dev',
            role: account.role,
            preset: guestPreset,
          },
          roles,
        );
        await persistWorkspaceState(fresh.workspace);
      } else {
        const res = await resetWorkspace();
        await persistWorkspaceState(res.workspace);
        setRoles(res.roles);
      }
      setActiveTab('overview');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to reset scenario.',
      );
    } finally {
      setAdapting(false);
    }
  };

  const handleStartQuizForSkill = (skillName: string, moduleId?: string) => {
    setQuizTargetSkill(skillName);
    setQuizTargetModuleId(moduleId);
    setActiveTab('assessments');
  };

  if (!authReady || loadingWorkspace) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
          <div className="h-5 w-40 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  const authModal = (
    <AuthOptionsModal
      open={authModalOpen}
      initialTab={authModalTab}
      initialRole={authModalRole}
      initialCareerId={authModalCareerId}
      roles={roles}
      authLoading={authLoading}
      authError={authError}
      authNotice={authNotice}
      pendingVerificationEmail={pendingVerificationEmail}
      onClose={() => setAuthModalOpen(false)}
      onGoogleSignIn={handleGoogleSignIn}
      onEmailSignIn={handleEmailSignIn}
      onEmailSignUp={handleEmailSignUp}
      onResetPassword={handleResetPassword}
      onResendVerification={handleResendVerification}
      onRefreshVerification={handleRefreshVerification}
      onStartGuest={enterGuestSession}
    />
  );

  // Show Refreshed Landing Page when not signed in or in guest mode
  if (!account || !workspace) {
    return (
      <>
        <LandingPage
          authLoading={authLoading}
          authError={authError}
          onOpenAuthModal={openAuthModal}
          onQuickGuestEnter={handleQuickGuestEnter}
        />
        {authModal}
      </>
    );
  }

  const remedialCount = workspace.roadmap.filter((m) => m.isRemedial).length;
  const currentLearnerSummary = {
    uid: account.uid,
    name: workspace.profile.name,
    organization: workspace.profile.organization,
    targetCareerId: workspace.profile.targetCareerId,
    targetRoleTitle: workspace.analysis.targetRoleTitle,
    readinessScore: workspace.analysis.readinessScore,
    missingSkills: workspace.analysis.items
      .filter((i) => i.status === 'missing')
      .map((i) => i.skillName),
    assessmentsCount: workspace.assessments.length,
    avgScore:
      workspace.assessments.length > 0
        ? Math.round(
            workspace.assessments.reduce((sum, a) => sum + a.score, 0) /
              workspace.assessments.length,
          )
        : null,
    updatedAt: workspace.lastAdaptedAt,
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <SidebarNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        profile={workspace.profile}
        account={account}
        targetRoleTitle={workspace.analysis.targetRoleTitle}
        remedialCount={remedialCount}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        onSignOut={handleSignOut}
        onOpenAuthUpgrade={() => openAuthModal({ tab: 'google', role: account.role })}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 px-4 sm:px-8 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation menu"
                className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 lg:hidden"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-2 text-sm min-w-0 truncate">
                <span className="text-slate-500 dark:text-slate-400 hidden sm:inline whitespace-nowrap">
                  {workspace.analysis.targetRoleTitle}
                </span>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" aria-hidden="true">
                  /
                </span>
                <span className="font-display font-semibold text-slate-900 dark:text-white truncate">
                  {activeTab === 'admin' && account.role === 'owner'
                    ? 'Owner & Cohort Console'
                    : TAB_LABELS[activeTab]}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              {(account.isGuest || account.isPreview) && (
                <button
                  type="button"
                  onClick={() => openAuthModal({ tab: 'google', role: account.role })}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 sm:px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
                >
                  {account.isGuest ? (
                    <>
                      <span className="hidden sm:inline">Guest · </span>Sign In
                    </>
                  ) : (
                    'Connect Account'
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={handleSyncAgents}
                disabled={adapting}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-slate-900 dark:bg-blue-600 px-3 sm:px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-60 whitespace-nowrap"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${adapting ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>
                  {adapting ? (
                    'Adapting...'
                  ) : (
                    <>
                      <span className="hidden sm:inline">Sync 5 AI Agents</span>
                      <span className="sm:hidden">Sync AI</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* 5-Agent Collaboration Sweep Indicator */}
          {adapting && (
            <div
              aria-hidden="true"
              className="relative h-0.5 w-full overflow-hidden bg-blue-100 dark:bg-blue-950"
            >
              <div className="animate-beam-sweep absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-blue-600 dark:via-sky-400 to-transparent" />
            </div>
          )}
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-8 py-6 sm:py-8">
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-800 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={prefersReduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? undefined : { opacity: 0, y: -3 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
            >
              {activeTab === 'overview' && (
                <OverviewView
                  workspace={workspace}
                  roles={roles}
                  isAdapting={adapting}
                  onChangeTargetRole={handleChangeTargetRole}
                  onNavigate={setActiveTab}
                  onStartQuizForSkill={(skill) => handleStartQuizForSkill(skill)}
                />
              )}

              {activeTab === 'roadmap' && (
                <RoadmapView
                  targetRoleTitle={workspace.analysis.targetRoleTitle}
                  roadmap={workspace.roadmap}
                  weeklyHoursAvailable={workspace.profile.weeklyHoursAvailable}
                  onUpdateStatus={handleUpdateModuleStatus}
                  onStartQuizForSkill={handleStartQuizForSkill}
                />
              )}

              {activeTab === 'assessments' && (
                <AssessmentsView
                  skills={workspace.analysis.items}
                  assessments={workspace.assessments}
                  initialSkill={quizTargetSkill}
                  initialModuleId={quizTargetModuleId}
                  onSubmitAssessment={handleSubmitAssessment}
                  onOpenRoadmap={() => setActiveTab('roadmap')}
                />
              )}

              {activeTab === 'mentor' && (
                <MentorAgentsView
                  workspace={workspace}
                  isSyncing={adapting}
                  onSyncAgents={handleSyncAgents}
                  onSendChatMessage={handleSendChatMessage}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileView
                  profile={workspace.profile}
                  roles={roles}
                  saving={adapting}
                  onSaveProfile={handleSaveProfile}
                  onResetDemo={handleResetDemo}
                />
              )}

              {activeTab === 'admin' &&
                (account.role === 'admin' || account.role === 'owner') && (
                  <AdminConsoleView
                    account={account}
                    roles={roles}
                    currentLearnerSummary={currentLearnerSummary}
                    onRolesUpdated={setRoles}
                  />
                )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {authModal}
    </div>
  );
}
