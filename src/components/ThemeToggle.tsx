import { Monitor, Moon, Sun } from 'lucide-react';
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
  const { theme, setTheme } = useTheme();

  const options: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Color theme selection"
      className={`inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 p-0.5 ${className}`}
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
    </div>
  );
}
