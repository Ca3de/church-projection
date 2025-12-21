import { useState, useCallback, useEffect, useRef } from 'react';

// TypeScript types for the Window Management API
interface ScreenDetailed {
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
  width: number;
  height: number;
  isPrimary: boolean;
  isInternal: boolean;
  label: string;
}

interface ScreenDetails {
  screens: ScreenDetailed[];
  currentScreen: ScreenDetailed;
}

declare global {
  interface Window {
    getScreenDetails?: () => Promise<ScreenDetails>;
  }
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasExternalDisplay, setHasExternalDisplay] = useState(false);
  const [externalScreen, setExternalScreen] = useState<ScreenDetailed | null>(null);
  const presentationWindowRef = useRef<Window | null>(null);

  // Check for external displays on mount and when screens change
  useEffect(() => {
    const checkScreens = async () => {
      try {
        // Try the Window Management API first (Chrome 100+)
        if (window.getScreenDetails) {
          const screenDetails = await window.getScreenDetails();

          if (screenDetails.screens.length > 1) {
            // Find the non-primary or external screen
            const projectorScreen = screenDetails.screens.find(s => !s.isPrimary)
              || screenDetails.screens.find(s => !s.isInternal)
              || screenDetails.screens[1];

            if (projectorScreen) {
              setHasExternalDisplay(true);
              setExternalScreen(projectorScreen);
              return;
            }
          }
        }

        // Fallback: Check if window.screen dimensions suggest multiple monitors
        // This is less reliable but works in more browsers
        if (window.screen.availWidth > window.screen.width * 1.5) {
          setHasExternalDisplay(true);
        }
      } catch (error) {
        // Permission denied or API not available
        console.log('Screen detection not available:', error);
      }
    };

    checkScreens();

    // Listen for screen changes
    if ('onscreenschange' in window) {
      (window as unknown as { onscreenschange: () => void }).onscreenschange = checkScreens;
    }
  }, []);

  // Open presentation on external display
  const openOnExternalDisplay = useCallback(async () => {
    if (!externalScreen) {
      // No external screen detected, just fullscreen current window
      return false;
    }

    // Close existing presentation window if any
    if (presentationWindowRef.current && !presentationWindowRef.current.closed) {
      presentationWindowRef.current.close();
    }

    // Open window on the external screen
    const width = externalScreen.availWidth;
    const height = externalScreen.availHeight;
    const left = externalScreen.availLeft;
    const top = externalScreen.availTop;

    const newWindow = window.open(
      window.location.href,
      'ChurchProjectionExternal',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );

    if (newWindow) {
      presentationWindowRef.current = newWindow;

      // Wait for window to load then go fullscreen
      newWindow.addEventListener('load', async () => {
        try {
          // Small delay to ensure the window is ready
          await new Promise(resolve => setTimeout(resolve, 500));
          await newWindow.document.documentElement.requestFullscreen();
        } catch (e) {
          console.log('Could not auto-fullscreen external window:', e);
        }
      });

      return true;
    }

    return false;
  }, [externalScreen]);

  const enterFullscreen = useCallback(async () => {
    try {
      // If we have an external display, try to use it
      if (hasExternalDisplay && externalScreen) {
        const opened = await openOnExternalDisplay();
        if (opened) {
          setIsFullscreen(true);
          return;
        }
      }

      // Otherwise, fullscreen the current window
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  }, [hasExternalDisplay, externalScreen, openOnExternalDisplay]);

  const exitFullscreen = useCallback(async () => {
    try {
      // Close external presentation window if open
      if (presentationWindowRef.current && !presentationWindowRef.current.closed) {
        presentationWindowRef.current.close();
        presentationWindowRef.current = null;
      }

      // Exit fullscreen on current window
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Check if presentation window is still open
  useEffect(() => {
    const checkWindow = setInterval(() => {
      if (presentationWindowRef.current?.closed) {
        presentationWindowRef.current = null;
        if (isFullscreen && !document.fullscreenElement) {
          setIsFullscreen(false);
        }
      }
    }, 1000);

    return () => clearInterval(checkWindow);
  }, [isFullscreen]);

  return {
    isFullscreen,
    hasExternalDisplay,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    presentationWindow: presentationWindowRef.current,
  };
}
