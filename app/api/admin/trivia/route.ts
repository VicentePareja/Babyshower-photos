import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getJuego } from "@/lib/trivia/servidor";
import {
  DESCRIPCION_JUEGO,
  NOMBRE_JUEGO,
  PREGUNTAS_SEED,
} from "@/lib/trivia/preguntas";
import { CONFIG_DEFAULT, type ConfigJuego, type Pregunta } from "@/lib/trivia/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Config + preguntas completas (con respuestas) para el editor del panel.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const juego = await getJuego();
  return NextResponse.json({
    nombre: juego.nombre,
    descripcion: juego.descripcion,
    pin: juego.pin,
    estado: juego.estado,
    config: juego.config,
    preguntas: juego.preguntas,
  });
}

// Guarda nombre/descripcion/config/preguntas. No cambia el estado en vivo.
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

  const update: Record<string, unknown> = {
    actualizado_at: new Date().toISOString(),
  };

  // Re-sembrar: restaura las 15 preguntas oficiales (y nombre/descripción) desde
  // el código. Útil para empujar correcciones a una partida ya creada en la BD.
  if (body.reseed === true) {
    await getJuego();
    const { error } = await getSupabaseAdmin()
      .from("trivia_juego")
      .update({
        preguntas: PREGUNTAS_SEED,
        nombre: NOMBRE_JUEGO,
        descripcion: DESCRIPCION_JUEGO,
        actualizado_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, reseed: true });
  }

  if (typeof body.nombre === "string") update.nombre = body.nombre.slice(0, 120);
  if (typeof body.descripcion === "string")
    update.descripcion = body.descripcion.slice(0, 500);
  if (typeof body.pin === "string" && /^\d{4,6}$/.test(body.pin))
    update.pin = body.pin;

  if (body.config && typeof body.config === "object") {
    const c = body.config as Partial<ConfigJuego>;
    update.config = {
      ...CONFIG_DEFAULT,
      ...c,
      // saneamos números clave
      timerDefault: clamp(num(c.timerDefault, 20), 3, 120),
      puntajeBase: clamp(num(c.puntajeBase, 1000), 0, 100000),
      sliderToleranciaPct: clamp(num(c.sliderToleranciaPct, 0.5), 0.05, 1),
    } satisfies ConfigJuego;
  }

  if (Array.isArray(body.preguntas)) {
    const errores = validarPreguntas(body.preguntas as unknown[]);
    if (errores) {
      return NextResponse.json({ error: errores }, { status: 400 });
    }
    update.preguntas = body.preguntas;
  }

  // Garantiza que la fila exista antes de actualizar.
  await getJuego();
  const { error } = await getSupabaseAdmin()
    .from("trivia_juego")
    .update(update)
    .eq("id", 1);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

function num(v: unknown, def: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : def;
}
function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

// Validación ligera de la estructura de preguntas.
function validarPreguntas(preguntas: unknown[]): string | null {
  const ids = new Set<string>();
  for (const [i, raw] of preguntas.entries()) {
    const p = raw as Partial<Pregunta>;
    if (!p || typeof p.id !== "string" || !p.id)
      return `Pregunta ${i + 1}: falta id.`;
    if (ids.has(p.id)) return `Pregunta ${i + 1}: id duplicado "${p.id}".`;
    ids.add(p.id);
    if (typeof p.enunciado !== "string" || !p.enunciado.trim())
      return `Pregunta ${i + 1}: falta enunciado.`;
    const tipos = ["bienvenida", "opcion", "multiple", "slider", "texto"];
    if (!tipos.includes(p.tipo as string))
      return `Pregunta ${i + 1}: tipo inválido.`;
    if (p.tipo === "opcion" || p.tipo === "multiple") {
      if (!Array.isArray(p.opciones) || p.opciones.length < 2)
        return `Pregunta ${i + 1}: necesita al menos 2 opciones.`;
      if (!Array.isArray(p.correctas) || p.correctas.length < 1)
        return `Pregunta ${i + 1}: marca la(s) respuesta(s) correcta(s).`;
    }
    if (p.tipo === "slider") {
      if (
        typeof p.min !== "number" ||
        typeof p.max !== "number" ||
        typeof p.correcto !== "number" ||
        p.min >= p.max
      )
        return `Pregunta ${i + 1}: rango/valor de slider inválido.`;
    }
    if (p.tipo === "texto") {
      if (!Array.isArray(p.aceptadas) || p.aceptadas.length < 1)
        return `Pregunta ${i + 1}: agrega respuestas aceptadas.`;
    }
  }
  return null;
}
