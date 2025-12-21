import { useEffect, useRef, useCallback } from 'react';
import type { AnimationProps, Particle } from '../types';
import { PARTICLE_COUNTS } from '../types';

interface Snowflake extends Particle {
  drift: number;
}

// Snowflakes don't use rotation, but base Particle requires it

export function SnowEffect({ width, height, mouse, intensity, color }: AnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Snowflake[]>([]);
  const animationRef = useRef<number>(0);

  const snowColor = color || 'rgba(255, 255, 255, 0.8)';
  const particleCount = PARTICLE_COUNTS[intensity];

  // Initialize particles
  const initParticles = useCallback(() => {
    const particles: Snowflake[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 1 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        rotation: 0,
        rotationSpeed: 0,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
        drift: 0,
      });
    }
    particlesRef.current = particles;
  }, [width, height, particleCount]);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const speedMultiplier = mouse.isIdle ? 0.3 : 1 + mouse.velocity * 0.5;
    const windEffect = mouse.isIdle ? 0 : (mouse.x - width / 2) / width * 2;

    particlesRef.current.forEach((particle) => {
      // Update wobble
      particle.wobble += particle.wobbleSpeed;

      // Calculate drift based on wobble and wind
      particle.drift = Math.sin(particle.wobble) * 2 + windEffect;

      // Update position
      particle.y += particle.speed * speedMultiplier;
      particle.x += particle.drift * 0.5;

      // Reset if off screen
      if (particle.y > height + 10) {
        particle.y = -10;
        particle.x = Math.random() * width;
      }
      if (particle.x > width + 10) {
        particle.x = -10;
      }
      if (particle.x < -10) {
        particle.x = width + 10;
      }

      // Draw snowflake
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = snowColor.replace('0.8', String(particle.opacity));
      ctx.fill();

      // Add a subtle glow
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = snowColor.replace('0.8', String(particle.opacity * 0.3));
      ctx.fill();
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [width, height, mouse, snowColor]);

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

  // Handle resize
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
