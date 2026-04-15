import fs from 'fs';
import bounds from 'svg-path-bounds';

const file = 'public/logo-full.svg';
let svg = fs.readFileSync(file, 'utf8');

const paths = [...svg.matchAll(/ d="([^"]+)"/g)].map(m => m[1]);
let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
for (const d of paths) {
  const [x0,y0,x1,y1] = bounds(d);
  if (x0<minX) minX=x0; if (y0<minY) minY=y0;
  if (x1>maxX) maxX=x1; if (y1>maxY) maxY=y1;
}
const pad = 4;
const x = Math.floor(minX - pad);
const y = Math.floor(minY - pad);
const w = Math.ceil(maxX - minX + pad*2);
const h = Math.ceil(maxY - minY + pad*2);
console.log('Bounds:', x, y, w, h);

svg = svg.replace(/width="\d+"\s+height="\d+"\s+viewBox="[^"]+"/, `viewBox="${x} ${y} ${w} ${h}"`);
fs.writeFileSync(file, svg);
console.log('Tightened', file);
