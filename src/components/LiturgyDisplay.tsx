import { useState, useEffect } from 'react';
import type { LiturgyItem, LiturgyVerse } from '../data/liturgy';

interface LiturgyDisplayProps {
  item: LiturgyItem;
  isFullscreen: boolean;
  isCursorHidden?: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

interface DisplayPage {
  type: 'verse' | 'paragraph';
  verseNumber?: number;
  isRefrain?: boolean;
  lines?: string[];
  text?: string;
}

function getPages(item: LiturgyItem): DisplayPage[] {
  if (item.type === 'hymn' && item.verses) {
    return item.verses.map((verse: LiturgyVerse) => ({
      type: 'verse',
      verseNumber: verse.number,
      isRefrain: verse.isRefrain,
      lines: verse.lines,
    }));
  } else if (item.paragraphs) {
    return item.paragraphs.map((text: string) => ({
      type: 'paragraph',
      text,
    }));
  }
  return [];
}

export function LiturgyDisplay({
  item,
  isFullscreen,
  isCursorHidden = false,
  onToggleFullscreen,
  onClose,
}: LiturgyDisplayProps) {
  const pages = getPages(item);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentPage = pages[currentIndex];
  const canGoNext = currentIndex < pages.length - 1;
  const canGoPrevious = currentIndex > 0;

  const handleNext = () => {
    if (canGoNext) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'n') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'p') {
        e.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, canGoNext, canGoPrevious]);

  if (!currentPage) return null;

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-8 transition-all duration-500 ${
        isFullscreen ? 'fullscreen-mode' : ''
      } ${isCursorHidden ? 'cursor-none' : ''}`}
    >
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full overflow-hidden">
        {/* Title */}
        <div className="text-center mb-6 animate-fade-in flex-shrink-0">
          <h1 className="verse-reference text-xl md:text-2xl lg:text-3xl font-display theme-accent">
            {item.title}
          </h1>
        </div>

        {/* Page content */}
        <div
          key={currentIndex}
          className="text-center animate-fade-in flex-1 flex flex-col items-center justify-center w-full px-4"
        >
          {currentPage.type === 'verse' && currentPage.lines ? (
            <div className="space-y-2">
              {currentPage.lines.map((line, lineIndex) => (
                <p
                  key={lineIndex}
                  className="liturgy-text text-white/95 leading-relaxed"
                >
                  {line}
                </p>
              ))}
            </div>
          ) : currentPage.text ? (
            <p className="liturgy-text text-white/95 leading-relaxed max-w-4xl text-center">
              {currentPage.text}
            </p>
          ) : null}
        </div>

        {/* Page indicator */}
        <div className="animate-slide-up space-y-1 flex-shrink-0 mt-6">
          <p className="verse-reference">
            {currentPage.type === 'verse' ? (
              currentPage.isRefrain ? (
                <span className="inline-flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm theme-accent">
                    Refrain
                  </span>
                </span>
              ) : (
                <span>Verse {currentPage.verseNumber}</span>
              )
            ) : (
              <span>Part {currentIndex + 1}</span>
            )}
          </p>
          <p className="text-white/40 text-sm">
            {currentIndex + 1} of {pages.length}
          </p>
        </div>
      </div>

      {/* Navigation controls */}
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
            onClick={handlePrevious}
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

          {/* Close button */}
          <button
            onClick={onClose}
            className="btn-secondary flex items-center gap-2"
            title="Close (Escape)"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className="hidden sm:inline">Close</span>
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
            onClick={handleNext}
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
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
