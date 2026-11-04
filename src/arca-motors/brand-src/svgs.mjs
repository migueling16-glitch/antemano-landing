import fs from 'fs';
const P = JSON.parse(fs.readFileSync('paths.json','utf8')); for (const k in P) P[k] = P[k].replace(/\d+\.\d+/g, (m) => String(Math.round(parseFloat(m))));
const g = (d, fill, extra='') => `<path transform="scale(${1/6})" fill-rule="evenodd" fill="${fill}" ${extra} d="${d}"/>`;
const defs = (theme) => `<defs>
  <linearGradient id="silver" gradientUnits="userSpaceOnUse" x1="0" y1="2538" x2="0" y2="2862">
    ${theme==='dark'
      ? '<stop offset="0" stop-color="#fbfbfc"/><stop offset=".38" stop-color="#d3d6da"/><stop offset=".52" stop-color="#7d838b"/><stop offset=".7" stop-color="#e6e8eb"/><stop offset="1" stop-color="#a3a8ae"/>'
      : '<stop offset="0" stop-color="#5b6068"/><stop offset=".45" stop-color="#2b2f35"/><stop offset=".55" stop-color="#16181c"/><stop offset="1" stop-color="#3a3e45"/>'}
  </linearGradient>
  <linearGradient id="red" gradientUnits="userSpaceOnUse" x1="0" y1="2526" x2="0" y2="2862">
    <stop offset="0" stop-color="#ff5a4a"/><stop offset=".45" stop-color="#e0141f"/><stop offset="1" stop-color="#9c0b12"/>
  </linearGradient>
  <linearGradient id="chrome" gradientUnits="userSpaceOnUse" x1="0" y1="1062" x2="0" y2="2280">
    ${theme==='dark'
      ? '<stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#d9dce0"/><stop offset="1" stop-color="#9ea3a9"/>'
      : '<stop offset="0" stop-color="#3a3e45"/><stop offset="1" stop-color="#111316"/>'}
  </linearGradient>
  <linearGradient id="glowH" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#ff2a1f" stop-opacity="0"/><stop offset=".3" stop-color="#ff2a1f"/><stop offset=".5" stop-color="${theme==='dark'?'#ffe3dc':'#ff2a1f'}"/><stop offset=".7" stop-color="#ff2a1f"/><stop offset="1" stop-color="#ff2a1f" stop-opacity="0"/>
  </linearGradient>
  <filter id="blur" x="-20%" y="-400%" width="140%" height="900%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>`;
const glow = (theme) => `<g>${theme==='dark'?'<ellipse cx="378" cy="500.5" rx="190" ry="3.2" fill="#ff2a1f" opacity=".55" filter="url(#blur)"/>':''}<rect x="130" y="499.6" width="496" height="${theme==='dark'?1.6:1.2}" rx=".8" fill="url(#glowH)"/></g>`;
const tagFill = t => t==='dark' ? '#e4e6e9' : '#2b2f35';
const wordmark = t => `${g(P.m_arca,'url(#silver)')}${g(P.m_motors,'url(#red)')}${glow(t)}${g(P.m_tag,tagFill(t))}`;
const car = t => g(P.m_car,'url(#chrome)');
const svg = (vb, body, title) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;
const VB_FULL = '40 165 676 380', VB_WORD = '44 412 664 128', VB_CAR = '78 170 594 216';
for (const t of ['dark','light']) {
  fs.writeFileSync(`out/arca-logo-${t}.svg`, svg(VB_FULL, defs(t)+car(t)+wordmark(t), 'Arca Motors — Excelencia en seminuevos'));
  fs.writeFileSync(`out/arca-wordmark-${t}.svg`, svg(VB_WORD, defs(t)+wordmark(t), 'Arca Motors'));
  fs.writeFileSync(`out/arca-car-${t}.svg`, svg(VB_CAR, defs(t)+car(t), 'Arca Motors'));
}
// favicon: the A of ARCA in red on black
fs.writeFileSync('out/arca-favicon.svg', svg('0 0 64 64', defs('dark') + `<rect width="64" height="64" rx="14" fill="#0b0b0c"/><g transform="translate(32 33.5) scale(.82) translate(-80.5 -450)">${g(P.m_A,'url(#red)')}</g><rect x="14" y="53" width="36" height="1.6" rx=".8" fill="url(#glowH)"/>`, 'Arca Motors'));
// header lockup: only ARCA MOTORS (the tagline is illegible under ~200px wide)
for (const t of ['dark','light']) fs.writeFileSync(`out/arca-wordmark-solo-${t}.svg`, svg('48 419 656 62', defs(t)+g(P.m_arca,'url(#silver)')+g(P.m_motors,'url(#red)'), 'Arca Motors'));
// one-colour versions, recolour with CSS `color:`
const mono = `${g(P.m_arca,'currentColor')}${g(P.m_motors,'currentColor')}<rect x="130" y="499.6" width="496" height="1.2" fill="currentColor"/>${g(P.m_tag,'currentColor')}`;
fs.writeFileSync('out/arca-wordmark-mono.svg', svg(VB_WORD, mono, 'Arca Motors'));
fs.writeFileSync('out/arca-car-mono.svg', svg(VB_CAR, g(P.m_car,'currentColor'), 'Arca Motors'));
fs.writeFileSync('out/arca-logo-mono.svg', svg(VB_FULL, g(P.m_car,'currentColor')+mono, 'Arca Motors — Excelencia en seminuevos'));
// app icon / favicon: car on black disc
fs.writeFileSync('out/arca-icon.svg', svg('0 0 512 512', defs('dark') + `<circle cx="256" cy="256" r="256" fill="#050506"/><g transform="translate(256 258) scale(.84) translate(-375 -278)">${car('dark')}</g>`, 'Arca Motors'));
for (const f of fs.readdirSync('out')) console.log(f, fs.statSync('out/'+f).size);
