import { useState, useCallback, useEffect } from 'react';
import { getHymnByNumber, getDisplayItemAtIndex, getTotalDisplayItems } from '../services/hymnService';
import { parseScriptureReference, fetchVerses } from '../services/bibleApi';
import type { Hymn, HymnDisplayItem } from '../types/hymn';
import type { Verse } from '../types/bible';

type DisplayMode = 'hidden' | 'hymn' | 'scripture';

export function OBSStandalone() {
  const [mode, setMode] = useState<DisplayMode>('hidden');
  const [showControls, setShowControls] = useState(true);

  // Hymn state
  const [hymnInput, setHymnInput] = useState('');
  const [currentHymn, setCurrentHymn] = useState<Hymn | null>(null);
  const [hymnIndex, setHymnIndex] = useState(0);
  const [hymnDisplayItem, setHymnDisplayItem] = useState<HymnDisplayItem | null>(null);
  const [hymnTotal, setHymnTotal] = useState(0);

  // Scripture state
  const [scriptureInput, setScriptureInput] = useState('');
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Update hymn display item when index changes
  useEffect(() => {
    if (currentHymn) {
      const item = getDisplayItemAtIndex(currentHymn, hymnIndex);
      setHymnDisplayItem(item);
    }
  }, [currentHymn, hymnIndex]);

  const loadHymn = useCallback(async () => {
    const num = parseInt(hymnInput, 10);
    if (isNaN(num)) {
      setError('Enter a valid hymn number');
      return;
    }

    setIsLoading(true);
    setError('');

    const hymn = getHymnByNumber(num);
    if (!hymn) {
      setError(`Hymn #${num} not found`);
      setIsLoading(false);
      return;
    }

    setCurrentHymn(hymn);
    setHymnIndex(0);
    setHymnTotal(getTotalDisplayItems(hymn));
    setMode('hymn');
    setIsLoading(false);
  }, [hymnInput]);

  const loadScripture = useCallback(async () => {
    const ref = parseScriptureReference(scriptureInput);
    if (!ref) {
      setError('Invalid format. Use: John 3:16');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const verses = await fetchVerses(ref);
      if (verses.length > 0) {
        setCurrentVerse(verses[0]);
        setMode('scripture');
      }
    } catch {
      setError('Scripture not found');
    }

    setIsLoading(false);
  }, [scriptureInput]);

  const nextItem = useCallback(() => {
    if (mode === 'hymn' && hymnIndex < hymnTotal - 1) {
      setHymnIndex(i => i + 1);
    }
  }, [mode, hymnIndex, hymnTotal]);

  const prevItem = useCallback(() => {
    if (mode === 'hymn' && hymnIndex > 0) {
      setHymnIndex(i => i - 1);
    }
  }, [mode, hymnIndex]);

  const hide = useCallback(() => {
    setMode('hidden');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextItem();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevItem();
          break;
        case 'Escape':
          hide();
          break;
        case 'c':
          setShowControls(s => !s);
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nextItem, prevItem, hide]);

  return (
    <div className="obs-standalone">
      {/* Control Panel - Toggle with 'C' key */}
      {showControls && (
        <div className="controls">
          <div className="control-row">
            <input
              type="text"
              placeholder="Hymn #"
              value={hymnInput}
              onChange={e => setHymnInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadHymn()}
            />
            <button onClick={loadHymn} disabled={isLoading}>Hymn</button>
          </div>

          <div className="control-row">
            <input
              type="text"
              placeholder="John 3:16"
              value={scriptureInput}
              onChange={e => setScriptureInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadScripture()}
            />
            <button onClick={loadScripture} disabled={isLoading}>Scripture</button>
          </div>

          <div className="control-row">
            <button onClick={prevItem} disabled={mode !== 'hymn' || hymnIndex === 0}>← Prev</button>
            <button onClick={hide}>Hide</button>
            <button onClick={nextItem} disabled={mode !== 'hymn' || hymnIndex >= hymnTotal - 1}>Next →</button>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="hint">Press 'C' to hide controls | Arrows/Space to navigate | Esc to hide display</div>
        </div>
      )}

      {/* Display Area */}
      {mode === 'hymn' && hymnDisplayItem && currentHymn && (
        <div className="display hymn-display">
          <div className="title">Hymn {currentHymn.number} - {currentHymn.title}</div>
          <div className="text">{hymnDisplayItem.text}</div>
          <div className="subtitle">
            {hymnDisplayItem.type === 'refrain' ? 'Refrain' : `Verse ${hymnDisplayItem.verseNumber}`}
            {' '}({hymnIndex + 1}/{hymnTotal})
          </div>
        </div>
      )}

      {mode === 'scripture' && currentVerse && (
        <div className="display scripture-display">
          <div className="title">{currentVerse.book} {currentVerse.chapter}:{currentVerse.verse}</div>
          <div className="text">{currentVerse.text}</div>
        </div>
      )}

      {mode === 'hidden' && !showControls && (
        <div className="hidden-hint">Press 'C' to show controls</div>
      )}

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .obs-standalone {
          position: fixed;
          inset: 0;
          background: #00ff00;
          font-family: Georgia, Cambria, 'Times New Roman', Times, serif;
          display: flex;
          flex-direction: column;
        }

        .controls {
          background: rgba(0,0,0,0.9);
          padding: 10px 15px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-family: system-ui, sans-serif;
        }

        .control-row {
          display: flex;
          gap: 8px;
        }

        .controls input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #444;
          border-radius: 4px;
          background: #222;
          color: white;
          font-size: 14px;
        }

        .controls button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background: #4a5568;
          color: white;
          cursor: pointer;
          font-size: 14px;
        }

        .controls button:hover:not(:disabled) {
          background: #5a6578;
        }

        .controls button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error {
          color: #ff6b6b;
          font-size: 12px;
        }

        .hint {
          color: #666;
          font-size: 11px;
          text-align: center;
        }

        .display {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4vh 4vw;
          text-align: center;
          background: linear-gradient(135deg, #0c0a09 0%, #1c1917 100%);
        }

        .title {
          color: #fbbf24;
          font-size: clamp(1.5rem, 3vh, 2.5rem);
          margin-bottom: 3vh;
        }

        .text {
          color: white;
          font-size: clamp(3rem, 7vh, 6rem);
          line-height: 1.3;
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
          white-space: pre-line;
          max-width: 95%;
        }

        .subtitle {
          color: #fbbf24;
          font-size: clamp(1rem, 2vh, 1.5rem);
          margin-top: 3vh;
          opacity: 0.8;
        }

        .hidden-hint {
          position: fixed;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          color: #006600;
          font-size: 12px;
          font-family: sans-serif;
        }
      `}</style>
    </div>
  );
}
