import { useEffect, useRef, useCallback } from 'react';
import type { AnimationProps } from '../types';
import { PARTICLE_COUNTS } from '../types';

interface FlameParticle {
  id: number;
  x: number;
  y: number;
  baseX: number;
  size: number;
  speed: number;
  life: number;
  maxLife: number;
  turbulence: number;
  turbulenceSpeed: number;
  layer: 'core' | 'mid' | 'outer';
}

interface Ember {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  brightness: number;
}

interface SmokeParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  drift: number;
}

// Draw a flame-shaped particle using bezier curves
function drawFlameShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  wobble: number,
  gradient: CanvasGradient
) {
  ctx.save();
  ctx.translate(x, y);

  // Flame shape using bezier curves
  ctx.beginPath();

  // Bottom of flame
  ctx.moveTo(0, size * 0.4);

  // Right side going up
  ctx.bezierCurveTo(
    size * 0.4 + wobble * 0.3, size * 0.2,
    size * 0.3 + wobble * 0.5, -size * 0.3,
    wobble * 0.2, -size * 0.6
  );

  // Left side going down
  ctx.bezierCurveTo(
    -size * 0.3 + wobble * 0.5, -size * 0.3,
    -size * 0.4 + wobble * 0.3, size * 0.2,
    0, size * 0.4
  );

  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
}

// Create a radial gradient for flames
function createFlameGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  lifeRatio: number,
  layer: 'core' | 'mid' | 'outer'
): CanvasGradient {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y - size * 0.3, size);

  if (layer === 'core') {
    // White/yellow core
    gradient.addColorStop(0, `rgba(255, 255, 240, ${0.9 * (1 - lifeRatio * 0.5)})`);
    gradient.addColorStop(0.3, `rgba(255, 230, 150, ${0.8 * (1 - lifeRatio * 0.6)})`);
    gradient.addColorStop(0.6, `rgba(255, 180, 50, ${0.6 * (1 - lifeRatio * 0.7)})`);
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
  } else if (layer === 'mid') {
    // Orange middle
    gradient.addColorStop(0, `rgba(255, 200, 100, ${0.7 * (1 - lifeRatio * 0.5)})`);
    gradient.addColorStop(0.4, `rgba(255, 140, 30, ${0.6 * (1 - lifeRatio * 0.6)})`);
    gradient.addColorStop(0.7, `rgba(220, 80, 0, ${0.4 * (1 - lifeRatio * 0.8)})`);
    gradient.addColorStop(1, 'rgba(180, 40, 0, 0)');
  } else {
    // Red/dark outer
    gradient.addColorStop(0, `rgba(255, 120, 30, ${0.5 * (1 - lifeRatio * 0.4)})`);
    gradient.addColorStop(0.4, `rgba(200, 60, 10, ${0.4 * (1 - lifeRatio * 0.6)})`);
    gradient.addColorStop(0.8, `rgba(120, 30, 5, ${0.2 * (1 - lifeRatio * 0.8)})`);
    gradient.addColorStop(1, 'rgba(50, 10, 0, 0)');
  }

  return gradient;
}

export function FlameEffect({ width, height, mouse, intensity }: AnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flamesRef = useRef<FlameParticle[]>([]);
  const embersRef = useRef<Ember[]>([]);
  const smokeRef = useRef<SmokeParticle[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const flameCount = Math.floor(PARTICLE_COUNTS[intensity] * 0.8);
  const emberCount = Math.floor(PARTICLE_COUNTS[intensity] * 0.4);
  const smokeCount = Math.floor(PARTICLE_COUNTS[intensity] * 0.15);

  // Create a flame particle
  const createFlame = useCallback((id: number, startY?: number): FlameParticle => {
    const layers: Array<'core' | 'mid' | 'outer'> = ['core', 'mid', 'outer'];
    const layer = layers[Math.floor(Math.random() * 3)];
    const sizeMultiplier = layer === 'core' ? 0.6 : layer === 'mid' ? 0.8 : 1;
    const speedMultiplier = layer === 'core' ? 1.2 : layer === 'mid' ? 1 : 0.8;

    const baseX = Math.random() * width;
    return {
      id,
      x: baseX,
      y: startY ?? height + 20,
      baseX,
      size: (Math.random() * 30 + 20) * sizeMultiplier,
      speed: (Math.random() * 2 + 1.5) * speedMultiplier,
      life: 0,
      maxLife: Math.random() * 80 + 60,
      turbulence: Math.random() * Math.PI * 2,
      turbulenceSpeed: Math.random() * 0.1 + 0.05,
      layer,
    };
  }, [width, height]);

  // Create an ember
  const createEmber = useCallback((id: number): Ember => {
    return {
      id,
      x: Math.random() * width,
      y: height + 10,
      vx: (Math.random() - 0.5) * 2,
      vy: -(Math.random() * 3 + 2),
      size: Math.random() * 3 + 1,
      life: 0,
      maxLife: Math.random() * 100 + 80,
      brightness: Math.random() * 0.5 + 0.5,
    };
  }, [width, height]);

  // Create a smoke particle
  const createSmoke = useCallback((id: number): SmokeParticle => {
    return {
      id,
      x: Math.random() * width,
      y: height * 0.3,
      size: Math.random() * 40 + 20,
      opacity: Math.random() * 0.1 + 0.05,
      speed: Math.random() * 0.5 + 0.3,
      drift: (Math.random() - 0.5) * 0.5,
    };
  }, [width, height]);

  // Initialize particles
  const initParticles = useCallback(() => {
    const flames: FlameParticle[] = [];
    const embers: Ember[] = [];
    const smoke: SmokeParticle[] = [];

    for (let i = 0; i < flameCount; i++) {
      const flame = createFlame(i, Math.random() * height);
      flame.life = Math.random() * flame.maxLife;
      flames.push(flame);
    }

    for (let i = 0; i < emberCount; i++) {
      const ember = createEmber(i);
      ember.y = Math.random() * height;
      ember.life = Math.random() * ember.maxLife;
      embers.push(ember);
    }

    for (let i = 0; i < smokeCount; i++) {
      const s = createSmoke(i);
      s.y = Math.random() * height * 0.5;
      smoke.push(s);
    }

    flamesRef.current = flames;
    embersRef.current = embers;
    smokeRef.current = smoke;
  }, [flameCount, emberCount, smokeCount, createFlame, createEmber, createSmoke]);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    timeRef.current += 1;

    const mouseInfluence = mouse.isIdle ? 0 : ((mouse.x - width / 2) / width) * 30;
    const intensityMult = mouse.isIdle ? 0.6 : 1 + mouse.velocity * 0.2;

    // Draw smoke first (background)
    smokeRef.current.forEach((smoke, idx) => {
      smoke.y -= smoke.speed;
      smoke.x += smoke.drift + Math.sin(timeRef.current * 0.01 + smoke.id) * 0.5;
      smoke.opacity *= 0.998;

      if (smoke.y < -smoke.size || smoke.opacity < 0.01) {
        smokeRef.current[idx] = createSmoke(smoke.id);
      }

      ctx.beginPath();
      ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(60, 60, 70, ${smoke.opacity})`;
      ctx.fill();
    });

    // Sort flames by layer for proper z-ordering
    const sortedFlames = [...flamesRef.current].sort((a, b) => {
      const order = { outer: 0, mid: 1, core: 2 };
      return order[a.layer] - order[b.layer];
    });

    // Draw flames
    sortedFlames.forEach((flame) => {
      flame.life += 1;
      flame.turbulence += flame.turbulenceSpeed;

      const lifeRatio = flame.life / flame.maxLife;
      const wobble = Math.sin(flame.turbulence) * 15 * (1 + lifeRatio);
      const shrink = 1 - lifeRatio * 0.6;

      // Update position
      flame.y -= flame.speed * intensityMult;
      flame.x = flame.baseX + wobble + mouseInfluence * (1 - lifeRatio);

      // Reset if done
      if (flame.life >= flame.maxLife || flame.y < -flame.size) {
        const idx = flamesRef.current.findIndex((f) => f.id === flame.id);
        if (idx !== -1) {
          flamesRef.current[idx] = createFlame(flame.id);
        }
        return;
      }

      // Draw flame with glow
      ctx.save();
      ctx.shadowBlur = flame.size * 0.5;
      ctx.shadowColor = flame.layer === 'core' ? 'rgba(255, 200, 100, 0.5)' : 'rgba(255, 100, 0, 0.3)';

      const gradient = createFlameGradient(ctx, flame.x, flame.y, flame.size * shrink, lifeRatio, flame.layer);
      drawFlameShape(ctx, flame.x, flame.y, flame.size * shrink, wobble * 0.5, gradient);

      ctx.restore();
    });

    // Draw embers
    embersRef.current.forEach((ember, idx) => {
      ember.life += 1;
      ember.vy += 0.02; // Slight gravity reduction (still rising but slowing)
      ember.vx += (Math.random() - 0.5) * 0.1;

      ember.x += ember.vx + mouseInfluence * 0.1;
      ember.y += ember.vy * intensityMult;

      const lifeRatio = ember.life / ember.maxLife;
      const flicker = 0.5 + Math.sin(timeRef.current * 0.5 + ember.id * 10) * 0.5;

      if (ember.life >= ember.maxLife || ember.y < -10 || ember.y > height + 20) {
        embersRef.current[idx] = createEmber(ember.id);
        return;
      }

      // Draw ember with glow
      ctx.save();
      ctx.shadowBlur = ember.size * 4;
      ctx.shadowColor = `rgba(255, 150, 50, ${ember.brightness * flicker * (1 - lifeRatio)})`;

      ctx.beginPath();
      ctx.arc(ember.x, ember.y, ember.size * (1 - lifeRatio * 0.5), 0, Math.PI * 2);

      const emberGradient = ctx.createRadialGradient(ember.x, ember.y, 0, ember.x, ember.y, ember.size);
      emberGradient.addColorStop(0, `rgba(255, 255, 200, ${ember.brightness * flicker * (1 - lifeRatio)})`);
      emberGradient.addColorStop(0.5, `rgba(255, 180, 50, ${ember.brightness * flicker * (1 - lifeRatio) * 0.8})`);
      emberGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

      ctx.fillStyle = emberGradient;
      ctx.fill();
      ctx.restore();
    });

    // Add base glow at the bottom
    const baseGlowGradient = ctx.createLinearGradient(0, height, 0, height - 150);
    baseGlowGradient.addColorStop(0, 'rgba(255, 100, 0, 0.15)');
    baseGlowGradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.05)');
    baseGlowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = baseGlowGradient;
    ctx.fillRect(0, height - 150, width, 150);

    animationRef.current = requestAnimationFrame(animate);
  }, [width, height, mouse, createFlame, createEmber, createSmoke]);

  useEffect(() => {
    initParticles();
  }, [initParticles]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

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
