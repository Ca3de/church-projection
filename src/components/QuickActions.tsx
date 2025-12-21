import { useState, useRef } from 'react';
import { liturgyItems, type LiturgyItem } from '../data/liturgy';

interface QuickActionsProps {
  onSelectLiturgy: (item: LiturgyItem) => void;
  onPasteContent: () => void;
  onVideoContent: (url: string) => void;
  onImageContent: (url: string) => void;
  onTextContent: (text: string) => void;
}

export function QuickActions({ onSelectLiturgy, onPasteContent, onVideoContent, onImageContent, onTextContent }: QuickActionsProps) {
  const [mediaUrl, setMediaUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect URL type
  const getUrlType = (url: string): 'video' | 'image' | 'unknown' => {
    const trimmed = url.trim().toLowerCase();

    // Video platforms
    if (trimmed.match(/(?:youtube\.com|youtu\.be|vimeo\.com|instagram\.com\/(?:reel|p|tv)|facebook\.com)/)) {
      return 'video';
    }

    // Direct video files
    if (trimmed.match(/\.(mp4|webm|ogg|mov)(\?|$)/)) {
      return 'video';
    }

    // Direct image files
    if (trimmed.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/)) {
      return 'image';
    }

    return 'unknown';
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaUrl.trim()) {
      const urlType = getUrlType(mediaUrl);
      if (urlType === 'video') {
        onVideoContent(mediaUrl.trim());
      } else if (urlType === 'image') {
        onImageContent(mediaUrl.trim());
      } else {
        // Try as video first (most common use case for URLs)
        onVideoContent(mediaUrl.trim());
      }
      setMediaUrl('');
      setShowUrlInput(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        onImageContent(url);
      } else if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        onVideoContent(url);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        // Read text file content
        const text = await file.text();
        onTextContent(text);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl animate-slide-up">
      <div className="glass-panel p-6">
        <h3 className="text-white/70 text-sm font-medium mb-4 text-center uppercase tracking-wider">
          Quick Actions
        </h3>

        {/* Liturgy buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {liturgyItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectLiturgy(item)}
              className="btn-secondary py-3 px-4 text-sm font-medium flex flex-col items-center gap-1 hover:scale-105 transition-transform"
              title={item.title}
            >
              <span className="text-lg">
                {item.type === 'creed' ? '✝️' : '🎵'}
              </span>
              <span>{item.shortTitle}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-white/30 text-xs uppercase tracking-wider">Media</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Media buttons row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* Paste button */}
          <button
            onClick={onPasteContent}
            className="btn-secondary py-3 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span>Paste</span>
          </button>

          {/* Media URL button */}
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className={`btn-secondary py-3 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform ${showUrlInput ? 'bg-white/20' : ''}`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span>URL</span>
          </button>

          {/* Upload video button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary py-3 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span>Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.txt,text/plain"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Media URL input */}
        {showUrlInput && (
          <form onSubmit={handleUrlSubmit} className="mb-4 animate-fade-in">
            <div className="flex gap-2">
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Image or video URL (YouTube, Instagram, direct link...)"
                className="input-field flex-1"
                autoFocus
              />
              <button
                type="submit"
                disabled={!mediaUrl.trim()}
                className="btn-primary disabled:opacity-50"
              >
                Display
              </button>
            </div>
          </form>
        )}

        <p className="text-white/40 text-xs text-center">
          Paste with <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">Ctrl+V</kbd> |
          Upload images, videos, or text files |
          Enter any media URL
        </p>
      </div>
    </div>
  );
}
