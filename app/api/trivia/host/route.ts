import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  calcularRanking,
  getJuego,
  preguntaActual,
  sanitizarPregunta,
  siguienteIndiceActivo,
} from "@/lib/trivia/servidor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vista del host/proyector: pregunta, conteos en vivo, distribución y ranking.
// Las respuestas correctas solo se incluyen cuando estado === 'revelado'/'podio'.
export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get("pin")?.trim() ?? "";
  const supabase = getSupabaseAdmin();
  const juego = await getJuego(supabase);

  if (pin && pin !== juego.pin) {
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 403 });
  }

  const pregunta = preguntaActual(juego);
  const revelado = juego.estado === "revelado" || juego.estado === "podio";
  const activas = juego.preguntas.filter((p) => p.activa).length;
  const hayMas = siguienteIndiceActivo(juego, juego.pregunta_idx) !== -1;
  let numero = 0;
  if (pregunta) {
    numero = juego.preguntas
      .slice(0, juego.pregunta_idx + 1)
      .filter((p) => p.activa).length;
  }

  // Jugadores conectados.
  const { data: jugadores } = await supabase
    .from("trivia_jugadores")
    .select("id, nombre, puntaje, racha, conectado, expulsado")
    .eq("expulsado", false)
    .order("creado_at", { ascending: true });
  const lista = jugadores ?? [];

  // Respuestas de la pregunta actual: conteo + distribución (sin correctitud).
  let respondieron = 0;
  let distribucion: Record<string, number> | null = null;
  if (pregunta && pregunta.tipo !== "bienvenida") {
    const { data: resp } = await supabase
      .from("trivia_respuestas")
      .select("respuesta")
      .eq("pregunta_idx", juego.pregunta_idx);
    respondieron = resp?.length ?? 0;
    if (pregunta.tipo === "opcion" || pregunta.tipo === "multiple") {
      distribucion = {};
      for (const o of pregunta.opciones ?? []) distribucion[o.id] = 0;
      for (const r of resp ?? []) {
        const v = r.respuesta as { opcion?: string; opciones?: string[] };
        const ids = v?.opciones ?? (v?.opcion ? [v.opcion] : []);
        for (const id of ids)
          if (id in distribucion) distribucion[id] = (distribucion[id] ?? 0) + 1;
      }
    }
  }

  const ranking = await calcularRanking(supabase, 100);

  return NextResponse.json({
    estado: juego.estado,
    nombre: juego.nombre,
    descripcion: juego.descripcion,
    pin: juego.pin,
    pregunta_idx: juego.pregunta_idx,
    numero,
    total_activas: activas,
    hay_mas: hayMas,
    pregunta: pregunta
      ? revelado
        ? pregunta // host revela: incluye correctas
        : sanitizarPregunta(pregunta)
      : null,
    pregunta_inicio: juego.pregunta_inicio,
    resto_ms: juego.resto_ms,
    timer: pregunta?.timer ?? juego.config.timerDefault,
    server_now: new Date().toISOString(),
    jugadores_total: lista.length,
    conectados: lista.filter((j) => j.conectado).length,
    respondieron,
    distribucion,
    jugadores: lista,
    ranking,
  });
}
