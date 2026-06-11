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

export interface Prediccion {
  id: string;
  created_at: string;
  autor: string | null;
  sexo: string | null;
  peso_gramos: number | null;
  fecha_estimada: string | null;
  nombre_sugerido: string | null;
}
