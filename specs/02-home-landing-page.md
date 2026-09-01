# SPEC 02 — Home / Landing page

> **Estado:** implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-01
> **Objetivo:** Portar a Next.js 16 la landing page de `references/templates/home-about/` como nueva ruta `/`, moviendo el catálogo actual a `/games`, sin implementar About ni ninguna persistencia.

## Sección 1 — Por qué existe esta spec

SPEC 01 dejó `/` como la Biblioteca. `references/templates/home-about/` introduce una **landing page de marketing** (`home.jsx`) que debe vivir en `/`, más una versión ampliada de `nav.jsx` (enlaces "Inicio" y "Acerca de") y `styles.css` (superset de 1744 líneas con los estilos del home). La carpeta también trae `about.jsx` (Acerca de + Contacto), que **queda fuera de esta spec**.

Esta spec traduce solo el Home a la arquitectura real (Server Component con una isla `"use client"` mínima para la animación de scroll), reubica el catálogo en `/games` y actualiza el Nav. El diseño visual del template es la fuente de verdad; el CSS del home se copia desde `references/templates/home-about/styles.css` a `app/globals.css`.

Decisiones ya cerradas por el usuario (no reabrir):

- `/` pasa a ser la **landing page**. El catálogo actual (`LibraryBrowser`) se mueve a **`/games`**.
- Las rutas de detalle y reproductor **siguen siendo `/juegos/[id]` y `/juegos/[id]/jugar`** (no se renombran).
- El catálogo en `/games` **pierde el hero** "ARCADE VAULT" (queda como identidad exclusiva del Home); arranca directo con buscador + grid.
- Los datos mock del Home (ticker de actividad, top jugadores, features, pricing, FAQ) van **inline en los componentes**, tal cual el template. No se toca `app/lib/`.
- La animación de entrada al hacer scroll (`.reveal` + `IntersectionObserver`) se porta como **isla `"use client"` mínima**.
- **Acerca de / Contacto queda fuera** de esta spec (irá en la suya).
- **Sin persistencia**, sin `fetch`, sin backend. Igual que SPEC 01.

## Sección 2 — Alcance

**Dentro:**

- Ruta `/` — Home: hero con siluetas pixel flotantes, secciones "¿Por qué Arcade Vault?" (feature grid), "Juegos disponibles ahora" (rail con `GAMES.slice(0, 6)`), "Stats", "Actividad en vivo" (ticker + top jugadores), "Precios" (plan único + FAQ) y CTA final. Portado de `home.jsx`.
- Ruta `/games` — Biblioteca: renderiza `<LibraryBrowser games={GAMES} />` sin el hero. El resto del comportamiento (buscador, chips, grid, tilt, estado vacío) es el de SPEC 01, sin cambios.
- `app/components/Nav.tsx` actualizado: nuevo enlace "Inicio" → `/`; "Biblioteca" apunta a `/games`; el logo va a `/`. Estado activo: `/` → "Inicio"; `/games` y `/juegos/*` → "Biblioteca". Sin enlace "Acerca de" todavía. Panel móvil con los mismos enlaces.
- Isla `"use client"` para la animación `.reveal` (añade la clase `in` a los elementos al entrar en viewport, con cleanup del observer).
- Navegación de todos los CTA del Home con `next/link` (o `Link` envolviendo las mini-cards):
  - "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS", "INSERTAR MONEDA" (CTA final) → `/games`
  - "CREAR CUENTA", "EMPEZAR GRATIS" → `/entrar`
  - "VER SALÓN" → `/salon-de-la-fama`
  - Mini-card de juego → `/juegos/<id>`
- Copiar a `app/globals.css` todas las clases del home que hoy no existen (`.home-hero`, `.home-silos`, `.feature-grid`, `.mini-rail`, `.home-stats`, `.activity-grid`, `.ticker`, `.top-list`, `.pricing-grid`, `.pricing-faq`, `.home-final`, `.reveal`, etc.) desde `references/templates/home-about/styles.css`.
- `npx tsc --noEmit` y `next build` sin errores.
- Commitear el bloque de agentes regenerado en `AGENTS.md`.

**Fuera de alcance (para futuras specs):**

- Ruta `/acerca-de` (About + formulario de contacto). `about.jsx` no se porta en esta spec y el Nav no lo enlaza.
- Renombrar `/juegos/[id]` → `/games/[id]`.
- Que los datos del Home (actividad, top jugadores, stats) sean reales o derivados de `seededScores`. Son texto de marketing estático.
- Que el rail "Juegos disponibles ahora" tenga su propio filtrado o scroll con controles.
- Persistencia, autenticación real, ranking real (heredado de SPEC 01).
- Tests automatizados (no hay framework).
- Rediseño visual: `styles.css` del template es la fuente; solo se copian clases que falten.
- SEO/metadata avanzada más allá de un `export const metadata` básico por ruta si hace falta.

## Sección 3 — Modelo de datos

No se introduce ninguna estructura nueva en `app/lib/`. El Home consume `GAMES` de `app/lib/games.ts` (SPEC 01) para el rail de 6 juegos.

Los arrays de contenido del Home (features, stats, filas del ticker de actividad, top jugadores de hoy, planes/FAQ de precios) se declaran **inline** dentro de los componentes que los renderizan, con los mismos valores literales que `home.jsx`. Si se tipan, es con tipos locales al archivo (no exportados, no en `app/lib/`).

## Sección 4 — Plan de implementación

Cada paso deja el proyecto compilando (`npx tsc --noEmit`) y navegable (`next dev`).

1. **Mover el catálogo a `/games`.** Crear `app/games/page.tsx` (Server Component) que renderiza `<div className="fade-in"><LibraryBrowser games={GAMES} /></div>` — sin el bloque `<section className="av-hero">`. Actualizar `app/components/Nav.tsx`: "Biblioteca" → `href="/games"`, y el cálculo `isLibrary` pasa a `pathname === "/games" || pathname.startsWith("/juegos")`. Dejar `app/page.tsx` temporalmente redirigiendo o mostrando lo mínimo. Prueba manual: `/games` muestra buscador + grid de 8 juegos; el Nav marca "Biblioteca" activo en `/games` y en `/juegos/<id>`.

2. **Isla de reveal.** Crear `app/components/home/RevealObserver.tsx` (`"use client"`): en `useEffect` hace `document.querySelectorAll(".reveal")`, los observa con `IntersectionObserver` (`threshold: 0.12`), añade `in` y hace `unobserve` al intersecar; `io.disconnect()` en el cleanup. No renderiza nada (`return null`). Prueba manual: montándolo en una página con elementos `.reveal`, la clase `in` aparece al hacer scroll.

3. **Subcomponentes visuales del Home.** Crear en `app/components/home/` (Server Components salvo que se indique):
   - `FloatingSilhouettes.tsx` — las 8 siluetas SVG del hero (`aria-hidden`).
   - `FeatureIcon.tsx` y `HomeSections` según convenga, o inline en `page.tsx`.
   - `MiniCard.tsx` — tarjeta de juego que envuelve el contenido en `<Link href={\`/juegos/${game.id}\`}>`.
   Prueba manual: `npx tsc --noEmit` pasa.

4. **Página Home.** Reescribir `app/page.tsx` (Server Component) portando `home.jsx` sección por sección: hero + `<FloatingSilhouettes />`, feature grid, rail con `GAMES.slice(0, 6).map(g => <MiniCard .../>)`, stats, actividad en vivo (ticker + top list con datos inline), precios (plan + FAQ inline) y CTA final. Todos los `onClick`/`navigate` se sustituyen por `Link` a las rutas de la Sección 2. Montar `<RevealObserver />` una vez al final del árbol. Prueba manual: `/` renderiza las 6 secciones; los botones navegan a `/games`, `/entrar` y `/salon-de-la-fama`; las mini-cards llevan a `/juegos/<id>`.

5. **Nav definitivo.** Añadir el enlace "Inicio" → `/` (antes de "Biblioteca") en la barra y en el panel móvil. Estado activo: `isHome = pathname === "/"`; "Inicio" activo solo en `/`. El logo apunta a `/`. Prueba manual: en `/` está activo "Inicio"; en `/games` y `/juegos/<id>` está activo "Biblioteca"; el menú móvil lista Inicio / Biblioteca / Salón de la Fama / (Iniciar Sesión|Cuenta).

6. **CSS del Home.** Revisar cada clase usada por los componentes nuevos contra `app/globals.css`; copiar las que falten desde `references/templates/home-about/styles.css` (bloque del home: hero, silos, secciones, feature-card, mini-rail, home-stats, activity-grid, ticker, top-list, pricing, home-final, `.reveal`/`.in`, animaciones asociadas). No duplicar clases ya existentes de SPEC 01. Prueba manual: el Home se ve como el prototipo en desktop y en viewport estrecho.

7. **Cierre.** `npx tsc --noEmit` y `next build` sin errores. Verificar que ningún componente usa `localStorage`, `sessionStorage`, `fetch` ni cookies. Confirmar el bloque de agentes regenerado en `AGENTS.md` y dejarlo commiteado.

## Sección 5 — Criterios de aceptación

- [ x] `npx tsc --noEmit` termina sin errores.
- [ x] `next build` termina sin errores.
- [ x] `/` muestra el hero con el eyebrow "▸ INSERTA UNA MONEDA" y el título "EL ARCADE / CLÁSICO ESTÁ / DE VUELTA".
- [ x] `/` muestra la sección "¿POR QUÉ ARCADE VAULT?" con 4 feature-cards (JUEGOS CLÁSICOS, 100% GRATIS, LADDER BOARDS, SIEMPRE CRECIENDO).
- [ x] `/` muestra un rail con exactamente 6 mini-cards, correspondientes a `GAMES.slice(0, 6)`.
- [ x] Hacer clic en una mini-card del rail navega a `/juegos/<id>` del juego correspondiente.
- [ x] El botón "▶ EXPLORAR JUEGOS" del hero y "INSERTAR MONEDA →" del CTA final navegan a `/games`.
- [ x] El botón "✦ CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/entrar`.
- [ x] El botón "VER SALÓN →" de la tarjeta de top jugadores navega a `/salon-de-la-fama`.
- [ x] `/` muestra la sección "ACTIVIDAD EN VIVO" con un ticker de 7 filas y una lista de 5 top jugadores.
- [ x] `/` muestra la sección "PRECIOS" con la tarjeta "JUGADOR VAULT / $0" y 3 preguntas de FAQ.
- [ x] Al hacer scroll, las secciones con clase `.reveal` reciben la clase `in` (aparecen con animación) y no vuelven a observarse.
- [ x] `/games` renderiza el buscador y el grid con los 8 juegos de `GAMES`, **sin** el hero "ARCADE VAULT".
- [ x] Escribir "caí" en el buscador de `/games` deja visible solo la tarjeta "CAÍDA" (comportamiento de SPEC 01 intacto).
- [ x] `/juegos/bloque-buster` y `/juegos/bloque-buster/jugar` siguen funcionando en sus URLs actuales.
- [ x] En el Nav, el enlace "Inicio" está activo en `/` y el enlace "Biblioteca" está activo en `/games` y en `/juegos/<id>`.
- [ x] El logo del Nav navega a `/`.
- [ x] El Nav no muestra ningún enlace "Acerca de".
- [ x] En viewport estrecho (<840px) el panel lateral lista Inicio, Biblioteca, Salón de la Fama y el botón de sesión.
- [ x] Ningún componente nuevo usa `localStorage`, `sessionStorage`, `fetch` ni cookies.

## Sección 6 — Decisiones tomadas y descartadas

- **Sí:** `/` = Home, catálogo movido a `/games`. Decisión del usuario; el logo y el enlace "Inicio" del template apuntan a `/`, así que la landing debe vivir ahí.
- **No:** Home en `/inicio` con la Biblioteca en `/`. Contradice el template y deja la landing en una URL secundaria.
- **Sí:** detalle y reproductor se quedan en `/juegos/[id]`. Solo se mueve el índice del catálogo; se minimiza la superficie de cambio y no se tocan `generateStaticParams` ni los criterios de SPEC 01.
- **No:** renombrar todo a `/games/[id]`. Coherencia estética que no justifica mover dos carpetas más y reescribir enlaces y criterios ya implementados.
- **Sí:** `/games` sin hero. Decisión del usuario: el hero "ARCADE VAULT" queda como identidad exclusiva del Home.
- **Sí:** datos mock del Home inline en los componentes. Es contenido de marketing estático, no datos de dominio; nada más los consume.
- **No:** extraer a `app/lib/home.ts`. Añade una capa tipada para arrays de un solo uso.
- **Sí:** animación `.reveal` como isla `"use client"` (`RevealObserver`) que consulta el DOM en `useEffect`. Mantiene el Home como Server Component y las secciones como markup renderizado en el servidor.
- **No:** secciones siempre visibles sin animación. Se pierde un detalle característico del prototipo.
- **Fuera:** About + Contacto. Decisión del usuario: va en su propia spec; el Nav no enlaza "Acerca de" hasta entonces.
- **Sí:** copiar las clases del home desde `references/templates/home-about/styles.css` a `app/globals.css`. `globals.css` sigue siendo la única hoja de estilos; se evita divergencia.

## Sección 7 — Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Mover `/` a `/games` puede romper enlaces internos de SPEC 01 (Nav, acciones de detalle/repro que apuntan a `/`). | Auditar todos los `href="/"` y `Link` a `/` en `app/` durante el paso 1; redirigir los del catálogo a `/games`. Los criterios de SPEC 01 que mencionan `/` se reinterpretan sobre `/games`. |
| `RevealObserver` consulta `document` — no debe ejecutarse en el servidor. | Componente `"use client"`, lógica solo en `useEffect`; `IntersectionObserver` existe en todos los navegadores objetivo. Cleanup con `io.disconnect()`. |
| Hidratación: si el CSS aplica opacidad 0 a `.reveal` y el JS no carga, el contenido queda invisible. | Copiar de `styles.css` también la regla de fallback (o `.reveal` sin `in` con opacidad reducida pero legible); verificar el Home con JS desactivado en el paso 6. |
| `styles.css` del template (1744 líneas) es un superset; copiar de más duplicaría reglas de SPEC 01. | En el paso 6, copiar solo clases ausentes en `app/globals.css` (grep previo confirma que ninguna clase `home-*`/`.reveal` existe aún). |
| El copy del Home habla de "12+ JUEGOS" pero `GAMES` tiene 8. | Se mantiene el texto literal del template (marketing); no es un dato derivado. Documentado como fuera de alcance. |
| Next 16 tiene breaking changes (ver `AGENTS.md`). | Consultar `node_modules/next/dist/docs/01-app/` antes de escribir las rutas nuevas. `app/games/page.tsx` es una ruta estática sin `params`. |
| El bloque de agentes de `AGENTS.md` lo regenera `next dev` y ensucia el árbol. | Commitearlo junto con los cambios, según `CLAUDE.md`. |
