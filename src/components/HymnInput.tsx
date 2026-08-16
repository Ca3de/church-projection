import { useState, useRef, useEffect } from 'react';
import { searchHymns } from '../services/hymnService';
import type { HymnSearchResult } from '../types/hymn';

interface HymnInputProps {
  onSubmit: (hymnNumber: number) => void;
  isLoading: boolean;
  autoFocus?: boolean;
}

export function HymnInput({
  onSubmit,
  isLoading,
  autoFocus = false,
}: HymnInputProps) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<HymnSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (newValue.length > 0) {
      const matches = searchHymns(newValue);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      const numberValue = parseInt(value.trim(), 10);
      if (!isNaN(numberValue)) {
        onSubmit(numberValue);
        setShowSuggestions(false);
      } else if (suggestions.length > 0) {
        onSubmit(suggestions[0].number);
        setShowSuggestions(false);
      }
    }
  };

  const handleSuggestionClick = (hymn: HymnSearchResult) => {
    setValue(`${hymn.number}`);
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
      <div className="relative">
        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Hymn number or title"
              className="input-field pr-12"
              disabled={isLoading}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <span className="kbd">/</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !value.trim()}
            className="btn-primary disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none min-w-[108px] flex items-center justify-center"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Loading</span>
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
                  className="text-[11px] font-medium px-1.5 py-1 rounded-md shrink-0 tabular-nums min-w-[2.6rem] text-center"
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid var(--hairline)',
                    color: 'var(--theme-accent)',
                  }}
                >
                  {hymn.displayNumber || hymn.number}
                </span>
                <span className="flex-1 truncate">{hymn.title}</span>
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

      <p className="text-xs mt-4 font-sans" style={{ color: 'var(--ink-40)' }}>
        821 &middot; YS1 &middot; Amazing Grace
      </p>
    </form>
  );
}
