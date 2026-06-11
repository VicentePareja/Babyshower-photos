"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Champinon } from "@/components/ilustraciones";
import { fotoPublicUrl, getSupabase } from "@/lib/supabase";
import type { Foto } from "@/lib/types";

const AVANCE_MS = 5_000;
const REFRESCO_MS = 60_000;

export function Slideshow() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [indice, setIndice] = useState(0);

  const cargar = useCallback(async () => {
    try {
      const { data } = await getSupabase()
        .from("fotos")
        .select("*")
        .order("created_at", { ascending: true });
      if (data) setFotos(data);
    } catch {
      // mantenemos las fotos ya cargadas
    }
  }, []);

  useEffect(() => {
    cargar();
    const timer = setInterval(cargar, REFRESCO_MS);
    return () => clearInterval(timer);
  }, [cargar]);

  useEffect(() => {
    if (fotos.length < 2) return;
    const timer = setInterval(
      () => setIndice((i) => (i + 1) % fotos.length),
      AVANCE_MS
    );
    return () => clearInterval(timer);
  }, [fotos.length]);

  const actual = fotos[indice % Math.max(fotos.length, 1)];

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center bg-bosque">
      {actual ? (
        <figure
          key={actual.id}
          className="anima-aparece flex max-h-[100dvh] flex-col items-center justify-center p-6"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotoPublicUrl(actual.ruta)}
            alt={actual.caption || "Foto del baby shower"}
            className="max-h-[82dvh] max-w-full rounded-2xl object-contain shadow-hoja-lg"
          />
          {(actual.caption || actual.autor) && (
            <figcaption className="mt-4 text-center text-pergamino">
              {actual.caption && <p className="text-2xl">{actual.caption}</p>}
              {actual.autor && (
                <p className="mt-1 text-lg font-bold text-salvia">
                  {actual.autor}
                </p>
              )}
            </figcaption>
          )}
        </figure>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center text-pergamino">
          <Champinon className="anima-flota h-24 w-24" />
          <p className="font-display text-3xl font-bold">
            El bosque de Octavio
          </p>
          <p className="text-salvia">
            Escanea el QR y sube tu foto para verla aquí
          </p>
        </div>
      )}

      <Link
        href="/"
        className="absolute right-4 top-4 rounded-full bg-pergamino/20 px-4 py-2 text-sm font-bold text-pergamino backdrop-blur transition-opacity hover:bg-pergamino/30"
      >
        Salir
      </Link>

      {fotos.length > 1 && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-pergamino/15 px-4 py-1.5 text-sm font-semibold text-pergamino/80 tabular-nums backdrop-blur">
          {(indice % fotos.length) + 1} de {fotos.length}
        </p>
      )}
    </main>
  );
}
