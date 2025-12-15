import { useState, useCallback } from 'react';
import {
  ScriptureInput,
  VerseDisplay,
  TabSwitcher,
  HymnInput,
  HymnDisplay,
} from './components';
import type { Verse } from './types/bible';
import type { Hymn, HymnDisplayItem } from './types/hymn';
import {
  parseScriptureReference,
  fetchVerses,
  fetchNextVerse,
  fetchPreviousVerse,
} from './services/bibleApi';
import {
  getHymnByNumber,
  getTotalDisplayItems,
  getDisplayItemAtIndex,
} from './services/hymnService';
import { useFullscreen } from './hooks/useFullscreen';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useCursorAutoHide } from './hooks/useCursorAutoHide';

type ContentMode = 'scripture' | 'hymn';
type AppView = 'search' | 'display';

function App() {
  // Shared state
  const [contentMode, setContentMode] = useState<ContentMode>('scripture');
  const [view, setView] = useState<AppView>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scripture state
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  // Hymn state
  const [currentHymn, setCurrentHymn] = useState<Hymn | null>(null);
  const [hymnDisplayIndex, setHymnDisplayIndex] = useState(0);

  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen();
  const { isCursorHidden } = useCursorAutoHide(isFullscreen && view === 'display', 2000);

  // Scripture handlers
  const handleScriptureSearch = useCallback(async (reference: string) => {
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
        setError(
          'Scripture not found. Please check the reference and try again.'
        );
        setIsLoading(false);
        return;
      }

      setCurrentVerse(verses[0]);
      setView('display');
    } catch (err) {
      setError(
        'Failed to fetch scripture. Please check your connection and try again.'
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleScriptureNext = useCallback(async () => {
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

  const handleScripturePrevious = useCallback(async () => {
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

  // Hymn handlers
  const handleHymnSearch = useCallback((hymnNumber: number) => {
    setIsLoading(true);
    setError(null);

    const hymn = getHymnByNumber(hymnNumber);

    if (!hymn) {
      setError(`Hymn #${hymnNumber} not found. Please try a different hymn.`);
      setIsLoading(false);
      return;
    }

    setCurrentHymn(hymn);
    setHymnDisplayIndex(0);
    setView('display');
    setIsLoading(false);
  }, []);

  const handleHymnNext = useCallback(() => {
    if (!currentHymn) return;
    const totalItems = getTotalDisplayItems(currentHymn);
    if (hymnDisplayIndex < totalItems - 1) {
      setHymnDisplayIndex((prev) => prev + 1);
    }
  }, [currentHymn, hymnDisplayIndex]);

  const handleHymnPrevious = useCallback(() => {
    if (!currentHymn) return;
    if (hymnDisplayIndex > 0) {
      setHymnDisplayIndex((prev) => prev - 1);
    }
  }, [currentHymn, hymnDisplayIndex]);

  // Shared handlers
  const handleNewSearch = useCallback(() => {
    setView('search');
    setError(null);
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

  const handleTabChange = useCallback((tab: ContentMode) => {
    setContentMode(tab);
    setError(null);
  }, []);

  // Get current hymn display item
  const currentHymnDisplayItem: HymnDisplayItem | null = currentHymn
    ? getDisplayItemAtIndex(currentHymn, hymnDisplayIndex)
    : null;

  const hymnTotalItems = currentHymn ? getTotalDisplayItems(currentHymn) : 0;
  const canGoNextHymn = hymnDisplayIndex < hymnTotalItems - 1;
  const canGoPreviousHymn = hymnDisplayIndex > 0;

  // Determine which handlers to use based on content mode
  const handleNext =
    contentMode === 'scripture' ? handleScriptureNext : handleHymnNext;
  const handlePrevious =
    contentMode === 'scripture' ? handleScripturePrevious : handleHymnPrevious;

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
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              {contentMode === 'scripture' ? (
                <svg
                  className="w-12 h-12 text-amber-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4v16h12V4H6zm10 14H8V6h8v12zm-1-9H9v1h6V9zm0 2H9v1h6v-1zm0 2H9v1h6v-1zm-6 2h3v1H9v-1z" />
                  <path d="M4 2v20h16V2H4zm14 18H6V4h12v16z" />
                </svg>
              ) : (
                <svg
                  className="w-12 h-12 text-amber-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zm-2 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                </svg>
              )}
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
                {contentMode === 'scripture' ? 'Scripture Display' : 'Hymn Display'}
              </h1>
            </div>
            <p className="text-white/60 text-lg">
              {contentMode === 'scripture'
                ? 'Enter a Bible verse to display on screen'
                : 'Enter a hymn number or title to display'}
            </p>
          </div>

          {/* Tab Switcher */}
          <TabSwitcher activeTab={contentMode} onTabChange={handleTabChange} />

          {/* Search input */}
          <div className="w-full max-w-2xl animate-slide-up">
            <div className="glass-panel p-8">
              {contentMode === 'scripture' ? (
                <ScriptureInput
                  onSubmit={handleScriptureSearch}
                  isLoading={isLoading}
                  autoFocus
                />
              ) : (
                <HymnInput
                  onSubmit={handleHymnSearch}
                  isLoading={isLoading}
                  autoFocus
                />
              )}

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
              <span className="text-amber-400/60">Tip:</span> Use keyboard
              shortcuts for quick navigation
            </p>
            <p>
              Press{' '}
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs mx-1">
                F
              </kbd>{' '}
              for fullscreen during display
            </p>
          </div>

          {/* Footer */}
          <div className="fixed bottom-4 text-white/20 text-sm">
            Church Projection Display
          </div>
        </div>
      ) : contentMode === 'scripture' && currentVerse ? (
        <VerseDisplay
          key={`${currentVerse.book}-${currentVerse.chapter}-${currentVerse.verse}`}
          verse={currentVerse}
          isFullscreen={isFullscreen}
          isCursorHidden={isCursorHidden}
          onNext={handleScriptureNext}
          onPrevious={handleScripturePrevious}
          onToggleFullscreen={toggleFullscreen}
          onNewSearch={handleNewSearch}
          isLoadingNext={isLoadingNext}
          isLoadingPrevious={isLoadingPrevious}
        />
      ) : contentMode === 'hymn' && currentHymnDisplayItem ? (
        <HymnDisplay
          key={`${currentHymn?.number}-${hymnDisplayIndex}`}
          displayItem={currentHymnDisplayItem}
          currentIndex={hymnDisplayIndex}
          totalItems={hymnTotalItems}
          isFullscreen={isFullscreen}
          isCursorHidden={isCursorHidden}
          onNext={handleHymnNext}
          onPrevious={handleHymnPrevious}
          onToggleFullscreen={toggleFullscreen}
          onNewSearch={handleNewSearch}
          canGoNext={canGoNextHymn}
          canGoPrevious={canGoPreviousHymn}
        />
      ) : null}
    </div>
  );
}

export default App;
