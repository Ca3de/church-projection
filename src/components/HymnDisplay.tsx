import type { HymnDisplayItem } from '../types/hymn';

interface HymnDisplayProps {
  displayItem: HymnDisplayItem;
  currentIndex: number;
  totalItems: number;
  isFullscreen: boolean;
  isCursorHidden?: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onToggleFullscreen: () => void;
  onNewSearch: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export function HymnDisplay({
  displayItem,
  currentIndex,
  totalItems,
  isFullscreen,
  isCursorHidden = false,
  onNext,
  onPrevious,
  onToggleFullscreen,
  onNewSearch,
  canGoNext,
  canGoPrevious,
}: HymnDisplayProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-8 transition-all duration-500 ${
        isFullscreen ? 'fullscreen-mode' : ''
      } ${isCursorHidden ? 'cursor-none' : ''}`}
    >
      {/* Main hymn content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full overflow-hidden">
        {/* Hymn title */}
        <div className="text-center mb-4 animate-fade-in flex-shrink-0">
          <p className="verse-reference text-lg md:text-xl lg:text-2xl font-display">
            Hymn {displayItem.hymnDisplayNumber || displayItem.hymnNumber} - {displayItem.hymnTitle}
          </p>
        </div>

        {/* Hymn text - scrollable container */}
        <div className="text-center animate-fade-in flex-1 overflow-y-auto max-h-[60vh] w-full px-4 scrollbar-thin">
          <p className="hymn-text text-white/95 mb-6 leading-relaxed whitespace-pre-line">
            {displayItem.text}
          </p>
        </div>

        {/* Verse/Refrain indicator and progress */}
        <div className="animate-slide-up space-y-1 flex-shrink-0 mt-4">
          <p className="verse-reference">
            {displayItem.type === 'refrain' ? (
              <span className="inline-flex items-center gap-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm theme-accent">
                  Refrain
                </span>
              </span>
            ) : (
              <span>Verse {displayItem.verseNumber}</span>
            )}
          </p>
          <p className="text-white/40 text-sm">
            {currentIndex + 1} of {totalItems}
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
            disabled={!canGoPrevious}
            className="btn-secondary flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous (Left arrow, P, or Backspace)"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
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
            disabled={!canGoNext}
            className="btn-primary flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next (Right arrow, N, or Space)"
          >
            <span className="hidden sm:inline">Next</span>
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
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        {!isFullscreen && (
          <div className="text-center mt-4 text-white/30 text-sm">
            <span className="hidden md:inline">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs mx-1">
                Space
              </kbd>{' '}
              or
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs mx-1">
                →
              </kbd>{' '}
              Next
              <span className="mx-2">|</span>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs mx-1">
                ←
              </kbd>{' '}
              Previous
              <span className="mx-2">|</span>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs mx-1">
                F
              </kbd>{' '}
              Fullscreen
              <span className="mx-2">|</span>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs mx-1">
                /
              </kbd>{' '}
              Search
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
