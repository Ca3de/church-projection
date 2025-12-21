import type { AnimationType, AnimationIntensity } from '../animations/types';

export interface AnimationConfig {
  type: AnimationType;
  intensity: AnimationIntensity;
  color?: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    backgroundEnd: string;
    text: string;
    textMuted: string;
    accent: string;
  };
  icon?: string;
  animation?: AnimationConfig;
}

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Classic dark theme',
    colors: {
      primary: '#f59e0b',
      secondary: '#d97706',
      background: '#0c0a09',
      backgroundEnd: '#1c1917',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      accent: '#fbbf24',
    },
  },
  {
    id: 'christmas',
    name: 'Christmas',
    description: 'Festive red and green',
    colors: {
      primary: '#dc2626',
      secondary: '#166534',
      background: '#14532d',
      backgroundEnd: '#052e16',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.7)',
      accent: '#fbbf24',
    },
    icon: '🎄',
    animation: {
      type: 'snow',
      intensity: 'normal',
    },
  },
  {
    id: 'advent',
    name: 'Advent',
    description: 'Purple and rose',
    colors: {
      primary: '#7c3aed',
      secondary: '#db2777',
      background: '#2e1065',
      backgroundEnd: '#1e1b4b',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.7)',
      accent: '#c4b5fd',
    },
    icon: '🕯️',
    animation: {
      type: 'snow',
      intensity: 'light',
      color: 'rgba(196, 181, 253, 0.6)',
    },
  },
  {
    id: 'lent',
    name: 'Lent',
    description: 'Solemn purple',
    colors: {
      primary: '#9333ea',
      secondary: '#6b21a8',
      background: '#3b0764',
      backgroundEnd: '#1e1b4b',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      accent: '#a855f7',
    },
    icon: '✝️',
  },
  {
    id: 'palm-sunday',
    name: 'Palm Sunday',
    description: 'Green and gold',
    colors: {
      primary: '#16a34a',
      secondary: '#ca8a04',
      background: '#14532d',
      backgroundEnd: '#052e16',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.7)',
      accent: '#fde047',
    },
    icon: '🌿',
    animation: {
      type: 'leaves',
      intensity: 'normal',
      color: '#16a34a',
    },
  },
  {
    id: 'good-friday',
    name: 'Good Friday',
    description: 'Somber dark theme',
    colors: {
      primary: '#991b1b',
      secondary: '#7f1d1d',
      background: '#1c1917',
      backgroundEnd: '#0c0a09',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.5)',
      accent: '#b91c1c',
    },
    icon: '✝️',
  },
  {
    id: 'easter',
    name: 'Easter',
    description: 'Joyful white and gold',
    colors: {
      primary: '#fbbf24',
      secondary: '#f8fafc',
      background: '#1e3a8a',
      backgroundEnd: '#172554',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.8)',
      accent: '#fef08a',
    },
    icon: '🌅',
    animation: {
      type: 'sparkles',
      intensity: 'normal',
    },
  },
  {
    id: 'pentecost',
    name: 'Pentecost',
    description: 'Red and flame',
    colors: {
      primary: '#ef4444',
      secondary: '#f97316',
      background: '#7f1d1d',
      backgroundEnd: '#450a0a',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.7)',
      accent: '#fbbf24',
    },
    icon: '🔥',
    animation: {
      type: 'flames',
      intensity: 'normal',
    },
  },
  {
    id: 'trinity',
    name: 'Trinity Sunday',
    description: 'White and gold',
    colors: {
      primary: '#fbbf24',
      secondary: '#f8fafc',
      background: '#1e3a8a',
      backgroundEnd: '#0c4a6e',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.7)',
      accent: '#fef3c7',
    },
    icon: '☘️',
    animation: {
      type: 'sparkles',
      intensity: 'light',
    },
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    description: 'Warm autumn colors',
    colors: {
      primary: '#ea580c',
      secondary: '#b45309',
      background: '#431407',
      backgroundEnd: '#1c1917',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.7)',
      accent: '#fdba74',
    },
    icon: '🍂',
    animation: {
      type: 'leaves',
      intensity: 'normal',
    },
  },
  {
    id: 'new-year',
    name: 'New Year',
    description: 'Gold and midnight blue',
    colors: {
      primary: '#fbbf24',
      secondary: '#f59e0b',
      background: '#172554',
      backgroundEnd: '#0f172a',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.7)',
      accent: '#fef08a',
    },
    icon: '🎆',
    animation: {
      type: 'sparkles',
      intensity: 'heavy',
    },
  },
  {
    id: 'all-saints',
    name: 'All Saints Day',
    description: 'White and gold',
    colors: {
      primary: '#fbbf24',
      secondary: '#f8fafc',
      background: '#1e1b4b',
      backgroundEnd: '#0f172a',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.7)',
      accent: '#fef3c7',
    },
    icon: '👼',
    animation: {
      type: 'sparkles',
      intensity: 'light',
      color: '#ffffff',
    },
  },
  {
    id: 'ordinary',
    name: 'Ordinary Time',
    description: 'Green for ordinary time',
    colors: {
      primary: '#22c55e',
      secondary: '#16a34a',
      background: '#14532d',
      backgroundEnd: '#0c0a09',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      accent: '#86efac',
    },
    icon: '🌿',
  },
];

export function getThemeById(id: string): Theme {
  return themes.find((t) => t.id === id) || themes[0];
}

export function getThemeCSSVariables(theme: Theme): Record<string, string> {
  return {
    '--theme-primary': theme.colors.primary,
    '--theme-secondary': theme.colors.secondary,
    '--theme-background': theme.colors.background,
    '--theme-background-end': theme.colors.backgroundEnd,
    '--theme-text': theme.colors.text,
    '--theme-text-muted': theme.colors.textMuted,
    '--theme-accent': theme.colors.accent,
  };
}
