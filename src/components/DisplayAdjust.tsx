import { BIBLE_VERSIONS } from '../types/bible';

export const MIN_DISPLAY_SCALE = 0.6;
export const MAX_DISPLAY_SCALE = 2.2;
export const DISPLAY_SCALE_STEP = 0.05;

export function clampDisplayScale(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_DISPLAY_SCALE, Math.max(MIN_DISPLAY_SCALE, value));
}

interface ScaleSliderProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  /** Compact drops the "Aa" glyphs — used in the fullscreen hover strip */
  compact?: boolean;
}

/** Text-size adjuster for the projected copy. */
export function ScaleSlider({ scale, onScaleChange, compact = false }: ScaleSliderProps) {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid var(--hairline)',
      }}
      title={`Text size — ${Math.round(scale * 100)}%`}
    >
      {!compact && (
        <span className="font-serif leading-none select-none" style={{ fontSize: '0.8rem', color: 'var(--ink-40)' }}>
          A
        </span>
      )}
      <input
        type="range"
        min={MIN_DISPLAY_SCALE}
        max={MAX_DISPLAY_SCALE}
        step={DISPLAY_SCALE_STEP}
        value={scale}
        onChange={(e) => onScaleChange(parseFloat(e.target.value))}
        aria-label="Text size"
        className="scale-range"
        style={{ width: compact ? '5rem' : '6.5rem' }}
      />
      {!compact && (
        <span className="font-serif leading-none select-none" style={{ fontSize: '1.2rem', color: 'var(--ink-60)' }}>
          A
        </span>
      )}
      <span
        className="tabular-nums text-[11px] font-sans w-9 text-right"
        style={{ color: 'var(--ink-60)' }}
      >
        {Math.round(scale * 100)}%
      </span>
    </div>
  );
}

interface VersionSelectProps {
  version: string;
  onVersionChange: (version: string) => void;
  /** Show only the short name (KJV) rather than the full title */
  compact?: boolean;
}

/** Switch translation without leaving the projection. */
export function VersionSelect({ version, onVersionChange, compact = false }: VersionSelectProps) {
  return (
    <select
      value={version}
      onChange={(e) => onVersionChange(e.target.value)}
      aria-label="Bible version"
      title="Bible version"
      className="px-2.5 py-2.5 rounded-xl text-sm font-sans cursor-pointer focus:outline-none transition-colors duration-200"
      style={{
        color: 'var(--ink-80)',
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid var(--hairline)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--theme-accent) 60%, transparent)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--hairline)';
      }}
    >
      {BIBLE_VERSIONS.map((v) => (
        <option key={v.id} value={v.id} style={{ background: '#0f0e12', color: '#fff' }}>
          {compact ? v.name : `${v.name} — ${v.fullName}`}
        </option>
      ))}
    </select>
  );
}
