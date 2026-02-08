type ContentMode = 'scripture' | 'hymn';

interface TabSwitcherProps {
  activeTab: ContentMode;
  onTabChange: (tab: ContentMode) => void;
}

export function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <div className="flex justify-center mb-10">
      <div className="relative inline-flex items-center gap-1 p-1 rounded-xl"
           style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <button
          onClick={() => onTabChange('scripture')}
          className={`relative px-7 py-2.5 rounded-[10px] text-sm font-sans font-medium tracking-wide transition-all duration-300 ${
            activeTab === 'scripture'
              ? 'text-white shadow-lg'
              : 'text-white/40 hover:text-white/70'
          }`}
          style={activeTab === 'scripture' ? {
            background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`,
            boxShadow: '0 2px 12px -2px var(--theme-primary)',
          } : {}}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            Scripture
          </span>
        </button>
        <button
          onClick={() => onTabChange('hymn')}
          className={`relative px-7 py-2.5 rounded-[10px] text-sm font-sans font-medium tracking-wide transition-all duration-300 ${
            activeTab === 'hymn'
              ? 'text-white shadow-lg'
              : 'text-white/40 hover:text-white/70'
          }`}
          style={activeTab === 'hymn' ? {
            background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`,
            boxShadow: '0 2px 12px -2px var(--theme-primary)',
          } : {}}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
            </svg>
            Hymns
          </span>
        </button>
      </div>
    </div>
  );
}
