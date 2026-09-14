// Registro de motores de juego reales, por id de catálogo (ver app/lib/games.ts).
//
// PlayerShell consulta este mapa: si el `id` del juego está registrado aquí, renderiza el
// componente real en vez de la simulación fake (setInterval + arena de divs). Este es el
// patrón que usarán las specs futuras de los demás juegos del catálogo.

import type { ComponentType } from "react";
import AsteroidsGame from "@/app/games/asteroids/AsteroidsGame";

export interface GameEngineStats {
  score: number;
  lives: number;
  level: number;
}

export interface GameEngineProps {
  paused: boolean;
  onStats: (stats: GameEngineStats) => void;
  onGameOver: (finalScore: number) => void;
}

export const GAME_ENGINES: Record<string, ComponentType<GameEngineProps>> = {
  asteroides: AsteroidsGame,
};
