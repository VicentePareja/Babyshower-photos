"use client";

const COLORES = ["#C0392B", "#8FB996", "#4b7a4a", "#F5D76E", "#7A5230"];
const PIEZAS = 36;

// Confeti ligero en CSS puro. Determinista (sin Math.random) para evitar
// discrepancias de hidratación: la variación sale del índice.
export function Confeti() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    >
      {Array.from({ length: PIEZAS }, (_, i) => {
        const left = ((i * 37) % 100) + ((i % 3) - 1) * 2;
        const delay = ((i * 53) % 140) / 100;
        const size = 7 + ((i * 29) % 7);
        return (
          <span
            key={i}
            className="confeti absolute block opacity-0"
            style={{
              left: `${left}%`,
              top: "-3vh",
              width: size,
              height: size * (i % 2 ? 1 : 0.45),
              backgroundColor: COLORES[i % COLORES.length],
              borderRadius: i % 3 === 0 ? "50%" : "2px",
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}
