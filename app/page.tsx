import Link from "next/link";
import { Contadores } from "@/components/contadores";
import {
  Brote,
  Camara,
  Corazon,
  EscenaBosque,
  Galeria,
  Luciernagas,
} from "@/components/ilustraciones";
import { FLAGS } from "@/lib/flags";

const TARJETAS = [
  {
    href: "/subir",
    titulo: "Subir una foto",
    detalle: "Captura el momento y guárdalo en el bosque",
    Icono: Camara,
    destacada: true,
  },
  {
    href: "/galeria",
    titulo: "Ver la galería",
    detalle: "Todas las fotos de la celebración",
    Icono: Galeria,
    destacada: false,
  },
  {
    href: "/deseos-bebe",
    titulo: "Deseos para Octavio",
    detalle: "Palabras que leerá cuando crezca",
    Icono: Brote,
    destacada: false,
  },
  {
    href: "/mensajes-padres",
    titulo: "Mensajes para los papás",
    detalle: "Ánimo y consejos para Vicente y Melani",
    Icono: Corazon,
    destacada: false,
  },
];

export default function Inicio() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-14">
      {/* Hero */}
      <section className="anima-aparece pt-8 text-center">
        <Luciernagas className="mx-auto h-8 w-40" />
        <h1 className="font-display text-4xl font-bold leading-tight text-bosque sm:text-5xl">
          ¡Bienvenidos al bosque de Octavio!
        </h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-pino">
          Gracias por acompañarnos a esperar a nuestro pequeño explorador.
          Deja aquí tus fotos y tus deseos.
        </p>
        <p className="mt-2 font-display text-base italic text-madera">
          Con cariño, Vicente y Melani
        </p>
        <EscenaBosque className="mt-4 h-44 w-full sm:h-56" />
      </section>

      {/* Contadores en vivo */}
      <section className="anima-aparece mt-6" style={{ animationDelay: "0.1s" }}>
        <Contadores />
      </section>

      {/* Tarjetas de navegación */}
      <nav
        aria-label="Secciones"
        className="anima-aparece mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
        style={{ animationDelay: "0.2s" }}
      >
        {TARJETAS.map(({ href, titulo, detalle, Icono, destacada }) => (
          <Link
            key={href}
            href={href}
            className={`group flex min-h-28 items-center gap-4 rounded-3xl p-5 shadow-hoja transition-all hover:-translate-y-0.5 hover:shadow-hoja-lg active:scale-[0.98] ${
              destacada
                ? "btn-amanita text-white sm:col-span-2"
                : "bg-crema text-bosque"
            }`}
          >
            <span
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${
                destacada ? "bg-white/20" : "bg-pergamino"
              }`}
            >
              <Icono className="h-10 w-10" />
            </span>
            <span>
              <span className="block font-display text-xl font-bold">
                {titulo}
              </span>
              <span
                className={`block text-sm ${
                  destacada ? "text-white/90" : "text-madera"
                }`}
              >
                {detalle}
              </span>
            </span>
          </Link>
        ))}
      </nav>

      {/* Extras */}
      {(FLAGS.oraculo || FLAGS.slideshow) && (
        <footer className="mt-10 flex flex-wrap justify-center gap-4 text-sm font-bold">
          {FLAGS.oraculo && (
            <Link
              href="/oraculo"
              className="rounded-full bg-pino px-5 py-3 text-pergamino transition-transform active:scale-95"
            >
              🔮 Consulta el Oráculo del Bosque
            </Link>
          )}
          {FLAGS.slideshow && (
            <Link
              href="/slideshow"
              className="rounded-full border-2 border-pino px-5 py-3 text-pino transition-transform active:scale-95"
            >
              Modo presentación
            </Link>
          )}
        </footer>
      )}
    </main>
  );
}
