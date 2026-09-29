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
    detalle: 'Clásicos, especiales y matcha',
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
   El menú real de Ryo (nota de la barra, 29-sep-2026): los tres grupos y
   qué va también en frío. TODO: faltan los precios; mientras
   `MENU_MOSTRAR_PRECIOS` sea false no se muestran. Si algún día se vuelve
   a publicar una muestra, `MENU_ES_DEMO` enciende la nota de "muestra".
   ───────────────────────────────────────────────────────────── */

export const MENU_ES_DEMO = false;
export const MENU_MOSTRAR_PRECIOS = false;

export type Grupo = {
  nombre: string;
  nota?: string;
  items: { nombre: string; desc: string; precio?: string; frio?: boolean }[];
};

export const MENU: Grupo[] = [
  {
    nombre: 'Clásicos',
    nota: 'Espresso de la casa',
    items: [
      { nombre: 'Espresso',    desc: 'Doble, de la casa. Cuerpo denso, final dulce.' },
      { nombre: 'Cortado',     desc: 'Mitad espresso, mitad leche.' },
      { nombre: 'Flat white',  desc: 'Espresso y microespuma, en taza chica.', frio: true },
      { nombre: 'Cappuccino',  desc: 'Espuma firme y sedosa.' },
      { nombre: 'Latte',       desc: 'Leche sedosa, trazo en la superficie.', frio: true },
      { nombre: 'Americano',   desc: 'Espresso y agua. Nada más.', frio: true },
      { nombre: 'Long black',  desc: 'El agua primero, el espresso encima: la crema intacta.' },
      { nombre: 'Moka',        desc: 'Espresso, chocolate y leche.', frio: true },
    ],
  },
  {
    nombre: 'Especiales',
    nota: 'De la casa',
    items: [
      { nombre: 'Miso caramel latte', desc: 'Caramelo de miso, espresso y leche, con foam.' },
      { nombre: 'Maple salt latte',   desc: 'Maple y un toque de sal, con espresso y leche.' },
      { nombre: 'Cortadito',          desc: 'Espresso con espumita de azúcar y leche.' },
      { nombre: 'Ryo latte',          desc: 'El latte de la casa.' },
    ],
  },
  {
    nombre: 'Matchas',
    nota: 'Batidas al momento',
    items: [
      { nombre: 'Matcha latte', desc: 'Matcha y leche. Dulzor natural.' },
      { nombre: 'Ryo matcha',   desc: 'La matcha de la casa.' },
      { nombre: 'Hojicha',      desc: 'Té verde tostado con leche. Notas de caramelo.' },
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
  descripcion: `${NEGOCIO.descriptor} en ${NEGOCIO.ciudad} Cómo llegar, horarios y menú: clásicos, especiales y matcha.`,
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
