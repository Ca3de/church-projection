import { useEffect, useRef, useCallback } from 'react';
import type { AnimationProps, Particle } from '../types';
import { PARTICLE_COUNTS } from '../types';

interface LeafParticle extends Particle {
  swayPhase: number;
  swaySpeed: number;
  fallSpeed: number;
}

export function LeavesEffect({ width, height, mouse, intensity, color, themeColors }: AnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<LeafParticle[]>([]);
  const animationRef = useRef<number>(0);

  const particleCount = Math.floor(PARTICLE_COUNTS[intensity] * 0.5); // Fewer leaves than snow

  // Autumn/green color palette
  const colors = color
    ? [color]
    : [
        themeColors.primary,
        themeColors.secondary,
        '#d97706', // amber
        '#b45309', // darker amber
        '#92400e', // brown
      ];

  // Initialize particles
  const initParticles = useCallback(() => {
    const particles: LeafParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height - height,
        size: Math.random() * 12 + 8,
        speed: Math.random() * 1 + 0.5,
        opacity: Math.random() * 0.3 + 0.6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        wobble: 0,
        wobbleSpeed: 0,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.01,
        fallSpeed: Math.random() * 0.5 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    particlesRef.current = particles;
  }, [width, height, particleCount, colors]);

  // Draw a leaf shape
  const drawLeaf = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    rotation: number,
    leafColor: string,
    opacity: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = opacity;

    // Leaf shape using bezier curves
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);

    // Right side
    ctx.bezierCurveTo(
      size / 3, -size / 3,
      size / 2, size / 4,
      0, size / 2
    );

    // Left side
    ctx.bezierCurveTo(
      -size / 2, size / 4,
      -size / 3, -size / 3,
      0, -size / 2
    );

    ctx.fillStyle = leafColor;
    ctx.fill();

    // Stem/vein
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(0, size / 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const speedMultiplier = mouse.isIdle ? 0.5 : 1 + mouse.velocity * 0.5;
    const windEffect = mouse.isIdle ? 0 : (mouse.x - width / 2) / width * 3;

    particlesRef.current.forEach((particle) => {
      // Update sway
      particle.swayPhase += particle.swaySpeed;
      const sway = Math.sin(particle.swayPhase) * 30;

      // Update rotation
      particle.rotation += particle.rotationSpeed * speedMultiplier;

      // Update position
      particle.y += particle.fallSpeed * speedMultiplier;
      particle.x += sway * 0.02 + windEffect;

      // Reset if off screen
      if (particle.y > height + 20) {
        particle.y = -20;
        particle.x = Math.random() * width;
        particle.swayPhase = Math.random() * Math.PI * 2;
        particle.color = colors[Math.floor(Math.random() * colors.length)];
      }
      if (particle.x > width + 20) {
        particle.x = -20;
      }
      if (particle.x < -20) {
        particle.x = width + 20;
      }

      // Draw leaf
      drawLeaf(
        ctx,
        particle.x + sway,
        particle.y,
        particle.size,
        particle.rotation,
        particle.color || colors[0],
        particle.opacity
      );
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [width, height, mouse, colors, drawLeaf]);

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
