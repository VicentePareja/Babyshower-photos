"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePulso } from "@/lib/trivia/usePulso";
import type { EstadoJuego } from "@/lib/trivia/tipos";

interface Fila {
  id: string;
  nombre: string;
  puntaje: number;
  puesto: number;
}
interface RankingResp {
  estado: EstadoJuego;
  total: number;
  top: Fila[];
}

const MEDALLAS = ["🥇", "🥈", "🥉"];
const ALTURA: Record<number, string> = {
  1: "h-24 sm:h-28",
  2: "h-16 sm:h-20",
  3: "h-12 sm:h-14",
};

export function ResultadosTrivia() {
  const [data, setData] = useState<RankingResp | null>(null);
  // refresco más espaciado: la landing no necesita el pulso tan fino
  const tick = usePulso(15000);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/trivia/ranking", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {
      // sin conexión: conservamos lo último
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar, tick]);

  // Sin jugadores con puntaje => no mostramos nada (antes/durante el lobby).
  if (!data || data.top.length === 0) return null;

  const finalizado = data.estado === "podio";
  const top3 = data.top.slice(0, 3);
  const resto = data.top.slice(3, 6);
  // orden visual del podio: 2º, 1º, 3º
  const ordenPodio = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <section className="anima-aparece mt-6 rounded-3xl bg-crema p-5 shadow-hoja">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold text-bosque">
          {finalizado
            ? "🏆 Resultados de la Competencia"
            : "🌿 Competencia en vivo"}
        </h2>
        {!finalizado && (
          <span className="rounded-full bg-musgo/15 px-3 py-1 text-xs font-bold text-pino">
            en curso
          </span>
        )}
      </div>

      {/* Mini podio del top 3 */}
      <div className="flex items-end justify-center gap-2 sm:gap-4">
        {ordenPodio.map((r) => (
          <div key={r.id} className="flex w-1/3 max-w-32 flex-col items-center">
            <span className="text-2xl">{MEDALLAS[r.puesto - 1]}</span>
            <span className="mb-1 max-w-full truncate text-center text-sm font-bold text-bosque">
              {r.nombre}
            </span>
            <div
              className={`${ALTURA[r.puesto] ?? "h-12"} flex w-full items-start justify-center rounded-t-2xl bg-gradient-to-b from-musgo to-pino pt-2`}
            >
              <span className="font-display text-sm font-extrabold text-pergamino">
                #{r.puesto}
              </span>
            </div>
            <span className="mt-1 text-xs font-bold text-madera tabular-nums">
              {r.puntaje} pts
            </span>
          </div>
        ))}
      </div>

      {/* Puestos 4–6 */}
      {resto.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {resto.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-xl bg-pergamino px-3 py-2 text-sm"
            >
              <span className="w-5 font-extrabold text-pino tabular-nums">
                {r.puesto}
              </span>
              <span className="flex-1 truncate font-bold text-bosque">
                {r.nombre}
              </span>
              <span className="font-extrabold text-madera tabular-nums">
                {r.puntaje}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={finalizado ? "/trivia/host" : "/trivia"}
        className="mt-4 block text-center text-sm font-bold text-pino underline"
      >
        {finalizado ? "Ver el podio completo" : "Unirme a jugar 🍄"}
      </Link>
    </section>
  );
}
