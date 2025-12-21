import { liturgyItems, type LiturgyItem } from '../data/liturgy';

interface QuickActionsProps {
  onSelectLiturgy: (item: LiturgyItem) => void;
  onPasteContent: () => void;
}

export function QuickActions({ onSelectLiturgy, onPasteContent }: QuickActionsProps) {
  return (
    <div className="w-full max-w-2xl animate-slide-up">
      <div className="glass-panel p-6">
        <h3 className="text-white/70 text-sm font-medium mb-4 text-center uppercase tracking-wider">
          Quick Actions
        </h3>

        {/* Liturgy buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {liturgyItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectLiturgy(item)}
              className="btn-secondary py-3 px-4 text-sm font-medium flex flex-col items-center gap-1 hover:scale-105 transition-transform"
              title={item.title}
            >
              <span className="text-lg">
                {item.type === 'creed' ? '✝️' : '🎵'}
              </span>
              <span>{item.shortTitle}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-white/30 text-xs uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Paste button */}
        <button
          onClick={onPasteContent}
          className="w-full btn-secondary py-4 flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>Paste Text or Image</span>
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs ml-2">
            Ctrl+V
          </kbd>
        </button>

        <p className="text-white/40 text-xs text-center mt-3">
          Paste any text or image to display it in fullscreen
        </p>
      </div>
    </div>
  );
}
