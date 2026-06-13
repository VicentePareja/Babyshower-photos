"use client";

import { useEffect, useState } from "react";
import { setSilencio, silenciado } from "@/lib/trivia/sonido";

// Botón flotante para silenciar/activar los efectos de sonido.
export function ControlSonido({ claro = false }: { claro?: boolean }) {
  const [mute, setMute] = useState(false);
  useEffect(() => setMute(silenciado()), []);

  return (
    <button
      type="button"
      aria-label={mute ? "Activar sonido" : "Silenciar"}
      onClick={() => {
        const nuevo = !mute;
        setMute(nuevo);
        setSilencio(nuevo);
      }}
      className={`fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-hoja transition-transform active:scale-90 ${
        claro ? "bg-crema/90 text-bosque" : "bg-pino text-pergamino"
      }`}
    >
      {mute ? "🔇" : "🔊"}
    </button>
  );
}
