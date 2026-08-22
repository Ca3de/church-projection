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

  // Shared hover behaviour for the quiet text controls
  const lift = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.color = 'var(--ink-100)';
    const rule = e.currentTarget.querySelector('i');
    if (rule) (rule as HTMLElement).style.transform = 'scaleX(1)';
  };
  const settle = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.color = 'var(--ink-60)';
    const rule = e.currentTarget.querySelector('i');
    if (rule) (rule as HTMLElement).style.transform = 'scaleX(0)';
  };

  const ruleStyle: React.CSSProperties = {
    position: 'absolute',
    left: '0.5rem',
    right: '0.5rem',
    bottom: '0.45rem',
    height: '1px',
    background: 'var(--theme-accent)',
    opacity: 0.75,
    transform: 'scaleX(0)',
    transition: 'transform 0.45s var(--ease-out)',
  };

  return (
    <div className="w-full">
      {/* Liturgy */}
      <div className="ornament-divider mb-1.5">
        <span>Liturgy</span>
      </div>

      <div className="flex items-center justify-center flex-wrap gap-x-1 gap-y-0">
        {liturgyItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectLiturgy(item)}
            className="relative px-3.5 py-3 font-sans text-[13px] transition-colors duration-300"
            style={{ color: 'var(--ink-60)' }}
            onMouseEnter={lift}
            onMouseLeave={settle}
            title={item.title}
          >
            {item.shortTitle}
            <i aria-hidden="true" style={ruleStyle} />
          </button>
        ))}
      </div>

      {/* Media */}
      <div className="ornament-divider mt-5 mb-1.5">
        <span>Media</span>
      </div>

      <div className="flex items-center justify-center flex-wrap gap-x-1">
        <button
          onClick={onPasteContent}
          className="relative px-3.5 py-3 font-sans text-[13px] transition-colors duration-300"
          style={{ color: 'var(--ink-60)' }}
          onMouseEnter={lift}
          onMouseLeave={settle}
        >
          Paste
          <i aria-hidden="true" style={ruleStyle} />
        </button>

        <button
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="relative px-3.5 py-3 font-sans text-[13px] transition-colors duration-300"
          style={{ color: showUrlInput ? 'var(--ink-100)' : 'var(--ink-60)' }}
          onMouseEnter={lift}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = showUrlInput ? 'var(--ink-100)' : 'var(--ink-60)';
            const rule = e.currentTarget.querySelector('i');
            if (rule) (rule as HTMLElement).style.transform = showUrlInput ? 'scaleX(1)' : 'scaleX(0)';
          }}
        >
          URL
          <i
            aria-hidden="true"
            style={{ ...ruleStyle, transform: showUrlInput ? 'scaleX(1)' : 'scaleX(0)' }}
          />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative px-3.5 py-3 font-sans text-[13px] transition-colors duration-300"
          style={{ color: 'var(--ink-60)' }}
          onMouseEnter={lift}
          onMouseLeave={settle}
        >
          Upload
          <i aria-hidden="true" style={ruleStyle} />
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
          <div className="flex items-end gap-3">
            <input
              type="text"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Image or video URL"
              className="field flex-1 !text-base !py-1.5"
              autoFocus
            />
            <button type="submit" disabled={!mediaUrl.trim()} className="btn-primary !py-2.5 !px-4 shrink-0 mb-1">
              Display
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
