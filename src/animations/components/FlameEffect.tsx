import { useEffect, useRef, useCallback } from 'react';
import type { AnimationProps, Particle } from '../types';
import { PARTICLE_COUNTS } from '../types';

interface FlameParticle extends Particle {
  life: number;
  maxLife: number;
}

export function FlameEffect({ width, height, mouse, intensity }: AnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<FlameParticle[]>([]);
  const animationRef = useRef<number>(0);

  const particleCount = PARTICLE_COUNTS[intensity];

  // Create a new flame particle
  const createParticle = useCallback((id: number): FlameParticle => {
    const maxLife = Math.random() * 60 + 40;
    return {
      id,
      x: Math.random() * width,
      y: height + 10,
      size: Math.random() * 8 + 4,
      speed: Math.random() * 3 + 2,
      opacity: 1,
      rotation: 0,
      rotationSpeed: 0,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.1 + 0.05,
      life: 0,
      maxLife,
    };
  }, [width, height]);

  // Initialize particles
  const initParticles = useCallback(() => {
    const particles: FlameParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const particle = createParticle(i);
      particle.y = Math.random() * height; // Spread initially
      particle.life = Math.random() * particle.maxLife;
      particles.push(particle);
    }
    particlesRef.current = particles;
  }, [particleCount, height, createParticle]);

  // Get flame color based on life
  const getFlameColor = useCallback((life: number, maxLife: number): string => {
    const progress = life / maxLife;

    if (progress < 0.3) {
      // Yellow/white core
      return `rgba(255, 255, 200, ${1 - progress})`;
    } else if (progress < 0.6) {
      // Orange middle
      const r = 255;
      const g = Math.floor(165 - (progress - 0.3) * 200);
      return `rgba(${r}, ${g}, 0, ${1 - progress})`;
    } else {
      // Red outer
      const opacity = Math.max(0, 1 - progress * 1.2);
      return `rgba(200, 50, 0, ${opacity})`;
    }
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const mouseInfluence = mouse.isIdle ? 0 : (mouse.x - width / 2) / width;
    const intensityMultiplier = mouse.isIdle ? 0.7 : 1 + mouse.velocity * 0.3;

    particlesRef.current.forEach((particle, index) => {
      // Update life
      particle.life += 1;

      // Update wobble
      particle.wobble += particle.wobbleSpeed;

      // Calculate horizontal drift
      const wobbleDrift = Math.sin(particle.wobble) * 3;
      const mouseDrift = mouseInfluence * 2 * (1 - particle.life / particle.maxLife);

      // Update position
      particle.y -= particle.speed * intensityMultiplier;
      particle.x += wobbleDrift + mouseDrift;

      // Shrink as it rises
      const lifeProgress = particle.life / particle.maxLife;
      const currentSize = particle.size * (1 - lifeProgress * 0.7);

      // Reset if life ended
      if (particle.life >= particle.maxLife || particle.y < -20) {
        particlesRef.current[index] = createParticle(particle.id);
      }

      // Draw flame particle
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, currentSize
      );

      const color = getFlameColor(particle.life, particle.maxLife);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [width, height, mouse, createParticle, getFlameColor]);

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
