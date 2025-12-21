import { useState, useEffect, useCallback, useRef } from 'react';
import type { MouseState } from '../types';

const IDLE_THRESHOLD = 3000; // 3 seconds without movement = idle

export function useMouseTracking(enabled: boolean = true): MouseState {
  const [mouseState, setMouseState] = useState<MouseState>({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    isIdle: true,
    velocity: 0,
  });

  const lastPosition = useRef({ x: 0, y: 0 });
  const lastTime = useRef(Date.now());
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!enabled) return;

      const now = Date.now();
      const deltaTime = now - lastTime.current;
      const deltaX = e.clientX - lastPosition.current.x;
      const deltaY = e.clientY - lastPosition.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = deltaTime > 0 ? distance / deltaTime : 0;

      lastPosition.current = { x: e.clientX, y: e.clientY };
      lastTime.current = now;

      // Clear existing idle timer
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
      }

      setMouseState({
        x: e.clientX,
        y: e.clientY,
        isIdle: false,
        velocity: Math.min(velocity, 2), // Cap velocity
      });

      // Set new idle timer
      idleTimer.current = setTimeout(() => {
        setMouseState((prev) => ({ ...prev, isIdle: true, velocity: 0 }));
      }, IDLE_THRESHOLD);
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) {
      setMouseState((prev) => ({ ...prev, isIdle: true, velocity: 0 }));
      return;
    }

    window.addEventListener('mousemove', handleMouseMove);

    // Start as idle
    idleTimer.current = setTimeout(() => {
      setMouseState((prev) => ({ ...prev, isIdle: true }));
    }, IDLE_THRESHOLD);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
      }
    };
  }, [enabled, handleMouseMove]);

  return mouseState;
}
