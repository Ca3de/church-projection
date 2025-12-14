import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onNext?: () => void;
  onPrevious?: () => void;
  onFullscreen?: () => void;
  onEscape?: () => void;
  onSearch?: () => void;
}

export function useKeyboardShortcuts({
  onNext,
  onPrevious,
  onFullscreen,
  onEscape,
  onSearch,
}: KeyboardShortcuts) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Allow Escape and Enter in input fields
        if (event.key === 'Escape' && onEscape) {
          onEscape();
          return;
        }
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case ' ':
        case 'n':
          event.preventDefault();
          onNext?.();
          break;
        case 'ArrowLeft':
        case 'p':
        case 'Backspace':
          event.preventDefault();
          onPrevious?.();
          break;
        case 'f':
        case 'F11':
          event.preventDefault();
          onFullscreen?.();
          break;
        case 'Escape':
          onEscape?.();
          break;
        case '/':
        case 's':
          event.preventDefault();
          onSearch?.();
          break;
      }
    },
    [onNext, onPrevious, onFullscreen, onEscape, onSearch]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
