import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FLAGS } from "@/lib/flags";
import { Slideshow } from "./slideshow";

export const metadata: Metadata = {
  title: "Presentación · El bosque de Octavio",
};

// Extra opcional A: carrusel a pantalla completa para proyectar en la TV.
export default function PaginaSlideshow() {
  if (!FLAGS.slideshow) notFound();
  return <Slideshow />;
}
