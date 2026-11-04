import sharp from 'file:///C:/Users/migue/Sandbox/WEB ANTEMNO/node_modules/sharp/lib/index.js';
const B = 'C:/Users/migue/Sandbox/WEB ANTEMNO/public/arca-motors/brand/';
const r = (f, w, out, bg) => { let s = sharp(B+f, {density: 600}).resize(w); if (bg) s = s.flatten({background: bg}); return s.png().toFile(B+out); };
await r('arca-logo-dark.svg', 2400, 'arca-logo-dark.png');
await r('arca-logo-light.svg', 2400, 'arca-logo-light.png');
await r('arca-wordmark-dark.svg', 2400, 'arca-wordmark-dark.png');
await r('arca-wordmark-light.svg', 2400, 'arca-wordmark-light.png');
await r('arca-icon.svg', 1080, 'arca-icon-1080.png');
await r('arca-icon.svg', 512, 'arca-icon-512.png');
await r('arca-icon.svg', 180, 'apple-touch-icon.png');
await r('arca-favicon.svg', 48, 'favicon-48.png');
// cleaned original badge (Instagram profile picture), transparent outside the circle
const W = 1512;
const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}"><circle cx="${W/2}" cy="${W/2}" r="${W/2}" fill="#fff"/></svg>`);
await sharp('C:/Users/migue/AppData/Local/Temp/claude/659ceceb1f711b05/49bdf17d-c6a5-405f-8bb8-72e786934814/images/1.png')
  .extract({left: 7, top: 0, width: 741, height: 741}).resize(W, W, {kernel: 'lanczos3'}).sharpen({sigma: 0.8})
  .composite([{input: mask, blend: 'dest-in'}]).png().toFile(B+'arca-badge-original.png');
console.log('done');
