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
    detalle: 'Café de barra, matcha y métodos',
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
   TODO: el menú real todavía no existe. Esto es una muestra con los
   clásicos de café y matcha. Mientras `MENU_ES_DEMO` sea true, la página
   muestra una nota discreta de "menú de muestra" y oculta los precios
   si `MENU_MOSTRAR_PRECIOS` es false.
   ───────────────────────────────────────────────────────────── */

export const MENU_ES_DEMO = true;
export const MENU_MOSTRAR_PRECIOS = true;

export type Grupo = {
  nombre: string;
  nota?: string;
  items: { nombre: string; desc: string; precio: string }[];
};

export const MENU: Grupo[] = [
  {
    nombre: 'De barra',
    nota: 'Espresso de la casa',
    items: [
      { nombre: 'Espresso',    desc: 'Doble ristretto. Cuerpo denso, final dulce.',      precio: '42' },
      { nombre: 'Americano',   desc: 'Espresso y agua caliente. Nada más.',              precio: '48' },
      { nombre: 'Cortado',     desc: 'Cortado con leche texturizada, en vaso chico.',    precio: '52' },
      { nombre: 'Cappuccino',  desc: 'Espuma firme, canela opcional.',                   precio: '56' },
      { nombre: 'Latte',       desc: 'Leche sedosa, trazo en la superficie.',            precio: '58' },
      { nombre: 'Flat white',  desc: 'Doble ristretto y microespuma. Sin azúcar.',       precio: '60' },
      { nombre: 'Cold brew',   desc: 'Dieciocho horas de extracción en frío.',           precio: '62' },
      { nombre: 'Affogato',    desc: 'Helado de vainilla ahogado en espresso.',          precio: '68' },
    ],
  },
  {
    nombre: 'Matcha y té',
    nota: 'Matcha ceremonial batido a mano',
    items: [
      { nombre: 'Matcha latte',   desc: 'Caliente o sobre hielo. Dulzor natural.',       precio: '75' },
      { nombre: 'Dirty matcha',   desc: 'Matcha con un shot de espresso encima.',        precio: '85' },
      { nombre: 'Matcha tonic',   desc: 'Matcha, tónica y cítrico. Burbujas largas.',    precio: '80' },
      { nombre: 'Hojicha latte',  desc: 'Té verde tostado. Notas de caramelo.',          precio: '75' },
      { nombre: 'Té de la casa',  desc: 'Selección de temporada, en tetera.',            precio: '55' },
    ],
  },
  {
    nombre: 'De método',
    nota: 'Grano de temporada, molido al momento',
    items: [
      { nombre: 'V60',              desc: 'Filtrado lento. Taza limpia y aromática.',    precio: '70' },
      { nombre: 'Chemex',           desc: 'Para dos. Cuerpo ligero, dulzor largo.',      precio: '95' },
      { nombre: 'Prensa francesa',  desc: 'Inmersión total. Cuerpo redondo.',            precio: '68' },
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
  descripcion: `${NEGOCIO.descriptor} en ${NEGOCIO.ciudad}. Cómo llegar, horarios y menú de café de barra, matcha y métodos.`,
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
