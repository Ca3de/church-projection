import { useState, useCallback } from 'react';
import { ScriptureInput, VerseDisplay } from './components';
import type { Verse } from './types/bible';
import {
  parseScriptureReference,
  fetchVerses,
  fetchNextVerse,
  fetchPreviousVerse,
} from './services/bibleApi';
import { useFullscreen } from './hooks/useFullscreen';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

type AppView = 'search' | 'display';

function App() {
  const [view, setView] = useState<AppView>('search');
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen();

  const handleSearch = useCallback(async (reference: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const parsed = parseScriptureReference(reference);

      if (!parsed) {
        setError(
          'Invalid format. Please use format like "John 3:16" or "Psalm 23:1-6"'
        );
        setIsLoading(false);
        return;
      }

      const verses = await fetchVerses(parsed);

      if (verses.length === 0) {
        setError('Scripture not found. Please check the reference and try again.');
        setIsLoading(false);
        return;
      }

      // Display first verse
      setCurrentVerse(verses[0]);
      setView('display');
    } catch (err) {
      setError('Failed to fetch scripture. Please check your connection and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNext = useCallback(async () => {
    if (!currentVerse || isLoadingNext) return;

    setIsLoadingNext(true);
    try {
      const nextVerse = await fetchNextVerse(currentVerse);
      if (nextVerse) {
        setCurrentVerse(nextVerse);
      }
    } catch (err) {
      console.error('Error fetching next verse:', err);
    } finally {
      setIsLoadingNext(false);
    }
  }, [currentVerse, isLoadingNext]);

  const handlePrevious = useCallback(async () => {
    if (!currentVerse || isLoadingPrevious) return;

    setIsLoadingPrevious(true);
    try {
      const prevVerse = await fetchPreviousVerse(currentVerse);
      if (prevVerse) {
        setCurrentVerse(prevVerse);
      }
    } catch (err) {
      console.error('Error fetching previous verse:', err);
    } finally {
      setIsLoadingPrevious(false);
    }
  }, [currentVerse, isLoadingPrevious]);

  const handleNewSearch = useCallback(() => {
    setView('search');
    if (isFullscreen) {
      exitFullscreen();
    }
  }, [isFullscreen, exitFullscreen]);

  const handleEscape = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else if (view === 'display') {
      setView('search');
    }
  }, [isFullscreen, exitFullscreen, view]);

  const handleSearchFocus = useCallback(() => {
    if (view === 'display') {
      handleNewSearch();
    }
  }, [view, handleNewSearch]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNext: view === 'display' ? handleNext : undefined,
    onPrevious: view === 'display' ? handlePrevious : undefined,
    onFullscreen: view === 'display' ? toggleFullscreen : undefined,
    onEscape: handleEscape,
    onSearch: handleSearchFocus,
  });

  return (
    <div className="min-h-screen">
      {view === 'search' ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <svg
                className="w-12 h-12 text-amber-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4v16h12V4H6zm10 14H8V6h8v12zm-1-9H9v1h6V9zm0 2H9v1h6v-1zm0 2H9v1h6v-1zm-6 2h3v1H9v-1z" />
                <path d="M4 2v20h16V2H4zm14 18H6V4h12v16z" />
              </svg>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
                Scripture Display
              </h1>
            </div>
            <p className="text-white/60 text-lg">
              Enter a Bible verse to display on screen
            </p>
          </div>

          {/* Search input */}
          <div className="w-full max-w-2xl animate-slide-up">
            <div className="glass-panel p-8">
              <ScriptureInput
                onSubmit={handleSearch}
                isLoading={isLoading}
                autoFocus
              />

              {/* Error message */}
              {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-center animate-fade-in">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Quick tips */}
          <div className="mt-12 text-center text-white/40 text-sm max-w-lg animate-fade-in">
            <p className="mb-2">
              <span className="text-amber-400/60">Tip:</span> Use keyboard shortcuts for quick navigation
            </p>
            <p>
              Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs mx-1">F</kbd> for fullscreen during display
            </p>
          </div>

          {/* Footer */}
          <div className="fixed bottom-4 text-white/20 text-sm">
            Scripture Display for Churches
          </div>
        </div>
      ) : (
        currentVerse && (
          <VerseDisplay
            verse={currentVerse}
            isFullscreen={isFullscreen}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onToggleFullscreen={toggleFullscreen}
            onNewSearch={handleNewSearch}
            isLoadingNext={isLoadingNext}
            isLoadingPrevious={isLoadingPrevious}
          />
        )
      )}
    </div>
  );
}

export default App;
