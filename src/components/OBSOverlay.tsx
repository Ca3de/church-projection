import { useState, useEffect } from 'react';
import type { Theme } from '../config/themes';
import { getThemeById, themes } from '../config/themes';

interface OverlayContent {
  type: 'scripture' | 'hymn' | 'liturgy' | 'quick' | 'none';
  title?: string;
  text: string;
  subtitle?: string;
  theme?: Theme;
  visible?: boolean;
  mode?: 'fullscreen' | 'overlay';
}

const CHANNEL_NAME = 'church-projection-overlay';

export function OBSOverlay() {
  const [content, setContent] = useState<OverlayContent>({
    type: 'none',
    text: '',
    visible: false,
    mode: 'overlay',
  });
  const [theme, setTheme] = useState<Theme>(themes[0]);

  useEffect(() => {
    // Listen for content updates via BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        const data = event.data as OverlayContent;
        setContent(data);
        if (data.theme) {
          setTheme(data.theme);
        }
      };
    } catch {
      // BroadcastChannel not supported
    }

    // Check localStorage for initial content and poll for updates
    const checkLocalStorage = () => {
      const savedContent = localStorage.getItem('obs-overlay-content');
      if (savedContent) {
        try {
          const parsed = JSON.parse(savedContent) as OverlayContent;
          setContent(parsed);
          if (parsed.theme) {
            const themeObj = getThemeById(parsed.theme.id);
            setTheme(themeObj);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    // Initial check
    checkLocalStorage();

    // Poll localStorage every 500ms for OBS Browser Source compatibility
    const pollInterval = setInterval(checkLocalStorage, 500);

    return () => {
      channel?.close();
      clearInterval(pollInterval);
    };
  }, []);

  const isFullscreen = content.mode === 'fullscreen';
  const accentColor = theme.colors?.accent || '#fbbf24';
  const bgStart = theme.colors?.background || '#0c0a09';
  const bgEnd = theme.colors?.backgroundEnd || '#1c1917';

  // Hidden state - green screen only (with small status indicator)
  if (!content.visible || content.type === 'none' || !content.text) {
    return (
      <div className="obs-overlay obs-overlay-empty">
        <div className="obs-status">
          {content.visible === false ? 'OBS OFF - Toggle ON in main app' : 'Waiting for content...'}
        </div>
        <style>{`
          .obs-overlay-empty {
            position: fixed;
            inset: 0;
            background: #00ff00;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 10px;
          }
          .obs-status {
            color: #006600;
            font-size: 14px;
            font-family: sans-serif;
            padding: 5px 15px;
            background: rgba(0,100,0,0.2);
            border-radius: 4px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`obs-overlay ${isFullscreen ? 'obs-fullscreen' : 'obs-bottom'}`}>
      <div className="obs-content">
        {/* Title/Reference */}
        {content.title && (
          <p className="obs-title" style={{ color: accentColor }}>
            {content.title}
          </p>
        )}

        {/* Main text */}
        <p className="obs-text">
          {content.text}
        </p>

        {/* Subtitle (verse indicator, etc.) */}
        {content.subtitle && (
          <p className="obs-subtitle" style={{ color: accentColor }}>
            {content.subtitle}
          </p>
        )}
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .obs-overlay {
          position: fixed;
          inset: 0;
          font-family: Georgia, Cambria, 'Times New Roman', Times, serif;
        }

        /* Fullscreen mode - themed background, centered content */
        .obs-fullscreen {
          background: linear-gradient(135deg, ${bgStart} 0%, ${bgEnd} 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4vh 4vw;
        }

        .obs-fullscreen .obs-content {
          background: transparent;
          padding: 0;
          max-width: 94vw;
          text-align: center;
        }

        .obs-fullscreen .obs-title {
          font-size: clamp(2rem, 4vh, 3.5rem);
          margin-bottom: 3vh;
        }

        .obs-fullscreen .obs-text {
          font-size: clamp(4rem, 8vh, 7rem);
          line-height: 1.3;
        }

        .obs-fullscreen .obs-subtitle {
          font-size: clamp(1.5rem, 3vh, 2.5rem);
          margin-top: 3vh;
        }

        /* Overlay mode - green background with bottom bar */
        .obs-bottom {
          background: #00ff00;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 2vh 4vw 4vh 4vw;
        }

        .obs-bottom .obs-content {
          background: rgba(0, 0, 0, 0.9);
          padding: 2.5vh 4vw 2vh 4vw;
          border-radius: 1rem;
          text-align: center;
          max-width: 94vw;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.8);
        }

        .obs-bottom .obs-title {
          font-size: clamp(1.2rem, 2.5vh, 2rem);
          margin-bottom: 1vh;
          opacity: 0.95;
        }

        .obs-bottom .obs-text {
          font-size: clamp(2rem, 5vh, 4rem);
          line-height: 1.3;
        }

        .obs-bottom .obs-subtitle {
          font-size: clamp(1rem, 2vh, 1.5rem);
          margin-top: 1vh;
          opacity: 0.8;
        }

        /* Shared text styles */
        .obs-title {
          font-weight: 500;
        }

        .obs-text {
          color: white;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
          white-space: pre-line;
        }

        .obs-subtitle {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}

// Helper to send content to overlay from main app
export function sendToOBSOverlay(content: OverlayContent) {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(content);
    channel.close();

    // Also save to localStorage for page refresh
    localStorage.setItem('obs-overlay-content', JSON.stringify(content));
  } catch {
    // BroadcastChannel not supported, fallback to localStorage only
    localStorage.setItem('obs-overlay-content', JSON.stringify(content));
  }
}

// Clear/hide overlay content
export function clearOBSOverlay() {
  sendToOBSOverlay({ type: 'none', text: '', visible: false });
}
