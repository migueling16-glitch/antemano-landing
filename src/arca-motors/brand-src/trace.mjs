import potrace from 'file:///C:/Users/migue/Sandbox/WEB ANTEMNO/node_modules/potrace/lib/index.js';
import fs from 'fs';
const names = ['m_arca','m_motors','m_tag','m_car','m_A'];
const out = {};
for (const n of names) {
  const svg = await new Promise((res, rej) => potrace.trace(n + '.png', { threshold: 128, turdSize: n==='m_tag'?20:150, optTolerance: 0.4, alphaMax: 1.0 }, (e, s) => e ? rej(e) : res(s)));
  out[n] = [...svg.matchAll(/ d="([^"]+)"/g)].map(m => m[1]).join(' ');
  console.log(n, out[n].length);
}
fs.writeFileSync('paths.json', JSON.stringify(out));
