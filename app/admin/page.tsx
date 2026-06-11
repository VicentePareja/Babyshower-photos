import type { Metadata } from "next";
import { Encabezado } from "@/components/encabezado";
import { PanelAdmin } from "./panel";

export const metadata: Metadata = {
  title: "Admin · El bosque de Octavio",
  robots: { index: false, follow: false },
};

export default function Admin() {
  return (
    <main className="min-h-[100dvh]">
      <Encabezado titulo="Panel de los papás" />
      <div className="mx-auto w-full max-w-4xl px-4 pb-14">
        <PanelAdmin />
      </div>
    </main>
  );
}
