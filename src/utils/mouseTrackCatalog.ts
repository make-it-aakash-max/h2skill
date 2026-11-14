export type MouseTrackStyle = 'stardust' | 'neon-ribbon' | 'matrix-sparks' | 'off';

export interface MouseTrackOption {
  id: MouseTrackStyle;
  name: string;
  description: string;
}

export const MOUSE_TRACK_OPTIONS: MouseTrackOption[] = [
  { id: 'stardust', name: 'Stardust Sparkles', description: 'Floating colorful micro-particles.' },
  { id: 'neon-ribbon', name: 'Neon Ribbon', description: 'Fluid glowing ribbon connecting cursor path.' },
  { id: 'matrix-sparks', name: 'Matrix Sparks', description: 'Cyberpunk digital circuit sparks.' },
  { id: 'off', name: 'Disabled', description: 'Turn off mouse track animations.' },
];

export function getNextMouseTrackStyle(current: MouseTrackStyle): MouseTrackStyle {
  const styles: MouseTrackStyle[] = ['stardust', 'neon-ribbon', 'matrix-sparks', 'off'];
  const idx = styles.indexOf(current);
  return styles[(idx + 1) % styles.length] || 'stardust';
}
