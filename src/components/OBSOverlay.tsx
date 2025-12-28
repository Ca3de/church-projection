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
    const channel = new BroadcastChannel(CHANNEL_NAME);

    channel.onmessage = (event) => {
      const data = event.data as OverlayContent;
      setContent(data);
      if (data.theme) {
        setTheme(data.theme);
      }
    };

    // Also check localStorage for initial content
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

    return () => {
      channel.close();
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
          background: transparent;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 2vh 4vw 4vh 4vw;
          font-family: Georgia, Cambria, 'Times New Roman', Times, serif;
        }

        .obs-overlay-empty {
          display: none;
        }

        .obs-content {
          background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.7) 70%, rgba(0, 0, 0, 0) 100%);
          padding: 3vh 4vw 2vh 4vw;
          border-radius: 1rem;
          text-align: center;
          max-width: 90vw;
          backdrop-filter: blur(4px);
        }

        .obs-title {
          font-size: clamp(1rem, 2vh, 1.5rem);
          margin-bottom: 1vh;
          opacity: 0.9;
          font-weight: 500;
        }

        .obs-text {
          font-size: clamp(1.5rem, 4vh, 3rem);
          line-height: 1.4;
          color: white;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
          white-space: pre-line;
        }

        .obs-subtitle {
          font-size: clamp(0.875rem, 1.5vh, 1.25rem);
          margin-top: 1vh;
          opacity: 0.7;
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
