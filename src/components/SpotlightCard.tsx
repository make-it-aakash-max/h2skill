import { motion, useReducedMotion } from 'motion/react';
import { type MouseEvent, type ReactNode, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext.tsx';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverLift?: boolean;
  delay?: number;
}

export function SpotlightCard({
  children,
  className = '',
  onClick,
  hoverLift = true,
  delay = 0,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const [spot, setSpot] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setSpot({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

  const handleMouseLeave = () => {
    setSpot((prev) => ({ ...prev, active: false }));
  };

  const sheenColor =
    resolvedTheme === 'dark'
      ? 'rgba(59, 130, 246, 0.14)'
      : 'rgba(29, 78, 216, 0.065)';

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={prefersReduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: 'easeOut' }}
      whileHover={prefersReduced || !hoverLift ? undefined : { y: -2 }}
      className={`relative overflow-hidden transition-colors ${className}`}
    >
      {/* GPU-composited radial spotlight sheen */}
      {!prefersReduced && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: spot.active ? 1 : 0,
            background: `radial-gradient(420px circle at ${spot.x}px ${spot.y}px, ${sheenColor}, transparent 68%)`,
          }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}
