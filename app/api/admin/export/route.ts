import JSZip from "jszip";
import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { Foto, Mensaje, Prediccion } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300; // las fotos pueden tardar

// "Descargar todo": ZIP con las fotos, los mensajes en JSON y una cápsula
// del tiempo en HTML lista para imprimir con los deseos para Octavio.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const [fotosRes, mensajesRes, prediccionesRes] = await Promise.all([
    supabase.from("fotos").select("*").order("created_at"),
    supabase.from("mensajes").select("*").order("created_at"),
    supabase.from("predicciones").select("*").order("created_at"),
  ]);

  if (fotosRes.error || mensajesRes.error) {
    const mensaje = fotosRes.error?.message || mensajesRes.error?.message;
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }

  const fotos = (fotosRes.data ?? []) as Foto[];
  const mensajes = (mensajesRes.data ?? []) as Mensaje[];
  const predicciones = (
    prediccionesRes.error ? [] : prediccionesRes.data ?? []
  ) as Prediccion[];

  const zip = new JSZip();
  zip.file("mensajes.json", JSON.stringify(mensajes, null, 2));
  zip.file("predicciones.json", JSON.stringify(predicciones, null, 2));
  zip.file(
    "capsula-del-tiempo.html",
    capsulaHtml(mensajes.filter((m) => m.destinatario === "bebe"))
  );

  const carpetaFotos = zip.folder("fotos")!;
  const errores: string[] = [];
  for (const foto of fotos) {
    const { data, error } = await supabase.storage
      .from("fotos")
      .download(foto.ruta);
    if (error || !data) {
      errores.push(foto.ruta);
      continue;
    }
    const nombre = foto.autor
      ? `${foto.ruta.replace(/\.[^.]+$/, "")}-${slug(foto.autor)}${ext(foto.ruta)}`
      : foto.ruta;
    carpetaFotos.file(nombre, await data.arrayBuffer());
  }
  if (errores.length) {
    zip.file(
      "fotos-no-descargadas.txt",
      `Estas fotos no se pudieron descargar del bucket:\n${errores.join("\n")}`
    );
  }

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition":
        'attachment; filename="recuerdos-bosque-de-octavio.zip"',
    },
  });
}

function ext(ruta: string): string {
  const match = ruta.match(/\.[^.]+$/);
  return match ? match[0] : "";
}

function slug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30);
}

function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function capsulaHtml(deseos: Mensaje[]): string {
  const tarjetas = deseos
    .map(
      (d) => `
      <article>
        <p class="cuerpo">${escapeHtml(d.cuerpo).replace(/\n/g, "<br/>")}</p>
        <p class="autor">${escapeHtml(d.autor || "Alguien que te quiere")}</p>
        <p class="fecha">${new Date(d.created_at).toLocaleDateString("es-CL", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}</p>
      </article>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Cápsula del tiempo · Deseos para Octavio</title>
<style>
  body { font-family: Georgia, serif; background: #F6F3E7; color: #1f3d2b; max-width: 720px; margin: 0 auto; padding: 48px 24px; }
  h1 { text-align: center; color: #2f5d3a; }
  .intro { text-align: center; color: #7A5230; margin-bottom: 40px; }
  article { background: #fffdf6; border-radius: 16px; padding: 24px; margin-bottom: 20px; box-shadow: 0 6px 18px rgba(31,61,43,.12); page-break-inside: avoid; }
  .cuerpo { font-size: 17px; line-height: 1.6; margin: 0; }
  .autor { font-weight: bold; color: #7A5230; margin: 12px 0 0; }
  .fecha { color: #8FB996; font-size: 13px; margin: 4px 0 0; }
</style>
</head>
<body>
<h1>Deseos para Octavio</h1>
<p class="intro">Escritos en tu baby shower, para que los leas cuando crezcas.</p>
${tarjetas || "<p class='intro'>Aún no hay deseos guardados.</p>"}
</body>
</html>`;
}
