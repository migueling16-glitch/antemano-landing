import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const socios = ['Miguel', 'Diego', 'Victor'];
const outDir = 'public/images/socios';
fs.mkdirSync(outDir, { recursive: true });

for (const name of socios) {
  const input = `public/${name}.png`;
  if (!fs.existsSync(input)) { console.log('skip', input); continue; }

  const slug = name.toLowerCase();

  // 400x400 webp — used in the circular avatar (2x retina for ~64-128px display)
  await sharp(input)
    .resize(400, 400, { fit: 'cover', position: 'center' })
    .webp({ quality: 82 })
    .toFile(`${outDir}/${slug}.webp`);

  // 400x400 jpg fallback (in case)
  await sharp(input)
    .resize(400, 400, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
    .toFile(`${outDir}/${slug}.jpg`);

  const webpSize = fs.statSync(`${outDir}/${slug}.webp`).size;
  const jpgSize = fs.statSync(`${outDir}/${slug}.jpg`).size;
  const origSize = fs.statSync(input).size;
  console.log(`${name}: ${(origSize/1024/1024).toFixed(1)}MB → webp ${(webpSize/1024).toFixed(0)}KB / jpg ${(jpgSize/1024).toFixed(0)}KB`);
}
