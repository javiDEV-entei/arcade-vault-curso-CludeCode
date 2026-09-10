# Migraciones de Supabase

Cada cambio de esquema de la base de datos (tablas, columnas, RLS, políticas,
funciones, triggers…) se registra como **un archivo SQL versionado en esta carpeta**
y se aplica al proyecto remoto vía MCP.

## Flujo

1. Crear un archivo `NNNN_descripcion.sql` en `supabase/migrations/`
   (numeración incremental de 4 dígitos: `0001_`, `0002_`, …; `descripcion` en
   `snake_case`). El archivo contiene el SQL del cambio.

2. Aplicarlo al proyecto remoto (`project_ref=ufxxzkvdnvtvuefzwanp`) con la
   herramienta MCP `apply_migration`, **usando el mismo nombre** que el archivo
   (sin la extensión `.sql`). Así el historial queda igual en git y en Supabase
   (`list_migrations` vía MCP).

3. Regenerar `app/lib/supabase/database.types.ts` con la herramienta MCP
   `generate_typescript_types` y commitearlo junto con la migración.

## Reglas

- **Nunca** editar un archivo de migración ya aplicado. Un cambio posterior es
  una migración nueva.
- El SQL vive en git **y** en Supabase; no aplicar cambios de esquema a mano por
  el dashboard sin dejar aquí el archivo equivalente.
- No se usa el Supabase CLI local con Docker (`supabase db push`); la aplicación
  es siempre vía MCP `apply_migration`.

## Estado actual

Sin migraciones todavía. El esquema `public` tiene 0 tablas. La primera migración
llegará en la spec que conecte la primera tabla (con su RLS y políticas).
