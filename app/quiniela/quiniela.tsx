"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bellota, Brote, Champinon, Ojo } from "@/components/ilustraciones";
import { getSupabase } from "@/lib/supabase";
import type { Ojos, Prediccion, ResultadoQuiniela } from "@/lib/types";

const MAX_AUTOR = 80;
const MAX_NOMBRE = 60;

const SIN_RESULTADO: ResultadoQuiniela = {
  publicado: false,
  ojos: null,
  peso_gramos: null,
  fecha_real: null,
};

export function Quiniela() {
  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
  const [resultado, setResultado] = useState<ResultadoQuiniela>(SIN_RESULTADO);
  const [autor, setAutor] = useState("");
  const [ojos, setOjos] = useState<Ojos | null>(null);
  const [peso, setPeso] = useState("");
  const [fecha, setFecha] = useState("");
  const [nombre, setNombre] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await getSupabase()
        .from("predicciones")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (data) setPredicciones(data);
    } catch {
      // silencioso: el resumen simplemente no aparece
    }
  }, []);

  useEffect(() => {
    cargar();
    fetch("/api/quiniela/resultado")
      .then((r) => (r.ok ? r.json() : null))
      .then((r: ResultadoQuiniela | null) => r && setResultado(r))
      .catch(() => {
        // sin resultado publicado todavía
      });
  }, [cargar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (honeypot) {
      setExito(true);
      return;
    }

    if (!ojos) {
      setError("Adivina cómo serán sus ojos 👀");
      return;
    }
    const pesoGramos = peso ? parseInt(peso, 10) : null;
    if (pesoGramos !== null && (pesoGramos < 500 || pesoGramos > 7000)) {
      setError("Ese peso parece de osezno, no de bebé (entre 500 y 7000 g).");
      return;
    }

    setEnviando(true);
    try {
      const { error: err } = await getSupabase().from("predicciones").insert({
        autor: autor.trim().slice(0, MAX_AUTOR) || null,
        ojos,
        peso_gramos: pesoGramos,
        fecha_estimada: fecha || null,
        nombre_sugerido: nombre.trim().slice(0, MAX_NOMBRE) || null,
      });
      if (err) throw err;
      setExito(true);
      setOjos(null);
      setPeso("");
      setFecha("");
      setNombre("");
      await cargar();
    } catch {
      setError("No se pudo guardar tu predicción. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const publicado = resultado.publicado;
  const ranking = useMemo(
    () => (publicado ? calcularRanking(predicciones, resultado) : []),
    [publicado, predicciones, resultado]
  );

  const conPeso = predicciones.filter((p) => p.peso_gramos);
  const pesoPromedio = conPeso.length
    ? Math.round(
        conPeso.reduce((s, p) => s + (p.peso_gramos ?? 0), 0) / conPeso.length
      )
    : null;
  const conFecha = predicciones
    .map((p) => p.fecha_estimada)
    .filter((f): f is string => Boolean(f))
    .sort();
  const fechaMediana = conFecha.length
    ? conFecha[Math.floor(conFecha.length / 2)]
    : null;
  const nombres = predicciones.filter((p) => p.nombre_sugerido);

  return (
    <div className="space-y-8">
      {publicado && <ResultadoReal resultado={resultado} ranking={ranking} />}

      {!publicado && (
        <form
          onSubmit={enviar}
          className="anima-aparece space-y-4 rounded-3xl bg-crema p-5 shadow-hoja"
        >
          <div className="space-y-2">
            <label
              htmlFor="q-autor"
              className="block text-sm font-bold text-pino"
            >
              Nombre(s){" "}
              <span className="font-normal text-madera">(opcional)</span>
            </label>
            <input
              id="q-autor"
              type="text"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              maxLength={MAX_AUTOR}
              autoComplete="name"
              className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-4 py-3 text-bosque outline-none focus:border-musgo"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-pino">
              ¿Cómo serán sus ojos?
            </legend>
            <div className="flex gap-3">
              {(["claro", "oscuro"] as const).map((opcion) => (
                <label
                  key={opcion}
                  className={`flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-xl border-2 px-4 py-3 text-center font-bold transition-colors ${
                    ojos === opcion
                      ? "border-musgo bg-musgo/15 text-pino"
                      : "border-salvia/60 bg-pergamino text-madera"
                  }`}
                >
                  <input
                    type="radio"
                    name="ojos"
                    value={opcion}
                    checked={ojos === opcion}
                    onChange={() => setOjos(opcion)}
                    className="sr-only"
                  />
                  <Ojo tono={opcion} className="h-7 w-auto" />
                  {opcion === "claro" ? "Claros" : "Oscuros"}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="q-peso"
                className="block text-sm font-bold text-pino"
              >
                Peso al nacer (gramos)
              </label>
              <input
                id="q-peso"
                type="number"
                inputMode="numeric"
                min={500}
                max={7000}
                step={10}
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="3400"
                className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-4 py-3 text-bosque outline-none placeholder:text-bosque/40 focus:border-musgo"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="q-fecha"
                className="block text-sm font-bold text-pino"
              >
                Fecha de nacimiento
              </label>
              <input
                id="q-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-4 py-3 text-bosque outline-none focus:border-musgo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="q-nombre"
              className="block text-sm font-bold text-pino"
            >
              ¿Qué nombre le habrías puesto tú?
            </label>
            <input
              id="q-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={MAX_NOMBRE}
              className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-4 py-3 text-bosque outline-none focus:border-musgo"
            />
          </div>

          {/* honeypot invisible para bots */}
          <input
            type="text"
            name="sitio_web"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />

          {error && (
            <p className="rounded-xl bg-amanita/10 px-4 py-2 text-sm font-semibold text-amanita">
              {error}
            </p>
          )}
          {exito && !error && (
            <p className="rounded-xl bg-musgo/15 px-4 py-2 text-sm font-semibold text-pino">
              ¡Predicción guardada! Que el bosque decida quién acierta.
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="btn-amanita w-full rounded-full px-6 py-4 text-lg font-bold text-white disabled:opacity-60"
          >
            {enviando ? "Guardando..." : "Apostar mi predicción"}
          </button>
        </form>
      )}

      {predicciones.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Bellota className="h-8 w-8" />
            <h2 className="font-display text-xl font-bold text-bosque">
              Lo que dice el bosque ({predicciones.length}{" "}
              {predicciones.length === 1 ? "predicción" : "predicciones"})
            </h2>
          </div>

          <MiradaDelBosque
            predicciones={predicciones}
            real={publicado ? resultado.ojos : null}
          />

          <TiraDeApuestas
            titulo="La rama de los pesos"
            icono="bellota"
            puntos={conPeso.map((p) => ({
              valor: p.peso_gramos!,
              etiqueta: `${p.autor || "Alguien del bosque"}: ${p.peso_gramos} g`,
            }))}
            real={
              publicado && resultado.peso_gramos
                ? {
                    valor: resultado.peso_gramos,
                    etiqueta: `Octavio: ${resultado.peso_gramos} g`,
                  }
                : null
            }
            formatear={(v) => `${Math.round(v)} g`}
            nota={pesoPromedio ? `promedio del bosque: ${pesoPromedio} g` : null}
          />

          <TiraDeApuestas
            titulo="El sendero de las fechas"
            icono="brote"
            puntos={predicciones
              .filter((p) => p.fecha_estimada)
              .map((p) => ({
                valor: aMs(p.fecha_estimada!),
                etiqueta: `${p.autor || "Alguien del bosque"}: ${fechaLarga(
                  p.fecha_estimada!
                )}`,
              }))}
            real={
              publicado && resultado.fecha_real
                ? {
                    valor: aMs(resultado.fecha_real),
                    etiqueta: `Octavio nació el ${fechaLarga(
                      resultado.fecha_real
                    )}`,
                  }
                : null
            }
            formatear={(v) =>
              new Date(v).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "short",
              })
            }
            nota={
              fechaMediana
                ? `fecha más votada (mediana): ${fechaLarga(fechaMediana)}`
                : null
            }
          />

          {nombres.length > 0 && (
            <div className="rounded-2xl bg-crema p-5 shadow-hoja">
              <p className="text-sm font-bold text-pino">
                Nombres que sugería el bosque
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {nombres.map((p) => (
                  <span
                    key={p.id}
                    title={p.autor || "Alguien del bosque"}
                    className="rounded-full bg-salvia/25 px-3 py-1.5 text-sm font-semibold text-pino"
                  >
                    {p.nombre_sugerido}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!publicado && (
            <ul className="space-y-3">
              {predicciones.map((p) => (
                <li
                  key={p.id}
                  className="rounded-2xl bg-crema/80 p-4 shadow-hoja"
                >
                  <p className="font-bold text-bosque">
                    {p.autor || "Alguien del bosque"}
                  </p>
                  <p className="mt-1 text-sm text-pino">
                    {[
                      p.ojos &&
                        `ojos ${p.ojos === "claro" ? "claros" : "oscuros"}`,
                      p.peso_gramos && `${p.peso_gramos} g`,
                      p.fecha_estimada && fechaLarga(p.fecha_estimada),
                      p.nombre_sugerido &&
                        `lo habría llamado ${p.nombre_sugerido}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

/* ---------- puntajes ---------- */

interface Puntaje {
  prediccion: Prediccion;
  puntos: number;
  detalle: string[];
}

// Ojos acertados: 30 pts. Peso: hasta 35 pts (0 a 1 kg de error).
// Fecha: hasta 35 pts (0 a 21 días de error).
function calcularRanking(
  predicciones: Prediccion[],
  real: ResultadoQuiniela
): Puntaje[] {
  return predicciones
    .map((p) => {
      let puntos = 0;
      const detalle: string[] = [];
      if (real.ojos && p.ojos) {
        if (p.ojos === real.ojos) {
          puntos += 30;
          detalle.push("ojos ✓");
        } else {
          detalle.push("ojos ✗");
        }
      }
      if (real.peso_gramos && p.peso_gramos) {
        const diff = Math.abs(p.peso_gramos - real.peso_gramos);
        puntos += Math.round(35 * Math.max(0, 1 - diff / 1000));
        detalle.push(diff === 0 ? "¡el peso exacto!" : `a ${diff} g`);
      }
      if (real.fecha_real && p.fecha_estimada) {
        const dias = Math.abs(
          Math.round((aMs(p.fecha_estimada) - aMs(real.fecha_real)) / 86_400_000)
        );
        puntos += Math.round(35 * Math.max(0, 1 - dias / 21));
        detalle.push(
          dias === 0 ? "¡clavó el día!" : `a ${dias} ${dias === 1 ? "día" : "días"}`
        );
      }
      return { prediccion: p, puntos, detalle };
    })
    .sort(
      (a, b) =>
        b.puntos - a.puntos ||
        a.prediccion.created_at.localeCompare(b.prediccion.created_at)
    );
}

function aMs(fecha: string): number {
  return Date.parse(`${fecha}T12:00:00Z`);
}

function fechaLarga(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
  });
}

/* ---------- resultado real + ranking ---------- */

const MEDALLAS = ["🥇", "🥈", "🥉"];

function ResultadoReal({
  resultado,
  ranking,
}: {
  resultado: ResultadoQuiniela;
  ranking: Puntaje[];
}) {
  return (
    <section className="anima-aparece space-y-4">
      <div className="rounded-3xl bg-pino p-6 text-center text-pergamino shadow-hoja-lg">
        <Champinon className="anima-flota mx-auto h-12 w-12" />
        <h2 className="mt-2 font-display text-2xl font-bold">
          ¡Octavio ya llegó al bosque!
        </h2>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {resultado.ojos && (
            <DatoReal
              valor={resultado.ojos === "claro" ? "claros" : "oscuros"}
              etiqueta="sus ojos"
            />
          )}
          {resultado.peso_gramos && (
            <DatoReal valor={`${resultado.peso_gramos} g`} etiqueta="pesó" />
          )}
          {resultado.fecha_real && (
            <DatoReal valor={fechaLarga(resultado.fecha_real)} etiqueta="nació el" />
          )}
        </div>
        <p className="mt-4 text-sm text-salvia">
          Las apuestas quedaron cerradas. ¡Gracias por jugar!
        </p>
      </div>

      {ranking.length > 0 && (
        <div className="rounded-3xl bg-crema p-5 shadow-hoja">
          <h3 className="font-display text-xl font-bold text-bosque">
            🏆 El ranking del bosque
          </h3>
          <ol className="mt-4 space-y-2">
            {ranking.map((r, i) => (
              <li
                key={r.prediccion.id}
                className={`flex items-center gap-3 rounded-2xl p-3 ${
                  i === 0
                    ? "bg-musgo/15 ring-2 ring-musgo"
                    : "bg-pergamino"
                }`}
              >
                <span className="w-8 shrink-0 text-center text-lg font-bold text-madera">
                  {MEDALLAS[i] ?? i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <p className="truncate font-bold text-bosque">
                    {r.prediccion.autor || "Alguien del bosque"}
                  </p>
                  {r.detalle.length > 0 && (
                    <p className="text-xs font-semibold text-madera">
                      {r.detalle.join(" · ")}
                    </p>
                  )}
                </span>
                <span className="shrink-0 font-display text-xl font-bold text-pino tabular-nums">
                  {r.puntos}
                  <span className="text-xs font-semibold text-madera"> pts</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function DatoReal({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="min-w-28 rounded-2xl bg-pergamino/10 px-4 py-3">
      <p className="text-xs font-semibold text-salvia">{etiqueta}</p>
      <p className="font-display text-lg font-bold">{valor}</p>
    </div>
  );
}

/* ---------- visualizaciones ---------- */

function MiradaDelBosque({
  predicciones,
  real,
}: {
  predicciones: Prediccion[];
  real: Ojos | null;
}) {
  const votos = predicciones.filter((p) => p.ojos);
  if (votos.length === 0) return null;
  const claro = votos.filter((p) => p.ojos === "claro").length;
  const oscuro = votos.length - claro;
  const pctClaro = Math.round((claro / votos.length) * 100);

  return (
    <div className="rounded-2xl bg-crema p-5 shadow-hoja">
      <p className="text-sm font-bold text-pino">La mirada del bosque</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <BandoOjos
          tono="claro"
          votos={claro}
          total={votos.length}
          acierto={real === "claro"}
        />
        <BandoOjos
          tono="oscuro"
          votos={oscuro}
          total={votos.length}
          acierto={real === "oscuro"}
        />
      </div>
      <div
        className="mt-3 flex h-3 overflow-hidden rounded-full"
        role="img"
        aria-label={`${pctClaro}% apuesta a ojos claros`}
      >
        <div className="bg-salvia" style={{ width: `${pctClaro}%` }} />
        <div className="flex-1 bg-madera/80" />
      </div>
    </div>
  );
}

function BandoOjos({
  tono,
  votos,
  total,
  acierto,
}: {
  tono: Ojos;
  votos: number;
  total: number;
  acierto: boolean;
}) {
  const pct = Math.round((votos / total) * 100);
  // el ojo del bando más votado se ve más grande (entre 56 y 108 px)
  const ancho = 56 + 52 * (votos / total);
  return (
    <div
      className={`relative flex flex-col items-center gap-1 rounded-2xl px-3 py-4 ${
        acierto ? "bg-musgo/15 ring-2 ring-musgo" : "bg-pergamino"
      }`}
    >
      {acierto && (
        <span className="absolute -top-2 right-2 rounded-full bg-musgo px-2 py-0.5 text-[10px] font-bold text-white">
          ¡Así son!
        </span>
      )}
      <span
        className="ojo-parpadea flex h-16 items-center"
        style={{ width: ancho, animationDelay: tono === "claro" ? "0s" : "2.4s" }}
      >
        <Ojo tono={tono} className="h-auto w-full" />
      </span>
      <p className="font-display text-2xl font-bold text-pino tabular-nums">
        {pct}%
      </p>
      <p className="text-xs font-semibold text-madera">
        {tono === "claro" ? "claros" : "oscuros"} · {votos}{" "}
        {votos === 1 ? "voto" : "votos"}
      </p>
    </div>
  );
}

interface PuntoTira {
  valor: number;
  etiqueta: string;
}

// Tira horizontal estilo "rama": cada apuesta se posa según su valor.
function TiraDeApuestas({
  titulo,
  icono,
  puntos,
  real,
  formatear,
  nota,
}: {
  titulo: string;
  icono: "bellota" | "brote";
  puntos: PuntoTira[];
  real: PuntoTira | null;
  formatear: (v: number) => string;
  nota: string | null;
}) {
  if (puntos.length === 0) return null;
  const valores = puntos
    .map((p) => p.valor)
    .concat(real ? [real.valor] : []);
  const minValor = Math.min(...valores);
  const maxValor = Math.max(...valores);
  const margen = Math.max((maxValor - minValor) * 0.08, 1);
  const min = minValor - margen;
  const max = maxValor + margen;
  const pos = (v: number) => ((v - min) / (max - min)) * 100;
  const Icono = icono === "bellota" ? Bellota : Brote;

  return (
    <div className="rounded-2xl bg-crema p-5 shadow-hoja">
      <p className="text-sm font-bold text-pino">{titulo}</p>
      <div className="relative mt-1 h-24">
        {/* la rama */}
        <div className="absolute inset-x-0 bottom-8 h-1.5 rounded-full bg-madera/70" />
        {puntos.map((p, i) => (
          <span
            key={i}
            title={p.etiqueta}
            className="absolute -translate-x-1/2 cursor-help"
            style={{ left: `${pos(p.valor)}%`, bottom: i % 2 === 0 ? 36 : 50 }}
          >
            <Icono className="h-6 w-6" />
          </span>
        ))}
        {real && (
          <>
            <span
              className="absolute bottom-3 h-11 w-0.5 -translate-x-1/2 rounded bg-amanita/60"
              style={{ left: `${pos(real.valor)}%` }}
            />
            <span
              title={real.etiqueta}
              className="absolute -translate-x-1/2 cursor-help text-center"
              style={{ left: `${pos(real.valor)}%`, bottom: 44 }}
            >
              <Champinon className="anima-flota h-9 w-9" />
            </span>
            <span
              className="absolute bottom-0 -translate-x-1/2 text-[10px] font-bold uppercase text-amanita"
              style={{ left: `${pos(real.valor)}%` }}
            >
              real
            </span>
          </>
        )}
      </div>
      <div className="flex justify-between text-xs font-semibold text-madera">
        <span>{formatear(minValor)}</span>
        <span>{formatear(maxValor)}</span>
      </div>
      {nota && (
        <p className="mt-2 text-center text-xs font-semibold text-madera">
          {nota}
        </p>
      )}
    </div>
  );
}
