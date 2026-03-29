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
  // ── Beautiful / Aesthetic Themes ──
  {
    id: 'midnight-aurora',
    name: 'Midnight Aurora',
    description: 'Deep night sky with aurora glow',
    colors: {
      primary: '#67e8f9',
      secondary: '#a78bfa',
      background: '#020617',
      backgroundEnd: '#0f172a',
      text: '#f0f9ff',
      textMuted: 'rgba(224, 242, 254, 0.55)',
      accent: '#22d3ee',
    },
    icon: '🌌',
    animation: {
      type: 'sparkles',
      intensity: 'light',
      color: 'rgba(103, 232, 249, 0.4)',
    },
  },
  {
    id: 'rose-garden',
    name: 'Rose Garden',
    description: 'Soft blush pinks and warm ivory',
    colors: {
      primary: '#fb7185',
      secondary: '#f9a8d4',
      background: '#1c0a13',
      backgroundEnd: '#2a0e1e',
      text: '#fff1f2',
      textMuted: 'rgba(255, 241, 242, 0.6)',
      accent: '#fda4af',
    },
    icon: '🌹',
    animation: {
      type: 'leaves',
      intensity: 'light',
      color: '#fb7185',
    },
  },
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    description: 'Serene deep ocean blues and teals',
    colors: {
      primary: '#06b6d4',
      secondary: '#0891b2',
      background: '#042f2e',
      backgroundEnd: '#0c1e2e',
      text: '#ecfeff',
      textMuted: 'rgba(236, 254, 255, 0.55)',
      accent: '#67e8f9',
    },
    icon: '🌊',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    description: 'Warm sunset amber and soft peach',
    colors: {
      primary: '#f59e0b',
      secondary: '#fb923c',
      background: '#1a0f00',
      backgroundEnd: '#27150a',
      text: '#fffbeb',
      textMuted: 'rgba(255, 251, 235, 0.6)',
      accent: '#fcd34d',
    },
    icon: '🌅',
    animation: {
      type: 'sparkles',
      intensity: 'light',
      color: 'rgba(252, 211, 77, 0.3)',
    },
  },
  {
    id: 'celestial',
    name: 'Celestial',
    description: 'Heavenly white and soft lavender',
    colors: {
      primary: '#e0e7ff',
      secondary: '#c7d2fe',
      background: '#0f0b2e',
      backgroundEnd: '#1e1b4b',
      text: '#eef2ff',
      textMuted: 'rgba(238, 242, 255, 0.6)',
      accent: '#a5b4fc',
    },
    icon: '✨',
    animation: {
      type: 'sparkles',
      intensity: 'normal',
      color: 'rgba(165, 180, 252, 0.5)',
    },
  },
  {
    id: 'emerald-sanctuary',
    name: 'Emerald Sanctuary',
    description: 'Rich emerald with gold accents',
    colors: {
      primary: '#34d399',
      secondary: '#6ee7b7',
      background: '#022c22',
      backgroundEnd: '#064e3b',
      text: '#ecfdf5',
      textMuted: 'rgba(236, 253, 245, 0.55)',
      accent: '#a7f3d0',
    },
    icon: '💎',
  },
  {
    id: 'royal-velvet',
    name: 'Royal Velvet',
    description: 'Rich burgundy and deep gold',
    colors: {
      primary: '#e11d48',
      secondary: '#fbbf24',
      background: '#1a0010',
      backgroundEnd: '#2d0a1e',
      text: '#fff1f2',
      textMuted: 'rgba(255, 241, 242, 0.55)',
      accent: '#fda4af',
    },
    icon: '👑',
  },
  {
    id: 'starlight',
    name: 'Starlight',
    description: 'Soft silver and pale moonlight',
    colors: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
      background: '#020617',
      backgroundEnd: '#0f172a',
      text: '#f8fafc',
      textMuted: 'rgba(248, 250, 252, 0.5)',
      accent: '#cbd5e1',
    },
    icon: '🌟',
    animation: {
      type: 'sparkles',
      intensity: 'light',
      color: 'rgba(226, 232, 240, 0.3)',
    },
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
