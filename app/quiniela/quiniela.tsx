"use client";

import { useCallback, useEffect, useState } from "react";
import { Bellota } from "@/components/ilustraciones";
import { getSupabase } from "@/lib/supabase";
import type { Prediccion } from "@/lib/types";

const MAX_AUTOR = 80;
const MAX_NOMBRE = 60;

export function Quiniela() {
  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
  const [autor, setAutor] = useState("");
  const [sexo, setSexo] = useState("niño");
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
  }, [cargar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (honeypot) {
      setExito(true);
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
        sexo,
        peso_gramos: pesoGramos,
        fecha_estimada: fecha || null,
        nombre_sugerido: nombre.trim().slice(0, MAX_NOMBRE) || null,
      });
      if (err) throw err;
      setExito(true);
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

  return (
    <div className="space-y-8">
      <form
        onSubmit={enviar}
        className="anima-aparece space-y-4 rounded-3xl bg-crema p-5 shadow-hoja"
      >
        <div className="space-y-2">
          <label htmlFor="q-autor" className="block text-sm font-bold text-pino">
            Tu nombre <span className="font-normal text-madera">(opcional)</span>
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
            ¿Niño o niña?{" "}
            <span className="font-normal text-madera">
              (psst: ya sabemos que es Octavio)
            </span>
          </legend>
          <div className="flex gap-3">
            {["niño", "niña"].map((opcion) => (
              <label
                key={opcion}
                className={`flex-1 cursor-pointer rounded-xl border-2 px-4 py-3 text-center font-bold capitalize transition-colors ${
                  sexo === opcion
                    ? "border-musgo bg-musgo/15 text-pino"
                    : "border-salvia/60 bg-pergamino text-madera"
                }`}
              >
                <input
                  type="radio"
                  name="sexo"
                  value={opcion}
                  checked={sexo === opcion}
                  onChange={() => setSexo(opcion)}
                  className="sr-only"
                />
                {opcion}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="q-peso" className="block text-sm font-bold text-pino">
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
            <label htmlFor="q-fecha" className="block text-sm font-bold text-pino">
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
          <label htmlFor="q-nombre" className="block text-sm font-bold text-pino">
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

      {predicciones.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Bellota className="h-8 w-8" />
            <h2 className="font-display text-xl font-bold text-bosque">
              Lo que dice el bosque ({predicciones.length}{" "}
              {predicciones.length === 1 ? "predicción" : "predicciones"})
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {pesoPromedio && (
              <div className="rounded-2xl bg-crema p-4 text-center shadow-hoja">
                <p className="font-display text-2xl font-bold text-pino tabular-nums">
                  {pesoPromedio} g
                </p>
                <p className="text-xs font-semibold text-madera">
                  peso promedio apostado
                </p>
              </div>
            )}
            {fechaMediana && (
              <div className="rounded-2xl bg-crema p-4 text-center shadow-hoja">
                <p className="font-display text-2xl font-bold text-pino">
                  {new Date(`${fechaMediana}T12:00:00`).toLocaleDateString(
                    "es-CL",
                    { day: "numeric", month: "long" }
                  )}
                </p>
                <p className="text-xs font-semibold text-madera">
                  fecha más votada (mediana)
                </p>
              </div>
            )}
          </div>

          <ul className="space-y-3">
            {predicciones.map((p) => (
              <li key={p.id} className="rounded-2xl bg-crema/80 p-4 shadow-hoja">
                <p className="font-bold text-bosque">
                  {p.autor || "Alguien del bosque"}
                </p>
                <p className="mt-1 text-sm text-pino">
                  {[
                    p.sexo && `apuesta a ${p.sexo}`,
                    p.peso_gramos && `${p.peso_gramos} g`,
                    p.fecha_estimada &&
                      new Date(
                        `${p.fecha_estimada}T12:00:00`
                      ).toLocaleDateString("es-CL", {
                        day: "numeric",
                        month: "long",
                      }),
                    p.nombre_sugerido && `lo habría llamado ${p.nombre_sugerido}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
