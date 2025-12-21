import { useEffect, useRef, useCallback } from 'react';
import type { AnimationProps } from '../types';
import { PARTICLE_COUNTS } from '../types';

interface Leaf {
  id: number;
  x: number;
  y: number;
  size: number;
  fallSpeed: number;
  driftSpeed: number;
  driftPhase: number;
  driftAmplitude: number;
  rotationX: number; // 3D tumble X axis
  rotationY: number; // 3D tumble Y axis
  rotationZ: number; // Flat rotation
  rotationSpeedX: number;
  rotationSpeedY: number;
  rotationSpeedZ: number;
  type: 'maple' | 'oak' | 'simple';
  layer: 'far' | 'mid' | 'near';
  color: string;
  veinColor: string;
}

// Autumn color palettes
const AUTUMN_COLORS = [
  { fill: '#e85d04', vein: '#9d0208' }, // Orange with red veins
  { fill: '#dc2f02', vein: '#6a040f' }, // Red with dark red veins
  { fill: '#f48c06', vein: '#d00000' }, // Amber with red veins
  { fill: '#ffba08', vein: '#e85d04' }, // Yellow with orange veins
  { fill: '#9d4edd', vein: '#5a189a' }, // Purple (late fall)
  { fill: '#bc6c25', vein: '#774936' }, // Brown
];

// Green color palettes (for Palm Sunday)
const GREEN_COLORS = [
  { fill: '#2d6a4f', vein: '#1b4332' },
  { fill: '#40916c', vein: '#2d6a4f' },
  { fill: '#52b788', vein: '#40916c' },
  { fill: '#74c69d', vein: '#52b788' },
];

// Draw a maple leaf shape
function drawMapleLeaf(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
  veinColor: string
) {
  ctx.beginPath();

  // Maple leaf with 5 main points
  const points = [
    { x: 0, y: -size }, // Top point
    { x: size * 0.3, y: -size * 0.6 },
    { x: size * 0.9, y: -size * 0.4 }, // Right upper point
    { x: size * 0.5, y: -size * 0.2 },
    { x: size * 0.7, y: size * 0.3 }, // Right lower point
    { x: size * 0.3, y: size * 0.2 },
    { x: size * 0.2, y: size * 0.6 }, // Right bottom
    { x: 0, y: size * 0.4 },
    { x: -size * 0.2, y: size * 0.6 }, // Left bottom
    { x: -size * 0.3, y: size * 0.2 },
    { x: -size * 0.7, y: size * 0.3 }, // Left lower point
    { x: -size * 0.5, y: -size * 0.2 },
    { x: -size * 0.9, y: -size * 0.4 }, // Left upper point
    { x: -size * 0.3, y: -size * 0.6 },
  ];

  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    const cpY = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, cpX, cpY);
  }
  ctx.quadraticCurveTo(points[points.length - 1].x, points[points.length - 1].y, points[0].x, points[0].y);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  // Draw veins
  ctx.strokeStyle = veinColor;
  ctx.lineWidth = Math.max(0.5, size / 20);
  ctx.lineCap = 'round';

  // Main center vein
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(0, size * 0.5);
  ctx.stroke();

  // Side veins
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.3);
  ctx.lineTo(size * 0.7, -size * 0.3);
  ctx.moveTo(0, -size * 0.3);
  ctx.lineTo(-size * 0.7, -size * 0.3);
  ctx.moveTo(0, size * 0.1);
  ctx.lineTo(size * 0.5, size * 0.3);
  ctx.moveTo(0, size * 0.1);
  ctx.lineTo(-size * 0.5, size * 0.3);
  ctx.stroke();
}

// Draw an oak leaf shape
function drawOakLeaf(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
  veinColor: string
) {
  ctx.beginPath();

  // Oak leaf with rounded lobes
  const lobes = 5;
  ctx.moveTo(0, -size);

  for (let i = 0; i < lobes; i++) {
    const t = i / lobes;
    const y = -size + (size * 1.8) * t;
    const width = size * 0.5 * Math.sin(t * Math.PI) + size * 0.2;
    const lobeDepth = size * 0.15;

    // Right side
    ctx.bezierCurveTo(
      width + lobeDepth, y,
      width + lobeDepth, y + size * 0.2,
      width - lobeDepth, y + size * 0.2
    );
  }

  // Bottom
  ctx.lineTo(0, size * 0.9);

  // Left side (mirror)
  for (let i = lobes - 1; i >= 0; i--) {
    const t = i / lobes;
    const y = -size + (size * 1.8) * t;
    const width = size * 0.5 * Math.sin(t * Math.PI) + size * 0.2;
    const lobeDepth = size * 0.15;

    ctx.bezierCurveTo(
      -width + lobeDepth, y + size * 0.2,
      -width - lobeDepth, y + size * 0.2,
      -width - lobeDepth, y
    );
  }

  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Veins
  ctx.strokeStyle = veinColor;
  ctx.lineWidth = Math.max(0.5, size / 20);

  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(0, size * 0.8);
  ctx.stroke();
}

// Draw a simple oval leaf
function drawSimpleLeaf(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
  veinColor: string
) {
  ctx.beginPath();

  // Simple elongated oval
  ctx.moveTo(0, -size);
  ctx.bezierCurveTo(
    size * 0.5, -size * 0.7,
    size * 0.4, size * 0.5,
    0, size * 0.8
  );
  ctx.bezierCurveTo(
    -size * 0.4, size * 0.5,
    -size * 0.5, -size * 0.7,
    0, -size
  );
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  // Center vein
  ctx.strokeStyle = veinColor;
  ctx.lineWidth = Math.max(0.5, size / 15);
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.9);
  ctx.lineTo(0, size * 0.7);
  ctx.stroke();

  // Side veins
  ctx.lineWidth = Math.max(0.3, size / 25);
  for (let i = 0; i < 4; i++) {
    const y = -size * 0.5 + i * size * 0.35;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size * 0.25, y + size * 0.1);
    ctx.moveTo(0, y);
    ctx.lineTo(-size * 0.25, y + size * 0.1);
    ctx.stroke();
  }
}

export function LeavesEffect({ width, height, mouse, intensity, color, themeColors }: AnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leavesRef = useRef<Leaf[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const particleCount = Math.floor(PARTICLE_COUNTS[intensity] * 0.6); // Fewer but bigger leaves

  // Determine color palette based on theme/color
  const isGreen = color?.includes('16a34a') || color?.includes('22c55e') || themeColors.primary.includes('16a34a');
  const colorPalette = isGreen ? GREEN_COLORS : AUTUMN_COLORS;

  const layerConfig = {
    far: { sizeRange: [8, 14], speedRange: [0.3, 0.6], count: 0.35 },
    mid: { sizeRange: [14, 22], speedRange: [0.6, 1.0], count: 0.4 },
    near: { sizeRange: [22, 35], speedRange: [1.0, 1.5], count: 0.25 },
  };

  const initParticles = useCallback(() => {
    const leaves: Leaf[] = [];
    let id = 0;

    (['far', 'mid', 'near'] as const).forEach((layer) => {
      const config = layerConfig[layer];
      const count = Math.floor(particleCount * config.count);

      for (let i = 0; i < count; i++) {
        const types: Array<'maple' | 'oak' | 'simple'> = ['maple', 'oak', 'simple'];
        const type = types[Math.floor(Math.random() * types.length)];
        const colorChoice = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);

        leaves.push({
          id: id++,
          x: Math.random() * width,
          y: Math.random() * height * 2 - height,
          size,
          fallSpeed: config.speedRange[0] + Math.random() * (config.speedRange[1] - config.speedRange[0]),
          driftSpeed: 0.02 + Math.random() * 0.03,
          driftPhase: Math.random() * Math.PI * 2,
          driftAmplitude: 50 + Math.random() * 100,
          rotationX: Math.random() * Math.PI * 2,
          rotationY: Math.random() * Math.PI * 2,
          rotationZ: Math.random() * Math.PI * 2,
          rotationSpeedX: (Math.random() - 0.5) * 0.05,
          rotationSpeedY: (Math.random() - 0.5) * 0.03,
          rotationSpeedZ: (Math.random() - 0.5) * 0.02,
          type,
          layer,
          color: colorChoice.fill,
          veinColor: colorChoice.vein,
        });
      }
    });

    leavesRef.current = leaves;
  }, [width, height, particleCount, colorPalette]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    timeRef.current += 1;

    // Wind effect
    const baseWind = Math.sin(timeRef.current * 0.003) * 0.8;
    const gustWind = Math.sin(timeRef.current * 0.01) * Math.sin(timeRef.current * 0.007) * 1.5;
    const mouseWind = mouse.isIdle ? 0 : ((mouse.x - width / 2) / width) * 4;
    const totalWind = baseWind + gustWind * 0.3 + mouseWind;

    const speedMult = mouse.isIdle ? 0.4 : 1 + mouse.velocity * 0.3;

    // Sort by layer for z-ordering
    const sorted = [...leavesRef.current].sort((a, b) => {
      const order = { far: 0, mid: 1, near: 2 };
      return order[a.layer] - order[b.layer];
    });

    sorted.forEach((leaf) => {
      // Update drift
      leaf.driftPhase += leaf.driftSpeed;
      const drift = Math.sin(leaf.driftPhase) * leaf.driftAmplitude * 0.02;

      // Update 3D rotations
      leaf.rotationX += leaf.rotationSpeedX * speedMult;
      leaf.rotationY += leaf.rotationSpeedY * speedMult;
      leaf.rotationZ += leaf.rotationSpeedZ * speedMult;

      // Update position
      leaf.y += leaf.fallSpeed * speedMult;
      leaf.x += drift + totalWind * (leaf.layer === 'near' ? 1.5 : leaf.layer === 'mid' ? 1 : 0.5);

      // Wrap around screen
      if (leaf.y > height + leaf.size * 2) {
        leaf.y = -leaf.size * 2;
        leaf.x = Math.random() * width;
        leaf.driftPhase = Math.random() * Math.PI * 2;
      }
      if (leaf.x > width + leaf.size * 2) {
        leaf.x = -leaf.size * 2;
      }
      if (leaf.x < -leaf.size * 2) {
        leaf.x = width + leaf.size * 2;
      }

      // Calculate 3D transform effect
      const scaleX = Math.cos(leaf.rotationY) * 0.5 + 0.5;
      const scaleY = Math.cos(leaf.rotationX) * 0.3 + 0.7;
      const skewX = Math.sin(leaf.rotationY) * 0.3;

      // Layer-based opacity
      const layerOpacity = leaf.layer === 'near' ? 1 : leaf.layer === 'mid' ? 0.75 : 0.5;

      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.rotationZ);
      ctx.transform(scaleX, skewX, 0, scaleY, 0, 0);
      ctx.globalAlpha = layerOpacity;

      // Add shadow for near leaves
      if (leaf.layer === 'near') {
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
      }

      // Draw based on type
      switch (leaf.type) {
        case 'maple':
          drawMapleLeaf(ctx, leaf.size, leaf.color, leaf.veinColor);
          break;
        case 'oak':
          drawOakLeaf(ctx, leaf.size, leaf.color, leaf.veinColor);
          break;
        case 'simple':
        default:
          drawSimpleLeaf(ctx, leaf.size, leaf.color, leaf.veinColor);
          break;
      }

      ctx.restore();
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [width, height, mouse]);

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
