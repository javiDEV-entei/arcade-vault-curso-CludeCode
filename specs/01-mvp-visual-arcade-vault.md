# SPEC 01 — MVP visual de Arcade Vault

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-08-30
> **Objetivo:** Portar a Next.js 16 (App Router) las cinco pantallas de `references/templates/` como interfaz navegable y estática, sin implementar ningún juego ni persistencia.

## Sección 1 — Por qué existe esta spec

`references/templates/` contiene un prototipo funcional montado con React 18 + Babel Standalone y un router propio por `location.hash`. Ese prototipo no es el destino: el proyecto real es Next.js 16 con App Router, React 19 Server Components y Tailwind v4. Esta spec traduce el prototipo a la arquitectura real conservando el diseño visual (que ya está volcado íntegro en `app/globals.css`), y define qué se convierte en ruta real, qué en Client Component y qué se descarta.

Decisiones ya cerradas por el usuario (no reabrir):

- Navegación con **rutas reales de Next**, no router por hash.
- **Sin persistencia**: la sesión de usuario vive solo en estado de React en memoria; al recargar se pierde.
- El reproductor **mantiene la simulación fake** del template (score que sube solo, niveles, modal de fin). Es efecto visual, no un juego.
- Alcance: **solo las 5 pantallas** de `references/templates/` + barra de navegación + footer.

## Sección 2 — Alcance

**Dentro:**

- Ruta `/` — Biblioteca: hero, buscador por nombre, chips de categoría, grid de tarjetas con efecto tilt. Portado de `biblioteca.jsx`.
- Ruta `/juegos/[id]` — Detalle de juego: carátula CSS, tags, descripción larga, tira de estadísticas, acciones y tabla de mejores puntuaciones. Portado de `detalle.jsx`.
- Ruta `/juegos/[id]/jugar` — Reproductor: HUD, carcasa CRT con arena animada, pausa/fin y modal de game over con simulación fake. Portado de `reproductor.jsx`.
- Ruta `/entrar` — Autenticación: tarjeta con pestañas Iniciar sesión / Crear cuenta, formulario, botón de invitado y botones sociales decorativos. Portado de `auth.jsx`.
- Ruta `/salon-de-la-fama` — Salón de la Fama: pestañas por juego, podio de 3 y tabla completa con fila "tú" cuando hay sesión. Portado de `salon.jsx`.
- Barra de navegación con panel lateral móvil, contador de créditos decorativo y botón de sesión (portado de `nav.jsx`), presente en todas las rutas.
- Footer fijo con el texto `© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0` (portado de `app.jsx`).
- Datos mock portados a módulos TypeScript: los 8 juegos, las categorías y el generador de puntuaciones con semilla.
- Estado de sesión en memoria (usuario o invitado) compartido vía React Context desde el layout raíz.
- `notFound()` (404 de Next) cuando el `id` de juego no existe en `/juegos/[id]` y `/juegos/[id]/jugar`.
- Comprobación de tipos con `npx tsc --noEmit` y build con `next build` sin errores.

**Fuera de alcance (para futuras specs):**

- Cualquier juego jugable de verdad (motor, controles, colisiones).
- Autenticación real (backend, OAuth con Google/GitHub, validación, registro).
- Persistencia de cualquier tipo (localStorage, IndexedDB, base de datos, API).
- Ranking global real o guardado de puntuaciones.
- Página de perfil, ajustes de cuenta, historial de partidas.
- Tests automatizados (no hay framework configurado).
- Internacionalización, modo claro, accesibilidad más allá de lo que ya trae el CSS.
- Rediseño visual: el CSS de `app/globals.css` se toma como fuente de verdad y solo se amplía si falta alguna clase usada por los templates.

## Sección 3 — Modelo de datos

No hay base de datos ni persistencia. Se portan las estructuras mock del template a TypeScript.

```ts
// app/lib/games.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;          // slug, p.ej. "bloque-buster"
  title: string;
  short: string;       // descripción de tarjeta
  long: string;        // descripción de detalle
  cat: GameCategory;
  cover: string;       // clase CSS de carátula, p.ej. "cover-bricks"
  color: GameColor;    // color del botón JUGAR
  best: number;        // mejor puntuación global (número)
  plays: string;       // partidas, ya formateado, p.ej. "12.4K"
}

export const GAMES: Game[];               // los 8 juegos de data.jsx, sin cambios
export const CATS: readonly string[];     // ["TODOS","ARCADE","PUZZLE","SHOOTER","VERSUS"]
export function getGame(id: string): Game | undefined;
```

```ts
// app/lib/scores.ts
export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/2026"
}

export const PLAYERS: string[];  // los 18 alias de data.jsx
export function seededScores(seed: number, count?: number): ScoreRow[]; // misma lógica que data.jsx
```

```ts
// app/components/SessionProvider.tsx
export interface SessionUser {
  name: string; // mayúsculas, máx. 10 caracteres
}
// Context: { user: SessionUser | null, signIn(name: string): void, signInAsGuest(): void, signOut(): void }
```

Convenciones:

- Los `id` de juego son los slugs actuales de `data.jsx` y se usan tal cual en las URLs (`/juegos/bloque-buster`).
- Las semillas de `seededScores` se derivan del `id` igual que en el template (`id.length * 17 + 3` en detalle, `id.length * 23 + 7` en salón) para que los números coincidan con el prototipo.
- Números formateados con `toLocaleString("es-ES")` en la vista, nunca en los datos.

## Sección 4 — Plan de implementación

Cada paso deja el proyecto compilando (`npx tsc --noEmit`) y navegable (`next dev`).

1. **Datos mock.** Crear `app/lib/games.ts` y `app/lib/scores.ts` portando `GAMES`, `CATS`, `PLAYERS` y `seededScores` desde `references/templates/data.jsx` con los tipos de la Sección 3. Añadir `getGame`. Prueba manual: `npx tsc --noEmit` pasa.

2. **Contexto de sesión.** Crear `app/components/SessionProvider.tsx` (`"use client"`) con el Context y el hook `useSession()`. Estado en memoria con `useState`, sin efectos ni almacenamiento. Envolver `{children}` con `<SessionProvider>` en `app/layout.tsx`.

3. **Navegación y footer.** Crear `app/components/Nav.tsx` (`"use client"`, portado de `nav.jsx`: enlaces con `next/link`, estado activo con `usePathname()`, panel lateral móvil con `useState`, botón de sesión leyendo `useSession()`) y `app/components/Footer.tsx` (Server Component). Montar ambos en `app/layout.tsx` alrededor de `<main className="av-main">{children}</main>`. Prueba manual: la barra y el footer se ven en todas las rutas; el menú móvil abre y cierra.

4. **Biblioteca.** Crear `app/components/GameCard.tsx` (`"use client"`, tarjeta con efecto tilt en `onMouseMove`) y `app/components/LibraryBrowser.tsx` (`"use client"`, buscador + chips + grid filtrado con `useState`/`useMemo`). Reescribir `app/page.tsx` (Server Component) para renderizar el hero y `<LibraryBrowser games={GAMES} />`. Prueba manual: `/` lista los 8 juegos, filtra por texto y categoría, muestra el estado vacío.

5. **Detalle de juego.** Crear `app/juegos/[id]/page.tsx` (Server Component `async`, `params: Promise<{ id: string }>`, `notFound()` si `getGame` devuelve `undefined`). Renderizar carátula, tags, descripción, tira de estadísticas, acciones (`next/link` a `/` y a `./jugar`) y la tabla de puntuaciones con `seededScores(id.length * 17 + 3, 10)`. Añadir `generateStaticParams()` con los 8 ids. Prueba manual: `/juegos/bloque-buster` renderiza; `/juegos/no-existe` da 404.

6. **Reproductor.** Crear `app/juegos/[id]/jugar/page.tsx` (Server Component: resuelve el juego, `notFound()` si no existe) que renderiza `app/juegos/[id]/jugar/PlayerShell.tsx` (`"use client"`, portado de `reproductor.jsx`: HUD, arena CRT, simulación con `setInterval`, pausa, fin, modal de game over con input de iniciales que **no guarda nada**). El nombre del jugador sale de `useSession()` o `"INVITADO"`. Botón SALIR → `next/link` al detalle. Prueba manual: `/juegos/caida/jugar` muestra el score subiendo; pausa lo congela; FIN abre el modal; "GUARDAR PUNTUACIÓN" solo muestra el toast.

7. **Autenticación.** Crear `app/entrar/page.tsx` renderizando `app/entrar/AuthForm.tsx` (`"use client"`, portado de `auth.jsx`: pestañas, campos controlados, botones sociales decorativos). Al enviar o pulsar "JUGAR COMO INVITADO" se llama a `signIn()`/`signInAsGuest()` del contexto y se navega a `/` con `useRouter().push`. Prueba manual: iniciar sesión con un usuario lleva a `/` y el nav muestra el nombre; recargar la página vuelve a estado sin sesión.

8. **Salón de la Fama.** Crear `app/salon-de-la-fama/page.tsx` renderizando `app/salon-de-la-fama/HallOfFame.tsx` (`"use client"`, portado de `salon.jsx`: pestañas por juego, podio de 3, tabla con `seededScores(tab.length * 23 + 7, 12)`, fila "tú" visible solo si `useSession().user` existe). Prueba manual: `/salon-de-la-fama` cambia de tabla al pulsar cada pestaña; la fila "tú" aparece solo con sesión iniciada.

9. **Repaso de CSS y cierre.** Revisar que toda clase usada por los componentes existe en `app/globals.css`; añadir las que falten copiándolas de `references/templates/styles.css`. Ejecutar `npx tsc --noEmit` y `next build`. Confirmar el bloque de agentes regenerado en `AGENTS.md` y dejarlo commiteado.

## Sección 5 — Criterios de aceptación

- [ ] `npx tsc --noEmit` termina sin errores.
- [ ] `next build` termina sin errores.
- [ ] `/` muestra el hero "ARCADE VAULT" y una tarjeta por cada uno de los 8 juegos de `GAMES`.
- [ ] Escribir "caí" en el buscador de `/` deja visible solo la tarjeta "CAÍDA".
- [ ] Pulsar el chip "PUZZLE" en `/` deja visible solo los juegos de categoría PUZZLE.
- [ ] Una búsqueda sin resultados muestra el bloque "NO HAY RESULTADOS".
- [ ] Hacer clic en una tarjeta navega a `/juegos/<id>` y la URL cambia.
- [ ] `/juegos/bloque-buster` muestra título, descripción larga, tira de estadísticas y una tabla con 10 filas de puntuaciones.
- [ ] `/juegos/id-inexistente` devuelve la página 404 de Next.
- [ ] En `/juegos/<id>` el botón "JUGAR AHORA" navega a `/juegos/<id>/jugar`.
- [ ] En `/juegos/<id>/jugar` la puntuación del HUD aumenta sola con el tiempo.
- [ ] Pulsar "PAUSA" congela la puntuación; "REANUDAR" la reactiva.
- [ ] Pulsar "FIN" abre el modal "FIN DEL JUEGO" con la puntuación final.
- [ ] Pulsar "GUARDAR PUNTUACIÓN" en el modal muestra el toast "PUNTUACIÓN GUARDADA" y no persiste nada al recargar.
- [ ] `/entrar` muestra la tarjeta con las pestañas "INICIAR SESIÓN" y "CREAR CUENTA" y alterna los campos al cambiar de pestaña.
- [ ] Enviar el formulario de `/entrar` navega a `/` y la barra de navegación muestra el nombre del usuario.
- [ ] Recargar el navegador tras iniciar sesión vuelve al estado sin sesión (botón "Iniciar Sesión" visible).
- [ ] "JUGAR COMO INVITADO" en `/entrar` navega a `/`.
- [ ] `/salon-de-la-fama` muestra un podio de 3 puestos y una tabla de 12 filas para el juego seleccionado.
- [ ] Cambiar de pestaña de juego en `/salon-de-la-fama` cambia los datos del podio y la tabla.
- [ ] La fila "TU MEJOR MARCA" en `/salon-de-la-fama` solo aparece si hay sesión iniciada.
- [ ] La barra de navegación y el footer aparecen en las 5 rutas.
- [ ] En viewport estrecho (<840px) la barra colapsa y el botón "≡" abre el panel lateral.
- [ ] Ningún componente usa `localStorage`, `sessionStorage`, `fetch` ni cookies.

## Sección 6 — Decisiones tomadas y descartadas

- **Sí:** rutas reales de Next (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/entrar`, `/salon-de-la-fama`). URLs compartibles y alineadas con App Router. Decisión del usuario.
- **No:** router por `location.hash` como `app.jsx`. Va contra la arquitectura de Next 16 y no aporta nada al MVP visual.
- **Sí:** estado de sesión en memoria vía React Context en el layout raíz. El layout no se remonta al navegar con `next/link`, así que el nombre del usuario persiste entre rutas sin almacenamiento.
- **No:** persistencia en `localStorage` (`av_user`, `av_scores`) como el template. Decisión explícita del usuario: "sin persistencia".
- **Sí:** mantener la simulación fake del reproductor (`setInterval` que sube el score, niveles, modal). Es el efecto visual que define esa pantalla. Decisión del usuario.
- **No:** dejar el reproductor totalmente estático. Perdería la identidad de la pantalla del prototipo.
- **Sí:** páginas como Server Components con "islas" `"use client"` para lo interactivo (nav, buscador, tarjetas, formularios, reproductor, salón). Es el patrón recomendado por la doc de Next 16.
- **Sí:** `app/globals.css` es la fuente de verdad del estilo; solo se copian clases que falten desde `references/templates/styles.css`. Evita divergencia entre dos hojas de estilo.
- **Sí:** `generateStaticParams()` con los 8 ids en las rutas de juego. Prerenderiza el catálogo conocido; los ids desconocidos caen en `notFound()`.
- **No:** portar los "tweaks" / panel de ajustes que insinúa `styles.css` (`.tw-section`, `.tw-label`). No aparecen en ninguna de las 5 pantallas del template.

## Sección 7 — Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Next 16 tiene breaking changes respecto a versiones conocidas (ver `AGENTS.md`). | Consultar `node_modules/next/dist/docs/01-app/` antes de escribir código de framework. Ya verificado: `params` es `Promise` y se usa `PageProps<'/ruta'>` para tiparlo. |
| `next/font` ya carga Press Start 2P, JetBrains Mono y Courier Prime en `layout.tsx`; el template las cargaba por `<link>`. | No añadir `<link>` a Google Fonts. Las variables `--pixel` / `--mono` de `globals.css` ya apuntan a las variables de `next/font`. |
| El efecto tilt de las tarjetas manipula `style.transform` directamente. | Encapsularlo en un Client Component (`GameCard`) con `useRef`; no romper hidratación (transform inicial vacío). |
| La simulación del reproductor usa `setInterval` en `useEffect`. | Limpiar el intervalo en el cleanup; el componente es `"use client"` y nunca corre en el servidor. |
| El bloque de agentes de `AGENTS.md` lo regenera `next dev` y ensucia el árbol. | Commitearlo junto con los cambios, según indica `CLAUDE.md`. |

## Lo que **no** entra en esta spec

- Ningún juego jugable.
- Autenticación real ni registro (OAuth, backend, validación).
- Persistencia de datos de cualquier tipo.
- Ranking global real ni guardado de puntuaciones.
- Perfil de usuario, ajustes, historial.
- Tests automatizados.
- Internacionalización y modo claro.

Cada uno de esos, si llega, va en su propia spec.
