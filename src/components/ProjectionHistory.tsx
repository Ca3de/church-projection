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
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSelect(lastItem)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm transition-colors duration-250"
            style={{
              color: 'var(--ink-80)',
              background: 'rgba(12, 11, 14, 0.82)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--hairline)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-100)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-80)')}
            title="Re-display last projection"
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: typeColors[lastItem.type] }} />
            <span className="max-w-[200px] truncate">{lastItem.title}</span>
            {lastItem.subtitle && (
              <span className="text-xs" style={{ color: 'var(--ink-40)' }}>{lastItem.subtitle}</span>
            )}
          </button>
          {history.length > 1 && (
            <button
              onClick={() => setIsExpanded(true)}
              className="px-2.5 py-2.5 rounded-xl text-xs font-medium tabular-nums transition-colors duration-250"
              style={{
                color: 'var(--ink-40)',
                background: 'rgba(12, 11, 14, 0.82)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid var(--hairline)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-100)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-40)')}
              title="View history"
            >
              +{history.length - 1}
            </button>
          )}
        </div>
      ) : (
        <div
          className="p-1.5 w-[19rem] animate-scale-in"
          style={{
            background: 'rgba(12, 11, 14, 0.95)',
            backdropFilter: 'blur(28px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.2)',
            border: '1px solid var(--hairline-strong)',
            borderRadius: 'var(--r-lg)',
            boxShadow: '0 28px 60px -20px rgba(0,0,0,0.9)',
          }}
        >
          <div className="flex items-center justify-between px-2.5 pt-2 pb-2.5">
            <span className="eyebrow">Recent</span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={onClear}
                className="text-[11px] px-2 py-1 rounded-md transition-colors duration-200"
                style={{ color: 'var(--ink-40)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgb(248, 113, 113)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-40)')}
                title="Clear history"
              >
                Clear
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-md transition-colors duration-200"
                style={{ color: 'var(--ink-40)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-100)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-40)')}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto scrollbar-thin">
            {history.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  setIsExpanded(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-[13px] transition-colors duration-150 flex items-center gap-2.5"
                style={
                  index === 0
                    ? { background: 'var(--surface-3)', color: 'var(--ink-100)' }
                    : { color: 'var(--ink-60)' }
                }
                onMouseEnter={(e) => {
                  if (index !== 0) e.currentTarget.style.background = 'var(--surface-2)';
                }}
                onMouseLeave={(e) => {
                  if (index !== 0) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: typeColors[item.type] }} />
                <span className="truncate flex-1">{item.title}</span>
                {item.subtitle && (
                  <span className="text-[11px] shrink-0" style={{ color: 'var(--ink-40)' }}>{item.subtitle}</span>
                )}
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
