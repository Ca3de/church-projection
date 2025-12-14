import type { Verse } from '../types/bible';
import { formatReference } from '../services/bibleApi';

interface VerseDisplayProps {
  verse: Verse;
  isFullscreen: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onToggleFullscreen: () => void;
  onNewSearch: () => void;
  isLoadingNext: boolean;
  isLoadingPrevious: boolean;
}

export function VerseDisplay({
  verse,
  isFullscreen,
  onNext,
  onPrevious,
  onToggleFullscreen,
  onNewSearch,
  isLoadingNext,
  isLoadingPrevious,
}: VerseDisplayProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-8 transition-all duration-500 ${
        isFullscreen ? 'fullscreen-mode' : ''
      }`}
    >
      {/* Main verse content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full">
        {/* Verse text */}
        <div className="text-center animate-fade-in">
          <p className="scripture-text text-white/95 mb-8 leading-relaxed">
            "{verse.text}"
          </p>

          {/* Reference */}
          <p className="verse-reference animate-slide-up">
            {formatReference(verse)}
          </p>
        </div>
      </div>

      {/* Navigation controls - hidden in fullscreen but appear on hover/tap */}
      <div
        className={`fixed bottom-0 left-0 right-0 p-6 transition-all duration-300 ${
          isFullscreen
            ? 'opacity-0 hover:opacity-100 bg-gradient-to-t from-black/50 to-transparent'
            : ''
        }`}
      >
        <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto">
          {/* Previous button */}
          <button
            onClick={onPrevious}
            disabled={isLoadingPrevious}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            title="Previous verse (Left arrow, P, or Backspace)"
          >
            {isLoadingPrevious ? (
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
            ) : (
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            )}
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* New search button */}
          <button
            onClick={onNewSearch}
            className="btn-secondary flex items-center gap-2"
            title="New search (S or /)"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={onToggleFullscreen}
            className="btn-secondary flex items-center gap-2"
            title="Toggle fullscreen (F)"
          >
            {isFullscreen ? (
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
                  d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                />
              </svg>
            ) : (
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
                  d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                />
              </svg>
            )}
            <span className="hidden sm:inline">
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </span>
          </button>

          {/* Next button */}
          <button
            onClick={onNext}
            disabled={isLoadingNext}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
            title="Next verse (Right arrow, N, or Space)"
          >
            <span className="hidden sm:inline">Next</span>
            {isLoadingNext ? (
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
            ) : (
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        {!isFullscreen && (
          <div className="text-center mt-4 text-white/30 text-sm">
            <span className="hidden md:inline">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs mx-1">Space</kbd> or
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs mx-1">→</kbd> Next
              <span className="mx-2">|</span>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs mx-1">←</kbd> Previous
              <span className="mx-2">|</span>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs mx-1">F</kbd> Fullscreen
              <span className="mx-2">|</span>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs mx-1">/</kbd> Search
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
