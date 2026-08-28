# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Qué es este proyecto

Arcade Vault: plataforma web para jugar online y competir por puntuación (ranking global).
Actualmente es un scaffold recién creado de Next.js — solo existen `app/layout.tsx` y
`app/page.tsx` con el contenido por defecto de `create-next-app`. Toda la funcionalidad
(juegos, autenticación, ranking, persistencia de puntos) está por construir.

## Comandos

```bash
npm run dev      # servidor de desarrollo (next dev)
npm run build    # build de producción
npm run start    # sirve el build de producción
npm run lint     # ESLint (eslint-config-next: core-web-vitals + typescript)
```

No hay framework de tests configurado todavía. `npx tsc --noEmit` para chequeo de tipos.

## Stack

- **Next.js 16.3.3** con App Router (directorio `app/`). Ver la advertencia de `AGENTS.md`:
  esta versión tiene breaking changes respecto a versiones conocidas; consultar
  `node_modules/next/dist/docs/01-app/` antes de escribir código de framework.
- **React 19.2** — Server Components por defecto; marcar `"use client"` solo cuando haga falta.
- **Tailwind CSS v4** vía `@tailwindcss/postcss`. No hay `tailwind.config`; el tema se define
  en `app/globals.css` con `@theme inline` y `@import "tailwindcss"`.
- **TypeScript** strict, alias de import `@/*` → raíz del proyecto.

## Flujo de trabajo: Spec Driven Design

El desarrollo sigue diseño dirigido por especificación con las skills de
`Klerith/fernando-skills` (instaladas con `npx skills@latest add Klerith/fernando-skills`):

- `/spec` — redactar la especificación de una feature antes de implementar.
- `/spec-impl` — implementar a partir de la especificación aprobada.

Escribir/actualizar la spec correspondiente antes de implementar features nuevas.

## Notas

- `app/layout.tsx` usa `LayoutProps<"/">`, un tipo generado por Next 16 — no importar a mano.
- El bloque de agentes en `AGENTS.md` lo regenera `next dev`; commitearlo junto con los cambios
  para mantener el árbol limpio.
