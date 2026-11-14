import { Dices, Monitor, Moon, MousePointer, Sparkles, Sun, Zap } from 'lucide-react';
import { type Theme, useTheme } from '../context/ThemeContext.tsx';
import {
  SPECIAL_EFFECTS_CATALOG,
  type SpecialEffectMode,
} from '../utils/specialEffectsCatalog.ts';

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
  const {
    theme,
    setTheme,
    mouseTrackStyle,
    cycleMouseTrackStyle,
    effectMode,
    setEffectMode,
    triggerRandomEffect,
  } = useTheme();

  const options: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const cycleNextEffect = () => {
    const modes: SpecialEffectMode[] = [
      'crisscross',
      'pulse-burst',
      'matrix-circuit',
      'aurora-glow',
    ];
    const currentIndex = modes.indexOf(effectMode);
    const nextMode = modes[(currentIndex + 1) % modes.length] || 'crisscross';
    setEffectMode(nextMode);
    triggerRandomEffect();
  };

  return (
    <div
      role="radiogroup"
      aria-label="Color theme selection and special effects options"
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

      {/* Mouse Track Style Cycler Button */}
      <button
        type="button"
        onClick={cycleMouseTrackStyle}
        title={`Mouse Track Style: ${mouseTrackStyle.toUpperCase()} (Click to cycle styles)`}
        aria-label="Cycle mouse track animation style"
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium transition-colors ${
          mouseTrackStyle !== 'off'
            ? 'text-sky-600 dark:text-cyan-400 hover:bg-sky-50 dark:hover:bg-cyan-950/50'
            : 'text-slate-400 dark:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800'
        }`}
      >
        <MousePointer className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline font-mono text-[10px]">
          {mouseTrackStyle}
        </span>
      </button>

      {/* 4 Random Special Effects Mode Selector */}
      <button
        type="button"
        onClick={cycleNextEffect}
        title={`Current FX: ${
          SPECIAL_EFFECTS_CATALOG.find((e) => e.id === effectMode)?.name ??
          effectMode
        } (Click to cycle 4 random effects)`}
        aria-label="Cycle 4 random special effect modes"
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors"
      >
        <Zap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline font-mono text-[10px]">
          {effectMode.split('-')[0]}
        </span>
      </button>

      {/* Randomize FX Button */}
      <button
        type="button"
        onClick={() => triggerRandomEffect()}
        title="Trigger Random Special Effect Animation"
        aria-label="Trigger random special effect animation"
        className="inline-flex items-center justify-center rounded-md p-1 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
      >
        <Dices className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </button>
    </div>
  );
}
