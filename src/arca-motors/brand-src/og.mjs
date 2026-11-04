import sharp from 'file:///C:/Users/migue/Sandbox/WEB ANTEMNO/node_modules/sharp/lib/index.js';
const B = 'C:/Users/migue/Sandbox/WEB ANTEMNO/public/arca-motors/';
const logo = await sharp(B + 'brand/arca-logo-dark.svg', { density: 300 }).resize(760).png().toBuffer();
const m = await sharp(logo).metadata();
const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><radialGradient id="g" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#1d1e22"/><stop offset=".6" stop-color="#0a0a0b"/><stop offset="1" stop-color="#050506"/></radialGradient><radialGradient id="r" cx="50%" cy="100%" r="60%"><stop offset="0" stop-color="#e3141f" stop-opacity=".22"/><stop offset="1" stop-color="#e3141f" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" fill="url(#g)"/><rect width="1200" height="630" fill="url(#r)"/></svg>`);
await sharp(bg).composite([{ input: logo, left: Math.round((1200 - 760) / 2), top: Math.round((630 - m.height) / 2) }]).png().toFile(B + 'og.png');
console.log('og ok', m.height);
