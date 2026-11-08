import { useEffect, useRef } from 'react';
import type { AnimationProps } from '../types';
import { startHarvestScene, type HarvestPalette } from '../harvestScene';

/** The harvest wheat field. The scene sizes itself to the window, so width and height aren't needed. */
export function HarvestEffect({ mouse, intensity, palette }: AnimationProps & { palette: HarvestPalette }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const windRef = useRef(0);

  // Moving the mouse across the screen leans the wheat a little that way
  useEffect(() => {
    windRef.current = mouse.isIdle ? 0 : ((mouse.x - window.innerWidth / 2) / window.innerWidth) * 0.25;
  }, [mouse]);

  useEffect(() => {
    const scene = startHarvestScene(canvasRef.current!, { palette, intensity, wind: () => windRef.current });
    return () => scene.stop();
  }, [palette, intensity]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }} />;
}
