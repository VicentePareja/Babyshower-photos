import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const ojos = b.ojos === "claro" || b.ojos === "oscuro" ? b.ojos : null;
  const peso =
    typeof b.peso_gramos === "number" &&
    Number.isInteger(b.peso_gramos) &&
    b.peso_gramos >= 500 &&
    b.peso_gramos <= 7000
      ? b.peso_gramos
      : null;
  const fecha =
    typeof b.fecha_real === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.fecha_real)
      ? b.fecha_real
      : null;
  const publicado = b.publicado === true;

  const { data, error } = await getSupabaseAdmin()
    .from("quiniela_resultado")
    .upsert({
      id: 1,
      publicado,
      ojos,
      peso_gramos: peso,
      fecha_real: fecha,
      actualizado_at: new Date().toISOString(),
    })
    .select("publicado, ojos, peso_gramos, fecha_real")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
