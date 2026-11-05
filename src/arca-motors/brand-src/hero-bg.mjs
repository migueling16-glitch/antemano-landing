// Fondos del hero ya desenfocados y oscurecidos (antes: filter: blur() en vivo sobre una imagen a
// pantalla completa, caro en celular). Uso: node src/arca-motors/brand-src/hero-bg.mjs
// Sale public/arca-motors/autos/<folio>/bg.webp (96 px de ancho; el navegador lo escala suave).
import sharp from 'sharp';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const AUTOS = 'public/arca-motors/autos';
for (const dir of readdirSync(AUTOS)) {
  const src = join(AUTOS, dir, '01-800.webp');
  if (!existsSync(src)) continue;
  await sharp(src)
    .resize({ width: 96 })
    .blur(2.2)
    .modulate({ brightness: 0.4, saturation: 0.85 })
    .webp({ quality: 70 })
    .toFile(join(AUTOS, dir, 'bg.webp'));
  console.log(dir);
}
