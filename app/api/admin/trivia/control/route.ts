import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  getJuego,
  nuevoPin,
  preguntaActual,
  sincronizarPulso,
  siguienteIndiceActivo,
  type JuegoRow,
} from "@/lib/trivia/servidor";
import type { EstadoJuego } from "@/lib/trivia/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const accion = String(body.accion ?? "");
  const supabase = getSupabaseAdmin();
  const juego = await getJuego(supabase);
  const ahora = () => new Date().toISOString();

  // Aplica cambios al estado del juego y sincroniza el pulso público.
  async function aplicar(cambios: Partial<JuegoRow>) {
    const nuevo = { ...juego, ...cambios } as JuegoRow;
    await supabase
      .from("trivia_juego")
      .update({ ...cambios, actualizado_at: ahora() })
      .eq("id", 1);
    await sincronizarPulso(supabase, {
      estado: nuevo.estado,
      pregunta_idx: nuevo.pregunta_idx,
      pregunta_inicio: nuevo.pregunta_inicio,
    });
    return nuevo;
  }

  switch (accion) {
    case "abrir-lobby":
      await aplicar({
        estado: "lobby",
        pregunta_idx: -1,
        pregunta_inicio: null,
        resto_ms: null,
      });
      break;

    case "iniciar":
    case "siguiente":
    case "saltar": {
      const idx = siguienteIndiceActivo(juego, juego.pregunta_idx);
      if (idx === -1) {
        await aplicar({ estado: "podio", pregunta_inicio: null });
        break;
      }
      await aplicar({
        estado: "pregunta",
        pregunta_idx: idx,
        pregunta_inicio: ahora(),
        resto_ms: null,
      });
      break;
    }

    case "revelar":
      await aplicar({ estado: "revelado" });
      break;

    case "pausar": {
      const p = preguntaActual(juego);
      let resto: number | null = null;
      if (p && juego.pregunta_inicio) {
        const transcurrido = Date.now() - new Date(juego.pregunta_inicio).getTime();
        resto = Math.max(0, p.timer * 1000 - transcurrido);
      }
      await aplicar({ estado: "pausa", resto_ms: resto });
      break;
    }

    case "reanudar": {
      const p = preguntaActual(juego);
      const resto = juego.resto_ms ?? (p ? p.timer * 1000 : 0);
      // recoloca el inicio para conservar el tiempo restante
      const inicio = new Date(
        Date.now() - ((p ? p.timer * 1000 : 0) - resto)
      ).toISOString();
      await aplicar({ estado: "pregunta", pregunta_inicio: inicio, resto_ms: null });
      break;
    }

    case "terminar":
      await aplicar({ estado: "podio", pregunta_inicio: null });
      break;

    case "reiniciar":
      // Limpia puntajes y respuestas; conserva jugadores; vuelve al lobby.
      await supabase.from("trivia_respuestas").delete().neq("pregunta_idx", -999);
      await supabase
        .from("trivia_jugadores")
        .update({ puntaje: 0, racha: 0, mejor_racha: 0 })
        .neq("id", "00000000-0000-0000-0000-000000000000");
      await aplicar({
        estado: "lobby",
        pregunta_idx: -1,
        pregunta_inicio: null,
        resto_ms: null,
      });
      break;

    case "reset-total":
      await supabase.from("trivia_respuestas").delete().neq("pregunta_idx", -999);
      await supabase
        .from("trivia_jugadores")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      await aplicar({
        estado: "cerrado",
        pregunta_idx: -1,
        pregunta_inicio: null,
        resto_ms: null,
      });
      break;

    case "regenerar-pin": {
      // Pin nuevo => los jugadores actuales quedan fuera; se limpia la sala.
      await supabase.from("trivia_respuestas").delete().neq("pregunta_idx", -999);
      await supabase
        .from("trivia_jugadores")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      await aplicar({
        pin: nuevoPin(),
        estado: "lobby",
        pregunta_idx: -1,
        pregunta_inicio: null,
        resto_ms: null,
      } as Partial<JuegoRow>);
      break;
    }

    case "kick": {
      const id = String(body.jugador_id ?? "");
      if (!id) return NextResponse.json({ error: "Falta jugador" }, { status: 400 });
      await supabase
        .from("trivia_jugadores")
        .update({ expulsado: true, conectado: false })
        .eq("id", id);
      break;
    }

    case "renombrar": {
      const id = String(body.jugador_id ?? "");
      const nombre = String(body.nombre ?? "").trim().slice(0, 24);
      if (!id || !nombre)
        return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
      await supabase.from("trivia_jugadores").update({ nombre }).eq("id", id);
      break;
    }

    default:
      return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  }

  const refrescado = await getJuego(supabase);
  return NextResponse.json({ ok: true, estado: refrescado.estado as EstadoJuego });
}
