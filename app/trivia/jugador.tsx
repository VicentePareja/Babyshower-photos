"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Brote, Luciernagas } from "@/components/ilustraciones";
import { figuraDe, IconoFigura } from "@/components/trivia/figuras";
import { usePulso } from "@/lib/trivia/usePulso";
import { sonidos } from "@/lib/trivia/sonido";
import type {
  EstadoJuego,
  FilaRanking,
  PreguntaPublica,
  Respuesta,
} from "@/lib/trivia/tipos";

interface EstadoResp {
  estado: EstadoJuego;
  nombre: string;
  descripcion: string;
  pin: string;
  numero: number;
  total_activas: number;
  hay_mas: boolean;
  pregunta: PreguntaPublica | null;
  pregunta_idx: number;
  pregunta_inicio: string | null;
  resto_ms: number | null;
  timer: number;
  server_now: string;
  jugador: {
    id: string;
    nombre: string;
    puntaje: number;
    racha: number;
    mejor_racha: number;
    puesto: number;
    expulsado: boolean;
  } | null;
  ya_respondio: boolean;
  mi_resultado: {
    correcto: boolean;
    fraccion: number;
    puntos: number;
    ms: number;
  } | null;
  solucion: {
    correctas: string[] | null;
    correcto: number | null;
    aceptadas: string[] | null;
  } | null;
  ranking: FilaRanking[] | null;
}

const LS_ID = "trivia_jugador_id";
const LS_PIN = "trivia_pin";

export function Jugador({ pinInicial }: { pinInicial: string }) {
  const [fase, setFase] = useState<"cargando" | "unir" | "juego">("cargando");
  const [jugadorId, setJugadorId] = useState<string | null>(null);
  const [pin, setPin] = useState(pinInicial);
  const [estado, setEstado] = useState<EstadoResp | null>(null);
  const offsetRef = useRef(0); // server_now - client_now
  const tick = usePulso();

  // Carga/refresca el estado sanitizado del servidor.
  const cargar = useCallback(
    async (id: string | null, elPin: string) => {
      const q = new URLSearchParams();
      if (elPin) q.set("pin", elPin);
      if (id) q.set("jugador_id", id);
      const res = await fetch(`/api/trivia/estado?${q.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = (await res.json()) as EstadoResp;
      offsetRef.current = Date.parse(data.server_now) - Date.now();
      return data;
    },
    []
  );

  // Inicialización: restaura sesión guardada.
  useEffect(() => {
    const id = localStorage.getItem(LS_ID);
    const savedPin = localStorage.getItem(LS_PIN);
    const elPin = pinInicial || savedPin || "";
    if (elPin) setPin(elPin);
    (async () => {
      if (id && elPin) {
        const data = await cargar(id, elPin);
        if (data?.jugador && !data.jugador.expulsado) {
          setJugadorId(id);
          setEstado(data);
          setFase("juego");
          return;
        }
      }
      setFase("unir");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch ante cada cambio de pulso (realtime + respaldo).
  useEffect(() => {
    if (fase !== "juego" || !jugadorId) return;
    cargar(jugadorId, pin).then((d) => d && setEstado(d));
  }, [tick, fase, jugadorId, pin, cargar]);

  async function unir(nombre: string) {
    const id = localStorage.getItem(LS_ID);
    const res = await fetch("/api/trivia/unirse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, nombre, jugador_id: id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "No se pudo entrar");
    localStorage.setItem(LS_ID, data.id);
    localStorage.setItem(LS_PIN, pin);
    setJugadorId(data.id);
    const est = await cargar(data.id, pin);
    if (est) setEstado(est);
    setFase("juego");
  }

  if (fase === "cargando") return <Centro>Cargando el bosque…</Centro>;

  if (fase === "unir")
    return (
      <FormUnir
        pin={pin}
        setPin={setPin}
        onUnir={unir}
        bloqueadoPin={!!pinInicial}
      />
    );

  if (!estado) return <Centro>Cargando…</Centro>;
  if (estado.jugador?.expulsado)
    return (
      <Centro>
        Te retiraron de la sala. Si fue un error, vuelve a entrar con el PIN.
      </Centro>
    );

  return (
    <Juego
      estado={estado}
      pin={pin}
      jugadorId={jugadorId!}
      offsetRef={offsetRef}
      onRefetch={() => cargar(jugadorId, pin).then((d) => d && setEstado(d))}
    />
  );
}

// ---------------------------------------------------------------------------

function FormUnir({
  pin,
  setPin,
  onUnir,
  bloqueadoPin,
}: {
  pin: string;
  setPin: (v: string) => void;
  onUnir: (nombre: string) => Promise<void>;
  bloqueadoPin: boolean;
}) {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await onUnir(nombre.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80dvh] max-w-sm flex-col justify-center px-5">
      <div className="anima-aparece text-center">
        <Luciernagas className="mx-auto h-8 w-40" />
        <h1 className="font-display text-3xl font-bold text-bosque">
          Competencia del Baby Shower
        </h1>
        <p className="mt-2 text-pino">Entra a jugar con tu nombre 🍄</p>
      </div>
      <form
        onSubmit={submit}
        className="anima-aparece mt-6 space-y-4 rounded-3xl bg-crema p-6 shadow-hoja"
      >
        {!bloqueadoPin && (
          <div className="space-y-2">
            <label className="block text-sm font-bold text-pino">
              PIN de la sala
            </label>
            <input
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              required
              className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-4 py-3 text-center text-2xl font-bold tracking-widest text-bosque outline-none focus:border-musgo"
              placeholder="1234"
            />
          </div>
        )}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-pino">
            Tu nombre o apodo
          </label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            maxLength={24}
            autoFocus
            className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-4 py-3 text-lg text-bosque outline-none focus:border-musgo"
            placeholder="Ej: Tía Pati"
          />
        </div>
        {error && (
          <p className="rounded-xl bg-amanita/10 px-4 py-2 text-sm font-semibold text-amanita">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={cargando}
          className="btn-amanita w-full rounded-full px-6 py-4 text-lg font-bold text-white disabled:opacity-60"
        >
          {cargando ? "Entrando…" : "¡Entrar al bosque!"}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Juego({
  estado,
  pin,
  jugadorId,
  offsetRef,
  onRefetch,
}: {
  estado: EstadoResp;
  pin: string;
  jugadorId: string;
  offsetRef: React.RefObject<number>;
  onRefetch: () => void;
}) {
  const { estado: fase, pregunta } = estado;

  // Resetea la respuesta local cuando cambia la pregunta.
  const [enviado, setEnviado] = useState(estado.ya_respondio);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [texto, setTexto] = useState("");
  const [slider, setSlider] = useState<number | null>(null);
  const idxAnterior = useRef(estado.pregunta_idx);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  useEffect(() => {
    if (idxAnterior.current !== estado.pregunta_idx) {
      idxAnterior.current = estado.pregunta_idx;
      setEnviado(estado.ya_respondio);
      setSeleccion([]);
      setTexto("");
      setSlider(null);
      setErrorEnvio(null);
    } else if (estado.ya_respondio) {
      setEnviado(true);
    }
  }, [estado.pregunta_idx, estado.ya_respondio]);

  // Cronómetro local sincronizado con el reloj del servidor.
  const restante = useTimerRestante(
    fase === "pregunta" ? estado.pregunta_inicio : null,
    estado.timer,
    offsetRef
  );
  const tiempoFuera = fase === "pregunta" && restante <= 0;

  async function enviar(respuesta: Respuesta) {
    if (enviado || enviando || tiempoFuera) return;
    setEnviando(true);
    setErrorEnvio(null);
    sonidos.click();
    try {
      const res = await fetch("/api/trivia/responder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          jugador_id: jugadorId,
          pregunta_idx: estado.pregunta_idx,
          respuesta,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo enviar");
      setEnviado(true);
      onRefetch();
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : "Error");
    } finally {
      setEnviando(false);
    }
  }

  // ---- Pantallas por estado ----
  if (fase === "cerrado")
    return <Centro>El juego aún no comienza. ¡Quédate atento! 🌙</Centro>;

  if (fase === "lobby")
    return (
      <Centro>
        <Luciernagas className="mx-auto mb-3 h-8 w-40" />
        <p className="font-display text-2xl font-bold text-bosque">
          ¡Estás dentro, {estado.jugador?.nombre}! 🎉
        </p>
        <p className="mt-2 text-pino">
          Espera a que los papás inicien la competencia…
        </p>
      </Centro>
    );

  if (fase === "pausa")
    return <Centro>⏸️ Juego en pausa. Ya volvemos…</Centro>;

  if (fase === "podio")
    return <PodioJugador estado={estado} />;

  if (fase === "revelado")
    return <Revelado estado={estado} />;

  // fase === "pregunta"
  if (!pregunta) return <Centro>Preparando la pregunta…</Centro>;
  if (pregunta.tipo === "bienvenida")
    return (
      <Centro>
        <h1 className="font-display text-3xl font-bold text-bosque">
          {pregunta.enunciado}
        </h1>
        {pregunta.subtitulo && (
          <p className="mt-3 text-pino">{pregunta.subtitulo}</p>
        )}
        <p className="mt-6 animate-pulse font-bold text-madera">
          ¡Prepárate! 🍄
        </p>
      </Centro>
    );

  if (enviado || tiempoFuera)
    return (
      <PantallaEspera
        restante={restante}
        timer={estado.timer}
        enviado={enviado}
      />
    );

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-4">
      <CabeceraPregunta estado={estado} restante={restante} />
      <h2 className="anima-aparece mt-3 font-display text-2xl font-bold leading-tight text-bosque">
        {pregunta.enunciado}
      </h2>
      {pregunta.subtitulo && (
        <p className="mt-1 text-sm font-semibold text-madera">
          {pregunta.subtitulo}
        </p>
      )}

      {errorEnvio && (
        <p className="mt-3 rounded-xl bg-amanita/10 px-4 py-2 text-sm font-semibold text-amanita">
          {errorEnvio}
        </p>
      )}

      <div className="mt-4 pb-10">
        {(pregunta.tipo === "opcion" || pregunta.tipo === "multiple") && (
          <Opciones
            pregunta={pregunta}
            multiple={pregunta.tipo === "multiple"}
            seleccion={seleccion}
            setSeleccion={setSeleccion}
            disabled={enviando}
            onEnviarSingle={(id) =>
              enviar({ tipo: "opcion", opcion: id })
            }
          />
        )}
        {pregunta.tipo === "multiple" && (
          <BotonEnviar
            disabled={seleccion.length === 0 || enviando}
            onClick={() => enviar({ tipo: "multiple", opciones: seleccion })}
          />
        )}
        {pregunta.tipo === "slider" && (
          <SliderInput
            pregunta={pregunta}
            valor={slider}
            setValor={setSlider}
            disabled={enviando}
            onEnviar={(v) => enviar({ tipo: "slider", valor: v })}
          />
        )}
        {pregunta.tipo === "texto" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (texto.trim()) enviar({ tipo: "texto", texto: texto.trim() });
            }}
            className="space-y-3"
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              autoFocus
              maxLength={60}
              className="w-full rounded-2xl border-2 border-salvia/60 bg-crema px-4 py-4 text-center text-xl font-bold text-bosque outline-none focus:border-musgo"
              placeholder="Escribe aquí…"
            />
            <BotonEnviar disabled={!texto.trim() || enviando} />
          </form>
        )}
      </div>
    </div>
  );
}

// ---- Sub-componentes de juego ----

function CabeceraPregunta({
  estado,
  restante,
}: {
  estado: EstadoResp;
  restante: number;
}) {
  const seg = Math.ceil(restante / 1000);
  const racha = estado.jugador?.racha ?? 0;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="rounded-full bg-pino/10 px-3 py-1 text-sm font-bold text-pino">
        Pregunta {estado.numero}/{estado.total_activas}
      </span>
      <div className="flex items-center gap-2">
        {racha >= 2 && (
          <span className="racha-pulso rounded-full bg-amber-100 px-2 py-1 text-sm font-extrabold text-amber-700">
            🔥 x{racha}
          </span>
        )}
        <TimerBadge seg={seg} timer={estado.timer} />
      </div>
    </div>
  );
}

function TimerBadge({ seg, timer }: { seg: number; timer: number }) {
  const pct = timer > 0 ? Math.max(0, Math.min(1, seg / timer)) : 0;
  const urgente = seg <= 5;
  return (
    <span
      className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-extrabold ${
        urgente ? "bg-amanita text-white" : "bg-musgo text-white"
      }`}
      style={{
        background: `conic-gradient(${
          urgente ? "#c0392b" : "#4b7a4a"
        } ${pct * 360}deg, #d8d2bc 0deg)`,
      }}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-crema text-bosque">
        {seg}
      </span>
    </span>
  );
}

function Opciones({
  pregunta,
  multiple,
  seleccion,
  setSeleccion,
  disabled,
  onEnviarSingle,
}: {
  pregunta: PreguntaPublica;
  multiple: boolean;
  seleccion: string[];
  setSeleccion: (s: string[]) => void;
  disabled: boolean;
  onEnviarSingle: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {(pregunta.opciones ?? []).map((op, i) => {
        const fig = figuraDe(i);
        const activa = seleccion.includes(op.id);
        return (
          <button
            key={op.id}
            type="button"
            disabled={disabled}
            onClick={() => {
              sonidos.click();
              if (multiple) {
                setSeleccion(
                  activa
                    ? seleccion.filter((x) => x !== op.id)
                    : [...seleccion, op.id]
                );
              } else {
                onEnviarSingle(op.id);
              }
            }}
            className={`flex min-h-20 items-center gap-3 rounded-2xl px-4 py-4 text-left text-lg font-bold text-white shadow-hoja transition-transform active:scale-95 ${
              multiple && activa ? "ring-4 ring-white" : ""
            } ${disabled ? "opacity-60" : ""}`}
            style={{ backgroundColor: fig.color }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <IconoFigura indice={i} className="h-8 w-8 text-white" />
            </span>
            <span>{op.texto}</span>
            {multiple && activa && <span className="ml-auto text-2xl">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

function SliderInput({
  pregunta,
  valor,
  setValor,
  disabled,
  onEnviar,
}: {
  pregunta: PreguntaPublica;
  valor: number | null;
  setValor: (v: number) => void;
  disabled: boolean;
  onEnviar: (v: number) => void;
}) {
  const min = pregunta.min ?? 0;
  const max = pregunta.max ?? 100;
  const v = valor ?? Math.round((min + max) / 2);
  const pct = (v - min) / (max - min);
  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-crema p-6 text-center shadow-hoja">
        <div
          className="flex items-end justify-center"
          style={{ height: `${40 + pct * 90}px`, transition: "height .2s ease" }}
        >
          <Brote className="h-full w-auto" />
        </div>
        <p className="mt-2 font-display text-5xl font-extrabold text-bosque">
          {v}
        </p>
        {pregunta.unidad && (
          <p className="text-sm font-bold text-madera">{pregunta.unidad}</p>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={v}
        disabled={disabled}
        onChange={(e) => setValor(Number(e.target.value))}
        className="h-3 w-full cursor-pointer appearance-none rounded-full bg-salvia accent-musgo"
      />
      <div className="flex justify-between text-xs font-bold text-madera">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <BotonEnviar disabled={disabled} onClick={() => onEnviar(v)} />
    </div>
  );
}

function BotonEnviar({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      disabled={disabled}
      onClick={onClick}
      className="btn-amanita mt-2 w-full rounded-full px-6 py-4 text-lg font-bold text-white disabled:opacity-50"
    >
      Enviar respuesta
    </button>
  );
}

function PantallaEspera({
  restante,
  timer,
  enviado,
}: {
  restante: number;
  timer: number;
  enviado: boolean;
}) {
  return (
    <Centro>
      <div className="anima-entra-pop">
        <Luciernagas className="mx-auto mb-3 h-8 w-44" />
        <p className="font-display text-2xl font-bold text-bosque">
          {enviado ? "¡Respuesta enviada! 🍄" : "Se acabó tu tiempo ⏳"}
        </p>
        <p className="mt-2 text-pino">
          Espera a que se revelen los resultados…
        </p>
        {restante > 0 && (
          <p className="mt-4 text-sm font-bold text-madera">
            Quedan {Math.ceil(restante / 1000)}s para el resto
          </p>
        )}
        <div className="mx-auto mt-4 h-2 w-40 overflow-hidden rounded-full bg-salvia/40">
          <div
            className="h-full bg-musgo transition-all"
            style={{ width: `${timer > 0 ? (restante / (timer * 1000)) * 100 : 0}%` }}
          />
        </div>
      </div>
    </Centro>
  );
}

function Revelado({ estado }: { estado: EstadoResp }) {
  const mi = estado.mi_resultado;
  const correcto = mi?.correcto;
  const parcial = mi && !mi.correcto && mi.puntos > 0;
  useEffect(() => {
    if (correcto) sonidos.ding();
    else if (mi) sonidos.error();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.pregunta_idx]);

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-6">
      <div
        className={`anima-entra-pop rounded-3xl p-6 text-center text-white shadow-hoja-lg ${
          correcto ? "bg-musgo" : parcial ? "bg-amber-600" : "bg-amanita"
        }`}
      >
        <p className="text-5xl">{correcto ? "🎉" : parcial ? "👏" : "🍂"}</p>
        <p className="mt-2 font-display text-3xl font-extrabold">
          {correcto ? "¡Correcto!" : parcial ? "¡Casi!" : "Esta vez no…"}
        </p>
        {mi ? (
          <p className="mt-1 text-xl font-bold">+{mi.puntos} puntos</p>
        ) : (
          <p className="mt-1 text-lg">No alcanzaste a responder</p>
        )}
        {estado.jugador && estado.jugador.racha >= 2 && (
          <p className="mt-1 font-extrabold">🔥 Racha x{estado.jugador.racha}</p>
        )}
      </div>

      {estado.jugador && (
        <div className="mt-4 rounded-2xl bg-crema p-4 text-center shadow-hoja">
          <p className="text-sm font-bold text-madera">Tu posición</p>
          <p className="font-display text-4xl font-extrabold text-bosque">
            #{estado.jugador.puesto}
          </p>
          <p className="text-sm font-bold text-pino">
            {estado.jugador.puntaje} puntos
          </p>
        </div>
      )}

      <MiniRanking ranking={estado.ranking} miId={estado.jugador?.id} />
    </div>
  );
}

function PodioJugador({ estado }: { estado: EstadoResp }) {
  const puesto = estado.jugador?.puesto ?? 0;
  const top3 = puesto >= 1 && puesto <= 3;
  return (
    <div className="mx-auto w-full max-w-md px-4 pt-8 text-center">
      <p className="text-5xl">{top3 ? "🏆" : "🌟"}</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-bosque">
        {top3 ? "¡Quedaste en el podio!" : "¡Gran juego!"}
      </h1>
      {estado.jugador && (
        <p className="mt-2 text-lg font-bold text-pino">
          Puesto #{estado.jugador.puesto} · {estado.jugador.puntaje} puntos
        </p>
      )}
      <MiniRanking ranking={estado.ranking} miId={estado.jugador?.id} />
    </div>
  );
}

function MiniRanking({
  ranking,
  miId,
}: {
  ranking: FilaRanking[] | null;
  miId?: string;
}) {
  if (!ranking?.length) return null;
  const medallas = ["🥇", "🥈", "🥉"];
  return (
    <ul className="mt-5 space-y-2 pb-10">
      {ranking.slice(0, 10).map((r) => (
        <li
          key={r.id}
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-hoja ${
            r.id === miId
              ? "bg-musgo text-white"
              : "bg-crema text-bosque"
          }`}
        >
          <span className="w-7 text-lg font-extrabold">
            {medallas[r.puesto - 1] ?? r.puesto}
          </span>
          <span className="flex-1 truncate font-bold">{r.nombre}</span>
          <span className="font-extrabold">{r.puntaje}</span>
        </li>
      ))}
    </ul>
  );
}

function Centro({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[80dvh] max-w-sm flex-col items-center justify-center px-5 text-center">
      <div className="anima-aparece">{children}</div>
    </div>
  );
}

// Hook de cronómetro: calcula los ms restantes sincronizados con el servidor.
function useTimerRestante(
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
