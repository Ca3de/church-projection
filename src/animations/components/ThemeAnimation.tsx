import { useState, useEffect } from 'react';
import type { AnimationType, AnimationIntensity } from '../types';
import { useMouseTracking } from '../hooks/useMouseTracking';
import { SnowEffect } from './SnowEffect';
import { FlameEffect } from './FlameEffect';
import { SparkleEffect } from './SparkleEffect';
import { LeavesEffect } from './LeavesEffect';

interface ThemeAnimationProps {
  animationType: AnimationType;
  intensity: AnimationIntensity;
  color?: string;
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  enabled?: boolean;
}

export function ThemeAnimation({
  animationType,
  intensity,
  color,
  themeColors,
  enabled = true,
}: ThemeAnimationProps) {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  const mouse = useMouseTracking(enabled && animationType !== null);

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Don't render if disabled, no animation, or reduced motion preferred
  if (!enabled || !animationType || prefersReducedMotion) {
    return null;
  }

  const animationProps = {
    width: dimensions.width,
    height: dimensions.height,
    mouse,
    intensity,
    color,
    themeColors,
  };

  const renderAnimation = () => {
    switch (animationType) {
      case 'snow':
        return <SnowEffect {...animationProps} />;
      case 'flames':
        return <FlameEffect {...animationProps} />;
      case 'sparkles':
        return <SparkleEffect {...animationProps} />;
      case 'leaves':
        return <LeavesEffect {...animationProps} />;
      case 'fireworks':
        // Fireworks can use sparkles with different settings for now
        return <SparkleEffect {...animationProps} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {renderAnimation()}
    </div>
  );
}
