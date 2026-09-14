"use client";

import { useEffect, useRef } from "react";
import { AsteroidsEngine, type AsteroidsKeys, type AsteroidsStats } from "./engine";

interface AsteroidsGameProps {
  paused: boolean;
  onStats: (stats: AsteroidsStats) => void;
  onGameOver: (finalScore: number) => void;
}

// Mapeo de teclas físicas del original (flechas + espacio) al estado que consume el motor.
const KEY_MAP: Record<string, keyof AsteroidsKeys> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  Space: "space",
};

export default function AsteroidsGame({
  paused,
  onStats,
  onGameOver,
}: AsteroidsGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs para que el efecto de montaje (que solo debe correr una vez) siempre lea
  // el valor más reciente de estas props sin tener que reiniciar el motor por cambios en ellas.
  const pausedRef = useRef(paused);
  const onStatsRef = useRef(onStats);
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    onStatsRef.current = onStats;
  }, [onStats]);
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const engine = new AsteroidsEngine(ctx);
    const keys: AsteroidsKeys = {
      left: false,
      right: false,
      up: false,
      space: false,
    };
    let gameOverNotified = false;
    let lastTime: number | null = null;
    let wasPaused = false;
    let rafId: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code];
      if (!key) return;
      keys[key] = true;
      e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code];
      if (!key) return;
      keys[key] = false;
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const loop = (ts: number) => {
      const isPaused = pausedRef.current;

      // Mismo cap de dt a 50ms que el original, para evitar spiral-of-death.
      const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;

      if (!isPaused) {
        // Al pasar de paused a activo se descarta el primer dt calculado (se trata
        // como si fuera el primer frame) para no acumular el tiempo que estuvo en pausa.
        engine.update(wasPaused ? 0 : dt, keys);
      }
      wasPaused = isPaused;

      engine.draw();
      onStatsRef.current(engine.getStats());

      if (!gameOverNotified && engine.isGameOver()) {
        gameOverNotified = true;
        onGameOverRef.current(engine.getStats().score);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div className="game-canvas-wrap">
      <canvas ref={canvasRef} width={800} height={600} />
    </div>
  );
}
