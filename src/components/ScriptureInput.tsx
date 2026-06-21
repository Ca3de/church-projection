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
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && !value.includes(':') && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Enter scripture reference..."
              className="input-field pr-14"
              disabled={isLoading}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <kbd className="px-1.5 py-0.5 rounded text-xs font-sans text-white/20"
                   style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>/</kbd>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !value.trim()}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none min-w-[110px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
          <div className="absolute top-full left-0 right-0 mt-2 overflow-hidden z-10 animate-scale-in rounded-xl"
               style={{ background: 'rgba(15, 15, 25, 0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full px-5 py-3 text-left transition-all duration-150 font-sans text-sm ${
                  index === selectedIndex
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/90'
                }`}
                style={index === selectedIndex ? {
                  background: 'rgba(255,255,255,0.06)',
                  borderLeft: '2px solid var(--theme-accent)',
                } : { borderLeft: '2px solid transparent' }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {bibleVersion && onBibleVersionChange && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <label htmlFor="bible-version" className="text-white/30 text-xs font-sans tracking-wide">
            Version
          </label>
          <select
            id="bible-version"
            value={bibleVersion}
            onChange={(e) => onBibleVersionChange(e.target.value)}
            className="px-2 py-1 rounded-md text-xs font-sans text-white/80 cursor-pointer focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {BIBLE_VERSIONS.map((v) => (
              <option key={v.id} value={v.id} style={{ background: '#0f0f19' }}>
                {v.name} — {v.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      <p className="text-center text-white/25 text-xs mt-4 font-sans tracking-wide">
        John 3:16 &middot; Psalm 23:1-6 &middot; Romans 8:28
      </p>
    </form>
  );
}
