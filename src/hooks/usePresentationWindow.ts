import { useState, useCallback, useEffect, useRef } from 'react';

export interface PresentationState {
  type: 'scripture' | 'hymn' | 'liturgy' | 'quick' | null;
  data: unknown;
  theme: unknown;
}

export function usePresentationWindow() {
  const [presentationWindow, setPresentationWindow] = useState<Window | null>(null);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const stateRef = useRef<PresentationState>({ type: null, data: null, theme: null });

  // Check if window is still open
  useEffect(() => {
    const checkWindow = setInterval(() => {
      if (presentationWindow && presentationWindow.closed) {
        setPresentationWindow(null);
        setIsWindowOpen(false);
      }
    }, 500);

    return () => clearInterval(checkWindow);
  }, [presentationWindow]);

  // Open the presentation window
  const openPresentationWindow = useCallback(() => {
    // If already open, focus it
    if (presentationWindow && !presentationWindow.closed) {
      presentationWindow.focus();
      return presentationWindow;
    }

    // Calculate window size (start at 1280x720 for a good presentation size)
    const width = 1280;
    const height = 720;
    const left = window.screenX + 100;
    const top = window.screenY + 100;

    const newWindow = window.open(
      '',
      'ChurchProjectionPresentation',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );

    if (newWindow) {
      // Set up the presentation window document
      newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Church Projection - Presentation</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              width: 100%;
              height: 100%;
              overflow: hidden;
              font-family: Georgia, Cambria, 'Times New Roman', Times, serif;
            }
            body {
              background: linear-gradient(135deg, var(--bg-start, #0c0a09) 0%, var(--bg-end, #1c1917) 100%);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            #presentation-root {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 2rem;
              text-align: center;
            }
            .waiting-message {
              color: rgba(255, 255, 255, 0.5);
              font-size: 1.5rem;
            }
            .waiting-hint {
              color: rgba(255, 255, 255, 0.3);
              font-size: 1rem;
              margin-top: 1rem;
            }
            .reference {
              color: var(--accent, #fbbf24);
              font-size: 1.5rem;
              margin-bottom: 1.5rem;
              opacity: 0.9;
            }
            .content {
              font-size: 3rem;
              line-height: 1.5;
              max-width: 90%;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            }
            .content.hymn {
              font-size: 2.5rem;
            }
            .content.liturgy {
              font-size: 2rem;
            }
            .hymn-title {
              color: var(--accent, #fbbf24);
              font-size: 1.8rem;
              margin-bottom: 1rem;
              opacity: 0.9;
            }
            .verse-indicator {
              color: var(--accent, #fbbf24);
              font-size: 1.2rem;
              margin-top: 1.5rem;
              opacity: 0.7;
            }
            .fullscreen-hint {
              position: fixed;
              bottom: 1rem;
              left: 50%;
              transform: translateX(-50%);
              color: rgba(255, 255, 255, 0.4);
              font-size: 0.875rem;
              padding: 0.5rem 1rem;
              background: rgba(0, 0, 0, 0.3);
              border-radius: 0.5rem;
              transition: opacity 0.3s;
            }
            body:fullscreen .fullscreen-hint,
            body:-webkit-full-screen .fullscreen-hint {
              display: none;
            }
            .quick-image {
              max-width: 90%;
              max-height: 80vh;
              object-fit: contain;
              border-radius: 0.5rem;
            }
            .quick-video {
              max-width: 90%;
              max-height: 80vh;
            }
            .quick-video iframe {
              width: 100%;
              height: 100%;
              min-height: 50vh;
              border: none;
              border-radius: 0.5rem;
            }
          </style>
        </head>
        <body>
          <div id="presentation-root">
            <p class="waiting-message">Waiting for content...</p>
            <p class="waiting-hint">Display content from the control window</p>
          </div>
          <div class="fullscreen-hint">Press F11 or double-click for fullscreen</div>
          <script>
            // Handle double-click for fullscreen
            document.body.addEventListener('dblclick', function() {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            });

            // Handle F11 key
            document.addEventListener('keydown', function(e) {
              if (e.key === 'F11') {
                e.preventDefault();
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                } else {
                  document.exitFullscreen();
                }
              }
            });
          </script>
        </body>
        </html>
      `);
      newWindow.document.close();

      setPresentationWindow(newWindow);
      setIsWindowOpen(true);

      // If we have state, update the window
      if (stateRef.current.type) {
        setTimeout(() => updatePresentationContent(newWindow, stateRef.current), 100);
      }
    }

    return newWindow;
  }, [presentationWindow]);

  // Update content in the presentation window
  const updatePresentationContent = useCallback((win: Window | null, state: PresentationState) => {
    const targetWindow = win || presentationWindow;
    if (!targetWindow || targetWindow.closed) return;

    stateRef.current = state;

    const root = targetWindow.document.getElementById('presentation-root');
    if (!root) return;

    // Apply theme
    const theme = state.theme as { background?: string; backgroundEnd?: string; accent?: string } | undefined;
    if (theme) {
      targetWindow.document.body.style.setProperty('--bg-start', theme.background || '#0c0a09');
      targetWindow.document.body.style.setProperty('--bg-end', theme.backgroundEnd || '#1c1917');
      targetWindow.document.body.style.setProperty('--accent', theme.accent || '#fbbf24');
    }

    // Render content based on type
    switch (state.type) {
      case 'scripture': {
        const verse = state.data as { book: string; chapter: number; verse: number; text: string };
        root.innerHTML = `
          <p class="reference">${verse.book} ${verse.chapter}:${verse.verse}</p>
          <p class="content">${verse.text}</p>
        `;
        break;
      }
      case 'hymn': {
        const hymn = state.data as { title: string; lines: string[]; verseLabel: string; index: number; total: number };
        root.innerHTML = `
          <p class="hymn-title">${hymn.title}</p>
          <div class="content hymn">
            ${hymn.lines.map(line => `<p>${line}</p>`).join('')}
          </div>
          <p class="verse-indicator">${hymn.verseLabel} (${hymn.index + 1}/${hymn.total})</p>
        `;
        break;
      }
      case 'liturgy': {
        const liturgy = state.data as { title: string; content: string; pageLabel: string; index: number; total: number };
        root.innerHTML = `
          <p class="hymn-title">${liturgy.title}</p>
          <div class="content liturgy">
            <p>${liturgy.content}</p>
          </div>
          <p class="verse-indicator">${liturgy.pageLabel} (${liturgy.index + 1}/${liturgy.total})</p>
        `;
        break;
      }
      case 'quick': {
        const quick = state.data as { content: string; contentType: 'text' | 'image' | 'video'; pageIndex?: number; totalPages?: number };
        if (quick.contentType === 'image') {
          root.innerHTML = `<img src="${quick.content}" class="quick-image" alt="Display content" />`;
        } else if (quick.contentType === 'video') {
          root.innerHTML = `<div class="quick-video"><iframe src="${quick.content}" allowfullscreen></iframe></div>`;
        } else {
          const pageInfo = quick.totalPages && quick.totalPages > 1
            ? `<p class="verse-indicator">Page ${(quick.pageIndex || 0) + 1} of ${quick.totalPages}</p>`
            : '';
          root.innerHTML = `
            <div class="content liturgy">
              <p>${quick.content}</p>
            </div>
            ${pageInfo}
          `;
        }
        break;
      }
      default:
        root.innerHTML = `
          <p class="waiting-message">Waiting for content...</p>
          <p class="waiting-hint">Display content from the control window</p>
        `;
    }
  }, [presentationWindow]);

  // Send state update
  const sendToPresentation = useCallback((state: PresentationState) => {
    stateRef.current = state;
    if (presentationWindow && !presentationWindow.closed) {
      updatePresentationContent(presentationWindow, state);
    }
  }, [presentationWindow, updatePresentationContent]);

  // Close the presentation window
  const closePresentationWindow = useCallback(() => {
    if (presentationWindow && !presentationWindow.closed) {
      presentationWindow.close();
    }
    setPresentationWindow(null);
    setIsWindowOpen(false);
  }, [presentationWindow]);

  return {
    isWindowOpen,
    openPresentationWindow,
    closePresentationWindow,
    sendToPresentation,
  };
}
