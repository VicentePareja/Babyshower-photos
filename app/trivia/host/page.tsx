import type { Metadata } from "next";
import { Host } from "./host";
import { ControlSonido } from "@/components/trivia/control-sonido";

export const metadata: Metadata = {
  title: "Host Trivia · El bosque de Octavio",
  robots: { index: false, follow: false },
};

// Vista de proyección para el evento presencial. Ábrela en la pantalla grande.
// Si abriste sesión en /admin en este navegador, aparecen los controles en vivo.
export default function HostPage() {
  return (
    <main className="min-h-[100dvh]">
      <Host />
      <ControlSonido claro />
    </main>
  );
}
