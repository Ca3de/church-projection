import { useState, useRef, useEffect } from 'react';
import { BIBLE_BOOKS, BIBLE_VERSIONS } from '../types/bible';

interface ScriptureInputProps {
  onSubmit: (reference: string) => void;
  isLoading: boolean;
  autoFocus?: boolean;
  bibleVersion?: string;
  onBibleVersionChange?: (versionId: string) => void;
}

export function ScriptureInput({ onSubmit, isLoading, autoFocus = false, bibleVersion, onBibleVersionChange }: ScriptureInputProps) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
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
      const searchTerm = newValue.toLowerCase().split(' ')[0];
      const matches = BIBLE_BOOKS
        .filter(book =>
          book.name.toLowerCase().startsWith(searchTerm) ||
          book.abbrev.toLowerCase().startsWith(searchTerm)
        )
        .slice(0, 5)
        .map(book => book.name);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0 && !newValue.includes(':'));
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion + ' ');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
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
        <div className="flex items-end gap-4">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && !value.includes(':') && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="John 3:16"
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
            className="absolute top-full left-0 right-0 mt-2.5 overflow-hidden z-20 animate-scale-in"
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
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-2.5 text-left transition-colors duration-150 font-sans text-sm rounded-lg flex items-center gap-2.5"
                style={
                  index === selectedIndex
                    ? { background: 'var(--surface-3)', color: 'var(--ink-100)' }
                    : { color: 'var(--ink-60)' }
                }
              >
                <span
                  className="w-1 h-1 rounded-full shrink-0"
                  style={{
                    background: 'var(--theme-accent)',
                    opacity: index === selectedIndex ? 0.9 : 0,
                    transition: 'opacity 0.15s',
                  }}
                />
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 mt-3.5 flex-wrap">
        <p className="text-xs font-sans" style={{ color: 'var(--ink-40)' }}>
          Psalm 23:1-6 &middot; Romans 8:28
        </p>

        {bibleVersion && onBibleVersionChange && (
          <div className="flex items-center gap-2 ml-auto">
            <label htmlFor="bible-version" className="eyebrow">
              Version
            </label>
            <select
              id="bible-version"
              value={bibleVersion}
              onChange={(e) => onBibleVersionChange(e.target.value)}
              className="py-1 text-xs font-sans cursor-pointer focus:outline-none transition-colors duration-200 bg-transparent"
              style={{ color: 'var(--ink-60)', border: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-100)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-60)')}
            >
              {BIBLE_VERSIONS.map((v) => (
                <option key={v.id} value={v.id} style={{ background: '#0f0e12', color: '#fff' }}>
                  {v.name} — {v.fullName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </form>
  );
}
