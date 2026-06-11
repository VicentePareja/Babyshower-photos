"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Destinatario, Mensaje } from "@/lib/types";
import { Brote, Corazon } from "./ilustraciones";

const MAX_CUERPO = 1000;
const MAX_AUTOR = 80;

interface Props {
  destinatario: Destinatario;
  placeholder: string;
}

// Formulario + muro de mensajes, compartido por /deseos-bebe y /mensajes-padres.
export function MuroMensajes({ destinatario, placeholder }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(true);
  const [autor, setAutor] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const { data, error: err } = await getSupabase()
        .from("mensajes")
        .select("*")
        .eq("destinatario", destinatario)
        .order("created_at", { ascending: false })
        .limit(200);
      if (err) throw err;
      setMensajes(data ?? []);
    } catch {
      setError("No pudimos cargar los mensajes. Revisa tu conexión.");
    } finally {
      setCargando(false);
    }
  }, [destinatario]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const texto = cuerpo.trim();
    if (!texto) {
      setError("Escribe un mensajito antes de enviar 🌿");
      return;
    }
    // honeypot: los bots lo llenan; fingimos éxito y no guardamos nada
    if (honeypot) {
      setCuerpo("");
      setExito(true);
      return;
    }

    setEnviando(true);
    try {
      const { error: err } = await getSupabase().from("mensajes").insert({
        destinatario,
        autor: autor.trim().slice(0, MAX_AUTOR) || null,
        cuerpo: texto.slice(0, MAX_CUERPO),
      });
      if (err) throw err;
      setCuerpo("");
      setExito(true);
      await cargar();
    } catch {
      setError("No se pudo enviar. Inténtalo de nuevo en un momento.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={enviar}
        className="anima-aparece space-y-4 rounded-3xl bg-crema p-5 shadow-hoja"
      >
        <div className="space-y-2">
          <label htmlFor="autor" className="block text-sm font-bold text-pino">
            Tu nombre <span className="font-normal text-madera">(opcional)</span>
          </label>
          <input
            id="autor"
            type="text"
            value={autor}
            onChange={(e) => setAutor(e.target.value)}
            maxLength={MAX_AUTOR}
            autoComplete="name"
            className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-4 py-3 text-bosque outline-none focus:border-musgo"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="cuerpo" className="block text-sm font-bold text-pino">
            Tu mensaje
          </label>
          <textarea
            id="cuerpo"
            value={cuerpo}
            onChange={(e) => {
              setCuerpo(e.target.value);
              setExito(false);
            }}
            maxLength={MAX_CUERPO}
            rows={4}
            required
            placeholder={placeholder}
            className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-4 py-3 text-bosque outline-none placeholder:text-bosque/40 focus:border-musgo"
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
          <p className="flex items-center gap-2 rounded-xl bg-musgo/15 px-4 py-2 text-sm font-semibold text-pino">
            <Brote className="h-5 w-5" /> ¡Mensaje guardado en el bosque!
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="btn-amanita w-full rounded-full px-6 py-4 text-lg font-bold text-white disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Enviar con cariño"}
        </button>
      </form>

      <section aria-label="Mensajes enviados" className="space-y-4">
        {cargando ? (
          <ListaEsqueleto />
        ) : mensajes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-crema/70 px-6 py-10 text-center">
            <Corazon className="h-10 w-10" />
            <p className="font-semibold text-madera">
              Todavía no hay mensajes. ¡Sé quien deje el primero!
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {mensajes.map((m) => (
              <li
                key={m.id}
                className="anima-aparece rounded-3xl bg-crema p-5 shadow-hoja"
              >
                <p className="whitespace-pre-wrap text-bosque">{m.cuerpo}</p>
                <p className="mt-3 text-sm font-bold text-madera">
                  {m.autor || "Alguien del bosque"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ListaEsqueleto() {
  return (
    <ul className="space-y-4" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="animate-pulse rounded-3xl bg-crema/70 p-5">
          <div className="h-4 w-3/4 rounded bg-salvia/40" />
          <div className="mt-2 h-4 w-1/2 rounded bg-salvia/30" />
          <div className="mt-4 h-3 w-24 rounded bg-madera/20" />
        </li>
      ))}
    </ul>
  );
}
