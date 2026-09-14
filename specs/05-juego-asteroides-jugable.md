# SPEC 05 — Primer juego jugable: Asteroides

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-11
> **Objetivo:** Portar el clon de Asteroids de `references/started-games/02-asteroids/` a un componente de juego real dentro de `/juegos/asteroides/jugar`, integrado con el HUD y el modal de fin de PlayerShell, sin tocar los otros 7 juegos del catálogo ni añadir persistencia real de puntuaciones.

## Sección 1 — Por qué existe esta spec

SPEC 01 dejó explícitamente fuera "cualquier juego jugable de verdad": el reproductor (`PlayerShell.tsx`) mantiene una simulación fake (`setInterval` que suma puntos al azar, arena decorativa con `div`s animados). `references/started-games/02-asteroids/` ya trae un clon de Asteroids terminado y funcional en Canvas puro (`game.js`, sin dependencias): nave, disparo, asteroides que se dividen, partículas de explosión, power-up de disparo triple, 3 vidas con invencibilidad temporal y niveles progresivos.

Esta spec porta ese juego como el **primer juego real** de la plataforma, agregándolo al catálogo bajo un `id` propio (`asteroides`) — distinto del mock `rocas` ya existente, que se deja intacto — e integrándolo con el HUD y el modal de fin que ya tiene `PlayerShell.tsx`, en vez de dibujar su propio HUD/overlay dentro del canvas.

Decisiones ya cerradas por el usuario (no reabrir):

- Alcance: **solo Asteroides**. Los otros 7 juegos del catálogo (incluyendo el mock `rocas`) siguen con la simulación fake actual de `PlayerShell`, sin tocar. Cada uno se portará en su propia spec futura.
- Nueva entrada en `GAMES` con `id: "asteroides"` (no reemplaza ni fusiona con `rocas`, que queda intacta tal cual está).
- La entrada `asteroides` reutiliza el texto (`short`/`long`), la categoría (`SHOOTER`), el color (`yellow`) y la carátula CSS (`cover-rocas`) que ya tiene `rocas` — se acepta la duplicación visual entre ambas entradas como decisión consciente del usuario.
- Integración vía **registro de componentes por id**: un mapa `id → componente de juego` que `PlayerShell` consulta; si el `id` no está en el registro, se mantiene el comportamiento fake actual sin cambios. Este patrón es el que usarán las specs futuras de otros juegos.
- El HUD (Puntuación/Vidas/Nivel) sigue siendo el de React en `PlayerShell`: el motor del juego **notifica** los stats vía callback en cada frame; se elimina el `drawHUD()` que dibuja texto dentro del canvas del juego original, para no duplicarlo.
- El canvas mantiene la resolución lógica fija del original (800×600) y se escala visualmente por CSS dentro de `.crt-screen` (que ya tiene `aspect-ratio: 4/3`, igual a 800:600).
- Se portan los power-ups (disparo triple) del original tal cual, sin cambios de diseño.
- Solo controles de teclado (flechas + espacio), igual que el original. Sin controles táctiles en esta spec.
- Pausa: el bucle real del juego se congela por completo mientras `paused` es `true` (no se llama a `update(dt)`); al reanudar continúa donde quedó, sin saltos de tiempo.
- Fin de partida: se elimina el overlay "GAME OVER" dibujado en el canvas original (incluyendo su reinicio con Espacio). Cuando el motor llega a 0 vidas, notifica a `PlayerShell` (mismo mecanismo de callback que el HUD) y se abre el modal de fin ya existente, con la puntuación final real. El botón "FIN" sigue disponible como abandono manual.
- "JUGAR DE NUEVO" en el modal reinicia el motor real (nave, asteroides, puntuación, vidas, nivel desde cero).
- "GUARDAR PUNTUACIÓN" en el modal **sigue siendo local/falso** (solo cambia el estado visual a "guardado"), igual que hoy — SPEC 04 dejó explícitamente fuera cualquier tabla de puntuaciones; la persistencia real queda para una spec futura que dependa de esa base.
- Estilo visual: **reskin a la paleta neón del proyecto** en vez del blanco/negro clásico del original. Mapeo de color:
  - Nave: cian (`var(--cyan)` / `#00f5ff`), llama del propulsor en naranja como el original.
  - Asteroides: magenta (`var(--magenta)` / `#ff006e`).
  - Balas: amarillo (`var(--yellow)` / `#f5ff00`).
  - Power-up de disparo triple: cian pulsante (mismo color que la nave, contexto distinto).
  - Partículas de explosión: magenta con fade (coherente con el color del asteroide destruido).
  - Fondo del canvas: negro puro (`#000`), igual que el original.

## Sección 2 — Alcance

**Dentro:**

- `app/lib/games.ts`: nueva entrada en `GAMES` con `id: "asteroides"`, `title: "ASTEROIDES"`, mismo `short`/`long`/`cat`/`color`/`cover`/`best`/`plays` que la entrada `rocas` existente (copiados literalmente). `rocas` no se modifica ni se elimina.
- `app/games/asteroids/engine.ts`: el motor del juego portado desde `references/started-games/02-asteroids/game.js` — clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle` y la lógica de `update`/`draw`/colisiones, **sin globals de `window`/`document`** (todo encapsulado en una clase `AsteroidsEngine` que recibe el `CanvasRenderingContext2D` y el estado de teclas). Colores hardcodeados según el mapeo de la Sección 1. Sin `drawHUD()` ni overlay de game over dibujados en canvas; expone `getStats()` (`{ score, lives, level }`) y `isGameOver()`.
- `app/games/asteroids/AsteroidsGame.tsx` (`"use client"`): componente que monta el `<canvas width={800} height={600}>`, instancia `AsteroidsEngine`, gestiona el `requestAnimationFrame` y los listeners de teclado **con cleanup en unmount** (a diferencia del original, que los deja globales). Props: `paused: boolean`, `onStats: (stats) => void`, `onGameOver: (finalScore: number) => void`. Llama a `onStats` en cada frame y a `onGameOver` una sola vez cuando `isGameOver()` pasa a `true`.
- `app/lib/game-engines.tsx`: registro `GAME_ENGINES: Record<string, ComponentType<GameEngineProps>>` con la entrada `asteroides: AsteroidsGame`. Exporta el tipo `GameEngineProps` (`paused`, `onStats`, `onGameOver`) que usará este y los juegos futuros.
- `app/juegos/[id]/jugar/PlayerShell.tsx`: si `GAME_ENGINES[game.id]` existe, renderiza ese componente dentro de `.crt-screen` en vez de la arena fake (`div`s animados), le pasa `paused={paused || over}`, `onStats` (actualiza `score`/`lives`/`level` en estado de React) y `onGameOver` (fija `over = true`); usa una `key` que cambia en cada reinicio para remontar el componente y así reiniciar el motor. Si `GAME_ENGINES[game.id]` no existe, el comportamiento actual (simulación `setInterval`, arena de `div`s, `lives` fijo en 3) sigue exactamente igual.
- CSS nuevo en `app/globals.css`: una clase para el wrapper del `<canvas>` dentro de `.crt-screen` (ancho/alto 100%, `display:block`), sin tocar `.game-arena` ni las clases de la arena fake existentes.
- `npx tsc --noEmit` sin errores.
- Commitear el bloque de agentes regenerado en `AGENTS.md`.

**Fuera de alcance (para futuras specs):**

- Cualquier otro juego del catálogo (Tetris/"caída", Arkanoid/"bloque buster", Snake/"serpentina", Pac-Man/"glotón", Space Invaders/"invasores", Frogger/"ranaria", Pong/"duelo pixel").
- Controles táctiles/en pantalla para móvil.
- Persistencia real de puntuaciones (tabla en Supabase, lectura del ranking real en `/juegos/asteroides` o `/salon-de-la-fama`).
- Eliminar o fusionar la entrada mock `rocas`.
- Sonido/música.
- Tests automatizados (no hay framework en el proyecto).

## Sección 3 — Modelo de datos

No hay persistencia nueva. Se agregan dos tipos en memoria, sin almacenamiento:

```ts
// app/lib/game-engines.tsx
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
```

`GAMES` (en `app/lib/games.ts`) gana un elemento más del tipo `Game` ya existente (sin cambios de forma) con `id: "asteroides"`.

## Sección 4 — Plan de implementación

Cada paso deja el proyecto compilando (`npx tsc --noEmit`) y navegable (`next dev`).

1. **Catálogo.** Agregar a `app/lib/games.ts` el objeto `asteroides` (copiando `title: "ASTEROIDES"`, y el resto de campos —`short`, `long`, `cat`, `cover`, `color`, `best`, `plays`— idénticos a los de `rocas`). No tocar la entrada `rocas`. Prueba manual: `/games` (biblioteca) muestra 9 tarjetas, incluida "ASTEROIDES"; `/juegos/asteroides` renderiza el detalle con el leaderboard mock (vía `seededScores`, ya genérico).

2. **Motor del juego.** Crear `app/games/asteroids/engine.ts` portando `game.js`: clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle` dentro de una clase `AsteroidsEngine` que encapsula `W`/`H`/`ctx`/estado de teclas (recibidas como parámetro en `update`, no leídas de `window`). Aplicar el mapeo de colores de la Sección 1. Quitar `drawHUD()` y `drawOverlay()` de game over; agregar `getStats()` e `isGameOver()`. Sin canvas todavía (no se usa desde ninguna página). Prueba manual: `npx tsc --noEmit` pasa.

3. **Componente de juego.** Crear `app/games/asteroids/AsteroidsGame.tsx` (`"use client"`): monta `<canvas width={800} height={600}>` dentro de un wrapper con la clase CSS nueva, crea el `AsteroidsEngine` en un `useEffect` al montar, agrega listeners de teclado (`keydown`/`keyup`) con cleanup en el `return` del efecto, corre el loop con `requestAnimationFrame` (mismo cap de `dt` a 50ms que el original), llama a `onStats` cada frame con `getStats()`, y a `onGameOver(stats.score)` una sola vez cuando `isGameOver()` cambia a `true` (usar un `ref` para no llamarlo repetidamente). Cuando `paused` es `true`, el loop sigue pidiendo frames (para no perder el `requestAnimationFrame`) pero no llama a `update(dt)` ni acumula `dt`. Prueba manual: `npx tsc --noEmit` pasa (todavía sin integrar en `PlayerShell`).

4. **Registro de motores.** Crear `app/lib/game-engines.tsx` con los tipos `GameEngineStats`/`GameEngineProps` y `GAME_ENGINES = { asteroides: AsteroidsGame }`. Prueba manual: `npx tsc --noEmit` pasa.

5. **Integración en PlayerShell.** Modificar `app/juegos/[id]/jugar/PlayerShell.tsx`: buscar `const Engine = GAME_ENGINES[game.id]`. Si existe, renderizar `<Engine key={resetKey} paused={paused || over} onStats={...} onGameOver={...} />` dentro de `.crt-screen` en vez de `.game-arena`; `onStats` actualiza `score`/`lives`/`level` de React; `onGameOver` fija `over = true` (la puntuación final ya está en `score` por los `onStats` previos). El botón "JUGAR DE NUEVO" incrementa `resetKey` (además de resetear `score`/`level`/`paused`/`over`/`saved` como ya hace `restart()`) para remontar el componente y reiniciar el motor. Si `GAME_ENGINES[game.id]` no existe, dejar el bloque actual (interval fake + `.game-arena`) exactamente igual. Prueba manual: en `/juegos/asteroides/jugar` el juego real es controlable con teclado, el HUD refleja puntuación/vidas/nivel reales, pausa congela el juego, perder la última vida abre el modal de fin con la puntuación real, "JUGAR DE NUEVO" reinicia limpio; en `/juegos/caida/jugar` (u otro juego existente) el comportamiento fake sigue idéntico al de antes de esta spec.

6. **CSS del canvas.** Añadir a `app/globals.css` la clase del wrapper del canvas (ancho/alto 100% del `.crt-screen`, `display:block`), sin modificar `.game-arena` ni sus hijos. Prueba manual: el canvas llena visualmente el `.crt-screen` en desktop y en viewport estrecho, sin recortes ni scroll horizontal.

7. **Cierre.** `npx tsc --noEmit` sin errores. Verificar que ningún listener de teclado queda activo tras salir de `/juegos/asteroides/jugar` (navegar a otra ruta y confirmar en consola/DevTools que no hay más de un juego respondiendo a las flechas). Confirmar el bloque de agentes regenerado en `AGENTS.md` y dejarlo comiteado.

## Sección 5 — Criterios de aceptación

- [x] `npx tsc --noEmit` termina sin errores.
- [x] `app/lib/games.ts` incluye una entrada con `id: "asteroides"` y `title: "ASTEROIDES"`; la entrada `rocas` sigue existiendo sin cambios.
- [x] `/games` muestra 9 tarjetas (las 8 originales más "ASTEROIDES").
- [x] `/juegos/asteroides` renderiza el detalle del juego (carátula, tags, descripción, leaderboard mock) igual que cualquier otro juego del catálogo.
- [x] En `/juegos/asteroides/jugar`, el juego se controla con `←`/`→` (rotar), `↑` (propulsar) y `Espacio` (disparar), sobre un `<canvas>` real con fondo negro y elementos en cian/magenta/amarillo.
- [x] El HUD de `PlayerShell` (Puntuación/Vidas/Nivel) refleja los valores reales del motor, actualizados en tiempo real; el canvas no dibuja su propio texto de HUD.
- [x] Los asteroides grandes se dividen en medianos y estos en pequeños al recibir un disparo; el nivel avanza al destruir todos los asteroides en pantalla.
- [x] El power-up de disparo triple aparece y, al recogerlo, la nave dispara 3 balas en abanico durante un tiempo limitado.
- [x] El botón "PAUSA" congela el juego real (la nave/asteroides dejan de moverse) y "REANUDAR" lo continúa sin saltos visibles.
- [x] Al perder la última vida, se abre automáticamente el modal de fin existente con la puntuación final correcta, sin ningún overlay adicional dibujado en el canvas.
- [x] El botón "FIN" abre el mismo modal manualmente y congela el juego detrás de él.
- [x] "GUARDAR PUNTUACIÓN" en el modal solo cambia el estado visual a "guardado" (sin llamada de red ni escritura en Supabase).
- [x] "JUGAR DE NUEVO" cierra el modal y arranca una partida nueva desde cero (nave centrada, puntuación 0, vidas 3, nivel 1).
- [x] Navegar a `/juegos/asteroides/jugar` y luego a otra ruta detiene el `requestAnimationFrame` y remueve los listeners de teclado (no quedan activos en segundo plano).
- [x] Cualquier otro juego del catálogo (p. ej. `/juegos/caida/jugar`) conserva exactamente el comportamiento fake actual (simulación de puntuación, arena de `div`s, HUD con `lives` fijo en 3) sin cambios.

## Sección 6 — Decisiones tomadas y descartadas

- **Sí:** registro de componentes por `id` (`GAME_ENGINES`) en vez de un `if` hardcodeado dentro de `PlayerShell`. Decisión del usuario — establece el patrón que usarán las specs de los próximos juegos sin tener que refactorizar `PlayerShell` cada vez.
- **No:** un `if (game.id === "asteroides")` directo en `PlayerShell`. Funcionaría para este único juego pero no deja un patrón reutilizable.
- **Sí:** nueva entrada `asteroides` en el catálogo, independiente de `rocas`. Decisión explícita del usuario — el juego real tiene su propio `id`, aunque el mock `rocas` (con temática de asteroides pero sin motor real) se mantenga intacto y visualmente parecido.
- **No:** renombrar o reemplazar `rocas`. El usuario decidió dejarla intacta.
- **Sí:** el motor notifica stats y game-over vía callbacks (`onStats`/`onGameOver`), y `PlayerShell` sigue siendo la única fuente del HUD y el modal. Evita duplicar UI (dos HUDs, dos overlays de game over) y reutiliza los componentes ya existentes.
- **No:** mantener el `drawHUD()`/overlay de game over del canvas original. Se habría solapado visualmente con el HUD y modal de React.
- **Sí:** reinicio de partida vía remount (`key` que cambia) en vez de exponer un método `reset()` imperativo en el motor. Es el patrón idiomático de React para "empezar de cero" un componente con estado interno complejo, y evita mantener sincronizados dos caminos de reinicio (interno del motor + externo de React).
- **Sí:** reskin a la paleta neón del proyecto (cian/magenta/amarillo) en vez del blanco/negro clásico del original. Decisión del usuario — visualmente coherente con el resto de `arcade-vault` y con el marco CRT que ya envuelve el reproductor.
- **Sí:** power-ups portados tal cual, sin cambios de diseño. Decisión del usuario — ya están terminados en el juego de referencia y no agregan trabajo de diseño nuevo.
- **Sí:** solo teclado, sin controles táctiles. Decisión del usuario — el texto "TECLADO / TÁCTIL" de la página de detalle es genérico para todo el catálogo y no se corrige en esta spec; los controles táctiles quedan para una spec futura si hace falta.
- **Sí:** canvas a resolución lógica fija 800×600, escalado por CSS. Decisión del usuario — evita reescribir toda la física/posiciones del original a coordenadas relativas, y `.crt-screen` ya tiene `aspect-ratio: 4/3` (idéntico a 800:600), así que no hay distorsión.
- **No:** persistencia real de puntuaciones en esta spec. SPEC 04 dejó explícitamente fuera cualquier tabla; esta spec no depende de esa infraestructura y "GUARDAR PUNTUACIÓN" sigue siendo un efecto visual local, igual que en el resto del catálogo.

## Sección 7 — Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Next 16 / React 19 tienen breaking changes respecto a versiones conocidas (ver `AGENTS.md`). | Consultar `node_modules/next/dist/docs/01-app/` antes de escribir `AsteroidsGame.tsx` como Client Component, en particular cualquier patrón de `useEffect` + Canvas + Route Handler dinámico. |
| El original registra los listeners de teclado en `window` de forma global y nunca los limpia — en una SPA con rutas reales, eso deja listeners fantasma al navegar fuera de `/juegos/asteroides/jugar`. | `AsteroidsGame.tsx` agrega los listeners dentro de un `useEffect` y los remueve en su función de limpieza al desmontar. Verificado en el criterio de cierre. |
| Colores hardcodeados en el motor (canvas no puede leer `var(--cyan)` directamente sin `getComputedStyle`) pueden desincronizarse si el tema cambia en `app/globals.css`. | Se documentan los valores hex exactos usados (Sección 1) junto a la variable CSS que representan; si el tema cambia, se actualiza el motor en la misma spec que cambie el tema. |
| Congelar el motor en pausa sin resetear bien el `dt` puede producir un salto grande de física al reanudar (asteroides "teletransportándose"). | Igual que el original limita `dt` a 50ms máximo por frame; además, al pasar de `paused=true` a `false` se descarta el primer `dt` calculado (se trata como si fuera el primer frame) para evitar acumulación del tiempo pausado. |
| Tener dos entradas de catálogo con texto idéntico (`rocas` y `asteroides`) puede leerse como un bug visual en `/games`. | Aceptado como decisión consciente del usuario; documentado explícitamente en la Sección 6 para que no se "corrija" por accidente en una limpieza futura. |
| El bloque de agentes de `AGENTS.md` lo regenera `next dev` y ensucia el árbol. | Commitearlo junto con los cambios, según `CLAUDE.md`. |

## Lo que **no** entra en esta spec

- Cualquier otro juego del catálogo.
- Controles táctiles.
- Persistencia real de puntuaciones.
- Eliminar o fusionar la entrada mock `rocas`.
- Sonido/música.
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.
