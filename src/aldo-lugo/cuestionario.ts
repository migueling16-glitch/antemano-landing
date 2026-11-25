/**
 * ALDO chef LUGO · Mesa de Lumbre — cuestionario para el chef (datos).
 *
 * Fuente: Chef Aldo Lugo/04_Docs/PREGUNTAS_CHEF.md v1.1 (24-nov-2026). Las 34 preguntas, con su número y su
 * prioridad (P0 1–22 bloquean la publicación · P1 23–32 contenido · P2 33–34 después del lanzamiento).
 *
 * Estructura: BLOQUES temáticos → PREGUNTAS (P1…P34) → campos. Cada campo es una sub-pregunta del documento,
 * con su tipo de respuesta. Las claves de respuesta son el id del campo ("p5.precios") y "P5.nose" para el
 * "No sé todavía" de la pregunta. Lo usan:
 *   - src/pages/aldolugo/cuestionario.astro (pinta todo en el build)
 *   - src/aldo-lugo/cuestionario-cliente.ts (recibe modeloCliente() como JSON; nunca importa este archivo en runtime)
 *
 * Reglas:
 *   - Sin corchetes crudos: lo que el documento tiene entre corchetes va en palabras ("por confirmar", "tu zona").
 *   - `porDefecto` es una PROPUESTA nuestra: se ofrece con un toque ("Usar la propuesta"), nunca se precarga.
 *     Lo que el chef no confirma no se publica.
 *   - `siNoContesta`: las tres preguntas que tienen respuesta por defecto y no frenan el lanzamiento (P3, P20, P22).
 *   - Nada de Burning Man. Mallmann solo donde la pregunta lo necesita (P3).
 */

export type Prioridad = 'P0' | 'P1' | 'P2';
export type TipoCampo = 'unica' | 'multiple' | 'sino' | 'corto' | 'largo' | 'numero' | 'monto' | 'tabla' | 'escala';

export interface Opcion {
  id: string;
  etiqueta: string;
  /** Si la opción pide un dato ("Otro: ____"), la etiqueta de ese dato. Aparece al elegirla. */
  detalle?: string;
  /** El dato de la opción es texto largo. */
  detalleLargo?: boolean;
}

export interface Foto {
  id: string;
  /** Ruta relativa a 02_Fotos\00_Originales_Drive\ */
  archivo?: string;
}

interface CampoBase {
  /** Clave de la respuesta. Única en todo el cuestionario. */
  id: string;
  etiqueta: string;
  ayuda?: string;
  /** No cuenta para dar la pregunta por completa. */
  opcional?: boolean;
  /** Solo se muestra (y solo cuenta) si otro campo tiene uno de estos valores. */
  si?: { campo: string; valores: string[] };
  fotos?: Foto[];
}

export interface CampoOpciones extends CampoBase {
  tipo: 'unica' | 'multiple' | 'sino';
  opciones: Opcion[];
  porDefecto?: string;
}
export interface CampoTexto extends CampoBase {
  tipo: 'corto' | 'largo';
  placeholder?: string;
  formato?: 'texto' | 'correo' | 'telefono' | 'mayusculas';
  porDefecto?: string;
}
export interface CampoNumero extends CampoBase {
  tipo: 'numero' | 'monto';
  unidad?: string;
  decimales?: boolean;
  porDefecto?: number;
  placeholder?: string;
}
export interface CampoEscala extends CampoBase {
  tipo: 'escala';
  min: number;
  max: number;
  extremos: [string, string];
}

export interface Columna {
  id: string;
  etiqueta: string;
  tipo: 'numero' | 'monto' | 'corto' | 'opciones';
  unidad?: string;
  decimales?: boolean;
  opciones?: Opcion[];
}
export interface Fila {
  id: string;
  etiqueta: string;
  ayuda?: string;
  fotos?: Foto[];
  /** Columnas que no aplican en esta fila. */
  omitir?: string[];
  /** Nota que sustituye a una columna omitida ("Es el mismo precio por evento"). */
  notas?: Record<string, string>;
  /** Etiqueta propia de una columna en esta fila. */
  etiquetas?: Record<string, string>;
}
export interface CampoTabla extends CampoBase {
  tipo: 'tabla';
  filas: Fila[];
  columnas: Columna[];
  /** Revisión suave (no bloquea): "minimo21" = el mínimo debe ser ≥ precio "desde" × 21 invitados. */
  regla?: 'minimo21';
}

export type Campo = CampoOpciones | CampoTexto | CampoNumero | CampoEscala | CampoTabla;

export interface Bloque {
  id: string;
  prioridad: Prioridad;
  titulo: string;
  /** Para chips e índice. */
  corto: string;
}

export interface Pregunta {
  n: number;
  id: string; // "P1"…"P34"
  prioridad: Prioridad;
  bloque: string;
  /** Título corto (resumen, índice, texto copiado). */
  titulo: string;
  /** La pregunta tal como la hace el documento. */
  pregunta: string;
  intro?: string;
  /** Contenido de la propuesta que el chef necesita ver para contestar. */
  listas?: { titulo?: string; items: string[]; numerada?: boolean }[];
  cita?: { lineas: string[]; firma?: string };
  /** "Más contexto": por qué preguntamos, datos de mercado, reglas. Plegado por omisión. */
  contexto?: string[];
  fotos?: Foto[];
  /** Respuesta que aplica si el chef no contesta (no frena el lanzamiento). */
  siNoContesta?: string;
  /** Admite "No sé todavía". */
  noSe: boolean;
  campos: Campo[];
}

// =====================================================================================
// Ayudantes
// =====================================================================================

const SI: Opcion = { id: 'si', etiqueta: 'Sí' };
const NO: Opcion = { id: 'no', etiqueta: 'No' };
const NO_SE: Opcion = { id: 'no_se', etiqueta: 'No sé' };
const SI_NO: Opcion[] = [SI, NO];
const SI_NO_NOSE: Opcion[] = [SI, NO, NO_SE];
const CAMBIO = (detalle = '¿Qué cambiarías?'): Opcion => ({ id: 'cambio', etiqueta: 'Cambio', detalle });
const SI_CAMBIO = (detalle?: string): Opcion[] => [SI, CAMBIO(detalle)];

/** Sí/No; `opciones` reemplaza las de siempre. */
const sino = (id: string, etiqueta: string, extra: Partial<CampoOpciones> = {}): CampoOpciones => ({
  id,
  etiqueta,
  tipo: 'sino',
  opciones: SI_NO,
  ...extra,
});

// =====================================================================================
// Bloques y prioridades (los ### de PREGUNTAS_CHEF.md)
// =====================================================================================

export const PRIORIDADES: Record<Prioridad, { titulo: string; ayuda: string; rango: string }> = {
  P0: { titulo: 'Bloquean la publicación', ayuda: 'Sin ellas la página no sale.', rango: '1–22' },
  P1: { titulo: 'Contenido', ayuda: 'Si una falta, ese texto no se publica y la página sale sin él.', rango: '23–32' },
  P2: { titulo: 'Para después del lanzamiento', ayuda: 'No frenan nada; nos sirven para lo que sigue.', rango: '33–34' },
};

export const BLOQUES: Bloque[] = [
  { id: 'nombre', prioridad: 'P0', titulo: 'Nombre, concepto y menciones', corto: 'Nombre' },
  { id: 'oferta', prioridad: 'P0', titulo: 'Oferta y precios', corto: 'Oferta' },
  { id: 'brigada', prioridad: 'P0', titulo: 'Equipo y brigada para eventos grandes', corto: 'Brigada' },
  { id: 'lugar', prioridad: 'P0', titulo: 'Lo que necesitas del lugar', corto: 'Lugar' },
  { id: 'zona', prioridad: 'P0', titulo: 'Zona de servicio y viáticos', corto: 'Zona' },
  { id: 'tecnicas', prioridad: 'P0', titulo: 'Técnicas y menú', corto: 'Técnicas' },
  { id: 'whatsapp', prioridad: 'P0', titulo: 'WhatsApp y tiempo de respuesta', corto: 'WhatsApp' },
  { id: 'legal', prioridad: 'P0', titulo: 'Datos legales y cuentas', corto: 'Legal' },
  { id: 'permisos', prioridad: 'P0', titulo: 'Crédito de fotos y permisos de la organizadora', corto: 'Fotos' },
  { id: 'voz', prioridad: 'P1', titulo: 'Concepto y voz', corto: 'Manifiesto' },
  { id: 'operacion', prioridad: 'P1', titulo: 'Técnicas y operación', corto: 'Operación' },
  { id: 'terceros', prioridad: 'P1', titulo: 'Permisos de terceros y testimonios', corto: 'Testimonios' },
  { id: 'bio', prioridad: 'P1', titulo: 'Biografía', corto: 'Bio' },
  { id: 'aliados', prioridad: 'P1', titulo: 'Aliados', corto: 'Aliados' },
  { id: 'despues', prioridad: 'P2', titulo: 'Para después del lanzamiento', corto: 'Después' },
];

// =====================================================================================
// Las 34 preguntas
// =====================================================================================

export const PREGUNTAS: Pregunta[] = [
  // ---------------------------------------------------------------- P0 · Nombre, concepto y menciones
  {
    n: 1,
    id: 'P1',
    prioridad: 'P0',
    bloque: 'nombre',
    titulo: 'El concepto «Mesa de Lumbre»',
    pregunta: '¿Apruebas el concepto «Mesa de Lumbre»?',
    intro: 'ALDO chef LUGO es la marca y Mesa de Lumbre, la línea de servicio. Así lo diría la página:',
    listas: [
      {
        items: [
          'Idea: un banquete que empieza cuando se enciende la lumbre y termina en la sobremesa.',
          'Título principal: La lumbre pone la mesa.',
          'Bajo el título: De 10 a 300 invitados · donde haya espacio para la lumbre / Durango y tu zona · desde tu precio por invitado, IVA incluido · mínimo por evento (las cifras salen de las preguntas 5 y 12).',
          'Subtítulo: Ustedes eligen el lugar. Nosotros llevamos la lumbre.',
          'Debajo del botón: Bodas, cumpleaños, fiestas y eventos de empresa cocinados con leña, brasa y rescoldo, frente a tus invitados.',
          'Pilares: La lumbre manda · El fuego a la vista · La mesa larga · La lumbre viaja · Raíz de aquí.',
          'Credencial: Chef invitado en La Tapada de Luna · Nombre de Dios, 2026 (solo con el permiso de la pregunta 21).',
        ],
      },
    ],
    contexto: [
      '«Lumbre» es una palabra muy mexicana y no es vocabulario prestado de otros cocineros de fuego.',
      '«Mesa» dice qué se compra.',
      'El nombre sirve igual para una pedida de 10 que para una boda de 300, en cualquier lugar.',
      'Su riesgo es sonar solemne; lo compensamos con fotos de mesa llena y un tono cálido.',
      'La idea de «Fogón Errante», la lumbre que viaja, ya va adentro como promesa: «Ustedes eligen el lugar. Nosotros llevamos la lumbre.»',
      'Antes de publicar revisamos que el nombre esté libre en el IMPI, como dominio y en Instagram (no verificado).',
    ],
    noSe: true,
    campos: [
      {
        id: 'p1.concepto',
        etiqueta: '¿Qué te parece?',
        tipo: 'unica',
        opciones: [
          SI,
          { id: 'cambios', etiqueta: 'Sí, con cambios', detalle: '¿Qué cambiarías?', detalleLargo: true },
          { id: 'fogon', etiqueta: 'Prefiero «Fogón Errante» como nombre' },
          { id: 'tatema', etiqueta: 'Prefiero «Tatema» (Quemado a propósito)' },
          { id: 'otro', etiqueta: 'Otro nombre', detalle: '¿Cuál?' },
        ],
      },
    ],
  },
  {
    n: 2,
    id: 'P2',
    prioridad: 'P0',
    bloque: 'nombre',
    titulo: 'La mención de Tacos Canito',
    pregunta: '¿Cómo mencionamos Tacos Canito?',
    intro:
      'Proponemos una sola mención, en tu sección de la página: «También fundó Tacos Canito →», con enlace a tacoscanito.com cuando esté publicada y, mientras tanto, a @tacoscanito.',
    contexto: [
      'No aparece en la portada, en el pie ni en los datos para buscadores.',
      'Tampoco usamos fotos, videos, colores ni logos de Canito.',
    ],
    noSe: true,
    campos: [
      { id: 'p2.mencion', etiqueta: '¿Apruebas la mención y el enlace?', tipo: 'unica', opciones: [SI, NO, { id: 'cambios', etiqueta: 'Con cambios', detalle: '¿Qué cambios?' }] },
      {
        id: 'p2.nombre',
        etiqueta: 'Nombre oficial exacto',
        ayuda: 'En los documentos aparecen tres.',
        tipo: 'unica',
        opciones: [
          { id: 'tacos_canito', etiqueta: 'Tacos Canito' },
          { id: 'canito_tacos', etiqueta: 'Canito Tacos' },
          { id: 'taqueria_canito', etiqueta: 'Taquería Canito' },
          { id: 'otro', etiqueta: 'Otro', detalle: '¿Cuál?' },
        ],
      },
      {
        id: 'p2.verbo',
        etiqueta: '¿«Fundó» es exacto?',
        tipo: 'unica',
        opciones: [
          { id: 'funde', etiqueta: 'Fundé' },
          { id: 'cofunde', etiqueta: 'Cofundé' },
          { id: 'otro', etiqueta: 'Otro', detalle: '¿Cómo lo decimos?' },
        ],
      },
      sino('p2.aprueba', '¿Alguien más tiene que aprobar la mención, como socios?', {
        opciones: [NO, { id: 'si', etiqueta: 'Sí', detalle: '¿Quién?' }],
      }),
      { id: 'p2.sitio', etiqueta: '¿Para cuándo estará publicada tacoscanito.com?', tipo: 'corto', placeholder: 'Fecha aproximada' },
    ],
  },
  {
    n: 3,
    id: 'P3',
    prioridad: 'P0',
    bloque: 'nombre',
    titulo: 'Mención de Francis Mallmann',
    pregunta: '¿Nombramos a Francis Mallmann?',
    intro: 'Si no contestas, no lo nombramos.',
    siNoContesta: 'Si no contestas, no lo nombramos (nivel 0).',
    contexto: [
      'Lo que nunca haríamos: ponerlo en el título, los anuncios o los hashtags; decir «estilo Mallmann»; usar los nombres de sus libros, restaurantes o programas.',
      'Tiene solicitudes de marca en EE. UU. (2024) y Reino Unido (2026). En México el riesgo es sugerir un respaldo que no existe (LFPC art. 32; por validar con abogado).',
    ],
    noSe: true,
    campos: [
      sino('p3.inspira', '¿Es cierto que su cocina de fuego abierto es una de tus inspiraciones?'),
      sino('p3.relacion', '¿Tienes alguna relación con él, como formación o colaboración?', {
        ayuda: 'Solo se menciona con prueba escrita.',
        opciones: [NO, { id: 'si', etiqueta: 'Sí', detalle: '¿Cuál?' }],
      }),
      {
        id: 'p3.nivel',
        etiqueta: 'Nivel de mención',
        tipo: 'unica',
        porDefecto: 'n0',
        opciones: [
          { id: 'n0', etiqueta: '0 · No se nombra' },
          {
            id: 'n1',
            etiqueta:
              '1 · Una sola vez, en tu bio, con esta frase exacta: «Entre las cocinas que lo inspiran está la de fuego abierto que Francis Mallmann popularizó.»',
          },
        ],
        ayuda: 'Pie opcional del nivel 1: «Mención de inspiración; no existe relación comercial ni respaldo.»',
      },
    ],
  },

  // ---------------------------------------------------------------- P0 · Oferta y precios
  {
    n: 4,
    id: 'P4',
    prioridad: 'P0',
    bloque: 'oferta',
    titulo: 'Los cuatro formatos',
    pregunta: '¿Apruebas los cuatro formatos?',
    intro:
      'Todos se cocinan igual: con leña, tiempo y tú presente (eso lo confirmas en la pregunta 8). Cambian el tamaño, el tipo de evento y el servicio. En la página van en este orden: Íntima, Larga, Boda, Marca.',
    noSe: true,
    campos: [
      {
        id: 'p4.intima',
        etiqueta: 'Mesa Íntima · 10–20 invitados',
        ayuda:
          'Para pedidas, aniversarios, cumpleaños y cenas privadas; también bodas íntimas y cenas de empresa chicas. Incluye: 4–6 tiempos servidos y contados por ti; 2–3 lumbres.',
        fotos: [{ id: 'F307', archivo: 'FOTOS\\DSC00669.jpg' }],
        tipo: 'unica',
        opciones: [SI, NO, CAMBIO()],
      },
      {
        id: 'p4.larga',
        etiqueta: 'Mesa Larga · 21–300 invitados',
        ayuda:
          'Para cumpleaños, fiestas y celebraciones, aniversarios, reuniones familiares. Incluye: recibimiento, entradas al centro, piezas de 3–4 lumbres cortadas frente a la mesa y postre.',
        fotos: [{ id: 'F128', archivo: 'FOTOS\\DSC00248.jpg' }],
        tipo: 'unica',
        opciones: [SI, NO, CAMBIO()],
      },
      {
        id: 'p4.boda',
        etiqueta: 'Boda al Fuego · 21–300 invitados',
        ayuda:
          'Para bodas, civiles, cenas de bienvenida y tornabodas. Incluye: recibimiento y comida al fuego, coordinados con el planner y el lugar; visita al lugar y degustación (¿con costo acreditable? pregunta 7).',
        fotos: [{ id: 'F255', archivo: 'FOTOS\\DSC00542.jpg (retocada)' }],
        tipo: 'unica',
        opciones: [SI, NO, CAMBIO()],
      },
      {
        id: 'p4.marca',
        etiqueta: 'Fuego de Marca · 21–300 invitados',
        ayuda:
          'Para eventos de empresa: cierres de año, lanzamientos, incentivos, comidas con clientes. Incluye: el fuego como escenario y estaciones a la vista; factura CFDI.',
        fotos: [{ id: 'F006', archivo: 'FOTOS\\DJI_0016.jpg' }],
        tipo: 'unica',
        opciones: [SI, NO, CAMBIO()],
      },
      {
        id: 'p4.regla',
        etiqueta: 'Regla de asignación',
        ayuda:
          'Es la misma en las tarjetas, en el formulario y en la ficha que te llega. De 10 a 20 invitados: Mesa Íntima, sea cual sea la ocasión (si la contrata una empresa, es el mismo total con IVA incluido y la factura CFDI desglosa el IVA). De 21 a 300, según la ocasión: una boda va a Boda al Fuego, un evento de empresa a Fuego de Marca y todo lo demás a Mesa Larga.',
        tipo: 'unica',
        opciones: [{ id: 'acuerdo', etiqueta: 'De acuerdo' }, { id: 'cambio', etiqueta: 'Cambio', detalle: '¿Qué cambia?' }],
      },
      {
        id: 'p4.fuera',
        etiqueta: 'Fuera del rango (ya está decidido; es para que sepas cómo se ve)',
        ayuda:
          'Más de 300: la página dice «Lo revisamos contigo» y la solicitud te llega con el formato según la ocasión y marcada para revisión manual. Menos de 10: «Por ahora cocinamos para eventos desde 10 invitados. Si tu grupo puede crecer, cambia el número; si no, escríbenos y te orientamos.»',
        tipo: 'unica',
        opcional: true,
        opciones: [{ id: 'bien', etiqueta: 'Así está bien' }, { id: 'cambio', etiqueta: 'Cambio al texto', detalle: '¿Qué cambiarías?' }],
      },
    ],
  },
  {
    n: 5,
    id: 'P5',
    prioridad: 'P0',
    bloque: 'oferta',
    titulo: 'Precio «desde» y mínimo por evento',
    pregunta: '¿Cuál es tu precio «desde» y tu mínimo por evento?',
    intro:
      'A particulares se les da el precio total con IVA incluido; «+ IVA» solo a empresas. Debajo de cada formato va nuestra hipótesis para platicar: es estimada y no se publica.',
    contexto: [
      'Mercado: en Durango, los banquetes van de unos $150 a unos $2,000 por persona, y una boda promedio cuesta $160–260 mil en total (Posta, 9-feb-2025).',
      'Con nuestra hipótesis de Boda, 150 invitados suman $150–210 mil solo en comida: casi todo el presupuesto de una boda promedio. Nuestras hipótesis quedan en la mitad alta del mercado local, no en su techo.',
      'Precio total con IVA a particulares: PROFECO, LFPC art. 7 Bis (por validar).',
      'En Mesa Larga, Boda y Marca, el mínimo debe ser igual o mayor que «desde» × 21 invitados.',
      'Los viáticos fuera de tu zona van desglosados aparte, nunca dentro del «desde».',
      'Con estos números armamos las bandas de inversión del formulario, incluida una banda baja.',
    ],
    noSe: true,
    campos: [
      {
        id: 'p5.precios',
        etiqueta: 'Precio y mínimo por formato',
        tipo: 'tabla',
        regla: 'minimo21',
        columnas: [
          { id: 'precio', etiqueta: 'Desde, por invitado, IVA incluido', tipo: 'monto' },
          { id: 'minimo', etiqueta: 'Mínimo por evento', tipo: 'monto' },
        ],
        filas: [
          {
            id: 'intima',
            etiqueta: 'Mesa Íntima (10–20)',
            ayuda: 'Nuestra hipótesis: $18–25 mil por evento.',
            etiquetas: { precio: 'Precio por evento, IVA incluido' },
            omitir: ['minimo'],
            notas: { minimo: 'El mínimo es el mismo precio por evento.' },
          },
          { id: 'larga', etiqueta: 'Mesa Larga (21–300)', ayuda: 'Nuestra hipótesis: $1,100–1,500 por invitado.' },
          { id: 'boda', etiqueta: 'Boda al Fuego (21–300)', ayuda: 'Nuestra hipótesis: $1,000–1,400 por invitado.' },
          { id: 'marca', etiqueta: 'Fuego de Marca (21–300)', etiquetas: { precio: 'Desde, por invitado + IVA' } },
        ],
      },
      {
        id: 'p5.intima',
        etiqueta: 'Mesa Íntima: ¿el precio queda cerrado de 10 a 20 invitados, o sube por invitado a partir de cierto número?',
        tipo: 'unica',
        opciones: [
          { id: 'cerrado', etiqueta: 'Queda cerrado de 10 a 20' },
          { id: 'sube', etiqueta: 'Sube por invitado a partir de cierto número', detalle: '¿Desde cuántos invitados y cuánto sube?' },
        ],
      },
      sino('p5.volumen', 'Volumen: ¿el precio por invitado baja en eventos grandes (por ejemplo, de 201 a 300)?', {
        opciones: [NO, { id: 'si', etiqueta: 'Sí', detalle: '¿Cuánto baja y desde cuántos?' }],
      }),
    ],
  },
  {
    n: 6,
    id: 'P6',
    prioridad: 'P0',
    bloque: 'oferta',
    titulo: 'Qué incluye y qué va aparte',
    pregunta: '¿Qué incluye siempre y qué va aparte?',
    listas: [
      {
        titulo: 'Incluye (propuesta)',
        items: [
          'Revisión del lugar por fotos o video.',
          'Visita al lugar en bodas y en eventos grandes (el número lo pones abajo).',
          'Traslado del equipo de fuego dentro de tu zona.',
          'Leña y brigada.',
          'Montaje y desmontaje de la zona de fuego y de la zona de servicio.',
          'Entregar el terreno limpio y apagado.',
        ],
      },
      {
        titulo: 'Aparte',
        items: [
          'El lugar (renta, derecho de piso o proveedor exclusivo, si el lugar los cobra).',
          'Bebidas, mobiliario, loza y meseros.',
          'Carpa o plan de lluvia, e iluminación.',
          'Viáticos fuera de tu zona, desglosados.',
          'Permisos del lugar o de Protección Civil.',
        ],
      },
    ],
    contexto: ['La propina siempre es voluntaria.'],
    noSe: true,
    campos: [
      { id: 'p6.visita', etiqueta: 'Visita al lugar en bodas y en eventos de más de…', tipo: 'numero', unidad: 'invitados', porDefecto: 100 },
      { id: 'p6.lista', etiqueta: '¿Las dos listas están bien?', tipo: 'unica', opciones: [{ id: 'correcto', etiqueta: 'Correcto' }, { id: 'cambios', etiqueta: 'Cambios', detalle: '¿Qué cambia?', detalleLargo: true }] },
    ],
  },
  {
    n: 7,
    id: 'P7',
    prioridad: 'P0',
    bloque: 'oferta',
    titulo: 'Condiciones para apartar una fecha',
    pregunta: '¿Con qué condiciones se aparta una fecha?',
    noSe: true,
    campos: [
      { id: 'p7.anticipo', etiqueta: 'Anticipo', tipo: 'numero', unidad: '%', porDefecto: 50 },
      { id: 'p7.final', etiqueta: 'Número final de invitados', tipo: 'numero', unidad: 'días antes', porDefecto: 10 },
      {
        id: 'p7.cancelacion',
        etiqueta: 'Reprogramación o cancelación',
        ayuda: 'Propuesta: se puede reprogramar avisando con más de 30 días; la penalización debe ser proporcional (por validar).',
        tipo: 'largo',
        porDefecto: 'Se puede reprogramar avisando con más de 30 días; la penalización es proporcional.',
      },
      { id: 'p7.degustacion', etiqueta: 'Degustación en bodas: costo', tipo: 'monto' },
      sino('p7.acredita', '¿La degustación se acredita al contratar?'),
      { id: 'p7.propuesta', etiqueta: '¿En cuánto tiempo mandas la propuesta después de ver las fotos del lugar?', tipo: 'numero', unidad: 'horas', porDefecto: 48 },
      {
        id: 'p7.pagos',
        etiqueta: 'Formas de pago',
        tipo: 'multiple',
        opciones: [
          { id: 'transferencia', etiqueta: 'Transferencia' },
          { id: 'tarjeta', etiqueta: 'Tarjeta' },
          { id: 'msi', etiqueta: 'Meses sin intereses' },
        ],
      },
      sino('p7.cfdi', '¿Facturas CFDI 4.0?'),
      sino('p7.contrato', '¿Tienes un contrato tipo?', {
        ayuda:
          'Como trabajas en el lugar del cliente, el contrato debe dejar por escrito (por validar con abogado): quién gestiona el permiso del lugar para el fuego abierto; quién paga el derecho de piso o al proveedor exclusivo; quién responde por daños al terreno; y que el terreno se entrega limpio y apagado.',
      }),
    ],
  },

  // ---------------------------------------------------------------- P0 · Equipo y brigada
  {
    n: 8,
    id: 'P8',
    prioridad: 'P0',
    bloque: 'brigada',
    titulo: 'Brigada, equipo y espacio por tamaño',
    pregunta: '¿Qué brigada, equipo y espacio necesitas según el tamaño?',
    intro:
      'Es lo que más necesitamos para prometer 300 invitados sin quedarte corto. El rango de 10 a 300 ya está decidido; esto dice cómo se cubre cada banda. Sin esta tabla la página no se publica: ninguna tarjeta promete algo que no escale al tamaño del evento.',
    noSe: true,
    campos: [
      {
        id: 'p8.bandas',
        etiqueta: 'Por banda de invitados',
        ayuda: 'Nuestra referencia para la zona de fuego de un evento chico es de unos 6 × 4 m, o sea 24 m² (estimado).',
        tipo: 'tabla',
        columnas: [
          { id: 'cocineros', etiqueta: 'Cocineros en tu brigada', tipo: 'numero' },
          { id: 'lumbres', etiqueta: 'Lumbres a la vez', tipo: 'numero' },
          { id: 'fuego', etiqueta: 'Zona de fuego', tipo: 'numero', unidad: 'm²', decimales: true },
          { id: 'servicio', etiqueta: 'Zona de servicio y emplatado', tipo: 'numero', unidad: 'm²', decimales: true },
          { id: 'extra', etiqueta: '¿Necesitas gente o equipo extra?', tipo: 'opciones', opciones: [NO, { id: 'si', etiqueta: 'Sí', detalle: '¿Qué necesitas?' }] },
        ],
        filas: [
          { id: '10-20', etiqueta: '10–20 invitados' },
          { id: '21-50', etiqueta: '21–50 invitados' },
          { id: '51-100', etiqueta: '51–100 invitados' },
          { id: '101-200', etiqueta: '101–200 invitados' },
          { id: '201-300', etiqueta: '201–300 invitados' },
        ],
      },
      { id: 'p8.tapada', etiqueta: 'En La Tapada (≈200 invitados, por confirmar), ¿cuántas personas trabajaron contigo en la cocina?', tipo: 'numero', unidad: 'personas' },
      { id: 'p8.finde', etiqueta: '¿Cuántos eventos puedes tomar por fin de semana?', tipo: 'numero', unidad: 'eventos' },
      { id: 'p8.mes', etiqueta: '¿Y por mes?', tipo: 'numero', unidad: 'eventos' },
      sino('p8.presente', '¿Estás presente en persona en todos los eventos?', {
        ayuda: 'La página dice «con el chef presente» solo si lo confirmas.',
      }),
      { id: 'p8.mismoDia', etiqueta: '¿Cuántos eventos puedes cubrir el mismo día?', tipo: 'numero', unidad: 'eventos' },
    ],
  },
  {
    n: 9,
    id: 'P9',
    prioridad: 'P0',
    bloque: 'brigada',
    titulo: 'El equipo que es tuyo',
    pregunta: '¿Qué equipo es tuyo?',
    noSe: true,
    campos: [
      {
        id: 'p9.equipo',
        etiqueta: '¿El equipo de La Tapada (bastidor colgadero, jaula de varilla, disco y ollas) es tuyo?',
        tipo: 'unica',
        opciones: [SI, { id: 'parte', etiqueta: 'Parte', detalle: '¿Qué parte?' }, NO],
      },
      sino('p9.camisas', '¿Las camisas olivo con A·L de F446 son de tu brigada?', {
        fotos: [{ id: 'F446', archivo: 'TAPADA ICÓNICA\\DSC00122.jpg' }],
      }),
      {
        id: 'p9.transporte',
        etiqueta: 'Transporte del equipo',
        tipo: 'unica',
        opciones: [
          { id: 'propio', etiqueta: 'Propio', detalle: '¿Qué vehículos?' },
          { id: 'rentado', etiqueta: 'Rentado' },
        ],
      },
      sino('p9.extintores', '¿Llevas extintores?'),
    ],
  },

  // ---------------------------------------------------------------- P0 · Lo que necesitas del lugar
  {
    n: 10,
    id: 'P10',
    prioridad: 'P0',
    bloque: 'lugar',
    titulo: 'Lo que le pedimos al lugar',
    pregunta: '¿Esto es lo que le pedimos al lugar?',
    intro:
      'Va en la página, en un esquema de la zona de fuego, la zona de servicio y la mesa, y en la pregunta frecuente «¿Qué necesitan del lugar?». El espacio: al aire libre, con las medidas de la pregunta 8.',
    noSe: true,
    campos: [
      { id: 'p10.fuego', etiqueta: 'Fuego permitido', ayuda: 'Que el lugar y el municipio permitan leña o fuego abierto.', tipo: 'unica', opciones: SI_CAMBIO('¿Qué cambia?') },
      {
        id: 'p10.piso',
        etiqueta: 'Piso y entorno',
        ayuda: 'Piso firme o tierra, lejos de lonas, ramas bajas y materiales que ardan; la cocina se orienta para que el viento lleve el humo lejos de la mesa.',
        tipo: 'unica',
        opciones: SI_CAMBIO('¿Qué cambia?'),
      },
      {
        id: 'p10.accesoM',
        etiqueta: 'Acceso: un vehículo llega a la zona de fuego o a menos de…',
        tipo: 'numero',
        unidad: 'metros',
        porDefecto: 50,
      },
      { id: 'p10.acceso', etiqueta: '¿El requisito de acceso está bien así?', tipo: 'unica', opciones: SI_CAMBIO('¿Qué cambia?') },
      { id: 'p10.lluvia', etiqueta: 'Plan de lluvia', ayuda: 'Techo abierto o carpa ventilada.', tipo: 'unica', opciones: SI_CAMBIO('¿Qué cambia?') },
      {
        id: 'p10.aguaLuz',
        etiqueta: 'Agua y luz cerca de la zona de servicio',
        tipo: 'unica',
        opciones: [{ id: 'necesito', etiqueta: 'Las necesito' }, { id: 'no_hacen_falta', etiqueta: 'No hacen falta' }],
      },
      { id: 'p10.montaje', etiqueta: '¿Cuántas horas antes llegas a montar y encender?', tipo: 'numero', unidad: 'horas', decimales: true },
      { id: 'p10.desmontaje', etiqueta: '¿Cuánto tardas en desmontar y entregar el terreno apagado?', tipo: 'numero', unidad: 'horas', decimales: true },
    ],
  },
  {
    n: 11,
    id: 'P11',
    prioridad: 'P0',
    bloque: 'lugar',
    titulo: 'Cuando el lugar no cumple',
    pregunta: '¿Qué haces cuando el lugar no cumple?',
    intro:
      'El formulario pregunta si hay espacio y si se permite el fuego. Si el cliente contesta que no, le decimos «Cuéntanos igual; vemos alternativas» y la solicitud te llega marcada.',
    noSe: true,
    campos: [
      {
        id: 'p11.sinFuego',
        etiqueta: 'Si el lugar no permite fuego abierto',
        tipo: 'unica',
        opciones: [{ id: 'no_tomo', etiqueta: 'No tomo el evento' }, { id: 'alternativa', etiqueta: 'Tengo una alternativa', detalle: '¿Cuál?' }],
      },
      sino('p11.sinLugar', 'Si el cliente aún no tiene lugar, ¿tienes lugares que acepten fuego para sugerirle?', {
        opciones: [{ id: 'si', etiqueta: 'Sí', detalle: '¿Cuáles?', detalleLargo: true }, NO],
      }),
      { id: 'p11.exclusivo', etiqueta: 'Si el lugar exige su proveedor exclusivo o cobra derecho de piso, ¿cómo lo manejas?', tipo: 'largo' },
      sino('p11.techo', '¿Has cocinado bajo techo abierto o carpa ventilada?'),
    ],
  },

  // ---------------------------------------------------------------- P0 · Zona de servicio y viáticos
  {
    n: 12,
    id: 'P12',
    prioridad: 'P0',
    bloque: 'zona',
    titulo: 'Desde dónde trabajas y hasta dónde vas',
    pregunta: '¿Desde dónde trabajas y hasta dónde vas?',
    intro:
      'En el formulario, la zona se elige con chips que armamos con tu respuesta: tu ciudad y alrededores · Resto de Durango · La Laguna · Monterrey · Mazatlán · Otro lugar. Para cada una marcamos si la cubres y si lleva viáticos.',
    noSe: true,
    campos: [
      { id: 'p12.base', etiqueta: 'Ciudad base', tipo: 'corto' },
      { id: 'p12.zona', etiqueta: 'Zona sin viáticos', tipo: 'corto', placeholder: 'Municipios o km a la redonda' },
      {
        id: 'p12.viajes',
        etiqueta: '¿Viajas a…?',
        tipo: 'multiple',
        opciones: [
          { id: 'durango', etiqueta: 'Resto de Durango' },
          { id: 'laguna', etiqueta: 'La Laguna' },
          { id: 'monterrey', etiqueta: 'Monterrey' },
          { id: 'mazatlan', etiqueta: 'Mazatlán' },
          { id: 'otros', etiqueta: 'Otros estados', detalle: '¿Cuáles?' },
          { id: 'eua', etiqueta: 'EE. UU.' },
        ],
      },
      {
        id: 'p12.viaticos',
        etiqueta: '¿Cómo cobras los viáticos fuera de tu zona?',
        ayuda: 'Traslado del equipo, hospedaje y alimentos de la brigada.',
        tipo: 'largo',
      },
      {
        id: 'p12.mercado',
        etiqueta: '¿A quién quieres venderle?',
        ayuda: 'Lo decides tú.',
        tipo: 'multiple',
        opciones: [
          { id: 'alto', etiqueta: 'Segmento alto local' },
          { id: 'empresas', etiqueta: 'Empresas' },
          { id: 'eua', etiqueta: 'Familias duranguenses que viven en EE. UU. (bodas y reuniones de diciembre)' },
          { id: 'otras', etiqueta: 'Otras plazas', detalle: '¿Cuáles?' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- P0 · Técnicas y menú
  {
    n: 13,
    id: 'P13',
    prioridad: 'P0',
    bloque: 'tecnicas',
    titulo: 'Las seis lumbres',
    pregunta: '¿Cuáles de estas seis lumbres montas tú con tu equipo?',
    intro: 'Solo publicamos las que confirmes. Si son menos de tres, la sección se funde con «Una noche en Nombre de Dios».',
    contexto: [
      'El horno de tierra de la tapada de agave (F289, F323, F358 y F362) lo hicieron maestros mezcaleros. Se publica siempre con su crédito y nunca como cocina tuya.',
    ],
    noSe: true,
    campos: [
      {
        id: 'p13.lumbres',
        etiqueta: 'Lumbre por lumbre',
        tipo: 'tabla',
        columnas: [
          { id: 'montas', etiqueta: '¿La montas tú?', tipo: 'opciones', opciones: SI_NO },
          { id: 'para300', etiqueta: '¿Sirve para 300?', tipo: 'opciones', opciones: [SI, { id: 'hasta', etiqueta: 'Hasta…', detalle: '¿Hasta cuántos invitados?' }] },
          { id: 'nombre', etiqueta: '¿El nombre te gusta?', tipo: 'opciones', opciones: [SI, { id: 'otro', etiqueta: 'Otro', detalle: '¿Cómo la llamarías?' }] },
        ],
        filas: [
          { id: 'colgadero', etiqueta: 'Colgadero', ayuda: 'Bastidor de hierro con costillares colgados sobre la leña.', fotos: [{ id: 'F252', archivo: 'FOTOS\\DSC00533.jpg' }] },
          { id: 'jaula', etiqueta: 'Jaula', ayuda: 'Domo de varilla con pollos al romero, coles y berenjenas colgados.', fotos: [{ id: 'F151', archivo: 'FOTOS\\DSC00283.jpg' }] },
          { id: 'parrilla', etiqueta: 'Parrilla', ayuda: 'Lomos bridados sobre llama y brasa.', fotos: [{ id: 'F044', archivo: 'FOTOS\\DSC00081.jpg' }] },
          { id: 'disco', etiqueta: 'Disco', ayuda: 'Disco de acero con leña al centro y tuétanos.', fotos: [{ id: 'F220', archivo: 'FOTOS\\DSC00433.jpg' }] },
          { id: 'rescoldo', etiqueta: 'Rescoldo', ayuda: 'Camote tatemado sobre brasa y ceniza.', fotos: [{ id: 'F250', archivo: 'FOTOS\\DSC00530.jpg' }] },
          { id: 'olla', etiqueta: 'Olla de leña', ayuda: 'Olla de arroz cremoso sobre la brasa.', fotos: [{ id: 'F140', archivo: 'FOTOS\\DSC00263.jpg' }] },
        ],
      },
    ],
  },
  {
    n: 14,
    id: 'P14',
    prioridad: 'P0',
    bloque: 'tecnicas',
    titulo: 'La leña',
    pregunta: '¿Qué leña usas?',
    intro: 'No nombramos la especie hasta que la confirmes.',
    noSe: true,
    campos: [
      { id: 'p14.especie', etiqueta: 'Especie o especies', ayuda: 'En las fotos se ven leños de mezquite apilados (por confirmar).', tipo: 'corto' },
      { id: 'p14.origen', etiqueta: 'Origen o proveedor', tipo: 'corto' },
      { id: 'p14.remision', etiqueta: '¿Tiene remisión forestal?', ayuda: 'Por validar.', tipo: 'sino', opciones: SI_NO_NOSE },
    ],
  },
  {
    n: 15,
    id: 'P15',
    prioridad: 'P0',
    bloque: 'tecnicas',
    titulo: 'Lo que hiciste en La Tapada de Luna',
    pregunta: '¿Qué hiciste tú en La Tapada de Luna?',
    intro:
      'Es para el caso «Una noche en Nombre de Dios» y el acordeón «Así se vio una mesa». Presentamos el evento como lo que fue: un evento de Martha Garza en el que participaste como chef invitado, no un evento privado que te contrataron.',
    noSe: true,
    campos: [
      {
        id: 'p15.platos',
        etiqueta: 'Plato por plato: ¿quién lo hizo?',
        tipo: 'tabla',
        columnas: [{ id: 'quien', etiqueta: '¿Quién lo hizo?', tipo: 'opciones', opciones: [{ id: 'yo', etiqueta: 'Yo' }, { id: 'otro', etiqueta: 'Otro', detalle: '¿Quién?' }] }],
        filas: [
          { id: 'quesos', etiqueta: 'Quesos en cubo con ate y aceitunas', fotos: [{ id: 'F203', archivo: 'FOTOS\\DSC00407.jpg' }] },
          { id: 'tuetanos', etiqueta: 'Tuétanos al disco', fotos: [{ id: 'F220', archivo: 'FOTOS\\DSC00433.jpg' }, { id: 'F307', archivo: 'FOTOS\\DSC00669.jpg' }] },
          { id: 'longaniza', etiqueta: 'Longaniza sobre puré con pistache', fotos: [{ id: 'F218', archivo: 'FOTOS\\DSC00430.jpg' }, { id: 'F216', archivo: 'FOTOS\\DSC00426.jpg' }] },
          { id: 'lomo', etiqueta: 'Lomo bridado y costillar ahumado', fotos: [{ id: 'F044', archivo: 'FOTOS\\DSC00081.jpg' }, { id: 'F252', archivo: 'FOTOS\\DSC00533.jpg' }] },
          { id: 'pollo', etiqueta: 'Pollo al romero de la jaula', fotos: [{ id: 'F139', archivo: 'FOTOS\\DSC00260.jpg' }] },
          { id: 'camote', etiqueta: 'Camote al rescoldo', fotos: [{ id: 'F250', archivo: 'FOTOS\\DSC00530.jpg' }] },
          {
            id: 'arroz',
            etiqueta: 'Arroz cremoso en olla',
            ayuda: 'El terminado de F310 (DSC00676.jpg) es de otro cocinero.',
            fotos: [{ id: 'F140', archivo: 'FOTOS\\DSC00263.jpg' }],
          },
          { id: 'postre', etiqueta: 'Postre con helado', fotos: [{ id: 'F321', archivo: 'FOTOS\\DSC00704.jpg' }] },
        ],
      },
      { id: 'p15.invitados', etiqueta: '¿Cuántos invitados hubo?', ayuda: 'Por las fotos estimamos unos 200 (estimado).', tipo: 'numero', unidad: 'invitados' },
      {
        id: 'p15.cocina',
        etiqueta: '¿Tu brigada cocinó para todos los invitados o compartiste la cocina con otros cocineros?',
        ayuda: 'Otros cocineros salen en F221 (DSC00435.jpg), F076/F077 y F310.',
        tipo: 'unica',
        opciones: [{ id: 'todos', etiqueta: 'Cocinamos para todos' }, { id: 'compartida', etiqueta: 'Compartimos la cocina con otros cocineros' }],
      },
      { id: 'p15.paraCuantos', etiqueta: '¿Para cuántos invitados cocinó tu equipo?', tipo: 'numero', unidad: 'invitados' },
      { id: 'p15.fuegos', etiqueta: '¿Cuántos fuegos de leña?', tipo: 'numero', unidad: 'fuegos' },
      { id: 'p15.tiempos', etiqueta: '¿Cuántos tiempos?', tipo: 'numero', unidad: 'tiempos' },
      {
        id: 'p15.hora',
        etiqueta: '¿A qué hora encendiste?',
        ayuda: 'Tu primera foto cocinando es de las 15:43 (F030, DSC00065.jpg).',
        tipo: 'corto',
        placeholder: 'Ej.: 13:30',
      },
    ],
  },

  // ---------------------------------------------------------------- P0 · WhatsApp y tiempo de respuesta
  {
    n: 16,
    id: 'P16',
    prioridad: 'P0',
    bloque: 'whatsapp',
    titulo: 'El WhatsApp de las solicitudes',
    pregunta: '¿A qué WhatsApp llegan las solicitudes?',
    listas: [
      {
        titulo: 'Así funciona',
        numerada: true,
        items: [
          'El cliente contesta 6 pantallas en unos 90 segundos: fecha, ocasión, invitados, lugar (si ya lo tiene, tipo, si hay espacio y se permite el fuego, zona y municipio), inversión y contacto.',
          'La solicitud se guarda con un folio (por ejemplo, ML-7Q4KX).',
          'Te llega al instante una ficha por Telegram, a una hoja «Leads» y por correo, con los datos del lugar y el formato sugerido.',
          'El cliente te escribe por WhatsApp con su folio.',
        ],
      },
    ],
    contexto: ['El formulario acepta números de México (+52) y de EE. UU. (+1).'],
    noSe: true,
    campos: [
      { id: 'p16.numero', etiqueta: 'Número para la página', tipo: 'corto', formato: 'telefono', placeholder: '10 dígitos' },
      sino('p16.business', '¿Es WhatsApp Business?', { ayuda: 'Es gratis, con etiquetas y mensaje de ausencia.' }),
      {
        id: 'p16.quien',
        etiqueta: '¿Quién contesta?',
        tipo: 'unica',
        opciones: [{ id: 'yo', etiqueta: 'Yo' }, { id: 'otra', etiqueta: 'Otra persona', detalle: '¿Quién?' }],
      },
      { id: 'p16.horario', etiqueta: 'Horario', tipo: 'corto', placeholder: 'Ej.: lunes a sábado, de 9:00 a 19:00' },
      sino('p16.telegram', '¿Usas Telegram?', {
        ayuda: 'Telegram es gratis y solo te llegarán las fichas; si no lo quieres, te avisamos por correo, un poco más lento.',
      }),
      { id: 'p16.correo', etiqueta: 'Correo de respaldo', tipo: 'corto', formato: 'correo' },
    ],
  },
  {
    n: 17,
    id: 'P17',
    prioridad: 'P0',
    bloque: 'whatsapp',
    titulo: 'El tiempo de respuesta',
    pregunta: '¿Qué tiempo de respuesta puedes cumplir?',
    listas: [
      {
        items: [
          'Promesa pública propuesta: «Te respondo en persona por WhatsApp el mismo día hábil.»',
          'Metas internas: clientes A en menos de 2 h dentro del horario, B en menos de 24 h hábiles y C en menos de 48 h.',
          'Regla: si el cliente no te escribe en 15 minutos, le escribes tú primero (ya tienes su número en la ficha).',
          'Fuera de horario: «Te respondo mañana antes de las 11:00» si mañana es día hábil; si no, «Te respondo el lunes antes de las 11:00» o el día hábil que toque (la hora está por confirmar).',
        ],
      },
    ],
    contexto: [
      'Responder en menos de 1 h multiplica unas 7 veces la probabilidad de calificar a un prospecto (HBR, 2011, estudio B2B en EE. UU.).',
      'Prometer «menos de 2 h» en público solo funciona si alguien más contesta los días de evento.',
    ],
    noSe: true,
    campos: [
      {
        id: 'p17.cumple',
        etiqueta: '¿Puedes cumplirlo?',
        tipo: 'unica',
        opciones: [{ id: 'puedo', etiqueta: 'Puedo cumplirlo' }, { id: 'ajustar', etiqueta: 'Ajustar', detalle: '¿Qué ajustamos?', detalleLargo: true }],
      },
      { id: 'p17.diasNo', etiqueta: '¿Qué días no contestas?', tipo: 'corto', placeholder: 'Ej.: domingos y festivos' },
      { id: 'p17.diasEvento', etiqueta: '¿Quién contesta los días de evento?', tipo: 'corto' },
    ],
  },

  // ---------------------------------------------------------------- P0 · Datos legales y cuentas
  {
    n: 18,
    id: 'P18',
    prioridad: 'P0',
    bloque: 'legal',
    titulo: 'Aviso de privacidad y factura',
    pregunta: '¿A nombre de quién van el aviso de privacidad y la factura?',
    intro:
      'El formulario recoge datos personales, así que la ley (LFPDPPP 2025) exige un aviso de privacidad con el nombre del responsable (por validar con abogado).',
    noSe: true,
    campos: [
      { id: 'p18.persona', etiqueta: 'Tipo de persona', tipo: 'unica', opciones: [{ id: 'fisica', etiqueta: 'Persona física' }, { id: 'moral', etiqueta: 'Persona moral' }] },
      { id: 'p18.nombre', etiqueta: 'Nombre o razón social', tipo: 'corto' },
      { id: 'p18.rfc', etiqueta: 'RFC', tipo: 'corto', formato: 'mayusculas' },
      { id: 'p18.domicilio', etiqueta: 'Domicilio', tipo: 'largo' },
      { id: 'p18.arco', etiqueta: 'Correo para derechos ARCO', ayuda: 'Acceso, rectificación, cancelación y oposición.', tipo: 'corto', formato: 'correo' },
      sino('p18.cfdi', '¿Emites CFDI 4.0?'),
    ],
  },
  {
    n: 19,
    id: 'P19',
    prioridad: 'P0',
    bloque: 'legal',
    titulo: 'Las cuentas a tu nombre',
    pregunta: '¿Abrimos las cuentas a tu nombre?',
    intro:
      'Serían el dominio .mx, Cloudflare (sitio y formulario), Google (hoja «Leads» y correo) y Telegram, para que todo quede a tu nombre. Mux, el servicio de video, solo haría falta si algún día publicamos un video largo del evento.',
    noSe: true,
    campos: [
      sino('p19.abrir', '¿Las abrimos a tu nombre?'),
      { id: 'p19.correo', etiqueta: 'Correo para las cuentas', tipo: 'corto', formato: 'correo' },
      { id: 'p19.dominio', etiqueta: '¿Dominio preferido?', tipo: 'corto', placeholder: 'Ej.: aldolugo.mx' },
    ],
  },

  // ---------------------------------------------------------------- P0 · Crédito de fotos y permisos
  {
    n: 20,
    id: 'P20',
    prioridad: 'P0',
    bloque: 'permisos',
    titulo: 'El crédito de las fotos y del video',
    pregunta: '¿Cómo damos el crédito de las fotos y del video?',
    intro:
      'Ya nos confirmaste (24-nov-2026) que tenemos permiso de uso comercial del material de La Tapada de Luna, fotos y video. Esto no frena la publicación; solo nos ayuda saber lo siguiente.',
    siNoContesta: 'Si no contestas, el crédito va como «Foto: La Tapada de Luna, Nombre de Dios, 2026».',
    noSe: true,
    campos: [
      { id: 'p20.fotografo', etiqueta: '¿Cómo quiere su crédito el fotógrafo?', tipo: 'corto', placeholder: 'Nombre o @usuario' },
      { id: 'p20.contacto', etiqueta: 'Contacto del fotógrafo', tipo: 'corto' },
      { id: 'p20.martha', etiqueta: '¿Cómo quiere Martha / La Tapada de Luna que aparezca su crédito?', tipo: 'corto' },
      {
        id: 'p20.acuerdo',
        etiqueta: '¿Nos compartes, para archivo, el mensaje o el acuerdo donde consta el permiso?',
        ayuda: 'Si lo tienes, ideal que diga medios, plazo, edición (color, B/N, recortes, retoque de marcas) y crédito; no es requisito.',
        tipo: 'unica',
        opciones: [{ id: 'paso', etiqueta: 'Sí, te lo paso' }, { id: 'no_hace_falta', etiqueta: 'No hace falta' }],
      },
      sino('p20.originales', '¿Nos autorizas a pedirle al fotógrafo los originales a resolución completa de F019, F289, F080, F042, F249 y F448?', {
        fotos: [
          { id: 'F019', archivo: 'FOTOS\\DJI_0054.jpg' },
          { id: 'F289', archivo: 'FOTOS\\DSC00626.jpg' },
          { id: 'F080', archivo: 'FOTOS\\DSC00142.jpg' },
          { id: 'F042', archivo: 'FOTOS\\DSC00078.jpg' },
          { id: 'F249', archivo: 'FOTOS\\DSC00529.jpg' },
          { id: 'F448', archivo: 'TAPADA ICÓNICA\\DSC00145.jpg' },
        ],
      }),
    ],
  },
  {
    n: 21,
    id: 'P21',
    prioridad: 'P0',
    bloque: 'permisos',
    titulo: 'El permiso de Martha Garza',
    pregunta: '¿Nos ayudas a pedirle permiso a Martha Garza (La Tapada de Luna)?',
    listas: [
      {
        titulo: 'Le pediríamos permiso para',
        items: [
          'nombrar el evento con la línea «Chef invitado en La Tapada de Luna · Nombre de Dios, 2026»;',
          'mostrar el montaje;',
          'aprobar la selección de fotos.',
        ],
      },
    ],
    contexto: [
      'Video, solo si llegan clips (no bloquea la v1): si llegan clips del evento ya editados y alguno sirve, lo integramos en espacios ya previstos (la portada, las lumbres, «Una noche en Nombre de Dios», tu sección y el cierre). Lo que no llegue o no sirva se queda con su foto.',
      'El permiso de uso comercial del video ya lo tenemos. Solo aplican dos reglas: un clip con música se publica con sonido solo si la licencia de la canción es clara (si no, va sin audio o no se usa), y ningún invitado reconocible sale sin su consentimiento.',
      'Si los clips te llegan a ti, pásanoslos tal cual, de preferencia por Drive o enlace (WhatsApp los recomprime y pierden calidad).',
    ],
    noSe: true,
    campos: [
      sino('p21.ayuda', '¿Nos ayudas a pedírselo?'),
      {
        id: 'p21.esMartha',
        etiqueta: '¿La mujer de F464 y F272 es Martha?',
        tipo: 'sino',
        opciones: SI_NO_NOSE,
        fotos: [
          { id: 'F464', archivo: 'TAPADA ICÓNICA\\DSC00569.jpg' },
          { id: 'F272', archivo: 'FOTOS\\DSC00586.jpg' },
        ],
      },
      { id: 'p21.sede', etiqueta: '¿Tienes contacto con la sede, Uraján de Luna?', tipo: 'corto' },
      sino('p21.testimonio', '¿Quieres que en la misma solicitud le pidamos un testimonio (pregunta 29)?'),
      { id: 'p21.clips', etiqueta: 'Si ya tienes clips del evento, pega aquí el enlace de Drive', tipo: 'corto', opcional: true, placeholder: 'https://…' },
    ],
  },
  {
    n: 22,
    id: 'P22',
    prioridad: 'P0',
    bloque: 'permisos',
    titulo: 'Invitados que salen en las fotos',
    pregunta: '¿Conoces a algún invitado que salga en las fotos?',
    intro:
      'No publicamos a ningún invitado reconocible sin su consentimiento por escrito, así que por diseño casi no usamos fotos con gente. Hay dos fotos que solo entran si sus invitados firman: F315 y F465.',
    fotos: [
      { id: 'F315', archivo: 'FOTOS\\DSC00688.jpg' },
      { id: 'F465', archivo: 'TAPADA ICÓNICA\\DSC00574.jpg' },
    ],
    siNoContesta: 'Si no contestas, esas dos fotos quedan fuera.',
    noSe: true,
    campos: [
      {
        id: 'p22.conoce',
        etiqueta: '¿Conoces a alguien?',
        tipo: 'unica',
        porDefecto: 'no',
        opciones: [{ id: 'conozco', etiqueta: 'Conozco a alguien', detalle: '¿A quién, y en qué foto?' }, { id: 'no', etiqueta: 'No: quedan fuera' }],
      },
    ],
  },

  // ---------------------------------------------------------------- P1 · Concepto y voz
  {
    n: 23,
    id: 'P23',
    prioridad: 'P1',
    bloque: 'voz',
    titulo: 'El manifiesto',
    pregunta: '¿El manifiesto suena a ti?',
    intro: 'Va en primera persona, con tu firma. Léelo en voz alta.',
    cita: {
      lineas: [
        'Antes que el plato, está la lumbre. Y la lumbre viaja: la llevo al jardín, a la hacienda o al patio de su casa.',
        'La prendo temprano y la dejo hablar. La brasa no se apura; el rescoldo termina lo que la flama empezó; el humo se queda en la ropa como un recuerdo.',
        'Cuelgo la carne sobre la leña, dejo el camote en la ceniza, pongo una olla grande al centro del fuego.',
        'Luego, la mesa larga bajo los mezquites: la conversación se alarga y nadie mira el reloj.',
        'No sirvo una cena. Enciendo una noche.',
      ],
      firma: '— Aldo Lugo',
    },
    contexto: ['Debajo va: ≈200 invitados en el evento · tus fuegos de cocina (pregunta 15) · desde las 15:43 · La Tapada de Luna, 2026 (por confirmar).'],
    noSe: true,
    campos: [
      {
        id: 'p23.suena',
        etiqueta: '¿Suena a ti?',
        tipo: 'unica',
        opciones: [SI, { id: 'cambia', etiqueta: 'Cambia esto', detalle: '¿Qué cambias?', detalleLargo: true }],
      },
    ],
  },

  // ---------------------------------------------------------------- P1 · Técnicas y operación
  {
    n: 24,
    id: 'P24',
    prioridad: 'P1',
    bloque: 'operacion',
    titulo: 'Otras técnicas que dominas',
    pregunta: '¿Qué otras técnicas dominas y puedes montar?',
    intro: 'Hoy no se publican; las agregamos si confirmas.',
    noSe: true,
    campos: [
      {
        id: 'p24.tecnicas',
        etiqueta: 'Marca las que montas',
        tipo: 'multiple',
        opciones: [
          { id: 'comal', etiqueta: 'Comal' },
          { id: 'tatema', etiqueta: 'Tatema de chiles' },
          { id: 'ahumado', etiqueta: 'Ahumado (en tu Instagram, con leña de manzano, feb-2025)' },
          { id: 'paellera', etiqueta: 'Paellera a la leña (Instagram, abr-2025)' },
          { id: 'rack', etiqueta: 'El rack vertical de humo de F174 (DSC00339.jpg) era mío' },
          { id: 'zaranda', etiqueta: 'Zaranda' },
          { id: 'horno', etiqueta: 'Horno de tierra (solo si lo ejecutas tú)' },
          { id: 'otra', etiqueta: 'Otra', detalle: '¿Cuál?' },
        ],
      },
    ],
  },
  {
    n: 25,
    id: 'P25',
    prioridad: 'P1',
    bloque: 'operacion',
    titulo: 'Qué pones tú y qué el cliente',
    pregunta: '¿Qué pones tú y qué pone el cliente?',
    noSe: true,
    campos: [
      {
        id: 'p25.mobiliario',
        etiqueta: 'Mobiliario, loza y meseros',
        tipo: 'multiple',
        opciones: [
          { id: 'propios', etiqueta: 'Propios' },
          { id: 'aliados', etiqueta: 'Con aliados', detalle: '¿Cuáles?' },
          { id: 'cliente', etiqueta: 'Los pone el cliente' },
        ],
      },
      {
        id: 'p25.bebidas',
        etiqueta: 'Bebidas',
        tipo: 'multiple',
        opciones: [
          { id: 'cliente', etiqueta: 'Las pone el cliente' },
          { id: 'aliados', etiqueta: 'Aliados de mezcal o vino', detalle: '¿Cuáles?' },
        ],
      },
      {
        id: 'p25.iluminacion',
        etiqueta: 'Iluminación de la zona de fuego y de servicio',
        tipo: 'unica',
        opciones: [{ id: 'yo', etiqueta: 'La llevo yo' }, { id: 'lugar', etiqueta: 'La pone el lugar o el cliente' }],
      },
    ],
  },
  {
    n: 26,
    id: 'P26',
    prioridad: 'P1',
    bloque: 'operacion',
    titulo: 'Clima, seguridad y permisos',
    pregunta: 'Clima, seguridad y permisos',
    noSe: true,
    campos: [
      { id: 'p26.planB', etiqueta: 'Plan B por lluvia o viento', tipo: 'largo' },
      sino('p26.planBIncluido', '¿El plan B está incluido?'),
      {
        id: 'p26.incendios',
        etiqueta: 'Temporada de incendios: ¿cómo adaptas el evento?',
        ayuda: 'En la sierra va aproximadamente de febrero a junio (estimado) y aplica la NOM-015-SEMARNAT/SAGARPA-2007.',
        tipo: 'largo',
      },
      sino('p26.seguro', '¿Tienes seguro de responsabilidad civil?', { ayuda: 'Muchas haciendas lo piden (no verificado).' }),
      {
        id: 'p26.seguro300',
        etiqueta: '¿Cubre eventos de hasta 300 invitados?',
        tipo: 'sino',
        opciones: SI_NO_NOSE,
        si: { campo: 'p26.seguro', valores: ['si'] },
      },
      {
        id: 'p26.pc',
        etiqueta: 'Protección Civil: ¿quién tramita sus permisos y los del lugar?',
        ayuda: 'En eventos grandes los requisitos pueden cambiar según el aforo (por validar).',
        tipo: 'multiple',
        opciones: [{ id: 'yo', etiqueta: 'Yo' }, { id: 'lugar', etiqueta: 'El lugar' }, { id: 'cliente', etiqueta: 'El cliente' }],
      },
      {
        id: 'p26.sanidad',
        etiqueta: 'Sanidad: ¿tienes aviso de funcionamiento y cumples la NOM-251-SSA1-2009?',
        ayuda: 'Por validar.',
        tipo: 'sino',
        opciones: SI_NO_NOSE,
      },
      sino('p26.alcohol', '¿Vendes alcohol?'),
    ],
  },
  {
    n: 27,
    id: 'P27',
    prioridad: 'P1',
    bloque: 'operacion',
    titulo: 'Alergias, dietas y niños',
    pregunta: 'Alergias, dietas y niños',
    noSe: true,
    campos: [
      {
        id: 'p27.alergias',
        etiqueta: '¿Cómo manejas las alergias severas?',
        ayuda: 'Propuesta: superficies y utensilios separados (por confirmar).',
        tipo: 'largo',
        porDefecto: 'Superficies y utensilios separados.',
      },
      sino('p27.protocolo', '¿Tienes un protocolo escrito de alérgenos?'),
      { id: 'p27.edad', etiqueta: '¿Desde qué edad cuenta un niño como invitado completo?', tipo: 'numero', unidad: 'años', porDefecto: 10 },
    ],
  },

  // ---------------------------------------------------------------- P1 · Permisos de terceros y testimonios
  {
    n: 28,
    id: 'P28',
    prioridad: 'P1',
    bloque: 'terceros',
    titulo: 'Tu brigada y los mezcaleros',
    pregunta: 'Tu brigada y los mezcaleros',
    intro: 'A otros cocineros nunca los presentamos como tú.',
    noSe: true,
    campos: [
      { id: 'p28.brigada', etiqueta: 'Nombres de tu brigada y si aceptan salir en fotos', tipo: 'largo' },
      { id: 'p28.f464', etiqueta: '¿Quiénes salen contigo en F464?', tipo: 'largo', fotos: [{ id: 'F464', archivo: 'TAPADA ICÓNICA\\DSC00569.jpg' }] },
      {
        id: 'p28.f249',
        etiqueta: '¿Quién es el cocinero de negro que sale en primer plano en F249, tu foto principal?',
        ayuda: 'Necesitamos su permiso, o lo recortamos.',
        tipo: 'corto',
        fotos: [{ id: 'F249', archivo: 'FOTOS\\DSC00529.jpg' }],
      },
      {
        id: 'p28.mezcaleros',
        etiqueta: 'Nombres de los maestros mezcaleros del horno, para su crédito (F289, F358 y F362)',
        tipo: 'largo',
      },
    ],
  },
  {
    n: 29,
    id: 'P29',
    prioridad: 'P1',
    bloque: 'terceros',
    titulo: 'Un testimonio real',
    pregunta: '¿Quién nos daría un testimonio real?',
    intro: 'Va con nombre y permiso. Puede ser de Martha, de algún invitado o de un cliente anterior. Sin un testimonio real, la sección no sale.',
    noSe: true,
    campos: [{ id: 'p29.quien', etiqueta: '¿Quién, y cómo lo contactamos?', tipo: 'largo' }],
  },

  // ---------------------------------------------------------------- P1 · Biografía
  {
    n: 30,
    id: 'P30',
    prioridad: 'P1',
    bloque: 'bio',
    titulo: 'Tu bio',
    pregunta: '¿Tu bio está bien?',
    intro: 'Va en tercera persona. Confirma cada dato.',
    cita: {
      lineas: [
        'Aldo Lugo cocina en Durango y viene del taco y el nixtamal. En sus mesas de fuego cuelga costillares sobre la leña, deja el camote en el rescoldo y pone una olla grande al centro de la brasa. (Aquí iría la frase de la pregunta 3, solo si la apruebas.) Cocina al frente de la lumbre.',
      ],
    },
    contexto: ['Con tu frase de Instagram: «Cocinar es una forma de comunicar, de expresar quién eres.»'],
    noSe: true,
    campos: [
      {
        id: 'p30.bio',
        etiqueta: '¿Está bien?',
        tipo: 'unica',
        opciones: [SI, { id: 'cambios', etiqueta: 'Cambios', detalle: '¿Qué cambias?', detalleLargo: true }],
      },
    ],
  },
  {
    n: 31,
    id: 'P31',
    prioridad: 'P1',
    bloque: 'bio',
    titulo: 'Datos reales para tu perfil',
    pregunta: '¿Qué datos reales podemos poner en tu perfil?',
    intro: 'Solo los que sean ciertos; no inventamos cifras.',
    noSe: true,
    campos: [
      { id: 'p31.anios', etiqueta: 'Años cocinando', tipo: 'numero', unidad: 'años' },
      { id: 'p31.formacion', etiqueta: 'Formación', tipo: 'largo' },
      { id: 'p31.prensa', etiqueta: 'Prensa', tipo: 'largo' },
      {
        id: 'p31.eventos',
        etiqueta: 'Eventos privados anteriores',
        ayuda:
          'Como la paella a la leña de abr-2025 o la cena de tres tiempos de oct-2026: ¿para quién fueron, dónde y con cuántos invitados? ¿Hay fotos con permiso?',
        tipo: 'largo',
      },
    ],
  },

  // ---------------------------------------------------------------- P1 · Aliados
  {
    n: 32,
    id: 'P32',
    prioridad: 'P1',
    bloque: 'aliados',
    titulo: 'Lugares y planners aliados',
    pregunta: '¿Trabajamos con lugares y planners aliados?',
    intro:
      'Es el canal que mejor encaja con un servicio que va al lugar del cliente: el lugar ya tiene el espacio y los clientes, y tú pones la lumbre. La página tiene una ruta para ellos: «¿Eres planner o tienes un lugar para eventos? Hablemos».',
    noSe: true,
    campos: [
      { id: 'p32.conoces', etiqueta: '¿Qué haciendas, quintas, jardines de eventos, planners u organizadores conoces?', tipo: 'largo' },
      sino('p32.comision', '¿Les darías comisión por cliente referido?', {
        opciones: [{ id: 'si', etiqueta: 'Sí', detalle: '¿Qué porcentaje?' }, NO],
      }),
    ],
  },

  // ---------------------------------------------------------------- P2 · Para después del lanzamiento
  {
    n: 33,
    id: 'P33',
    prioridad: 'P2',
    bloque: 'despues',
    titulo: 'Retrato, sesión de fuego y siguiente evento',
    pregunta: 'Retrato, sesión de fuego y tu siguiente evento privado',
    intro:
      'No generamos tu rostro con IA: en una marca como esta, un rostro sintético resta credibilidad. Mientras tanto usamos F249 y F042.',
    listas: [
      {
        titulo: 'Te proponemos tres cosas, que haría nuestro equipo',
        items: [
          'Retrato real: unos 10 minutos con luz de atardecer y otra serie de noche con la brasa, sin otras personas.',
          'Sesión de fuego propia: medio día en diciembre o enero, para tener tomas y video nuestros sin depender de los clips del evento.',
          'Tu siguiente evento privado como segundo caso: solo con permiso del cliente y de sus invitados, con una cláusula de foto y video en el contrato.',
        ],
      },
    ],
    noSe: true,
    campos: [
      { id: 'p33.fechas', etiqueta: 'Fechas posibles para el retrato y la sesión', tipo: 'corto' },
      { id: 'p33.evento', etiqueta: '¿Tienes un próximo evento privado que podamos documentar?', tipo: 'largo' },
      { id: 'p33.poster', etiqueta: '¿Tienes en alta resolución el retrato en B/N del póster de La Tapada? ¿Quién lo tomó?', tipo: 'largo' },
    ],
  },
  {
    n: 34,
    id: 'P34',
    prioridad: 'P2',
    bloque: 'despues',
    titulo: 'Canales y lo de después',
    pregunta: 'Canales y lo de después',
    intro:
      'Con unos 2,700 seguidores (2,682 el 23-nov-2026), el tráfico de la página será de cientos de visitas al mes (estimado), así que no haremos pruebas A/B en la v1.',
    noSe: true,
    campos: [
      sino('p34.anuncios', '¿Tienes presupuesto mensual para anuncios Click-to-WhatsApp?', {
        opciones: [{ id: 'si', etiqueta: 'Sí', detalle: '¿Cuánto al mes?' }, NO],
      }),
      sino('p34.google', '¿Abrimos tu perfil de Google Business como negocio de área de servicio, sin domicilio público?'),
      sino('p34.ingles', '¿Quieres una versión en inglés, para familias en EE. UU. y bodas destino?'),
      sino('p34.calendar', '¿Usas Google Calendar?', { ayuda: 'Más adelante serviría para mostrar disponibilidad.' }),
      { id: 'p34.quien', etiqueta: '¿Quién actualizará precios y textos después del lanzamiento?', tipo: 'corto' },
    ],
  },
];

// =====================================================================================
// Textos de la página (bienvenida, barra, resumen, envío)
// =====================================================================================

export const TOTAL = PREGUNTAS.length;
export const CUENTA = {
  P0: PREGUNTAS.filter((p) => p.prioridad === 'P0').length,
  P1: PREGUNTAS.filter((p) => p.prioridad === 'P1').length,
  P2: PREGUNTAS.filter((p) => p.prioridad === 'P2').length,
};

export const TEXTOS = {
  etiqueta: 'Mesa de Lumbre · Cuestionario',
  bienvenida: {
    titulo: 'Hola, Aldo.',
    lead: 'Ya tenemos la propuesta de tu página. Para publicarla nos faltan datos que solo tú tienes: precios, brigada y lo que necesitas del lugar.',
    puntos: [
      `${TOTAL} preguntas. Las ${CUENTA.P0} primeras (P0) bloquean la publicación; van primero.`,
      'Unos 30 minutos las P0 y 45 todo. No tiene que ser de una vez.',
      'Se guarda solo, a cada toque. Puedes saltar y volver.',
      '«No sé todavía» también es una respuesta válida. Lo que no confirmes no se publica.',
    ],
    plazo: 'Si puedes, empieza por las P0: son las que nos dejan publicar.',
    fotos: 'Las fotos se citan con su id (F252) y su archivo en el Drive (02_Fotos › 00_Originales_Drive).',
    empezar: 'Empezar',
    seguir: (n: number) => `Seguir en la pregunta ${n}`,
    resumen: 'Ver el resumen',
    yaEnviado: (cuando: string) => `Ya nos mandaste tus respuestas ${cuando}. Puedes cambiar lo que quieras y volver a enviar.`,
  },
  modos: {
    vistaPrevia:
      'Vista previa: lo que contestes se guarda solo en este teléfono. Para que nos llegue, abre el enlace personal que te mandamos.',
    demo: 'Demo: tus respuestas se guardan en este teléfono. Cuando conectemos el guardado en línea, también nos llegarán a nosotros.',
    malFormado: 'Este enlace parece incompleto. Lo que contestes se guarda solo en este teléfono; revisa que copiaste el enlace entero.',
    desconocido: 'No reconocemos este enlace. Lo que contestes se guarda solo en este teléfono; pídenos uno nuevo y no pierdes nada.',
    conectado: 'Tus respuestas se guardan en este teléfono y con nosotros.',
  },
  estado: {
    local: 'Guardado en este teléfono ✓',
    guardando: 'Guardando…',
    guardado: (hace: string) => `Guardado ✓ ${hace}`,
    sinConexion: 'Sin conexión, guardado en este teléfono',
    reintentando: 'Guardado en este teléfono · reintentando',
    error: 'No se pudo guardar en línea; está en este teléfono',
    sinAlmacen: 'Este navegador no guarda: copia tus respuestas',
  },
  avisos: {
    sinConexion: 'Sin conexión: seguimos guardando en este teléfono y lo mandamos cuando vuelva la señal.',
    error: 'No pudimos guardar en línea. Tus respuestas siguen a salvo en este teléfono.',
    sinAlmacen: 'Este navegador no deja guardar. Antes de salir, toca «Copiar todas las respuestas» en el resumen.',
    desconocido: 'No reconocemos este enlace; desde ahora se guarda solo en este teléfono.',
    propuesta: (v: string) => `Listo: ${v}.`,
    copiado: 'Copiamos tus respuestas. Pégalas en WhatsApp.',
    copiaManual: 'Mantén presionado el texto, elige «Seleccionar todo» y luego «Copiar».',
  },
  nav: {
    atras: 'Atrás',
    resumen: 'Resumen',
    siguiente: 'Siguiente',
    saltar: 'Saltar por ahora',
    revisar: 'Revisar y enviar',
    inicio: 'Inicio',
  },
  pregunta: {
    contexto: 'Más contexto',
    noSe: 'No sé todavía',
    noSeAyuda: 'Marca esto si aún no lo sabes. No frena el resto.',
    usar: 'Usar la propuesta',
    hipotesis: 'Hipótesis',
    foto: 'Foto',
  },
  estados: {
    completa: 'Contestada',
    parcial: 'A medias',
    nose: 'No sé todavía',
    pendiente: 'Sin contestar',
  },
  resumen: {
    titulo: 'Resumen',
    lead: 'Toca una pregunta para cambiarla. Puedes enviar aunque falten respuestas y volver después.',
    cuenta: (c: number, t: number) => `${c} de ${t} contestadas`,
    enviar: 'Enviar respuestas a Antemano',
    enviando: 'Enviando…',
    copiar: 'Copiar todas las respuestas',
    copiarAyuda: 'Texto listo para pegar en WhatsApp, por si acaso.',
    enviadoEl: (cuando: string) => `Enviado ${cuando}. Si cambias algo, vuelve a enviar.`,
    faltan: (n: number, total: number) =>
      n === 1 ? `Te falta 1 de las ${total} preguntas que bloquean la publicación.` : `Te faltan ${n} de las ${total} preguntas que bloquean la publicación.`,
    faltanAyuda: 'Puedes enviar así y contestarlas después; «No sé todavía» también cuenta.',
    irA: (n: number) => `Contestar la pregunta ${n}`,
    enviarAsi: 'Enviar así',
    sinRespuesta: 'Sin contestar',
  },
  gracias: {
    sello: 'Recibido',
    titulo: 'Gracias, Aldo. Ya nos llegaron tus respuestas.',
    texto:
      'Con tus respuestas P0 armamos la configuración de precios, formatos y requisitos del lugar, pedimos los permisos que faltan (Martha, invitados y brigada) y empezamos a construir la v1.',
    cambios: 'Si cambias algo, se guarda solo. Vuelve a tocar «Enviar» para avisarnos.',
    pendienteTitulo: 'Listo. Se manda en cuanto haya señal.',
    pendienteTexto: 'Tus respuestas están guardadas en este teléfono y se envían solas al volver la conexión, también si vuelves a abrir este enlace.',
    localTitulo: 'Guardado en este teléfono.',
    localTexto: 'Desde esta vista tus respuestas no nos llegan solas: el guardado en línea todavía no está conectado. Cópialas y mándanoslas por WhatsApp.',
    errorTitulo: 'No se pudo enviar.',
    errorTexto: 'Tus respuestas están a salvo en este teléfono. Cópialas y mándanoslas por WhatsApp, y lo revisamos.',
    volver: 'Volver al resumen',
  },
  copia: {
    encabezado: 'Cuestionario · ALDO chef LUGO · Mesa de Lumbre',
    noSe: 'No sé todavía',
    sinContestar: '(sin contestar)',
  },
  sinJs: 'Este cuestionario necesita JavaScript para guardar tus respuestas. Si no se puede, contéstanos por WhatsApp citando el número de cada pregunta.',
};

// =====================================================================================
// Modelo para el navegador (JSON en la página; el cliente no importa este archivo)
// =====================================================================================

/** Claves que solo sirven para pintar la página en el build. */
const SOLO_PAGINA = new Set(['ayuda', 'intro', 'contexto', 'listas', 'cita', 'fotos', 'placeholder', 'pregunta', 'siNoContesta', 'notas', 'formato']);

export function modeloCliente() {
  const preguntas = JSON.parse(JSON.stringify(PREGUNTAS, (k, v) => (SOLO_PAGINA.has(k) ? undefined : v)));
  return { total: TOTAL, cuenta: CUENTA, bloques: BLOQUES, prioridades: PRIORIDADES, preguntas };
}

/** Tipos del modelo del navegador (lo mismo que Pregunta/Campo, sin los textos de página). */
export type ModeloCliente = ReturnType<typeof modeloCliente> & { preguntas: Pregunta[] };

/** Texto plano de los mensajes que el cliente necesita (sin funciones). */
export function textosCliente() {
  return {
    etiquetaCopia: TEXTOS.copia,
    estados: TEXTOS.estados,
    estado: {
      local: TEXTOS.estado.local,
      guardando: TEXTOS.estado.guardando,
      guardado: TEXTOS.estado.guardado('{hace}'),
      sinConexion: TEXTOS.estado.sinConexion,
      reintentando: TEXTOS.estado.reintentando,
      error: TEXTOS.estado.error,
      sinAlmacen: TEXTOS.estado.sinAlmacen,
    },
    avisos: {
      sinConexion: TEXTOS.avisos.sinConexion,
      error: TEXTOS.avisos.error,
      sinAlmacen: TEXTOS.avisos.sinAlmacen,
      desconocido: TEXTOS.avisos.desconocido,
      propuesta: TEXTOS.avisos.propuesta('{v}'),
      copiado: TEXTOS.avisos.copiado,
      copiaManual: TEXTOS.avisos.copiaManual,
    },
    nav: TEXTOS.nav,
    resumen: {
      cuenta: TEXTOS.resumen.cuenta(-1, -2).replace('-1', '{c}').replace('-2', '{t}'),
      enviar: TEXTOS.resumen.enviar,
      enviando: TEXTOS.resumen.enviando,
      enviadoEl: TEXTOS.resumen.enviadoEl('{cuando}'),
      faltan1: TEXTOS.resumen.faltan(1, CUENTA.P0),
      faltanN: TEXTOS.resumen.faltan(-1, CUENTA.P0).replace('-1', '{n}'),
      irA: TEXTOS.resumen.irA(-1).replace('-1', '{n}'),
      sinRespuesta: TEXTOS.resumen.sinRespuesta,
    },
    bienvenida: {
      empezar: TEXTOS.bienvenida.empezar,
      seguir: TEXTOS.bienvenida.seguir(-1).replace('-1', '{n}'),
      yaEnviado: TEXTOS.bienvenida.yaEnviado('{cuando}'),
    },
  };
}
export type TextosCliente = ReturnType<typeof textosCliente>;
