import type { Metadata } from "next";
import { Encabezado } from "@/components/encabezado";
import { MuroMensajes } from "@/components/muro-mensajes";

export const metadata: Metadata = {
  title: "Mensajes para los papás · El bosque de Octavio",
};

export default function MensajesPadres() {
  return (
    <main className="min-h-[100dvh]">
      <Encabezado titulo="Mensajes para los papás" />
      <div className="mx-auto w-full max-w-2xl px-4 pb-14">
        <p className="anima-aparece mb-5 rounded-2xl bg-salvia/25 px-5 py-4 text-pino">
          Vicente y Melani están por estrenarse como papás. Déjales un consejo,
          un ánimo o un buen chiste para las noches sin dormir.
        </p>
        <MuroMensajes
          destinatario="padres"
          placeholder="Queridos papás, les aconsejo..."
        />
      </div>
    </main>
  );
}
