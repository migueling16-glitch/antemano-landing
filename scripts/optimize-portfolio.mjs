import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const projectsDir = 'public/images/proyectos';
const projects = fs.readdirSync(projectsDir).filter(d =>
  fs.statSync(path.join(projectsDir, d)).isDirectory()
);

let totalOrig = 0;
let totalWebp = 0;
let totalThumb = 0;
let count = 0;

for (const project of projects) {
  const dir = path.join(projectsDir, project);
  const files = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));

  console.log(`\n=== ${project} (${files.length} files) ===`);

  for (const file of files) {
    const input = path.join(dir, file);
    const base = file.replace(/\.(jpg|jpeg|png)$/i, '');
    const webpOut = path.join(dir, `${base}.webp`);
    const thumbOut = path.join(dir, `${base}-thumb.webp`);

    // Skip if already optimized (webp exists and is recent)
    if (fs.existsSync(webpOut) && fs.existsSync(thumbOut)) {
      const origMtime = fs.statSync(input).mtime;
      const webpMtime = fs.statSync(webpOut).mtime;
      if (webpMtime > origMtime) { continue; }
    }

    const origSize = fs.statSync(input).size;

    // Main gallery image — 1600px long edge, webp q82
    await sharp(input)
      .rotate() // respect EXIF orientation
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(webpOut);

    // Card thumbnail — 800px long edge, webp q78
    await sharp(input)
      .rotate()
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(thumbOut);

    const webpSize = fs.statSync(webpOut).size;
    const thumbSize = fs.statSync(thumbOut).size;
    totalOrig += origSize;
    totalWebp += webpSize;
    totalThumb += thumbSize;
    count++;

    process.stdout.write(`  ${file} ${(origSize/1024/1024).toFixed(1)}MB → ${(webpSize/1024).toFixed(0)}KB + ${(thumbSize/1024).toFixed(0)}KB\n`);
  }
}

console.log(`\n=== TOTAL ===`);
console.log(`${count} images`);
console.log(`Originals: ${(totalOrig/1024/1024).toFixed(1)}MB`);
console.log(`Optimized: ${(totalWebp/1024/1024).toFixed(1)}MB (gallery) + ${(totalThumb/1024/1024).toFixed(1)}MB (thumbs)`);
console.log(`Savings on gallery load: ${((1 - totalWebp/totalOrig)*100).toFixed(1)}%`);
