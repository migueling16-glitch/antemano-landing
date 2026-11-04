/**
 * Arca Motors — datos del negocio. Todo lo editable de la marca vive aquí.
 * Fuente: Instagram @arca.motors (revisado el 4-nov-2026). Lo marcado TODO
 * no aparece en sus redes y hay que confirmarlo con el cliente.
 */

export const BASE = '/arcamotors';
export const ASSETS = '/arca-motors';

export const NEGOCIO = {
  nombre: 'Arca Motors',
  tagline: 'Excelencia en seminuevos',
  servicios: ['Compra', 'Venta', 'Consignación', 'Financiamiento'],
  ciudad: 'Durango, Dgo.',
  /** TODO: dirección exacta del lote (en IG solo dice "Durango, Dgo."). */
  direccion: '',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Arca+Motors+Durango',
  /** TODO: horario real. */
  horario: [
    { dias: 'Lunes a viernes', horas: '9:00 – 19:00' },
    { dias: 'Sábado', horas: '9:00 – 15:00' },
  ],
  /** Teléfonos publicados en cada post. El primero recibe WhatsApp. */
  telefonos: ['6182346544', '6181486668'],
  instagram: 'arca.motors',
  seguidores: '1.6 mil',
  facebook: 'https://www.facebook.com/profile.php?id=100063457119839',
};

/**
 * Planes publicados:
 *  - bio: "40% de enganche y financiamiento hasta 48 meses" y "60% de enganche y 6 meses sin intereses".
 *  - captions recientes: "Financiamiento con CreditoGo / Caja Hipódromo desde 15% de enganche,
 *    resto hasta 60 meses, tasa desde 15.90%", "o cualquier crédito bancario".
 * La tasa del crédito directo NO es pública: 18% es un supuesto de la demo.
 * TODO: pedir tasa del crédito directo, comisiones y requisitos.
 */
export const FINANCIAMIENTO = {
  // Valores por omisión (crédito directo) que usan la calculadora y las estimaciones.
  plazos: [12, 24, 36, 48],
  plazoDefault: 48,
  engancheMin: 0.4,
  engancheDefault: 0.4,
  tasaAnual: 0.18,
  calculadora: [
    { id: 'directo', nombre: 'Crédito directo', engancheMin: 0.4, engancheDefault: 0.4, plazos: [12, 24, 36, 48], plazoDefault: 48, tasaAnual: 0.18, tasaDemo: true },
    { id: 'financiera', nombre: 'Financiera', engancheMin: 0.15, engancheDefault: 0.3, plazos: [24, 36, 48, 60], plazoDefault: 60, tasaAnual: 0.159, tasaDemo: false },
  ],
  planes: [
    {
      nombre: 'Crédito directo',
      titulo: '40% de enganche',
      detalle: 'Hasta 48 meses, directo con Arca Motors.',
    },
    {
      nombre: 'Con financiera',
      titulo: 'Desde 15%',
      detalle: 'Hasta 60 meses con CreditoGo o Caja Hipódromo, tasa desde 15.90%. También crédito bancario.',
    },
    {
      nombre: 'Meses sin intereses',
      titulo: '60% de enganche',
      detalle: 'El resto en 6 meses sin intereses.',
      msi: 6,
      enganche: 0.6,
    },
  ],
  /** TODO: requisitos reales del crédito. Vacío = la sección no se muestra. */
  requisitos: [] as string[],
};

/**
 * Lo que repiten en cada post, convertido en promesa. Fuente: captions
 * ("único dueño", "factura de agencia", "duplicado de llaves") y las placas
 * de sus posts fijados ("enganche accesible", "aprobación rápida",
 * "sin complicaciones", "atención personalizada").
 */
export const PROMESAS = [
  { titulo: 'Factura de agencia', texto: 'Muchas unidades de único dueño y con factura de agencia. Cada ficha te dice cuáles.' },
  { titulo: 'Servicio y llaves', texto: 'Servicios de agencia, duplicado de llaves y llantas nuevas, cuando la unidad los tiene.' },
  { titulo: 'Crédito a tu medida', texto: 'Directo con Arca hasta 48 meses, o con financiera desde 15% de enganche. Aprobación rápida.' },
  { titulo: 'Vende o consigna', texto: 'Te compramos tu auto o lo vendemos por ti a consignación.' },
];

/** TODO: confirmar si reciben autos a cuenta. En true aparece la opción "Cambiar". */
export const ACEPTA_A_CUENTA = false;

/** Pasos de compra. "¡Estrena hoy!" y "Aparta la tuya" salen de sus placas. TODO: confirmar el apartado. */
export const PASOS = [
  { t: 'Elige', d: 'Revisa el catálogo con precio, kilometraje y mensualidad a la vista.' },
  { t: 'Pruébalo', d: 'Agenda por WhatsApp, ven al lote y manéjalo.' },
  { t: 'Apártalo', d: 'Pregúntanos por WhatsApp cómo apartar la tuya mientras sale tu crédito.' },
  { t: 'Estrena', d: 'Firmas, das tu enganche y lo estrenas.' },
];

/** La demo muestra una franja que avisa que precios y fotos son de ejemplo. */
export const DEMO = true;

export const wa = (mensaje: string, tel = NEGOCIO.telefonos[0]) =>
  `https://wa.me/52${tel}?text=${encodeURIComponent(mensaje)}`;

export const tel = (t = NEGOCIO.telefonos[0]) => `tel:+52${t}`;

export const telBonito = (t: string) => t.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
