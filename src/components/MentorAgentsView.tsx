import { Bot, RefreshCw, Send } from 'lucide-react';
import { useState } from 'react';
import type {
  AgentName,
  AgentTraceStep,
  MentorMessage,
  WorkspaceState,
} from '../shared/types.ts';
import { VoiceSpeechInput } from './VoiceSpeechInput.tsx';

interface MentorAgentsViewProps {
  workspace: WorkspaceState;
  isSyncing: boolean;
  onSyncAgents: () => void;
  onSendChatMessage: (message: string) => Promise<void>;
}

const SUGGESTED_PROMPTS = [
  'What should I focus on first this week?',
  'Which adjacent career matches my skills best?',
  'Explain how my roadmap adapts if I score low on a quiz.',
];

const AGENT_ROSTER: Array<{ name: AgentName; focus: string }> = [
  { name: 'Skill Analyst', focus: 'Gap & readiness scoring' },
  { name: 'Market & Role Scout', focus: 'Role fit & career pivots' },
  { name: 'Curriculum Architect', focus: 'Module & drill sequencing' },
  { name: 'Progress Evaluator', focus: 'Diagnostics & remediation' },
  { name: 'AI Mentor', focus: 'Coaching & next actions' },
];

export function MentorAgentsView({
  workspace,
  isSyncing,
  onSyncAgents,
  onSendChatMessage,
}: MentorAgentsViewProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);
    try {
      await onSendChatMessage(trimmed);
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach AI Mentor.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            5-Agent Collaboration · {workspace.analysis.targetRoleTitle}
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            AI Career Mentor &amp; Five Collaborating Agents
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Skill Analyst, Market &amp; Role Scout, Curriculum Architect, Progress
            Evaluator, and AI Mentor share context to keep your roadmap accurate.
          </p>
        </div>

        <button
          type="button"
          onClick={onSyncAgents}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60 whitespace-nowrap"
        >
          <RefreshCw
            className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>{isSyncing ? 'Collaborating...' : 'Re-Run 5-Agent Sync'}</span>
        </button>
      </div>

      {/* Five Collaborating Agents Roster */}
      <section
        aria-label="Collaborating AI agents"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        {AGENT_ROSTER.map((agent, idx) => (
          <div
            key={agent.name}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-mono">
              <span>0{idx + 1}</span>
              <Bot className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" aria-hidden="true" />
            </div>
            <div className="mt-2 font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              {agent.name}
            </div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{agent.focus}</div>
          </div>
        ))}
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-sm text-red-800 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Conversational AI Mentor */}
        <section className="lg:col-span-7 flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              AI Career Mentor
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Grounded in your {workspace.profile.skills.length} skill
              {workspace.profile.skills.length === 1 ? '' : 's'},{' '}
              {workspace.analysis.missingCount} open gap
              {workspace.analysis.missingCount === 1 ? '' : 's'}, and{' '}
              {workspace.assessments.length} assessment record
              {workspace.assessments.length === 1 ? '' : 's'}.
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-6 max-h-[520px]">
            {workspace.mentorHistory.map((msg: MentorMessage) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'learner' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === 'learner'
                      ? 'bg-blue-700 text-white'
                      : 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {msg.sender === 'mentor' && msg.collaboratingAgents && (
                    <div className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Consulted: {msg.collaboratingAgents.join(' · ')}
                    </div>
                  )}
                  <p>{msg.content}</p>
                  {msg.recommendedAction && (
                    <div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-blue-800 dark:text-blue-400">
                      Next step: {msg.recommendedAction}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={sending}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <label htmlFor="mentor-chat-input" className="sr-only">
                Ask your AI Mentor a question
              </label>
              <input
                id="mentor-chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your roadmap, skill gaps, or career switch..."
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <VoiceSpeechInput
                onTranscript={(text) =>
                  setInput((prev) => (prev ? `${prev} ${text}` : text))
                }
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>{sending ? 'Sending...' : 'Send'}</span>
              </button>
            </form>
          </div>
        </section>

        {/* Right: Multi-Agent Handoff Trace */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Agent Collaboration Decisions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit trail of how all 5 agents evaluate and adapt your learning plan.
            </p>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[600px] overflow-y-auto px-6 py-2">
            {workspace.agentTrace.map((step: AgentTraceStep) => (
              <div key={step.id} className="py-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 dark:text-blue-400">
                    <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                    {step.agent}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                    {new Date(step.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Trigger: {step.trigger}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {step.action}
                </p>
                <p className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                  {step.finding}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
