export type AnimationType = 'snow' | 'flames' | 'sparkles' | 'leaves' | 'fireworks' | null;
export type AnimationIntensity = 'light' | 'normal' | 'heavy';

export interface AnimationConfig {
  type: AnimationType;
  intensity: AnimationIntensity;
  color?: string; // Override default color
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  color?: string;
}

export interface MouseState {
  x: number;
  y: number;
  isIdle: boolean;
  velocity: number;
}

export interface AnimationProps {
  width: number;
  height: number;
  mouse: MouseState;
  intensity: AnimationIntensity;
  color?: string;
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Particle count based on intensity
export const PARTICLE_COUNTS: Record<AnimationIntensity, number> = {
  light: 40,
  normal: 80,
  heavy: 150,
};
