"use client";

import { useCallback, useEffect, useState } from "react";
import { usePulso } from "@/lib/trivia/usePulso";
import {
  CONFIG_DEFAULT,
  type ConfigJuego,
  type EstadoJuego,
  type Pregunta,
  type TipoPregunta,
} from "@/lib/trivia/tipos";

interface ConfigResp {
  nombre: string;
  descripcion: string;
  pin: string;
  estado: EstadoJuego;
  config: ConfigJuego;
  preguntas: Pregunta[];
}

interface VivoResp {
  estado: EstadoJuego;
  pin: string;
  numero: number;
  total_activas: number;
  hay_mas: boolean;
  pregunta: { enunciado?: string } | null;
  respondieron: number;
  conectados: number;
  jugadores_total: number;
  jugadores: {
    id: string;
    nombre: string;
    puntaje: number;
    racha: number;
    conectado: boolean;
  }[];
  ranking: { id: string; nombre: string; puntaje: number; puesto: number }[];
}

type Tab = "vivo" | "preguntas" | "ajustes";

export function TriviaAdmin() {
  const [tab, setTab] = useState<Tab>("vivo");
  const [cfg, setCfg] = useState<ConfigResp | null>(null);
  const [vivo, setVivo] = useState<VivoResp | null>(null);
  const tick = usePulso();

  const cargarCfg = useCallback(async () => {
    const res = await fetch("/api/admin/trivia", { cache: "no-store" });
    if (res.ok) setCfg(await res.json());
  }, []);
  const cargarVivo = useCallback(async () => {
    const res = await fetch("/api/trivia/host", { cache: "no-store" });
    if (res.ok) setVivo(await res.json());
  }, []);

  useEffect(() => {
    cargarCfg();
  }, [cargarCfg]);
  useEffect(() => {
    cargarVivo();
  }, [cargarVivo, tick]);
  useEffect(() => {
    const id = setInterval(cargarVivo, 1500);
    return () => clearInterval(id);
  }, [cargarVivo]);

  return (
    <div className="space-y-5 rounded-3xl bg-pino/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["vivo", "🎮 En vivo"],
            ["preguntas", "📝 Preguntas"],
            ["ajustes", "⚙️ Ajustes"],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              tab === t
                ? "bg-pino text-pergamino"
                : "bg-crema text-pino hover:bg-salvia/30"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <a
            href="/trivia/host"
            target="_blank"
            className="rounded-full border-2 border-pino px-4 py-2 text-sm font-bold text-pino"
          >
            Abrir proyección ↗
          </a>
        </div>
      </div>

      {tab === "vivo" && (
        <EnVivo vivo={vivo} onAccion={cargarVivo} />
      )}
      {tab === "preguntas" && cfg && (
        <EditorPreguntas
          preguntasIniciales={cfg.preguntas}
          configDefault={cfg.config}
          onGuardado={cargarCfg}
        />
      )}
      {tab === "ajustes" && cfg && (
        <Ajustes cfg={cfg} onGuardado={cargarCfg} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function EnVivo({
  vivo,
  onAccion,
}: {
  vivo: VivoResp | null;
  onAccion: () => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [renombrando, setRenombrando] = useState<string | null>(null);

  async function accion(a: string, extra: Record<string, unknown> = {}) {
    setOcupado(true);
    await fetch("/api/admin/trivia/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: a, ...extra }),
    });
    await onAccion();
    setOcupado(false);
  }

  if (!vivo) return <p className="text-sm text-madera">Cargando estado…</p>;
  const e = vivo.estado;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-crema p-4 shadow-hoja">
        <Estado e={e} />
        <span className="text-sm font-bold text-madera">
          PIN <b className="text-pino">{vivo.pin}</b>
        </span>
        <span className="text-sm font-bold text-madera">
          👥 {vivo.conectados}/{vivo.jugadores_total}
        </span>
        {e === "pregunta" && (
          <span className="text-sm font-bold text-madera">
            ✅ {vivo.respondieron} respondieron · P{vivo.numero}/
            {vivo.total_activas}
          </span>
        )}
      </div>

      {/* Botonera de control */}
      <div className="flex flex-wrap gap-2">
        {(e === "cerrado" || e === "podio") && (
          <BotonCtl onClick={() => accion("abrir-lobby")} dis={ocupado} primario>
            Abrir lobby
          </BotonCtl>
        )}
        {e === "lobby" && (
          <BotonCtl onClick={() => accion("iniciar")} dis={ocupado} primario>
            ▶ Iniciar
          </BotonCtl>
        )}
        {e === "pregunta" && (
          <>
            <BotonCtl onClick={() => accion("revelar")} dis={ocupado} primario>
              Mostrar resultados
            </BotonCtl>
            <BotonCtl onClick={() => accion("pausar")} dis={ocupado}>
              Pausar
            </BotonCtl>
            <BotonCtl onClick={() => accion("saltar")} dis={ocupado}>
              Saltar
            </BotonCtl>
          </>
        )}
        {e === "pausa" && (
          <BotonCtl onClick={() => accion("reanudar")} dis={ocupado} primario>
            Reanudar
          </BotonCtl>
        )}
        {e === "revelado" && (
          <BotonCtl onClick={() => accion("siguiente")} dis={ocupado} primario>
            {vivo.hay_mas ? "Siguiente →" : "Ver podio 🏆"}
          </BotonCtl>
        )}
        {e !== "cerrado" && (
          <BotonCtl onClick={() => accion("terminar")} dis={ocupado}>
            Terminar
          </BotonCtl>
        )}
        <BotonCtl
          onClick={() => {
            if (confirm("¿Reiniciar partida? Se borran puntajes y respuestas."))
              accion("reiniciar");
          }}
          dis={ocupado}
        >
          Reiniciar partida
        </BotonCtl>
        <BotonCtl
          onClick={() => {
            if (confirm("¿Reset total? Se eliminan todos los jugadores."))
              accion("reset-total");
          }}
          dis={ocupado}
          peligro
        >
          Reset total
        </BotonCtl>
      </div>

      {/* Exportar */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/api/admin/trivia/export?formato=csv"
          className="rounded-full bg-musgo/15 px-4 py-2 text-sm font-bold text-pino"
        >
          ⬇ Exportar ranking (CSV)
        </a>
        <a
          href="/api/admin/trivia/export?formato=json"
          className="rounded-full bg-musgo/15 px-4 py-2 text-sm font-bold text-pino"
        >
          ⬇ Exportar todo (JSON)
        </a>
      </div>

      {/* Jugadores conectados con moderación */}
      <div>
        <h3 className="mb-2 font-display text-lg font-bold text-bosque">
          Jugadores ({vivo.jugadores.length})
        </h3>
        {vivo.jugadores.length === 0 ? (
          <p className="rounded-2xl bg-crema/70 p-4 text-center text-sm font-semibold text-madera">
            Nadie conectado aún.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {vivo.jugadores.map((j) => (
              <li
                key={j.id}
                className="flex items-center gap-2 rounded-2xl bg-crema p-3 shadow-hoja"
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    j.conectado ? "bg-musgo" : "bg-madera/40"
                  }`}
                />
                <span className="flex-1 truncate text-sm font-bold text-bosque">
                  {j.nombre}
                </span>
                <span className="text-xs font-bold text-pino">{j.puntaje}</span>
                <button
                  onClick={() => setRenombrando(j.id)}
                  className="rounded-full bg-salvia/30 px-2 py-1 text-xs font-bold text-pino"
                >
                  ✎
                </button>
                <button
                  onClick={() => {
                    if (confirm(`¿Expulsar a ${j.nombre}?`))
                      accion("kick", { jugador_id: j.id });
                  }}
                  className="rounded-full bg-amanita/10 px-2 py-1 text-xs font-bold text-amanita"
                >
                  Expulsar
                </button>
                {renombrando === j.id && (
                  <RenombrarInline
                    nombre={j.nombre}
                    onCancel={() => setRenombrando(null)}
                    onSave={async (n) => {
                      await accion("renombrar", { jugador_id: j.id, nombre: n });
                      setRenombrando(null);
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RenombrarInline({
  nombre,
  onSave,
  onCancel,
}: {
  nombre: string;
  onSave: (n: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(nombre);
  return (
    <div className="flex w-full basis-full items-center gap-2 pt-2">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        maxLength={24}
        autoFocus
        className="flex-1 rounded-lg border-2 border-salvia/60 bg-pergamino px-2 py-1 text-sm"
      />
      <button
        onClick={() => onSave(v.trim())}
        className="rounded-full bg-pino px-3 py-1 text-xs font-bold text-pergamino"
      >
        Guardar
      </button>
      <button
        onClick={onCancel}
        className="rounded-full bg-salvia/30 px-3 py-1 text-xs font-bold text-pino"
      >
        ✕
      </button>
    </div>
  );
}

function Estado({ e }: { e: EstadoJuego }) {
  const map: Record<EstadoJuego, string> = {
    cerrado: "Cerrado",
    lobby: "Lobby abierto",
    pregunta: "Pregunta en curso",
    revelado: "Mostrando resultados",
    pausa: "En pausa",
    podio: "Podio",
  };
  return (
    <span className="rounded-full bg-pino px-3 py-1 text-sm font-bold text-pergamino">
      {map[e]}
    </span>
  );
}

// ---------------------------------------------------------------------------

function EditorPreguntas({
  preguntasIniciales,
  configDefault,
  onGuardado,
}: {
  preguntasIniciales: Pregunta[];
  configDefault: ConfigJuego;
  onGuardado: () => void;
}) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>(preguntasIniciales);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function actualizar(i: number, cambios: Partial<Pregunta>) {
    setPreguntas((ps) =>
      ps.map((p, idx) => (idx === i ? { ...p, ...cambios } : p))
    );
  }
  function mover(i: number, dir: -1 | 1) {
    setPreguntas((ps) => {
      const j = i + dir;
      if (j < 0 || j >= ps.length) return ps;
      const copia = [...ps];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });
  }
  function duplicar(i: number) {
    setPreguntas((ps) => {
      const copia = [...ps];
      const nueva = { ...ps[i], id: `p${Date.now()}` };
      copia.splice(i + 1, 0, nueva);
      return copia;
    });
  }
  function eliminar(i: number) {
    if (!confirm("¿Eliminar esta pregunta?")) return;
    setPreguntas((ps) => ps.filter((_, idx) => idx !== i));
  }
  function agregar() {
    setPreguntas((ps) => [
      ...ps,
      {
        id: `p${Date.now()}`,
        tipo: "opcion",
        enunciado: "Nueva pregunta",
        activa: true,
        timer: configDefault.timerDefault,
        puntaje: configDefault.puntajeBase,
        opciones: [
          { id: "a", texto: "Opción A" },
          { id: "b", texto: "Opción B" },
          { id: "c", texto: "Opción C" },
          { id: "d", texto: "Opción D" },
        ],
        correctas: ["a"],
      },
    ]);
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    setMsg(null);
    const res = await fetch("/api/admin/trivia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preguntas }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) setError(data?.error || "No se pudo guardar");
    else {
      setMsg("Preguntas guardadas ✔");
      onGuardado();
    }
    setGuardando(false);
  }

  // Restaura las 15 preguntas oficiales desde el código y recarga el editor.
  async function restaurarOficiales() {
    if (
      !confirm(
        "Esto reemplaza las preguntas guardadas por las 15 oficiales (con las respuestas corregidas). ¿Continuar?"
      )
    )
      return;
    setGuardando(true);
    setError(null);
    setMsg(null);
    const res = await fetch("/api/admin/trivia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reseed: true }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "No se pudo restaurar");
    } else {
      const r = await fetch("/api/admin/trivia", { cache: "no-store" });
      if (r.ok) setPreguntas((await r.json()).preguntas);
      setMsg("Preguntas oficiales restauradas ✔");
      onGuardado();
    }
    setGuardando(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={agregar}
          className="rounded-full bg-musgo/20 px-4 py-2 text-sm font-bold text-pino"
        >
          + Agregar pregunta
        </button>
        <button
          onClick={guardar}
          disabled={guardando}
          className="btn-amanita rounded-full px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar preguntas"}
        </button>
        <button
          onClick={restaurarOficiales}
          disabled={guardando}
          className="rounded-full border-2 border-pino px-4 py-2 text-sm font-bold text-pino disabled:opacity-60"
        >
          ♻︎ Restaurar preguntas oficiales
        </button>
        {msg && <span className="text-sm font-bold text-pino">{msg}</span>}
        {error && (
          <span className="text-sm font-bold text-amanita">{error}</span>
        )}
      </div>

      <ol className="space-y-3">
        {preguntas.map((p, i) => (
          <FilaPregunta
            key={p.id}
            i={i}
            total={preguntas.length}
            p={p}
            onActualizar={(c) => actualizar(i, c)}
            onMover={(d) => mover(i, d)}
            onDuplicar={() => duplicar(i)}
            onEliminar={() => eliminar(i)}
          />
        ))}
      </ol>
    </div>
  );
}

function FilaPregunta({
  i,
  total,
  p,
  onActualizar,
  onMover,
  onDuplicar,
  onEliminar,
}: {
  i: number;
  total: number;
  p: Pregunta;
  onActualizar: (c: Partial<Pregunta>) => void;
  onMover: (d: -1 | 1) => void;
  onDuplicar: () => void;
  onEliminar: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const tipos: [TipoPregunta, string][] = [
    ["opcion", "Opción única"],
    ["multiple", "Selección múltiple"],
    ["slider", "Slider"],
    ["texto", "Respuesta corta"],
    ["bienvenida", "Bienvenida"],
  ];

  return (
    <li
      className={`rounded-2xl bg-crema p-3 shadow-hoja ${
        p.activa ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="font-display font-bold text-pino">{i + 1}.</span>
        <button
          onClick={() => setAbierto((a) => !a)}
          className="flex-1 truncate text-left text-sm font-bold text-bosque"
        >
          {p.enunciado || "(sin enunciado)"}
        </button>
        <span className="rounded-full bg-salvia/30 px-2 py-0.5 text-xs font-bold text-pino">
          {p.tipo}
        </span>
        <label className="flex items-center gap-1 text-xs font-bold text-madera">
          <input
            type="checkbox"
            checked={p.activa}
            onChange={(e) => onActualizar({ activa: e.target.checked })}
            className="accent-musgo"
          />
          activa
        </label>
        <button
          onClick={() => onMover(-1)}
          disabled={i === 0}
          className="px-1 text-pino disabled:opacity-30"
        >
          ↑
        </button>
        <button
          onClick={() => onMover(1)}
          disabled={i === total - 1}
          className="px-1 text-pino disabled:opacity-30"
        >
          ↓
        </button>
      </div>

      {abierto && (
        <div className="mt-3 space-y-3 border-t border-salvia/40 pt-3">
          <textarea
            value={p.enunciado}
            onChange={(e) => onActualizar({ enunciado: e.target.value })}
            rows={2}
            className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-3">
            <label className="text-xs font-bold text-madera">
              Tipo
              <select
                value={p.tipo}
                onChange={(e) =>
                  onActualizar(plantillaTipo(p, e.target.value as TipoPregunta))
                }
                className="ml-1 rounded-lg border-2 border-salvia/60 bg-pergamino px-2 py-1 text-sm text-bosque"
              >
                {tipos.map(([t, l]) => (
                  <option key={t} value={t}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-madera">
              Timer (s)
              <input
                type="number"
                value={p.timer}
                min={0}
                max={120}
                onChange={(e) =>
                  onActualizar({ timer: Number(e.target.value) })
                }
                className="ml-1 w-16 rounded-lg border-2 border-salvia/60 bg-pergamino px-2 py-1 text-sm"
              />
            </label>
            <label className="text-xs font-bold text-madera">
              Puntaje
              <input
                type="number"
                value={p.puntaje}
                min={0}
                step={100}
                onChange={(e) =>
                  onActualizar({ puntaje: Number(e.target.value) })
                }
                className="ml-1 w-20 rounded-lg border-2 border-salvia/60 bg-pergamino px-2 py-1 text-sm"
              />
            </label>
          </div>

          {(p.tipo === "opcion" || p.tipo === "multiple") && (
            <EditorOpciones p={p} onActualizar={onActualizar} />
          )}
          {p.tipo === "slider" && (
            <div className="flex flex-wrap gap-3">
              {(["min", "max", "correcto"] as const).map((campo) => (
                <label key={campo} className="text-xs font-bold text-madera">
                  {campo}
                  <input
                    type="number"
                    value={(p[campo] as number) ?? 0}
                    onChange={(e) =>
                      onActualizar({ [campo]: Number(e.target.value) })
                    }
                    className="ml-1 w-20 rounded-lg border-2 border-salvia/60 bg-pergamino px-2 py-1 text-sm"
                  />
                </label>
              ))}
              <label className="text-xs font-bold text-madera">
                unidad
                <input
                  value={p.unidad ?? ""}
                  onChange={(e) => onActualizar({ unidad: e.target.value })}
                  className="ml-1 w-24 rounded-lg border-2 border-salvia/60 bg-pergamino px-2 py-1 text-sm"
                />
              </label>
            </div>
          )}
          {p.tipo === "texto" && (
            <label className="block text-xs font-bold text-madera">
              Respuestas aceptadas (separadas por coma)
              <input
                value={(p.aceptadas ?? []).join(", ")}
                onChange={(e) =>
                  onActualizar({
                    aceptadas: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="mt-1 w-full rounded-lg border-2 border-salvia/60 bg-pergamino px-2 py-1 text-sm"
              />
            </label>
          )}

          <div className="flex gap-2">
            <button
              onClick={onDuplicar}
              className="rounded-full bg-salvia/30 px-3 py-1 text-xs font-bold text-pino"
            >
              Duplicar
            </button>
            <button
              onClick={onEliminar}
              className="rounded-full bg-amanita/10 px-3 py-1 text-xs font-bold text-amanita"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function EditorOpciones({
  p,
  onActualizar,
}: {
  p: Pregunta;
  onActualizar: (c: Partial<Pregunta>) => void;
}) {
  const opciones = p.opciones ?? [];
  const correctas = p.correctas ?? [];
  const multiple = p.tipo === "multiple";

  function toggleCorrecta(id: string) {
    if (multiple) {
      onActualizar({
        correctas: correctas.includes(id)
          ? correctas.filter((x) => x !== id)
          : [...correctas, id],
      });
    } else {
      onActualizar({ correctas: [id] });
    }
  }

  return (
    <div className="space-y-2">
      {opciones.map((op, idx) => (
        <div key={op.id} className="flex items-center gap-2">
          <button
            onClick={() => toggleCorrecta(op.id)}
            className={`h-7 w-7 shrink-0 rounded-full border-2 text-sm font-bold ${
              correctas.includes(op.id)
                ? "border-musgo bg-musgo text-white"
                : "border-salvia/60 text-madera"
            }`}
            title="Marcar correcta"
          >
            ✓
          </button>
          <input
            value={op.texto}
            onChange={(e) => {
              const nuevas = [...opciones];
              nuevas[idx] = { ...op, texto: e.target.value };
              onActualizar({ opciones: nuevas });
            }}
            className="flex-1 rounded-lg border-2 border-salvia/60 bg-pergamino px-2 py-1 text-sm"
          />
          <button
            onClick={() => {
              onActualizar({
                opciones: opciones.filter((_, k) => k !== idx),
                correctas: correctas.filter((c) => c !== op.id),
              });
            }}
            className="text-amanita"
          >
            ✕
          </button>
        </div>
      ))}
      {opciones.length < 6 && (
        <button
          onClick={() => {
            const ids = ["a", "b", "c", "d", "e", "f"];
            const usados = new Set(opciones.map((o) => o.id));
            const nuevoId = ids.find((x) => !usados.has(x)) ?? `o${opciones.length}`;
            onActualizar({
              opciones: [...opciones, { id: nuevoId, texto: "Nueva opción" }],
            });
          }}
          className="rounded-full bg-salvia/30 px-3 py-1 text-xs font-bold text-pino"
        >
          + Opción
        </button>
      )}
      <p className="text-xs text-madera">
        {multiple
          ? "Marca todas las correctas (puntaje proporcional)."
          : "Marca la única correcta."}
      </p>
    </div>
  );
}

// Ajusta los campos al cambiar de tipo, conservando lo posible.
function plantillaTipo(p: Pregunta, tipo: TipoPregunta): Partial<Pregunta> {
  if (tipo === "opcion" || tipo === "multiple") {
    return {
      tipo,
      opciones:
        p.opciones ?? [
          { id: "a", texto: "Opción A" },
          { id: "b", texto: "Opción B" },
        ],
      correctas: p.correctas ?? [],
    };
  }
  if (tipo === "slider")
    return { tipo, min: p.min ?? 0, max: p.max ?? 44, correcto: p.correcto ?? 0 };
  if (tipo === "texto") return { tipo, aceptadas: p.aceptadas ?? [""] };
  return { tipo };
}

// ---------------------------------------------------------------------------

function Ajustes({
  cfg,
  onGuardado,
}: {
  cfg: ConfigResp;
  onGuardado: () => void;
}) {
  const [nombre, setNombre] = useState(cfg.nombre);
  const [descripcion, setDescripcion] = useState(cfg.descripcion);
  const [pin, setPin] = useState(cfg.pin);
  const [config, setConfig] = useState<ConfigJuego>({
    ...CONFIG_DEFAULT,
    ...cfg.config,
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    setMsg(null);
    const res = await fetch("/api/admin/trivia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, descripcion, pin, config }),
    });
    setMsg(res.ok ? "Guardado ✔" : "Error al guardar");
    if (res.ok) onGuardado();
    setGuardando(false);
  }

  async function regenerar() {
    if (!confirm("¿Regenerar PIN? Saca a los jugadores actuales.")) return;
    await fetch("/api/admin/trivia/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "regenerar-pin" }),
    });
    onGuardado();
    const r = await fetch("/api/admin/trivia", { cache: "no-store" });
    if (r.ok) setPin((await r.json()).pin);
  }

  return (
    <div className="space-y-4 rounded-2xl bg-crema p-4 shadow-hoja">
      <Campo label="Nombre del juego">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-3 py-2 text-sm"
        />
      </Campo>
      <Campo label="Descripción">
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={2}
          className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-3 py-2 text-sm"
        />
      </Campo>
      <div className="flex flex-wrap items-end gap-3">
        <Campo label="PIN (4-6 dígitos)">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            maxLength={6}
            className="w-28 rounded-xl border-2 border-salvia/60 bg-pergamino px-3 py-2 text-center text-lg font-bold tracking-widest"
          />
        </Campo>
        <button
          onClick={regenerar}
          className="rounded-full border-2 border-pino px-4 py-2 text-sm font-bold text-pino"
        >
          🎲 Regenerar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Campo label="Timer por defecto (s)">
          <input
            type="number"
            value={config.timerDefault}
            onChange={(e) =>
              setConfig({ ...config, timerDefault: Number(e.target.value) })
            }
            className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-3 py-2 text-sm"
          />
        </Campo>
        <Campo label="Puntaje base">
          <input
            type="number"
            value={config.puntajeBase}
            step={100}
            onChange={(e) =>
              setConfig({ ...config, puntajeBase: Number(e.target.value) })
            }
            className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-3 py-2 text-sm"
          />
        </Campo>
        <Campo label="Tolerancia slider (0-1)">
          <input
            type="number"
            step={0.05}
            min={0.05}
            max={1}
            value={config.sliderToleranciaPct}
            onChange={(e) =>
              setConfig({
                ...config,
                sliderToleranciaPct: Number(e.target.value),
              })
            }
            className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-3 py-2 text-sm"
          />
        </Campo>
      </div>

      <Campo label="Multiplicadores de racha (coma)">
        <input
          value={config.multiplicadores.join(", ")}
          onChange={(e) =>
            setConfig({
              ...config,
              multiplicadores: e.target.value
                .split(",")
                .map((s) => Number(s.trim()))
                .filter((n) => Number.isFinite(n)),
            })
          }
          className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-3 py-2 text-sm"
        />
      </Campo>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm font-bold text-pino">
          <input
            type="checkbox"
            checked={config.sonidos}
            onChange={(e) => setConfig({ ...config, sonidos: e.target.checked })}
            className="accent-musgo"
          />
          Sonidos
        </label>
        <label className="flex items-center gap-2 text-sm font-bold text-pino">
          <input
            type="checkbox"
            checked={config.animaciones}
            onChange={(e) =>
              setConfig({ ...config, animaciones: e.target.checked })
            }
            className="accent-musgo"
          />
          Animaciones
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={guardar}
          disabled={guardando}
          className="btn-amanita rounded-full px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar ajustes"}
        </button>
        {msg && <span className="text-sm font-bold text-pino">{msg}</span>}
      </div>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-bold text-madera">{label}</span>
      {children}
    </label>
  );
}

function BotonCtl({
  children,
  onClick,
  dis,
  primario,
  peligro,
}: {
  children: React.ReactNode;
  onClick: () => void;
  dis: boolean;
  primario?: boolean;
  peligro?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={dis}
      className={`rounded-full px-4 py-2 text-sm font-bold transition-transform active:scale-95 disabled:opacity-50 ${
        primario
          ? "btn-amanita text-white"
          : peligro
            ? "bg-amanita/10 text-amanita"
            : "border-2 border-pino text-pino"
      }`}
    >
      {children}
    </button>
  );
}
