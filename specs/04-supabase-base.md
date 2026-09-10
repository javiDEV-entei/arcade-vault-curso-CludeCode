# SPEC 04 — Integración base de Supabase

> **Estado:** aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-10
> **Objetivo:** Dejar Supabase conectado al proyecto Next.js (SDK, variables de entorno, helpers de cliente browser/server y verificación de conexión), sin crear tablas ni tocar sesión, auth ni puntuaciones.

## Sección 1 — Por qué existe esta spec

El proyecto no tiene backend: la sesión vive en memoria (SPEC 01) y las puntuaciones son `seededScores` deterministas. Antes de construir ranking real o autenticación real hace falta una capa de acceso a Supabase que las specs siguientes puedan dar por hecha. Esta spec **solo monta los cimientos**: instala el SDK, fija los nombres de las env vars, crea los helpers `@supabase/ssr` (uno para navegador, uno para servidor) siguiendo el patrón oficial de App Router, deja un endpoint de salud que prueba la conexión y genera el archivo de tipos de la base de datos.

El proyecto de Supabase ya existe (`project_ref=ufxxzkvdnvtvuefzwanp`, conectado vía el MCP en `.mcp.json`) y actualmente tiene **0 tablas** en el esquema `public`.

Decisiones ya cerradas por el usuario (no reabrir):

- Alcance: **solo la base**. No se reemplaza `SessionProvider` ni `AuthForm` ni `PlayerShell`; no se crean tablas.
- Migraciones: archivos SQL versionados en `supabase/migrations/` **y** aplicados al proyecto remoto vía la herramienta MCP `apply_migration`. En esta spec no hay ninguna migración con contenido todavía; solo se establece la convención y el directorio.
- El catálogo `GAMES` **sigue estático** en `app/lib/games.ts`. Supabase nunca servirá el catálogo.
- Paquetes: `@supabase/supabase-js` + `@supabase/ssr`.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (la clave publishable `sb_publishable_...` es el reemplazo moderno de la `anon` key clásica; es pública por diseño, protegida por RLS). `@supabase/ssr` la acepta como segundo argumento igual que la anon key.
- Verificación de cierre: Route Handler `GET /api/health/supabase` + archivo de tipos generado (`app/lib/supabase/database.types.ts`).
- El valor real de `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_DB_PASSWORD` ya está en `.env.local` (aportado por el usuario en config previa). No se inventa ni se deja un placeholder que rompa la conexión.

## Sección 2 — Alcance

**Dentro:**

- Dependencias nuevas: `@supabase/supabase-js` y `@supabase/ssr` (npm).
- `app/lib/supabase/client.ts`: helper de **navegador** (`createBrowserClient`) para futuros Client Components. Exporta una función `createClient()`.
- `app/lib/supabase/server.ts`: helper de **servidor** (`createServerClient` con integración de `cookies()` de Next 16, async). Exporta una función `createClient()` async. Preparado para Auth aunque todavía no haya sesión.
- `app/lib/supabase/database.types.ts`: tipos generados con la herramienta MCP `generate_typescript_types`. Con 0 tablas será prácticamente vacío; se regenera en cada spec que añada tablas. Los helpers se tipan con `Database` desde este archivo.
- `app/api/health/supabase/route.ts` (Route Handler, runtime Node): `GET` que instancia el cliente de servidor y hace una comprobación de conectividad contra la API REST de Supabase (`fetch` a `${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/` con la anon key en cabecera `apikey`). Responde `200 { ok: true }` si la instancia responde y autoriza, `500 { ok: false, error }` si falla o faltan las env vars.
- `.env.template`: añadir `NEXT_PUBLIC_SUPABASE_URL=` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` (vacías, comiteable). El bloque `SUPABASE_DB_PASSWORD=` que ya existe se conserva.
- `.env.local` (no comiteado, cubierto por `.gitignore` con `.env*`): valores reales, aportados por el usuario en el paso 1.
- `supabase/migrations/` : directorio creado con un `README.md` que documenta el flujo (archivo SQL aquí + `apply_migration` vía MCP con el mismo nombre). Sin `.sql` todavía.
- `npx tsc --noEmit` sin errores.
- Commitear el bloque de agentes regenerado en `AGENTS.md`.

**Fuera de alcance (para futuras specs):**

- Cualquier tabla (`profiles`, `scores`, etc.), su RLS y sus políticas.
- Autenticación real con Supabase Auth (reemplazo de `SessionProvider` / `AuthForm`).
- Guardado y lectura de puntuaciones reales (reemplazo de `seededScores` / `PlayerShell` / `HallOfFame`).
- Mover `GAMES` a una tabla.
- Cliente admin con `service_role` key.
- Edge Functions.
- Supabase CLI local con Docker (`supabase start`, `supabase db push`).
- Realtime, Storage.
- Tests automatizados (no hay framework).

## Sección 3 — Modelo de datos

Esta spec **no introduce ninguna tabla ni estructura persistente**. El esquema `public` de Supabase sigue con 0 tablas al terminar.

El único archivo "de datos" es `app/lib/supabase/database.types.ts`, generado automáticamente. Con la base vacía su contenido efectivo es:

```ts
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
```

Se regenerará (sobrescribiendo el archivo) en cada spec futura que añada tablas.

## Sección 4 — Plan de implementación

Cada paso deja el proyecto compilando (`npx tsc --noEmit`) y navegable (`next dev`).

1. **Dependencias y env vars.** `npm install @supabase/supabase-js @supabase/ssr`. Añadir a `.env.template` las líneas `NEXT_PUBLIC_SUPABASE_URL=` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=`. `.env.local` ya contiene los valores reales (`NEXT_PUBLIC_SUPABASE_URL=https://ufxxzkvdnvtvuefzwanp.supabase.co` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`) y `.env.template` ya tiene ambas líneas vacías; no hay nada que pedir. Prueba manual: `npx tsc --noEmit` sigue pasando.

2. **Tipos de la base de datos.** Generar `app/lib/supabase/database.types.ts` con la herramienta MCP `generate_typescript_types`. Prueba manual: el archivo existe y exporta `Database`; `npx tsc --noEmit` pasa.

3. **Helper de navegador.** Crear `app/lib/supabase/client.ts`: `export function createClient()` que devuelve `createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!)`. Consultar `node_modules/@supabase/ssr` y `node_modules/next/dist/docs/01-app/` para la firma exacta en Next 16. Prueba manual: `npx tsc --noEmit` pasa.

4. **Helper de servidor.** Crear `app/lib/supabase/server.ts`: `export async function createClient()` que usa `cookies()` de `next/headers` (async en Next 16) y `createServerClient<Database>` con los callbacks `getAll` / `setAll` del patrón oficial, envolviendo `setAll` en try/catch (Server Components no pueden escribir cookies). Prueba manual: `npx tsc --noEmit` pasa.

5. **Endpoint de salud.** Crear `app/api/health/supabase/route.ts`: `export async function GET()`. Si falta `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, responde `500 { ok: false, error: "env vars ausentes" }`. Si no, hace `fetch(\`${url}/rest/v1/\`, { headers: { apikey } })`; si la respuesta tiene status < 500, responde `200 { ok: true }`; si no, o si el `fetch` lanza, responde `500 { ok: false, error }`. Consultar la doc de Route Handlers de Next 16 antes de escribirlo. Prueba manual: con `.env.local` bien configurado, `curl http://localhost:3000/api/health/supabase` devuelve `200 { "ok": true }`; borrando la anon key devuelve `500`.

6. **Convención de migraciones.** Crear `supabase/migrations/README.md` explicando: cada cambio de esquema es un archivo `NNNN_descripcion.sql` en esta carpeta, aplicado al proyecto remoto con la herramienta MCP `apply_migration` usando el mismo nombre. Sin `.sql` en esta spec. Prueba manual: el archivo existe.

7. **Cierre.** `npx tsc --noEmit` sin errores. Confirmar que `SUPABASE_DB_PASSWORD` y cualquier secreto no `NEXT_PUBLIC_` no aparece en ningún bundle de cliente (solo se referencian en código server-only). Ejecutar la herramienta MCP `get_advisors` (security) y confirmar que no hay hallazgos nuevos introducidos por esta spec. Confirmar el bloque de agentes regenerado en `AGENTS.md` y dejarlo comiteado.

## Sección 5 — Criterios de aceptación

- [ ] `npx tsc --noEmit` termina sin errores.
- [ ] `package.json` lista `@supabase/supabase-js` y `@supabase/ssr` en `dependencies`.
- [ ] `.env.template` contiene `NEXT_PUBLIC_SUPABASE_URL=` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` (vacías) y conserva `SUPABASE_DB_PASSWORD=`.
- [ ] `.env.local` existe con valores reales y **no** está comiteado (`git status` no lo muestra; `.env*` sigue en `.gitignore`).
- [ ] `app/lib/supabase/client.ts` exporta `createClient()` y usa `createBrowserClient`.
- [ ] `app/lib/supabase/server.ts` exporta `createClient()` async y usa `createServerClient` con `cookies()` de `next/headers`.
- [ ] `app/lib/supabase/database.types.ts` existe y exporta el tipo `Database`.
- [ ] Con `.env.local` correcto y el dev server corriendo, `GET /api/health/supabase` responde `200` con `{ "ok": true }`.
- [ ] Sin `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `GET /api/health/supabase` responde `500` con `{ "ok": false, ... }` y no tira una excepción sin capturar.
- [ ] El esquema `public` de Supabase sigue teniendo 0 tablas (`list_tables` vía MCP lo confirma).
- [ ] `supabase/migrations/README.md` existe y describe el flujo archivo SQL + `apply_migration`.
- [ ] Ningún archivo bajo `app/components/` importa desde `app/lib/supabase/server.ts`.
- [ ] `get_advisors` (security) no reporta hallazgos nuevos atribuibles a esta spec.
- [ ] `SessionProvider`, `AuthForm`, `PlayerShell`, `HallOfFame` y `seededScores` quedan sin cambios.

## Sección 6 — Decisiones tomadas y descartadas

- **Sí:** alcance limitado a los cimientos (SDK + helpers + health). Sigue el patrón incremental de SPEC 01–03 y evita una spec gigante que mezcle auth y ranking. Decisión del usuario.
- **No:** integrar Auth real y puntuaciones reales en esta spec. Cada una tendrá la suya, apoyándose en esta base.
- **Sí:** `@supabase/ssr` desde el principio, con helper de navegador y de servidor separados. Es el patrón oficial para App Router y hace que Auth entre después sin refactor. Decisión del usuario.
- **No:** un único `@supabase/supabase-js`. No maneja la sesión en SSR y habría que migrarlo al añadir Auth.
- **Sí:** `GAMES` permanece estático en `app/lib/games.ts`. El catálogo casi no cambia; moverlo a la base añadiría un round-trip en cada render sin beneficio hoy. Decisión del usuario.
- **Sí:** env vars `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Coinciden con la doc de `@supabase/ssr`; la anon key es pública por diseño y su exposición al cliente es esperada (RLS es la barrera real). Decisión del usuario.
- **No:** crear tablas `profiles` / `scores` "de una vez". Decisión del usuario: el esquema se define en la spec que lo conecte, con su RLS y políticas pensadas para ese uso.
- **Sí:** health check por `fetch` a la API REST en vez de una query a una tabla. No hay tablas todavía; el `fetch` a `/rest/v1/` verifica URL + anon key + alcance de red sin depender de esquema. Una spec futura puede cambiarlo a un `count` real.
- **Sí:** migraciones como archivos en `supabase/migrations/` aplicados vía MCP `apply_migration`. Deja historial en git y en Supabase. Decisión del usuario.
- **No:** Supabase CLI local con Docker. Overhead de entorno que este proyecto no necesita ahora.
- **No:** cliente `service_role`. No hay caso de uso server-admin en esta spec; añadir esa key ampliaría la superficie de secreto sin motivo.

## Sección 7 — Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| La anon key acaba en el bundle de cliente. | Es intencionado y esperado por diseño de Supabase; la seguridad real la da RLS. Los secretos que **no** deben filtrarse (`SUPABASE_DB_PASSWORD`, futura `service_role`) nunca llevan prefijo `NEXT_PUBLIC_` y solo se leen en código server-only. Verificado en el criterio de cierre. |
| Next 16 tiene breaking changes en `cookies()` (async) y Route Handlers (ver `AGENTS.md`). | Consultar `node_modules/next/dist/docs/01-app/` (Route Handlers y `cookies`) y `node_modules/@supabase/ssr` antes de escribir los helpers. `cookies()` se espera con `await`. |
| `@supabase/ssr` cambia la firma de `getAll`/`setAll` entre versiones. | Fijar la versión instalada y seguir el ejemplo de `node_modules/@supabase/ssr` (no la memoria del modelo). `setAll` en el helper de servidor va envuelto en try/catch. |
| El health check depende de que `.env.local` esté configurado; en CI/deploy sin esas vars, el endpoint responde 500 aunque el código sea correcto. | El endpoint distingue "env vars ausentes" de "fallo de conexión" en el campo `error`. El criterio de cierre exige probarlo con las vars puestas. |
| `generate_typescript_types` sobre una base vacía puede producir un archivo con formato inesperado. | Revisar el archivo generado; si el tipo `Database` no es utilizable, ajustar a mano al shape mínimo de la Sección 3 y anotar que se regenera al crear la primera tabla. |
| El bloque de agentes de `AGENTS.md` lo regenera `next dev` y ensucia el árbol. | Commitearlo junto con los cambios, según `CLAUDE.md`. |

## Lo que **no** entra en esta spec

- Tablas, RLS y políticas.
- Autenticación real con Supabase Auth.
- Puntuaciones reales (lectura o escritura).
- Mover `GAMES` a la base de datos.
- Cliente `service_role` / Edge Functions / Realtime / Storage.
- Supabase CLI local con Docker.
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.
