import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const TABLAS = ["foto", "mensaje", "prediccion"] as const;
type Tipo = (typeof TABLAS)[number];

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let tipo: Tipo | undefined;
  let id: string | undefined;
  try {
    const body = await req.json();
    if (TABLAS.includes(body?.tipo)) tipo = body.tipo;
    if (typeof body?.id === "string") id = body.id;
  } catch {
    // body inválido
  }
  if (!tipo || !id) {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (tipo === "foto") {
    const { data: fila, error: errFila } = await supabase
      .from("fotos")
      .select("ruta")
      .eq("id", id)
      .single();
    if (errFila) {
      return NextResponse.json({ error: errFila.message }, { status: 404 });
    }
    // primero el archivo del bucket, luego la fila
    const { error: errStorage } = await supabase.storage
      .from("fotos")
      .remove([fila.ruta]);
    if (errStorage) {
      return NextResponse.json({ error: errStorage.message }, { status: 500 });
    }
    const { error } = await supabase.from("fotos").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const tabla = tipo === "mensaje" ? "mensajes" : "predicciones";
  const { error } = await supabase.from(tabla).delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
