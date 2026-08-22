type ContentMode = 'scripture' | 'hymn';

interface TabSwitcherProps {
  activeTab: ContentMode;
  onTabChange: (tab: ContentMode) => void;
}

const TABS: { id: ContentMode; label: string }[] = [
  { id: 'scripture', label: 'Scripture' },
  { id: 'hymn', label: 'Hymns' },
];

export function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <div
      className="flex justify-center"
      style={{ animation: 'fadeIn 1s var(--ease-out) both' }}
      role="tablist"
    >
      <div className="flex items-stretch gap-8 sm:gap-12">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className="group relative pb-3 pt-1 px-1 font-display transition-colors duration-400 focus:outline-none"
              style={{
                fontSize: '0.78rem',
                fontWeight: 500,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                textIndent: '0.26em',
                color: isActive ? 'var(--ink-100)' : 'var(--ink-40)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--ink-80)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--ink-40)';
              }}
            >
              {tab.label}

              {/* Gold rule that draws in under the active tab */}
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 bottom-0 h-px origin-center"
                style={{
                  background: 'var(--theme-accent)',
                  transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                  opacity: isActive ? 0.9 : 0,
                  transition: 'transform 0.5s var(--ease-out), opacity 0.4s var(--ease-out)',
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
