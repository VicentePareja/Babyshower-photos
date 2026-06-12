import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { ResultadoOraculo } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OCULTO: ResultadoOraculo = {
  publicado: false,
  ojos: null,
  peso_gramos: null,
  fecha_real: null,
};

// Resultado real del oráculo, visible para todos SOLO cuando el admin
// lo publica. Se lee con service role para que la tabla no necesite
// políticas públicas (así nadie puede espiarlo antes de tiempo).
export async function GET() {
  try {
    const { data } = await getSupabaseAdmin()
      .from("quiniela_resultado")
      .select("publicado, ojos, peso_gramos, fecha_real")
      .eq("id", 1)
      .maybeSingle();
    if (!data?.publicado) return NextResponse.json(OCULTO);
    return NextResponse.json(data);
  } catch {
    // tabla aún no creada u otro error: comportarse como "sin resultado"
    return NextResponse.json(OCULTO);
  }
}
