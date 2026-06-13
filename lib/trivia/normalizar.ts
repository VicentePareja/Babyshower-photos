// Match flexible para respuestas cortas: ignora mayúsculas/minúsculas,
// tildes, espacios extra y signos de puntuación sueltos.
export function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes/diacríticos combinados
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ") // signos -> espacio
    .replace(/\s+/g, " ")
    .trim();
}

export function coincide(input: string, aceptadas: string[]): boolean {
  const n = normalizar(input);
  if (!n) return false;
  return aceptadas.some((a) => normalizar(a) === n);
}
