"use client";

import { useCallback, useEffect, useState } from "react";
import { usePulso } from "@/lib/trivia/usePulso";

interface Fila {
  id: string;
  nombre: string;
  puntaje: number;
  mejor_racha: number;
  puesto: number;
}
interface Serie {
  id: string;
  nombre: string;
  puntos: number[];
}
interface OpcionStat {
  id: string;
  texto: string;
  n: number;
  correcta: boolean | null;
}
interface PreguntaStat {
  numero: number;
  enunciado: string;
  tipo: string;
  respondieron: number;
  aciertos: number;
  pct: number;
  opciones: OpcionStat[] | null;
  correctaTexto: string | null;
  mas_rapido: { nombre: string; ms: number } | null;
}
interface ResultadosResp {
  finalizado: boolean;
  estado: string;
  nombre: string;
  jugadores_total: number;
  ranking: Fila[];
  progresion: { etiquetas: string[]; series: Serie[] };
  preguntas: PreguntaStat[];
}

const COLORES = ["#c0392b", "#2f5d3a", "#d8a23a", "#7a5230", "#4b7a4a", "#1f3d2b"];
const MEDALLAS = ["🥇", "🥈", "🥉"];
const ALTURA: Record<number, string> = {
  1: "h-28 sm:h-32",
  2: "h-20 sm:h-24",
  3: "h-14 sm:h-16",
};

export function Resultados() {
  const [data, setData] = useState<ResultadosResp | null>(null);
  const [cargando, setCargando] = useState(true);
  const tick = usePulso(15000);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/trivia/resultados", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {
      // conserva lo último
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar, tick]);

  if (cargando)
    return (
      <p className="animate-pulse rounded-3xl bg-crema/70 p-8 text-center font-semibold text-madera">
        Cargando resultados…
      </p>
    );

  if (!data || data.ranking.length === 0)
    return (
      <div className="rounded-3xl bg-crema p-8 text-center shadow-hoja">
        <p className="text-5xl">🍄</p>
        <p className="mt-3 font-display text-xl font-bold text-bosque">
          Aún no hay resultados
        </p>
        <p className="mt-1 text-madera">
          Cuando se juegue la competencia, el ranking aparecerá aquí.
        </p>
      </div>
    );

  const top3 = data.ranking.slice(0, 3);
  const ordenPodio = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="space-y-8">
      {!data.finalizado && (
        <p className="rounded-2xl bg-musgo/15 px-4 py-3 text-center text-sm font-semibold text-pino">
          La competencia sigue en curso 🌿 — las respuestas correctas se
          mostrarán cuando termine.
        </p>
      )}

      {/* Podio */}
      <section>
        <h2 className="mb-4 font-display text-2xl font-bold text-bosque">
          🏆 Podio
        </h2>
        <div className="flex items-end justify-center gap-3 sm:gap-6">
          {ordenPodio.map((r) => (
            <div
              key={r.id}
              className="flex w-1/3 max-w-40 flex-col items-center"
            >
              <span className="text-3xl">{MEDALLAS[r.puesto - 1]}</span>
              <span className="mb-1 max-w-full truncate text-center text-base font-bold text-bosque">
                {r.nombre}
              </span>
              <div
                className={`${ALTURA[r.puesto] ?? "h-14"} flex w-full items-start justify-center rounded-t-2xl bg-gradient-to-b from-musgo to-pino pt-2 shadow-hoja`}
              >
                <span className="font-display text-lg font-extrabold text-pergamino">
                  #{r.puesto}
                </span>
              </div>
              <span className="mt-1 text-sm font-bold text-madera tabular-nums">
                {r.puntaje} pts
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Gráfico de progresión */}
      {data.progresion.series.length > 0 &&
        data.progresion.etiquetas.length > 1 && (
          <section>
            <h2 className="mb-1 font-display text-2xl font-bold text-bosque">
              📈 Quién iba ganando
            </h2>
            <p className="mb-3 text-sm text-madera">
              Puntaje acumulado turno a turno (top {data.progresion.series.length}).
            </p>
            <GraficoProgresion progresion={data.progresion} />
          </section>
        )}

      {/* Ranking completo */}
      <section>
        <h2 className="mb-4 font-display text-2xl font-bold text-bosque">
          Ranking completo ({data.ranking.length})
        </h2>
        <ul className="space-y-2">
          {data.ranking.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-2xl bg-crema px-4 py-3 shadow-hoja"
            >
              <span className="w-7 text-center text-lg font-extrabold text-pino tabular-nums">
                {MEDALLAS[r.puesto - 1] ?? r.puesto}
              </span>
              <span className="flex-1 truncate font-bold text-bosque">
                {r.nombre}
              </span>
              {r.mejor_racha >= 2 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                  🔥 x{r.mejor_racha}
                </span>
              )}
              <span className="font-extrabold text-madera tabular-nums">
                {r.puntaje}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Desglose por pregunta */}
      {data.preguntas.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold text-bosque">
            Pregunta por pregunta
          </h2>
          <div className="space-y-3">
            {data.preguntas.map((p) => (
              <PreguntaCard key={p.numero} p={p} finalizado={data.finalizado} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GraficoProgresion({
  progresion,
}: {
  progresion: { etiquetas: string[]; series: Serie[] };
}) {
  const { etiquetas, series } = progresion;
  const W = 360;
  const H = 220;
  const padL = 6;
  const padR = 6;
  const padT = 10;
  const padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = etiquetas.length;

  const maxCum = Math.max(
    1,
    ...series.flatMap((s) => s.puntos)
  );
  const xDe = (i: number) => padL + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const yDe = (v: number) => padT + (1 - v / maxCum) * plotH;

  return (
    <div className="rounded-3xl bg-crema p-4 shadow-hoja">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Gráfico de puntaje acumulado por pregunta"
      >
        {/* líneas guía horizontales */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={padL}
            x2={W - padR}
            y1={padT + f * plotH}
            y2={padT + f * plotH}
            stroke="#e4dec8"
            strokeWidth="1"
          />
        ))}
        {/* series */}
        {series.map((s, idx) => {
          const color = COLORES[idx % COLORES.length];
          const puntos = s.puntos
            .map((v, i) => `${xDe(i)},${yDe(v)}`)
            .join(" ");
          return (
            <g key={s.id}>
              <polyline
                points={puntos}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* punto final */}
              <circle
                cx={xDe(s.puntos.length - 1)}
                cy={yDe(s.puntos[s.puntos.length - 1])}
                r="3.5"
                fill={color}
              />
            </g>
          );
        })}
        {/* etiquetas X (esparcidas si son muchas) */}
        {etiquetas.map((et, i) => {
          const paso = Math.ceil(n / 8);
          if (i % paso !== 0 && i !== n - 1) return null;
          return (
            <text
              key={et}
              x={xDe(i)}
              y={H - 6}
              textAnchor="middle"
              fontSize="9"
              fill="#7a5230"
            >
              {et}
            </text>
          );
        })}
      </svg>
      {/* leyenda */}
      <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {series.map((s, idx) => (
          <li key={s.id} className="flex items-center gap-1.5 text-sm">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: COLORES[idx % COLORES.length] }}
            />
            <span className="font-bold text-bosque">{s.nombre}</span>
            <span className="text-madera tabular-nums">
              {s.puntos[s.puntos.length - 1]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreguntaCard({
  p,
  finalizado,
}: {
  p: PreguntaStat;
  finalizado: boolean;
}) {
  const totalResp = p.respondieron || 1;
  return (
    <div className="rounded-2xl bg-crema p-4 shadow-hoja">
      <div className="flex items-start gap-2">
        <span className="font-display font-extrabold text-pino">
          {p.numero}.
        </span>
        <div className="flex-1">
          <p className="font-bold text-bosque">{p.enunciado}</p>
          {finalizado && p.correctaTexto && (
            <p className="mt-1 text-sm font-bold text-musgo">
              ✓ {p.correctaTexto}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-musgo/15 px-2.5 py-1 text-xs font-bold text-pino">
          {p.pct}% acertó
        </span>
      </div>

      {/* distribución de opciones */}
      {p.opciones && (
        <ul className="mt-3 space-y-1.5">
          {p.opciones.map((o) => {
            const pct = Math.round((o.n / totalResp) * 100);
            const esCorrecta = o.correcta === true;
            return (
              <li key={o.id}>
                <div className="mb-0.5 flex items-center justify-between text-sm">
                  <span
                    className={`font-semibold ${
                      esCorrecta ? "text-musgo" : "text-bosque"
                    }`}
                  >
                    {esCorrecta && "✓ "}
                    {o.texto}
                  </span>
                  <span className="text-madera tabular-nums">
                    {o.n} ({pct}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-pergamino">
                  <div
                    className={`h-full ${esCorrecta ? "bg-musgo" : "bg-salvia"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-madera">
        <span>{p.respondieron} respondieron</span>
        {p.mas_rapido && (
          <span>
            ⚡ Más rápido: {p.mas_rapido.nombre} (
            {(p.mas_rapido.ms / 1000).toFixed(1)}s)
          </span>
        )}
      </div>
    </div>
  );
}
