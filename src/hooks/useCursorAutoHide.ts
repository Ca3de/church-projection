import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to auto-hide cursor after a period of inactivity.
 * Cursor reappears on mouse movement.
 */
export function useCursorAutoHide(enabled: boolean, delay: number = 2000) {
  const [isCursorHidden, setIsCursorHidden] = useState(false);

  const showCursor = useCallback(() => {
    setIsCursorHidden(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsCursorHidden(false);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    const hideCursor = () => {
      setIsCursorHidden(true);
    };

    const handleMouseMove = () => {
      showCursor();
      clearTimeout(timeoutId);
      timeoutId = setTimeout(hideCursor, delay);
    };

    // Start the timer immediately
    timeoutId = setTimeout(hideCursor, delay);

    // Listen for mouse movement
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enabled, delay, showCursor]);

  return { isCursorHidden };
}
