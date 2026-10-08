/**
 * La guía del menú: lo que ayuda a elegir, encima del menú oficial.
 *
 * config.ts (MENU) es el PDF tal cual. Esto es lo que se le agrega para que
 * el menú se entienda y se recuerde, siguiendo Made to Stick (Chip y Dan
 * Heath, 2007), que dice que una idea se queda si es Simple, Inesperada,
 * Concreta, Creíble, Emocional y cuenta una Historia:
 *
 * - Simple: una firma por sección ("si solo pides una cosa") y una línea de
 *   "qué es" para cada clásico que el PDF deja sin descripción.
 * - Concreta e inesperada: cada bebida dibujada por dentro (vaso.ts).
 * - Creíble: solo datos que ya dice el menú (hecho en casa, Maldon, Cuero
 *   Viejo, 1800 Añejo) o que confirmó Ryo (matcha ceremonial).
 * - Emocional e historia: "¿Qué se te antoja?" y "Primera vez".
 *
 * Nada aquí inventa recetas: el dibujo dice qué lleva y en qué orden, no
 * cuánto. Donde el menú no dice si va caliente o frío, el vaso no lleva ni
 * vapor ni hielo. Los textos de "qué es" son definiciones generales de cada
 * bebida; Ryo los puede cambiar aquí.
 */
import type { TabId } from './config';
import type { Vaso } from './vaso';

/** "Huevos tomate (shakshuka)" → "huevos-tomate-shakshuka". Igual que los id de la app. */
export const slug = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export type Etiqueta = 'casa' | 'sin-cafeina';

export type Guia = {
  /** Qué es, en una línea, para quien no la conoce. Solo donde el PDF no trae descripción. */
  que?: string;
  vaso?: Vaso;
  /** La versión fría, cuando es distinta de la caliente. */
  frio?: Vaso;
  etiquetas?: Etiqueta[];
};

/** La línea que abre cada sección: el dato que la hace distinta. */
export const GANCHOS: Record<TabId, string> = {
  cafe: 'Los clásicos de siempre y cinco especiales de la casa.',
  matcha: 'Matcha ceremonial, el de más alta calidad.',
  'sin-cafe': 'Todo el ritual, sin café.',
  bar: 'Cuatro de los siete cócteles llevan café, té o matcha.',
  cocina: 'Nuestro pan de masa madre, salmón curado en casa y pavo hecho en casa.',
};

/** Una firma por sección: si solo pides una cosa, que sea esta. */
export const FIRMAS: Record<TabId, { item: string; gancho: string }> = {
  cafe: { item: 'ryo-latte', gancho: 'Si es tu primera vez, empieza aquí.' },
  matcha: { item: 'ryo-matcha', gancho: 'Matcha ceremonial con foam de sésamo: la firma de la casa, en verde.' },
  'sin-cafe': { item: 'chai-latte', gancho: 'No es de caja: lo hacemos aquí, con especias naturales.' },
  bar: { item: 'espresso-de-olla-martini', gancho: 'El café de olla de siempre, convertido en martini.' },
  cocina: { item: 'matcha-pancake', gancho: 'El matcha también se come.' },
};

/** Los filtros de "¿Qué se te antoja?". `estado` es lo que se anuncia al elegirlo ({n} = cuántos). */
export const ANTOJOS = [
  { id: 'firma', texto: 'Primera vez', estado: '{n} para tu primera vez: una por sección' },
  { id: 'frio', texto: 'Algo frío', estado: '{n} bebidas frías' },
  { id: 'sin-cafeina', texto: 'Sin cafeína', estado: '{n} bebidas sin cafeína' },
  { id: 'casa', texto: 'Hecho en casa', estado: '{n} con algo hecho en casa' },
] as const;

const LECHE_ELIGES = 'Leche de tu elección';

export const GUIA: Record<string, Guia> = {
  /* ── Clásicos ── */
  espresso: {
    que: 'Corto e intenso: la base de todo el café.',
    vaso: { en: 'espresso', caliente: true, capas: [['espresso', 0.62], ['crema', 0.18]] },
  },
  cortado: {
    que: 'Espresso con un poco de leche. Pequeño y directo.',
    vaso: { en: 'vaso-bajo', caliente: true, capas: [['espresso', 0.38], ['leche', 0.38], ['espuma', 0.1]] },
  },
  'flat-white': {
    que: 'Más café que leche, con espuma muy fina.',
    vaso: { en: 'taza', caliente: true, capas: [['espresso', 0.32], ['leche', 0.5], ['espuma', 0.08]] },
    frio: { en: 'vaso', hielo: true, capas: [['leche', 0.5], ['espresso', 0.3]] },
  },
  cappuccino: {
    que: 'Espresso, leche y una capa alta de espuma.',
    vaso: { en: 'taza', caliente: true, capas: [['espresso', 0.28], ['leche', 0.3], ['espuma', 0.34]] },
  },
  latte: {
    que: 'Espresso con mucha leche. El más suave.',
    vaso: { en: 'vaso', caliente: true, capas: [['espresso', 0.18], ['leche', 0.62], ['espuma', 0.1]] },
    frio: { en: 'vaso', hielo: true, capas: [['leche', 0.58], ['espresso', 0.26]] },
  },
  americano: {
    que: 'Espresso alargado con agua. Para tomar despacio.',
    vaso: { en: 'vaso', caliente: true, capas: [['espresso', 0.2], ['agua', 0.68]] },
    frio: { en: 'vaso', hielo: true, capas: [['agua', 0.62], ['espresso', 0.24]] },
  },
  'long-black': {
    que: 'Agua primero y el espresso encima: más intenso que el americano.',
    vaso: { en: 'taza', caliente: true, capas: [['agua', 0.55], ['espresso', 0.3]] },
  },
  moka: {
    que: 'Espresso, chocolate y leche.',
    vaso: { en: 'vaso', caliente: true, capas: [['chocolate', 0.14], ['espresso', 0.18], ['leche', 0.52], ['espuma', 0.08]] },
    frio: { en: 'vaso', hielo: true, capas: [['chocolate', 0.14], ['leche', 0.48], ['espresso', 0.24]] },
  },
  'cold-brew': {
    que: 'Café extraído en frío por horas: suave y poco amargo.',
    vaso: { en: 'vaso', hielo: true, capas: [['cold-brew', 0.86]] },
  },
  'cold-brew-latte': {
    que: 'Cold brew con leche fría.',
    vaso: { en: 'vaso', hielo: true, capas: [['leche', 0.45], ['cold-brew', 0.42]] },
  },
  'cold-brew-tonic': {
    que: 'Cold brew sobre agua tónica: burbujas y frescura.',
    vaso: { en: 'vaso', hielo: true, capas: [['tonica', 0.52], ['cold-brew', 0.34]] },
  },
  'espresso-tonic': {
    que: 'Espresso sobre agua tónica con hielo. Burbujeante.',
    vaso: { en: 'vaso', hielo: true, capas: [['tonica', 0.62], ['espresso', 0.24]] },
  },

  /* ── Especiales ── */
  'ryo-latte': { vaso: { en: 'vaso', capas: [['espresso', 0.18], ['leche-avena', 0.5], ['foam-sesamo', 0.22]] } },
  'miso-caramel-latte': {
    vaso: { en: 'vaso', capas: [['caramelo-miso', 0.1], ['espresso', 0.18], ['leche', 0.56, LECHE_ELIGES], ['espuma', 0.08]] },
  },
  'shaken-espresso': { vaso: { en: 'vaso', hielo: true, capas: [['espresso-agitado', 0.6], ['foam', 0.16]] } },
  'maple-sea-salt-latte': {
    vaso: { en: 'vaso', capas: [['maple', 0.12, 'Jarabe de maple y sal Maldon'], ['espresso', 0.18], ['leche', 0.54, LECHE_ELIGES], ['espuma', 0.08]] },
  },
  'coffee-cloud': { vaso: { en: 'vaso', capas: [['agua-coco', 0.5], ['foam-cafe', 0.36]] } },

  /* ── Matcha ── */
  'matcha-latte': {
    que: 'Matcha ceremonial batido, con leche.',
    vaso: { en: 'vaso', caliente: true, capas: [['matcha', 0.26], ['leche', 0.56], ['espuma', 0.08]] },
    frio: { en: 'vaso', hielo: true, capas: [['leche', 0.55], ['matcha', 0.3]] },
  },
  'ryo-matcha': { vaso: { en: 'vaso', capas: [['matcha', 0.24], ['leche', 0.46], ['foam-sesamo', 0.2]] } },
  hojicha: { vaso: { en: 'vaso', hielo: true, capas: [['hojicha', 0.84, 'Hojicha (té verde tostado)']] } },
  hojichai: { vaso: { en: 'vaso', hielo: true, capas: [['chai', 0.22], ['leche', 0.42], ['hojicha', 0.22]] } },
  'coconut-matcha': { vaso: { en: 'vaso', capas: [['agua-coco', 0.5], ['matcha', 0.34]] } },

  /* ── Sin café ── */
  'chai-latte': {
    etiquetas: ['casa'],
    vaso: { en: 'vaso', caliente: true, capas: [['chai', 0.26], ['leche', 0.56, LECHE_ELIGES], ['espuma', 0.08]] },
    frio: { en: 'vaso', hielo: true, capas: [['chai', 0.26], ['leche', 0.58, LECHE_ELIGES]] },
  },
  'golden-milk': {
    etiquetas: ['sin-cafeina'],
    vaso: { en: 'vaso', caliente: true, capas: [['golden', 0.24], ['leche', 0.62, LECHE_ELIGES]] },
    frio: { en: 'vaso', hielo: true, capas: [['golden', 0.24], ['leche', 0.6, LECHE_ELIGES]] },
  },
  'sesame-latte': {
    etiquetas: ['sin-cafeina'],
    vaso: { en: 'vaso', capas: [['sesamo', 0.16], ['leche-avena', 0.7]] },
  },

  /* ── Mocktails ── */
  'mandarina-cardamomo': {
    etiquetas: ['sin-cafeina'],
    vaso: { en: 'vaso', hielo: true, capas: [['fruta', 0.42, 'Mandarina, cardamomo y limón'], ['mineral', 0.44]] },
  },
  'ginger-honey': {
    etiquetas: ['sin-cafeina'],
    vaso: { en: 'vaso', hielo: true, capas: [['fruta', 0.4, 'Jengibre, miel y limón'], ['mineral', 0.46]] },
  },
  'iced-tea': { vaso: { en: 'vaso', hielo: true, capas: [['te', 0.86, 'Té negro extraído en frío, con limón']] } },
  'manzanilla-limon': {
    etiquetas: ['sin-cafeina'],
    vaso: { en: 'vaso', hielo: true, capas: [['te', 0.86, 'Manzanilla extraída en frío, con limón']] },
  },

  /* ── Cócteles ── */
  'matcha-martini': { vaso: { en: 'copa', capas: [['matcha', 0.85, 'Vodka con matcha, agua de coco y jarabe natural']] } },
  'negroni-manzanilla': { vaso: { en: 'vaso-bajo', capas: [['destilado', 0.7, 'Gin con manzanilla, vermut rosso y Campari']] } },
  'martini-de-mezcal': { vaso: { en: 'copa', capas: [['fruta', 0.85, 'Mezcal Cuero Viejo, sandía, kiwi y limón']] } },
  'martini-lichi': { vaso: { en: 'copa', capas: [['te', 0.85, 'Té de jazmín, lichi y St-Germain']] } },
  'limoncello-spritz': {
    vaso: { en: 'copa-vino', hielo: true, capas: [['jarabe', 0.3, 'Limoncello y jarabe natural'], ['espumoso', 0.5, 'Espumoso y agua mineral']] },
  },
  'espresso-de-olla-martini': {
    vaso: { en: 'copa', capas: [['espresso', 0.85, 'Tequila 1800 Añejo, espresso y jarabe de café de olla']] },
  },
  'dirty-martini': { vaso: { en: 'copa', aceituna: true, capas: [['agua', 0.85, 'Gin o vodka, vermut seco y salmuera']] } },

  /* ── Cocina: lo que el menú dice que se hace en casa ── */
  'bowl-de-yogurt': { etiquetas: ['casa'] },
  'huevos-turcos': { etiquetas: ['casa'] },
  'huevos-tomate-shakshuka': { etiquetas: ['casa'] },
  'omelette-ryo': { etiquetas: ['casa'] },
  'toast-de-salmon': { etiquetas: ['casa'] },
  'sandwich-de-pavo': { etiquetas: ['casa'] },
  'tuna-melt': { etiquetas: ['casa'] },
};

export const guiaDe = (nombre: string): Guia => GUIA[slug(nombre)] ?? {};
