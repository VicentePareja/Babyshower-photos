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
          Esta es una cápsula del tiempo: déjale un deseo o un consejo que
          Octavio leerá en el futuro 🌱. Es secreto — nadie más lo verá.
        </p>
        <MuroMensajes
          destinatario="bebe"
          placeholder="Querido Octavio, te deseo... (o te aconsejo...)"
          etiquetaCuerpo="Tu deseo o consejo"
          privado
        />
      </div>
    </main>
  );
}
