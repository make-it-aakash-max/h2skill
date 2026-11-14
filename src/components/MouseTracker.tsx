import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext.tsx';
import type { MouseTrackStyle } from '../utils/mouseTrackCatalog.ts';
import {
  createMouseParticle,
  DARK_THEME_PALETTE,
  LIGHT_THEME_PALETTE,
  type Particle,
} from '../utils/themeEffects.ts';

interface MouseTrackerProps {
  enabled?: boolean;
  styleMode?: MouseTrackStyle;
}

export function MouseTracker({
  enabled = true,
  styleMode = 'stardust',
}: MouseTrackerProps) {
  const { resolvedTheme, isTransitioning } = useTheme();
  const prefersReduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const mouseRef = useRef({
    x: -100,
    y: -100,
    targetX: -100,
    targetY: -100,
    prevX: -100,
    prevY: -100,
    speed: 0,
    active: false,
  });

  const pathPointsRef = useRef<Array<{ x: number; y: number; alpha: number }>>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!enabled || prefersReduced || !isTransitioning) return;

    const canvas = canvasRef.current;
    const originX =
      mouseRef.current.active && mouseRef.current.x > 0
        ? mouseRef.current.x
        : (canvas?.width ?? window.innerWidth) / 2;
    const originY =
      mouseRef.current.active && mouseRef.current.y > 0
        ? mouseRef.current.y
        : (canvas?.height ?? window.innerHeight) / 2;

    const burstCount = 32;
    for (let i = 0; i < burstCount; i++) {
      const angle = (i / burstCount) * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particlesRef.current.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.012,
        color:
          resolvedTheme === 'dark'
            ? DARK_THEME_PALETTE[i % DARK_THEME_PALETTE.length]
            : LIGHT_THEME_PALETTE[i % LIGHT_THEME_PALETTE.length],
      });
    }

    if (!isRunningRef.current) {
      startLoop();
    }
  }, [isTransitioning, enabled, prefersReduced, resolvedTheme]);

  const startLoop = () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        isRunningRef.current = false;
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        isRunningRef.current = false;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const m = mouseRef.current;
      m.x += (m.targetX - m.x) * 0.25;
      m.y += (m.targetY - m.y) * 0.25;

      const dx = m.targetX - m.prevX;
      const dy = m.targetY - m.prevY;
      m.speed = Math.sqrt(dx * dx + dy * dy);
      m.prevX = m.targetX;
      m.prevY = m.targetY;

      // Store path for neon-ribbon
      if (m.active && m.x > 0 && m.y > 0 && styleMode === 'neon-ribbon') {
        pathPointsRef.current.push({ x: m.x, y: m.y, alpha: 1 });
        if (pathPointsRef.current.length > 28) {
          pathPointsRef.current.shift();
        }
      }

      // Draw Neon Ribbon Path
      if (styleMode === 'neon-ribbon' && pathPointsRef.current.length > 1) {
        ctx.save();
        ctx.lineWidth = 3.5;
        const isDark = resolvedTheme === 'dark';
        ctx.strokeStyle = isDark ? '#38bdf8' : '#2563eb';
        ctx.shadowColor = isDark ? '#22d3ee' : '#3b82f6';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        const pts = pathPointsRef.current;
        for (let i = 0; i < pts.length; i++) {
          const pt = pts[i];
          pt.alpha *= 0.94;
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Draw Cursor Reticle
      if (m.active && m.x > 0 && m.y > 0) {
        const isDark = resolvedTheme === 'dark';
        const primaryColor =
          styleMode === 'matrix-sparks'
            ? isDark
              ? '#22c55e'
              : '#16a34a'
            : isDark
              ? 'rgba(56, 189, 248, 0.9)'
              : 'rgba(37, 99, 235, 0.9)';

        const glowColor =
          styleMode === 'matrix-sparks'
            ? 'rgba(34, 197, 94, 0.3)'
            : isDark
              ? 'rgba(34, 211, 238, 0.3)'
              : 'rgba(59, 130, 246, 0.25)';

        const gradient = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 48);
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 48, 0, Math.PI * 2);
        ctx.fill();

        const crossSize = Math.min(12, Math.max(6, m.speed * 0.4 + 6));
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(m.x - crossSize, m.y - crossSize);
        ctx.lineTo(m.x + crossSize, m.y + crossSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(m.x - crossSize, m.y + crossSize);
        ctx.lineTo(m.x + crossSize, m.y - crossSize);
        ctx.stroke();

        ctx.fillStyle = isDark ? '#ffffff' : '#1e3a8a';
        ctx.beginPath();
        ctx.arc(m.x, m.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update and draw trailing particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        if (styleMode === 'matrix-sparks') {
          ctx.rect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
      }

      if (!m.active || (m.speed < 0.2 && particles.length === 0)) {
        isRunningRef.current = false;
        animFrameRef.current = null;
        return;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
  };

  useEffect(() => {
    if (!enabled || styleMode === 'off' || prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const onMouseMove = (e: MouseEvent) => {
      const m = mouseRef.current;
      m.targetX = e.clientX;
      m.targetY = e.clientY;
      m.active = true;

      const spawnChance = styleMode === 'matrix-sparks' ? 0.8 : 0.6;
      if (Math.random() < spawnChance) {
        const vx = (Math.random() - 0.5) * 1.8;
        const vy = (Math.random() - 0.5) * 1.8;
        const particle = createMouseParticle(e.clientX, e.clientY, vx, vy, resolvedTheme);
        if (styleMode === 'matrix-sparks') {
          particle.color = resolvedTheme === 'dark' ? '#22c55e' : '#15803d';
        }
        particlesRef.current.push(particle);
      }

      startLoop();
    };

    const onMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.5 + 1;
        const p = createMouseParticle(
          e.clientX,
          e.clientY,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          resolvedTheme,
        );
        if (styleMode === 'matrix-sparks') {
          p.color = '#4ade80';
        }
        particlesRef.current.push(p);
      }
      startLoop();
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mousedown', onMouseDown, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('mousedown', onMouseDown);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      isRunningRef.current = false;
    };
  }, [enabled, styleMode, prefersReduced, resolvedTheme]);

  if (!enabled || styleMode === 'off' || prefersReduced) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 h-full w-full"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
