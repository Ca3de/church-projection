import { useState, useRef } from 'react';
import { liturgyItems, type LiturgyItem } from '../data/liturgy';

interface QuickActionsProps {
  onSelectLiturgy: (item: LiturgyItem) => void;
  onPasteContent: () => void;
  onVideoContent: (url: string) => void;
}

export function QuickActions({ onSelectLiturgy, onPasteContent, onVideoContent }: QuickActionsProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (videoUrl.trim()) {
      onVideoContent(videoUrl.trim());
      setVideoUrl('');
      setShowVideoInput(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onVideoContent(url);
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

          {/* Video URL button */}
          <button
            onClick={() => setShowVideoInput(!showVideoInput)}
            className={`btn-secondary py-3 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform ${showVideoInput ? 'bg-white/20' : ''}`}
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
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Video URL</span>
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
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Video URL input */}
        {showVideoInput && (
          <form onSubmit={handleVideoSubmit} className="mb-4 animate-fade-in">
            <div className="flex gap-2">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="YouTube, Vimeo, or video file URL..."
                className="input-field flex-1"
                autoFocus
              />
              <button
                type="submit"
                disabled={!videoUrl.trim()}
                className="btn-primary disabled:opacity-50"
              >
                Play
              </button>
            </div>
          </form>
        )}

        <p className="text-white/40 text-xs text-center">
          Paste text/image with <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">Ctrl+V</kbd>,
          or enter YouTube/Vimeo URL to display
        </p>
      </div>
    </div>
  );
}
