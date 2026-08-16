import { useState } from 'react';
import type { Verse } from '../types/bible';
import { formatReference } from '../services/bibleApi';

interface VerseDisplayProps {
  verse: Verse;
  isFullscreen: boolean;
  isCursorHidden?: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onToggleFullscreen: () => void;
  onNewSearch: () => void;
  onJumpTo: (chapter: number, verse: number) => void;
  isLoadingNext: boolean;
  isLoadingPrevious: boolean;
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function VerseDisplay({
  verse,
  isFullscreen,
  isCursorHidden = false,
  onNext,
  onPrevious,
  onToggleFullscreen,
  onNewSearch,
  onJumpTo,
  isLoadingNext,
  isLoadingPrevious,
}: VerseDisplayProps) {
  const [jumpValue, setJumpValue] = useState('');

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = jumpValue.trim();
    if (!trimmed) return;

    if (trimmed.includes(':')) {
      const [chStr, vStr] = trimmed.split(':');
      const ch = parseInt(chStr, 10);
      const v = parseInt(vStr, 10);
      if (!isNaN(ch) && ch > 0 && !isNaN(v) && v > 0) {
        onJumpTo(ch, v);
        setJumpValue('');
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num > 0) {
        onJumpTo(verse.chapter, num);
        setJumpValue('');
      }
    }
  };

  return (
    <div
      className={`relative flex flex-col min-h-screen ${isFullscreen ? 'fullscreen-mode' : ''} ${
        isCursorHidden ? 'cursor-none' : ''
      }`}
    >
      {/* ── The Word ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-[6vw] py-[10vh] min-h-0">
        <div className="w-full text-center">
          {/* Opening quotation mark, set as a decorative flourish */}
          <div
            aria-hidden="true"
            className="font-serif leading-none select-none"
            style={{
              fontSize: 'clamp(1.75rem, 2.4vw + 0.8vh, 4rem)',
              color: 'var(--theme-accent)',
              opacity: 0.25,
              marginBottom: '-0.15em',
              animation: 'fadeIn 1.4s var(--ease-out) 0.2s both',
            }}
          >
            &ldquo;
          </div>

          {/*
            The measure lives on the paragraph, not the wrapper: `ch` resolves
            against the element's own font, so putting it on a 16px wrapper
            yields a ~600px column regardless of the display size.
          */}
          <p
            className="scripture-text animate-reveal mx-auto"
            style={{ color: 'var(--ink-100)', maxWidth: '32ch' }}
          >
            {verse.text}
          </p>

          {/* Reference, flanked by rules that draw outward */}
          <div
            className="flex items-center justify-center gap-4 sm:gap-6 mt-[clamp(1.75rem,3vh,3.5rem)]"
            style={{ animation: 'fadeIn 1s var(--ease-out) 0.55s both' }}
          >
            <span
              className="hidden sm:block h-px flex-1 max-w-[7rem] origin-right"
              style={{
                background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--theme-accent) 45%, transparent))',
                animation: 'drawWidth 1.1s var(--ease-out) 0.6s both',
              }}
            />
            <span className="verse-reference whitespace-nowrap">{formatReference(verse)}</span>
            <span
              className="hidden sm:block h-px flex-1 max-w-[7rem] origin-left"
              style={{
                background: 'linear-gradient(270deg, transparent, color-mix(in srgb, var(--theme-accent) 45%, transparent))',
                animation: 'drawWidth 1.1s var(--ease-out) 0.6s both',
              }}
            />
          </div>
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
          <label className="eyebrow">Go to</label>
          <input
            type="text"
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            placeholder={`${verse.chapter}:${verse.verse}`}
            className="w-24 px-3 py-2 rounded-lg text-center text-sm font-sans tabular-nums focus:outline-none"
            style={{
              color: 'var(--ink-100)',
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid var(--hairline-strong)',
              backdropFilter: 'blur(12px)',
            }}
            title="Verse number (e.g. 29) or chapter:verse (e.g. 6:1)"
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
              disabled={isLoadingPrevious}
              className="btn-secondary flex items-center gap-2 disabled:opacity-40"
              title="Previous verse (←, P, or Backspace)"
            >
              {isLoadingPrevious ? (
                <Spinner />
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              )}
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Jump field */}
            <form onSubmit={handleJump} className="flex items-center">
              <input
                type="text"
                value={jumpValue}
                onChange={(e) => setJumpValue(e.target.value)}
                placeholder={`${verse.chapter}:${verse.verse}`}
                className="w-[5.5rem] px-3 py-2.5 rounded-xl text-center text-sm font-sans tabular-nums focus:outline-none transition-colors duration-200"
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
                title="Verse number (e.g. 29) or chapter:verse (e.g. 6:1)"
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
              disabled={isLoadingNext}
              className="btn-primary flex items-center gap-2 disabled:opacity-40"
              title="Next verse (→, N, or Space)"
            >
              <span className="hidden sm:inline">Next</span>
              {isLoadingNext ? (
                <Spinner />
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
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
