import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { MouseTracker } from '../components/MouseTracker.tsx';
import { ThemeCrisscrossTransition } from '../components/ThemeCrisscrossTransition.tsx';
import { calculateTargetResolved } from '../utils/themeEffects.ts';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isTransitioning: boolean;
  transitionDirection: 'to-dark' | 'to-light' | null;
  mouseTrackEnabled: boolean;
  setMouseTrackEnabled: (enabled: boolean) => void;
  triggerCrisscrossEffect: (direction?: 'to-dark' | 'to-light') => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'skillpath_theme';
const MOUSE_FX_STORAGE_KEY = 'skillpath_mouse_fx';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      return stored === 'light' || stored === 'dark' || stored === 'system'
        ? stored
        : 'system';
    } catch {
      return 'system';
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === 'dark') return 'dark';
      if (stored === 'light') return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch {
      return 'light';
    }
  });

  const [mouseTrackEnabled, setMouseTrackEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const stored = localStorage.getItem(MOUSE_FX_STORAGE_KEY);
      return stored !== 'false';
    } catch {
      return true;
    }
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<
    'to-dark' | 'to-light' | null
  >(null);

  const transitionTimerRef = useRef<{ mid?: number; finish?: number }>({});

  const applyDomTheme = (active: ResolvedTheme) => {
    const root = document.documentElement;
    if (active === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  };

  // Synchronize on mount and handle system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const initial = calculateTargetResolved(theme, mediaQuery.matches);
    setResolvedTheme(initial);
    applyDomTheme(initial);

    const onSystemChange = () => {
      if (theme === 'system') {
        const nextResolved = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(nextResolved);
        applyDomTheme(nextResolved);
      }
    };

    mediaQuery.addEventListener('change', onSystemChange);
    return () => mediaQuery.removeEventListener('change', onSystemChange);
  }, [theme]);

  const clearTimers = () => {
    if (transitionTimerRef.current.mid) {
      window.clearTimeout(transitionTimerRef.current.mid);
    }
    if (transitionTimerRef.current.finish) {
      window.clearTimeout(transitionTimerRef.current.finish);
    }
  };

  const triggerCrisscrossEffect = (forcedDirection?: 'to-dark' | 'to-light') => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReduced) return;

    clearTimers();
    const dir =
      forcedDirection ?? (resolvedTheme === 'dark' ? 'to-light' : 'to-dark');
    setIsTransitioning(true);
    setTransitionDirection(dir);

    transitionTimerRef.current.finish = window.setTimeout(() => {
      setIsTransitioning(false);
      setTransitionDirection(null);
    }, 600);
  };

  const setTheme = (next: Theme) => {
    if (typeof window === 'undefined') {
      setThemeState(next);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const targetResolved = calculateTargetResolved(next, mediaQuery.matches);
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }

    // If switching between different resolved themes, run the crisscross transition
    if (targetResolved !== resolvedTheme && !prefersReduced) {
      clearTimers();
      const dir: 'to-dark' | 'to-light' =
        targetResolved === 'dark' ? 'to-dark' : 'to-light';

      setIsTransitioning(true);
      setTransitionDirection(dir);

      // Midpoint: switch DOM class while crisscross slats meet
      transitionTimerRef.current.mid = window.setTimeout(() => {
        applyDomTheme(targetResolved);
        setResolvedTheme(targetResolved);
        setThemeState(next);
      }, 250);

      // Finish: clean up transition overlay
      transitionTimerRef.current.finish = window.setTimeout(() => {
        setIsTransitioning(false);
        setTransitionDirection(null);
      }, 620);
    } else {
      // If clicking same theme or reduced motion, update immediately
      setThemeState(next);
      setResolvedTheme(targetResolved);
      applyDomTheme(targetResolved);

      // If user clicked the same resolved theme, give them a fun replay of the crisscross effect!
      if (!prefersReduced && (next === 'dark' || next === 'light')) {
        triggerCrisscrossEffect(targetResolved === 'dark' ? 'to-dark' : 'to-light');
      }
    }
  };

  const toggleTheme = () => {
    const next: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const setMouseTrackEnabled = (enabled: boolean) => {
    setMouseTrackEnabledState(enabled);
    try {
      localStorage.setItem(MOUSE_FX_STORAGE_KEY, String(enabled));
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        isTransitioning,
        transitionDirection,
        mouseTrackEnabled,
        setMouseTrackEnabled,
        triggerCrisscrossEffect,
      }}
    >
      {children}
      <ThemeCrisscrossTransition
        active={isTransitioning}
        direction={transitionDirection}
      />
      <MouseTracker enabled={mouseTrackEnabled} />
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
