import potrace from 'potrace';
import fs from 'fs';

const input = 'public/logo-full.png';
const output = 'public/logo-full.svg';

potrace.trace(input, { threshold: 128, color: '#000000', background: 'transparent', turdSize: 100 }, (err, svg) => {
  if (err) { console.error(err); process.exit(1); }
  fs.writeFileSync(output, svg);
  console.log('Wrote', output, svg.length, 'bytes');
});
