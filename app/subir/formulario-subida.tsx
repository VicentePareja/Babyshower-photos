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

type Estado = "eligiendo" | "previsualizando" | "subiendo" | "exito" | "error";

export function FormularioSubida() {
  const [estado, setEstado] = useState<Estado>("eligiendo");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [autor, setAutor] = useState("");
  const [caption, setCaption] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const camaraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Ese archivo no es una imagen. Elige una foto 📷");
      return;
    }
    if (file.size > MAX_ORIGINAL_MB * 1024 * 1024) {
      setError(`La foto es muy pesada (máx ${MAX_ORIGINAL_MB} MB).`);
      return;
    }

    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setArchivo(file);
    setPreviewUrl(URL.createObjectURL(file));
    setEstado("previsualizando");
  }

  async function subir() {
    if (!archivo) return;
    // honeypot lleno = bot: fingimos éxito sin subir nada
    if (honeypot) {
      setEstado("exito");
      return;
    }

    setEstado("subiendo");
    setError(null);
    try {
      const supabase = getSupabase();
      const blob = await compressImage(archivo);
      const esJpeg = blob.type === "image/jpeg";
      const extension = esJpeg
        ? "jpg"
        : (archivo.name.split(".").pop() || "jpg").toLowerCase();
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

      setEstado("exito");
    } catch {
      setEstado("error");
      setError(
        "No se pudo subir la foto. Revisa tu conexión e inténtalo de nuevo."
      );
    }
  }

  function reiniciar() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setArchivo(null);
    setPreviewUrl(null);
    setCaption("");
    setError(null);
    setEstado("eligiendo");
    // permite volver a elegir el mismo archivo
    if (galeriaRef.current) galeriaRef.current.value = "";
    if (camaraRef.current) camaraRef.current.value = "";
  }

  if (estado === "exito") {
    return (
      <div className="anima-aparece flex flex-col items-center gap-5 rounded-3xl bg-crema p-8 text-center shadow-hoja">
        <Confeti />
        <Champinon className="anima-flota h-20 w-20" />
        <h2 className="font-display text-2xl font-bold text-bosque">
          ¡Tu foto ya vive en el bosque!
        </h2>
        <p className="text-pino">Gracias por sumar tu recuerdo para Octavio.</p>
        <button
          onClick={reiniciar}
          className="btn-amanita w-full rounded-full px-6 py-4 text-lg font-bold text-white"
        >
          Subir otra foto
        </button>
        <Link href="/galeria" className="font-bold text-pino underline">
          Ver la galería
        </Link>
      </div>
    );
  }

  return (
    <div className="anima-aparece space-y-5">
      {/* Galería: sin `capture` para que el celular abra el carrete de fotos */}
      <input
        ref={galeriaRef}
        id="foto-galeria"
        type="file"
        accept="image/*"
        onChange={elegirArchivo}
        className="sr-only"
      />
      {/* Cámara: `capture` abre directamente la cámara trasera */}
      <input
        ref={camaraRef}
        id="foto-camara"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={elegirArchivo}
        className="sr-only"
      />

      {estado === "eligiendo" || !previewUrl ? (
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
              Sube una foto que ya tienes guardada
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Vista previa de tu foto"
            className="max-h-96 w-full rounded-2xl object-contain"
          />
          <label
            htmlFor="foto-galeria"
            className="block cursor-pointer text-center text-sm font-bold text-pino underline"
          >
            Cambiar foto
          </label>

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
            <label
              htmlFor="caption"
              className="block text-sm font-bold text-pino"
            >
              Mensaje para la foto{" "}
              <span className="font-normal text-madera">(opcional)</span>
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

          <button
            onClick={subir}
            disabled={estado === "subiendo"}
            className="btn-amanita w-full rounded-full px-6 py-4 text-lg font-bold text-white disabled:opacity-60"
          >
            {estado === "subiendo" ? "Subiendo tu foto..." : "Subir al bosque"}
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
