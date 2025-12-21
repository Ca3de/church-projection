import type { LiturgyItem } from '../data/liturgy';

interface LiturgyDisplayProps {
  item: LiturgyItem;
  isFullscreen: boolean;
  isCursorHidden?: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

export function LiturgyDisplay({
  item,
  isFullscreen,
  isCursorHidden = false,
  onToggleFullscreen,
  onClose,
}: LiturgyDisplayProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-8 transition-all duration-500 ${
        isFullscreen ? 'fullscreen-mode' : ''
      } ${isCursorHidden ? 'cursor-none' : ''}`}
    >
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full overflow-hidden">
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in flex-shrink-0">
          <h1 className="verse-reference text-2xl md:text-3xl lg:text-4xl font-display theme-accent">
            {item.title}
          </h1>
        </div>

        {/* Content - scrollable container */}
        <div className="text-center animate-fade-in flex-1 overflow-y-auto max-h-[70vh] w-full px-4 scrollbar-thin">
          {item.type === 'hymn' && item.verses ? (
            <div className="space-y-8">
              {item.verses.map((verse, index) => (
                <div key={index} className="space-y-2">
                  {verse.number && (
                    <p className="text-white/50 text-sm md:text-base font-medium mb-3">
                      {verse.isRefrain ? 'Refrain' : `Verse ${verse.number}`}
                    </p>
                  )}
                  <div className="space-y-1">
                    {verse.lines.map((line, lineIndex) => (
                      <p
                        key={lineIndex}
                        className="liturgy-text text-white/95 leading-relaxed"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : item.paragraphs ? (
            <div className="space-y-6 text-left max-w-4xl mx-auto">
              {item.paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="liturgy-text text-white/95 leading-relaxed indent-8 first:indent-0"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}
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
            className="btn-primary flex items-center gap-2"
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
        </div>

        {/* Keyboard shortcuts hint */}
        {!isFullscreen && (
          <div className="text-center mt-4 text-white/30 text-sm">
            <span className="hidden md:inline">
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
