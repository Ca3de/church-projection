import { useState, useRef, useEffect } from 'react';
import { themes, type Theme } from '../config/themes';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function ThemeSelector({
  currentTheme,
  onThemeChange,
}: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-white/50 hover:text-white/80"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        title="Change theme"
      >
        <div className="flex gap-0.5">
          <div className="w-2.5 h-5 rounded-l-sm" style={{ backgroundColor: currentTheme.colors.primary }} />
          <div className="w-2.5 h-5 rounded-r-sm" style={{ backgroundColor: currentTheme.colors.secondary }} />
        </div>
        <span className="hidden sm:inline text-xs font-sans">{currentTheme.name}</span>
        {currentTheme.icon && <span className="text-xs">{currentTheme.icon}</span>}
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 max-h-[420px] overflow-y-auto z-50 animate-scale-in rounded-xl scrollbar-thin"
             style={{ background: 'rgba(12, 12, 20, 0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="p-2">
            <p className="text-[10px] text-white/25 uppercase tracking-[0.2em] px-3 py-2 font-sans font-medium">
              Church Seasons
            </p>
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  onThemeChange(theme);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-left ${
                  currentTheme.id === theme.id
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
                style={currentTheme.id === theme.id ? {
                  background: 'rgba(255,255,255,0.06)',
                } : {}}
              >
                <div className="flex-shrink-0 flex gap-px">
                  <div className="w-2.5 h-5 rounded-l-sm" style={{ backgroundColor: theme.colors.primary }} />
                  <div className="w-2.5 h-5 rounded-r-sm" style={{ backgroundColor: theme.colors.secondary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-sm truncate">{theme.name}</span>
                    {theme.icon && <span className="text-xs">{theme.icon}</span>}
                  </div>
                  <p className="text-[10px] text-white/25 truncate font-sans">
                    {theme.description}
                  </p>
                </div>
                {currentTheme.id === theme.id && (
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--theme-accent)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
