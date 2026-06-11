import Link from "next/link";
import { Champinon } from "./ilustraciones";

// Encabezado compacto para las páginas internas, con vuelta al inicio.
export function Encabezado({ titulo }: { titulo: string }) {
  return (
    <header className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pt-5 pb-2">
      <Link
        href="/"
        className="flex min-h-12 items-center gap-2 rounded-full bg-crema/80 px-4 py-2 text-sm font-bold text-pino shadow-hoja transition-transform active:scale-95"
      >
        <Champinon className="h-5 w-5" />
        Inicio
      </Link>
      <h1 className="font-display text-xl font-semibold text-bosque sm:text-2xl">
        {titulo}
      </h1>
    </header>
  );
}
