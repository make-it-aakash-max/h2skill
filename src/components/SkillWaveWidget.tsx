import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface SkillTrackNode {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  color: string;
  frequency: number;
  amplitude: number;
  speed: number;
}

const SKILL_TRACKS: SkillTrackNode[] = [
  { id: '1', name: 'Python & SQL', category: 'Foundations', proficiency: 85, color: '#10b981', frequency: 0.015, amplitude: 22, speed: 0.035 },
  { id: '2', name: 'Modern JavaScript', category: 'Core Stack', proficiency: 65, color: '#38bdf8', frequency: 0.022, amplitude: 28, speed: 0.045 },
  { id: '3', name: 'React & Component Arch', category: 'Core Stack', proficiency: 45, color: '#6366f1', frequency: 0.018, amplitude: 34, speed: 0.03 },
  { id: '4', name: 'Node.js & API Services', category: 'Backend', proficiency: 30, color: '#f59e0b', frequency: 0.028, amplitude: 20, speed: 0.05 },
  { id: '5', name: '5-Agent Orchestration', category: 'AI Systems', proficiency: 90, color: '#ec4899', frequency: 0.012, amplitude: 40, speed: 0.025 },
];

export function SkillWaveWidget() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReduced = useReducedMotion();
  const [activeTrack, setActiveTrack] = useState<SkillTrackNode>(SKILL_TRACKS[1]);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    if (prefersReduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let mounted = true;

    const render = () => {
      if (!mounted || !canvas || !ctx) return;
      timeRef.current += activeTrack.speed;
      const t = timeRef.current;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Draw background ambient glow
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.75)');
      grad.addColorStop(1, 'rgba(30, 41, 59, 0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw multiple harmonic wave tracks
      SKILL_TRACKS.forEach((track, index) => {
        const isActive = track.id === activeTrack.id;
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = isActive ? 3 : 1.5;
        ctx.strokeStyle = isActive ? track.color : `${track.color}55`;
        ctx.shadowColor = track.color;
        ctx.shadowBlur = isActive ? 14 : 4;

        const sliceWidth = width / 180;
        let x = 0;

        for (let i = 0; i <= 180; i++) {
          const normX = i * sliceWidth;
          const sine1 = Math.sin(i * track.frequency + t + index * 0.7);
          const sine2 = Math.cos(i * (track.frequency * 0.6) - t * 0.5);
          const y = height / 2 + (sine1 * track.amplitude + sine2 * (track.amplitude * 0.4));

          if (i === 0) {
            ctx.moveTo(normX, y);
          } else {
            ctx.lineTo(normX, y);
          }
          x = normX;
        }
        void x;
        ctx.stroke();
        ctx.restore();
      });

      // Draw traveling pulse particles on active track
      ctx.save();
      ctx.fillStyle = activeTrack.color;
      ctx.shadowColor = activeTrack.color;
      ctx.shadowBlur = 12;
      const pulseX = ((Math.sin(t * 1.5) + 1) / 2) * width;
      const pulseY = height / 2 + Math.sin(pulseX * activeTrack.frequency + t) * activeTrack.amplitude;
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      mounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTrack]);

  return (
    <div className="relative h-full w-full min-h-[380px] flex flex-col justify-between overflow-hidden bg-slate-950 p-6 text-white">
      {/* Background Live Wave Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-85"
        style={{ width: '100%', height: '100%' }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-slate-950/20"
      />

      {/* Top Header & Track Selector Pills */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
            Interactive Skill Wave Studio
          </div>
          <h3 className="font-display text-base font-bold text-white">
            Live Career Track Frequencies
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {SKILL_TRACKS.map((track) => {
            const isSelected = track.id === activeTrack.id;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => setActiveTrack(track)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md ring-1 ring-cyan-400'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {track.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Center Active Track Details Card */}
      <div className="relative z-10 my-auto py-6">
        <motion.div
          key={activeTrack.id}
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border border-white/15 bg-slate-900/85 backdrop-blur-md p-5 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-slate-400">
                {activeTrack.category} Track
              </div>
              <div className="mt-0.5 font-display text-lg font-bold text-white">
                {activeTrack.name}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-bold tabular-nums text-cyan-300">
                {activeTrack.proficiency}%
              </div>
              <div className="text-[10px] text-slate-400">Resonance Match</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span>Adaptive Wave Modulation Active</span>
            <span className="font-semibold text-emerald-400">Optimized by 5 Agents</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Diagnostic Snapshot Bar */}
      <div className="relative z-10 rounded-xl border border-white/15 bg-slate-950/85 backdrop-blur-md p-4">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
          <div>
            <div className="text-[11px] font-medium text-sky-300">
              Sample Diagnostic Snapshot
            </div>
            <div className="font-display text-sm font-semibold text-white">
              CS Student → Full Stack Developer
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg font-bold text-white tabular-nums">
              48%
            </div>
            <div className="text-[10px] text-slate-300">Readiness</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-200">Python &amp; SQL</span>
            <span className="font-mono font-semibold text-emerald-400 tabular-nums">
              Strong (75%)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-200">HTML &amp; CSS</span>
            <span className="font-mono font-semibold text-amber-300 tabular-nums">
              52%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-200">JavaScript &amp; React</span>
            <span className="font-mono font-semibold text-rose-300 tabular-nums">
              Missing Gap
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-200">Node.js APIs</span>
            <span className="font-mono font-semibold text-rose-300 tabular-nums">
              Missing Gap
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
