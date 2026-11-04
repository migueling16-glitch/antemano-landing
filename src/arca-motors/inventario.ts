/**
 * Inventario de la demo, tomado de los posts de @arca.motors (revisados el 4-nov-2026).
 *
 * - Datos de cada unidad: del caption del post (año, km, dueños, factura, equipo).
 * - Enganche y mensualidad: del flyer "¡Oferta exclusiva!" de cada post. Arca no
 *   publica precio de contado; `precio` queda vacío hasta que lo den.
 * - Fotos: las del carrusel del post (sin el flyer), en public/arca-motors/autos/<folio>/.
 * - `estatus` es un SUPUESTO por fecha del post: desde mayo 2026 = disponible,
 *   antes = vendido. TODO: confirmar con el cliente qué sigue en el lote.
 *
 * El modelo de datos es el mismo que tendrá la tabla `vehiculos` del admin.
 */
import { BASE, ASSETS, FINANCIAMIENTO } from './config';

export type Carroceria = 'pickup' | 'suv' | 'sedan' | 'hatchback' | 'moto' | 'clasico';
export type Estatus = 'disponible' | 'apartado' | 'vendido';

export interface Vehiculo {
  folio: string;
  marca: string;
  modelo: string;
  version?: string;
  anio: number;
  /** No todos los posts lo dicen. */
  km?: number;
  transmision?: 'Automática' | 'Estándar';
  combustible?: 'Gasolina' | 'Diésel' | 'Híbrido';
  carroceria: Carroceria;
  traccion?: '4x2' | '4x4' | 'AWD';
  motor?: string;
  color?: string;
  duenos: number;
  facturaAgencia: boolean;
  /** Lo que el cliente pone con emoji en cada post. */
  destacados: string[];
  equipamiento?: string[];
  /** Enganche y mensualidad tal como salen en su flyer. */
  enganche: number;
  mensualidad: number;
  /** Precio de contado, cuando lo publiquen. */
  precio?: number;
  estatus: Estatus;
  /** Fecha del post (ISO). "Recién llegado" se calcula. */
  ingreso: string;
  /** Número de fotos en public/arca-motors/autos/<folio>/NN-{800,1280}.webp */
  nFotos: number;
  /** Post de Instagram de la unidad. */
  instagram: string;
}

const IG = (code: string) => `https://www.instagram.com/arca.motors/p/${code}/`;

export const INVENTARIO: Vehiculo[] = [
  {
    folio: 'ARC-0221', marca: 'Jeep', modelo: 'Gladiator', version: 'Rubicon', anio: 2021, km: 48000,
    carroceria: 'pickup', traccion: '4x4', color: 'Rojo', duenos: 1, facturaAgencia: true,
    destacados: ['Factura de agencia', '48 mil km', 'Excelentes condiciones'],
    enganche: 385000, mensualidad: 22290, estatus: 'disponible', ingreso: '2026-09-18', nFotos: 9, instagram: IG('Ddb_ki6ln70'),
  },
  {
    folio: 'ARC-0220', marca: 'Nissan', modelo: 'Frontier', version: 'PRO-4X', anio: 2021,
    carroceria: 'pickup', traccion: '4x4', color: 'Gris', duenos: 2, facturaAgencia: true,
    destacados: ['Factura original de agencia', 'Duplicado de llaves', '4x4', 'Cámara 360°'],
    equipamiento: ['Cámara 360°', 'Tracción 4x4'],
    enganche: 300000, mensualidad: 10446, estatus: 'disponible', ingreso: '2026-08-28', nFotos: 9, instagram: IG('Dcl64FeGPsR'),
  },
  {
    folio: 'ARC-0219', marca: 'BMW', modelo: 'X5', version: 'M Sport', anio: 2019,
    carroceria: 'suv', color: 'Negro', duenos: 2, facturaAgencia: false,
    destacados: ['Apple CarPlay inalámbrico', 'Techo panorámico', 'Tablero digital'],
    equipamiento: ['Apple CarPlay y Android Auto inalámbricos', 'Asientos multifuncionales', 'Tablero digital', 'Techo de cristal panorámico'],
    enganche: 399009, mensualidad: 12815, estatus: 'disponible', ingreso: '2026-08-21', nFotos: 9, instagram: IG('DcT_rjXGOJ-'),
  },
  {
    folio: 'ARC-0218', marca: 'Chevrolet', modelo: 'Aveo', version: 'LT', anio: 2016, km: 85000,
    carroceria: 'sedan', color: 'Rojo', duenos: 1, facturaAgencia: false,
    destacados: ['Único dueño', 'Duplicado de llaves', '85 mil km', 'Impecable'],
    enganche: 63000, mensualidad: 3728, estatus: 'disponible', ingreso: '2026-08-13', nFotos: 8, instagram: IG('Db_1Ze2j1uN'),
  },
  {
    folio: 'ARC-0217', marca: 'Toyota', modelo: 'Tacoma', version: '4x4', anio: 2021, km: 73000,
    carroceria: 'pickup', traccion: '4x4', color: 'Gris', duenos: 1, facturaAgencia: false,
    destacados: ['Único dueño', 'Servicios de agencia completos', 'Duplicado de llaves'],
    enganche: 300000, mensualidad: 15106, estatus: 'apartado', ingreso: '2026-07-21', nFotos: 9, instagram: IG('DbEpp49mLjM'),
  },
  {
    folio: 'ARC-0216', marca: 'Cadillac', modelo: 'Escalade', anio: 2021, km: 50000,
    carroceria: 'suv', color: 'Blanco', duenos: 1, facturaAgencia: true,
    destacados: ['Único dueño', 'Factura de agencia', '50 mil km'],
    enganche: 800000, mensualidad: 33357, estatus: 'disponible', ingreso: '2026-07-16', nFotos: 9, instagram: IG('Da3Syi0FtEU'),
  },
  {
    folio: 'ARC-0215', marca: 'Chevrolet', modelo: 'Cheyenne', version: 'ZR2', anio: 2024, km: 50000,
    carroceria: 'pickup', traccion: '4x4', motor: '6.2 L V8', color: 'Negro', duenos: 1, facturaAgencia: false,
    destacados: ['Único dueño', 'Motor 6.2 V8', '4x4', 'Faros LED'],
    equipamiento: ['Motor 6.2 L de 8 cilindros', 'Tracción 4x4', 'Faros LED'],
    enganche: 530000, mensualidad: 30640, estatus: 'disponible', ingreso: '2026-07-06', nFotos: 9, instagram: IG('Dad4EtYGD3I'),
  },
  {
    folio: 'ARC-0214', marca: 'Jeep', modelo: 'Gladiator', version: 'Mojave', anio: 2022, km: 15000,
    carroceria: 'pickup', traccion: '4x4', color: 'Negro', duenos: 1, facturaAgencia: true,
    destacados: ['Único dueño', 'Factura de agencia Durango', '15 mil km', 'Accesorios Mopar'],
    equipamiento: ['Defensa Mopar', 'Faros LED', 'Winch', 'Escapes', 'Filtro de alto flujo'],
    enganche: 600000, mensualidad: 25046, estatus: 'disponible', ingreso: '2026-06-23', nFotos: 9, instagram: IG('DZ8C-vSlkQy'),
  },
  {
    folio: 'ARC-0213', marca: 'RAM', modelo: 'TRX', anio: 2022, km: 6000,
    carroceria: 'pickup', traccion: '4x4', color: 'Blanco', duenos: 1, facturaAgencia: true,
    destacados: ['Único dueño', 'Factura de agencia', 'Solo 6 mil km', 'Como nueva'],
    enganche: 1300000, mensualidad: 36650, estatus: 'disponible', ingreso: '2026-06-22', nFotos: 9, instagram: IG('DZ5aac_mH9x'),
  },
  {
    folio: 'ARC-0212', marca: 'Jeep', modelo: 'Gladiator', version: 'Rubicon', anio: 2023, km: 40000,
    carroceria: 'pickup', traccion: '4x4', color: 'Blanco', duenos: 1, facturaAgencia: true,
    destacados: ['Único dueño', 'Factura original', 'Servicios de agencia', 'Llantas al 80%'],
    enganche: 500000, mensualidad: 22468, estatus: 'disponible', ingreso: '2026-06-17', nFotos: 9, instagram: IG('DZscfzAFuuq'),
  },
  {
    folio: 'ARC-0211', marca: 'Volkswagen', modelo: 'Touareg', version: 'TDI', anio: 2017, km: 90000,
    combustible: 'Diésel', carroceria: 'suv', motor: '3.0 L V6 TDI', color: 'Blanco', duenos: 1, facturaAgencia: false,
    destacados: ['Único dueño', 'Diésel 3.0 TDI', 'Versión equipada'],
    enganche: 150000, mensualidad: 9539, estatus: 'disponible', ingreso: '2026-05-12', nFotos: 9, instagram: IG('DYP7WHkFr4c'),
  },
  {
    folio: 'ARC-0210', marca: 'Volkswagen', modelo: 'Amarok', version: 'TDI', anio: 2022, km: 59000,
    combustible: 'Diésel', carroceria: 'pickup', color: 'Plata', duenos: 1, facturaAgencia: true,
    destacados: ['Único dueño', 'Factura de agencia Durango', 'Diésel TDI'],
    enganche: 350000, mensualidad: 14328, estatus: 'disponible', ingreso: '2026-05-12', nFotos: 9, instagram: IG('DYP37GtllBz'),
  },
  // Supuestos vendidos (posts anteriores a mayo 2026): se quedan como prueba social.
  {
    folio: 'ARC-0209', marca: 'Chevrolet', modelo: 'Aveo', anio: 2020, km: 78000, transmision: 'Estándar',
    carroceria: 'sedan', color: 'Rojo', duenos: 1, facturaAgencia: true,
    destacados: ['Único dueño', 'Factura de agencia', 'Súper económico'],
    enganche: 99000, mensualidad: 5825, estatus: 'vendido', ingreso: '2026-03-03', nFotos: 4, instagram: IG('DVbryuuj8NO'),
  },
  {
    folio: 'ARC-0208', marca: 'Dodge', modelo: 'Journey', version: 'GT', anio: 2023, km: 40000,
    carroceria: 'suv', color: 'Azul', duenos: 1, facturaAgencia: true,
    destacados: ['Único dueño', 'Factura de agencia', 'Duplicado de llaves'],
    enganche: 280000, mensualidad: 9539, estatus: 'vendido', ingreso: '2026-02-20', nFotos: 4, instagram: IG('DU_SNDUCfUh'),
  },
  {
    folio: 'ARC-0207', marca: 'RAM', modelo: '1500', version: 'R/T', anio: 2015,
    carroceria: 'pickup', traccion: '4x4', color: 'Plata', duenos: 2, facturaAgencia: true,
    destacados: ['Factura de agencia', 'Llantas Cooper nuevas', '4x4'],
    enganche: 200000, mensualidad: 7698, estatus: 'vendido', ingreso: '2026-02-06', nFotos: 4, instagram: IG('DUZXQo9j06b'),
  },
  {
    folio: 'ARC-0206', marca: 'RAM', modelo: '1500', version: 'Big Horn', anio: 2021,
    carroceria: 'pickup', traccion: '4x4', color: 'Negro', duenos: 2, facturaAgencia: true,
    destacados: ['Factura de agencia', 'Duplicado de llaves', '4x4'],
    enganche: 320000, mensualidad: 16538, estatus: 'vendido', ingreso: '2026-02-06', nFotos: 4, instagram: IG('DUZWJ2nj6BD'),
  },
  {
    folio: 'ARC-0205', marca: 'Chevrolet', modelo: 'Tahoe', version: 'High Country', anio: 2021,
    carroceria: 'suv', color: 'Blanco', duenos: 1, facturaAgencia: true,
    destacados: ['Único dueño', 'Factura de agencia', 'Llantas Michelin nuevas'],
    enganche: 700000, mensualidad: 19484, estatus: 'vendido', ingreso: '2026-01-29', nFotos: 4, instagram: IG('DUHB18BDz0q'),
  },
  {
    folio: 'ARC-0204', marca: 'Cadillac', modelo: 'XT5', anio: 2020, km: 60000,
    carroceria: 'suv', color: 'Negro', duenos: 1, facturaAgencia: true,
    destacados: ['Único dueño', 'Factura de agencia', '60 mil km'],
    enganche: 207000, mensualidad: 11492, estatus: 'vendido', ingreso: '2026-01-05', nFotos: 4, instagram: IG('DTJBUXFD_Nh'),
  },
  {
    folio: 'ARC-0203', marca: 'Ford', modelo: 'Lobo', version: 'Platinum', anio: 2016, km: 90000,
    carroceria: 'pickup', traccion: '4x4', color: 'Blanco', duenos: 1, facturaAgencia: true,
    destacados: ['Único dueño', 'Techo panorámico', 'Asientos con masaje'],
    enganche: 300000, mensualidad: 11013, estatus: 'vendido', ingreso: '2025-12-09', nFotos: 4, instagram: IG('DSDhkTWD-G8'),
  },
  {
    folio: 'ARC-0202', marca: 'Dodge', modelo: 'RAM', version: 'Doble cabina', anio: 2018,
    carroceria: 'pickup', traccion: '4x4', motor: '6 cil.', color: 'Blanco', duenos: 2, facturaAgencia: false,
    destacados: ['Servicios completos', '4x4'],
    enganche: 180000, mensualidad: 7919, estatus: 'vendido', ingreso: '2025-10-21', nFotos: 4, instagram: IG('DQFTRxlD7qA'),
  },
  {
    folio: 'ARC-0201', marca: 'GMC', modelo: 'Yukon', version: 'Denali XL', anio: 2021, km: 50000,
    carroceria: 'suv', color: 'Plata', duenos: 1, facturaAgencia: true,
    destacados: ['Único dueño', 'Factura de agencia', 'Servicios de agencia'],
    enganche: 700000, mensualidad: 21363, estatus: 'vendido', ingreso: '2025-10-18', nFotos: 4, instagram: IG('DP9oneOjzgY'),
  },
];

/* ---------- helpers ---------- */

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const slug = (v: Vehiculo) => slugify(`${v.marca} ${v.modelo} ${v.version ?? ''} ${v.anio} ${v.folio}`);
export const urlAuto = (v: Vehiculo) => `${BASE}/auto/${slug(v)}/`;
export const nombre = (v: Vehiculo) => `${v.marca} ${v.modelo}`;
export const nombreCompleto = (v: Vehiculo) => `${v.marca} ${v.modelo}${v.version ? ' ' + v.version : ''} ${v.anio}`;

/** Ruta de una foto (i desde 0) en el tamaño pedido. */
export const foto = (v: Vehiculo, i: number, w: 800 | 1280 = 800) =>
  `${ASSETS}/autos/${v.folio.toLowerCase()}/${String(i + 1).padStart(2, '0')}-${w}.webp`;

const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
export const dinero = (n: number) => mxn.format(n);
export const kms = (n: number) => `${new Intl.NumberFormat('es-MX').format(n)} km`;

/** Pago mensual amortizado (misma fórmula que usa la calculadora del navegador). */
export function mensualidad(precio: number, enganche = FINANCIAMIENTO.engancheDefault, plazo = FINANCIAMIENTO.plazoDefault, tasaAnual = FINANCIAMIENTO.tasaAnual) {
  const financiado = precio * (1 - enganche);
  const r = tasaAnual / 12;
  return Math.round((financiado * r) / (1 - Math.pow(1 + r, -plazo)));
}

/** Días desde el post, contra la fecha de build (la demo se construye estática). */
export const diasEnLote = (v: Vehiculo, hoy = new Date()) =>
  Math.floor((hoy.getTime() - new Date(v.ingreso + 'T12:00:00-06:00').getTime()) / 86400000);
export const recienLlegado = (v: Vehiculo) => v.estatus !== 'vendido' && diasEnLote(v) <= 75;

export const ETIQUETA_CARROCERIA: Record<Carroceria, string> = {
  pickup: 'Pickup', suv: 'SUV', sedan: 'Sedán', hatchback: 'Hatchback', moto: 'Moto', clasico: 'Clásico',
};

export const enVenta = () => INVENTARIO.filter((v) => v.estatus !== 'vendido');
export const vendidos = () => INVENTARIO.filter((v) => v.estatus === 'vendido');
export const marcas = () => [...new Set(enVenta().map((v) => v.marca))].sort((a, b) => a.localeCompare(b, 'es'));

export const mensajeWa = (v: Vehiculo) =>
  `Hola Arca Motors, me interesa el ${nombreCompleto(v)} (${v.folio}) con enganche de ${dinero(v.enganche)} y mensualidad de ${dinero(v.mensualidad)}. ¿Sigue disponible?`;
