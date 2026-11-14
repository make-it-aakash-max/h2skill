import type { ResolvedTheme, Theme } from '../context/ThemeContext.tsx';

export interface SlatConfig {
  index: number;
  direction: 'down' | 'up';
  delay: number;
  widthPercent: number;
  leftPercent: number;
  initialY: string;
  exitY: string;
}

export function calculateTargetResolved(
  targetTheme: Theme,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (targetTheme === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return targetTheme;
}

export function generateSlatConfigs(
  totalSlats = 10,
  mode: 'to-dark' | 'to-light' = 'to-dark',
): SlatConfig[] {
  const configs: SlatConfig[] = [];
  const slatWidth = 100 / totalSlats;

  for (let i = 0; i < totalSlats; i++) {
    // Even slats slide from top to bottom (down)
    // Odd slats slide from bottom to top (up)
    const isEven = i % 2 === 0;
    const direction: 'down' | 'up' = isEven ? 'down' : 'up';

    // Stagger delay based on index for a flowing wave
    const delay = (i * 0.024);

    configs.push({
      index: i,
      direction,
      delay,
      widthPercent: slatWidth + 0.15, // slight overlap to prevent subpixel seams
      leftPercent: i * slatWidth,
      initialY: isEven ? '-101%' : '101%',
      exitY: isEven ? '101%' : '-101%',
    });
  }

  return configs;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
}

export const DARK_THEME_PALETTE = [
  '#38bdf8', // sky-400
  '#60a5fa', // blue-400
  '#22d3ee', // cyan-400
  '#a855f7', // purple-500
  '#e0e7ff', // indigo-100
];

export const LIGHT_THEME_PALETTE = [
  '#2563eb', // blue-600
  '#0284c7', // sky-600
  '#0d9488', // teal-600
  '#4f46e5', // indigo-600
  '#1e293b', // slate-800
];

export function createMouseParticle(
  x: number,
  y: number,
  vx = (Math.random() - 0.5) * 1.5,
  vy = (Math.random() - 0.5) * 1.5,
  resolvedTheme: ResolvedTheme = 'dark',
): Particle {
  const palette = resolvedTheme === 'dark' ? DARK_THEME_PALETTE : LIGHT_THEME_PALETTE;
  const color = palette[Math.floor(Math.random() * palette.length)] || palette[0];
  return {
    x,
    y,
    vx: vx * 0.4 + (Math.random() - 0.5) * 1.2,
    vy: vy * 0.4 + (Math.random() - 0.5) * 1.2,
    size: Math.random() * 2.5 + 1.5,
    alpha: 0.9,
    decay: Math.random() * 0.035 + 0.02,
    color,
  };
}
