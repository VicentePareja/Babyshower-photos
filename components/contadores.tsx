"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

const INTERVALO_MS = 30_000;

// Contadores en vivo de fotos y mensajes (polling suave).
export function Contadores() {
  const [fotos, setFotos] = useState<number | null>(null);
  const [mensajes, setMensajes] = useState<number | null>(null);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const supabase = getSupabase();
        const [f, m] = await Promise.all([
          supabase.from("fotos").select("id", { count: "exact", head: true }),
          supabase.from("mensajes").select("id", { count: "exact", head: true }),
        ]);
        if (!activo) return;
        if (f.count !== null) setFotos(f.count);
        if (m.count !== null) setMensajes(m.count);
      } catch {
        // sin conexión: dejamos el último valor conocido
      }
    }

    cargar();
    const timer = setInterval(cargar, INTERVALO_MS);
    return () => {
      activo = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex justify-center gap-3">
      <Cifra valor={fotos} etiqueta="fotos del bosque" />
      <Cifra valor={mensajes} etiqueta="mensajes con cariño" />
    </div>
  );
}

function Cifra({ valor, etiqueta }: { valor: number | null; etiqueta: string }) {
  return (
    <div className="flex min-w-32 flex-col items-center rounded-2xl bg-crema/80 px-5 py-3 shadow-hoja">
      <span className="font-display text-3xl font-bold text-pino tabular-nums">
        {valor ?? "·"}
      </span>
      <span className="text-xs font-semibold text-madera">{etiqueta}</span>
    </div>
  );
}
