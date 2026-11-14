import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext.tsx';
import {
  createMouseParticle,
  DARK_THEME_PALETTE,
  LIGHT_THEME_PALETTE,
  type Particle,
} from '../utils/themeEffects.ts';

interface MouseTrackerProps {
  enabled?: boolean;
}

export function MouseTracker({ enabled = true }: MouseTrackerProps) {
  const { resolvedTheme, isTransitioning } = useTheme();
  const prefersReduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Position state with lerp smoothing
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

  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  // Trigger crisscross burst on theme transition
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

    // Spawn radial burst of particles
    const burstCount = 28;
    for (let i = 0; i < burstCount; i++) {
      const angle = (i / burstCount) * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      particlesRef.current.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 2,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015,
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
      // Smooth lerp to target
      m.x += (m.targetX - m.x) * 0.22;
      m.y += (m.targetY - m.y) * 0.22;

      const dx = m.targetX - m.prevX;
      const dy = m.targetY - m.prevY;
      m.speed = Math.sqrt(dx * dx + dy * dy);
      m.prevX = m.targetX;
      m.prevY = m.targetY;

      // Draw Cursor Crosshair / Reticle when active
      if (m.active && m.x > 0 && m.y > 0) {
        const isDark = resolvedTheme === 'dark';
        const primaryColor = isDark ? 'rgba(56, 189, 248, 0.85)' : 'rgba(37, 99, 235, 0.85)';
        const glowColor = isDark ? 'rgba(34, 211, 238, 0.3)' : 'rgba(59, 130, 246, 0.25)';

        // Soft cursor aura
        const gradient = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 42);
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 42, 0, Math.PI * 2);
        ctx.fill();

        // Crisscross Reticle Diagonal tick marks (X crisscross)
        const crossSize = Math.min(10, Math.max(5, m.speed * 0.35 + 5));
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.25;

        // Diagonal line 1 (\)
        ctx.beginPath();
        ctx.moveTo(m.x - crossSize, m.y - crossSize);
        ctx.lineTo(m.x + crossSize, m.y + crossSize);
        ctx.stroke();

        // Diagonal line 2 (/)
        ctx.beginPath();
        ctx.moveTo(m.x - crossSize, m.y + crossSize);
        ctx.lineTo(m.x + crossSize, m.y - crossSize);
        ctx.stroke();

        // Central core dot
        ctx.fillStyle = isDark ? '#ffffff' : '#1e3a8a';
        ctx.beginPath();
        ctx.arc(m.x, m.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update and draw trailing particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Sleep loop if mouse is stopped and all particles have faded
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
    if (!enabled || prefersReduced) return;

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

      // Spawn 1-2 trailing micro-particles on movement
      if (Math.random() < 0.65) {
        const vx = (Math.random() - 0.5) * 1.5;
        const vy = (Math.random() - 0.5) * 1.5;
        particlesRef.current.push(
          createMouseParticle(e.clientX, e.clientY, vx, vy, resolvedTheme),
        );
      }

      startLoop();
    };

    const onMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      // Spawn subtle click ripple particles
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        particlesRef.current.push(
          createMouseParticle(
            e.clientX,
            e.clientY,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            resolvedTheme,
          ),
        );
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
  }, [enabled, prefersReduced, resolvedTheme]);

  if (!enabled || prefersReduced) {
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
