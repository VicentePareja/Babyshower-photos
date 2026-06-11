import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const [fotos, mensajes, predicciones] = await Promise.all([
    supabase.from("fotos").select("*").order("created_at", { ascending: false }),
    supabase
      .from("mensajes")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("predicciones")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const fallo = fotos.error || mensajes.error;
  if (fallo) {
    return NextResponse.json({ error: fallo.message }, { status: 500 });
  }

  return NextResponse.json({
    fotos: fotos.data ?? [],
    mensajes: mensajes.data ?? [],
    // la tabla predicciones es opcional: si no existe, devolvemos lista vacía
    predicciones: predicciones.error ? [] : predicciones.data ?? [],
  });
}
