"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Camara } from "@/components/ilustraciones";
import { fotoPublicUrl, getSupabase } from "@/lib/supabase";
import type { Foto } from "@/lib/types";

const REFRESCO_MS = 45_000;

export function Galeria() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<Foto | null>(null);

  const cargar = useCallback(async () => {
    try {
      const { data, error: err } = await getSupabase()
        .from("fotos")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw err;
      setFotos(data ?? []);
      setError(null);
    } catch {
      setError("No pudimos cargar las fotos. Revisa tu conexión.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const timer = setInterval(cargar, REFRESCO_MS);
    return () => clearInterval(timer);
  }, [cargar]);

  // cerrar lightbox con Escape
  useEffect(() => {
    if (!abierta) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierta(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierta]);

  if (cargando) {
    return (
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4" aria-hidden="true">
        {[180, 240, 160, 220, 200, 170].map((h, i) => (
          <div
            key={i}
            className="mb-3 animate-pulse break-inside-avoid rounded-2xl bg-crema/80"
            style={{ height: h }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-amanita/10 p-6 text-center font-semibold text-amanita">
        {error}
        <button
          onClick={() => {
            setCargando(true);
            cargar();
          }}
          className="mx-auto mt-4 block rounded-full bg-amanita px-6 py-3 font-bold text-white"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (fotos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-crema/70 px-6 py-12 text-center">
        <Camara className="h-14 w-14" />
        <p className="font-display text-xl font-bold text-bosque">
          Aún no hay fotos en el bosque
        </p>
        <Link
          href="/subir"
          className="btn-amanita rounded-full px-6 py-3 font-bold text-white"
        >
          Sube la primera
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-madera">
          {fotos.length} {fotos.length === 1 ? "foto" : "fotos"}
        </p>
        <button
          onClick={cargar}
          className="rounded-full bg-pino px-5 py-2.5 text-sm font-bold text-pergamino transition-transform active:scale-95"
        >
          Actualizar
        </button>
      </div>

      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
        {fotos.map((foto, i) => (
          <button
            key={foto.id}
            onClick={() => setAbierta(foto)}
            className="anima-aparece mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl shadow-hoja transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoPublicUrl(foto.ruta)}
              alt={foto.caption || `Foto de ${foto.autor || "un invitado"}`}
              loading="lazy"
              className="w-full"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {abierta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
          onClick={() => setAbierta(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bosque/95 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotoPublicUrl(abierta.ruta)}
            alt={abierta.caption || "Foto ampliada"}
            className="max-h-[78dvh] max-w-full rounded-2xl object-contain"
          />
          {(abierta.caption || abierta.autor) && (
            <div className="max-w-md text-center text-pergamino">
              {abierta.caption && <p className="text-lg">{abierta.caption}</p>}
              {abierta.autor && (
                <p className="mt-1 text-sm font-bold text-salvia">
                  {abierta.autor}
                </p>
              )}
            </div>
          )}
          <button
            onClick={() => setAbierta(null)}
            className="rounded-full bg-pergamino px-8 py-3 font-bold text-bosque"
          >
            Cerrar
          </button>
        </div>
      )}
    </>
  );
}
