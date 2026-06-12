export type Destinatario = "bebe" | "padres";

export interface Mensaje {
  id: string;
  created_at: string;
  destinatario: Destinatario;
  autor: string | null;
  cuerpo: string;
}

export interface Foto {
  id: string;
  created_at: string;
  autor: string | null;
  ruta: string;
  caption: string | null;
}

export type Ojos = "claro" | "oscuro";

export interface Prediccion {
  id: string;
  created_at: string;
  autor: string | null;
  /** legado: el formulario ya no pregunta niño/niña */
  sexo: string | null;
  ojos: Ojos | null;
  peso_gramos: number | null;
  fecha_estimada: string | null;
  nombre_sugerido: string | null;
}

export interface ResultadoQuiniela {
  publicado: boolean;
  ojos: Ojos | null;
  peso_gramos: number | null;
  fecha_real: string | null;
}
