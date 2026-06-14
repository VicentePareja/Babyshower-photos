import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getJuego, siguienteIndiceActivo } from "@/lib/trivia/servidor";
import { evaluar } from "@/lib/trivia/puntaje";
import type { Pregunta, Respuesta } from "@/lib/trivia/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RespRow {
  jugador_id: string;
  pregunta_idx: number;
  respuesta: Record<string, unknown> | null;
  correcto: boolean;
  puntos: number;
  ms: number;
}

// ¿La respuesta del jugador coincide con la respuesta correcta ACTUAL de la
// pregunta? (Independiente de cómo se puntuó en vivo, por si se corrigieron
// respuestas después del evento.) Para opción/selección compara los ids
// elegidos; para slider/texto usa la evaluación de puntaje.
function aciertoActual(
  p: Pregunta,
  respuesta: Record<string, unknown> | null
): boolean {
  if (!respuesta) return false;
  if (p.tipo === "opcion" || p.tipo === "multiple") {
    const v = respuesta as { opcion?: string; opciones?: string[] };
    const elegidas = new Set(v.opciones ?? (v.opcion ? [v.opcion] : []));
    const correctas = new Set(p.correctas ?? []);
    if (elegidas.size !== correctas.size) return false;
    for (const id of correctas) if (!elegidas.has(id)) return false;
    return true;
  }
  // slider / texto: cuenta como acierto pleno (dist 0 / match exacto)
  return evaluar(p, respuesta as unknown as Respuesta, {
    timerDefault: 0,
    puntajeBase: 0,
    multiplicadores: [],
    sliderToleranciaPct: 0.5,
    sonidos: false,
    animaciones: false,
  }).correcto;
}

const VACIO = {
  finalizado: false,
  estado: "cerrado",
  nombre: "",
  jugadores_total: 0,
  ranking: [],
  progresion: { etiquetas: [], series: [] },
  preguntas: [],
  nombres: {},
};

// Resultados completos de la competencia para la página /resultados (pública).
// Las respuestas correctas SOLO se incluyen cuando el juego ya terminó.
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const juego = await getJuego(supabase);

    const [{ data: jugData }, { data: respData }] = await Promise.all([
      supabase
        .from("trivia_jugadores")
        .select("id, nombre, puntaje, mejor_racha, expulsado")
        .eq("expulsado", false),
      supabase
        .from("trivia_respuestas")
        .select("jugador_id, pregunta_idx, respuesta, correcto, puntos, ms"),
    ]);
    const jugadores = jugData ?? [];
    const respuestas = (respData ?? []) as RespRow[];

    const hayMas = siguienteIndiceActivo(juego, juego.pregunta_idx) !== -1;
    const finalizado =
      juego.estado === "podio" ||
      (juego.estado === "revelado" && !hayMas);

    const nombres: Record<string, string> = {};
    for (const j of jugadores) nombres[j.id] = j.nombre;

    const ranking = [...jugadores]
      .sort((a, b) => b.puntaje - a.puntaje)
      .map((j, i) => ({
        id: j.id,
        nombre: j.nombre,
        puntaje: j.puntaje,
        mejor_racha: j.mejor_racha,
        puesto: i + 1,
      }));

    // Preguntas que puntúan, en orden de juego.
    const scored = juego.preguntas
      .map((p, idx) => ({ p, idx }))
      .filter(({ p }) => p.tipo !== "bienvenida" && (p.puntaje ?? 0) > 0);

    // Respuestas agrupadas por pregunta y puntos por jugador+pregunta.
    const porIdx = new Map<number, RespRow[]>();
    const puntosDe = new Map<string, number>();
    for (const r of respuestas) {
      const arr = porIdx.get(r.pregunta_idx);
      if (arr) arr.push(r);
      else porIdx.set(r.pregunta_idx, [r]);
      puntosDe.set(`${r.jugador_id}:${r.pregunta_idx}`, r.puntos);
    }

    // Progresión acumulada (quién iba ganando) para el top 6.
    const topN = ranking.slice(0, 6);
    const etiquetas = scored.map((_, i) => `P${i + 1}`);
    const series = topN.map((j) => {
      let cum = 0;
      const puntos = scored.map(({ idx }) => {
        cum += puntosDe.get(`${j.id}:${idx}`) ?? 0;
        return cum;
      });
      return { id: j.id, nombre: j.nombre, puntos };
    });

    // Desglose por pregunta. Solo se expone cuando el juego terminó, para no
    // filtrar las respuestas correctas mientras la competencia sigue en curso.
    const preguntas = !finalizado
      ? []
      : scored.map(({ p, idx }, i) => {
          const rs = porIdx.get(idx) ?? [];
          const respondieron = rs.length;
          const aciertos = rs.filter((r) => aciertoActual(p, r.respuesta)).length;

          let opciones:
            | { id: string; texto: string; n: number; correcta: boolean }[]
            | null = null;
          if (p.tipo === "opcion" || p.tipo === "multiple") {
            const conteo: Record<string, number> = {};
            for (const o of p.opciones ?? []) conteo[o.id] = 0;
            for (const r of rs) {
              const v = r.respuesta as {
                opcion?: string;
                opciones?: string[];
              } | null;
              const ids = v?.opciones ?? (v?.opcion ? [v.opcion] : []);
              for (const id of ids) if (id in conteo) conteo[id]++;
            }
            opciones = (p.opciones ?? []).map((o) => ({
              id: o.id,
              texto: o.texto,
              n: conteo[o.id] ?? 0,
              correcta: (p.correctas ?? []).includes(o.id),
            }));
          }

          let correctaTexto: string | null = null;
          if (p.tipo === "opcion" || p.tipo === "multiple")
            correctaTexto = (p.opciones ?? [])
              .filter((o) => (p.correctas ?? []).includes(o.id))
              .map((o) => o.texto)
              .join(", ");
          else if (p.tipo === "slider")
            correctaTexto = `${p.correcto}${p.unidad ? " " + p.unidad : ""}`;
          else if (p.tipo === "texto")
            correctaTexto = (p.aceptadas ?? []).join(" / ");

          const rapidos = rs
            .filter((r) => aciertoActual(p, r.respuesta))
            .sort((a, b) => a.ms - b.ms);
          const masRapido = rapidos[0]
            ? {
                nombre: nombres[rapidos[0].jugador_id] ?? "Anónimo",
                ms: rapidos[0].ms,
              }
            : null;

          return {
            numero: i + 1,
            enunciado: p.enunciado,
            tipo: p.tipo,
            respondieron,
            aciertos,
            pct: respondieron
              ? Math.round((aciertos / respondieron) * 100)
              : 0,
            opciones,
            correctaTexto,
            mas_rapido: masRapido,
          };
        });

    return NextResponse.json({
      finalizado,
      estado: juego.estado,
      nombre: juego.nombre,
      jugadores_total: jugadores.length,
      ranking,
      progresion: { etiquetas, series },
      preguntas,
      nombres,
    });
  } catch {
    return NextResponse.json(VACIO);
  }
}
