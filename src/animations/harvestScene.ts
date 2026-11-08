import type { AnimationIntensity } from './types';

/**
 * A wheat field along the bottom of the screen, swaying as a breeze rolls
 * across it, with grain and light drifting above.
 *
 * Plain canvas code with no React, so the projection window can run it too:
 * it draws with the canvas's own window, whichever window that is.
 */

export type HarvestPalette = 'gold' | 'fields';

export interface HarvestScene {
  stop(): void;
}

interface RowStyle {
  /** Stalk height as a share of the screen height */
  height: [number, number];
  /** Pixels between stalks at normal intensity */
  spacing: number;
  stem: string;
  stemWidth: number;
  grain: string;
  grainEdge: string;
  /** Draw the long bristles on each ear */
  awns: boolean;
  alpha: number;
  /** How far the breeze bends this row, in radians */
  sway: number;
}

interface Palette {
  rows: RowStyle[];
  /** Soft light behind the field */
  glow: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  particles: { mote: number; grain: number; leaf: number };
  mote: string;
  grain: string;
  leaf: string;
}

const PALETTES: Record<HarvestPalette, Palette> = {
  // Dusk: dark stalks against a low gold sun, motes rising in the last light
  gold: {
    rows: [
      { height: [0.05, 0.075], spacing: 11, stem: '#7a4e1c', stemWidth: 1, grain: '#b98532', grainEdge: '#7a4e1c', awns: false, alpha: 0.45, sway: 0.05 },
      { height: [0.065, 0.1], spacing: 14, stem: '#543412', stemWidth: 1.4, grain: '#cf9a3e', grainEdge: '#6b4316', awns: true, alpha: 0.7, sway: 0.07 },
      { height: [0.08, 0.13], spacing: 18, stem: '#28180a', stemWidth: 2, grain: '#e2ad4c', grainEdge: '#5a3510', awns: true, alpha: 0.92, sway: 0.09 },
    ],
    glow: (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h * 1.08, 0, w / 2, h * 1.08, Math.max(w, h) * 0.7);
      g.addColorStop(0, 'rgba(255, 170, 70, 0.32)');
      g.addColorStop(0.35, 'rgba(235, 120, 40, 0.12)');
      g.addColorStop(1, 'rgba(235, 120, 40, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    particles: { mote: 0.8, grain: 0.2, leaf: 0 },
    mote: '255, 214, 150',
    grain: '#e2b057',
    leaf: '#8a5a22',
  },
  // Daylight: green stalks with ripe gold ears, grain and leaves on the wind
  fields: {
    rows: [
      { height: [0.05, 0.075], spacing: 11, stem: '#4f7d36', stemWidth: 1, grain: '#a8b65a', grainEdge: '#4f7d36', awns: false, alpha: 0.45, sway: 0.05 },
      { height: [0.065, 0.1], spacing: 14, stem: '#356b2e', stemWidth: 1.4, grain: '#d2b648', grainEdge: '#5d6a22', awns: true, alpha: 0.72, sway: 0.07 },
      { height: [0.08, 0.13], spacing: 18, stem: '#1d4a22', stemWidth: 2, grain: '#ecc244', grainEdge: '#6a5a14', awns: true, alpha: 0.95, sway: 0.09 },
    ],
    glow: (ctx, w, h) => {
      const sun = ctx.createRadialGradient(w * 0.5, -h * 0.15, 0, w * 0.5, -h * 0.15, Math.max(w, h) * 0.8);
      sun.addColorStop(0, 'rgba(255, 230, 150, 0.16)');
      sun.addColorStop(1, 'rgba(255, 230, 150, 0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, h);
      const meadow = ctx.createLinearGradient(0, h, 0, h * 0.62);
      meadow.addColorStop(0, 'rgba(70, 150, 60, 0.22)');
      meadow.addColorStop(1, 'rgba(70, 150, 60, 0)');
      ctx.fillStyle = meadow;
      ctx.fillRect(0, h * 0.62, w, h * 0.38);
    },
    particles: { mote: 0.25, grain: 0.45, leaf: 0.3 },
    mote: '255, 240, 190',
    grain: '#ecc244',
    leaf: '#5c9a3c',
  },
};

const DENSITY: Record<AnimationIntensity, number> = { light: 1.4, normal: 1, heavy: 0.8 };
const PARTICLES: Record<AnimationIntensity, number> = { light: 24, normal: 44, heavy: 76 };

/** One ear of wheat, drawn once per row and stamped onto every stalk. Base of the ear at bottom centre. */
function paintEar(doc: Document, style: RowStyle): HTMLCanvasElement {
  const scale = 2; // drawn at twice size so it stays crisp when stretched
  const w = 18;
  const h = style.awns ? 58 : 40;
  const ear = doc.createElement('canvas');
  ear.width = w * scale;
  ear.height = h * scale;
  const ctx = ear.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.translate(w / 2, h);

  const levels = 8;
  const length = 34;
  ctx.strokeStyle = style.grainEdge;
  ctx.lineWidth = 0.7;
  for (let i = 0; i < levels; i++) {
    const t = i / (levels - 1);
    const y = -3 - t * length;
    const size = 1 - t * 0.45;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * 2.6 * size, y + (side > 0 ? -2 : 0));
      ctx.rotate(side * 0.38);
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.9 * size, 5 * size, 0, 0, Math.PI * 2);
      ctx.fillStyle = style.grain;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      if (style.awns && t > 0.15) {
        ctx.beginPath();
        ctx.moveTo(side * 2.6 * size, y - 4 * size);
        ctx.lineTo(side * (3.5 + t * 3), y - 4 * size - (14 + t * 6));
        ctx.lineWidth = 0.45;
        ctx.stroke();
        ctx.lineWidth = 0.7;
      }
    }
  }
  return ear;
}

interface Stalk {
  x: number;
  height: number;
  lean: number;
  phase: number;
  ear: number;
  leafSide: number;
}

interface Row {
  style: RowStyle;
  stalks: Stalk[];
  ear: HTMLCanvasElement;
}

interface Particle {
  kind: 'mote' | 'grain' | 'leaf';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  phase: number;
  alpha: number;
}

export function startHarvestScene(
  canvas: HTMLCanvasElement,
  { palette: paletteName, intensity, wind = () => 0 }: { palette: HarvestPalette; intensity: AnimationIntensity; wind?: () => number }
): HarvestScene {
  const view = canvas.ownerDocument.defaultView!;
  const ctx = canvas.getContext('2d')!;
  const palette = PALETTES[paletteName];
  const ears = palette.rows.map((style) => paintEar(canvas.ownerDocument, style));
  let width = 0;
  let height = 0;
  let rows: Row[] = [];
  let particles: Particle[] = [];
  let glow: HTMLCanvasElement | null = null;
  let frame = 0;
  let last = 0;
  let time = 0;

  const spawn = (anywhere: boolean): Particle => {
    const roll = Math.random();
    const kind = roll < palette.particles.mote ? 'mote' : roll < palette.particles.mote + palette.particles.grain ? 'grain' : 'leaf';
    const rising = kind === 'mote';
    return {
      kind,
      x: Math.random() * width,
      // Motes rise out of the field; grain and leaves blow in from above
      y: anywhere ? Math.random() * height : rising ? height * (0.85 + Math.random() * 0.15) : -10,
      vx: (Math.random() - 0.5) * 0.012,
      vy: rising ? -(0.006 + Math.random() * 0.016) : 0.012 + Math.random() * 0.022,
      size: kind === 'mote' ? 0.8 + Math.random() * 1.8 : kind === 'grain' ? 1.4 + Math.random() * 1.2 : 2.4 + Math.random() * 2,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.004,
      phase: Math.random() * Math.PI * 2,
      alpha: kind === 'mote' ? 0.35 + Math.random() * 0.5 : 0.5 + Math.random() * 0.4,
    };
  };

  const resize = () => {
    width = view.innerWidth;
    height = view.innerHeight;
    canvas.width = width;
    canvas.height = height;

    rows = palette.rows.map((style, i) => {
      const stalks: Stalk[] = [];
      const step = style.spacing * DENSITY[intensity];
      for (let x = -step; x < width + step; x += step * (0.6 + Math.random() * 0.8)) {
        stalks.push({
          x,
          height: height * (style.height[0] + Math.random() * (style.height[1] - style.height[0])),
          lean: (Math.random() - 0.5) * 0.12,
          phase: Math.random() * Math.PI * 2,
          ear: 0.75 + Math.random() * 0.4,
          leafSide: Math.random() < 0.5 ? -1 : 1,
        });
      }
      return { style, stalks, ear: ears[i] };
    });

    glow = canvas.ownerDocument.createElement('canvas');
    glow.width = width;
    glow.height = height;
    palette.glow(glow.getContext('2d')!, width, height);

    particles = Array.from({ length: PARTICLES[intensity] }, () => spawn(true));
  };

  const drawField = (breeze: number) => {
    for (const row of rows) {
      const { style } = row;
      const earW = row.ear.width / 2;
      const earH = row.ear.height / 2;
      const tips: { x: number; y: number; angle: number; scale: number }[] = [];

      // Every stem and leaf blade in the row goes into one path, stroked once
      ctx.globalAlpha = style.alpha;
      ctx.strokeStyle = style.stem;
      ctx.lineWidth = style.stemWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (const s of row.stalks) {
        // A gust travelling across the field, so neighbours bend in turn
        const wave = Math.sin(s.x * 0.0045 - time * 0.0011 + s.phase * 0.35) * 0.65 + Math.sin(s.x * 0.012 - time * 0.0021 + s.phase) * 0.35;
        const angle = s.lean + breeze + wave * style.sway;
        const baseY = height + 2;
        const tipX = s.x + Math.sin(angle) * s.height;
        const tipY = baseY - Math.cos(angle) * s.height;
        const ctrlX = s.x + Math.sin(angle) * s.height * 0.22;
        const ctrlY = baseY - s.height * 0.6;
        ctx.moveTo(s.x, baseY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);

        // One blade, curving out and down from low on the stem
        const leafY = baseY - s.height * 0.32;
        const leafX = s.x + Math.sin(angle) * s.height * 0.1;
        const reach = s.height * 0.3;
        ctx.moveTo(leafX, leafY);
        ctx.quadraticCurveTo(leafX + s.leafSide * reach * 0.5, leafY - reach * 0.55, leafX + s.leafSide * reach + Math.sin(angle) * reach * 0.4, leafY - reach * 0.15);

        // Ear about a third of the stalk, awns included
        tips.push({ x: tipX, y: tipY, angle: Math.atan2(tipX - ctrlX, ctrlY - tipY), scale: (s.height * 0.34 * s.ear) / earH });
      }
      ctx.stroke();

      // Ears, stamped along the direction each stem points
      for (const t of tips) {
        const cos = Math.cos(t.angle) * t.scale;
        const sin = Math.sin(t.angle) * t.scale;
        ctx.setTransform(cos, sin, -sin, cos, t.x, t.y);
        ctx.drawImage(row.ear, -earW / 2, -earH + 3, earW, earH);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.globalAlpha = 1;
  };

  const drawParticles = (dt: number, breeze: number) => {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += (p.vx + breeze * 0.25) * dt;
      p.y += p.vy * dt;
      p.rotation += p.spin * dt;
      if (p.y < -20 || p.y > height + 20 || p.x < -40 || p.x > width + 40) {
        particles[i] = spawn(false);
        continue;
      }

      if (p.kind === 'mote') {
        const twinkle = 0.55 + 0.45 * Math.sin(time * 0.0018 + p.phase);
        // Fade out as they rise towards the text
        const lift = Math.min(1, Math.max(0, (p.y / height - 0.15) / 0.5));
        const a = p.alpha * twinkle * lift;
        ctx.fillStyle = `rgba(${palette.mote}, ${a * 0.22})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${palette.mote}, ${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const cos = Math.cos(p.rotation);
        const sin = Math.sin(p.rotation);
        ctx.setTransform(cos, sin, -sin, cos, p.x, p.y);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.kind === 'grain' ? palette.grain : palette.leaf;
        ctx.beginPath();
        if (p.kind === 'grain') ctx.ellipse(0, 0, p.size * 0.55, p.size, 0, 0, Math.PI * 2);
        else ctx.ellipse(0, 0, p.size * 0.28, p.size * 1.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
      }
    }
  };

  const tick = (now: number) => {
    const dt = last ? Math.min(now - last, 50) : 16;
    last = now;
    time += dt;

    const breeze = Math.sin(time * 0.00031) * 0.05 + Math.sin(time * 0.00087 + 1.3) * 0.025 + wind();
    ctx.clearRect(0, 0, width, height);
    if (glow) ctx.drawImage(glow, 0, 0);
    drawParticles(dt, breeze);
    drawField(breeze);

    frame = view.requestAnimationFrame(tick);
  };

  resize();
  view.addEventListener('resize', resize);
  frame = view.requestAnimationFrame(tick);

  return {
    stop() {
      view.cancelAnimationFrame(frame);
      view.removeEventListener('resize', resize);
      ctx.clearRect(0, 0, width, height);
    },
  };
}
