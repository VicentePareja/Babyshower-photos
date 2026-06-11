import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente con service role. SOLO importable desde código de servidor
// (route handlers): "server-only" rompe el build si se cuela en el cliente.
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
