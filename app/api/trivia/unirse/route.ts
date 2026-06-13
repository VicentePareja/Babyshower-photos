import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getJuego } from "@/lib/trivia/servidor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Une o reconecta a un jugador. Sin login: solo PIN + nombre.
// Si llega un jugador_id existente, restaura su nombre y puntaje.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const pin = String(body.pin ?? "").trim();
  const nombreRaw = String(body.nombre ?? "").trim();
  const jugadorId =
    typeof body.jugador_id === "string" ? body.jugador_id : null;

  const supabase = getSupabaseAdmin();
  const juego = await getJuego(supabase);

  if (juego.estado === "cerrado") {
    return NextResponse.json(
      { error: "El juego aún no está abierto." },
      { status: 403 }
    );
  }
  if (pin !== juego.pin) {
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 403 });
  }

  // Reconexión: el jugador ya existe con este id y pin.
  if (jugadorId) {
    const { data: existente } = await supabase
      .from("trivia_jugadores")
      .select("*")
      .eq("id", jugadorId)
      .eq("pin", pin)
      .maybeSingle();
    if (existente) {
      if (existente.expulsado) {
        return NextResponse.json(
          { error: "Fuiste retirado del juego." },
          { status: 403 }
        );
      }
      await supabase
        .from("trivia_jugadores")
        .update({ conectado: true, visto_at: new Date().toISOString() })
        .eq("id", jugadorId);
      return NextResponse.json({ id: existente.id, nombre: existente.nombre });
    }
  }

  const nombre = nombreRaw.slice(0, 24);
  if (nombre.length < 1) {
    return NextResponse.json(
      { error: "Escribe un nombre o apodo." },
      { status: 400 }
    );
  }

  const id = jugadorId && esUuid(jugadorId) ? jugadorId : randomUUID();
  const { error } = await supabase.from("trivia_jugadores").upsert({
    id,
    pin,
    nombre,
    conectado: true,
    visto_at: new Date().toISOString(),
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id, nombre });
}

function esUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s
  );
}
