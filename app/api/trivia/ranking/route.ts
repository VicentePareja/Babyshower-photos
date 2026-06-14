import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { calcularRanking, getJuego } from "@/lib/trivia/servidor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ranking público y liviano para la mini-visualización de la landing.
// No expone respuestas ni la lista completa de jugadores: solo el top.
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const juego = await getJuego(supabase);
    const ranking = await calcularRanking(supabase, 10);
    return NextResponse.json({
      estado: juego.estado,
      nombre: juego.nombre,
      total: ranking.length,
      top: ranking.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        puntaje: r.puntaje,
        puesto: r.puesto,
      })),
    });
  } catch {
    // Sin tablas aún u otro error: sin resultados.
    return NextResponse.json({ estado: "cerrado", total: 0, top: [] });
  }
}
