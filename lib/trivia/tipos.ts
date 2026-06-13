// Tipos compartidos de la trivia "Competencia del Baby Shower de Meli y Vicente".
// Las preguntas viven como datos (seed editable + copia en la BD), nunca en la lógica.

export type TipoPregunta =
  | "bienvenida" // diapositiva sin puntaje
  | "opcion" // una sola respuesta (incluye verdadero/falso si tiene 2 opciones)
  | "multiple" // varias respuestas correctas, puntaje proporcional
  | "slider" // valor en un rango, puntaje por cercanía
  | "texto"; // respuesta corta con match flexible

export type EstadoJuego =
  | "cerrado" // nadie puede entrar
  | "lobby" // jugadores entrando, esperando inicio
  | "pregunta" // pregunta activa, cronómetro corriendo
  | "revelado" // se muestran respuestas correctas y ranking
  | "pausa" // cronómetro congelado
  | "podio"; // fin del juego, top 3

// Figuras del bosque para las 4 alternativas (forma + color consistentes
// entre host y celular). Se asignan por posición de la opción.
export const FIGURAS = ["hongo", "hoja", "bellota", "seta"] as const;
export type Figura = (typeof FIGURAS)[number];

export interface OpcionPregunta {
  id: string; // "a" | "b" | "c" | "d"
  texto: string;
}

export interface Pregunta {
  id: string;
  tipo: TipoPregunta;
  enunciado: string;
  activa: boolean;
  timer: number; // segundos
  puntaje: number; // puntaje base (0 = no puntúa, p. ej. bienvenida)
  // opcion / multiple
  opciones?: OpcionPregunta[];
  correctas?: string[]; // ids de opciones correctas
  // slider
  min?: number;
  max?: number;
  correcto?: number;
  unidad?: string;
  // texto
  aceptadas?: string[];
  // pista visual opcional
  subtitulo?: string;
}

// Versión que viaja al cliente: sin respuestas correctas (anti-trampa).
export type PreguntaPublica = Omit<
  Pregunta,
  "correctas" | "correcto" | "aceptadas"
>;

export interface ConfigJuego {
  timerDefault: number;
  puntajeBase: number;
  // multiplicador de racha indexado por min(racha-1, len-1).
  // [1, 1.25, 1.5, 1.75, 2] => 1ra correcta x1, 2da x1.25, ... tope x2.
  multiplicadores: number[];
  // fracción del rango sobre la que el puntaje del slider decae a 0.
  sliderToleranciaPct: number;
  sonidos: boolean;
  animaciones: boolean;
}

export const CONFIG_DEFAULT: ConfigJuego = {
  timerDefault: 20,
  puntajeBase: 1000,
  multiplicadores: [1, 1.25, 1.5, 1.75, 2],
  sliderToleranciaPct: 0.5,
  sonidos: true,
  animaciones: true,
};

export interface Jugador {
  id: string;
  nombre: string;
  puntaje: number;
  racha: number;
  mejor_racha: number;
  conectado: boolean;
  expulsado: boolean;
}

// Respuesta que envía el jugador. La forma depende del tipo de pregunta.
export type Respuesta =
  | { tipo: "opcion"; opcion: string }
  | { tipo: "multiple"; opciones: string[] }
  | { tipo: "slider"; valor: number }
  | { tipo: "texto"; texto: string };

export interface FilaRanking {
  id: string;
  nombre: string;
  puntaje: number;
  racha: number;
  puesto: number;
}
