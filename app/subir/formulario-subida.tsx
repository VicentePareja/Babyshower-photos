"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Confeti } from "@/components/confeti";
import { Camara, Champinon, Galeria } from "@/components/ilustraciones";
import { compressImage } from "@/lib/compress";
import { getSupabase } from "@/lib/supabase";

const MAX_ORIGINAL_MB = 25;
const MAX_AUTOR = 80;
const MAX_CAPTION = 280;
const MAX_FOTOS = 20; // tope por tanda, suave para la red del evento

type Estado = "eligiendo" | "previsualizando" | "subiendo" | "exito" | "error";

interface Seleccion {
  file: File;
  url: string; // object URL para la vista previa
  clave: string; // para deduplicar
}

export function FormularioSubida() {
  const [estado, setEstado] = useState<Estado>("eligiendo");
  const [seleccion, setSeleccion] = useState<Seleccion[]>([]);
  const [autor, setAutor] = useState("");
  const [caption, setCaption] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [progreso, setProgreso] = useState({ hechas: 0, total: 0 });
  const [subidasOk, setSubidasOk] = useState(0);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const camaraRef = useRef<HTMLInputElement>(null);

  // Revoca los object URLs pendientes al desmontar.
  const seleccionRef = useRef<Seleccion[]>([]);
  seleccionRef.current = seleccion;
  useEffect(() => {
    return () => {
      seleccionRef.current.forEach((s) => URL.revokeObjectURL(s.url));
    };
  }, []);

  function elegirArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setError(null);
    setAviso(null);

    let descartadas = 0;
    const nuevas: Seleccion[] = [];
    const clavesExistentes = new Set(seleccion.map((s) => s.clave));

    for (const file of files) {
      if (!file.type.startsWith("image/") || file.size > MAX_ORIGINAL_MB * 1024 * 1024) {
        descartadas++;
        continue;
      }
      const clave = `${file.name}-${file.size}-${file.lastModified}`;
      if (clavesExistentes.has(clave)) continue;
      clavesExistentes.add(clave);
      nuevas.push({ file, url: URL.createObjectURL(file), clave });
    }

    // Combina con lo ya seleccionado y respeta el tope.
    let combinada = [...seleccion, ...nuevas];
    let recortadas = 0;
    if (combinada.length > MAX_FOTOS) {
      recortadas = combinada.length - MAX_FOTOS;
      // libera las que sobran (siempre del final, que son las nuevas)
      combinada.slice(MAX_FOTOS).forEach((s) => URL.revokeObjectURL(s.url));
      combinada = combinada.slice(0, MAX_FOTOS);
    }

    if (combinada.length === 0) {
      setError("Esos archivos no son imágenes válidas. Elige fotos 📷");
      // permite volver a intentar el mismo archivo
      e.target.value = "";
      return;
    }

    const avisos: string[] = [];
    if (descartadas > 0)
      avisos.push(`${descartadas} archivo(s) no son imágenes válidas`);
    if (recortadas > 0)
      avisos.push(`máximo ${MAX_FOTOS} fotos por tanda`);
    setAviso(avisos.length ? avisos.join(" · ") : null);

    setSeleccion(combinada);
    setEstado("previsualizando");
    e.target.value = ""; // permite re-seleccionar lo mismo
  }

  function quitar(clave: string) {
    setSeleccion((prev) => {
      const s = prev.find((x) => x.clave === clave);
      if (s) URL.revokeObjectURL(s.url);
      const resto = prev.filter((x) => x.clave !== clave);
      if (resto.length === 0) setEstado("eligiendo");
      return resto;
    });
  }

  async function subir() {
    if (seleccion.length === 0) return;
    // honeypot lleno = bot: fingimos éxito sin subir nada
    if (honeypot) {
      setSubidasOk(seleccion.length);
      setEstado("exito");
      return;
    }

    setEstado("subiendo");
    setError(null);
    setProgreso({ hechas: 0, total: seleccion.length });

    const supabase = getSupabase();
    const fallidas: Seleccion[] = [];
    let ok = 0;

    // Subida secuencial: más amable con redes lentas y permite mostrar avance.
    for (const item of seleccion) {
      try {
        const blob = await compressImage(item.file);
        const esJpeg = blob.type === "image/jpeg";
        const extension = esJpeg
          ? "jpg"
          : (item.file.name.split(".").pop() || "jpg").toLowerCase();
        const ruta = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${extension}`;

        const { error: errSubida } = await supabase.storage
          .from("fotos")
          .upload(ruta, blob, {
            contentType: blob.type || "image/jpeg",
            cacheControl: "31536000",
          });
        if (errSubida) throw errSubida;

        const { error: errFila } = await supabase.from("fotos").insert({
          ruta,
          autor: autor.trim().slice(0, MAX_AUTOR) || null,
          caption: caption.trim().slice(0, MAX_CAPTION) || null,
        });
        if (errFila) throw errFila;

        ok++;
        URL.revokeObjectURL(item.url);
      } catch {
        fallidas.push(item);
      } finally {
        setProgreso((p) => ({ ...p, hechas: p.hechas + 1 }));
      }
    }

    if (fallidas.length === 0) {
      setSubidasOk(ok);
      setSeleccion([]);
      setEstado("exito");
    } else {
      // Conserva solo las que fallaron para reintentar.
      setSeleccion(fallidas);
      setSubidasOk(ok);
      setError(
        `Subieron ${ok} foto(s). Fallaron ${fallidas.length}; revisa tu conexión y reinténtalo.`
      );
      setEstado("error");
    }
  }

  function reiniciar() {
    seleccion.forEach((s) => URL.revokeObjectURL(s.url));
    setSeleccion([]);
    setCaption("");
    setError(null);
    setAviso(null);
    setSubidasOk(0);
    setProgreso({ hechas: 0, total: 0 });
    setEstado("eligiendo");
    if (galeriaRef.current) galeriaRef.current.value = "";
    if (camaraRef.current) camaraRef.current.value = "";
  }

  if (estado === "exito") {
    return (
      <div className="anima-aparece flex flex-col items-center gap-5 rounded-3xl bg-crema p-8 text-center shadow-hoja">
        <Confeti />
        <Champinon className="anima-flota h-20 w-20" />
        <h2 className="font-display text-2xl font-bold text-bosque">
          {subidasOk > 1
            ? `¡Tus ${subidasOk} fotos ya viven en el bosque!`
            : "¡Tu foto ya vive en el bosque!"}
        </h2>
        <p className="text-pino">Gracias por sumar tu recuerdo para Octavio.</p>
        <button
          onClick={reiniciar}
          className="btn-amanita w-full rounded-full px-6 py-4 text-lg font-bold text-white"
        >
          Subir más fotos
        </button>
        <Link href="/galeria" className="font-bold text-pino underline">
          Ver la galería
        </Link>
      </div>
    );
  }

  const cantidad = seleccion.length;

  return (
    <div className="anima-aparece space-y-5">
      {/* Galería: `multiple` y sin `capture` para abrir el carrete del celular */}
      <input
        ref={galeriaRef}
        id="foto-galeria"
        type="file"
        accept="image/*"
        multiple
        onChange={elegirArchivos}
        className="sr-only"
      />
      {/* Cámara: `capture` abre directamente la cámara trasera (una a la vez) */}
      <input
        ref={camaraRef}
        id="foto-camara"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={elegirArchivos}
        className="sr-only"
      />

      {estado === "eligiendo" || cantidad === 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label
            htmlFor="foto-galeria"
            className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-4 border-dashed border-salvia bg-crema/70 p-6 text-center transition-colors hover:border-musgo active:scale-[0.99]"
          >
            <Galeria className="h-14 w-14" />
            <span className="font-display text-xl font-bold text-bosque">
              Elegir de la galería
            </span>
            <span className="text-sm text-madera">
              Puedes seleccionar varias (hasta {MAX_FOTOS})
            </span>
          </label>
          <label
            htmlFor="foto-camara"
            className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-4 border-dashed border-salvia bg-crema/70 p-6 text-center transition-colors hover:border-musgo active:scale-[0.99]"
          >
            <Camara className="h-14 w-14" />
            <span className="font-display text-xl font-bold text-bosque">
              Tomar una foto
            </span>
            <span className="text-sm text-madera">Usa la cámara ahora</span>
          </label>
        </div>
      ) : (
        <div className="space-y-5 rounded-3xl bg-crema p-5 shadow-hoja">
          {cantidad === 1 ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={seleccion[0].url}
              alt="Vista previa de tu foto"
              className="max-h-96 w-full rounded-2xl object-contain"
            />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {seleccion.map((s) => (
                <div
                  key={s.clave}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-pergamino"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.url}
                    alt="Foto seleccionada"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => quitar(s.clave)}
                    aria-label="Quitar foto"
                    disabled={estado === "subiendo"}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-bosque/70 text-sm font-bold text-pergamino backdrop-blur transition-transform active:scale-90 disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
            <span className="font-bold text-bosque">
              {cantidad === 1 ? "1 foto" : `${cantidad} fotos`} seleccionada
              {cantidad === 1 ? "" : "s"}
            </span>
            {cantidad < MAX_FOTOS && (
              <label
                htmlFor="foto-galeria"
                className="cursor-pointer font-bold text-pino underline"
              >
                {cantidad === 1 ? "Cambiar / agregar" : "Agregar más"}
              </label>
            )}
          </div>

          {aviso && (
            <p className="rounded-xl bg-madera/10 px-4 py-2 text-center text-xs font-semibold text-madera">
              {aviso}
            </p>
          )}

          <div className="space-y-2">
            <label htmlFor="autor" className="block text-sm font-bold text-pino">
              Nombre(s){" "}
              <span className="font-normal text-madera">(opcional)</span>
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
            <label htmlFor="caption" className="block text-sm font-bold text-pino">
              Mensaje para la{cantidad > 1 ? "s" : ""} foto
              {cantidad > 1 ? "s" : ""}{" "}
              <span className="font-normal text-madera">
                (opcional{cantidad > 1 ? ", se aplica a todas" : ""})
              </span>
            </label>
            <input
              id="caption"
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={MAX_CAPTION}
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

          {estado === "subiendo" && progreso.total > 0 && (
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-salvia/30">
                <div
                  className="h-full bg-musgo transition-all"
                  style={{
                    width: `${(progreso.hechas / progreso.total) * 100}%`,
                  }}
                />
              </div>
              <p className="text-center text-xs font-semibold text-madera">
                Subiendo {progreso.hechas} de {progreso.total}…
              </p>
            </div>
          )}

          <button
            onClick={subir}
            disabled={estado === "subiendo"}
            className="btn-amanita w-full rounded-full px-6 py-4 text-lg font-bold text-white disabled:opacity-60"
          >
            {estado === "subiendo"
              ? "Subiendo…"
              : cantidad > 1
                ? `Subir ${cantidad} fotos al bosque`
                : "Subir al bosque"}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-amanita/10 px-4 py-3 text-sm font-semibold text-amanita">
          {error}
        </p>
      )}
    </div>
  );
}
