/**
 * ALDO chef LUGO — vectoriza el logotipo y el isotipo desde los PNG del cliente.
 *
 * Fuente: 01_Marca/Logo Aldo Lugo (original)/ALDO/ALDO LUGO/{LOGOTIPO,ISOTIPO}/PNG/ (negro sobre transparente),
 * copiados en ./originales. No hay SVG del .ai a la mano (no hay Illustrator ni Inkscape en la máquina),
 * así que se traza con potrace. La erosión de sello del logo ES la marca: se conserva (turdSize bajo).
 *
 * Uso (desde la raíz del repo):  node src/aldo-lugo/brand-src/trace.mjs
 *
 * Escribe:
 *   public/aldo-lugo/brand/aldo-logotipo.svg   "ALDO chef LUGO", fill=currentColor
 *   public/aldo-lugo/brand/aldo-isotipo.svg    "A.L", fill=currentColor
 *   public/aldo-lugo/brand/favicon.svg         isotipo hueso sobre carbón
 *   public/aldo-lugo/brand/favicon-48.png, apple-touch-icon.png (180)
 *   public/aldo-lugo/og.jpg                    solo si no existe (marcador hasta que llegue el OG con F019)
 *   src/aldo-lugo/logos.ts                     trazos para el sprite inline del layout
 * Y la verificación: brand-src/verificacion/*.png + IoU contra el PNG original (en consola).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import potrace from 'potrace';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const MODULO = path.resolve(AQUI, '..');
const RAIZ = path.resolve(AQUI, '../../..');
const PUB = path.join(RAIZ, 'public/aldo-lugo');
const BRAND = path.join(PUB, 'brand');
const VERIF = path.join(AQUI, 'verificacion');
fs.mkdirSync(BRAND, { recursive: true });
fs.mkdirSync(VERIF, { recursive: true });

const CARBON = '#141414';
const HUESO = '#EDE6D6';
const SELLO = '#E3120B';

/** escala: se traza a la mitad del PNG (1384 px de ancho el logotipo): sobra para mostrarlo a ≤ 600 px. */
const PIEZAS = {
  logotipo: { archivo: 'originales/ALDO_LOGOTIPO-negro.png', escala: 0.5, turdSize: 6, titulo: 'ALDO chef LUGO' },
  isotipo: { archivo: 'originales/ALDO_ISOTIPO-negro.png', escala: 0.5, turdSize: 6, titulo: 'A.L' },
};
const OPCIONES = { threshold: 128, optCurve: true, optTolerance: 0.9, alphaMax: 1.0 };

/** Negro sobre blanco, reducido y recortado al contenido. Devuelve el PNG y sus medidas. */
async function preparar(archivo, escala) {
  const plano = await sharp(path.join(AQUI, archivo)).flatten({ background: '#ffffff' }).greyscale().png().toBuffer();
  const meta = await sharp(plano).metadata();
  const reducido = await sharp(plano).resize({ width: Math.round(meta.width * escala), kernel: 'lanczos3' }).png().toBuffer();
  const { data, info } = await sharp(reducido).trim({ background: '#ffffff', threshold: 40 }).png().toBuffer({ resolveWithObject: true });
  return { png: data, w: info.width, h: info.height };
}

const trazar = (buf, turdSize) =>
  new Promise((res, rej) => potrace.trace(buf, { ...OPCIONES, turdSize }, (e, svg) => (e ? rej(e) : res(svg))));

/**
 * potrace entrega M/L/C absolutos con decimales. Se redondean los absolutos a enteros y se reescriben
 * como relativos (m/l/c) calculados desde los absolutos ya redondeados: sin error acumulado y ~40 % menos peso.
 */
function compactar(d) {
  const tokens = d.match(/[MLCZmlcz]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  let i = 0, cx = 0, cy = 0, sx = 0, sy = 0, cmd = '', ultimo = '', out = '';
  const num = () => Math.round(parseFloat(tokens[i++]));
  // Repite la letra solo si cambia el comando; entre números, espacio salvo que el signo separe.
  const emitir = (letra, arr) => {
    const nums = arr.map((n, k) => (k === 0 || n < 0 ? String(n) : ' ' + n)).join('');
    if (letra !== ultimo || letra === 'm') out += letra + nums;
    else out += (arr[0] < 0 ? '' : ' ') + nums;
    ultimo = letra;
  };
  while (i < tokens.length) {
    const t = tokens[i];
    if (/[MLCZmlcz]/.test(t)) { cmd = t; i++; if (cmd === 'Z' || cmd === 'z') { out += 'z'; ultimo = 'z'; cx = sx; cy = sy; continue; } }
    if (cmd === 'M') { const x = num(), y = num(); emitir('m', [x - cx, y - cy]); cx = sx = x; cy = sy = y; cmd = 'L'; }
    else if (cmd === 'L') { const x = num(), y = num(); emitir('l', [x - cx, y - cy]); cx = x; cy = y; }
    else if (cmd === 'C') {
      const p = [num(), num(), num(), num(), num(), num()];
      emitir('c', [p[0] - cx, p[1] - cy, p[2] - cx, p[3] - cy, p[4] - cx, p[5] - cy]);
      cx = p[4]; cy = p[5];
    } else throw new Error('Comando inesperado en la salida de potrace: ' + cmd);
  }
  // La primera m es relativa a (0,0), así que equivale a una M absoluta.
  return out;
}

const svgArchivo = (vb, cuerpo, titulo) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${titulo}"><title>${titulo}</title>${cuerpo}</svg>\n`;

const resultado = {};
for (const [nombre, p] of Object.entries(PIEZAS)) {
  const { png, w, h } = await preparar(p.archivo, p.escala);
  const svg = await trazar(png, p.turdSize);
  const crudo = [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).join(' ');
  const d = compactar(crudo);
  resultado[nombre] = { w, h, d, titulo: p.titulo, png };
  const cuerpo = `<path fill="currentColor" fill-rule="evenodd" d="${d}"/>`;
  fs.writeFileSync(path.join(BRAND, `aldo-${nombre}.svg`), svgArchivo(`0 0 ${w} ${h}`, cuerpo, p.titulo));
}

// ---- favicon: el isotipo en hueso sobre carbón, centrado en un cuadro de 64 ----
const iso = resultado.isotipo;
const icono = (lado, radio, margen) => {
  const s = (lado - margen * 2) / iso.w;
  const tx = (lado - iso.w * s) / 2, ty = (lado - iso.h * s) / 2;
  return `<rect width="${lado}" height="${lado}" rx="${radio}" fill="${CARBON}"/>` +
    `<path transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})" fill="${HUESO}" fill-rule="evenodd" d="${iso.d}"/>`;
};
fs.writeFileSync(path.join(BRAND, 'favicon.svg'), svgArchivo('0 0 64 64', icono(64, 12, 7), 'Aldo Lugo'));
// iOS recorta sus propias esquinas: el PNG va a sangre (sin radio) y con más aire.
const touch = svgArchivo('0 0 180 180', icono(180, 0, 34), 'Aldo Lugo');
await sharp(Buffer.from(touch), { density: 300 }).resize(180, 180).png().toFile(path.join(BRAND, 'apple-touch-icon.png'));
await sharp(Buffer.from(svgArchivo('0 0 64 64', icono(64, 12, 7), 'Aldo Lugo')), { density: 300 }).resize(48, 48).png().toFile(path.join(BRAND, 'favicon-48.png'));

// ---- OG provisional (1200×630): solo si todavía no existe el bueno ----
const og = path.join(PUB, 'og.jpg');
if (!fs.existsSync(og)) {
  const L = resultado.logotipo, s = 820 / L.w;
  const cuerpo = `<rect width="1200" height="630" fill="${CARBON}"/>` +
    `<path transform="translate(${((1200 - L.w * s) / 2).toFixed(1)} ${((630 - L.h * s) / 2 - 20).toFixed(1)}) scale(${s.toFixed(5)})" fill="${HUESO}" fill-rule="evenodd" d="${L.d}"/>` +
    `<rect x="560" y="${(630 + L.h * s) / 2 + 28}" width="80" height="4" fill="${SELLO}"/>`;
  await sharp(Buffer.from(svgArchivo('0 0 1200 630', cuerpo, 'ALDO chef LUGO'))).resize(1200, 630).flatten({ background: CARBON }).jpeg({ quality: 82, progressive: true }).toFile(og);
  console.log('og.jpg provisional escrito');
}

// ---- datos para el sprite inline (AldoLayout) ----
const ts = `// Generado por src/aldo-lugo/brand-src/trace.mjs — no editar a mano.
// Trazos potrace del logotipo y el isotipo; el layout los pinta como <symbol> y se usan con <Logo />.
export const LOGOTIPO = { w: ${resultado.logotipo.w}, h: ${resultado.logotipo.h}, d: ${JSON.stringify(resultado.logotipo.d)} };
export const ISOTIPO = { w: ${resultado.isotipo.w}, h: ${resultado.isotipo.h}, d: ${JSON.stringify(resultado.isotipo.d)} };
`;
fs.writeFileSync(path.join(MODULO, 'logos.ts'), ts);

// ---- verificación: rasteriza el SVG al tamaño del PNG trazado y mide IoU contra él ----
for (const [nombre, r] of Object.entries(resultado)) {
  const svg = fs.readFileSync(path.join(BRAND, `aldo-${nombre}.svg`), 'utf8').replace('currentColor', '#000');
  const ras = await sharp(Buffer.from(svg), { density: 72 }).resize(r.w, r.h).flatten({ background: '#fff' }).greyscale().raw().toBuffer();
  const ori = await sharp(r.png).greyscale().raw().toBuffer();
  let inter = 0, union = 0;
  for (let k = 0; k < ori.length; k++) { const a = ori[k] < 128, b = ras[k] < 128; if (a && b) inter++; if (a || b) union++; }
  // Lado a lado: original arriba, trazo abajo, para revisarlo a ojo.
  const ancho = r.w, alto = r.h;
  await sharp({ create: { width: ancho, height: alto * 2 + 20, channels: 3, background: '#ffffff' } })
    .composite([{ input: r.png, top: 0, left: 0 }, { input: await sharp(Buffer.from(svg), { density: 72 }).resize(r.w, r.h).flatten({ background: '#fff' }).png().toBuffer(), top: alto + 20, left: 0 }])
    .png().toFile(path.join(VERIF, `${nombre}-original-vs-svg.png`));
  const kb = (fs.statSync(path.join(BRAND, `aldo-${nombre}.svg`)).size / 1024).toFixed(1);
  console.log(`${nombre}: ${r.w}×${r.h} · ${kb} KB · IoU ${(inter / union).toFixed(4)}`);
}
for (const f of fs.readdirSync(BRAND)) console.log('  ', f, fs.statSync(path.join(BRAND, f)).size, 'B');
