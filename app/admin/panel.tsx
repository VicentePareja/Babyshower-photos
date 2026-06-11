"use client";

import { useCallback, useEffect, useState } from "react";
import { fotoPublicUrl } from "@/lib/supabase";
import type { Foto, Mensaje, Prediccion } from "@/lib/types";

interface Datos {
  fotos: Foto[];
  mensajes: Mensaje[];
  predicciones: Prediccion[];
}

type Estado = "comprobando" | "login" | "cargando" | "listo";

export function PanelAdmin() {
  const [estado, setEstado] = useState<Estado>("comprobando");
  const [datos, setDatos] = useState<Datos | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    const res = await fetch("/api/admin/data");
    if (res.status === 401) {
      setEstado("login");
      return;
    }
    if (!res.ok) {
      setError("No se pudieron cargar los datos.");
      setEstado("login");
      return;
    }
    setDatos(await res.json());
    setEstado("listo");
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("Contraseña incorrecta.");
      return;
    }
    setPassword("");
    setEstado("cargando");
    await cargarDatos();
  }

  async function borrar(tipo: "foto" | "mensaje" | "prediccion", id: string) {
    if (!confirm("¿Borrar definitivamente? Esto no se puede deshacer.")) return;
    setBorrando(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Error al borrar");
      }
      setDatos((d) => {
        if (!d) return d;
        if (tipo === "foto")
          return { ...d, fotos: d.fotos.filter((f) => f.id !== id) };
        if (tipo === "mensaje")
          return { ...d, mensajes: d.mensajes.filter((m) => m.id !== id) };
        return {
          ...d,
          predicciones: d.predicciones.filter((p) => p.id !== id),
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al borrar");
    } finally {
      setBorrando(null);
    }
  }

  async function salir() {
    await fetch("/api/admin/logout", { method: "POST" });
    setDatos(null);
    setEstado("login");
  }

  if (estado === "comprobando" || estado === "cargando") {
    return (
      <p className="animate-pulse rounded-3xl bg-crema/70 p-8 text-center font-semibold text-madera">
        Cargando...
      </p>
    );
  }

  if (estado === "login") {
    return (
      <form
        onSubmit={entrar}
        className="anima-aparece mx-auto max-w-sm space-y-4 rounded-3xl bg-crema p-6 shadow-hoja"
      >
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-bold text-pino">
            Contraseña de administración
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            className="w-full rounded-xl border-2 border-salvia/60 bg-pergamino px-4 py-3 text-bosque outline-none focus:border-musgo"
          />
        </div>
        {error && (
          <p className="rounded-xl bg-amanita/10 px-4 py-2 text-sm font-semibold text-amanita">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="btn-amanita w-full rounded-full px-6 py-3.5 font-bold text-white"
        >
          Entrar
        </button>
      </form>
    );
  }

  if (!datos) return null;

  const deseos = datos.mensajes.filter((m) => m.destinatario === "bebe");
  const paraPadres = datos.mensajes.filter((m) => m.destinatario === "padres");

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a
          href="/api/admin/export"
          className="btn-amanita rounded-full px-6 py-3 font-bold text-white"
        >
          Descargar todo (ZIP)
        </a>
        <button
          onClick={salir}
          className="rounded-full border-2 border-madera px-5 py-2.5 text-sm font-bold text-madera"
        >
          Cerrar sesión
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-amanita/10 px-4 py-2 text-sm font-semibold text-amanita">
          {error}
        </p>
      )}

      <Seccion titulo={`Fotos (${datos.fotos.length})`}>
        {datos.fotos.length === 0 ? (
          <Vacio texto="No hay fotos todavía." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {datos.fotos.map((foto) => (
              <figure
                key={foto.id}
                className="overflow-hidden rounded-2xl bg-crema shadow-hoja"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoPublicUrl(foto.ruta)}
                  alt={foto.caption || "Foto subida"}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                <figcaption className="space-y-1 p-3 text-xs">
                  <p className="font-bold text-bosque">
                    {foto.autor || "Anónimo"}
                  </p>
                  {foto.caption && <p className="text-madera">{foto.caption}</p>}
                  <button
                    onClick={() => borrar("foto", foto.id)}
                    disabled={borrando === foto.id}
                    className="mt-1 w-full rounded-full bg-amanita/10 py-2 font-bold text-amanita disabled:opacity-50"
                  >
                    {borrando === foto.id ? "Borrando..." : "Borrar"}
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Seccion>

      <Seccion titulo={`Deseos para Octavio (${deseos.length})`}>
        <ListaMensajes
          mensajes={deseos}
          borrando={borrando}
          onBorrar={(id) => borrar("mensaje", id)}
        />
      </Seccion>

      <Seccion titulo={`Mensajes para los papás (${paraPadres.length})`}>
        <ListaMensajes
          mensajes={paraPadres}
          borrando={borrando}
          onBorrar={(id) => borrar("mensaje", id)}
        />
      </Seccion>

      <Seccion titulo={`Predicciones (${datos.predicciones.length})`}>
        {datos.predicciones.length === 0 ? (
          <Vacio texto="No hay predicciones todavía." />
        ) : (
          <ul className="space-y-3">
            {datos.predicciones.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-3 rounded-2xl bg-crema p-4 shadow-hoja"
              >
                <div className="text-sm">
                  <p className="font-bold text-bosque">{p.autor || "Anónimo"}</p>
                  <p className="text-madera">
                    {[
                      p.sexo,
                      p.peso_gramos && `${p.peso_gramos} g`,
                      p.fecha_estimada,
                      p.nombre_sugerido,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <button
                  onClick={() => borrar("prediccion", p.id)}
                  disabled={borrando === p.id}
                  className="shrink-0 rounded-full bg-amanita/10 px-4 py-2 text-xs font-bold text-amanita disabled:opacity-50"
                >
                  Borrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </Seccion>
    </div>
  );
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-bold text-bosque">{titulo}</h2>
      {children}
    </section>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <p className="rounded-2xl bg-crema/70 p-5 text-center text-sm font-semibold text-madera">
      {texto}
    </p>
  );
}

function ListaMensajes({
  mensajes,
  borrando,
  onBorrar,
}: {
  mensajes: Mensaje[];
  borrando: string | null;
  onBorrar: (id: string) => void;
}) {
  if (mensajes.length === 0) return <Vacio texto="No hay mensajes todavía." />;
  return (
    <ul className="space-y-3">
      {mensajes.map((m) => (
        <li
          key={m.id}
          className="flex items-start justify-between gap-3 rounded-2xl bg-crema p-4 shadow-hoja"
        >
          <div className="text-sm">
            <p className="whitespace-pre-wrap text-bosque">{m.cuerpo}</p>
            <p className="mt-1 font-bold text-madera">{m.autor || "Anónimo"}</p>
          </div>
          <button
            onClick={() => onBorrar(m.id)}
            disabled={borrando === m.id}
            className="shrink-0 rounded-full bg-amanita/10 px-4 py-2 text-xs font-bold text-amanita disabled:opacity-50"
          >
            Borrar
          </button>
        </li>
      ))}
    </ul>
  );
}
