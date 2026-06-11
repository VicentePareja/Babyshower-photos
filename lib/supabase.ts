import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Cliente de navegador con la anon key. Se crea perezosamente para que el
// build no falle si las variables de entorno aún no existen.
export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error(
        "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }
    client = createClient(url, anonKey, { auth: { persistSession: false } });
  }
  return client;
}

export function fotoPublicUrl(ruta: string): string {
  return getSupabase().storage.from("fotos").getPublicUrl(ruta).data.publicUrl;
}
