import { Moon, Sparkles, Sun, Zap, Activity, Cpu } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { SpecialEffectMode } from '../utils/specialEffectsCatalog.ts';
import { generateSlatConfigs } from '../utils/themeEffects.ts';

interface ThemeCrisscrossTransitionProps {
  active: boolean;
  direction: 'to-dark' | 'to-light' | null;
  effectMode: SpecialEffectMode;
}

export function ThemeCrisscrossTransition({
  active,
  direction,
  effectMode,
}: ThemeCrisscrossTransitionProps) {
  const prefersReduced = useReducedMotion();
  const [slats, setSlats] = useState(() => generateSlatConfigs(10, 'to-dark'));

  useEffect(() => {
    if (direction) {
      setSlats(generateSlatConfigs(10, direction));
    }
  }, [direction]);

  if (prefersReduced || !active || !direction) {
    return null;
  }

  const isToDark = direction === 'to-dark';

  return (
    <AnimatePresence>
      {active && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[100] pointer-events-none overflow-hidden select-none"
        >
          {/* EFFECT 1: CRISSCROSS SHUTTER */}
          {effectMode === 'crisscross' && (
            <>
              <div className="absolute inset-0 w-full h-full">
                {slats.map((slat) => {
                  const isEven = slat.index % 2 === 0;
                  return (
                    <motion.div
                      key={slat.index}
                      initial={{ y: isEven ? '-101%' : '101%' }}
                      animate={{ y: ['0%', isEven ? '101%' : '-101%'] }}
                      transition={{
                        duration: 0.62,
                        times: [0.42, 1],
                        delay: slat.delay,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: `${slat.leftPercent}%`,
                        width: `${slat.widthPercent}%`,
                      }}
                      className={`h-full ${
                        isToDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
                      } ${
                        isEven
                          ? isToDark
                            ? 'border-b-2 border-cyan-400 shadow-[0_6px_24px_rgba(34,211,238,0.7)]'
                            : 'border-b-2 border-blue-600 shadow-[0_6px_24px_rgba(37,99,235,0.6)]'
                          : isToDark
                            ? 'border-t-2 border-indigo-400 shadow-[0_-6px_24px_rgba(129,140,248,0.7)]'
                            : 'border-t-2 border-sky-400 shadow-[0_-6px_24px_rgba(56,189,248,0.6)]'
                      }`}
                    >
                      <div
                        className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 ${
                          isToDark
                            ? 'bg-gradient-to-b from-cyan-500/20 via-blue-500/10 to-indigo-500/20'
                            : 'bg-gradient-to-b from-blue-400/20 via-sky-400/10 to-indigo-400/20'
                        }`}
                      />
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                initial={{ x: '-120%', y: '-120%', opacity: 0 }}
                animate={{
                  x: ['-120%', '0%', '120%'],
                  y: ['-120%', '0%', '120%'],
                  opacity: [0, 0.9, 0],
                }}
                transition={{ duration: 0.52, ease: 'easeInOut' }}
                className={`absolute left-1/2 top-1/2 h-1.5 w-[200vw] -translate-x-1/2 -translate-y-1/2 rotate-45 ${
                  isToDark
                    ? 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_24px_#22d3ee]'
                    : 'bg-gradient-to-r from-transparent via-blue-600 to-transparent shadow-[0_0_24px_#2563eb]'
                }`}
              />

              <motion.div
                initial={{ x: '-120%', y: '120%', opacity: 0 }}
                animate={{
                  x: ['-120%', '0%', '120%'],
                  y: ['120%', '0%', '-120%'],
                  opacity: [0, 0.9, 0],
                }}
                transition={{ duration: 0.52, delay: 0.04, ease: 'easeInOut' }}
                className={`absolute left-1/2 top-1/2 h-1.5 w-[200vw] -translate-x-1/2 -translate-y-1/2 -rotate-45 ${
                  isToDark
                    ? 'bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_24px_#818cf8]'
                    : 'bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_24px_#38bdf8]'
                }`}
              />
            </>
          )}

          {/* EFFECT 2: PULSE BURST */}
          {effectMode === 'pulse-burst' && (
            <div className="absolute inset-0 flex items-center justify-center">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0.9 }}
                  animate={{ scale: 4.5, opacity: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: i * 0.12,
                    ease: 'easeOut',
                  }}
                  className={`absolute rounded-full border-2 ${
                    isToDark ? 'border-cyan-400 shadow-[0_0_30px_#22d3ee]' : 'border-blue-600 shadow-[0_0_30px_#2563eb]'
                  }`}
                  style={{ width: '300px', height: '300px' }}
                />
              ))}
              <div
                className={`absolute inset-0 ${
                  isToDark ? 'bg-slate-950/80' : 'bg-slate-100/80'
                }`}
              />
            </div>
          )}

          {/* EFFECT 3: MATRIX CIRCUIT */}
          {effectMode === 'matrix-circuit' && (
            <div className="absolute inset-0 bg-slate-950/95 flex justify-around overflow-hidden">
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: '-100%', opacity: 0 }}
                  animate={{ y: ['0%', '120%'], opacity: [0, 1, 0] }}
                  transition={{
                    duration: 0.5 + (i % 3) * 0.15,
                    delay: i * 0.03,
                    repeat: 1,
                  }}
                  className="w-1.5 bg-gradient-to-b from-cyan-400 via-emerald-400 to-transparent shadow-[0_0_12px_#22d3ee]"
                />
              ))}
            </div>
          )}

          {/* EFFECT 4: NEON AURORA */}
          {effectMode === 'aurora-glow' && (
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                initial={{ x: '-100%', y: '-100%', opacity: 0 }}
                animate={{ x: ['-100%', '0%', '100%'], opacity: [0, 0.85, 0] }}
                transition={{ duration: 0.65, ease: 'easeInOut' }}
                className="absolute inset-0 bg-gradient-to-tr from-blue-600/75 via-indigo-600/75 to-cyan-400/75 blur-3xl"
              />
            </div>
          )}

          {/* Central Emblem */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: [0.6, 1.08, 0.96, 0.5],
                opacity: [0, 1, 1, 0],
              }}
              transition={{ duration: 0.54, times: [0, 0.38, 0.72, 1], ease: 'easeOut' }}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl border px-6 py-4 shadow-2xl backdrop-blur-md ${
                isToDark
                  ? 'border-cyan-400/40 bg-slate-950/85 text-white shadow-[0_0_40px_rgba(34,211,238,0.35)]'
                  : 'border-blue-500/40 bg-white/90 text-slate-900 shadow-[0_0_40px_rgba(37,99,235,0.25)]'
              }`}
            >
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg">
                {effectMode === 'crisscross' ? (
                  <Zap className="h-6 w-6 text-cyan-200 animate-pulse" aria-hidden="true" />
                ) : effectMode === 'pulse-burst' ? (
                  <Activity className="h-6 w-6 text-emerald-200 animate-pulse" aria-hidden="true" />
                ) : effectMode === 'matrix-circuit' ? (
                  <Cpu className="h-6 w-6 text-cyan-300 animate-pulse" aria-hidden="true" />
                ) : (
                  <Sparkles className="h-6 w-6 text-amber-200 animate-pulse" aria-hidden="true" />
                )}
              </div>

              <div className="text-center">
                <div className="font-mono text-[10px] tracking-widest uppercase font-semibold text-sky-400 dark:text-cyan-300">
                  {effectMode.replace('-', ' ').toUpperCase()}
                </div>
                <div className="font-display text-sm font-bold tracking-tight">
                  {isToDark ? 'Dark Theme Activated' : 'Light Theme Activated'}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
