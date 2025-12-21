import { useState, useEffect, useRef } from 'react';

interface QuickDisplayProps {
  content: string;
  contentType: 'text' | 'image' | 'video';
  isFullscreen: boolean;
  isCursorHidden?: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

interface TextPage {
  number?: number;
  lines: string[];
}

// Parse text into pages based on numbered sections
function parseTextIntoPages(text: string): TextPage[] {
  const lines = text.split('\n');
  const pages: TextPage[] = [];
  let currentPage: TextPage | null = null;

  // Pattern to match numbered sections: "1.", "1)", "1 ", or just a number at start of line
  const numberPattern = /^(\d+)[\.\)\s:]\s*/;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const match = trimmedLine.match(numberPattern);

    if (match) {
      // Start a new page
      if (currentPage) {
        pages.push(currentPage);
      }
      const number = parseInt(match[1], 10);
      const remainingText = trimmedLine.slice(match[0].length).trim();
      currentPage = {
        number,
        lines: remainingText ? [remainingText] : [],
      };
    } else if (currentPage) {
      // Add to current page
      currentPage.lines.push(trimmedLine);
    } else {
      // No number yet, start first page without number
      currentPage = {
        lines: [trimmedLine],
      };
    }
  }

  // Push the last page
  if (currentPage && currentPage.lines.length > 0) {
    pages.push(currentPage);
  }

  // If we only have one page with no number, return it as-is (don't paginate)
  // But if we have multiple pages or numbered sections, use pagination
  return pages;
}

// Check if URL is a video URL
function getVideoEmbedUrl(url: string): string | null {
  // YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  // Direct video file
  if (url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) {
    return url;
  }

  return null;
}

export function QuickDisplay({
  content,
  contentType,
  isFullscreen,
  isCursorHidden = false,
  onToggleFullscreen,
  onClose,
}: QuickDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Parse text into pages
  const pages = contentType === 'text' ? parseTextIntoPages(content) : [];
  const shouldPaginate = contentType === 'text' && pages.length > 1;

  const currentPage = pages[currentIndex];
  const canGoNext = shouldPaginate && currentIndex < pages.length - 1;
  const canGoPrevious = shouldPaginate && currentIndex > 0;

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
      if (shouldPaginate) {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'n') {
          e.preventDefault();
          handleNext();
        } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'p') {
          e.preventDefault();
          handlePrevious();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, canGoNext, canGoPrevious, shouldPaginate]);

  // Get video embed URL
  const videoEmbedUrl = contentType === 'video' ? getVideoEmbedUrl(content) : null;
  const isDirectVideo = videoEmbedUrl && !videoEmbedUrl.includes('youtube') && !videoEmbedUrl.includes('vimeo');
  const isEmbedVideo = videoEmbedUrl && !isDirectVideo;

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-8 transition-all duration-500 ${
        isFullscreen ? 'fullscreen-mode' : ''
      } ${isCursorHidden ? 'cursor-none' : ''}`}
    >
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full overflow-hidden">
        {contentType === 'image' ? (
          <div className="animate-fade-in max-h-[80vh] max-w-full">
            <img
              src={content}
              alt="Pasted content"
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        ) : contentType === 'video' ? (
          <div className="animate-fade-in w-full max-w-4xl aspect-video">
            {isEmbedVideo ? (
              <iframe
                src={videoEmbedUrl}
                className="w-full h-full rounded-lg shadow-2xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : isDirectVideo ? (
              <video
                ref={videoRef}
                src={content}
                className="w-full h-full rounded-lg shadow-2xl object-contain"
                controls
                autoPlay
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-lg">
                <p className="text-white/50">Unable to play this video format</p>
              </div>
            )}
          </div>
        ) : shouldPaginate && currentPage ? (
          <>
            {/* Paginated text display */}
            <div
              key={currentIndex}
              className="text-center animate-fade-in flex-1 flex flex-col items-center justify-center w-full px-4"
            >
              <div className="space-y-2">
                {currentPage.lines.map((line, index) => (
                  <p
                    key={index}
                    className="quick-display-text text-white/95 leading-relaxed"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* Page indicator */}
            <div className="animate-slide-up space-y-1 flex-shrink-0 mt-6">
              <p className="verse-reference">
                {currentPage.number ? (
                  <span>Section {currentPage.number}</span>
                ) : (
                  <span>Part {currentIndex + 1}</span>
                )}
              </p>
              <p className="text-white/40 text-sm">
                {currentIndex + 1} of {pages.length}
              </p>
            </div>
          </>
        ) : (
          // Single page text display
          <div className="text-center animate-fade-in flex-1 overflow-y-auto max-h-[80vh] w-full px-4 scrollbar-thin flex flex-col items-center justify-center">
            <div className="space-y-4">
              {pages[0]?.lines.map((line, index) => (
                <p
                  key={index}
                  className="quick-display-text text-white/95 leading-relaxed"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}
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
          {/* Previous button (only for paginated text) */}
          {shouldPaginate && (
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
          )}

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
            className={`${shouldPaginate ? 'btn-secondary' : 'btn-primary'} flex items-center gap-2`}
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

          {/* Next button (only for paginated text) */}
          {shouldPaginate && (
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
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        {!isFullscreen && (
          <div className="text-center mt-4 text-white/30 text-sm">
            <span className="hidden md:inline">
              {shouldPaginate && (
                <>
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
                </>
              )}
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs mx-1">
                F
              </kbd>{' '}
              Fullscreen
              <span className="mx-2">|</span>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs mx-1">
                Esc
              </kbd>{' '}
              Close
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
