/**
 * ALDO chef LUGO · Mesa de Lumbre — contenido y datos del demo.
 *
 * Fuente: Chef Aldo Lugo/04_Docs/PROPUESTA_MAESTRA.md v1.1 (24-nov-2026): §3 lumbres, §4 oferta,
 * §5 arquitectura, §6 copy, §7 formulario. Técnico: ESPECIFICACION_TECNICA.md §2.2 (oferta.json) y §8.
 *
 * Reglas:
 *  - Lo que la propuesta tiene entre corchetes ([ZONA], $[X], [48 h]…) va en null o como hueco h().
 *    En el DEMO se pinta como chip "… por confirmar" con <Dato /> o <Texto />. Nunca corchetes crudos.
 *  - `pregunta` es el número de PREGUNTAS_CHEF.md que resuelve el hueco.
 *  - Nunca escribir aquí el teléfono del chef: DATOS.whatsapp sigue en null hasta que lo confirme (P16).
 *  - Nada de Canito salvo ANFITRION.canito. Nada de Burning Man. Mallmann: nivel 0 (no se nombra).
 *  - El horno de tierra (F289, F323, F358, F362) es de los maestros mezcaleros: siempre con CREDITO_MEZCALEROS.
 */

// =====================================================================================
// Interruptores y rutas
// =====================================================================================

/** true: noindex, franja de demo, chips "por confirmar" y el formulario no envía nada. */
export const DEMO = true;
export const BASE = '/aldolugo';
export const ASSETS = '/aldo-lugo';
/** Origen público (para og:image absoluta). */
export const ORIGEN = 'https://antemano.com.mx';

/**
 * Cuestionario del chef (/aldolugo/cuestionario/?k=TOKEN): guardado en línea en Supabase ("antemano-clientes").
 * Vacíos = el cuestionario guarda solo en el teléfono (demo). Pasos: src/aldo-lugo/supabase/README.md.
 * SUPABASE_KEY es la llave PUBLICABLE (sb_publishable_…): es pública por diseño; nunca la secreta (sb_secret_…).
 */
export const SUPABASE_URL = 'https://cqjsbswwbauudygxfsgx.supabase.co'; // proyecto "antemano-clientes"
export const SUPABASE_KEY = 'sb_publishable_vuTDUd37Z57IeeqqNEwgfQ_cXHGOl_1'; // llave publicable (pública por diseño)

export const ruta = (p = '') => `${BASE}/${p.replace(/^\/+/, '')}`;
export const asset = (p: string) => `${ASSETS}/${p.replace(/^\/+/, '')}`;

/** Anclas de la landing (propuesta §5 / ESPEC §7.3). Úsalas tal cual en los id de las secciones. */
export const SECCIONES = {
  inicio: 'inicio',
  manifiesto: 'manifiesto',
  lumbres: 'lumbres',
  unaNoche: 'una-noche',
  experiencias: 'experiencias',
  anfitrion: 'anfitrion',
  proceso: 'proceso',
  preguntas: 'preguntas',
  tuFecha: 'tu-fecha',
  cierre: 'cierre',
} as const;

/** Navegación de escritorio (en móvil solo logo + "Cotiza tu evento"). */
export const NAV = [
  { texto: 'Así se vive', href: '#asi-se-vive' },
  { texto: 'El oficio', href: `#${SECCIONES.lumbres}` },
  { texto: 'El menú', href: '#platos' },
  { texto: 'Tu evento', href: `#${SECCIONES.experiencias}` },
  { texto: 'Preguntas', href: `#${SECCIONES.preguntas}` },
];

// =====================================================================================
// Pendientes: null + helpers
// =====================================================================================

export const POR_CONFIRMAR = 'por confirmar';

/** Un hueco dentro de un texto: se pinta como chip "<hueco> por confirmar" mientras `valor` sea null. */
export interface Hueco {
  hueco: string;
  pregunta?: number;
  valor?: string | number | null;
  formato?: 'mxn' | 'texto';
}
export type Segmento = string | Hueco;
/** Texto con huecos: un string o una lista de strings y huecos. Se pinta con <Texto t={...} />. */
export type Texto = string | Segmento[];

/** Crea un hueco. h('zona', 12) → chip "zona por confirmar" (pregunta 12). */
export const h = (hueco: string, pregunta?: number, valor: string | number | null = null, formato: Hueco['formato'] = 'texto'): Hueco => ({
  hueco,
  pregunta,
  valor,
  formato,
});

export const esHueco = (s: unknown): s is Hueco => typeof s === 'object' && s !== null && 'hueco' in s;

export const esPendiente = (v: unknown): boolean =>
  v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
/** 18000 → "$18,000" */
export const mxn = (n: number) => MXN.format(n);

/**
 * Resuelve un valor que puede faltar.
 *   pendiente(OFERTA.formatos[0].precio.desde, { etiqueta: 'precio', formato: mxn, pregunta: 5 })
 *   → { pendiente: true, texto: 'precio por confirmar', titulo: 'Pendiente · pregunta 5 del cuestionario' }
 */
export function pendiente<T>(
  valor: T | null | undefined,
  opciones: { etiqueta?: string; formato?: (v: T) => string; pregunta?: number } = {},
) {
  const falta = esPendiente(valor);
  const etiqueta = opciones.etiqueta ? `${opciones.etiqueta} ${POR_CONFIRMAR}` : POR_CONFIRMAR;
  return {
    pendiente: falta,
    texto: falta ? etiqueta : opciones.formato ? opciones.formato(valor as T) : String(valor),
    pregunta: opciones.pregunta,
    titulo: opciones.pregunta ? `Pendiente · pregunta ${opciones.pregunta} del cuestionario` : 'Pendiente de confirmar con el chef',
  };
}

/** Texto → string plano (para meta, aria-label, mensajes). Los huecos salen como "… por confirmar". */
export function textoPlano(t: Texto): string {
  if (typeof t === 'string') return t;
  return t
    .map((s) =>
      typeof s === 'string'
        ? s
        : esPendiente(s.valor)
          ? `${s.hueco} ${POR_CONFIRMAR}`
          : s.formato === 'mxn' && typeof s.valor === 'number'
            ? mxn(s.valor)
            : String(s.valor),
    )
    .join('');
}

// =====================================================================================
// Marca y datos del chef
// =====================================================================================

export const SITIO = {
  marca: 'ALDO chef LUGO',
  /** Lema que pidió Aldo (27-nov): va bajo el logotipo, en el pie. */
  linea: 'Experiencias gastronómicas que se sienten con el alma',
  chef: 'Aldo Lugo',
  concepto: 'Un banquete que empieza cuando se enciende el fuego y termina en la sobremesa.',
  promesa: 'Ustedes eligen el lugar. Nosotros llevamos el fuego.',
  region: 'Durango, México',
  instagram: { usuario: 'aldolugosoto', url: 'https://www.instagram.com/aldolugosoto/' },
  /** Cita de su bio de Instagram (pública). */
  bioCita: 'Cocinar es una forma de comunicar, de expresar quién eres.',
  seo: {
    title: 'Banquetes al fuego para bodas y eventos en Durango | Aldo Lugo',
    description:
      'Banquetes, outdoor kitchen y show cooking con cocina de brasa y fuego para bodas, cumpleaños y eventos de empresa de 10 a 300 invitados, en el lugar que elijas.',
  },
  cuestionario: {
    title: 'Cuestionario para el chef | Aldo Lugo · Mesa de Lumbre',
    description: 'Las preguntas que necesitamos que Aldo conteste para publicar su página de banquetes al fuego.',
  },
  demo: {
    franja: 'Demo · contenido por confirmar con el chef',
    franjaCorta: 'Demo · contenido por confirmar',
    franjaCuestionario: 'Demo · cuestionario para el chef',
    enlaceCuestionario: 'Contestar el cuestionario',
    enlaceCorto: 'Cuestionario',
  },
  /** Página 404 (propuesta §6.3). */
  noEncontrado: 'Aquí no hay fuego.',
} as const;

/**
 * Datos operativos que solo el chef tiene. Todos null hasta que conteste.
 * NUNCA poner un teléfono aquí sin su confirmación expresa (P16).
 */
export const DATOS = {
  whatsapp: null as string | null, // E.164 sin "+", p. ej. "52618…". P16
  quienResponde: null as string | null, // P16
  horarioRespuesta: null as { desde: string; hasta: string; dias: number[] } | null, // P17
  promesaRespuesta: null as string | null, // "Te respondo en persona por WhatsApp el mismo día hábil." P17
  ciudadBase: null as string | null, // P12
  zona: null as string | null, // "Durango y [ZONA]" P12
  viaticos: null as string | null, // cómo se cobran fuera de zona. P12
  razonSocial: null as string | null, // P18
  rfc: null as string | null, // P18
  correoArco: null as string | null, // P18
  avisoPrivacidadUrl: null as string | null, // P18
  dominio: null as string | null, // P19
  /** "fundó" o "cofundó" Tacos Canito. P2 */
  canitoVerbo: null as 'fundó' | 'cofundó' | null,
  /** Edad desde la que se cuentan niños como invitados. P27 */
  edadNinos: null as number | null,
};

export const CREDITO_FOTOS = 'Fotos: @ananda_creativo · La Tapada de Luna, Nombre de Dios, 2026'; // P20 (respuesta del chef)
export const CREDITO_MEZCALEROS = 'Horno de tierra del maestro mezcalero Paco Camacho · ritual del evento'; // P28

// =====================================================================================
// Fotos (ids de inventario.csv, recortes del contrato de fotos.json)
// =====================================================================================

export type Recorte = '9x16' | '4x5' | '16x9' | '1x1' | '3x2';
export type Tratamiento = 'brasa' | 'carbon';
export interface FotoRef {
  id: string;
  recorte: Recorte;
  /** brasa = color contenido · carbon = B/N (propuesta §8.3) */
  tratamiento: Tratamiento;
  alt: string;
  credito?: string;
  /** Retoque obligatorio antes de publicar (propuesta §5). */
  retoque?: string;
}
const foto = (id: string, recorte: Recorte, tratamiento: Tratamiento, alt: string, extra: Partial<FotoRef> = {}): FotoRef => ({
  id,
  recorte,
  tratamiento,
  alt,
  ...extra,
});

// =====================================================================================
// 1 · Hero  (#inicio)
// =====================================================================================

export const HERO = {
  antetitulo: 'ALDO chef LUGO · Mesa de Lumbre · Durango',
  h1: 'El fuego pone la mesa.',
  /** Calificación en dos líneas. La segunda lleva zona, "desde" y mínimo (desdePublico / minimoPublico). */
  calificacion: [
    'De 10 a 300 invitados · donde haya espacio para el fuego',
    // se completa en runtime con huecoDesde()/huecoMinimo(); ver calificacionLinea2()
  ],
  subtitulo: 'Ustedes eligen el lugar. Nosotros llevamos el fuego.',
  ctaPrimario: 'Revisar mi fecha',
  ctaSecundario: { texto: 'Ver una noche', href: `#${SECCIONES.unaNoche}` },
  ocasiones: 'Bodas, cumpleaños, fiestas y eventos de empresa cocinados con leña, brasa y rescoldo, frente a tus invitados.',
  credencial: 'Chef invitado en La Tapada de Luna · Nombre de Dios, 2026', // P21
  sello: 'DURANGO, MÉXICO',
  foto: foto('F080', '1x1', 'brasa', 'Aldo Lugo frente al colgadero de hierro, con costillares sobre la leña encendida'),
  fotoEscritorio: foto('F080', '4x5', 'brasa', 'Aldo Lugo frente al colgadero de hierro, con costillares sobre la leña encendida'),
};

// =====================================================================================
// 2 · Manifiesto  (#manifiesto) — voz de Aldo, P23
// =====================================================================================

export const MANIFIESTO = {
  pregunta: 23,
  lineas: [
    'Antes que el plato, está el fuego. Y el fuego viaja: lo llevo al jardín, a la hacienda o al patio de su casa.',
    'La prendo temprano y la dejo hablar. La brasa no se apura; el rescoldo termina lo que la flama empezó; el humo se queda en la ropa como un recuerdo.',
    'Cuelgo la carne sobre la leña, dejo el camote en la ceniza, pongo una olla grande al centro del fuego.',
    'Luego, la mesa larga bajo los mezquites: la conversación se alarga y nadie mira el reloj.',
    'No sirvo una cena. Enciendo una noche.',
  ],
  firma: 'Aldo Lugo',
  datos: [
    '≈200 invitados en el evento',
    [h('número de fuegos', 15), ' de su cocina'],
    'desde las 15:43',
    'La Tapada de Luna, 2026',
  ] as Texto[],
  openLoop: { texto: 'Lo que pasa entre las 15:43 y la sobremesa', href: `#${SECCIONES.unaNoche}` },
  foto: foto('F079', '4x5', 'carbon', 'Leños ardiendo, brasa y ceniza de cerca'),
};

// =====================================================================================
// 3 · Las lumbres  (#lumbres) — propuesta §3. Cada una se publica solo si el chef la confirma (P13).
// =====================================================================================

export interface Lumbre {
  id: string;
  nombre: string;
  vista: string;
  linea: string;
  foto: FotoRef;
  /** El chef confirmó que la monta con su equipo (P13). */
  confirmada: boolean;
}

export const LUMBRES = {
  pregunta: 13,
  titulo: 'Cada pieza pide su fuego.',
  entrada: 'A unas las toca la flama un instante; otras pasan horas colgadas sobre el humo.',
  chip: 'Lo quiero en mi mesa',
  /** Anuncio aria-live al tocar el chip. */
  anuncio: (n: number) =>
    n === 0 ? 'Quitaste los fuegos de tu solicitud.' : `Elegiste ${n} ${n === 1 ? 'fuego' : 'fuegos'}. Los sumamos a tu solicitud.`,
  cierre: [h('especie de leña', 14), ' · La leña la escogemos nosotros.'] as Texto,
  cta: 'Imaginar mi mesa',
  items: [
    {
      id: 'colgadero',
      nombre: 'Colgadero',
      vista: 'Bastidor de hierro con costillares colgados sobre leña',
      linea: 'Tomahawks colgados sobre la leña. Horas de humo antes del primer corte.',
      foto: foto('F252', '4x5', 'brasa', 'Costillares enteros colgados en un bastidor de hierro sobre la leña'),
      confirmada: false,
    },
    {
      id: 'jaula',
      nombre: 'Domo',
      vista: 'Domo de varilla con pollos al romero, coles y berenjenas colgados',
      linea: 'Un domo de varilla con fuego al pie. Pollos al romero y verduras que se doran colgando.',
      foto: foto('F151', '4x5', 'brasa', 'Aldo Lugo, con guante rojo, junto a la jaula de varilla con pollos y verduras colgados sobre el fuego', {
        retoque: 'Coca-Cola',
      }),
      confirmada: false,
    },
    {
      id: 'parrilla',
      nombre: 'Parrilla',
      vista: 'Lomos bridados sobre llama y brasa',
      linea: 'Lomos bridados sobre brasa viva. Costra afuera, jugo adentro.',
      foto: foto('F044', '4x5', 'brasa', 'Lomos bridados sobre la parrilla, entre llama y brasa'),
      confirmada: false,
    },
    {
      id: 'disco',
      nombre: 'Chapa',
      vista: 'Disco de acero con leña al centro y tuétanos',
      linea: 'Acero al rojo con leña al centro. Tuétanos a la chapa.',
      foto: foto('F220', '4x5', 'brasa', 'Disco de acero con leña encendida al centro y tuétanos alrededor'),
      confirmada: false,
    },
    {
      id: 'rescoldo',
      nombre: 'Rescoldo',
      vista: 'Camote tatemado sobre brasa y ceniza',
      linea: 'Zanahorias chamuscadas en leña de manzano, entre la brasa y la ceniza.',
      foto: foto('F250', '4x5', 'brasa', 'Camotes tatemados sobre brasa y ceniza'),
      confirmada: false,
    },
    {
      id: 'olla',
      nombre: 'Olla de leña',
      vista: 'Olla de arroz cremoso sobre la brasa',
      linea: 'Una olla grande sobre la brasa para toda la mesa.',
      foto: foto('F140', '4x5', 'brasa', 'Olla grande de arroz sobre la brasa'),
      confirmada: false,
    },
  ] as Lumbre[],
  /** Solo si el chef las confirma; hoy no se publican (P24). */
  porConfirmar: ['Comal', 'Tatema de chiles', 'Ahumado con manzano', 'Paellera a la leña', 'Rack vertical de humo', 'Zaranda', 'Horno de tierra (solo si él lo ejecuta)'],
};

// =====================================================================================
// 4 · Una noche en Nombre de Dios  (#una-noche) — caso real, horas EXIF. P15 y P21.
// =====================================================================================

export const UNA_NOCHE = {
  titulo: 'Una noche en Nombre de Dios.',
  ficha: ['21 nov 2026', 'Uraján de Luna, Nombre de Dios, Dgo.', '≈200 invitados en el evento', 'Aldo, chef invitado de La Tapada de Luna'],
  /** La organizó y vendió Martha Garza (La Tapada de Luna). No fue un evento privado contratado al chef. */
  aclaracion: 'Un evento de La Tapada de Luna en el que Aldo cocinó como chef invitado.',
  apertura: {
    foto: foto('F019', '16x9', 'brasa', 'Vista aérea al atardecer: mesas largas en cruz, la cocina de leña encendida y la ex hacienda bajo la sierra', {
      retoque: 'Neón "Legado y Mezcal" y rotulación del food truck; el recorte quita Audi',
    }),
    pie: '18:16 · El cielo se pone rosa sobre las mesas en cruz.',
  },
  momentos: [
    { hora: '15:43', texto: 'Se arma la jaula: pollos y verduras colgados sobre la leña.', foto: foto('F028', '4x5', 'brasa', 'Pollos enteros y berenjenas colgados de una estructura de hierro sobre el fuego') },
    { hora: '17:41', texto: 'La cocina queda abierta, a la vista de todos.', foto: foto('F174', '4x5', 'brasa', 'La cocina de fuego abierta: pila de leña, jaula colgante y humo bajo los mezquites') },
    { hora: '18:01', texto: 'Aldo termina los platos con pistache.', foto: foto('F218', '4x5', 'brasa', 'Aldo Lugo espolvorea pistache sobre los platos', { retoque: 'El recorte quita la lata Corona' }) },
    { hora: '19:08', texto: 'Se sirve la cena bajo los arcos.', foto: foto('F303', '4x5', 'brasa', 'Mesas largas llenas de noche, con árboles iluminados y la hacienda al fondo') },
    {
      hora: '20:54',
      texto: 'Los maestros mezcaleros abren el horno de agave.',
      nota: 'Ritual del evento.',
      foto: foto('F358', '4x5', 'brasa', 'Montaña de piñas de agave cocidas, con humo y arcos al fondo', { credito: CREDITO_MEZCALEROS }),
    },
    { hora: '21:39', texto: 'Fogata y sobremesa.', foto: foto('F363', '4x5', 'brasa', 'Fogata de leña al centro del patio, bajo la pérgola, con humo y guirnaldas', { retoque: 'Letrero "XX", celular y carteles' }) },
  ],
  galeria: {
    titulo: 'Lo que no cabe en un menú.',
    /** Miniatura 1x1; `grande` para el lightbox (3x2 horizontales, 4x5 verticales). Pies con hora y lugar, sin adjetivos. */
    fotos: [
      { pie: '17:14 · Campo de agaves y sierra', miniatura: foto('F009', '1x1', 'brasa', 'Campo de agaves y la sierra vistos desde el dron'), grande: foto('F009', '3x2', 'brasa', 'Campo de agaves y la sierra vistos desde el dron') },
      { pie: '16:00 · Pabellón de piedra con piñas de agave', miniatura: foto('F062', '1x1', 'brasa', 'Pabellón de piedra con una pila de piñas de agave y luces colgantes'), grande: foto('F062', '3x2', 'brasa', 'Pabellón de piedra con una pila de piñas de agave y luces colgantes') },
      { pie: '17:02 · Pollo al romero colgado entre berenjenas', miniatura: foto('F139', '1x1', 'brasa', 'Pollo entero amarrado con hilo y romero, colgado entre berenjenas'), grande: foto('F139', '4x5', 'brasa', 'Pollo entero amarrado con hilo y romero, colgado entre berenjenas') },
      { pie: '17:06 · Mesa larga puesta', miniatura: foto('F153', '1x1', 'brasa', 'Mesa larga con bajoplatos de palma, en perspectiva'), grande: foto('F153', '4x5', 'brasa', 'Mesa larga con bajoplatos de palma, en perspectiva') },
      { pie: '17:57 · Queso con ate', miniatura: foto('F203', '1x1', 'brasa', 'Plato de vidrio verde con cubos de queso y ate, visto desde arriba'), grande: foto('F203', '4x5', 'brasa', 'Plato de vidrio verde con cubos de queso y ate, visto desde arriba') },
      { pie: '18:00 · Puré, longaniza asada y pistache', miniatura: foto('F216', '1x1', 'brasa', 'Platos de loza verde con puré, longaniza asada y pistache'), grande: foto('F216', '4x5', 'brasa', 'Platos de loza verde con puré, longaniza asada y pistache') },
      {
        pie: '18:55 · Horno de tierra del evento',
        credito: CREDITO_MEZCALEROS,
        miniatura: foto('F289', '1x1', 'brasa', 'Piedra volcánica incandescente rodeada de piñas de agave', { credito: CREDITO_MEZCALEROS }),
        grande: foto('F289', '3x2', 'brasa', 'Piedra volcánica incandescente rodeada de piñas de agave', { credito: CREDITO_MEZCALEROS }),
      },
    ],
  },
  cta: 'Quiero una noche así',
};

// =====================================================================================
// Oferta (propuesta §4; ESPEC §2.2 oferta.json). Precios null hasta P5.
// =====================================================================================

export type FormatoId = 'mesa-intima' | 'mesa-larga' | 'boda-al-fuego' | 'fuego-de-marca';
export type OcasionId = 'boda' | 'cumpleanos' | 'fiesta' | 'aniversario' | 'familiar' | 'empresa' | 'otro';
export type BandaId = '10-20' | '21-50' | '51-100' | '101-200' | '201-300' | 'mas-300' | 'menos-10';

export interface Formato {
  id: FormatoId;
  nombre: string;
  para: string;
  invitados: [number, number];
  rango: string;
  incluye: Texto[];
  precio:
    | { tipo: 'por_evento'; desde: number | null; extraPorInvitado: number | null; extraDesdeInvitados: number | null; iva: 'incluido' }
    | { tipo: 'por_invitado'; desde: number | null; minimo: number | null; iva: 'incluido' | 'mas_iva' };
  cta: string;
  /** Lo que la tarjeta preselecciona en el formulario (data-preset). */
  preset: { formato: FormatoId; ocasion?: OcasionId; invitados?: BandaId };
  foto: FotoRef;
}

export const OFERTA = {
  pregunta: 5,
  version: '2026-11-24.1',
  moneda: 'MXN',
  ivaTasa: 0.16,
  zonaHoraria: 'America/Monterrey',
  invitados: { min: 10, max: 300 },
  formatos: [
    {
      id: 'mesa-intima',
      nombre: 'Mesa Íntima',
      para: 'Pedidas, aniversarios, cumpleaños y cenas privadas; también bodas íntimas y cenas de empresa chicas.',
      invitados: [10, 20],
      rango: 'De 10 a 20 invitados',
      incluye: ['4 a 6 tiempos servidos y contados por el chef', '2 a 3 fuegos'],
      precio: { tipo: 'por_evento', desde: null, extraPorInvitado: null, extraDesdeInvitados: null, iva: 'incluido' },
      cta: 'Ver si es para mí',
      preset: { formato: 'mesa-intima', invitados: '10-20' },
      foto: foto('F307', '4x5', 'brasa', 'Tuétanos asados en platos de vidrio ámbar sobre una mesa de madera'),
    },
    {
      id: 'mesa-larga',
      nombre: 'Mesa Larga',
      para: 'Cumpleaños, fiestas y celebraciones, aniversarios, reuniones familiares.',
      invitados: [21, 300],
      rango: 'De 21 a 300 invitados',
      incluye: ['Recibimiento', 'Entradas al centro', 'Piezas de 3 a 4 fuegos cortadas frente a la mesa', 'Postre'],
      precio: { tipo: 'por_invitado', desde: null, minimo: null, iva: 'incluido' },
      cta: 'Planear mi mesa',
      preset: { formato: 'mesa-larga' },
      foto: foto('F128', '4x5', 'brasa', 'Mesa larga al aire libre con los arcos de la hacienda al fondo'),
    },
    {
      id: 'boda-al-fuego',
      nombre: 'Boda al Fuego',
      para: 'Bodas, civiles, cenas de bienvenida y tornabodas.',
      invitados: [21, 300],
      rango: 'De 21 a 300 invitados',
      incluye: [
        'Recibimiento y comida al fuego',
        'Coordinación con el planner y el lugar',
        'Visita al lugar',
        ['Degustación · ', h('costo de la degustación', 7)],
      ],
      precio: { tipo: 'por_invitado', desde: null, minimo: null, iva: 'incluido' },
      cta: 'Revisar mi fecha',
      preset: { formato: 'boda-al-fuego', ocasion: 'boda' },
      foto: foto('F255', '4x5', 'brasa', 'Banquete en marcha bajo un árbol iluminado y estrellas de papel', { retoque: 'Carpa de Coca-Cola y neón' }),
    },
    {
      id: 'fuego-de-marca',
      nombre: 'Fuego de Marca',
      para: 'Eventos de empresa: cierres de año, lanzamientos, incentivos, comidas con clientes.',
      invitados: [21, 300],
      rango: 'De 21 a 300 invitados',
      incluye: ['El fuego como escenario', 'Estaciones a la vista', 'Factura CFDI'],
      precio: { tipo: 'por_invitado', desde: null, minimo: null, iva: 'mas_iva' },
      cta: 'Diseñar el encuentro',
      preset: { formato: 'fuego-de-marca', ocasion: 'empresa' },
      foto: foto('F006', '4x5', 'brasa', 'Mesa larga montada con tejidos y centros florales, vista desde arriba', { retoque: 'Revisar' }),
    },
  ] as Formato[],
  /** Regla de asignación (propuesta §4): 10–20 → Íntima; 21–300 por ocasión; > 300 revisión manual. */
  incluyeSiempre: [
    'Revisión del lugar por fotos o video',
    ['Visita al lugar en bodas y en eventos de más de ', h('número de invitados', 8), ' invitados'],
    ['Traslado del equipo de fuego dentro de ', h('zona', 12), ', leña y brigada'],
    'Montaje y desmontaje de la zona de fuego y de la zona de servicio en tu lugar',
    'El terreno limpio y apagado',
  ] as Texto[],
  aparte: [
    'El lugar (renta, derecho de piso o proveedor exclusivo, si el lugar los cobra)',
    'Bebidas',
    'Mobiliario, loza y meseros',
    'Carpa o plan de lluvia',
    'Iluminación',
    ['Viáticos fuera de ', h('zona', 12), ' (traslado, hospedaje y alimentos de la brigada, desglosados)'],
    'Permisos del lugar o de Protección Civil',
  ] as Texto[],
  propina: 'La propina es siempre voluntaria.',
};

export const formatoPorId = (id: FormatoId) => OFERTA.formatos.find((f) => f.id === id)!;

/** Menor "desde" por invitado con IVA de los formatos de 21 a 300 (ESPEC §8.3). null mientras falte. */
export function desdePublico(): number | null {
  const v = OFERTA.formatos
    .filter((f) => f.precio.tipo === 'por_invitado')
    .map((f) => {
      const p = f.precio as Extract<Formato['precio'], { tipo: 'por_invitado' }>;
      return p.desde === null ? null : p.iva === 'mas_iva' ? p.desde * (1 + OFERTA.ivaTasa) : p.desde;
    });
  return v.some((x) => x === null) || v.length === 0 ? null : Math.min(...(v as number[]));
}
/** Menor mínimo por evento de todos los formatos (el "desde" de Íntima es su mínimo). null mientras falte. */
export function minimoPublico(): number | null {
  const v = OFERTA.formatos.map((f) => (f.precio.tipo === 'por_evento' ? f.precio.desde : f.precio.minimo));
  return v.some((x) => x === null) ? null : Math.min(...(v as number[]));
}

/** Segunda línea de calificación del hero, con huecos. */
export const calificacionLinea2 = (): Texto => [
  'Durango y ',
  h('zona', 12, DATOS.zona),
  ' · desde ',
  h('precio', 5, desdePublico(), 'mxn'),
  ' por invitado, IVA incluido · mínimo por evento ',
  h('mínimo', 5, minimoPublico(), 'mxn'),
];

/** Línea de precio de una tarjeta de formato (propuesta §6.3). */
export function lineaPrecio(f: Formato): Texto {
  if (f.precio.tipo === 'por_evento') return ['Precio por evento desde ', h('precio', 5, f.precio.desde, 'mxn'), ', IVA incluido'];
  const masIva = f.precio.iva === 'mas_iva';
  return [
    'Desde ',
    h('precio', 5, f.precio.desde, 'mxn'),
    masIva ? ' por invitado + IVA · mínimo ' : ' por invitado, IVA incluido · mínimo ',
    h('mínimo', 5, f.precio.minimo, 'mxn'),
    ...(masIva ? [' · con factura'] : []),
  ];
}

export const OCASIONES: { id: OcasionId; etiqueta: string; formato21a300: FormatoId; b2b?: boolean }[] = [
  { id: 'boda', etiqueta: 'Boda', formato21a300: 'boda-al-fuego' },
  { id: 'cumpleanos', etiqueta: 'Cumpleaños', formato21a300: 'mesa-larga' },
  { id: 'fiesta', etiqueta: 'Fiesta o celebración', formato21a300: 'mesa-larga' },
  { id: 'aniversario', etiqueta: 'Aniversario o pedida', formato21a300: 'mesa-larga' },
  { id: 'familiar', etiqueta: 'Reunión familiar', formato21a300: 'mesa-larga' },
  { id: 'empresa', etiqueta: 'Evento de empresa', formato21a300: 'fuego-de-marca', b2b: true },
  { id: 'otro', etiqueta: 'Otro', formato21a300: 'mesa-larga' },
];

export const BANDAS: { id: BandaId; etiqueta: string; min: number; max: number | null; nRef: number | null; accion: 'normal' | 'revision_manual' | 'salida_amable' }[] = [
  { id: '10-20', etiqueta: '10–20', min: 10, max: 20, nRef: 15, accion: 'normal' },
  { id: '21-50', etiqueta: '21–50', min: 21, max: 50, nRef: 35, accion: 'normal' },
  { id: '51-100', etiqueta: '51–100', min: 51, max: 100, nRef: 75, accion: 'normal' },
  { id: '101-200', etiqueta: '101–200', min: 101, max: 200, nRef: 150, accion: 'normal' },
  { id: '201-300', etiqueta: '201–300', min: 201, max: 300, nRef: 250, accion: 'normal' },
  { id: 'mas-300', etiqueta: 'Más de 300', min: 301, max: null, nRef: 300, accion: 'revision_manual' },
  { id: 'menos-10', etiqueta: 'Menos de 10', min: 1, max: 9, nRef: null, accion: 'salida_amable' },
];

/** Paquete sugerido (propuesta §7.3). null con menos de 10. */
export function formatoSugerido(banda: BandaId | null, ocasion: OcasionId | null): { formato: FormatoId; revisionManual: boolean } | null {
  if (!banda || banda === 'menos-10') return null;
  if (banda === '10-20') return { formato: 'mesa-intima', revisionManual: false };
  const oc = OCASIONES.find((o) => o.id === ocasion);
  return { formato: oc?.formato21a300 ?? 'mesa-larga', revisionManual: banda === 'mas-300' };
}

// =====================================================================================
// El lugar (propuesta §4 "Qué necesitamos del lugar"; ESPEC oferta.json → lugar). P10–P12.
// =====================================================================================

export const LUGAR = {
  pregunta: 10,
  estado: [
    { id: 'si', etiqueta: 'Sí' },
    { id: 'opciones', etiqueta: 'Tengo opciones' },
    { id: 'aun_no', etiqueta: 'Aún no' },
  ],
  tipos: [
    { id: 'jardin', etiqueta: 'Jardín o quinta' },
    { id: 'hacienda', etiqueta: 'Hacienda o rancho' },
    { id: 'casa', etiqueta: 'Casa o terraza' },
    { id: 'salon', etiqueta: 'Salón con área exterior' },
    { id: 'otro', etiqueta: 'Otro' },
  ],
  fuego: [
    { id: 'si', etiqueta: 'Sí' },
    { id: 'no_se', etiqueta: 'No sé' },
    { id: 'no', etiqueta: 'No' },
  ],
  /** Chips de zona (P12). `etiqueta` null = pendiente; `provisional` es lo que pinta el demo. */
  zonas: [
    { id: 'base', etiqueta: null as string | null, provisional: 'Ciudad base del chef y alrededores', cubierta: true as boolean | null, viaticos: false as boolean | null },
    { id: 'durango', etiqueta: 'Resto de Durango', provisional: 'Resto de Durango', cubierta: null, viaticos: null },
    { id: 'laguna', etiqueta: 'La Laguna', provisional: 'La Laguna', cubierta: null, viaticos: null },
    { id: 'monterrey', etiqueta: 'Monterrey', provisional: 'Monterrey', cubierta: null, viaticos: null },
    { id: 'mazatlan', etiqueta: 'Mazatlán', provisional: 'Mazatlán', cubierta: null, viaticos: null },
    { id: 'fuera', etiqueta: 'Otro lugar', provisional: 'Otro lugar', cubierta: null, viaticos: null },
  ],
  /** Para el <datalist> del municipio (Durango y La Laguna). Lista pública de municipios, no dato del chef. */
  municipios: [
    'Durango', 'Gómez Palacio', 'Lerdo', 'Nombre de Dios', 'Santiago Papasquiaro', 'Canatlán', 'Pueblo Nuevo (El Salto)',
    'Guadalupe Victoria', 'Poanas', 'Vicente Guerrero', 'Mezquital', 'Nuevo Ideal', 'Pánuco de Coronado', 'Tlahualilo',
    'Mapimí', 'Cuencamé', 'Torreón', 'Matamoros (Coahuila)', 'San Pedro (Coahuila)', 'Francisco I. Madero (Coahuila)',
  ],
  /** ¿Se ofrece sugerir lugares que aceptan fuego? null = pendiente (P11). */
  sugerirLugares: null as boolean | null,
  /** Medidas (P10). null hasta que el chef confirme. */
  requisitos: {
    fuegoM: null as [number, number] | null, // zona de fuego, m × m
    servicioM2: null as number | null, // zona de servicio y emplatado
    accesoMaxM: null as number | null, // vehículo a menos de N m
    m2PorInvitados: { 100: null, 200: null, 300: null } as Record<100 | 200 | 300, number | null>,
  },
  /** Tabla "Qué necesitamos del lugar" (Así trabajamos y FAQ 1). */
  necesitamos: [
    { titulo: 'Espacio para el fuego', texto: ['Un área al aire libre de unos ', h('medidas', 10), ' para la zona de fuego, más ', h('m²', 10), ' para la zona de servicio y emplatado. Crece con el número de invitados.'] },
    { titulo: 'Fuego permitido', texto: 'Que el lugar, y el municipio, permitan leña o fuego abierto.' },
    { titulo: 'Suelo y entorno', texto: 'Piso firme o tierra, lejos de lonas, ramas bajas y materiales que ardan. Orientamos la cocina para que el viento lleve el humo lejos de la mesa.' },
    { titulo: 'Acceso', texto: ['Que un vehículo llegue a la zona de fuego o a menos de ', h('distancia', 10), '.'] },
    { titulo: 'Plan de lluvia', texto: 'Techo abierto o carpa ventilada, sobre todo en temporada de lluvias.' },
    { titulo: 'Servicios', texto: ['Agua y luz cerca de la zona de servicio · ', h('si hacen falta', 10)] },
  ] as { titulo: string; texto: Texto }[],
  resumen: [
    'Un espacio al aire libre de unos ', h('medidas', 10), ' para el fuego y ', h('m²', 10), ' para servir · que el lugar permita leña · que el equipo llegue en vehículo a menos de ', h('distancia', 10), ' · un techo abierto o carpa si llueve. El fuego, el equipo y la brigada los llevamos nosotros.',
  ] as Texto,
  noPermiteFuego: [h('alternativa si no se permite fuego', 11)] as Texto,
};

// =====================================================================================
// 5 · Experiencias  (#experiencias)
// =====================================================================================

export const EXPERIENCIAS = {
  titulo: 'Cuatro formas de sentarse al fuego.',
  entrada: 'Ustedes eligen el lugar. Nosotros llevamos el fuego. De 10 a 300 invitados, en un jardín, una hacienda, un rancho, una quinta, una terraza o su casa.',
  /** Pie visible en cada tarjeta hasta tener fotos de eventos propios (v3). */
  pieFoto: CREDITO_FOTOS,
  queIncluye: 'Qué incluye',
  asiSeVio: {
    titulo: 'Así se vio una mesa',
    pregunta: 15,
    items: ['Quesos con ate', 'Tuétanos al disco', 'Longaniza con pistache', 'Lomo bridado y costillar', 'Pollo al romero', 'Camote al rescoldo', 'Arroz en olla', 'Postre'],
  },
  mas300: '¿Más de 300 invitados? Lo revisamos contigo.',
  aliado: '¿Eres planner o tienes un lugar para eventos? Hablemos',
};

// =====================================================================================
// 6 · El anfitrión  (#anfitrion) — P30, P2
// =====================================================================================

export const ANFITRION = {
  titulo: 'El que cuida el fuego.',
  pregunta: 30,
  /** Bio en tercera persona [CONFIRMAR cada dato]. Mallmann en nivel 0: no se nombra. */
  bio: 'Aldo Lugo lleva dieciocho años en la cocina: una cocina libre y de mucha técnica. En sus mesas de fuego cuelga costillares sobre la leña, deja el camote en el rescoldo y pone una olla grande al centro de la brasa. Entre las cocinas que lo inspiran está la de fuego abierto que Francis Mallmann popularizó.', // P30 · P31 · P3 nivel 1
  cita: SITIO.bioCita,
  /** ÚNICA mención de Canito en todo el sitio. Sin fotos, colores ni logos de Canito. */
  canito: {
    texto: 'También fundó Tacos Canito', // P2: "fundó" o "cofundó"; nombre oficial
    href: 'https://www.instagram.com/tacoscanito/',
    pregunta: 2,
  },
  foto: foto('F249', '4x5', 'brasa', 'Aldo Lugo emplata a contraluz, al atardecer'),
  fotoSecundaria: foto('F042', '4x5', 'carbon', 'Aldo Lugo mira a cámara con un lomo bridado sobre la brasa y costillares colgados arriba'),
  cta: 'Revisar mi fecha',
};

// =====================================================================================
// 7 · Así trabajamos  (#proceso)
// =====================================================================================

export const PROCESO = {
  titulo: 'De tu mensaje a la última brasa.',
  pasos: [
    'Contestas 6 pantallas, unos 90 segundos.',
    'Nos mandas fotos o video de tu lugar por WhatsApp.',
    ['Te mandamos la propuesta en ', h('plazo', 17), '.'],
    ['Visitamos el lugar en bodas y en eventos de más de ', h('número de invitados', 8), ' invitados; degustación en bodas · ', h('costo de la degustación', 7)],
    ['Contrato y ', h('anticipo', 7), ' de anticipo.'],
    'El día del evento llegamos horas antes, montamos el fuego y entregamos el terreno limpio y apagado.',
  ] as Texto[],
  lugarTitulo: 'Qué necesitamos del lugar',
  /** Franja de confianza [CONFIRMAR]. */
  confianza: { items: ['Contrato', 'CFDI 4.0', 'Precios con IVA', 'Seguro de RC', 'Aviso de privacidad'], confirmado: false, pregunta: 26 },
  ctaFotos: 'Mandar fotos de mi lugar',
};

// =====================================================================================
// 8 · Preguntas  (#preguntas) — 9 FAQ de la propuesta §6.5
// =====================================================================================

export const FAQ: { titulo: string; items: { pregunta: string; respuesta: Texto; confirmar?: number }[] } = {
  titulo: 'Antes de cotizar',
  items: [
    {
      pregunta: '¿Qué necesitan del lugar?',
      respuesta: [
        'Puede ser un jardín, una hacienda, un rancho, una quinta, una terraza, el patio de una casa o un salón con área exterior. Pedimos cuatro cosas: un espacio al aire libre de unos ',
        h('medidas', 10),
        ' para el fuego, más ',
        h('m²', 10),
        ' para servir, con piso firme y lejos de lonas y ramas bajas; que el lugar permita leña o fuego abierto; que el equipo llegue en vehículo a menos de ',
        h('distancia', 10),
        '; y techo abierto o carpa ventilada por si llueve. Ubicamos la cocina para que el viento lleve el humo lejos de la mesa. Mándanos fotos o un video y te decimos si funciona.',
      ],
      confirmar: 10,
    },
    {
      pregunta: '¿Cuál es el mínimo de invitados?',
      respuesta: [
        'Cocinamos para eventos de 10 a unos 300 invitados. De 10 a 20 es Mesa Íntima, con un precio por evento de ',
        h('precio', 5),
        ', IVA incluido. Con menos de 10, por ahora no montamos el servicio completo. Con más de 300, lo revisamos contigo.',
      ],
      confirmar: 5,
    },
    {
      pregunta: '¿Se necesita permiso?',
      respuesta: [
        'Depende del lugar y del municipio. Lo revisamos con el lugar y con Protección Civil si aplica. Llevamos extintores (',
        h('equipo de seguridad', 9),
        ') y entregamos el terreno limpio y apagado.',
      ],
      confirmar: 26,
    },
    {
      pregunta: '¿Y si llueve, hay viento o es temporada de incendios?',
      respuesta:
        'Siempre planeamos un plan B bajo techo abierto o carpa ventilada; la carpa, si hace falta, va aparte. En temporada de incendios (en la sierra, aproximadamente de febrero a junio) seguimos la NOM-015 y las restricciones locales, y adaptamos el lugar o el formato.',
      confirmar: 26,
    },
    {
      pregunta: '¿Alergias, dietas o niños?',
      respuesta:
        'Sí, desde el diseño del menú. Para alergias severas usamos superficies y utensilios separados. Solo pedimos el tipo de restricción y cuántas personas la tienen.',
      confirmar: 27,
    },
    {
      pregunta: '¿Cuánto cuesta y qué incluye?',
      respuesta: [
        'De 21 a 300 invitados, desde ',
        h('precio', 5),
        ' por invitado, con un mínimo por evento según el formato; de 10 a 20 (Mesa Íntima), desde ',
        h('precio', 5),
        ' por evento. IVA incluido. Para empresas (Fuego de Marca), desde ',
        h('precio', 5),
        ' por invitado + IVA, con CFDI. Incluye fuego, equipo, leña, brigada, montaje en tu lugar y limpieza. Bebidas, mobiliario, loza, meseros, carpa y viáticos fuera de ',
        h('zona', 12),
        ' van aparte.',
      ],
      confirmar: 6,
    },
    {
      pregunta: '¿Cómo aparto y si cancelo?',
      respuesta: [
        'Con contrato y ',
        h('anticipo', 7),
        ' de anticipo. El número de invitados se confirma ',
        h('días antes', 7),
        '. Con ',
        h('días de aviso', 7),
        ' puedes reprogramar. Facturamos CFDI 4.0.',
      ],
      confirmar: 7,
    },
    {
      pregunta: '¿Hasta dónde van?',
      respuesta: [
        'A donde haya espacio para el fuego, en ',
        h('ciudad base', 12),
        ' y ',
        h('zona', 12),
        '. Fuera de ahí, el traslado y los viáticos de la brigada van desglosados en tu propuesta.',
      ],
      confirmar: 12,
    },
    {
      pregunta: '¿Trabajan con mi planner o el lugar?',
      respuesta:
        'Sí, desde la primera visita. Si eres planner o tienes un lugar para eventos, el formulario tiene una ruta para ti.',
      confirmar: 32,
    },
  ],
};

// =====================================================================================
// 9 · Tu fecha  (#tu-fecha) y 10 · Cierre  (#cierre)
// =====================================================================================

export const TU_FECHA = {
  titulo: 'Revisa tu fecha.',
  entrada: 'Preguntamos antes de cotizar para no hacerte perder tiempo.',
  foto: foto('F339', '9x16', 'carbon', ''), // fondo decorativo, oscurecido y desenfocado en el export
  fotoEscritorio: foto('F339', '16x9', 'carbon', ''),
};

export const CIERRE = {
  titulo: 'El próximo fuego puede ser el tuyo.',
  subtitulo: 'Cuéntanos tu evento en 90 segundos. Te respondo en persona por WhatsApp.', // P16/P17
  foto: foto('F013', '9x16', 'brasa', 'La sierra de Durango al atardecer, con el valle y la hacienda en penumbra'),
  fotoEscritorio: foto('F013', '16x9', 'brasa', 'La sierra de Durango al atardecer, con el valle y la hacienda en penumbra'),
};

// =====================================================================================
// CTAs y WhatsApp (propuesta §6.4)
// =====================================================================================

export const CTA = {
  principal: 'Cotiza tu evento',
  verNoche: 'Ver una noche',
  imaginarMesa: 'Imaginar mi mesa',
  nocheAsi: 'Quiero una noche así',
  fotosLugar: 'Mandar fotos de mi lugar',
  whatsapp: 'Escribir por WhatsApp',
  enviar: 'Enviar y seguir por WhatsApp',
  abrirWa: 'Abrir WhatsApp con mi resumen',
};

export const MENSAJES_WA = {
  fotosLugar: 'Hola, Aldo. Te mando fotos del lugar de mi evento. Ciudad: __ · Fecha: __',
  directo: 'Hola, Aldo. Vi tu página. Evento: __ · Fecha: __ · Invitados: __ · Ciudad y lugar: __',
  mas300: 'Hola, Aldo. Vi tu página. Mi evento es de más de 300 invitados. Fecha: __ · Ciudad y lugar: __',
  aliado: 'Hola, Aldo. Soy planner / tengo un lugar para eventos y me gustaría platicar.',
};

/** Aviso del demo para cualquier botón de WhatsApp (úsalo con data-al-aviso). */
export const AVISO_WA_DEMO = 'Demo: el WhatsApp del chef está por confirmar, así que este botón todavía no abre nada.';

/** href de wa.me o null si el número sigue pendiente (en ese caso pinta el botón con data-al-aviso). */
export const waHref = (mensaje: string) => (DATOS.whatsapp ? `https://wa.me/${DATOS.whatsapp}?text=${encodeURIComponent(mensaje)}` : null);

// =====================================================================================
// Formulario de prospectos (propuesta §7.1; ESPEC §8.2). En el DEMO no envía nada.
// =====================================================================================

export const FORMULARIO = {
  titulo: 'Revisa tu fecha',
  progreso: (i: number, total: number) => `Paso ${i} de ${total}`,
  /** Curva de progreso (ESPEC §8.2): más rápida al inicio. */
  curva: [18, 36, 52, 66, 80, 92],
  continuar: 'Continuar',
  atras: 'Atrás',
  pasos: [
    {
      id: 'fecha',
      pregunta: '¿Para cuándo?',
      estados: [
        { id: 'dia', etiqueta: 'Tengo fecha' },
        { id: 'mes', etiqueta: 'Aún no tengo día' },
        { id: 'sin_fecha', etiqueta: 'Todavía no tengo fecha' },
      ],
      flexible: 'Mis fechas son flexibles',
      horizonteMeses: 36,
      avisoPronto: 'Es pronto, pero pregúntanos.',
      semanasPronto: 3,
    },
    {
      id: 'ocasion',
      pregunta: '¿Qué vamos a celebrar?',
      aliado: '¿Eres planner o tienes un lugar para eventos?',
    },
    {
      id: 'invitados',
      pregunta: '¿Cuántos invitados?',
      ayuda: ['Un aproximado basta. Cuenta a los niños desde ', h('edad', 27, DATOS.edadNinos), ' años.'] as Texto,
      mas300: 'Lo revisamos contigo.',
      menos10: {
        texto: 'Por ahora cocinamos para eventos desde 10 invitados. Si tu grupo puede crecer, cambia el número; si no, escríbenos y te orientamos.',
        cambiar: 'Cambiar el número',
        whatsapp: 'Escribir por WhatsApp',
      },
    },
    {
      id: 'lugar',
      pregunta: '¿Dónde será?',
      estado: '¿Ya tienes lugar?',
      tipo: '¿Qué tipo de lugar?',
      fuego: '¿Hay espacio al aire libre para el fuego y el lugar permite leña?',
      zona: '¿En qué zona?',
      municipio: 'Municipio o ciudad',
      municipioAyuda: 'Solo el municipio; la dirección la vemos después.',
      sugerir: '¿Te sugerimos lugares que aceptan fuego?',
      fuegoNo: 'Cuéntanos igual; vemos alternativas.',
    },
    {
      id: 'inversion',
      pregunta: '¿Qué inversión tienes en mente?',
      unidad: 'por invitado',
      /** Cortes [A, B, C] por invitado (P5). null → las bandas se pintan con `provisional` + chip. */
      cortes: null as [number, number, number] | null,
      opciones: [
        { id: 'b1', provisional: 'Rango 1' },
        { id: 'b2', provisional: 'Rango 2' },
        { id: 'b3', provisional: 'Rango 3' },
        { id: 'b4', provisional: 'Rango 4' },
        { id: 'platicar', provisional: 'Prefiero platicarlo' },
      ],
      ayuda: (): Texto => [
        'Desde ',
        h('precio', 5, desdePublico(), 'mxn'),
        ' por invitado, IVA incluido · mínimo por evento ',
        h('mínimo', 5, minimoPublico(), 'mxn'),
      ],
    },
    {
      id: 'contacto',
      pregunta: '¿A quién le escribimos?',
      nombre: 'Tu nombre',
      whatsapp: 'Tu WhatsApp',
      paises: [
        { id: '52', etiqueta: '+52 México' },
        { id: '1', etiqueta: '+1 EE. UU.' },
      ],
      correo: 'Correo (opcional)',
      empresa: 'Empresa',
      privacidad: 'Usamos tus datos solo para responder tu solicitud.',
      privacidadEnlace: 'Aviso de privacidad',
      enviar: 'Enviar y seguir por WhatsApp',
    },
  ],
  mensajes: {
    falta: 'Nos falta este dato para revisar tu fecha.',
    wa: 'Revisa el número: son 10 dígitos.',
    nombre: 'Escribe tu nombre (2 caracteres o más).',
    correo: 'Revisa el correo.',
    fallo: 'No se pudo enviar. Mándalo por WhatsApp y no pierdes nada.',
    recuperar: (i: number, total: number) => `¿Seguimos donde te quedaste? Paso ${i} de ${total}`,
  },
  /** Autoguardado local (try/catch), caduca a los 7 días; nombre y WhatsApp no se guardan. */
  almacen: { clave: 'ml-solicitud-v1', dias: 7 },
};

export const GRACIAS = {
  sello: 'RECIBIDO',
  titulo: 'Listo. El fuego ya está prendido.',
  enHorario: 'Toca el botón: se abre WhatsApp con tu resumen.',
  boton: CTA.abrirWa,
  copiarFolio: 'Copiar folio',
  fotos: 'Mándanos fotos o un video del lugar, con el espacio donde iría el fuego.',
  afina: 'Afina tu propuesta',
  verNoche: 'Así fue una noche en Nombre de Dios',
  /** Solo en DEMO, sobre la vista previa del mensaje. */
  demoNota: 'Es un demo: no se envió ni se guardó nada. Así se vería el mensaje que te llevaría a WhatsApp:',
};

/** Opciones de "Afina tu propuesta" (propuesta §7.2) [ESTIMADO]. */
export const AFINA = {
  acceso: [
    { id: 'vehiculo', etiqueta: 'Un vehículo llega a la zona' },
    { id: 'cargar_poco', etiqueta: 'Hay que cargar un tramo corto' },
    { id: 'cargar_mucho', etiqueta: 'Escaleras o un tramo largo' },
    { id: 'no_se', etiqueta: 'No sé' },
  ],
  lluvia: [
    { id: 'hay_techo', etiqueta: 'Hay techo o carpa' },
    { id: 'rentariamos_carpa', etiqueta: 'Rentaríamos carpa' },
    { id: 'aun_no', etiqueta: 'Aún no' },
  ],
  exclusivo: [
    { id: 'si', etiqueta: 'Sí' },
    { id: 'no', etiqueta: 'No' },
    { id: 'no_se', etiqueta: 'No sé' },
  ],
  dietas: ['Vegetariano', 'Vegano', 'Sin gluten', 'Sin lácteos', 'Sin cerdo', 'Sin mariscos', 'Frutos secos', 'Otra'],
  momento: [
    { id: 'comida', etiqueta: 'Comida' },
    { id: 'tarde', etiqueta: 'Tarde' },
    { id: 'noche', etiqueta: 'Noche' },
  ],
  servicio: [
    { id: 'mesa_larga', etiqueta: 'Mesa larga al centro' },
    { id: 'tiempos', etiqueta: 'Tiempos servidos' },
    { id: 'estaciones', etiqueta: 'Estaciones' },
    { id: 'coctel', etiqueta: 'Cóctel' },
  ],
  bebidas: [
    { id: 'las_pongo', etiqueta: 'Las pongo yo' },
    { id: 'recomendacion', etiqueta: 'Quiero recomendación' },
    { id: 'no_se', etiqueta: 'No sé' },
  ],
  mobiliario: [
    { id: 'lo_tiene_el_lugar', etiqueta: 'El lugar lo tiene' },
    { id: 'lo_rento', etiqueta: 'Lo rento yo' },
    { id: 'que_lo_coordinen', etiqueta: 'Quiero que lo coordinen' },
    { id: 'no_se', etiqueta: 'No sé' },
  ],
  decide: [
    { id: 'yo', etiqueta: 'Yo' },
    { id: 'pareja_o_familia', etiqueta: 'En pareja o familia' },
    { id: 'empresa_o_comite', etiqueta: 'Empresa o comité' },
  ],
  etapa: [
    { id: 'explorando', etiqueta: 'Explorando' },
    { id: 'comparando', etiqueta: 'Comparando' },
    { id: 'listo', etiqueta: 'Listo para apartar' },
  ],
  propuesta: [
    { id: 'esta_semana', etiqueta: 'Esta semana' },
    { id: 'este_mes', etiqueta: 'Este mes' },
    { id: 'sin_prisa', etiqueta: 'Sin prisa' },
  ],
  factura: [
    { id: 'si', etiqueta: 'Sí' },
    { id: 'no', etiqueta: 'No' },
  ],
};

// =====================================================================================
// Utilidades puras para el formulario (se pueden importar en <script> del cliente)
// =====================================================================================

/** Folio no secuencial: ML-7Q4KX (sin 0/O/1/I/L). */
export function nuevoFolio(): string {
  const A = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  const n = new Uint32Array(5);
  try {
    crypto.getRandomValues(n);
  } catch {
    for (let i = 0; i < 5; i++) n[i] = Math.floor(Math.random() * 2 ** 32);
  }
  return 'ML-' + Array.from(n, (x) => A[x % A.length]).join('');
}

/** Normalización del WhatsApp (ESPEC §8.2): acepta "+52 1 618…", "618-123-4567", "044 618…", "+1 (915)…". */
export function normalizarWa(v: string, paisSel: '52' | '1') {
  const t = v.trim();
  let n = t.replace(/\D/g, '');
  let pais = paisSel;
  if (/^(\+1|001)/.test(t)) pais = '1';
  else if (/^(\+52|0052)/.test(t)) pais = '52';
  if (n.startsWith('00')) n = n.slice(2);
  if (pais === '52') {
    for (const p of ['521', '52', '044', '045', '1']) if (n.startsWith(p) && n.length - p.length === 10) { n = n.slice(p.length); break; }
  } else if (n.length === 11 && n.startsWith('1')) n = n.slice(1);
  const valido = pais === '52' ? /^\d{10}$/.test(n) : /^[2-9]\d{2}[2-9]\d{6}$/.test(n);
  return { pais, n, e164: `+${pais}${n}`, valido };
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** "2027-03-13" → "13 mar 2027" · "2027-03" → "marzo 2027" · null → "Fecha por definir" */
export function fechaCorta(iso: string | null): string {
  if (!iso) return 'Fecha por definir';
  const [a, m, d] = iso.split('-').map(Number);
  return d ? `${d} ${MESES_CORTOS[m - 1]} ${a}` : `${MESES[m - 1]} ${a}`;
}

export interface Resumen {
  folio: string;
  ocasion: OcasionId | null;
  fecha: string | null; // AAAA-MM-DD o AAAA-MM
  flexible?: boolean;
  invitados: BandaId | null;
  municipio?: string | null;
  tipoLugar?: string | null;
  lugarEstado?: string | null;
}

/** Mensaje prellenado de WhatsApp (propuesta §7.4): sin nombre, correo, inversión ni datos sensibles. */
export function mensajeWhatsApp(r: Resumen): string {
  const oc = OCASIONES.find((o) => o.id === r.ocasion)?.etiqueta ?? 'Evento';
  const banda = BANDAS.find((b) => b.id === r.invitados)?.etiqueta;
  const tipo = LUGAR.tipos.find((t) => t.id === r.tipoLugar)?.etiqueta;
  const estado = { si: 'lugar: ya tengo', opciones: 'lugar: tengo opciones', aun_no: 'lugar: aún no' }[r.lugarEstado ?? ''] ?? null;
  const partes = [
    oc,
    fechaCorta(r.fecha) + (r.flexible ? ' (flexible)' : ''),
    banda ? `${banda} invitados` : null,
    r.municipio || null,
    [tipo, estado].filter(Boolean).join(', ') || null,
  ].filter(Boolean);
  return `Hola, Aldo. Te escribo por mi folio ${r.folio}.\n${partes.join(' · ')}.\nQuedo pendiente de la propuesta.`;
}

// =====================================================================================
// Inventario de fotos que usa la landing (para el pipeline de fotos)
// =====================================================================================

function reunirFotos(): FotoRef[] {
  const todas: FotoRef[] = [
    HERO.foto, HERO.fotoEscritorio, MANIFIESTO.foto,
    ...LUMBRES.items.map((l) => l.foto),
    UNA_NOCHE.apertura.foto, ...UNA_NOCHE.momentos.map((m) => m.foto),
    ...UNA_NOCHE.galeria.fotos.flatMap((g) => [g.miniatura, g.grande]),
    ...OFERTA.formatos.map((f) => f.foto),
    ANFITRION.foto, ANFITRION.fotoSecundaria,
    TU_FECHA.foto, TU_FECHA.fotoEscritorio,
    CIERRE.foto, CIERRE.fotoEscritorio,
  ];
  const vistas = new Map<string, FotoRef>();
  for (const f of todas) vistas.set(`${f.id}-${f.recorte}`, f);
  return [...vistas.values()];
}
/** Una entrada por "<id>-<recorte>" (la clave de fotos.json). OG aparte: public/aldo-lugo/og.jpg con F019. */
export const FOTOS_REQUERIDAS = reunirFotos();
