import { useState, useRef, useEffect } from 'react';
import { searchHymns, resolveHymn, describeHymnQuery, formatHymnLabel } from '../services/hymnService';
import { HYMN_BOOKS, getHymnBook } from '../data/hymnBooks';
import type { HymnBookId, HymnSearchResult } from '../types/hymn';

const BOOK_KEY = 'church-projection-hymn-book';

interface HymnInputProps {
  /** Internal hymn number; `label` is what to call it if it isn't found */
  onSubmit: (hymnNumber: number, label?: string) => void;
  isLoading: boolean;
  autoFocus?: boolean;
}

export function HymnInput({
  onSubmit,
  isLoading,
  autoFocus = false,
}: HymnInputProps) {
  const [value, setValue] = useState('');
  const [book, setBook] = useState<HymnBookId>(() => {
    const saved = localStorage.getItem(BOOK_KEY);
    return HYMN_BOOKS.some((b) => b.id === saved) ? (saved as HymnBookId) : 'main';
  });
  const [suggestions, setSuggestions] = useState<HymnSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const updateSuggestions = (query: string, activeBook: HymnBookId) => {
    if (query.length > 0) {
      const matches = searchHymns(query, activeBook);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    updateSuggestions(e.target.value, book);
  };

  const handleBookChange = (next: HymnBookId) => {
    setBook(next);
    localStorage.setItem(BOOK_KEY, next);
    updateSuggestions(value, next);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = value.trim();
    if (!query || isLoading) return;

    // An exact number or identifier wins; otherwise take the best title match
    const exact = resolveHymn(query, book);
    if (exact) {
      onSubmit(exact.number);
    } else if (suggestions.length > 0 && !/^\d+$/.test(query)) {
      onSubmit(suggestions[0].number);
    } else {
      // Nothing matches — let the caller report it by name ("IOM 999")
      onSubmit(-1, describeHymnQuery(query, book));
    }
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (hymn: HymnSearchResult) => {
    setValue(formatHymnLabel(hymn) || hymn.title);
    setSuggestions([]);
    setShowSuggestions(false);
    onSubmit(hymn.number);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length
        );
        break;
      case 'Tab':
      case 'Enter':
        if (showSuggestions && suggestions.length > 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Which hymnbook a bare number refers to */}
      <div className="flex items-center justify-center gap-1 mb-5 flex-wrap" role="radiogroup" aria-label="Hymnbook">
        {HYMN_BOOKS.map((b, i) => {
          const isActive = b.id === book;
          return (
            <span key={b.id} className="flex items-center">
              {i > 0 && (
                <span aria-hidden="true" className="mx-1.5 text-[10px]" style={{ color: 'var(--ink-20)' }}>
                  ◆
                </span>
              )}
              <button
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => handleBookChange(b.id)}
                className="px-2 py-1.5 font-display uppercase transition-colors duration-300 focus:outline-none"
                style={{
                  fontSize: '0.64rem',
                  fontWeight: 500,
                  letterSpacing: '0.2em',
                  color: isActive ? 'var(--theme-accent)' : 'var(--ink-40)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--ink-80)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--ink-40)';
                }}
              >
                {b.name}
              </button>
            </span>
          );
        })}
      </div>

      <div className="relative">
        <div className="flex items-end gap-4">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={book === 'main' ? 'Number or title' : `${getHymnBook(book).prefix} number or title`}
              className="field pr-9"
              disabled={isLoading}
            />
            <div className="absolute right-0 bottom-3 pointer-events-none">
              <span className="kbd">/</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !value.trim()}
            className="btn-primary disabled:cursor-not-allowed disabled:transform-none min-w-[104px] flex items-center justify-center shrink-0 mb-1"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </span>
            ) : (
              'Display'
            )}
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-2.5 z-20 animate-scale-in max-h-[19rem] overflow-y-auto scrollbar-thin"
            style={{
              background: 'rgba(12, 11, 14, 0.94)',
              backdropFilter: 'blur(28px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(28px) saturate(1.2)',
              border: '1px solid var(--hairline-strong)',
              borderRadius: 'var(--r-lg)',
              boxShadow: '0 28px 60px -20px rgba(0,0,0,0.9)',
              padding: '0.3rem',
            }}
          >
            {suggestions.map((hymn, index) => (
              <button
                key={hymn.number}
                type="button"
                onClick={() => handleSuggestionClick(hymn)}
                className="w-full px-3 py-2.5 text-left transition-colors duration-150 font-sans text-sm flex items-center gap-3 rounded-lg"
                style={
                  index === selectedIndex
                    ? { background: 'var(--surface-3)', color: 'var(--ink-100)' }
                    : { color: 'var(--ink-60)' }
                }
              >
                <span
                  className="text-[11px] font-medium px-1.5 py-1 rounded-md shrink-0 tabular-nums min-w-[2.6rem] text-center whitespace-nowrap"
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid var(--hairline)',
                    color: 'var(--theme-accent)',
                  }}
                >
                  {hymn.unnumbered ? '—' : hymn.displayNumber || hymn.number}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{hymn.title}</span>
                  {hymn.secondaryTitle && (
                    <span className="block truncate text-[12px] italic font-serif" style={{ color: 'var(--ink-40)' }}>
                      {hymn.secondaryTitle}
                    </span>
                  )}
                </span>
                {hymn.author && (
                  <span className="text-[11px] shrink-0 truncate max-w-[7rem]" style={{ color: 'var(--ink-40)' }}>
                    {hymn.author}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs mt-3.5 font-sans" style={{ color: 'var(--ink-40)' }}>
        {book === 'main' ? (
          <>821 &middot; YS1 &middot; Amazing Grace</>
        ) : book === 'iom' ? (
          <>15 &middot; Abide with me &middot; Wa ba mi gbe</>
        ) : (
          <>319 &middot; The Lord&rsquo;s my shepherd</>
        )}
      </p>
    </form>
  );
}
