// Ilustraciones inline del bosque encantado. Sin dependencias: SVG puro.

export function Champinon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M14 47c0-3 2-5 5-5h26c3 0 5 2 5 5l-3 11c-.5 2-2 3-4 3H21c-2 0-3.5-1-4-3l-3-11Z"
        fill="#F1E4C8"
      />
      <path
        d="M32 4C16 4 4 16 4 30c0 4 3 7 7 7h42c4 0 7-3 7-7C60 16 48 4 32 4Z"
        fill="#C0392B"
      />
      <circle cx="18" cy="22" r="4.5" fill="#F6F3E7" />
      <circle cx="34" cy="14" r="3.5" fill="#F6F3E7" />
      <circle cx="46" cy="25" r="5" fill="#F6F3E7" />
      <circle cx="30" cy="29" r="3" fill="#F6F3E7" />
    </svg>
  );
}

export function Helecho({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M32 60C32 35 34 18 44 6"
        stroke="#4b7a4a"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {[14, 22, 30, 38, 46].map((y, i) => (
        <g key={y} stroke="#4b7a4a" strokeWidth="2.5" strokeLinecap="round">
          <path d={`M${33 + i} ${y + 8} q -10 -2 -14 -8`} fill="none" />
          <path d={`M${34 + i} ${y + 10} q 10 -1 13 -7`} fill="none" />
        </g>
      ))}
    </svg>
  );
}

export function Bellota({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M20 26c0-9 5-15 12-15s12 6 12 15H20Z"
        fill="#7A5230"
      />
      <path
        d="M22 28h20c0 14-5 24-10 26-5-2-10-12-10-26Z"
        fill="#A87C4F"
      />
      <path d="M32 11V5" stroke="#7A5230" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Brote({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M32 58V32"
        stroke="#4b7a4a"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M32 36C32 24 22 18 10 18c0 12 10 18 22 18Z"
        fill="#8FB996"
      />
      <path
        d="M32 30c0-10 9-16 20-16 0 10-9 16-20 16Z"
        fill="#4b7a4a"
      />
    </svg>
  );
}

export function Corazon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M32 56C18 46 8 36 8 24c0-8 6-13 13-13 5 0 9 3 11 7 2-4 6-7 11-7 7 0 13 5 13 13 0 12-10 22-24 32Z"
        fill="#C0392B"
      />
      <circle cx="22" cy="22" r="3" fill="#F6F3E7" opacity="0.7" />
    </svg>
  );
}

export function Ojo({
  tono,
  className = "",
}: {
  tono: "claro" | "oscuro";
  className?: string;
}) {
  const iris = tono === "claro" ? "#8fb996" : "#4a2e15";
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden="true">
      <path
        d="M2 20 Q32 -8 62 20 Q32 48 2 20 Z"
        fill="#fffdf6"
        stroke="#1f3d2b"
        strokeWidth="2"
      />
      <circle cx="32" cy="20" r="11" fill={iris} />
      <circle cx="32" cy="20" r="5.5" fill="#1f3d2b" />
      <circle cx="35.5" cy="16.5" r="2.2" fill="#fffdf6" opacity="0.85" />
    </svg>
  );
}

// Bola de cristal del oráculo: dentro se asoma el bosque.
export function BolaCristal({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="28" r="24" fill="#8FB996" opacity="0.16" />
      <circle cx="32" cy="28" r="19" fill="#BCD9C4" />
      <circle cx="32" cy="28" r="19" fill="#DCEEE2" opacity="0.55" />
      {/* champiñón que se ve en la visión */}
      <path d="M25 34c0-4.5 3.2-8 7-8s7 3.5 7 8Z" fill="#C0392B" />
      <circle cx="29" cy="30.5" r="1.2" fill="#F6F3E7" opacity="0.85" />
      <circle cx="35" cy="32" r="1" fill="#F6F3E7" opacity="0.85" />
      <rect x="30" y="34" width="4" height="6" rx="1.6" fill="#F6F3E7" />
      {/* brillo del vidrio */}
      <circle cx="25" cy="20" r="5" fill="#FFFDF6" opacity="0.8" />
      <circle cx="40" cy="36" r="2.5" fill="#FFFDF6" opacity="0.4" />
      {/* base de madera */}
      <path d="M20 47h24l-3.5 9H23.5Z" fill="#7A5230" />
      <ellipse cx="32" cy="47" rx="12.5" ry="3" fill="#5D3E24" />
      {/* destellos */}
      <path d="M50 10l1.3 3.2 3.2 1.3-3.2 1.3-1.3 3.2-1.3-3.2-3.2-1.3 3.2-1.3Z" fill="#F5D76E" />
      <path d="M12 16l0.9 2.2 2.2 0.9-2.2 0.9-0.9 2.2-0.9-2.2-2.2-0.9 2.2-0.9Z" fill="#F5D76E" opacity="0.8" />
    </svg>
  );
}

export function Luna({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="30" cy="32" r="26" fill="#F5D76E" opacity="0.14" />
      <mask id="luna-sombra">
        <rect width="64" height="64" fill="#fff" />
        <circle cx="42" cy="25" r="19" fill="#000" />
      </mask>
      <circle cx="30" cy="32" r="21" fill="#F5D76E" mask="url(#luna-sombra)" />
    </svg>
  );
}

// Cielo estrellado decorativo; las estrellas titilan con la clase .luciernaga.
export function Estrellas({ className = "" }: { className?: string }) {
  const estrellas = [
    { x: 14, y: 18, r: 1.6, d: "0s" },
    { x: 38, y: 9, r: 1.1, d: "1.4s" },
    { x: 62, y: 22, r: 1.8, d: "0.6s" },
    { x: 90, y: 12, r: 1.2, d: "2.1s" },
    { x: 118, y: 26, r: 1.5, d: "0.9s" },
    { x: 146, y: 8, r: 1.1, d: "1.8s" },
    { x: 170, y: 20, r: 1.7, d: "0.3s" },
    { x: 188, y: 38, r: 1.2, d: "2.4s" },
    { x: 26, y: 44, r: 1.1, d: "1.1s" },
    { x: 78, y: 48, r: 1.4, d: "1.9s" },
    { x: 132, y: 52, r: 1.1, d: "0.5s" },
    { x: 160, y: 64, r: 1.3, d: "2.7s" },
  ];
  return (
    <svg
      viewBox="0 0 200 80"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMin slice"
    >
      {estrellas.map((e) => (
        <circle
          key={`${e.x}-${e.y}`}
          cx={e.x}
          cy={e.y}
          r={e.r}
          fill="#FFFDF6"
          className="luciernaga"
          style={{ animationDelay: e.d }}
        />
      ))}
      <path
        d="M104 30l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6Z"
        fill="#F5D76E"
        className="luciernaga"
        style={{ animationDelay: "1.5s" }}
      />
      <path
        d="M50 56l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2Z"
        fill="#F5D76E"
        className="luciernaga"
        style={{ animationDelay: "0.2s" }}
      />
    </svg>
  );
}

export function Camara({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="6" y="18" width="52" height="36" rx="8" fill="#2f5d3a" />
      <path d="M22 18l4-7h12l4 7" fill="#2f5d3a" />
      <circle cx="32" cy="36" r="11" fill="#F6F3E7" />
      <circle cx="32" cy="36" r="6.5" fill="#8FB996" />
      <circle cx="48" cy="26" r="3" fill="#C0392B" />
    </svg>
  );
}

export function Galeria({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="8" y="12" width="34" height="28" rx="5" fill="#7A5230" />
      <rect x="12" y="16" width="26" height="20" rx="3" fill="#F6F3E7" />
      <path d="M14 32l7-8 5 5 4-4 6 7H14Z" fill="#4b7a4a" />
      <circle cx="20" cy="22" r="2.5" fill="#C0392B" />
      <rect x="26" y="26" width="30" height="26" rx="5" fill="#2f5d3a" />
      <rect x="30" y="30" width="22" height="18" rx="3" fill="#F6F3E7" />
      <path d="M31 44l6-7 4 4 3-3 6 6H31Z" fill="#8FB996" />
    </svg>
  );
}

export function Trofeo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* asas */}
      <path
        d="M16 16H9c0 9 4 13 10 14M48 16h7c0 9-4 13-10 14"
        stroke="#7A5230"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* copa */}
      <path d="M16 12h32v10c0 10-7 16-16 16s-16-6-16-16V12Z" fill="#D8A23A" />
      <path d="M20 15h24v7c0 8-5 12-12 12s-12-4-12-12v-7Z" fill="#E8C46A" />
      {/* estrella */}
      <path
        d="M32 19l2.2 4.5 5 .7-3.6 3.5.9 5L32 30.4 27.5 32.7l.9-5-3.6-3.5 5-.7L32 19Z"
        fill="#fffdf6"
      />
      {/* base */}
      <rect x="28" y="38" width="8" height="8" fill="#7A5230" />
      <rect x="20" y="46" width="24" height="6" rx="2" fill="#5d3e24" />
    </svg>
  );
}

export function Luciernagas({ className = "" }: { className?: string }) {
  const puntos = [
    { x: 12, y: 18, d: "0s" },
    { x: 30, y: 8, d: "0.9s" },
    { x: 50, y: 20, d: "1.7s" },
    { x: 70, y: 10, d: "0.4s" },
    { x: 88, y: 22, d: "1.2s" },
  ];
  return (
    <svg viewBox="0 0 100 30" className={className} aria-hidden="true">
      {puntos.map((p) => (
        <circle
          key={`${p.x}-${p.y}`}
          cx={p.x}
          cy={p.y}
          r="2.2"
          fill="#F5D76E"
          className="luciernaga"
          style={{ animationDelay: p.d }}
        />
      ))}
    </svg>
  );
}

// Escena del hero: colinas del bosque con árboles y un gran champiñón.
export function EscenaBosque({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 320"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMax slice"
    >
      {/* colinas lejanas */}
      <path
        d="M0 200 Q 150 130 320 185 T 800 175 V 320 H 0 Z"
        fill="#8FB996"
        opacity="0.55"
      />
      {/* árboles lejanos */}
      {[90, 200, 340, 520, 660, 760].map((x, i) => (
        <g key={x} opacity="0.5">
          <path
            d={`M${x} ${190 - (i % 3) * 12} l 26 58 h -52 Z`}
            fill="#4b7a4a"
          />
          <rect x={x - 4} y={240 - (i % 3) * 12} width="8" height="16" fill="#7A5230" />
        </g>
      ))}
      {/* colina media */}
      <path
        d="M0 245 Q 200 190 420 235 T 800 230 V 320 H 0 Z"
        fill="#4b7a4a"
        opacity="0.8"
      />
      {/* árboles cercanos */}
      {[40, 460, 600, 730].map((x, i) => (
        <g key={x}>
          <path d={`M${x} ${198 + (i % 2) * 10} l 34 76 h -68 Z`} fill="#2f5d3a" />
          <path d={`M${x} ${172 + (i % 2) * 10} l 27 56 h -54 Z`} fill="#2f5d3a" />
          <rect x={x - 6} y={268 + (i % 2) * 10} width="12" height="22" fill="#7A5230" />
        </g>
      ))}
      {/* pradera frontal */}
      <path
        d="M0 290 Q 250 258 500 285 T 800 282 V 320 H 0 Z"
        fill="#1f3d2b"
      />
      {/* gran champiñón protagonista */}
      <g className="anima-flota" style={{ transformOrigin: "190px 280px" }}>
        <path
          d="M168 268c0-5 4-9 9-9h28c5 0 9 4 9 9l-4 24c-1 4-4 6-8 6h-22c-4 0-7-2-8-6l-4-24Z"
          fill="#F1E4C8"
        />
        <path
          d="M191 196c-30 0-52 23-52 50 0 7 5 13 13 13h78c8 0 13-6 13-13 0-27-22-50-52-50Z"
          fill="#C0392B"
        />
        <circle cx="165" cy="230" r="8" fill="#F6F3E7" />
        <circle cx="195" cy="215" r="6" fill="#F6F3E7" />
        <circle cx="220" cy="237" r="9" fill="#F6F3E7" />
      </g>
      {/* champiñones pequeños */}
      <g>
        <path d="M560 282c0-3 2-5 5-5h12c3 0 5 2 5 5l-2 13c0 2-2 4-4 4h-10c-2 0-4-2-4-4l-2-13Z" fill="#F1E4C8" />
        <path d="M571 252c-13 0-23 10-23 22 0 3 2 6 6 6h34c4 0 6-3 6-6 0-12-10-22-23-22Z" fill="#C0392B" />
        <circle cx="562" cy="266" r="3.5" fill="#F6F3E7" />
        <circle cx="580" cy="262" r="3" fill="#F6F3E7" />
      </g>
      {/* luciérnagas */}
      {[
        { x: 320, y: 160, d: "0s" },
        { x: 420, y: 120, d: "1.1s" },
        { x: 510, y: 175, d: "0.5s" },
        { x: 640, y: 140, d: "1.8s" },
        { x: 110, y: 150, d: "0.8s" },
        { x: 720, y: 190, d: "1.4s" },
      ].map((p) => (
        <circle
          key={`${p.x}-${p.y}`}
          cx={p.x}
          cy={p.y}
          r="3.5"
          fill="#F5D76E"
          className="luciernaga"
          style={{ animationDelay: p.d }}
        />
      ))}
    </svg>
  );
}
