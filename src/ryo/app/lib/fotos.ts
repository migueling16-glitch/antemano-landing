/**
 * Evidencia fotográfica: comprimir en el teléfono, sellar y guardar.
 *
 * La foto se reduce a 1600 px por lado y JPEG al 72 %, que deja una foto de
 * barra en ~150–300 KB. El sello (sucursal, fecha, hora, quién) se dibuja
 * sobre la imagen: queda visible aunque la foto se comparta sola.
 *
 * En la maqueta se guarda en IndexedDB del teléfono. En el sistema real esta
 * misma cola es la que espera a que vuelva la red para subir.
 */

const LADO_MAX = 1600;
const CALIDAD = 0.72;
const CAFE = '#302413';
const CHAMPAGNE = '#f8f3d1';

export type FotoProcesada = {
  blob: Blob;
  url: string;
  bytes: number;
  bytesOriginal: number;
  ancho: number;
  alto: number;
};

async function cargarImagen(archivo: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // La imagen ya decodificada no necesita el URL.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function procesarFoto(archivo: File, sello: string[]): Promise<FotoProcesada> {
  const img = await cargarImagen(archivo);
  const escala = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const ancho = Math.round(img.naturalWidth * escala);
  const alto = Math.round(img.naturalHeight * escala);

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d')!;
  ctx.drawImage(img, 0, 0, ancho, alto);

  // Sello: banda de color plano abajo, texto en JetBrains Mono.
  const tam = Math.max(14, Math.round(ancho * 0.026));
  const lineas = sello.length;
  const banda = Math.round(tam * (1.6 * lineas + 0.9));
  try { await document.fonts.load(`${tam}px "JetBrains Mono"`); } catch {}
  ctx.fillStyle = CAFE;
  ctx.fillRect(0, alto - banda, ancho, banda);
  ctx.fillStyle = CHAMPAGNE;
  ctx.font = `${tam}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textBaseline = 'top';
  sello.forEach((linea, i) => {
    ctx.fillText(linea.toUpperCase(), Math.round(tam * 0.9), alto - banda + Math.round(tam * (0.5 + i * 1.6)));
  });

  const blob: Blob = await new Promise((res, rej) =>
    lienzo.toBlob((b) => (b ? res(b) : rej(new Error('No se pudo comprimir'))), 'image/jpeg', CALIDAD),
  );
  return { blob, url: URL.createObjectURL(blob), bytes: blob.size, bytesOriginal: archivo.size, ancho, alto };
}

export const kb = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

/* ── IndexedDB mínima ─────────────────────────────────────── */
let db: Promise<IDBDatabase> | null = null;
function abrir(): Promise<IDBDatabase> {
  db ??= new Promise((res, rej) => {
    const r = indexedDB.open('ryo-app', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('fotos');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return db;
}

export async function guardarFoto(id: string, blob: Blob) {
  const base = await abrir();
  await new Promise<void>((res, rej) => {
    const tx = base.transaction('fotos', 'readwrite');
    tx.objectStore('fotos').put(blob, id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

/** La foto como quedó en este teléfono (sin ir a la red). */
export async function leerFotoLocal(id: string): Promise<Blob | undefined> {
  const base = await abrir();
  return new Promise((res) => {
    const r = base.transaction('fotos').objectStore('fotos').get(id);
    r.onsuccess = () => res(r.result as Blob | undefined);
    r.onerror = () => res(undefined);
  });
}

/** Con el equipo real conectado, una foto que tomó otro teléfono se baja de Storage (nube/sync.ts). */
let remota: ((id: string) => Promise<Blob | undefined>) | null = null;
export const usarFotosRemotas = (fn: typeof remota) => { remota = fn; };

export async function leerFoto(id: string): Promise<Blob | undefined> {
  const local = await leerFotoLocal(id).catch(() => undefined);
  return local ?? (remota ? remota(id).catch(() => undefined) : undefined);
}

export async function borrarFotos() {
  try {
    const base = await abrir();
    base.transaction('fotos', 'readwrite').objectStore('fotos').clear();
  } catch {}
}
