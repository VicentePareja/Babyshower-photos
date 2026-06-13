import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getJuego, preguntaActual } from "@/lib/trivia/servidor";
import { calcularPuntaje } from "@/lib/trivia/puntaje";
import type { Respuesta } from "@/lib/trivia/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tolerancia de red: aceptamos respuestas que lleguen hasta 1.5s después
// del límite (el cliente bloquea en 0). El puntaje usa el tiempo recortado.
const GRACIA_MS = 1500;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const pin = String(body.pin ?? "").trim();
  const jugadorId = String(body.jugador_id ?? "");
  const preguntaIdx = Number(body.pregunta_idx);
  const respuesta = body.respuesta as Respuesta | undefined;

  const supabase = getSupabaseAdmin();
  const juego = await getJuego(supabase);

  if (pin !== juego.pin) {
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 403 });
  }
  if (juego.estado !== "pregunta") {
    return NextResponse.json(
      { error: "No hay una pregunta abierta." },
      { status: 409 }
    );
  }
  if (preguntaIdx !== juego.pregunta_idx) {
    return NextResponse.json(
      { error: "Esa pregunta ya cerró." },
      { status: 409 }
    );
  }

  const pregunta = preguntaActual(juego);
  if (!pregunta || pregunta.tipo === "bienvenida" || pregunta.puntaje <= 0) {
    return NextResponse.json(
      { error: "Esta diapositiva no se responde." },
      { status: 400 }
    );
  }

  // Validación de tiempo: el reloj manda el servidor, no el cliente.
  const inicio = juego.pregunta_inicio
    ? new Date(juego.pregunta_inicio).getTime()
    : Date.now();
  const transcurrido = Date.now() - inicio;
  const limite = pregunta.timer * 1000;
  if (transcurrido > limite + GRACIA_MS) {
    return NextResponse.json(
      { error: "Se acabó el tiempo." },
      { status: 409 }
    );
  }
  const ms = Math.min(Math.max(transcurrido, 0), limite);

  // Jugador válido y no expulsado.
  const { data: jugador } = await supabase
    .from("trivia_jugadores")
    .select("id, racha, mejor_racha, puntaje, expulsado, pin")
    .eq("id", jugadorId)
    .maybeSingle();
  if (!jugador || jugador.pin !== pin || jugador.expulsado) {
    return NextResponse.json({ error: "Jugador inválido." }, { status: 403 });
  }

  // ¿Ya respondió? No se puede cambiar.
  const { data: previa } = await supabase
    .from("trivia_respuestas")
    .select("id")
    .eq("jugador_id", jugadorId)
    .eq("pregunta_idx", preguntaIdx)
    .maybeSingle();
  if (previa) {
    return NextResponse.json({ ok: true, ya_respondio: true });
  }

  const resultado = calcularPuntaje(
    pregunta,
    respuesta,
    ms,
    jugador.racha,
    juego.config
  );

  // Inserta la respuesta (unique jugador+pregunta evita duplicados/carreras).
  const { error: errResp } = await supabase.from("trivia_respuestas").insert({
    jugador_id: jugadorId,
    pregunta_id: pregunta.id,
    pregunta_idx: preguntaIdx,
    respuesta: respuesta ?? null,
    correcto: resultado.correcto,
    fraccion: resultado.fraccion,
    puntos: resultado.puntos,
    ms,
  });
  if (errResp) {
    // Violación de unique => respondió en paralelo; lo tratamos como ok.
    if (errResp.code === "23505") {
      return NextResponse.json({ ok: true, ya_respondio: true });
    }
    return NextResponse.json({ error: errResp.message }, { status: 500 });
  }

  await supabase
    .from("trivia_jugadores")
    .update({
      puntaje: jugador.puntaje + resultado.puntos,
      racha: resultado.rachaNueva,
      mejor_racha: Math.max(jugador.mejor_racha, resultado.rachaNueva),
      visto_at: new Date().toISOString(),
    })
    .eq("id", jugadorId);

  // No revelamos correctitud aquí: el feedback llega en el reveal del host.
  return NextResponse.json({ ok: true, recibido: true });
}
