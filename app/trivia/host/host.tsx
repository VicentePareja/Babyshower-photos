"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Luciernagas } from "@/components/ilustraciones";
import { figuraDe, IconoFigura } from "@/components/trivia/figuras";
import { usePulso } from "@/lib/trivia/usePulso";
import type { EstadoJuego, Pregunta } from "@/lib/trivia/tipos";

interface HostResp {
  estado: EstadoJuego;
  nombre: string;
  descripcion: string;
  pin: string;
  pregunta_idx: number;
  numero: number;
  total_activas: number;
  hay_mas: boolean;
  pregunta: Pregunta | null; // con correctas solo si revelado
  pregunta_inicio: string | null;
  resto_ms: number | null;
  timer: number;
  server_now: string;
  jugadores_total: number;
  conectados: number;
  respondieron: number;
  distribucion: Record<string, number> | null;
  jugadores: {
    id: string;
    nombre: string;
    puntaje: number;
    racha: number;
    conectado: boolean;
  }[];
  ranking: { id: string; nombre: string; puntaje: number; puesto: number }[];
}

export function Host() {
  const [data, setData] = useState<HostResp | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [origin, setOrigin] = useState("");
  const offsetRef = useRef(0);
  const tick = usePulso();

  const cargar = useCallback(async () => {
    const res = await fetch("/api/trivia/host", { cache: "no-store" });
    if (!res.ok) return;
    const d = (await res.json()) as HostResp;
    offsetRef.current = Date.parse(d.server_now) - Date.now();
    setData(d);
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/admin/trivia", { cache: "no-store" }).then((r) =>
      setEsAdmin(r.ok)
    );
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar, tick]);

  // Poll de respaldo para los conteos en vivo durante una pregunta.
  useEffect(() => {
    const id = setInterval(cargar, 1500);
    return () => clearInterval(id);
  }, [cargar]);

  if (!data)
    return (
      <Pantalla>
        <p className="text-2xl font-bold text-pergamino">Cargando…</p>
      </Pantalla>
    );

  const url = `${origin}/trivia?pin=${data.pin}`;

  return (
    <Pantalla>
      {esAdmin && <BarraControl data={data} onAccion={cargar} />}

      {(data.estado === "cerrado" || data.estado === "lobby") && (
        <Lobby data={data} url={url} />
      )}

      {data.estado === "pregunta" && (
        <PreguntaHost data={data} offsetRef={offsetRef} />
      )}

      {data.estado === "pausa" && (
        <Centro>
          <p className="font-display text-6xl font-bold text-pergamino">
            ⏸️ En pausa
          </p>
        </Centro>
      )}

      {data.estado === "revelado" && <RevelHost data={data} />}

      {data.estado === "podio" && <Podio data={data} />}
    </Pantalla>
  );
}

// ---------------------------------------------------------------------------

function Lobby({ data, url }: { data: HostResp; url: string }) {
  return (
    <div className="flex min-h-[88vh] flex-col items-center justify-center px-6 text-center">
      <Luciernagas className="mb-4 h-10 w-64 opacity-90" />
      <h1 className="font-display text-4xl font-bold text-pergamino sm:text-6xl">
        {data.nombre}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-salvia">{data.descripcion}</p>

      <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:items-stretch">
        <div className="rounded-3xl bg-crema p-6 shadow-hoja-lg">
          <QRCodeSVG value={url} size={220} fgColor="#1f3d2b" bgColor="#fffdf6" />
        </div>
        <div className="flex flex-col justify-center rounded-3xl bg-pergamino/10 px-8 py-6">
          <p className="text-lg font-bold uppercase tracking-wide text-salvia">
            Entra en
          </p>
          <p className="font-display text-2xl font-bold text-pergamino">
            {url.replace(/^https?:\/\//, "")}
          </p>
          <p className="mt-4 text-lg font-bold uppercase tracking-wide text-salvia">
            PIN
          </p>
          <p className="font-display text-7xl font-extrabold tracking-widest text-amber-300">
            {data.pin}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-2xl font-bold text-pergamino">
          🌿 {data.conectados} jugando
        </p>
        <div className="mt-3 flex max-w-3xl flex-wrap justify-center gap-2">
          {data.jugadores.slice(0, 40).map((j) => (
            <span
              key={j.id}
              className="anima-entra-pop rounded-full bg-musgo/40 px-3 py-1 text-sm font-bold text-pergamino"
            >
              {j.nombre}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreguntaHost({
  data,
  offsetRef,
}: {
  data: HostResp;
  offsetRef: React.RefObject<number>;
}) {
  const restante = useTimerHost(data.pregunta_inicio, data.timer, offsetRef);
  const seg = Math.ceil(restante / 1000);
  const p = data.pregunta;
  if (!p) return null;

  if (p.tipo === "bienvenida")
    return (
      <Centro>
        <h1 className="font-display text-6xl font-bold text-pergamino">
          {p.enunciado}
        </h1>
        {p.subtitulo && (
          <p className="mt-4 text-2xl text-salvia">{p.subtitulo}</p>
        )}
      </Centro>
    );

  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-pergamino/15 px-4 py-2 text-xl font-bold text-pergamino">
          Pregunta {data.numero}/{data.total_activas}
        </span>
        <AnilloTimer seg={seg} timer={data.timer} />
        <span className="rounded-full bg-pergamino/15 px-4 py-2 text-xl font-bold text-pergamino">
          ✅ {data.respondieron}/{data.conectados}
        </span>
      </div>

      <h1 className="mt-6 text-center font-display text-4xl font-bold leading-tight text-pergamino sm:text-5xl">
        {p.enunciado}
      </h1>
      {p.subtitulo && (
        <p className="mt-2 text-center text-xl font-semibold text-amber-300">
          {p.subtitulo}
        </p>
      )}

      {(p.tipo === "opcion" || p.tipo === "multiple") && (
        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          {(p.opciones ?? []).map((op, i) => {
            const fig = figuraDe(i);
            return (
              <div
                key={op.id}
                className="flex items-center gap-4 rounded-2xl px-6 py-5 text-2xl font-bold text-white shadow-hoja"
                style={{ backgroundColor: fig.color }}
              >
                <IconoFigura indice={i} className="h-10 w-10 text-white" />
                <span>{op.texto}</span>
              </div>
            );
          })}
        </div>
      )}

      {p.tipo === "slider" && (
        <p className="mt-10 text-center font-display text-3xl font-bold text-salvia">
          Desliza entre {p.min} y {p.max} {p.unidad ?? ""}
        </p>
      )}
      {p.tipo === "texto" && (
        <p className="mt-10 text-center font-display text-3xl font-bold text-salvia">
          ✍️ Escribe tu respuesta en el celular
        </p>
      )}
    </div>
  );
}

function RevelHost({ data }: { data: HostResp }) {
  const p = data.pregunta;
  const total = data.respondieron || 1;
  return (
    <div className="px-8 py-6">
      <h1 className="text-center font-display text-4xl font-bold text-pergamino">
        {p?.enunciado}
      </h1>

      {p && (p.tipo === "opcion" || p.tipo === "multiple") && (
        <div className="mx-auto mt-6 max-w-3xl space-y-3">
          {(p.opciones ?? []).map((op, i) => {
            const fig = figuraDe(i);
            const correcta = (p.correctas ?? []).includes(op.id);
            const n = data.distribucion?.[op.id] ?? 0;
            const pct = Math.round((n / total) * 100);
            return (
              <div
                key={op.id}
                className={`overflow-hidden rounded-2xl ${
                  correcta ? "ring-4 ring-amber-300" : "opacity-70"
                }`}
              >
                <div
                  className="flex items-center gap-3 px-5 py-4 text-xl font-bold text-white"
                  style={{ backgroundColor: fig.color }}
                >
                  <IconoFigura indice={i} className="h-7 w-7 text-white" />
                  <span>{op.texto}</span>
                  {correcta && <span className="ml-2 text-2xl">✓</span>}
                  <span className="ml-auto">
                    {n} ({pct}%)
                  </span>
                </div>
                <div className="h-2 bg-pergamino/20">
                  <div
                    className="h-full bg-amber-300 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {p?.tipo === "slider" && (
        <p className="mt-6 text-center font-display text-5xl font-extrabold text-amber-300">
          Respuesta: {p.correcto} {p.unidad ?? ""}
        </p>
      )}
      {p?.tipo === "texto" && (
        <p className="mt-6 text-center font-display text-4xl font-extrabold text-amber-300">
          Respuesta: {(p.aceptadas ?? []).join(" / ")}
        </p>
      )}

      <h2 className="mt-10 text-center font-display text-3xl font-bold text-pergamino">
        Ranking
      </h2>
      <RankingLista ranking={data.ranking} />
    </div>
  );
}

function Podio({ data }: { data: HostResp }) {
  const top = data.ranking.slice(0, 3);
  const orden = [top[1], top[0], top[2]].filter(Boolean);
  const alturas = ["h-40", "h-56", "h-32"];
  const medallas = ["🥈", "🥇", "🥉"];
  const posMap = [2, 1, 3];
  return (
    <div className="relative min-h-[88vh] overflow-hidden px-6 py-10">
      {/* hojas cayendo */}
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="hoja-cae pointer-events-none absolute text-2xl"
          style={{
            left: `${(i * 6.3) % 100}%`,
            animationDelay: `${(i % 8) * 0.4}s`,
            top: "-3rem",
          }}
        >
          {["🍃", "🍂", "🌿"][i % 3]}
        </span>
      ))}
      <h1 className="text-center font-display text-5xl font-bold text-amber-300">
        🏆 ¡Ganadores del bosque!
      </h1>
      <div className="mt-12 flex items-end justify-center gap-4">
        {orden.map((r, i) => (
          <div key={r.id} className="flex w-40 flex-col items-center">
            <span className="text-4xl">{medallas[i]}</span>
            <span className="mb-2 max-w-full truncate text-center text-xl font-bold text-pergamino">
              {r.nombre}
            </span>
            <div
              className={`${alturas[i]} flex w-full items-start justify-center rounded-t-2xl bg-gradient-to-b from-musgo to-pino pt-3 shadow-hoja-lg`}
            >
              <span className="font-display text-3xl font-extrabold text-pergamino">
                #{posMap[i]}
              </span>
            </div>
            <span className="mt-2 font-bold text-amber-200">
              {r.puntaje} pts
            </span>
          </div>
        ))}
      </div>

      {data.ranking.length > 3 && (
        <div className="mx-auto mt-10 max-w-xl">
          <RankingLista ranking={data.ranking.slice(3, 10)} />
        </div>
      )}
    </div>
  );
}

function RankingLista({
  ranking,
}: {
  ranking: { id: string; nombre: string; puntaje: number; puesto: number }[];
}) {
  const medallas = ["🥇", "🥈", "🥉"];
  return (
    <ul className="mx-auto mt-4 max-w-2xl space-y-2">
      {ranking.map((r) => (
        <li
          key={r.id}
          className="fila-ranking flex items-center gap-4 rounded-2xl bg-pergamino/10 px-5 py-3 text-pergamino"
        >
          <span className="w-8 text-2xl font-extrabold">
            {medallas[r.puesto - 1] ?? r.puesto}
          </span>
          <span className="flex-1 truncate text-xl font-bold">{r.nombre}</span>
          <span className="text-xl font-extrabold text-amber-300">
            {r.puntaje}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---- Controles (solo si la pestaña tiene sesión de admin) ----

function BarraControl({
  data,
  onAccion,
}: {
  data: HostResp;
  onAccion: () => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  async function accion(a: string) {
    setOcupado(true);
    await fetch("/api/admin/trivia/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: a }),
    });
    await onAccion();
    setOcupado(false);
  }
  const e = data.estado;
  return (
    <div className="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-2 bg-bosque/80 px-3 py-2 backdrop-blur">
      {(e === "cerrado" || e === "podio") && (
        <Btn onClick={() => accion("abrir-lobby")} dis={ocupado}>
          Abrir lobby
        </Btn>
      )}
      {e === "lobby" && (
        <Btn onClick={() => accion("iniciar")} dis={ocupado} primario>
          ▶ Iniciar
        </Btn>
      )}
      {e === "pregunta" && (
        <>
          <Btn onClick={() => accion("revelar")} dis={ocupado} primario>
            Mostrar resultados
          </Btn>
          <Btn onClick={() => accion("pausar")} dis={ocupado}>
            Pausar
          </Btn>
          <Btn onClick={() => accion("saltar")} dis={ocupado}>
            Saltar
          </Btn>
        </>
      )}
      {e === "pausa" && (
        <Btn onClick={() => accion("reanudar")} dis={ocupado} primario>
          Reanudar
        </Btn>
      )}
      {e === "revelado" && (
        <Btn onClick={() => accion("siguiente")} dis={ocupado} primario>
          {data.hay_mas ? "Siguiente →" : "Ver podio 🏆"}
        </Btn>
      )}
      {e !== "cerrado" && (
        <Btn onClick={() => accion("terminar")} dis={ocupado}>
          Terminar
        </Btn>
      )}
    </div>
  );
}

function Btn({
  children,
  onClick,
  dis,
  primario,
}: {
  children: React.ReactNode;
  onClick: () => void;
  dis: boolean;
  primario?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={dis}
      className={`rounded-full px-4 py-2 text-sm font-bold transition-transform active:scale-95 disabled:opacity-50 ${
        primario
          ? "bg-amber-400 text-bosque"
          : "border border-salvia/50 text-pergamino"
      }`}
    >
      {children}
    </button>
  );
}

// ---- helpers visuales ----

function AnilloTimer({ seg, timer }: { seg: number; timer: number }) {
  const pct = timer > 0 ? Math.max(0, Math.min(1, seg / timer)) : 0;
  const urgente = seg <= 5;
  return (
    <span
      className="flex h-20 w-20 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(${
          urgente ? "#f59e0b" : "#8fb996"
        } ${pct * 360}deg, rgba(255,255,255,0.12) 0deg)`,
      }}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-bosque text-3xl font-extrabold text-pergamino">
        {seg}
      </span>
    </span>
  );
}

function Pantalla({ children }: { children: React.ReactNode }) {
  return <div className="bosque-noche min-h-[100dvh] text-pergamino">{children}</div>;
}

function Centro({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      {children}
    </div>
  );
}

function useTimerHost(
  inicioIso: string | null,
  timerSeg: number,
  offsetRef: React.RefObject<number>
): number {
  const [restante, setRestante] = useState(timerSeg * 1000);
  useEffect(() => {
    if (!inicioIso) {
      setRestante(timerSeg * 1000);
      return;
    }
    const inicio = Date.parse(inicioIso);
    const calc = () => {
      const ahora = Date.now() + (offsetRef.current ?? 0);
      const r = Math.max(0, timerSeg * 1000 - (ahora - inicio));
      setRestante(r);
      return r;
    };
    calc();
    const id = setInterval(() => {
      if (calc() <= 0) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, [inicioIso, timerSeg, offsetRef]);
  return restante;
}
