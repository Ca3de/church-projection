import { useEffect, useState } from 'react';

export interface HistoryItem {
  id: string;
  type: 'scripture' | 'hymn' | 'liturgy' | 'quick';
  title: string;
  subtitle?: string;
  data: unknown;
  timestamp: number;
}

interface ProjectionHistoryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export function ProjectionHistory({ history, onSelect, onClear }: ProjectionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no history
  if (history.length === 0) {
    return null;
  }

  const lastItem = history[0];

  return (
    <div className="fixed bottom-4 left-4 z-40 animate-fade-in">
      {/* Collapsed: Just show last item */}
      {!isExpanded ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(lastItem)}
            className="flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg text-white/80 hover:text-white hover:bg-black/80 transition-all text-sm"
            title="Click to re-display last projection"
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="max-w-[200px] truncate">{lastItem.title}</span>
            {lastItem.subtitle && (
              <span className="text-white/50 text-xs">{lastItem.subtitle}</span>
            )}
          </button>
          {history.length > 1 && (
            <button
              onClick={() => setIsExpanded(true)}
              className="px-2 py-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg text-white/60 hover:text-white hover:bg-black/80 transition-all text-xs"
              title="View history"
            >
              +{history.length - 1}
            </button>
          )}
        </div>
      ) : (
        /* Expanded: Show full history */
        <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-xs font-medium">Recent Projections</span>
            <div className="flex gap-1">
              <button
                onClick={onClear}
                className="text-white/40 hover:text-red-400 text-xs px-2 py-1"
                title="Clear history"
              >
                Clear
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white/40 hover:text-white p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {history.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  setIsExpanded(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-sm transition-all ${
                  index === 0
                    ? 'bg-amber-500/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    item.type === 'scripture' ? 'bg-blue-400' :
                    item.type === 'hymn' ? 'bg-amber-400' :
                    item.type === 'liturgy' ? 'bg-purple-400' : 'bg-green-400'
                  }`} />
                  <span className="truncate flex-1">{item.title}</span>
                  {item.subtitle && (
                    <span className="text-white/40 text-xs">{item.subtitle}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to manage projection history
const HISTORY_KEY = 'church-projection-history';
const MAX_HISTORY = 20;

export function useProjectionHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = sessionStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to sessionStorage when history changes
  useEffect(() => {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: `${item.type}-${Date.now()}`,
      timestamp: Date.now(),
    };

    setHistory(prev => {
      // Remove duplicate if exists (same type and title)
      const filtered = prev.filter(h => !(h.type === item.type && h.title === item.title));
      // Add to front, limit size
      return [newItem, ...filtered].slice(0, MAX_HISTORY);
    });
  };

  const clearHistory = () => {
    setHistory([]);
    sessionStorage.removeItem(HISTORY_KEY);
  };

  return { history, addToHistory, clearHistory };
}
