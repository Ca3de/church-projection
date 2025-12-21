import { useEffect, useRef, useCallback } from 'react';
import type { AnimationProps } from '../types';
import { PARTICLE_COUNTS } from '../types';

interface Snowflake {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  wobblePhase: number;
  wobbleSpeed: number;
  wobbleAmplitude: number;
  layer: 'far' | 'mid' | 'near'; // Depth layer for parallax
  type: 'crystal' | 'simple' | 'detailed'; // Snowflake complexity
}

// Draw a detailed 6-pointed snowflake crystal
function drawCrystalSnowflake(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  opacity: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = opacity;

  const branches = 6;
  const branchLength = size;
  const subBranchLength = size * 0.4;
  const subBranchAngle = Math.PI / 6;

  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1, size / 8);

  // Draw main branches
  for (let i = 0; i < branches; i++) {
    const angle = (i * Math.PI * 2) / branches;
    ctx.save();
    ctx.rotate(angle);

    // Main branch
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(branchLength, 0);
    ctx.stroke();

    // Sub-branches (2 per main branch)
    const subBranchPositions = [0.4, 0.7];
    subBranchPositions.forEach((pos) => {
      const sx = branchLength * pos;

      // Upper sub-branch
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(
        sx + Math.cos(subBranchAngle) * subBranchLength * (1 - pos * 0.3),
        -Math.sin(subBranchAngle) * subBranchLength * (1 - pos * 0.3)
      );
      ctx.stroke();

      // Lower sub-branch
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(
        sx + Math.cos(subBranchAngle) * subBranchLength * (1 - pos * 0.3),
        Math.sin(subBranchAngle) * subBranchLength * (1 - pos * 0.3)
      );
      ctx.stroke();
    });

    ctx.restore();
  }

  // Center dot
  ctx.beginPath();
  ctx.arc(0, 0, size / 6, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.restore();
}

// Draw a simpler 6-pointed star snowflake
function drawSimpleSnowflake(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  opacity: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = opacity;

  const branches = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1, size / 6);

  // Draw simple lines
  for (let i = 0; i < branches; i++) {
    const angle = (i * Math.PI * 2) / branches;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
    ctx.stroke();
  }

  ctx.restore();
}

// Draw a detailed ornate snowflake
function drawDetailedSnowflake(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  opacity: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = opacity;

  const branches = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1, size / 10);

  // Draw ornate branches with diamonds
  for (let i = 0; i < branches; i++) {
    const angle = (i * Math.PI * 2) / branches;
    ctx.save();
    ctx.rotate(angle);

    // Main branch
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, 0);
    ctx.stroke();

    // Diamond shapes along branch
    [0.5, 0.8].forEach((pos) => {
      const dx = size * pos;
      const diamondSize = size * 0.15 * (1.2 - pos);
      ctx.beginPath();
      ctx.moveTo(dx, -diamondSize);
      ctx.lineTo(dx + diamondSize, 0);
      ctx.lineTo(dx, diamondSize);
      ctx.lineTo(dx - diamondSize, 0);
      ctx.closePath();
      ctx.fill();
    });

    // Perpendicular lines
    const perpPos = size * 0.6;
    const perpLen = size * 0.25;
    ctx.beginPath();
    ctx.moveTo(perpPos, -perpLen);
    ctx.lineTo(perpPos, perpLen);
    ctx.stroke();

    ctx.restore();
  }

  // Center hexagon
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const hx = Math.cos(angle) * size * 0.2;
    const hy = Math.sin(angle) * size * 0.2;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function SnowEffect({ width, height, mouse, intensity }: AnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Snowflake[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const particleCount = Math.floor(PARTICLE_COUNTS[intensity] * 1.5);

  // Layer configuration for parallax effect
  const layerConfig = {
    far: { sizeRange: [3, 6], speedRange: [0.3, 0.6], opacityRange: [0.2, 0.4], count: 0.4 },
    mid: { sizeRange: [6, 12], speedRange: [0.6, 1.2], opacityRange: [0.4, 0.7], count: 0.35 },
    near: { sizeRange: [12, 22], speedRange: [1.2, 2.0], opacityRange: [0.7, 0.95], count: 0.25 },
  };

  const initParticles = useCallback(() => {
    const particles: Snowflake[] = [];
    let id = 0;

    // Create particles for each layer
    (['far', 'mid', 'near'] as const).forEach((layer) => {
      const config = layerConfig[layer];
      const count = Math.floor(particleCount * config.count);

      for (let i = 0; i < count; i++) {
        const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);
        const types: Array<'crystal' | 'simple' | 'detailed'> = ['crystal', 'simple', 'detailed'];
        const typeWeights = layer === 'near' ? [0.5, 0.2, 0.3] : layer === 'mid' ? [0.3, 0.5, 0.2] : [0.2, 0.7, 0.1];
        const rand = Math.random();
        const type = rand < typeWeights[0] ? types[0] : rand < typeWeights[0] + typeWeights[1] ? types[1] : types[2];

        particles.push({
          id: id++,
          x: Math.random() * width,
          y: Math.random() * height,
          size,
          speed: config.speedRange[0] + Math.random() * (config.speedRange[1] - config.speedRange[0]),
          opacity: config.opacityRange[0] + Math.random() * (config.opacityRange[1] - config.opacityRange[0]),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.01 + Math.random() * 0.02,
          wobbleAmplitude: 20 + Math.random() * 40,
          layer,
          type,
        });
      }
    });

    particlesRef.current = particles;
  }, [width, height, particleCount]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    timeRef.current += 1;

    // Wind effect based on mouse position and time
    const baseWind = Math.sin(timeRef.current * 0.005) * 0.5;
    const mouseWind = mouse.isIdle ? 0 : ((mouse.x - width / 2) / width) * 3;
    const wind = baseWind + mouseWind;

    // Speed multiplier based on mouse activity
    const speedMult = mouse.isIdle ? 0.4 : 1 + mouse.velocity * 0.3;

    // Sort by layer for proper z-ordering (far first)
    const sortedParticles = [...particlesRef.current].sort((a, b) => {
      const order = { far: 0, mid: 1, near: 2 };
      return order[a.layer] - order[b.layer];
    });

    sortedParticles.forEach((particle) => {
      // Update wobble
      particle.wobblePhase += particle.wobbleSpeed;
      const wobbleX = Math.sin(particle.wobblePhase) * particle.wobbleAmplitude * 0.02;

      // Layer-specific wind influence
      const layerWindMult = particle.layer === 'near' ? 1.5 : particle.layer === 'mid' ? 1 : 0.5;

      // Update position
      particle.y += particle.speed * speedMult;
      particle.x += wobbleX + wind * layerWindMult;
      particle.rotation += particle.rotationSpeed * speedMult;

      // Wrap around screen
      if (particle.y > height + particle.size * 2) {
        particle.y = -particle.size * 2;
        particle.x = Math.random() * width;
      }
      if (particle.x > width + particle.size * 2) {
        particle.x = -particle.size * 2;
      }
      if (particle.x < -particle.size * 2) {
        particle.x = width + particle.size * 2;
      }

      // Add glow effect for near snowflakes
      if (particle.layer === 'near') {
        ctx.save();
        ctx.shadowBlur = particle.size * 0.8;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      }

      // Draw based on type
      switch (particle.type) {
        case 'crystal':
          drawCrystalSnowflake(ctx, particle.x, particle.y, particle.size, particle.rotation, particle.opacity);
          break;
        case 'detailed':
          drawDetailedSnowflake(ctx, particle.x, particle.y, particle.size, particle.rotation, particle.opacity);
          break;
        case 'simple':
        default:
          drawSimpleSnowflake(ctx, particle.x, particle.y, particle.size, particle.rotation, particle.opacity);
          break;
      }

      if (particle.layer === 'near') {
        ctx.restore();
      }
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
