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

// Vista por jugador: estado del juego + pregunta sanitizada + su resultado.
// Las respuestas correctas SOLO viajan cuando estado === 'revelado'/'podio'.
export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get("pin")?.trim() ?? "";
  const jugadorId = req.nextUrl.searchParams.get("jugador_id") ?? null;

  const supabase = getSupabaseAdmin();
  const juego = await getJuego(supabase);

  if (pin && pin !== juego.pin) {
    return NextResponse.json({ estado: "pin_invalido" }, { status: 403 });
  }

  const activas = juego.preguntas.filter((p) => p.activa);
  const totalActivas = activas.length;
  const pregunta = preguntaActual(juego);
  const revelado = juego.estado === "revelado" || juego.estado === "podio";
  const hayMas = siguienteIndiceActivo(juego, juego.pregunta_idx) !== -1;

  // Número de la pregunta actual entre las activas (1-based, para mostrar).
  let numero = 0;
  if (pregunta) {
    numero =
      juego.preguntas
        .slice(0, juego.pregunta_idx + 1)
        .filter((p) => p.activa).length;
  }

  const base = {
    estado: juego.estado,
    nombre: juego.nombre,
    descripcion: juego.descripcion,
    pin: juego.pin,
    config: { sonidos: juego.config.sonidos, animaciones: juego.config.animaciones },
    pregunta_idx: juego.pregunta_idx,
    numero,
    total_activas: totalActivas,
    hay_mas: hayMas,
    pregunta: pregunta ? sanitizarPregunta(pregunta) : null,
    pregunta_inicio: juego.pregunta_inicio,
    resto_ms: juego.resto_ms,
    timer: pregunta?.timer ?? juego.config.timerDefault,
    server_now: new Date().toISOString(),
  };

  // Estado del jugador (puntaje, racha, puesto, si ya respondió, su resultado).
  let jugador = null;
  let yaRespondio = false;
  let miResultado = null;
  if (jugadorId) {
    const { data: j } = await supabase
      .from("trivia_jugadores")
      .select("id, nombre, puntaje, racha, mejor_racha, expulsado")
      .eq("id", jugadorId)
      .maybeSingle();
    if (j) {
      let puesto = 0;
      if (juego.estado !== "lobby" && juego.estado !== "cerrado") {
        const ranking = await calcularRanking(supabase);
        puesto = ranking.find((r) => r.id === j.id)?.puesto ?? 0;
      }
      jugador = { ...j, puesto };

      if (pregunta) {
        const { data: resp } = await supabase
          .from("trivia_respuestas")
          .select("correcto, fraccion, puntos, ms, respuesta")
          .eq("jugador_id", jugadorId)
          .eq("pregunta_idx", juego.pregunta_idx)
          .maybeSingle();
        yaRespondio = !!resp;
        if (revelado && resp) miResultado = resp;
      }
    }
  }

  // Respuestas correctas + ranking solo en el reveal.
  let solucion = null;
  let ranking = null;
  if (revelado && pregunta) {
    solucion = {
      correctas: pregunta.correctas ?? null,
      correcto: pregunta.correcto ?? null,
      aceptadas: pregunta.aceptadas ?? null,
    };
  }
  if (revelado) {
    ranking = await calcularRanking(supabase, juego.estado === "podio" ? 100 : 10);
  }

  return NextResponse.json({
    ...base,
    jugador,
    ya_respondio: yaRespondio,
    mi_resultado: miResultado,
    solucion,
    ranking,
  });
}
