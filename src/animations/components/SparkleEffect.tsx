import { useEffect, useRef, useCallback } from 'react';
import type { AnimationProps } from '../types';
import { PARTICLE_COUNTS } from '../types';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  phase: number;
  phaseSpeed: number;
  rotation: number;
  rotationSpeed: number;
  type: 'star' | 'burst' | 'flare' | 'twinkle';
  layer: 'far' | 'mid' | 'near';
  color: string;
  trail: Array<{ x: number; y: number; opacity: number }>;
}

interface Burst {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  rays: number;
  size: number;
  color: string;
}

// Draw a multi-pointed star
function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  points: number,
  rotation: number,
  color: string,
  opacity: number,
  glow: boolean
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = opacity;

  if (glow) {
    ctx.shadowBlur = size * 2;
    ctx.shadowColor = color;
  }

  const outerRadius = size;
  const innerRadius = size * 0.4;

  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Gradient fill
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'));

  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.restore();
}

// Draw a starburst with rays
function drawBurst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rays: number,
  rotation: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = opacity;

  // Core glow
  ctx.shadowBlur = size;
  ctx.shadowColor = color;

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.3);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, 'transparent');

  ctx.beginPath();
  ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Long rays
  ctx.lineWidth = Math.max(1, size / 15);
  ctx.lineCap = 'round';

  for (let i = 0; i < rays; i++) {
    const angle = (i * Math.PI * 2) / rays;
    const rayLength = size * (0.8 + Math.sin(i * 2.5) * 0.3);

    const rayGradient = ctx.createLinearGradient(0, 0, Math.cos(angle) * rayLength, Math.sin(angle) * rayLength);
    rayGradient.addColorStop(0, color);
    rayGradient.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * rayLength, Math.sin(angle) * rayLength);
    ctx.strokeStyle = rayGradient;
    ctx.stroke();
  }

  ctx.restore();
}

// Draw a lens flare effect
function drawFlare(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = opacity;

  // Main flare
  ctx.shadowBlur = size * 1.5;
  ctx.shadowColor = color;

  // Horizontal streak
  const horizGradient = ctx.createLinearGradient(-size * 2, 0, size * 2, 0);
  horizGradient.addColorStop(0, 'transparent');
  horizGradient.addColorStop(0.3, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
  horizGradient.addColorStop(0.5, color);
  horizGradient.addColorStop(0.7, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
  horizGradient.addColorStop(1, 'transparent');

  ctx.fillStyle = horizGradient;
  ctx.fillRect(-size * 2, -size * 0.1, size * 4, size * 0.2);

  // Vertical streak (shorter)
  const vertGradient = ctx.createLinearGradient(0, -size, 0, size);
  vertGradient.addColorStop(0, 'transparent');
  vertGradient.addColorStop(0.3, color.replace(')', ', 0.2)').replace('rgb', 'rgba'));
  vertGradient.addColorStop(0.5, color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
  vertGradient.addColorStop(0.7, color.replace(')', ', 0.2)').replace('rgb', 'rgba'));
  vertGradient.addColorStop(1, 'transparent');

  ctx.fillStyle = vertGradient;
  ctx.fillRect(-size * 0.08, -size, size * 0.16, size * 2);

  // Center bright spot
  const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.3);
  centerGradient.addColorStop(0, '#ffffff');
  centerGradient.addColorStop(0.5, color);
  centerGradient.addColorStop(1, 'transparent');

  ctx.beginPath();
  ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = centerGradient;
  ctx.fill();

  ctx.restore();
}

// Draw a simple twinkling dot
function drawTwinkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = opacity;

  ctx.shadowBlur = size * 3;
  ctx.shadowColor = color;

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.3, color);
  gradient.addColorStop(1, 'transparent');

  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.restore();
}

// Parse hex color to rgb
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
  }
  return hex;
}

export function SparkleEffect({ width, height, mouse, intensity, color, themeColors }: AnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparklesRef = useRef<Sparkle[]>([]);
  const burstsRef = useRef<Burst[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const lastBurstRef = useRef<number>(0);

  const baseColor = color || themeColors.accent || '#fbbf24';
  const rgbColor = hexToRgb(baseColor);
  const particleCount = Math.floor(PARTICLE_COUNTS[intensity] * 1.2);

  // Color palette based on theme
  const colors = [
    rgbColor,
    hexToRgb(themeColors.primary),
    'rgb(255, 255, 255)',
  ];

  const layerConfig = {
    far: { sizeRange: [2, 4], speedRange: [0.1, 0.3], opacityRange: [0.3, 0.5], count: 0.4 },
    mid: { sizeRange: [4, 8], speedRange: [0.3, 0.5], opacityRange: [0.5, 0.8], count: 0.35 },
    near: { sizeRange: [8, 15], speedRange: [0.5, 0.8], opacityRange: [0.7, 1], count: 0.25 },
  };

  const initParticles = useCallback(() => {
    const sparkles: Sparkle[] = [];
    let id = 0;

    (['far', 'mid', 'near'] as const).forEach((layer) => {
      const config = layerConfig[layer];
      const count = Math.floor(particleCount * config.count);

      for (let i = 0; i < count; i++) {
        const types: Array<'star' | 'burst' | 'flare' | 'twinkle'> = ['star', 'burst', 'flare', 'twinkle'];
        const typeWeights = layer === 'near' ? [0.3, 0.2, 0.2, 0.3] : [0.4, 0.1, 0.1, 0.4];
        const rand = Math.random();
        let cumulative = 0;
        let type: 'star' | 'burst' | 'flare' | 'twinkle' = 'twinkle';
        for (let t = 0; t < types.length; t++) {
          cumulative += typeWeights[t];
          if (rand < cumulative) {
            type = types[t];
            break;
          }
        }

        const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);

        sparkles.push({
          id: id++,
          x: Math.random() * width,
          y: Math.random() * height,
          size,
          speed: config.speedRange[0] + Math.random() * (config.speedRange[1] - config.speedRange[0]),
          opacity: 0,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.02 + Math.random() * 0.04,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          type,
          layer,
          color: colors[Math.floor(Math.random() * colors.length)],
          trail: [],
        });
      }
    });

    sparklesRef.current = sparkles;
    burstsRef.current = [];
  }, [width, height, particleCount, colors]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    timeRef.current += 1;

    const speedMult = mouse.isIdle ? 0.3 : 1 + mouse.velocity * 0.5;
    const wobbleX = mouse.isIdle ? 0 : (mouse.x - width / 2) / width;

    // Occasional burst
    if (timeRef.current - lastBurstRef.current > 120 + Math.random() * 180) {
      if (Math.random() < 0.3) {
        burstsRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          life: 0,
          maxLife: 40 + Math.random() * 30,
          rays: 6 + Math.floor(Math.random() * 6),
          size: 30 + Math.random() * 40,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
        lastBurstRef.current = timeRef.current;
      }
    }

    // Sort by layer for z-ordering
    const sorted = [...sparklesRef.current].sort((a, b) => {
      const order = { far: 0, mid: 1, near: 2 };
      return order[a.layer] - order[b.layer];
    });

    // Draw sparkles
    sorted.forEach((sparkle) => {
      // Update phase for twinkle
      sparkle.phase += sparkle.phaseSpeed;
      const twinkle = 0.5 + Math.sin(sparkle.phase) * 0.5;
      sparkle.opacity = twinkle * (sparkle.layer === 'near' ? 1 : sparkle.layer === 'mid' ? 0.7 : 0.4);

      // Update position (gentle upward float)
      sparkle.y -= sparkle.speed * speedMult;
      sparkle.x += Math.sin(sparkle.phase * 0.5) * 0.3 + wobbleX * (sparkle.layer === 'near' ? 2 : 1);
      sparkle.rotation += sparkle.rotationSpeed;

      // Update trail for near sparkles
      if (sparkle.layer === 'near' && sparkle.type !== 'twinkle') {
        sparkle.trail.push({ x: sparkle.x, y: sparkle.y, opacity: sparkle.opacity * 0.5 });
        if (sparkle.trail.length > 5) sparkle.trail.shift();
      }

      // Reset if off screen
      if (sparkle.y < -sparkle.size * 2) {
        sparkle.y = height + sparkle.size * 2;
        sparkle.x = Math.random() * width;
        sparkle.phase = Math.random() * Math.PI * 2;
        sparkle.trail = [];
      }

      // Draw trail
      sparkle.trail.forEach((point, idx) => {
        const trailOpacity = point.opacity * (idx / sparkle.trail.length) * 0.3;
        const trailSize = sparkle.size * (0.3 + (idx / sparkle.trail.length) * 0.3);
        drawTwinkle(ctx, point.x, point.y, trailSize, sparkle.color, trailOpacity);
      });

      // Draw based on type
      switch (sparkle.type) {
        case 'star':
          drawStar(ctx, sparkle.x, sparkle.y, sparkle.size, 4, sparkle.rotation, sparkle.color, sparkle.opacity, sparkle.layer === 'near');
          break;
        case 'burst':
          drawBurst(ctx, sparkle.x, sparkle.y, sparkle.size, 8, sparkle.rotation, sparkle.color, sparkle.opacity);
          break;
        case 'flare':
          drawFlare(ctx, sparkle.x, sparkle.y, sparkle.size, sparkle.color, sparkle.opacity);
          break;
        case 'twinkle':
        default:
          drawTwinkle(ctx, sparkle.x, sparkle.y, sparkle.size, sparkle.color, sparkle.opacity);
          break;
      }
    });

    // Draw and update bursts
    burstsRef.current = burstsRef.current.filter((burst) => {
      burst.life += 1;
      const progress = burst.life / burst.maxLife;

      if (progress >= 1) return false;

      const expandedSize = burst.size * (0.5 + progress * 1.5);
      const fadeOpacity = 1 - progress;

      drawBurst(ctx, burst.x, burst.y, expandedSize, burst.rays, progress * Math.PI * 0.5, burst.color, fadeOpacity);

      return true;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [width, height, mouse, colors]);

  useEffect(() => {
    initParticles();
  }, [initParticles]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

  useEffect(() => {
    initParticles();
  }, [width, height, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
