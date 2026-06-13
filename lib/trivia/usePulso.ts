"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

// Escucha el pulso público (trivia_pulso) por Supabase Realtime y devuelve un
// contador que incrementa en cada cambio de estado del juego. El consumidor lo
// usa como dependencia para refetchear el estado sanitizado. Incluye un
// intervalo de respaldo por si el WebSocket se cae (red del evento).
export function usePulso(intervaloRespaldoMs = 5000): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let activo = true;
    const supabase = getSupabase();
    const canal = supabase
      .channel("trivia-pulso")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trivia_pulso" },
        () => {
          if (activo) setTick((t) => t + 1);
        }
      )
      .subscribe();

    const respaldo = setInterval(() => {
      if (activo) setTick((t) => t + 1);
    }, intervaloRespaldoMs);

    return () => {
      activo = false;
      clearInterval(respaldo);
      supabase.removeChannel(canal);
    };
  }, [intervaloRespaldoMs]);

  return tick;
}
