import type { Metadata } from "next";
import { Encabezado } from "@/components/encabezado";
import { MuroMensajes } from "@/components/muro-mensajes";

export const metadata: Metadata = {
  title: "Deseos para Octavio · El bosque de Octavio",
};

export default function DeseosBebe() {
  return (
    <main className="min-h-[100dvh]">
      <Encabezado titulo="Deseos para Octavio" />
      <div className="mx-auto w-full max-w-2xl px-4 pb-14">
        <p className="anima-aparece mb-5 rounded-2xl bg-salvia/25 px-5 py-4 text-pino">
          Esta es una cápsula del tiempo: estos deseos los leerá Octavio en el
          futuro 🌱. Cuéntale qué le deseas para su vida.
        </p>
        <MuroMensajes
          destinatario="bebe"
          placeholder="Querido Octavio, te deseo..."
        />
      </div>
    </main>
  );
}
