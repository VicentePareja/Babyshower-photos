import { test, expect, describe } from "bun:test";
import {
  calcularPuntaje,
  evaluar,
  factorVelocidad,
  multiplicadorRacha,
} from "./puntaje";
import { CONFIG_DEFAULT, type Pregunta } from "./tipos";
import { coincide, normalizar } from "./normalizar";

const cfg = CONFIG_DEFAULT;

const opcion: Pregunta = {
  id: "q",
  tipo: "opcion",
  enunciado: "?",
  activa: true,
  timer: 20,
  puntaje: 1000,
  opciones: [
    { id: "a", texto: "A" },
    { id: "b", texto: "B" },
    { id: "c", texto: "C" },
    { id: "d", texto: "D" },
  ],
  correctas: ["d"],
};

describe("factorVelocidad", () => {
  test("instantáneo = 1", () => {
    expect(factorVelocidad(0, 20000)).toBe(1);
  });
  test("al límite = 0.5", () => {
    expect(factorVelocidad(20000, 20000)).toBeCloseTo(0.5);
  });
  test("mitad de tiempo = 0.75", () => {
    expect(factorVelocidad(10000, 20000)).toBeCloseTo(0.75);
  });
  test("nunca baja de 0.5 aunque se pase", () => {
    expect(factorVelocidad(99999, 20000)).toBe(0.5);
  });
});

describe("multiplicadorRacha", () => {
  test("racha 0 o 1 no da bonus", () => {
    expect(multiplicadorRacha(0, cfg.multiplicadores)).toBe(1);
    expect(multiplicadorRacha(1, cfg.multiplicadores)).toBe(1);
  });
  test("racha sube y topea", () => {
    expect(multiplicadorRacha(2, cfg.multiplicadores)).toBe(1.25);
    expect(multiplicadorRacha(5, cfg.multiplicadores)).toBe(2);
    expect(multiplicadorRacha(99, cfg.multiplicadores)).toBe(2);
  });
});

describe("opción múltiple (1 correcta)", () => {
  test("correcta da puntos", () => {
    const r = calcularPuntaje(
      opcion,
      { tipo: "opcion", opcion: "d" },
      0,
      0,
      cfg
    );
    expect(r.correcto).toBe(true);
    expect(r.puntos).toBe(1000);
    expect(r.rachaNueva).toBe(1);
  });
  test("incorrecta da 0 y rompe racha", () => {
    const r = calcularPuntaje(
      opcion,
      { tipo: "opcion", opcion: "a" },
      0,
      3,
      cfg
    );
    expect(r.correcto).toBe(false);
    expect(r.puntos).toBe(0);
    expect(r.rachaNueva).toBe(0);
  });
  test("velocidad reduce puntos", () => {
    const r = calcularPuntaje(
      opcion,
      { tipo: "opcion", opcion: "d" },
      20000,
      0,
      cfg
    );
    expect(r.puntos).toBe(500); // 1000 * 0.5 * x1
  });
  test("racha aplica multiplicador", () => {
    // racha previa 1 -> nueva 2 -> x1.25, instantáneo
    const r = calcularPuntaje(
      opcion,
      { tipo: "opcion", opcion: "d" },
      0,
      1,
      cfg
    );
    expect(r.rachaNueva).toBe(2);
    expect(r.puntos).toBe(1250);
  });
});

describe("selección múltiple (proporcional)", () => {
  const multi: Pregunta = {
    id: "q4",
    tipo: "multiple",
    enunciado: "?",
    activa: true,
    timer: 20,
    puntaje: 1000,
    opciones: [
      { id: "a", texto: "0-28d" },
      { id: "b", texto: "+1m" },
      { id: "c", texto: "+2m" },
      { id: "d", texto: "+3m" },
    ],
    correctas: ["a", "d"],
  };
  test("ambas correctas = 100% y racha", () => {
    const r = calcularPuntaje(
      multi,
      { tipo: "multiple", opciones: ["a", "d"] },
      0,
      0,
      cfg
    );
    expect(r.fraccion).toBe(1);
    expect(r.correcto).toBe(true);
    expect(r.puntos).toBe(1000);
  });
  test("una sola correcta = 50%, sin racha", () => {
    const r = calcularPuntaje(
      multi,
      { tipo: "multiple", opciones: ["a"] },
      0,
      0,
      cfg
    );
    expect(r.fraccion).toBeCloseTo(0.5);
    expect(r.correcto).toBe(false);
    expect(r.puntos).toBe(500);
    expect(r.rachaNueva).toBe(0);
  });
  test("una correcta y una incorrecta se cancelan", () => {
    const r = calcularPuntaje(
      multi,
      { tipo: "multiple", opciones: ["a", "b"] },
      0,
      0,
      cfg
    );
    expect(r.fraccion).toBe(0);
    expect(r.puntos).toBe(0);
  });
});

describe("slider (cercanía)", () => {
  const slider: Pregunta = {
    id: "q5",
    tipo: "slider",
    enunciado: "?",
    activa: true,
    timer: 20,
    puntaje: 1000,
    min: 0,
    max: 44,
    correcto: 35,
  };
  test("exacto = máximo y cuenta como correcto", () => {
    const r = calcularPuntaje(
      slider,
      { tipo: "slider", valor: 35 },
      0,
      0,
      cfg
    );
    expect(r.fraccion).toBe(1);
    expect(r.correcto).toBe(true);
    expect(r.puntos).toBe(1000);
  });
  test("cerca da puntaje parcial, sin racha", () => {
    const r = calcularPuntaje(
      slider,
      { tipo: "slider", valor: 30 },
      0,
      0,
      cfg
    );
    expect(r.fraccion).toBeGreaterThan(0);
    expect(r.fraccion).toBeLessThan(1);
    expect(r.correcto).toBe(false);
  });
  test("muy lejos = 0", () => {
    const r = evaluar(slider, { tipo: "slider", valor: 0 }, cfg);
    expect(r.fraccion).toBe(0);
  });
});

describe("texto (match flexible)", () => {
  const texto: Pregunta = {
    id: "q14",
    tipo: "texto",
    enunciado: "?",
    activa: true,
    timer: 20,
    puntaje: 1000,
    aceptadas: ["Shirley"],
  };
  test("acepta variantes de mayúsculas, tildes y espacios", () => {
    for (const v of ["shirley", "  SHIRLEY ", "Shírley"]) {
      const r = calcularPuntaje(texto, { tipo: "texto", texto: v }, 0, 0, cfg);
      expect(r.correcto).toBe(true);
    }
  });
  test("rechaza otra cosa", () => {
    const r = calcularPuntaje(
      texto,
      { tipo: "texto", texto: "Maria" },
      0,
      0,
      cfg
    );
    expect(r.correcto).toBe(false);
    expect(r.puntos).toBe(0);
  });
});

describe("bienvenida no puntúa", () => {
  test("nunca da puntos ni rompe racha", () => {
    const bienvenida: Pregunta = {
      id: "q1",
      tipo: "bienvenida",
      enunciado: "Bienvenidos",
      activa: true,
      timer: 0,
      puntaje: 0,
    };
    const r = calcularPuntaje(bienvenida, null, 0, 4, cfg);
    expect(r.puntos).toBe(0);
    expect(r.rachaNueva).toBe(4);
  });
});

describe("normalizar / coincide", () => {
  test("normaliza tildes y caso", () => {
    expect(normalizar("Shírley ")).toBe("shirley");
  });
  test("coincide flexible", () => {
    expect(coincide("  shirley", ["Shirley"])).toBe(true);
    expect(coincide("shirly", ["Shirley"])).toBe(false);
  });
});
