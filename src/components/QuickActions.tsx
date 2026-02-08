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

  const getUrlType = (url: string): 'video' | 'image' | 'unknown' => {
    const trimmed = url.trim().toLowerCase();
    if (trimmed.match(/(?:youtube\.com|youtu\.be|vimeo\.com|instagram\.com\/(?:reel|p|tv)|facebook\.com)/)) return 'video';
    if (trimmed.match(/\.(mp4|webm|ogg|mov)(\?|$)/)) return 'video';
    if (trimmed.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/)) return 'image';
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
        onVideoContent(mediaUrl.trim());
      }
      setMediaUrl('');
      setShowUrlInput(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        onImageContent(url);
      } else if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        onVideoContent(url);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        onTextContent(text);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl animate-slide-up">
      <div className="glass-panel p-6">
        {/* Liturgy Section */}
        <div className="ornament-divider mb-5">
          <span>Liturgy</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {liturgyItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectLiturgy(item)}
              className="group relative py-3 px-4 rounded-xl text-sm font-sans font-medium text-white/50 hover:text-white transition-all duration-300 flex flex-col items-center gap-1.5"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.06)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.02)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.04)';
              }}
              title={item.title}
            >
              <span className="text-base opacity-60 group-hover:opacity-100 transition-opacity">
                {item.type === 'creed' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
                  </svg>
                )}
              </span>
              <span className="text-xs">{item.shortTitle}</span>
            </button>
          ))}
        </div>

        {/* Media Section */}
        <div className="ornament-divider mb-5">
          <span>Media</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={onPasteContent}
            className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
            </svg>
            Paste
          </button>

          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className={`btn-secondary py-3 flex items-center justify-center gap-2 text-sm ${showUrlInput ? '!border-white/20 !bg-white/10' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            URL
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.txt,text/plain"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* URL Input */}
        {showUrlInput && (
          <form onSubmit={handleUrlSubmit} className="mb-4 animate-scale-in">
            <div className="flex gap-2">
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Image or video URL..."
                className="input-field flex-1 !py-3 !text-sm"
                autoFocus
              />
              <button
                type="submit"
                disabled={!mediaUrl.trim()}
                className="btn-primary disabled:opacity-40 !py-3 text-sm"
              >
                Display
              </button>
            </div>
          </form>
        )}

        <p className="text-white/20 text-xs text-center font-sans">
          <kbd className="px-1 py-0.5 rounded text-[10px]"
               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            Ctrl+V
          </kbd>
          <span className="mx-2">to paste anywhere</span>
        </p>
      </div>
    </div>
  );
}
