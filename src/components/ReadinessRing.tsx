import { motion, useReducedMotion } from 'motion/react';

interface ReadinessRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ReadinessRing({
  score,
  size = 112,
  strokeWidth = 9,
  label = 'Readiness',
}: ReadinessRingProps) {
  const prefersReduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    clamped >= 75
      ? '#10b981'
      : clamped >= 45
        ? '#2563eb'
        : '#f59e0b';

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${clamped} percent`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200/80 dark:text-slate-800"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={
            prefersReduced
              ? { strokeDashoffset: targetOffset }
              : { strokeDashoffset: circumference }
          }
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
          {clamped}%
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
    </div>
  );
}
