import type { Metadata } from "next";
import { Encabezado } from "@/components/encabezado";
import { Galeria } from "./galeria";

export const metadata: Metadata = {
  title: "Galería · El bosque de Octavio",
};

export default function PaginaGaleria() {
  return (
    <main className="min-h-[100dvh]">
      <Encabezado titulo="La galería del bosque" />
      <div className="mx-auto w-full max-w-5xl px-4 pb-14">
        <Galeria />
      </div>
    </main>
  );
}
