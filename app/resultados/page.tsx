import type { Metadata } from "next";
import { Encabezado } from "@/components/encabezado";
import { Resultados } from "./resultados";

export const metadata: Metadata = {
  title: "Resultados de la Competencia · El bosque de Octavio",
  robots: { index: false, follow: false },
};

export default function ResultadosPage() {
  return (
    <main className="min-h-[100dvh]">
      <Encabezado titulo="Resultados de la Competencia" />
      <div className="mx-auto w-full max-w-2xl px-4 pb-14 pt-2">
        <Resultados />
      </div>
    </main>
  );
}
