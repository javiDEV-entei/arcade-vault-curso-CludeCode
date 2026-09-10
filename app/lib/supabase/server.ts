import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Cliente de Supabase para el servidor (Server Components, Route Handlers, Server Actions).
 * En Next 16 `cookies()` es async. `setAll` va envuelto en try/catch porque los
 * Server Components no pueden escribir cookies; en ese caso el middleware/Route Handler
 * se encarga de refrescar la sesión.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Llamado desde un Server Component: se puede ignorar si hay
            // middleware refrescando la sesión del usuario.
          }
        },
      },
    },
  );
}
