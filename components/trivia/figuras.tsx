// Las 4 figuras del bosque para las alternativas. Forma + color se asignan
// por posición y se replican idénticas entre host y celular.
export interface FiguraInfo {
  nombre: string;
  color: string;
  colorOscuro: string;
}

export const FIGURAS_OPCION: FiguraInfo[] = [
  { nombre: "Hongo", color: "#c0392b", colorOscuro: "#922b21" }, // amanita rojo
  { nombre: "Hoja", color: "#4b7a4a", colorOscuro: "#395f38" }, // musgo
  { nombre: "Bellota", color: "#7a5230", colorOscuro: "#5d3e24" }, // madera
  { nombre: "Seta", color: "#d8a23a", colorOscuro: "#b9842a" }, // dorado
];

export function figuraDe(indice: number): FiguraInfo {
  return FIGURAS_OPCION[indice % FIGURAS_OPCION.length];
}

// Ícono SVG según la posición (0..3). Hereda el color del texto (currentColor).
export function IconoFigura({
  indice,
  className = "",
}: {
  indice: number;
  className?: string;
}) {
  const i = indice % 4;
  if (i === 0)
    // hongo
    return (
      <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
        <path
          d="M5 15a11 11 0 0 1 22 0c0 1-1 1.6-2 1.6H7c-1 0-2-.6-2-1.6Z"
          fill="currentColor"
        />
        <circle cx="12" cy="11" r="1.7" fill="#fff" opacity=".75" />
        <circle cx="19" cy="9.5" r="1.3" fill="#fff" opacity=".65" />
        <circle cx="22" cy="13" r="1.1" fill="#fff" opacity=".6" />
        <path d="M13.5 17h5l-.7 8a1.8 1.8 0 0 1-3.6 0Z" fill="currentColor" opacity=".55" />
      </svg>
    );
  if (i === 1)
    // hoja
    return (
      <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
        <path
          d="M26 6C13 6 7 13 7 24c0 1 0 2 .3 3 9-1 18-7 18-21Z"
          fill="currentColor"
        />
        <path d="M22 10C15 13 11 18 9 25" stroke="#fff" strokeWidth="1.3" opacity=".6" strokeLinecap="round" />
      </svg>
    );
  if (i === 2)
    // bellota
    return (
      <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
        <path d="M9 13h14a8 8 0 0 1-14 0Z" fill="currentColor" />
        <path d="M16 13c4 0 8 3 8 8a8 8 0 0 1-16 0c0-5 4-8 8-8Z" fill="currentColor" opacity=".75" />
        <path d="M15 6v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  // seta (sombrero puntiagudo)
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <path d="M16 4c6 4 9 9 9 12 0 1.4-1 2-2.2 2H9.2C8 18 7 17.4 7 16c0-3 3-8 9-12Z" fill="currentColor" />
      <circle cx="14" cy="13" r="1.4" fill="#fff" opacity=".7" />
      <circle cx="19" cy="11" r="1.1" fill="#fff" opacity=".6" />
      <path d="M14 18h4l-.6 7a1.5 1.5 0 0 1-2.8 0Z" fill="currentColor" opacity=".55" />
    </svg>
  );
}
