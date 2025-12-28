import { useState, useEffect } from 'react';
import type { Theme } from '../config/themes';
import { getThemeById, themes } from '../config/themes';

interface OverlayContent {
  type: 'scripture' | 'hymn' | 'liturgy' | 'quick' | 'none';
  title?: string;
  text: string;
  subtitle?: string;
  theme?: Theme;
}

const CHANNEL_NAME = 'church-projection-overlay';

export function OBSOverlay() {
  const [content, setContent] = useState<OverlayContent>({
    type: 'none',
    text: '',
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
    // This is needed for OBS Browser Source which runs in a separate browser instance
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

  // Don't render anything if no content
  if (content.type === 'none' || !content.text) {
    return (
      <div className="obs-overlay obs-overlay-empty">
        {/* Transparent - nothing to show */}
      </div>
    );
  }

  const accentColor = theme.colors?.accent || '#fbbf24';

  return (
    <div className="obs-overlay">
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
          background: #00ff00;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 2vh 4vw 6vh 4vw;
          font-family: Georgia, Cambria, 'Times New Roman', Times, serif;
        }

        .obs-overlay-empty {
          background: #00ff00;
          display: block;
        }

        .obs-content {
          background: rgba(0, 0, 0, 0.9);
          padding: 3vh 5vw 2vh 5vw;
          border-radius: 1rem;
          text-align: center;
          max-width: 92vw;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.8);
        }

        .obs-title {
          font-size: clamp(1.5rem, 3vh, 2.5rem);
          margin-bottom: 1.5vh;
          opacity: 0.95;
          font-weight: 500;
        }

        .obs-text {
          font-size: clamp(2.5rem, 6vh, 5rem);
          line-height: 1.3;
          color: white;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
          white-space: pre-line;
        }

        .obs-subtitle {
          font-size: clamp(1.2rem, 2.5vh, 2rem);
          margin-top: 1.5vh;
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

// Clear overlay content
export function clearOBSOverlay() {
  sendToOBSOverlay({ type: 'none', text: '' });
}
