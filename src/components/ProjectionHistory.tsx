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

const typeColors: Record<string, string> = {
  scripture: 'rgba(96, 165, 250, 0.7)',
  hymn: 'rgba(212, 168, 71, 0.7)',
  liturgy: 'rgba(168, 132, 252, 0.7)',
  quick: 'rgba(74, 222, 128, 0.7)',
};

export function ProjectionHistory({ history, onSelect, onClear }: ProjectionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length === 0) {
    return null;
  }

  const lastItem = history[0];

  return (
    <div className="fixed bottom-4 left-4 z-40 animate-fade-in font-sans">
      {!isExpanded ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(lastItem)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-white/70 hover:text-white transition-all duration-200 text-sm"
            style={{
              background: 'rgba(15, 15, 25, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
            title="Click to re-display last projection"
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: typeColors[lastItem.type] }} />
            <span className="max-w-[200px] truncate">{lastItem.title}</span>
            {lastItem.subtitle && (
              <span className="text-white/30 text-xs">{lastItem.subtitle}</span>
            )}
          </button>
          {history.length > 1 && (
            <button
              onClick={() => setIsExpanded(true)}
              className="px-2.5 py-2 rounded-xl text-white/40 hover:text-white/70 transition-all duration-200 text-xs font-medium"
              style={{
                background: 'rgba(15, 15, 25, 0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
              title="View history"
            >
              +{history.length - 1}
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl p-3 max-w-sm animate-scale-in"
             style={{
               background: 'rgba(15, 15, 25, 0.92)',
               backdropFilter: 'blur(20px)',
               border: '1px solid rgba(255, 255, 255, 0.06)',
               boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.5)',
             }}>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-white/30 text-[10px] font-medium tracking-widest uppercase font-display">Recent</span>
            <div className="flex gap-1">
              <button
                onClick={onClear}
                className="text-white/25 hover:text-red-400/80 text-xs px-2 py-1 transition-colors duration-200"
                title="Clear history"
              >
                Clear
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white/25 hover:text-white/60 p-1 transition-colors duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="space-y-0.5 max-h-60 overflow-y-auto scrollbar-thin">
            {history.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  setIsExpanded(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150"
                style={index === 0 ? {
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  borderLeft: '2px solid var(--theme-accent)',
                } : {
                  color: 'rgba(255, 255, 255, 0.5)',
                  borderLeft: '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (index !== 0) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.04)';
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255, 255, 255, 0.8)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== 0) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255, 255, 255, 0.5)';
                  }
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: typeColors[item.type] }} />
                  <span className="truncate flex-1">{item.title}</span>
                  {item.subtitle && (
                    <span className="text-white/25 text-xs shrink-0">{item.subtitle}</span>
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
