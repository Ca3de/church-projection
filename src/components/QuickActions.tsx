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
    <div className="w-full">
      <div className="panel-quiet px-5 py-5 sm:px-6 sm:py-6">
        {/* Liturgy */}
        <div className="ornament-divider mb-4">
          <span>Liturgy</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {liturgyItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectLiturgy(item)}
              className="group relative py-3.5 px-3 rounded-xl font-sans transition-all duration-300 flex flex-col items-center gap-2"
              style={{
                color: 'var(--ink-60)',
                background: 'var(--surface-1)',
                border: '1px solid var(--hairline)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-3)';
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--theme-accent) 30%, transparent)';
                e.currentTarget.style.color = 'var(--ink-100)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface-1)';
                e.currentTarget.style.borderColor = 'var(--hairline)';
                e.currentTarget.style.color = 'var(--ink-60)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              title={item.title}
            >
              {item.type === 'creed' ? (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
                </svg>
              )}
              <span className="text-xs font-medium tracking-wide">{item.shortTitle}</span>
            </button>
          ))}
        </div>

        {/* Media */}
        <div className="ornament-divider mb-4">
          <span>Media</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={onPasteContent} className="btn-secondary py-2.5 flex items-center justify-center gap-2 text-[13px]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
            </svg>
            Paste
          </button>

          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="btn-secondary py-2.5 flex items-center justify-center gap-2 text-[13px]"
            style={
              showUrlInput
                ? {
                    background: 'var(--surface-3)',
                    borderColor: 'color-mix(in srgb, var(--theme-accent) 40%, transparent)',
                    color: 'var(--ink-100)',
                  }
                : undefined
            }
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            URL
          </button>

          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary py-2.5 flex items-center justify-center gap-2 text-[13px]">
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
          <form onSubmit={handleUrlSubmit} className="mt-3 animate-scale-in">
            <div className="flex gap-2">
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Image or video URL"
                className="input-field flex-1 !py-2.5 !text-sm"
                autoFocus
              />
              <button type="submit" disabled={!mediaUrl.trim()} className="btn-primary disabled:opacity-35 !py-2.5 !px-4 text-sm">
                Display
              </button>
            </div>
          </form>
        )}

        <p className="text-xs text-center font-sans mt-4 flex items-center justify-center gap-2" style={{ color: 'var(--ink-40)' }}>
          <span className="kbd">Ctrl</span>
          <span className="kbd">V</span>
          <span>to paste anywhere</span>
        </p>
      </div>
    </div>
  );
}
