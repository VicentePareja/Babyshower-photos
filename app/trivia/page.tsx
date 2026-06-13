import type { Metadata } from "next";
import { Jugador } from "./jugador";
import { ControlSonido } from "@/components/trivia/control-sonido";

export const metadata: Metadata = {
  title: "Trivia · El bosque de Octavio",
  robots: { index: false, follow: false },
};

export default async function TriviaPage({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string }>;
}) {
  const { pin } = await searchParams;
  return (
    <main className="min-h-[100dvh] pb-6">
      <Jugador pinInicial={(pin ?? "").replace(/\D/g, "")} />
      <ControlSonido />
    </main>
  );
}
