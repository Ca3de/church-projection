type ContentMode = 'scripture' | 'hymn';

interface TabSwitcherProps {
  activeTab: ContentMode;
  onTabChange: (tab: ContentMode) => void;
}

export function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex rounded-lg p-1 bg-white/10 backdrop-blur-sm">
        <button
          onClick={() => onTabChange('scripture')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'scripture'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Scripture
        </button>
        <button
          onClick={() => onTabChange('hymn')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'hymn'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Hymns
        </button>
      </div>
    </div>
  );
}
