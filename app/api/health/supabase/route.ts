import { createClient } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health/supabase
 * Verifica que la URL + la clave publishable + el alcance de red permiten
 * hablar con la API REST de Supabase. No depende de ninguna tabla.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apikey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !apikey) {
    return Response.json(
      { ok: false, error: "env vars ausentes" },
      { status: 500 },
    );
  }

  // Instancia el cliente de servidor (prepara la integración con cookies para Auth futura).
  await createClient();

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey },
      cache: "no-store",
    });

    if (res.status < 500) {
      return Response.json({ ok: true });
    }

    return Response.json(
      { ok: false, error: `Supabase respondió ${res.status}` },
      { status: 500 },
    );
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
