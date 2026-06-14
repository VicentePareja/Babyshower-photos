"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Champinon } from "@/components/ilustraciones";
import { fotoPublicUrl, getSupabase } from "@/lib/supabase";
import type { Foto } from "@/lib/types";

const AVANCE_MS = 5_000; // si lo cambias, ajusta también .barra-progreso en globals.css
const REFRESCO_MS = 60_000;
const UMBRAL_SWIPE = 50; // px mínimos para contar como deslizamiento

export function Slideshow() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const touchX = useRef<number | null>(null);

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

  const total = fotos.length;

  const siguiente = useCallback(() => {
    if (total > 0) setIndice((i) => (i + 1) % total);
  }, [total]);
  const anterior = useCallback(() => {
    if (total > 0) setIndice((i) => (i - 1 + total) % total);
  }, [total]);

  // Auto-avance. Depende de `indice` para que cada cambio (manual o
  // automático) reinicie la cuenta de 5s.
  useEffect(() => {
    if (pausado || total < 2) return;
    const timer = setTimeout(siguiente, AVANCE_MS);
    return () => clearTimeout(timer);
  }, [pausado, total, indice, siguiente]);

  // Navegación manual: toma el control y pausa el auto-avance.
  const navManual = useCallback(
    (dir: "prev" | "next") => {
      setPausado(true);
      if (dir === "next") siguiente();
      else anterior();
    },
    [siguiente, anterior]
  );

  // Teclado (proyector/laptop): ← → para navegar, espacio para play/pausa.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") navManual("next");
      else if (e.key === "ArrowLeft") navManual("prev");
      else if (e.key === " ") {
        e.preventDefault();
        setPausado((p) => !p);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navManual]);

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
    if (Math.abs(dx) > UMBRAL_SWIPE) navManual(dx < 0 ? "next" : "prev");
    touchX.current = null;
  }

  const actual = fotos[indice % Math.max(total, 1)];

  return (
    <main
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative flex min-h-[100dvh] select-none items-center justify-center overflow-hidden bg-bosque"
    >
      {actual ? (
        <figure
          key={actual.id}
          className="anima-aparece flex max-h-[100dvh] flex-col items-center justify-center px-4 py-6 sm:px-20"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotoPublicUrl(actual.ruta)}
            alt={actual.caption || "Foto del baby shower"}
            className="max-h-[80dvh] max-w-full rounded-2xl object-contain shadow-hoja-lg"
          />
          {(actual.caption || actual.autor) && (
            <figcaption className="mt-4 max-w-2xl text-center text-pergamino">
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
          <p className="font-display text-3xl font-bold">El bosque de Octavio</p>
          <p className="text-salvia">
            Escanea el QR y sube tu foto para verla aquí
          </p>
        </div>
      )}

      {/* Barra de progreso del auto-avance (se reinicia en cada foto) */}
      {total > 1 && !pausado && (
        <div className="absolute inset-x-0 top-0 h-1.5 bg-pergamino/10">
          <div key={indice} className="barra-progreso h-full bg-salvia/80" />
        </div>
      )}

      <Link
        href="/"
        className="absolute right-4 top-4 z-10 rounded-full bg-pergamino/20 px-4 py-2 text-sm font-bold text-pergamino backdrop-blur transition-opacity hover:bg-pergamino/30"
      >
        Salir
      </Link>

      {total > 1 && (
        <>
          <FlechaNav lado="izq" onClick={() => navManual("prev")} />
          <FlechaNav lado="der" onClick={() => navManual("next")} />

          {/* Controles inferiores: play/pausa + contador */}
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
            <button
              onClick={() => setPausado((p) => !p)}
              aria-label={pausado ? "Reanudar presentación" : "Pausar presentación"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-pergamino/20 text-pergamino backdrop-blur transition-transform active:scale-90 hover:bg-pergamino/30"
            >
              {pausado ? <IconoPlay /> : <IconoPausa />}
            </button>
            <span className="rounded-full bg-pergamino/15 px-4 py-2 text-sm font-semibold tabular-nums text-pergamino/90 backdrop-blur">
              {(indice % total) + 1} de {total}
            </span>
          </div>
        </>
      )}
    </main>
  );
}

function FlechaNav({
  lado,
  onClick,
}: {
  lado: "izq" | "der";
  onClick: () => void;
}) {
  const izq = lado === "izq";
  return (
    <button
      onClick={onClick}
      aria-label={izq ? "Foto anterior" : "Foto siguiente"}
      className={`absolute top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-pergamino/20 text-pergamino backdrop-blur transition-all active:scale-90 hover:bg-pergamino/35 sm:h-16 sm:w-16 ${
        izq ? "left-3 sm:left-5" : "right-3 sm:right-5"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7 sm:h-8 sm:w-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {izq ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
}

function IconoPlay() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconoPausa() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
