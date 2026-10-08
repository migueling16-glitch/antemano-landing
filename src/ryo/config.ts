/**
 * Ryo Café — configuración de la página de bio.
 *
 * Todo el contenido editable vive aquí. La página (RyoCafe.astro) no tiene
 * textos hardcodeados: cambia algo en este archivo y se refleja en el sitio.
 * Ver README.md en esta carpeta para migrar a otro dominio o proyecto.
 *
 * Los TODO marcan lo que falta confirmar con el cliente antes de publicar.
 */

/* ─────────────────────────────────────────────────────────────
   NEGOCIO
   ───────────────────────────────────────────────────────────── */

export const NEGOCIO = {
  nombre: 'Ryo Café',
  /** Para el <title> y el pie */
  descriptor: 'Café de especialidad',
  /**
   * Slogan oficial del manual de identidad. Va en inglés, en mayúsculas,
   * con la coma y el punto finales. No traducir ni parafrasear.
   * NOTA: el manual lo escribe "SIPING" (con una P). Si el cliente confirma
   * que es errata, cambiarlo aquí y en el SVG `tagline`.
   */
  slogan: 'SOFT LIVING, DEEP SIPING.',
  /** Frase corta del hero, tono del manifiesto */
  tagline: 'Un lugar para bajar el ritmo.',

  ciudad: 'Durango, Dgo.',
  /** Dirección exacta. Confirmada por el cliente (misma sede que Yasuko Durango). */
  direccion: 'Blvd. Domingo Arrieta 909, Lienzo Charro',
  cp: '34170',
  /** TODO: reemplazar por el link corto del pin real de Google Maps del local. */
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Blvd.+Domingo+Arrieta+909+Lienzo+Charro+34170+Durango+Dgo',

  /** Handle sin @. Confirmado por el cliente: instagram.com/ryocafe_ */
  instagram: 'ryocafe_',
  /** Solo dígitos con lada país, sin + ni espacios. Vacío = se oculta el acceso. */
  whatsapp: '',
  telefono: '',
  email: '',

  /** Durango no aplica horario de verano: UTC-6 todo el año. */
  utcOffset: -6,
} as const;

/* ─────────────────────────────────────────────────────────────
   HORARIO
   Se usa para el estado en vivo del hero ("Abierto · cierra 21:00")
   y para la tabla de la sección Visítanos.
   `cierra: null` = cerrado ese día.
   TODO: confirmar horarios reales. Los de abajo son una propuesta.
   ───────────────────────────────────────────────────────────── */

export const HORARIO = [
  { dia: 0, nombre: 'Domingo',   abre: '08:30', cierra: '19:00' },
  { dia: 1, nombre: 'Lunes',     abre: '07:30', cierra: '21:00' },
  { dia: 2, nombre: 'Martes',    abre: '07:30', cierra: '21:00' },
  { dia: 3, nombre: 'Miércoles', abre: '07:30', cierra: '21:00' },
  { dia: 4, nombre: 'Jueves',    abre: '07:30', cierra: '21:00' },
  { dia: 5, nombre: 'Viernes',   abre: '07:30', cierra: '22:00' },
  { dia: 6, nombre: 'Sábado',    abre: '08:30', cierra: '22:00' },
] as const;

/* ─────────────────────────────────────────────────────────────
   ACCESOS
   Los destinos de la página. Investigación de link-in-bio: entre 3 y 7
   visibles, uno dominante. `activo: false` lo deja escrito pero apagado.
   `principal` es el botón grande del hero (solo uno).
   ───────────────────────────────────────────────────────────── */

export type Acceso = {
  id: string;
  etiqueta: string;
  detalle: string;
  /** '#ancla' para secciones de esta misma página, o URL completa */
  href: string;
  activo: boolean;
  externo?: boolean;
};

/** Acción #1: cómo llegar. Ocupa el bloque grande del hero. */
export const ACCESO_PRINCIPAL = {
  etiqueta: 'Cómo llegar',
  detalle: 'Abrir en Google Maps',
} as const;

export const ACCESOS: Acceso[] = [
  {
    id: 'menu',
    etiqueta: 'Menú',
    detalle: 'Bebidas, bar y cocina',
    href: '#menu',
    activo: true,
  },
  {
    id: 'visita',
    etiqueta: 'Horarios',
    detalle: 'Todos los días de la semana',
    href: '#visita',
    activo: true,
  },
  {
    id: 'instagram',
    etiqueta: 'Instagram',
    detalle: `@${NEGOCIO.instagram}`,
    href: `https://instagram.com/${NEGOCIO.instagram}`,
    activo: true,
    externo: true,
  },
  {
    id: 'whatsapp',
    etiqueta: 'WhatsApp',
    detalle: 'Pedidos para llevar',
    href: `https://wa.me/${NEGOCIO.whatsapp}`,
    // TODO: poner el número en NEGOCIO.whatsapp y cambiar a true.
    activo: false,
    externo: true,
  },
  {
    id: 'grano',
    etiqueta: 'Café en grano',
    detalle: 'Bolsas de nuestro tostado',
    href: '',
    // TODO: activar cuando exista tienda o catálogo.
    activo: false,
    externo: true,
  },
  {
    id: 'delivery',
    etiqueta: 'Pedir a domicilio',
    detalle: 'Uber Eats · Rappi · DiDi Food',
    href: '',
    // TODO: activar cuando estén dados de alta.
    activo: false,
    externo: true,
  },
];

/* ─────────────────────────────────────────────────────────────
   MANIFIESTO
   Extracto del manifiesto de marca (Manual de identidad, pág. 2).
   Cada línea se revela por separado al hacer scroll.
   ───────────────────────────────────────────────────────────── */

export const MANIFIESTO = [
  'En un mundo que corre sin mirar, Ryo Café invita a detenerse.',
  'A escuchar el sonido del agua vertiéndose sobre el café recién molido.',
  'A notar la luz que se filtra por la ventana.',
  'A respirar antes de dar el primer sorbo.',
] as const;

/** Remate del manifiesto, en tamaño display */
export const MANIFIESTO_CIERRE = 'Lo simple también puede ser extraordinario.';

/* ─────────────────────────────────────────────────────────────
   MENÚ
   El menú oficial de Ryo (Ryo-Menu-Oficial-A5.pdf, tal cual: nombres,
   descripciones, precios y variantes). Los cócteles y los mocktails traen
   la línea de precio vacía en el PDF: por eso salen sin precio.
   TODO: poner el precio de esos once cuando se definan.
   `MENU_MOSTRAR_PRECIOS` en false oculta todos los precios sin tocar los
   datos; `MENU_ES_DEMO` enciende la nota de "muestra".
   ───────────────────────────────────────────────────────────── */

export const MENU_ES_DEMO = false;
export const MENU_MOSTRAR_PRECIOS = true;

/** Una variante del mismo platillo: "frío 65", "con salmón 219" o solo "frío o caliente". */
export type Variante = { etiqueta: string; precio?: string };

export type Item = { nombre: string; desc?: string; precio?: string; variantes?: Variante[] };

export type Grupo = {
  /** Las tres partes del menú: Bebidas, Bar y Cocina. */
  seccion: 'Bebidas' | 'Bar' | 'Cocina';
  nombre: string;
  items: Item[];
};

const frio = (precio: string): Variante[] => [{ etiqueta: 'frío', precio }];

export const MENU: Grupo[] = [
  {
    seccion: 'Bebidas',
    nombre: 'Clásicos',
    items: [
      { nombre: 'Espresso', precio: '45' },
      { nombre: 'Cortado', precio: '55' },
      { nombre: 'Flat white', precio: '60', variantes: frio('65') },
      { nombre: 'Cappuccino', precio: '65' },
      { nombre: 'Latte', precio: '75', variantes: frio('80') },
      { nombre: 'Americano', precio: '50', variantes: [{ etiqueta: 'frío o caliente' }] },
      { nombre: 'Long black', precio: '45' },
      { nombre: 'Moka', precio: '80', variantes: frio('85') },
      { nombre: 'Cold brew', precio: '75' },
      { nombre: 'Cold brew latte', precio: '85' },
      { nombre: 'Cold brew tonic', precio: '85' },
      { nombre: 'Espresso tonic', precio: '85' },
    ],
  },
  {
    seccion: 'Bebidas',
    nombre: 'Especiales',
    items: [
      { nombre: 'Ryo latte', precio: '115', desc: 'Leche de avena, espresso y foam de sésamo.' },
      { nombre: 'Miso caramel latte', precio: '90', desc: 'Espresso, caramelo de miso y leche de tu elección.' },
      { nombre: 'Shaken espresso', precio: '60', desc: 'Espresso agitado con mascabado y un toque de foam.' },
      { nombre: 'Maple sea salt latte', precio: '90', desc: 'Jarabe de maple, sal Maldon y leche de tu elección.' },
      { nombre: 'Coffee cloud', precio: '130', desc: 'Foam de café sobre agua de coco.' },
    ],
  },
  {
    seccion: 'Bebidas',
    nombre: 'Matcha',
    items: [
      { nombre: 'Matcha latte', precio: '110', variantes: [{ etiqueta: 'frío o caliente' }] },
      { nombre: 'Ryo matcha', precio: '140', desc: 'Matcha latte con foam de sésamo.' },
      { nombre: 'Hojicha', precio: '90', desc: 'Té verde tostado, frío.' },
      { nombre: 'Hojichai', precio: '110', desc: 'Chai latte frío con hojicha.' },
      { nombre: 'Coconut matcha', precio: '170', desc: 'Matcha con base de agua de coco.' },
    ],
  },
  {
    seccion: 'Bebidas',
    nombre: 'Sin café',
    items: [
      { nombre: 'Chai latte', precio: '70', variantes: frio('75'), desc: 'Hecho en casa con especias naturales y leche de tu elección.' },
      { nombre: 'Golden milk', precio: '70', variantes: frio('75'), desc: 'Cúrcuma y especias orgánicas, con leche de tu elección.' },
      { nombre: 'Sesame latte', precio: '75', desc: 'Leche de avena con pasta de sésamo tostado.' },
    ],
  },
  {
    seccion: 'Bebidas',
    nombre: 'Mocktails',
    items: [
      { nombre: 'Mandarina cardamomo', desc: 'Mandarina, cardamomo, limón y agua mineral.' },
      { nombre: 'Ginger honey', desc: 'Jengibre, miel, limón y agua mineral.' },
      { nombre: 'Iced tea', desc: 'Extracción en frío de té negro con limón.' },
      { nombre: 'Manzanilla limón', desc: 'Extracción en frío de manzanilla con limón.' },
    ],
  },
  {
    seccion: 'Bar',
    nombre: 'Cócteles',
    items: [
      { nombre: 'Matcha martini', desc: 'Vodka infusionado con matcha, agua de coco y jarabe natural.' },
      { nombre: 'Negroni manzanilla', desc: 'Gin infusionado con manzanilla, vermut rosso y Campari.' },
      { nombre: 'Martini de mezcal', desc: 'Mezcal Cuero Viejo, jarabe de sandía, jarabe de kiwi y limón.' },
      { nombre: 'Martini lichi', desc: 'Té de jazmín, almíbar de lichi y St-Germain.' },
      { nombre: 'Limoncello spritz', desc: 'Limoncello, espumoso, agua mineral y jarabe natural.' },
      { nombre: 'Espresso de olla martini', desc: 'Tequila 1800 Añejo, espresso y jarabe de café de olla.' },
      { nombre: 'Dirty martini', desc: 'Gin o vodka, vermut seco, salmuera y aceitunas.' },
    ],
  },
  {
    seccion: 'Cocina',
    nombre: 'Desayunos',
    items: [
      { nombre: 'Matcha pancake', precio: '149', desc: 'Con crema batida, maple y mantequilla.' },
      { nombre: 'Bowl de yogurt', precio: '149', desc: 'Yogurt griego artesanal, granola hecha en casa y fruta fresca de temporada.' },
      { nombre: 'Ensalada Green Goddess', precio: '109', desc: 'Arúgula, espinaca, col verde, pistache y parmesano con aderezo green goddess.' },
      { nombre: 'Papitas', precio: '90', desc: 'Papa cambray con aioli de salsa macha.' },
      { nombre: 'Huevos turcos', precio: '175', desc: 'Huevos pochados con jocoque, yogurt y eneldo, y un toque de mantequilla con paprika y chili flakes. Con nuestro pan de masa madre.' },
      { nombre: 'Huevos tomate (shakshuka)', precio: '189', desc: 'Huevos sobre nuestra salsa de tomate, pimientos y especias, terminados con hierbas frescas, queso feta con ricotta y aceite de oliva con perejil y eneldo. Con nuestro pan de masa madre.' },
      { nombre: 'Omelette Ryo', precio: '130', desc: 'Nuestro omelette, perfectamente cocinado, con whipped butter y nuestro pan de masa madre.' },
      { nombre: 'Breakfast plate', precio: '189', variantes: [{ etiqueta: 'con salmón', precio: '219' }], desc: 'Huevo revuelto, pechuga de pavo o salmón curado, aguacate, cebolla encurtida, pepinillos, tomate asado y crema de ricotta con feta.' },
    ],
  },
  {
    seccion: 'Cocina',
    nombre: 'Toasts',
    items: [
      { nombre: 'Toast de salmón', precio: '179', desc: 'Salmón curado en casa sobre pan de masa madre, queso crema con jocoque, pepinillos, alcaparras y eneldo.' },
      { nombre: 'Toast de miso shiitake', precio: '139', desc: 'Shiitake fresco salteado con miso y cebolla, sobre pan de masa madre con queso feta y ricotta.' },
    ],
  },
  {
    seccion: 'Cocina',
    nombre: 'Sándwiches',
    items: [
      { nombre: 'Breakfast sandwich', precio: '159', desc: 'Huevo revuelto con tocino, aguacate, queso cheddar y mayonesa de ajo confitado.' },
      { nombre: 'Sándwich de pastrami', precio: '239', desc: 'Pastrami con ensalada de col, queso cheddar y mayonesa de ajo confitado.' },
      { nombre: 'Sándwich de pavo', precio: '189', desc: 'Pechuga de pavo hecha en casa, tocino, aguacate, queso, lechuga, tomate, mayonesa y Dijon.' },
      { nombre: 'Tuna melt', precio: '189', desc: 'Atún con salsa tártara hecha en casa y queso cheddar.' },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   TÉCNICO
   ───────────────────────────────────────────────────────────── */

/** Carpeta de assets estáticos (public/ryo). Cambiar si se mueve. */
export const ASSET_BASE = '/ryo';

/** Ruta pública de la página. Se usa en las etiquetas canónicas y og. */
export const SITIO = {
  url: 'https://antemano.com.mx/ryocafe',
  titulo: `${NEGOCIO.nombre} — ${NEGOCIO.slogan}`,
  // La ciudad ya termina en punto ("Dgo."): no se le agrega otro.
  descripcion: `${NEGOCIO.descriptor} en ${NEGOCIO.ciudad} Cómo llegar, horarios y menú: café, matcha, cócteles y cocina.`,
} as const;

/**
 * Tema automático por la hora de Durango: claro (Champagne) de día,
 * oscuro (Café) de noche. El visitante lo puede cambiar y se recuerda.
 */
export const TEMA_AUTO = { amanece: 7, anochece: 19 } as const;

/* ─────────────────────────────────────────────────────────────
   Helpers de horario — se usan tanto en el build como en el navegador.
   ───────────────────────────────────────────────────────────── */

/** "07:30" → 450 (minutos desde medianoche) */
export function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** "07:30" → "7:30", "21:00" → "21:00" (sin cero a la izquierda) */
export function horaBonita(hhmm: string): string {
  return hhmm.replace(/^0/, '');
}

/** Fecha con la hora de pared de Durango, sin importar la zona del visitante. */
export function ahoraEnDurango(base = new Date()): Date {
  const utc = base.getTime() + base.getTimezoneOffset() * 60_000;
  return new Date(utc + NEGOCIO.utcOffset * 3_600_000);
}

export type Estado = {
  abierto: boolean;
  /** Texto de la etiqueta: "Abierto", "Cerrado", "Abre pronto" */
  titulo: string;
  /** Segunda línea: "Cierra a las 21:00", "Abre mañana a las 7:30" */
  detalle: string;
};

/** Estado del local en un momento dado. Puro: se puede llamar en el cliente. */
export function estadoDe(fecha: Date): Estado {
  const dia = fecha.getDay();
  const min = fecha.getHours() * 60 + fecha.getMinutes();
  const hoy = HORARIO.find((d) => d.dia === dia)!;

  if (hoy.cierra) {
    const abre = aMinutos(hoy.abre);
    const cierra = aMinutos(hoy.cierra);
    if (min >= abre && min < cierra) {
      return {
        abierto: true,
        titulo: 'Abierto',
        detalle: `Cierra a las ${horaBonita(hoy.cierra)}`,
      };
    }
    if (min < abre) {
      const faltan = abre - min;
      return {
        abierto: false,
        titulo: faltan <= 60 ? 'Abre pronto' : 'Cerrado',
        detalle:
          faltan <= 60
            ? `Abre en ${faltan} min`
            : `Abre hoy a las ${horaBonita(hoy.abre)}`,
      };
    }
  }

  // Ya cerró (o hoy no abre): buscar el próximo día con horario.
  for (let i = 1; i <= 7; i++) {
    const d = HORARIO.find((x) => x.dia === (dia + i) % 7)!;
    if (d.cierra) {
      const cuando = i === 1 ? 'mañana' : `el ${d.nombre.toLowerCase()}`;
      return {
        abierto: false,
        titulo: 'Cerrado',
        detalle: `Abre ${cuando} a las ${horaBonita(d.abre)}`,
      };
    }
  }
  return { abierto: false, titulo: 'Cerrado', detalle: '' };
}
