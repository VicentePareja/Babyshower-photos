import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  DESCRIPCION_JUEGO,
  NOMBRE_JUEGO,
  PREGUNTAS_SEED,
} from "./preguntas";
import {
  CONFIG_DEFAULT,
  type ConfigJuego,
  type EstadoJuego,
  type Pregunta,
  type PreguntaPublica,
} from "./tipos";

export interface JuegoRow {
  id: number;
  nombre: string;
  descripcion: string;
  pin: string;
  estado: EstadoJuego;
  pregunta_idx: number;
  pregunta_inicio: string | null;
  resto_ms: number | null;
  config: ConfigJuego;
  preguntas: Pregunta[];
  actualizado_at: string;
}

// Lee la fila única del juego; si no existe la crea con el seed.
export async function getJuego(
  supabase: SupabaseClient = getSupabaseAdmin()
): Promise<JuegoRow> {
  const { data } = await supabase
    .from("trivia_juego")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (data) {
    return {
      ...data,
      config: { ...CONFIG_DEFAULT, ...(data.config ?? {}) },
      preguntas:
        Array.isArray(data.preguntas) && data.preguntas.length
          ? data.preguntas
          : PREGUNTAS_SEED,
    } as JuegoRow;
  }

  const base = {
    id: 1,
    nombre: NOMBRE_JUEGO,
    descripcion: DESCRIPCION_JUEGO,
    pin: nuevoPin(),
    estado: "cerrado" as EstadoJuego,
    pregunta_idx: -1,
    pregunta_inicio: null,
    resto_ms: null,
    config: CONFIG_DEFAULT,
    preguntas: PREGUNTAS_SEED,
  };
  await supabase.from("trivia_juego").upsert(base);
  await sincronizarPulso(supabase, base as JuegoRow);
  return { ...base, actualizado_at: new Date().toISOString() } as JuegoRow;
}

export function nuevoPin(): string {
  // 4 dígitos, sin ceros a la izquierda problemáticos
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Quita las respuestas correctas antes de enviar al cliente.
export function sanitizarPregunta(p: Pregunta): PreguntaPublica {
  const { correctas, correcto, aceptadas, ...resto } = p;
  void correctas;
  void correcto;
  void aceptadas;
  return resto;
}

export function preguntaActual(juego: JuegoRow): Pregunta | null {
  return juego.preguntas[juego.pregunta_idx] ?? null;
}

// Siguiente índice de pregunta activa después de `desde` (-1 = empezar).
export function siguienteIndiceActivo(juego: JuegoRow, desde: number): number {
  for (let i = desde + 1; i < juego.preguntas.length; i++) {
    if (juego.preguntas[i]?.activa) return i;
  }
  return -1; // no hay más
}

// Refleja el estado live (sin secretos) en la tabla pública que escucha
// el cliente vía Supabase Realtime. Bumpea `version` para forzar el evento.
export async function sincronizarPulso(
  supabase: SupabaseClient,
  juego: Pick<JuegoRow, "estado" | "pregunta_idx" | "pregunta_inicio">
): Promise<void> {
  const { data } = await supabase
    .from("trivia_pulso")
    .select("version")
    .eq("id", 1)
    .maybeSingle();
  const version = (data?.version ?? 0) + 1;
  await supabase.from("trivia_pulso").upsert({
    id: 1,
    estado: juego.estado,
    pregunta_idx: juego.pregunta_idx,
    pregunta_inicio: juego.pregunta_inicio,
    version,
    actualizado_at: new Date().toISOString(),
  });
}

export interface FilaRankingServer {
  id: string;
  nombre: string;
  puntaje: number;
  racha: number;
  puesto: number;
}

export async function calcularRanking(
  supabase: SupabaseClient,
  limite = 100
): Promise<FilaRankingServer[]> {
  const { data } = await supabase
    .from("trivia_jugadores")
    .select("id, nombre, puntaje, racha")
    .eq("expulsado", false)
    .order("puntaje", { ascending: false })
    .order("creado_at", { ascending: true })
    .limit(limite);
  return (data ?? []).map((j, i) => ({ ...j, puesto: i + 1 }));
}
