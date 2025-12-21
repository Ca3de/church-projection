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

    // Generate suggestions based on hymn number or title
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
      // Try to parse as number first
      const numberValue = parseInt(value.trim(), 10);
      if (!isNaN(numberValue)) {
        onSubmit(numberValue);
        setShowSuggestions(false);
      } else if (suggestions.length > 0) {
        // If not a number, use the first suggestion
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
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Enter hymn number or title"
              className="input-field pr-12"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">/</kbd>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !value.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading
              </span>
            ) : (
              'Display'
            )}
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 glass-panel overflow-hidden z-10">
            {suggestions.map((hymn, index) => (
              <button
                key={hymn.number}
                type="button"
                onClick={() => handleSuggestionClick(hymn)}
                className={`w-full px-4 py-2 text-left transition-colors ${
                  index === selectedIndex
                    ? 'bg-amber-600/30 text-amber-200'
                    : 'hover:bg-white/10 text-white/80'
                }`}
              >
                <span className="font-medium">#{hymn.displayNumber || hymn.number}</span>
                <span className="mx-2">-</span>
                <span>{hymn.title}</span>
                {hymn.author && (
                  <span className="text-white/50 text-sm ml-2">
                    ({hymn.author})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-white/40 text-sm mt-3">
        Examples: "234", "YS1", "Amazing Grace", "Holy"
      </p>
    </form>
  );
}
