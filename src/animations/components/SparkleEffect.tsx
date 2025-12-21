import { useEffect, useRef, useCallback } from 'react';
import type { AnimationProps, Particle } from '../types';
import { PARTICLE_COUNTS } from '../types';

interface SparkleParticle extends Particle {
  twinklePhase: number;
  twinkleSpeed: number;
  baseOpacity: number;
}

export function SparkleEffect({ width, height, mouse, intensity, color, themeColors }: AnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<SparkleParticle[]>([]);
  const animationRef = useRef<number>(0);

  const sparkleColor = color || themeColors.accent || '#fbbf24';
  const particleCount = PARTICLE_COUNTS[intensity];

  // Initialize particles
  const initParticles = useCallback(() => {
    const particles: SparkleParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.2,
        opacity: 0,
        rotation: 0,
        rotationSpeed: 0,
        baseOpacity: Math.random() * 0.6 + 0.3,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.05 + 0.02,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.01 + 0.005,
      });
    }
    particlesRef.current = particles;
  }, [width, height, particleCount]);

  // Draw a star/sparkle shape
  const drawSparkle = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    opacity: number,
    colorStr: string
  ) => {
    const spikes = 4;
    const outerRadius = size;
    const innerRadius = size * 0.4;

    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();

    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.closePath();

    // Add glow
    ctx.shadowBlur = size * 2;
    ctx.shadowColor = colorStr;

    ctx.fillStyle = colorStr.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
    ctx.fill();

    ctx.restore();
  }, []);

  // Parse color to RGB
  const parseColor = useCallback((colorStr: string): string => {
    if (colorStr.startsWith('#')) {
      const hex = colorStr.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return colorStr;
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const speedMultiplier = mouse.isIdle ? 0.5 : 1 + mouse.velocity * 0.3;
    const rgbColor = parseColor(sparkleColor);

    particlesRef.current.forEach((particle) => {
      // Update twinkle
      particle.twinklePhase += particle.twinkleSpeed;
      particle.opacity = particle.baseOpacity * (0.5 + Math.sin(particle.twinklePhase) * 0.5);

      // Update wobble
      particle.wobble += particle.wobbleSpeed;

      // Gentle upward float
      particle.y -= particle.speed * speedMultiplier;
      particle.x += Math.sin(particle.wobble) * 0.3;

      // Reset if off screen
      if (particle.y < -10) {
        particle.y = height + 10;
        particle.x = Math.random() * width;
        particle.twinklePhase = Math.random() * Math.PI * 2;
      }

      // Draw sparkle
      drawSparkle(ctx, particle.x, particle.y, particle.size, particle.opacity, rgbColor);
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [width, height, mouse, sparkleColor, parseColor, drawSparkle]);

  // Initialize on mount
  useEffect(() => {
    initParticles();
  }, [initParticles]);

  // Start animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
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
