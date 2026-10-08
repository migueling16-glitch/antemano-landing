/**
 * El vaso en corte: cada bebida dibujada por dentro, capa por capa.
 *
 * Es el recurso "concreto" del menú (Made to Stick, Heath & Heath): en vez de
 * explicar qué es un flat white, se ve. Mismo dibujo en la landing y en la
 * app de barra, para que cliente y barista hablen del mismo vaso.
 *
 * Reglas de la marca: dos tintas, nada más. Las capas se distinguen por su
 * trama (lleno, rayas, puntos, burbujas…), no por color. Vapor arriba = se
 * sirve caliente; cubos = frío. Sin vapor ni hielo = el menú no lo dice.
 *
 * Las tramas son <pattern> de SVG definidos una sola vez por página
 * (spriteVasos) y pintados con colores fijos de la marca, así se leen igual
 * en cualquier fondo.
 */

export type Trama =
  | 'solido' | 'vacio' | 'espuma' | 'puntos' | 'burbujas' | 'agua' | 'denso'
  | 'rayas' | 'rayas-inv' | 'cruces' | 'semillas' | 'fruta' | 'espuma-oscura';

export const MATERIALES = {
  espresso: { nombre: 'Espresso', trama: 'solido' },
  crema: { nombre: 'Crema', trama: 'espuma' },
  leche: { nombre: 'Leche', trama: 'vacio' },
  'leche-avena': { nombre: 'Leche de avena', trama: 'vacio' },
  espuma: { nombre: 'Espuma de leche', trama: 'espuma' },
  agua: { nombre: 'Agua', trama: 'agua' },
  'cold-brew': { nombre: 'Cold brew', trama: 'denso' },
  tonica: { nombre: 'Agua tónica', trama: 'burbujas' },
  mineral: { nombre: 'Agua mineral', trama: 'burbujas' },
  chocolate: { nombre: 'Chocolate', trama: 'cruces' },
  'caramelo-miso': { nombre: 'Caramelo de miso', trama: 'cruces' },
  maple: { nombre: 'Jarabe de maple', trama: 'cruces' },
  jarabe: { nombre: 'Jarabe', trama: 'cruces' },
  'foam-sesamo': { nombre: 'Foam de sésamo', trama: 'semillas' },
  sesamo: { nombre: 'Pasta de sésamo tostado', trama: 'semillas' },
  foam: { nombre: 'Foam', trama: 'espuma' },
  'foam-cafe': { nombre: 'Foam de café', trama: 'espuma-oscura' },
  'espresso-agitado': { nombre: 'Espresso agitado con mascabado', trama: 'espuma-oscura' },
  'agua-coco': { nombre: 'Agua de coco', trama: 'agua' },
  matcha: { nombre: 'Matcha', trama: 'rayas' },
  hojicha: { nombre: 'Hojicha', trama: 'rayas-inv' },
  te: { nombre: 'Té', trama: 'rayas-inv' },
  chai: { nombre: 'Chai de la casa', trama: 'puntos' },
  golden: { nombre: 'Cúrcuma y especias', trama: 'puntos' },
  fruta: { nombre: 'Fruta', trama: 'fruta' },
  destilado: { nombre: 'Destilado', trama: 'denso' },
  espumoso: { nombre: 'Espumoso', trama: 'burbujas' },
} as const satisfies Record<string, { nombre: string; trama: Trama }>;

export type Material = keyof typeof MATERIALES;
export type Recipiente = 'espresso' | 'taza' | 'vaso-bajo' | 'vaso' | 'copa' | 'copa-vino';

/** [material, qué parte del alto ocupa (0 a 1), nombre si cambia el del material] */
export type Capa = [Material, number, string?];

export type Vaso = {
  en: Recipiente;
  /** De abajo hacia arriba, como se arma. */
  capas: Capa[];
  /** Vapor encima: se sirve caliente. */
  caliente?: boolean;
  /** Cubos de hielo: se sirve frío. */
  hielo?: boolean;
  aceituna?: boolean;
};

/* ═══ Geometría ═══
 * Todo vive en una caja de 64 × 80. Cada recipiente es un perfil: su centro y
 * el medio ancho interior a cierta altura (de arriba hacia abajo). Entre dos
 * puntos del perfil el borde es recto. */
type Perfil = { cx: number; puntos: [y: number, medio: number][]; extra?: string };

const PERFILES: Record<Recipiente, Perfil> = {
  espresso: {
    cx: 28, puntos: [[46, 14.5], [61, 12.5], [67, 8.5]],
    extra: 'M42.6 50.5c8.4-.6 8.6 11.2-.9 11.4 M8 71.5h40',
  },
  taza: {
    cx: 28, puntos: [[34, 20.5], [56, 18], [64, 13], [67, 8]],
    extra: 'M48.2 40c10.6-.8 10.6 17.6-2.8 18 M3 71.5h50',
  },
  'vaso-bajo': { cx: 32, puntos: [[30, 19], [73, 15.5]] },
  vaso: { cx: 32, puntos: [[14, 19], [76, 14]] },
  copa: {
    cx: 32, puntos: [[10, 27], [40, 1.2]],
    extra: 'M32 40v31 M19 73q13-5 26 0',
  },
  'copa-vino': {
    cx: 32, puntos: [[8, 15.5], [28, 15.8], [36, 14], [42, 10], [46, 5], [47.5, 1.2]],
    extra: 'M32 47.5v24 M20 73q12-4.5 24 0',
  },
};

const r1 = (n: number) => Math.round(n * 10) / 10;

function medioEn(p: Perfil, y: number): number {
  const pts = p.puntos;
  if (y <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [y0, m0] = pts[i - 1];
    const [y1, m1] = pts[i];
    if (y <= y1) return m0 + ((m1 - m0) * (y - y0)) / (y1 - y0);
  }
  return pts[pts.length - 1][1];
}

const arriba = (p: Perfil) => p.puntos[0][0];
const abajo = (p: Perfil) => p.puntos[p.puntos.length - 1][0];

/** La rebanada del interior entre dos alturas (yA arriba, yB abajo). */
function rebanada(p: Perfil, yA: number, yB: number): string {
  const medios = p.puntos.filter(([y]) => y > yA && y < yB);
  const der = [[yA, medioEn(p, yA)], ...medios, [yB, medioEn(p, yB)]] as [number, number][];
  const izq = [...der].reverse();
  const pts = [...der.map(([y, m]) => `${r1(p.cx + m)} ${r1(y)}`), ...izq.map(([y, m]) => `${r1(p.cx - m)} ${r1(y)}`)];
  return `M${pts.join('L')}Z`;
}

/** El vidrio: abierto arriba. */
function contorno(p: Perfil): string {
  const izq = p.puntos.map(([y, m]) => `${r1(p.cx - m)} ${r1(y)}`);
  const der = [...p.puntos].reverse().map(([y, m]) => `${r1(p.cx + m)} ${r1(y)}`);
  return `M${[...izq, ...der].join('L')}`;
}

/* ═══ Tramas ═══
 * El líquido siempre se pinta con las dos tintas de verdad, café sobre
 * champagne, sin importar el tema ni el fondo: el espresso siempre es oscuro
 * y la leche siempre es clara. En un fondo oscuro el vaso se ve como una
 * ventana encendida. Solo el vidrio y el vapor toman el color del texto. */
const OSCURO = 'var(--c-cafe, #302413)';
const CLARO = 'var(--c-champagne, #f8f3d1)';
const fondo = (w: number, h: number) => `<rect width="${w}" height="${h}" style="fill:${CLARO}"/>`;
const trazo = (ancho: number) => `fill:none;stroke:${OSCURO};stroke-width:${ancho}`;
const lleno = `fill:${OSCURO}`;

const TRAMAS: Record<Exclude<Trama, 'solido' | 'vacio'>, string> = {
  espuma: `<pattern id="vt-espuma" width="4" height="4" patternUnits="userSpaceOnUse">${fondo(4, 4)}<circle cx="2" cy="2" r=".95" style="${trazo(0.45)}"/></pattern>`,
  puntos: `<pattern id="vt-puntos" width="2.6" height="2.6" patternUnits="userSpaceOnUse">${fondo(2.6, 2.6)}<circle cx="1.3" cy="1.3" r=".55" style="${lleno}"/></pattern>`,
  burbujas: `<pattern id="vt-burbujas" width="7" height="7" patternUnits="userSpaceOnUse">${fondo(7, 7)}<circle cx="2" cy="2" r=".95" style="${trazo(0.42)}"/><circle cx="5.4" cy="5.2" r=".6" style="${trazo(0.42)}"/></pattern>`,
  agua: `<pattern id="vt-agua" width="4" height="3.2" patternUnits="userSpaceOnUse">${fondo(4, 3.2)}<path d="M0 1.6H4" style="${trazo(0.42)}"/></pattern>`,
  denso: `<pattern id="vt-denso" width="4" height="1.5" patternUnits="userSpaceOnUse">${fondo(4, 1.5)}<path d="M0 .75H4" style="${trazo(0.62)}"/></pattern>`,
  rayas: `<pattern id="vt-rayas" width="2.8" height="2.8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">${fondo(2.8, 2.8)}<path d="M1.4 0V2.8" style="${trazo(0.55)}"/></pattern>`,
  'rayas-inv': `<pattern id="vt-rayas-inv" width="3.4" height="3.4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">${fondo(3.4, 3.4)}<path d="M1.7 0V3.4" style="${trazo(0.42)}"/></pattern>`,
  cruces: `<pattern id="vt-cruces" width="4.4" height="4.4" patternUnits="userSpaceOnUse">${fondo(4.4, 4.4)}<path d="M1.2 1.2l2 2M3.2 1.2l-2 2" style="${trazo(0.45)}"/></pattern>`,
  semillas: `<pattern id="vt-semillas" width="4.2" height="4.2" patternUnits="userSpaceOnUse">${fondo(4.2, 4.2)}<ellipse cx="1.2" cy="1.2" rx=".95" ry=".48" transform="rotate(30 1.2 1.2)" style="${lleno}"/><ellipse cx="3.3" cy="3.2" rx=".95" ry=".48" transform="rotate(-25 3.3 3.2)" style="${lleno}"/></pattern>`,
  fruta: `<pattern id="vt-fruta" width="6" height="6" patternUnits="userSpaceOnUse">${fondo(6, 6)}<circle cx="1.8" cy="1.8" r="1.15" style="${lleno}"/><circle cx="4.6" cy="4.6" r=".7" style="${lleno}"/></pattern>`,
  'espuma-oscura': `<pattern id="vt-espuma-oscura" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" style="${lleno}"/><circle cx="1.5" cy="1.5" r=".72" style="fill:${CLARO}"/></pattern>`,
};

/**
 * Las tramas, una vez por página. Nunca dentro de algo con display:none: un
 * patrón que vive en algo oculto deja de pintarse.
 */
export function spriteVasos(): string {
  return `<svg class="vaso-sprite" aria-hidden="true" focusable="false"><defs>${Object.values(TRAMAS).join('')}</defs></svg>`;
}

const rellenoDe = (t: Trama) => (t === 'solido' ? OSCURO : t === 'vacio' ? CLARO : `url(#vt-${t})`);

/* ═══ El dibujo ═══ */

/** Dónde caen los hielos: [x como fracción del medio ancho, y como fracción del líquido]. */
const HIELOS: [number, number][] = [[-0.42, 0.02], [0.4, 0.06], [0.02, 0.3], [-0.44, 0.52], [0.42, 0.56], [-0.02, 0.8]];

/** Hasta dónde llega el dibujo a los lados (el asa, el palillo de la aceituna). */
function anchoDe(v: Vaso, p: Perfil): [number, number] {
  const medio = Math.max(...p.puntos.map(([, m]) => m));
  const der = v.en === 'taza' ? 59 : v.en === 'espresso' ? 51 : v.aceituna ? p.cx + 18 : p.cx + medio + 1.5;
  const izq = v.en === 'taza' ? 2 : v.en === 'espresso' ? 7 : p.cx - medio - 1.5;
  return [izq, der];
}

/**
 * El dibujo de una bebida. En las listas va en la caja completa de 64 × 80,
 * así una taza de espresso se ve chica junto a un vaso alto (el tamaño
 * también informa). `recorte` ajusta la caja al recipiente, para verlo en grande.
 */
export function svgVaso(v: Vaso, { clase = '', recorte = false, espacioVapor = false, numerar = false }: {
  clase?: string; recorte?: boolean;
  /** Deja el aire del vapor aunque esta versión no lo lleve: así la fría y la caliente quedan a la misma escala. */
  espacioVapor?: boolean;
  /**
   * Un número junto a cada capa, en el orden en que se sirve (1 = abajo),
   * igual que en la leyenda. Se alternan los lados para que no se encimen;
   * en las tazas van todos a la izquierda, donde no está el asa.
   */
  numerar?: boolean;
} = {}): string {
  const p = PERFILES[v.en];
  const yTop = arriba(p);
  const yBot = abajo(p);
  const alto = yBot - yTop;
  const partes: string[] = [];
  const filetes: string[] = [];

  let y = yBot;
  v.capas.forEach(([mat, parte], i) => {
    const yA = Math.max(yTop, y - parte * alto);
    const trama = MATERIALES[mat].trama;
    partes.push(`<path class="vaso-capa" style="--i:${i};fill:${rellenoDe(trama)}" d="${rebanada(p, yA, y)}"/>`);
    const m = medioEn(p, yA);
    filetes.push(`M${r1(p.cx - m)} ${r1(yA)}H${r1(p.cx + m)}`);
    y = yA;
  });
  const yLiq = y;

  // Hielo: cubos que tapan la trama; los de arriba asoman sobre el líquido, como flota.
  const hielos: string[] = [];
  if (v.hielo) {
    const lado = v.en === 'vaso-bajo' ? 13 : v.en === 'copa-vino' ? 6.6 : 8.2;
    const lugares: [number, number][] = v.en === 'vaso-bajo' ? [[0, 0.32]] : HIELOS;
    lugares.forEach(([fx, fy], i) => {
      const cy = yLiq + fy * (yBot - yLiq);
      const m = medioEn(p, cy);
      const cx = p.cx + fx * m;
      if (Math.abs(cx - p.cx) + lado * 0.62 > m - 0.6 || cy + lado / 2 > yBot - 1) return;
      const ang = i % 2 ? -11 : 9;
      // El giro va en el <rect> y la animación en su <g>: así no se pisan.
      hielos.push(`<g class="vaso-cubo" style="--i:${v.capas.length + i * 0.4}"><rect class="vaso-hielo" x="${r1(cx - lado / 2)}" y="${r1(cy - lado / 2)}" width="${lado}" height="${lado}" transform="rotate(${ang} ${r1(cx)} ${r1(cy)})"/></g>`);
    });
  }

  let aceituna = '';
  if (v.aceituna) {
    const cy = yBot - 8.5;
    aceituna = `<g class="vaso-extra"><path class="vaso-palillo" d="M${p.cx + 1} ${cy}L${p.cx + 17} ${yTop - 5}"/><ellipse cx="${p.cx}" cy="${cy}" rx="3.3" ry="2.7" class="vaso-hielo"/><circle cx="${p.cx + 1.6}" cy="${cy - 0.3}" r="1" style="fill:${OSCURO}"/></g>`;
  }

  // Vapor: dos hilos encima del borde.
  const vapor = v.caliente
    ? [-5, 4].map((dx, i) => `<path class="vaso-vapor" style="--i:${i}" d="M${p.cx + dx} ${yTop - 3}c-2.2-2.2 2.2-3.6 0-5.4c-2.2-2.2 2.2-3.6 0-5.4"/>`).join('')
    : '';

  const numeros: string[] = [];
  let numIzq = false;
  let numDer = false;
  if (numerar && v.capas.length > 1) {
    const soloIzq = v.en === 'taza' || v.en === 'espresso';
    let yB = yBot;
    v.capas.forEach(([, parte], i) => {
      const yA = Math.max(yTop, yB - parte * alto);
      const yc = (yA + yB) / 2;
      const m = medioEn(p, yc);
      const aDer = !soloIzq && i % 2 === 0;
      if (aDer) numDer = true; else numIzq = true;
      const x0 = aDer ? p.cx + m + 1.2 : p.cx - m - 1.2;
      const x1 = aDer ? x0 + 2.6 : x0 - 2.6;
      numeros.push(`<g class="vaso-num"><path class="vaso-guia" d="M${r1(x0)} ${r1(yc)}H${r1(x1)}"/><text x="${r1(aDer ? x1 + 0.9 : x1 - 0.9)}" y="${r1(yc)}" text-anchor="${aDer ? 'start' : 'end'}" dominant-baseline="central">${i + 1}</text></g>`);
      yB = yA;
    });
  }

  const [izq0, der0] = recorte ? anchoDe(v, p) : [0, 64];
  const izq = numIzq ? Math.min(izq0, p.cx - medioEn(p, yTop) - 9) : izq0;
  const der = numDer ? Math.max(der0, p.cx + medioEn(p, yTop) + 9) : der0;
  const cajaArriba = recorte ? Math.max(0, yTop - (v.caliente || espacioVapor ? 15 : v.aceituna ? 7 : 3)) : 0;
  const cajaAbajo = recorte ? Math.min(80, Math.max(yBot, 73.5) + 2) : 80;
  return `<svg class="vaso${clase ? ` ${clase}` : ''}" viewBox="${r1(izq)} ${r1(cajaArriba)} ${r1(der - izq)} ${r1(cajaAbajo - cajaArriba)}" aria-hidden="true" focusable="false">`
    + `<g class="vaso-capas">${partes.join('')}${hielos.join('')}${aceituna}</g>`
    + `<path class="vaso-filete" d="${filetes.join('')}"/>`
    + `<path class="vaso-linea" d="${contorno(p)}${p.extra ? ` ${p.extra}` : ''}"/>`
    + vapor
    + numeros.join('')
    + '</svg>';
}

export type Renglon = {
  nombre: string;
  /** El número de la capa en el dibujo (1 = abajo, va primero). Sin número si es la única. */
  n?: number;
  /** La marca cuando no hay número: hielo, aceituna o capa única. */
  marca?: string;
};

/** La leyenda del vaso, de arriba hacia abajo: en el mismo orden en que se ve. */
export function leyendaDe(v: Vaso): Renglon[] {
  const varias = v.capas.length > 1;
  const capas = v.capas
    .map(([mat, , nombre], i) => ({ nombre: nombre ?? MATERIALES[mat].nombre, ...(varias ? { n: i + 1 } : { marca: '—' }) }))
    .reverse();
  return [
    ...(v.aceituna ? [{ nombre: 'Aceitunas', marca: '○' }] : []),
    ...capas,
    ...(v.hielo ? [{ nombre: 'Hielo', marca: '□' }] : []),
  ];
}

/**
 * Estilos del dibujo (se insertan una vez donde se use). Trazo de 1.25 px
 * a cualquier tamaño; las capas se llenan de abajo hacia arriba, una tras
 * otra, como cuando se sirve: el motivo de movimiento de la marca.
 */
export const CSS_VASO = `
.vaso-sprite { position: absolute; width: 0; height: 0; overflow: hidden; }
.vaso { display: block; width: 100%; height: auto; overflow: visible; color: inherit; }
.vaso-linea, .vaso-vapor { fill: none; stroke: currentColor; stroke-width: 1.25; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.vaso-palillo { fill: none; stroke: currentColor; stroke-width: 1.25; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.vaso-filete { fill: none; stroke: ${OSCURO}; stroke-width: .75; vector-effect: non-scaling-stroke; }
.vaso-hielo { fill: ${CLARO}; stroke: ${OSCURO}; stroke-width: 1; vector-effect: non-scaling-stroke; }
.vaso-guia { fill: none; stroke: currentColor; stroke-width: 1; vector-effect: non-scaling-stroke; }
.vaso-num text { fill: currentColor; font-family: inherit; font-size: 6.4px; font-weight: 700; }
@keyframes vaso-llena { from { transform: scaleY(0); } }
@keyframes vaso-sube { from { opacity: 0; transform: translateY(4px); } }
.vaso-llenar .vaso-capa, .vaso-llenar .vaso-cubo, .vaso-llenar .vaso-extra { transform-box: fill-box; transform-origin: 50% 100%; animation: vaso-llena 620ms cubic-bezier(0.16, 1, 0.3, 1) backwards; animation-delay: calc(var(--i, 0) * 150ms); }
.vaso-llenar .vaso-cubo, .vaso-llenar .vaso-extra { animation-name: vaso-sube; }
.vaso-llenar .vaso-filete { animation: vaso-sube 400ms ease backwards; animation-delay: 300ms; }
.vaso-llenar .vaso-vapor { animation: vaso-sube 900ms ease backwards; animation-delay: calc(500ms + var(--i, 0) * 200ms); }
.vaso-llenar .vaso-num { animation: vaso-sube 420ms ease backwards; animation-delay: 650ms; }
@media (prefers-reduced-motion: reduce) {
  .vaso-llenar .vaso-capa, .vaso-llenar .vaso-cubo, .vaso-llenar .vaso-extra, .vaso-llenar .vaso-filete, .vaso-llenar .vaso-vapor, .vaso-llenar .vaso-num { animation: none; }
}
`;
