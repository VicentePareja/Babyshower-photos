import type { ConfigJuego, Pregunta, Respuesta } from "./tipos";
import { coincide } from "./normalizar";

export interface Evaluacion {
  correcto: boolean; // ¿cuenta como acierto pleno? (extiende la racha)
  fraccion: number; // 0..1, qué tan buena fue la respuesta
}

export interface ResultadoPuntaje extends Evaluacion {
  puntos: number;
  rachaNueva: number;
}

// Factor de velocidad estilo Kahoot: responder al instante = 1.0,
// responder justo al vencer el tiempo = 0.5. Nunca baja de 0.5.
export function factorVelocidad(ms: number, timerMs: number): number {
  if (timerMs <= 0) return 1;
  const t = Math.min(Math.max(ms, 0), timerMs);
  return 1 - 0.5 * (t / timerMs);
}

export function multiplicadorRacha(racha: number, mults: number[]): number {
  if (racha <= 0 || mults.length === 0) return 1;
  return mults[Math.min(racha - 1, mults.length - 1)] ?? 1;
}

// Evalúa correctitud sin tiempo ni racha: pura comparación respuesta vs pregunta.
export function evaluar(
  pregunta: Pregunta,
  respuesta: Respuesta | null | undefined,
  config: ConfigJuego
): Evaluacion {
  if (!respuesta) return { correcto: false, fraccion: 0 };

  switch (pregunta.tipo) {
    case "opcion": {
      if (respuesta.tipo !== "opcion") return { correcto: false, fraccion: 0 };
      const ok = (pregunta.correctas ?? []).includes(respuesta.opcion);
      return { correcto: ok, fraccion: ok ? 1 : 0 };
    }
    case "multiple": {
      if (respuesta.tipo !== "multiple")
        return { correcto: false, fraccion: 0 };
      const correctas = new Set(pregunta.correctas ?? []);
      const sel = new Set(respuesta.opciones ?? []);
      if (correctas.size === 0) return { correcto: false, fraccion: 0 };
      let aciertos = 0;
      let errores = 0;
      for (const id of sel) {
        if (correctas.has(id)) aciertos++;
        else errores++;
      }
      // Proporcional: cada correcta suma, cada incorrecta resta. Nunca < 0.
      const fraccion = Math.max(0, (aciertos - errores) / correctas.size);
      const correcto = aciertos === correctas.size && errores === 0;
      return { correcto, fraccion };
    }
    case "slider": {
      if (respuesta.tipo !== "slider") return { correcto: false, fraccion: 0 };
      const min = pregunta.min ?? 0;
      const max = pregunta.max ?? 100;
      const objetivo = pregunta.correcto ?? 0;
      const valor = Math.min(Math.max(respuesta.valor, min), max);
      const dist = Math.abs(valor - objetivo);
      const span = Math.max(1, (max - min) * config.sliderToleranciaPct);
      const fraccion = Math.max(0, 1 - dist / span);
      return { correcto: dist === 0, fraccion };
    }
    case "texto": {
      if (respuesta.tipo !== "texto") return { correcto: false, fraccion: 0 };
      const ok = coincide(respuesta.texto, pregunta.aceptadas ?? []);
      return { correcto: ok, fraccion: ok ? 1 : 0 };
    }
    default:
      return { correcto: false, fraccion: 0 };
  }
}

// Calcula puntaje final combinando correctitud, velocidad y racha.
export function calcularPuntaje(
  pregunta: Pregunta,
  respuesta: Respuesta | null | undefined,
  ms: number,
  rachaPrevia: number,
  config: ConfigJuego
): ResultadoPuntaje {
  const { correcto, fraccion } = evaluar(pregunta, respuesta, config);

  // Preguntas sin puntaje (bienvenida) no afectan racha ni marcador.
  if (pregunta.puntaje <= 0 || pregunta.tipo === "bienvenida") {
    return { correcto: false, fraccion: 0, puntos: 0, rachaNueva: rachaPrevia };
  }

  if (fraccion <= 0) {
    return { correcto: false, fraccion: 0, puntos: 0, rachaNueva: 0 };
  }

  const velocidad = factorVelocidad(ms, pregunta.timer * 1000);
  const rachaNueva = correcto ? rachaPrevia + 1 : 0;
  // El bonus de racha solo aplica a aciertos plenos.
  const mult = correcto
    ? multiplicadorRacha(rachaNueva, config.multiplicadores)
    : 1;
  const puntos = Math.round(pregunta.puntaje * fraccion * velocidad * mult);

  return { correcto, fraccion, puntos, rachaNueva };
}
