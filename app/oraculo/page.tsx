import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Encabezado } from "@/components/encabezado";
import {
  BolaCristal,
  Estrellas,
  Luciernagas,
  Luna,
} from "@/components/ilustraciones";
import { FLAGS } from "@/lib/flags";
import { Oraculo } from "./oraculo";

export const metadata: Metadata = {
  title: "El Oráculo del Bosque · El bosque de Octavio",
};

// Extra opcional B: el oráculo — predicciones sobre el nacimiento.
export default function PaginaOraculo() {
  if (!FLAGS.oraculo) notFound();
  return (
    <main className="noche-oraculo relative min-h-[100dvh] overflow-hidden">
      {/* cielo nocturno decorativo */}
      <div className="pointer-events-none absolute inset-x-0 top-0" aria-hidden="true">
        <Estrellas className="h-64 w-full" />
        <Luna className="absolute right-4 top-6 h-20 w-20 sm:right-10" />
        <Luciernagas className="absolute left-2 top-40 h-10 w-44 opacity-80" />
      </div>

      <div className="relative">
        <Encabezado titulo="El Oráculo del Bosque" claro />
        <div className="mx-auto w-full max-w-2xl px-4 pb-14">
          <section className="anima-aparece pt-4 text-center">
            <BolaCristal className="anima-flota mx-auto h-28 w-28" />
            <p className="mx-auto mt-3 max-w-md text-salvia">
              El bosque duerme y el oráculo despierta. Mira la bola de
              cristal y deja tu profecía: ¿cuánto pesará Octavio? ¿cuándo
              llegará? ¿de qué color serán sus ojos? Cuando él nazca,
              sabremos quién vio el futuro.
            </p>
          </section>
          <div className="mt-6">
            <Oraculo />
          </div>
        </div>
      </div>
    </main>
  );
}
