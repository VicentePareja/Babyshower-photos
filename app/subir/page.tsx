import type { Metadata } from "next";
import { Encabezado } from "@/components/encabezado";
import { FormularioSubida } from "./formulario-subida";

export const metadata: Metadata = {
  title: "Sube tu foto · El bosque de Octavio",
};

// Pantalla destino del QR impreso: https://octavio-parejamiranda.com/subir
export default function Subir() {
  return (
    <main className="min-h-[100dvh]">
      <Encabezado titulo="Sube tu foto" />
      <div className="mx-auto w-full max-w-2xl px-4 pb-14">
        <p className="anima-aparece mb-5 text-pino">
          Comparte una foto de este día para el recuerdo de Octavio. ¡Solo toma
          un segundo!
        </p>
        <FormularioSubida />
      </div>
    </main>
  );
}
