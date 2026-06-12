import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Encabezado } from "@/components/encabezado";
import { FLAGS } from "@/lib/flags";
import { Quiniela } from "./quiniela";

export const metadata: Metadata = {
  title: "Quiniela · El bosque de Octavio",
};

// Extra opcional B: juego de predicciones sobre el nacimiento.
export default function PaginaQuiniela() {
  if (!FLAGS.quiniela) notFound();
  return (
    <main className="min-h-[100dvh]">
      <Encabezado titulo="La quiniela de Octavio" />
      <div className="mx-auto w-full max-w-2xl px-4 pb-14">
        <p className="anima-aparece mb-5 rounded-2xl bg-salvia/25 px-5 py-4 text-pino">
          ¿Cuánto pesará? ¿Cuándo llegará? ¿Tendrá ojos claros u oscuros?
          Deja tu predicción y veremos quién le achuntó cuando nazca Octavio.
        </p>
        <Quiniela />
      </div>
    </main>
  );
}
