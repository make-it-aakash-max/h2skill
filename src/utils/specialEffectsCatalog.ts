export type SpecialEffectMode = 'crisscross' | 'pulse-burst' | 'matrix-circuit' | 'aurora-glow';

export interface SpecialEffectOption {
  id: SpecialEffectMode;
  name: string;
  description: string;
  iconName: string;
}

export const SPECIAL_EFFECTS_CATALOG: SpecialEffectOption[] = [
  {
    id: 'crisscross',
    name: 'Crisscross Shutter',
    description: 'Alternating vertical sliding slats with diagonal laser beams.',
    iconName: 'Zap',
  },
  {
    id: 'pulse-burst',
    name: 'Radial Pulse Burst',
    description: 'Expanding energetic ripple waves across the viewport.',
    iconName: 'Activity',
  },
  {
    id: 'matrix-circuit',
    name: 'Circuit Matrix',
    description: 'Cyberpunk glowing pulse waves and data nodes.',
    iconName: 'Cpu',
  },
  {
    id: 'aurora-glow',
    name: 'Neon Aurora',
    description: 'Smooth shifting atmospheric color waves and spotlights.',
    iconName: 'Sparkles',
  },
];

export function getRandomSpecialEffect(): SpecialEffectMode {
  const modes: SpecialEffectMode[] = ['crisscross', 'pulse-burst', 'matrix-circuit', 'aurora-glow'];
  const index = Math.floor(Math.random() * modes.length);
  return modes[index] || 'crisscross';
}
