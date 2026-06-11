const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.82;

// Redimensiona la imagen en el cliente (lado largo máx 1600px) y la
// recodifica a JPEG para que suba rápido con la red lenta del evento.
// Si algo falla (formato raro, canvas bloqueado), devuelve el archivo original.
export async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await loadBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    if ("close" in bitmap) bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) return file;
    // Si la "compresión" salió más pesada que el original, usa el original.
    return blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      // imageOrientation respeta el EXIF (fotos de celular giradas).
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // cae al método clásico
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}
