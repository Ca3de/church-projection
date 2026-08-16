import { useState } from 'react';
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
  onJumpToVerse: (verseNumber: number) => void;
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
  onJumpToVerse,
  canGoNext,
  canGoPrevious,
}: HymnDisplayProps) {
  const [jumpValue, setJumpValue] = useState('');

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpValue, 10);
    if (!isNaN(num) && num > 0 && num <= displayItem.totalVerses) {
      onJumpToVerse(num);
      setJumpValue('');
    }
  };

  const isRefrain = displayItem.type === 'refrain';

  return (
    <div
      className={`relative flex flex-col min-h-screen ${isFullscreen ? 'fullscreen-mode' : ''} ${
        isCursorHidden ? 'cursor-none' : ''
      }`}
    >
      {/* ── Hymn title, small caps at the head of the page ── */}
      <header
        className="shrink-0 pt-[clamp(1.25rem,3.5vh,2.75rem)] px-[6vw] text-center"
        style={{ animation: 'fadeIn 1s var(--ease-out) both' }}
      >
        <p
          className="font-display uppercase mx-auto max-w-[55ch]"
          style={{
            fontSize: 'clamp(0.7rem, 0.7vw + 0.5vh, 1.5rem)',
            fontWeight: 500,
            letterSpacing: '0.24em',
            color: 'var(--theme-accent)',
            opacity: 0.85,
            lineHeight: 1.5,
          }}
        >
          {displayItem.hymnDisplayNumber || displayItem.hymnNumber} &nbsp;·&nbsp; {displayItem.hymnTitle}
        </p>
      </header>

      {/* ── The stanza ── */}
      <div className="flex-1 flex items-center justify-center px-[6vw] py-[3vh] min-h-0">
        <p
          key={currentIndex}
          className="hymn-text text-center whitespace-pre-line animate-reveal max-w-[46ch]"
          style={{ color: 'var(--ink-100)' }}
        >
          {displayItem.text}
        </p>
      </div>

      {/* ── Stanza label + progress ── */}
      <div
        className="shrink-0 pb-[clamp(6.5rem,14vh,9.5rem)] px-[6vw] flex flex-col items-center gap-[clamp(0.6rem,1.4vh,1.1rem)]"
        style={{ animation: 'fadeIn 1s var(--ease-out) 0.35s both' }}
      >
        {isRefrain ? (
          <span
            className="font-display uppercase px-4 py-1.5 rounded-full"
            style={{
              fontSize: 'clamp(0.6rem, 0.45vw + 0.35vh, 1rem)',
              fontWeight: 500,
              letterSpacing: '0.28em',
              color: 'var(--theme-accent)',
              background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--theme-accent) 28%, transparent)',
            }}
          >
            Refrain
          </span>
        ) : (
          <span
            className="font-display uppercase"
            style={{
              fontSize: 'clamp(0.6rem, 0.45vw + 0.35vh, 1rem)',
              fontWeight: 500,
              letterSpacing: '0.28em',
              color: 'var(--ink-60)',
            }}
          >
            Verse {displayItem.verseNumber}
          </span>
        )}

        {/* Progress: one tick per stanza — the operator sees position at a glance */}
        <div className="flex items-center gap-1.5" aria-label={`${currentIndex + 1} of ${totalItems}`}>
          {Array.from({ length: totalItems }).map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all duration-500"
              style={{
                width: i === currentIndex ? 'clamp(1rem,1.6vw,1.6rem)' : 'clamp(0.22rem,0.35vw,0.35rem)',
                height: 'clamp(0.22rem,0.35vw,0.35rem)',
                background: i === currentIndex ? 'var(--theme-accent)' : 'var(--ink-20)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Fullscreen jump field ── */}
      {isFullscreen && (
        <form
          onSubmit={handleJump}
          className="fixed top-5 right-5 z-50 flex items-center gap-2.5 transition-opacity duration-300"
          style={{ opacity: jumpValue ? 1 : 0.15 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => {
            if (!jumpValue) e.currentTarget.style.opacity = '0.15';
          }}
        >
          <label className="eyebrow">Verse</label>
          <input
            type="text"
            inputMode="numeric"
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            placeholder={`${displayItem.verseNumber || '—'}`}
            className="w-16 px-3 py-2 rounded-lg text-center text-sm font-sans tabular-nums focus:outline-none"
            style={{
              color: 'var(--ink-100)',
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid var(--hairline-strong)',
              backdropFilter: 'blur(12px)',
            }}
            title={`Type a verse number (1-${displayItem.totalVerses}) and press Enter`}
          />
        </form>
      )}

      {/* ── Control bar ── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-500 ${
          isFullscreen ? 'opacity-0 translate-y-3 hover:opacity-100 hover:translate-y-0' : ''
        }`}
        style={
          isFullscreen
            ? { background: 'linear-gradient(to top, rgba(0,0,0,0.72), transparent)' }
            : undefined
        }
      >
        <div className="px-5 pb-6 pt-8">
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap">
            <button
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="btn-secondary flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous (←, P, or Backspace)"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Previous</span>
            </button>

            <form onSubmit={handleJump} className="flex items-center">
              <input
                type="text"
                inputMode="numeric"
                value={jumpValue}
                onChange={(e) => setJumpValue(e.target.value)}
                placeholder={`${displayItem.verseNumber || '—'}`}
                className="w-[4.25rem] px-3 py-2.5 rounded-xl text-center text-sm font-sans tabular-nums focus:outline-none transition-colors duration-200"
                style={{
                  color: 'var(--ink-100)',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--hairline)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--theme-accent) 60%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--hairline)';
                }}
                title={`Jump to verse (1-${displayItem.totalVerses})`}
              />
            </form>

            <button onClick={onNewSearch} className="btn-secondary flex items-center gap-2" title="New search (S or /)">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Search</span>
            </button>

            <button onClick={onToggleFullscreen} className="btn-secondary flex items-center gap-2" title="Toggle fullscreen (F)">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                {isFullscreen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                  />
                )}
              </svg>
              <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>

            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="btn-primary flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next (→, N, or Space)"
            >
              <span className="hidden sm:inline">Next</span>
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {!isFullscreen && (
            <div className="hidden md:flex items-center justify-center gap-2.5 mt-4 text-xs font-sans" style={{ color: 'var(--ink-40)' }}>
              <span className="kbd">Space</span>
              <span>next</span>
              <span style={{ color: 'var(--ink-20)' }}>·</span>
              <span className="kbd">←</span>
              <span>previous</span>
              <span style={{ color: 'var(--ink-20)' }}>·</span>
              <span className="kbd">F</span>
              <span>fullscreen</span>
              <span style={{ color: 'var(--ink-20)' }}>·</span>
              <span className="kbd">Esc</span>
              <span>back</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
