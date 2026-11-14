import { Monitor, Moon, Sparkles, Sun } from 'lucide-react';
import { type Theme, useTheme } from '../context/ThemeContext.tsx';

interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md';
}

export function ThemeToggle({
  className = '',
  showLabels = false,
  size = 'sm',
}: ThemeToggleProps) {
  const { theme, setTheme, mouseTrackEnabled, setMouseTrackEnabled } = useTheme();

  const options: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Color theme selection"
      className={`inline-flex items-center gap-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 p-0.5 ${className}`}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            title={`${opt.label} theme`}
            aria-label={`${opt.label} theme`}
            className={`inline-flex items-center gap-1.5 rounded-md font-medium transition-colors ${
              size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs'
            } ${
              active
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {showLabels && <span className="whitespace-nowrap">{opt.label}</span>}
          </button>
        );
      })}

      <div className="mx-0.5 h-3.5 w-px bg-slate-300 dark:bg-slate-700" aria-hidden="true" />

      {/* Mouse Track Animation Toggle */}
      <button
        type="button"
        onClick={() => setMouseTrackEnabled(!mouseTrackEnabled)}
        title={
          mouseTrackEnabled
            ? 'Mouse track animation active (Click to toggle)'
            : 'Mouse track animation paused (Click to enable)'
        }
        aria-label="Toggle mouse track animation"
        aria-pressed={mouseTrackEnabled}
        className={`inline-flex items-center justify-center rounded-md p-1 text-xs transition-colors ${
          mouseTrackEnabled
            ? 'text-sky-600 dark:text-cyan-400 hover:text-sky-700 dark:hover:text-cyan-300'
            : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
        }`}
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </button>
    </div>
  );
}
