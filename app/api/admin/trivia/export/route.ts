import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getJuego } from "@/lib/trivia/servidor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Exporta resultados de la partida en CSV (ranking) o JSON (todo).
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const formato = req.nextUrl.searchParams.get("formato") ?? "json";
  const supabase = getSupabaseAdmin();
  const juego = await getJuego(supabase);

  const [{ data: jugadores }, { data: respuestas }] = await Promise.all([
    supabase
      .from("trivia_jugadores")
      .select("id, nombre, puntaje, mejor_racha, expulsado, creado_at")
      .order("puntaje", { ascending: false }),
    supabase
      .from("trivia_respuestas")
      .select("jugador_id, pregunta_id, pregunta_idx, correcto, fraccion, puntos, ms"),
  ]);

  const ranking = (jugadores ?? [])
    .filter((j) => !j.expulsado)
    .map((j, i) => ({ puesto: i + 1, ...j }));

  if (formato === "csv") {
    const filas = [
      ["puesto", "nombre", "puntaje", "mejor_racha"],
      ...ranking.map((r) => [
        String(r.puesto),
        r.nombre,
        String(r.puntaje),
        String(r.mejor_racha),
      ]),
    ];
    const csv = filas
      .map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="trivia-ranking.csv"',
      },
    });
  }

  return new NextResponse(
    JSON.stringify(
      {
        juego: {
          nombre: juego.nombre,
          descripcion: juego.descripcion,
          estado: juego.estado,
        },
        preguntas: juego.preguntas.map((p) => ({
          id: p.id,
          enunciado: p.enunciado,
          tipo: p.tipo,
        })),
        ranking,
        respuestas: respuestas ?? [],
        exportado_at: new Date().toISOString(),
      },
      null,
      2
    ),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="trivia-resultados.json"',
      },
    }
  );
}
