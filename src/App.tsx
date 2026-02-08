import { useState, useCallback, useEffect } from 'react';
import {
  ScriptureInput,
  VerseDisplay,
  TabSwitcher,
  HymnInput,
  HymnDisplay,
  ThemeSelector,
  LiturgyDisplay,
  QuickDisplay,
  QuickActions,
  OBSOverlay,
  sendToOBSOverlay,
  OBSStandalone,
  HymnManager,
  ProjectionHistory,
  useProjectionHistory,
} from './components';
import type { HistoryItem } from './components';
import type { Verse } from './types/bible';
import type { Hymn, HymnDisplayItem } from './types/hymn';
import {
  parseScriptureReference,
  fetchVerses,
  fetchNextVerse,
  fetchPreviousVerse,
  fetchSingleVerse,
} from './services/bibleApi';
import {
  getHymnByNumber,
  getTotalDisplayItems,
  getDisplayItemAtIndex,
} from './services/hymnService';
import { useFullscreen } from './hooks/useFullscreen';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useCursorAutoHide } from './hooks/useCursorAutoHide';
import { usePresentationWindow } from './hooks/usePresentationWindow';
import { themes, getThemeById, getThemeCSSVariables, type Theme } from './config/themes';
import { ThemeAnimation } from './animations';
import type { LiturgyItem } from './data/liturgy';

type ContentMode = 'scripture' | 'hymn' | 'liturgy' | 'quick';
type AppView = 'search' | 'display';

function App() {
  // Check URL parameters for special modes
  const urlParams = new URLSearchParams(window.location.search);
  const isOverlayMode = urlParams.get('overlay') === 'true';
  const isOBSMode = urlParams.get('obs') === 'true';

  // OBS standalone mode - self-contained with controls
  if (isOBSMode) {
    return <OBSStandalone />;
  }

  // OBS overlay mode - syncs with main app (requires same browser)
  if (isOverlayMode) {
    return <OBSOverlay />;
  }

  // Shared state
  const [contentMode, setContentMode] = useState<ContentMode>('scripture');
  const [view, setView] = useState<AppView>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const savedThemeId = localStorage.getItem('church-projection-theme');
    return savedThemeId ? getThemeById(savedThemeId) : themes[0];
  });

  // Scripture state
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  // Hymn state
  const [currentHymn, setCurrentHymn] = useState<Hymn | null>(null);
  const [hymnDisplayIndex, setHymnDisplayIndex] = useState(0);

  // Liturgy state
  const [currentLiturgy, setCurrentLiturgy] = useState<LiturgyItem | null>(null);

  // Quick display state
  const [quickContent, setQuickContent] = useState<string>('');
  const [quickContentType, setQuickContentType] = useState<'text' | 'image' | 'video'>('text');

  // OBS overlay state
  const [obsOverlayVisible, setObsOverlayVisible] = useState(false);
  const [obsOverlayMode, setObsOverlayMode] = useState<'fullscreen' | 'overlay'>('overlay');

  // Hymn manager state
  const [showHymnManager, setShowHymnManager] = useState(false);

  // Projection history
  const { history, addToHistory, clearHistory } = useProjectionHistory();

  const { isFullscreen, toggleFullscreen, exitFullscreen, hasExternalDisplay } = useFullscreen();
  const { isCursorHidden } = useCursorAutoHide(isFullscreen && view === 'display', 2000);
  const { isWindowOpen, openPresentationWindow, closePresentationWindow, sendToPresentation } = usePresentationWindow();

  // Apply theme CSS variables
  useEffect(() => {
    const cssVars = getThemeCSSVariables(currentTheme);
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    localStorage.setItem('church-projection-theme', currentTheme.id);
  }, [currentTheme]);

  const handleThemeChange = useCallback((theme: Theme) => {
    setCurrentTheme(theme);
  }, []);

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
      setContentMode('scripture');
      setView('display');

      // Add to history
      addToHistory({
        type: 'scripture',
        title: `${verses[0].book} ${verses[0].chapter}:${verses[0].verse}`,
        data: verses[0],
      });
    } catch (err) {
      setError(
        'Failed to fetch scripture. Please check your connection and try again.'
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [addToHistory]);

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
    setContentMode('hymn');
    setView('display');
    setIsLoading(false);

    // Add to history
    addToHistory({
      type: 'hymn',
      title: `Hymn ${hymn.displayNumber || hymn.number} - ${hymn.title}`,
      data: hymn,
    });
  }, [addToHistory]);

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

  // Jump to specific scripture chapter:verse
  const handleScriptureJump = useCallback(async (chapter: number, verseNumber: number) => {
    if (!currentVerse) return;
    setIsLoadingNext(true);
    try {
      const jumpedVerse = await fetchSingleVerse(currentVerse.book, chapter, verseNumber);
      if (jumpedVerse) {
        setCurrentVerse(jumpedVerse);
      }
    } catch (err) {
      console.error('Error jumping to verse:', err);
    } finally {
      setIsLoadingNext(false);
    }
  }, [currentVerse]);

  // Jump to specific hymn verse
  const handleHymnJump = useCallback((verseNumber: number) => {
    if (!currentHymn) return;
    // Convert verse number to display index
    const targetIndex = currentHymn.refrain
      ? (verseNumber - 1) * 2  // With refrain: verse N is at index (N-1)*2
      : verseNumber - 1;       // Without refrain: verse N is at index N-1
    const totalItems = getTotalDisplayItems(currentHymn);
    if (targetIndex >= 0 && targetIndex < totalItems) {
      setHymnDisplayIndex(targetIndex);
    }
  }, [currentHymn]);

  // Liturgy handlers
  const handleSelectLiturgy = useCallback((item: LiturgyItem) => {
    setCurrentLiturgy(item);
    setContentMode('liturgy');
    setView('display');
  }, []);

  // Video display handler
  const handleVideoContent = useCallback((url: string) => {
    setQuickContent(url);
    setQuickContentType('video');
    setContentMode('quick');
    setView('display');
  }, []);

  // Image display handler
  const handleImageContent = useCallback((url: string) => {
    setQuickContent(url);
    setQuickContentType('image');
    setContentMode('quick');
    setView('display');
  }, []);

  // Text display handler (for uploaded text files)
  const handleTextContent = useCallback((text: string) => {
    setQuickContent(text);
    setQuickContentType('text');
    setContentMode('quick');
    setView('display');
  }, []);

  // Check if text is a video URL
  const isVideoUrl = useCallback((text: string): boolean => {
    const trimmed = text.trim();
    // YouTube (multiple formats including shorts)
    if (trimmed.match(/(?:youtube\.com\/(?:watch|shorts|embed)|youtu\.be\/)/)) return true;
    // Vimeo
    if (trimmed.match(/vimeo\.com\/\d+/)) return true;
    // Instagram (reels, posts, tv)
    if (trimmed.match(/instagram\.com\/(?:reel|p|tv)\//)) return true;
    // Facebook (videos, watch, reel)
    if (trimmed.match(/facebook\.com/) && (trimmed.includes('/video') || trimmed.includes('/watch') || trimmed.includes('/reel'))) return true;
    // Direct video files
    if (trimmed.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) return true;
    return false;
  }, []);

  // Quick paste handlers
  const handlePasteContent = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const item of clipboardItems) {
        // Check for image
        const imageTypes = item.types.filter((type) => type.startsWith('image/'));
        if (imageTypes.length > 0) {
          const blob = await item.getType(imageTypes[0]);
          const url = URL.createObjectURL(blob);
          setQuickContent(url);
          setQuickContentType('image');
          setContentMode('quick');
          setView('display');
          return;
        }

        // Check for text (might be video URL)
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          const text = await blob.text();
          if (text.trim()) {
            if (isVideoUrl(text)) {
              setQuickContent(text.trim());
              setQuickContentType('video');
            } else {
              setQuickContent(text);
              setQuickContentType('text');
            }
            setContentMode('quick');
            setView('display');
            return;
          }
        }
      }
    } catch {
      // Fallback to text-only paste
      try {
        const text = await navigator.clipboard.readText();
        if (text.trim()) {
          if (isVideoUrl(text)) {
            setQuickContent(text.trim());
            setQuickContentType('video');
          } else {
            setQuickContent(text);
            setQuickContentType('text');
          }
          setContentMode('quick');
          setView('display');
        }
      } catch (err) {
        console.error('Failed to read clipboard:', err);
      }
    }
  }, [isVideoUrl]);

  // Listen for paste events when on search view
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (view !== 'search') return;

      // Check if we're in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      e.preventDefault();

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        // Check for image
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            const url = URL.createObjectURL(blob);
            setQuickContent(url);
            setQuickContentType('image');
            setContentMode('quick');
            setView('display');
            return;
          }
        }

        // Check for text (might be video URL)
        if (item.type === 'text/plain') {
          item.getAsString((text) => {
            if (text.trim()) {
              if (isVideoUrl(text)) {
                setQuickContent(text.trim());
                setQuickContentType('video');
              } else {
                setQuickContent(text);
                setQuickContentType('text');
              }
              setContentMode('quick');
              setView('display');
            }
          });
          return;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [view, isVideoUrl]);

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

  const handleTabChange = useCallback((tab: 'scripture' | 'hymn') => {
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

  // Sync content to presentation window
  useEffect(() => {
    if (!isWindowOpen) return;

    const themeData = {
      background: currentTheme.colors.background,
      backgroundEnd: currentTheme.colors.backgroundEnd,
      accent: currentTheme.colors.accent,
    };

    if (view === 'display') {
      if (contentMode === 'scripture' && currentVerse) {
        sendToPresentation({
          type: 'scripture',
          data: currentVerse,
          theme: themeData,
        });
      } else if (contentMode === 'hymn' && currentHymnDisplayItem && currentHymn) {
        sendToPresentation({
          type: 'hymn',
          data: {
            title: `${currentHymn.number}. ${currentHymn.title}`,
            lines: [currentHymnDisplayItem.text],
            verseLabel: currentHymnDisplayItem.type === 'refrain' ? 'Refrain' : `Verse ${currentHymnDisplayItem.verseNumber}`,
            index: hymnDisplayIndex,
            total: hymnTotalItems,
          },
          theme: themeData,
        });
      } else if (contentMode === 'liturgy' && currentLiturgy) {
        sendToPresentation({
          type: 'liturgy',
          data: {
            title: currentLiturgy.title,
            content: currentLiturgy.paragraphs?.[0] || currentLiturgy.verses?.[0]?.lines.join(' ') || '',
            pageLabel: 'Page',
            index: 0,
            total: 1,
          },
          theme: themeData,
        });
      } else if (contentMode === 'quick' && quickContent) {
        sendToPresentation({
          type: 'quick',
          data: {
            content: quickContent,
            contentType: quickContentType,
          },
          theme: themeData,
        });
      }
    } else {
      sendToPresentation({ type: null, data: null, theme: themeData });
    }
  }, [
    isWindowOpen, view, contentMode, currentVerse, currentHymn, currentHymnDisplayItem,
    hymnDisplayIndex, hymnTotalItems, currentLiturgy, quickContent, quickContentType,
    currentTheme, sendToPresentation
  ]);

  // Sync content to OBS overlay (via BroadcastChannel)
  useEffect(() => {
    if (view === 'display' && obsOverlayVisible) {
      if (contentMode === 'scripture' && currentVerse) {
        sendToOBSOverlay({
          type: 'scripture',
          title: `${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`,
          text: currentVerse.text,
          theme: currentTheme,
          visible: true,
          mode: obsOverlayMode,
        });
      } else if (contentMode === 'hymn' && currentHymnDisplayItem && currentHymn) {
        sendToOBSOverlay({
          type: 'hymn',
          title: `Hymn ${currentHymn.number} - ${currentHymn.title}`,
          text: currentHymnDisplayItem.text,
          subtitle: currentHymnDisplayItem.type === 'refrain' ? 'Refrain' : `Verse ${currentHymnDisplayItem.verseNumber}`,
          theme: currentTheme,
          visible: true,
          mode: obsOverlayMode,
        });
      } else if (contentMode === 'liturgy' && currentLiturgy) {
        sendToOBSOverlay({
          type: 'liturgy',
          title: currentLiturgy.title,
          text: currentLiturgy.paragraphs?.[0] || currentLiturgy.verses?.[0]?.lines.join('\n') || '',
          theme: currentTheme,
          visible: true,
          mode: obsOverlayMode,
        });
      } else if (contentMode === 'quick' && quickContent && quickContentType === 'text') {
        sendToOBSOverlay({
          type: 'quick',
          text: quickContent,
          theme: currentTheme,
          visible: true,
          mode: obsOverlayMode,
        });
      }
    } else {
      // Hide overlay when not displaying or overlay is toggled off
      sendToOBSOverlay({ type: 'none', text: '', visible: false, mode: obsOverlayMode });
    }
  }, [view, contentMode, currentVerse, currentHymn, currentHymnDisplayItem, currentLiturgy, quickContent, quickContentType, currentTheme, obsOverlayVisible, obsOverlayMode]);

  // Handle re-selecting from history
  const handleHistorySelect = useCallback((item: HistoryItem) => {
    if (item.type === 'scripture') {
      const verse = item.data as Verse;
      setCurrentVerse(verse);
      setContentMode('scripture');
      setView('display');
    } else if (item.type === 'hymn') {
      const hymn = item.data as Hymn;
      setCurrentHymn(hymn);
      setHymnDisplayIndex(0);
      setContentMode('hymn');
      setView('display');
    } else if (item.type === 'liturgy') {
      const liturgy = item.data as LiturgyItem;
      setCurrentLiturgy(liturgy);
      setContentMode('liturgy');
      setView('display');
    } else if (item.type === 'quick') {
      const quick = item.data as { content: string; contentType: 'text' | 'image' | 'video' };
      setQuickContent(quick.content);
      setQuickContentType(quick.contentType);
      setContentMode('quick');
      setView('display');
    }
  }, []);

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
      {/* Theme-specific animations */}
      {currentTheme.animation && (
        <ThemeAnimation
          animationType={currentTheme.animation.type}
          intensity={currentTheme.animation.intensity}
          color={currentTheme.animation.color}
          themeColors={{
            primary: currentTheme.colors.primary,
            secondary: currentTheme.colors.secondary,
            accent: currentTheme.colors.accent,
          }}
        />
      )}

      {view === 'search' ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
          {/* Top toolbar */}
          <div className="fixed top-4 right-4 z-50 flex items-center gap-1.5" style={{ animation: 'fadeIn 0.6s ease-out' }}>
            {/* OBS Controls */}
            <button
              onClick={() => setObsOverlayVisible(!obsOverlayVisible)}
              className="p-2 rounded-lg text-white/30 hover:text-white/70 transition-all duration-200"
              style={{
                background: obsOverlayVisible ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${obsOverlayVisible ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.04)'}`,
              }}
              title={obsOverlayVisible ? 'Hide OBS overlay' : 'Show OBS overlay'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            {obsOverlayVisible && (
              <button
                onClick={() => setObsOverlayMode(obsOverlayMode === 'overlay' ? 'fullscreen' : 'overlay')}
                className="px-2 py-1.5 rounded-lg text-white/30 hover:text-white/60 text-[10px] font-medium tracking-wider uppercase transition-all duration-200"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
                title={`Switch to ${obsOverlayMode === 'overlay' ? 'fullscreen' : 'overlay'} mode`}
              >
                {obsOverlayMode === 'overlay' ? 'Bar' : 'Full'}
              </button>
            )}

            <div className="w-px h-5 mx-1" style={{ background: 'rgba(255, 255, 255, 0.06)' }} />

            {/* Project button */}
            <button
              onClick={isWindowOpen ? closePresentationWindow : openPresentationWindow}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/30 hover:text-white/70 transition-all duration-200 text-sm font-sans"
              style={{
                background: isWindowOpen ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isWindowOpen ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.04)'}`,
              }}
              title={isWindowOpen ? 'Close presentation window' : 'Open presentation window for projector/TV'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline text-xs">{isWindowOpen ? 'Close' : 'Project'}</span>
            </button>

            <ThemeSelector
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
            />
          </div>

          {/* Header */}
          <div className="text-center mb-10" style={{ animation: 'fadeIn 0.8s ease-out' }}>
            <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-wider text-white/90 mb-2"
                style={{ letterSpacing: '0.1em' }}>
              Sanctum
            </h1>
            <p className="text-white/25 text-sm font-sans tracking-widest uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.25em' }}>
              Church Projection
            </p>
          </div>

          {/* Tab Switcher */}
          <TabSwitcher
            activeTab={contentMode === 'scripture' || contentMode === 'hymn' ? contentMode : 'scripture'}
            onTabChange={handleTabChange}
          />

          {/* Search input */}
          <div className="w-full max-w-2xl" style={{ animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="glass-panel p-8">
              {(contentMode === 'scripture' || contentMode === 'liturgy' || contentMode === 'quick') ? (
                <ScriptureInput
                  onSubmit={handleScriptureSearch}
                  isLoading={isLoading}
                  autoFocus
                />
              ) : (
                <>
                  <HymnInput
                    onSubmit={handleHymnSearch}
                    isLoading={isLoading}
                    autoFocus
                  />
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setShowHymnManager(true)}
                      className="text-xs text-white/25 hover:text-white/50 transition-colors duration-200 font-sans tracking-wide"
                    >
                      Manage Custom Hymns
                    </button>
                  </div>
                </>
              )}

              {/* Error message */}
              {error && (
                <div className="mt-4 p-4 rounded-xl text-center text-sm font-sans animate-scale-in"
                     style={{
                       background: 'rgba(239, 68, 68, 0.08)',
                       border: '1px solid rgba(239, 68, 68, 0.15)',
                       color: 'rgba(252, 165, 165, 0.9)',
                     }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <QuickActions
              onSelectLiturgy={handleSelectLiturgy}
              onPasteContent={handlePasteContent}
              onVideoContent={handleVideoContent}
              onImageContent={handleImageContent}
              onTextContent={handleTextContent}
            />
          </div>

          {/* Tips */}
          <div className="mt-10 text-center max-w-md font-sans" style={{ animation: 'fadeIn 1.2s ease-out' }}>
            {hasExternalDisplay && (
              <p className="mb-3 text-xs" style={{ color: 'rgba(74, 222, 128, 0.5)' }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 animate-pulse" style={{ background: 'rgba(74, 222, 128, 0.6)' }} />
                External display detected
              </p>
            )}
            <p className="text-white/15 text-xs">
              Press{' '}
              <kbd className="px-1 py-0.5 rounded text-[10px] mx-0.5"
                   style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>F</kbd>
              {' '}fullscreen{' '}
              <span className="mx-1.5" style={{ color: 'rgba(255,255,255,0.08)' }}>&middot;</span>
              {' '}
              <kbd className="px-1 py-0.5 rounded text-[10px] mx-0.5"
                   style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>/</kbd>
              {' '}search
            </p>
          </div>

          {/* Footer */}
          <div className="fixed bottom-4 text-white/10 text-[10px] font-sans tracking-widest uppercase">
            Sanctum
          </div>

          {/* Projection History */}
          <ProjectionHistory
            history={history}
            onSelect={handleHistorySelect}
            onClear={clearHistory}
          />
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
          onJumpTo={handleScriptureJump}
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
          onJumpToVerse={handleHymnJump}
          canGoNext={canGoNextHymn}
          canGoPrevious={canGoPreviousHymn}
        />
      ) : contentMode === 'liturgy' && currentLiturgy ? (
        <LiturgyDisplay
          key={currentLiturgy.id}
          item={currentLiturgy}
          isFullscreen={isFullscreen}
          isCursorHidden={isCursorHidden}
          onToggleFullscreen={toggleFullscreen}
          onClose={handleNewSearch}
        />
      ) : contentMode === 'quick' && quickContent ? (
        <QuickDisplay
          content={quickContent}
          contentType={quickContentType}
          isFullscreen={isFullscreen}
          isCursorHidden={isCursorHidden}
          onToggleFullscreen={toggleFullscreen}
          onClose={handleNewSearch}
        />
      ) : null}

      {/* Hymn Manager Modal */}
      {showHymnManager && (
        <HymnManager onClose={() => setShowHymnManager(false)} />
      )}
    </div>
  );
}

export default App;
