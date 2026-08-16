type ContentMode = 'scripture' | 'hymn';

interface TabSwitcherProps {
  activeTab: ContentMode;
  onTabChange: (tab: ContentMode) => void;
}

const TABS: { id: ContentMode; label: string; path: string }[] = [
  {
    id: 'scripture',
    label: 'Scripture',
    path: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
  },
  {
    id: 'hymn',
    label: 'Hymns',
    path: 'm9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z',
  },
];

export function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  const activeIndex = TABS.findIndex((t) => t.id === activeTab);

  return (
    <div className="flex justify-center mb-7" style={{ animation: 'fadeIn 1s var(--ease-out) both' }}>
      <div
        className="relative inline-flex items-center p-1 rounded-2xl"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--hairline)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
        }}
        role="tablist"
      >
        {/* Sliding indicator — one element that travels, so the motion reads as continuous */}
        <div
          aria-hidden="true"
          className="absolute top-1 bottom-1 rounded-[13px] pointer-events-none"
          style={{
            width: `calc((100% - 0.5rem) / ${TABS.length})`,
            left: '0.25rem',
            transform: `translateX(${activeIndex * 100}%)`,
            background: 'linear-gradient(150deg, var(--theme-primary), var(--theme-secondary))',
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.28) inset, 0 6px 18px -8px var(--theme-primary), 0 1px 3px rgba(0,0,0,0.35)',
            transition: 'transform 0.55s var(--ease-out)',
          }}
        />

        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className="relative z-10 flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 rounded-[13px] text-sm font-sans font-medium transition-colors duration-300 focus:outline-none"
              style={{
                letterSpacing: '0.015em',
                color: isActive ? '#fff' : 'var(--ink-60)',
                // basis:0 so both tabs are exactly equal width and the
                // sliding indicator (width = 1/n) lines up with them.
                flex: '1 1 0',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--ink-80)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--ink-60)';
              }}
            >
              <svg
                className="w-[17px] h-[17px] shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                style={{ opacity: isActive ? 1 : 0.75 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.path} />
              </svg>
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
