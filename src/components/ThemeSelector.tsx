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
        className="btn-ghost px-2.5"
        style={isOpen ? { color: 'var(--ink-100)', background: 'var(--surface-2)', borderColor: 'var(--hairline)' } : undefined}
        title="Change theme"
      >
        {/* Colour chip — a small swatch pair reading as a ribbon */}
        <span
          className="flex overflow-hidden rounded-[3px] shrink-0"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.12)' }}
        >
          <span className="w-2 h-4" style={{ backgroundColor: currentTheme.colors.primary }} />
          <span className="w-2 h-4" style={{ backgroundColor: currentTheme.colors.secondary }} />
        </span>
        <span className="hidden sm:inline text-xs font-medium">{currentTheme.name}</span>
        {currentTheme.icon && <span className="text-xs leading-none">{currentTheme.icon}</span>}
        <svg
          className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ opacity: 0.6 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2.5 w-[17rem] max-h-[26rem] overflow-y-auto z-50 animate-scale-in scrollbar-thin"
          style={{
            background: 'rgba(12, 11, 14, 0.95)',
            backdropFilter: 'blur(28px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.2)',
            border: '1px solid var(--hairline-strong)',
            borderRadius: 'var(--r-lg)',
            boxShadow: '0 28px 60px -20px rgba(0,0,0,0.9)',
          }}
        >
          <div className="p-1.5">
            <p className="eyebrow px-3 pt-2.5 pb-2">Church Seasons</p>
            {themes.map((theme) => {
              const isActive = currentTheme.id === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    onThemeChange(theme);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg transition-colors duration-150 text-left"
                  style={
                    isActive
                      ? { background: 'var(--surface-3)', color: 'var(--ink-100)' }
                      : { color: 'var(--ink-60)' }
                  }
                >
                  <span
                    className="flex overflow-hidden rounded-[3px] shrink-0"
                    style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.12)' }}
                  >
                    <span className="w-2.5 h-6" style={{ backgroundColor: theme.colors.primary }} />
                    <span className="w-2.5 h-6" style={{ backgroundColor: theme.colors.secondary }} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="font-sans text-[13px] font-medium truncate">{theme.name}</span>
                      {theme.icon && <span className="text-[11px] leading-none">{theme.icon}</span>}
                    </span>
                    <span className="block text-[11px] truncate font-sans mt-0.5" style={{ color: 'var(--ink-40)' }}>
                      {theme.description}
                    </span>
                  </span>
                  {isActive && (
                    <svg
                      className="w-4 h-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: 'var(--theme-accent)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
