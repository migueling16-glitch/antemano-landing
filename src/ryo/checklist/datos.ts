/**
 * Checklist de apertura y cierre de Ryo Café — contenido.
 *
 * Transcrito de "RyoCafe_Checklist_Apertura_Cierre.pdf" (Operación de barra,
 * septiembre 2026). El PDF marca las tareas críticas con letra recta y las
 * normales con itálica; aquí eso es `critica: true`. Se respetó tal cual.
 *
 * Todo el texto editable vive aquí. La página (Checklist.astro) no tiene
 * contenido propio: cambia algo en este archivo y se refleja en el sitio.
 */

export type Herramienta =
  /** Captura de temperaturas de la bitácora, con el límite de 7 °C */
  | 'temperatura'
  /** Calculadora de extracción de la bitácora de calibración */
  | 'calibracion'
  /** Nota libre que viaja al reporte y a la apertura siguiente */
  | 'faltantes'
  /** Arma el reporte para el grupo de WhatsApp */
  | 'reporte'
  /** Muestra lo que dejó anotado el cierre anterior */
  | 'cierre-anterior';

export type Tarea = {
  texto: string;
  /** Letra recta en el PDF: seguridad, inocuidad o dinero. No se salta. */
  critica: boolean;
  herramienta?: Herramienta;
};

export type Seccion = {
  titulo: string;
  tareas: Tarea[];
};

export type Aviso = {
  titulo: string;
  texto: string;
  /** Índice de la sección después de la cual aparece */
  despuesDe: number;
};

export type Turno = {
  id: 'apertura' | 'cierre';
  /** Número de sección del PDF, para el bloque de encabezado */
  numero: string;
  etiqueta: string;
  titulo: string;
  bajada: string;
  cuando: string;
  /** El PDF numera las secciones de apertura (1 · Llegada…) y no las de cierre. */
  numerar: boolean;
  secciones: Seccion[];
  aviso?: Aviso;
};

/* ─────────────────────────────────────────────────────────────
   REGLAS (sección 01 del PDF, "Cómo usar este checklist")
   ───────────────────────────────────────────────────────────── */

export const REGLA_DE_ORO =
  'Cada tarea lleva iniciales y hora. Sin firma, la tarea cuenta como no hecha.';

export const REGLA_CRITICAS =
  'Las tareas en letra recta son críticas: seguridad, inocuidad o dinero. No se saltan.';

/* ─────────────────────────────────────────────────────────────
   LÍMITES Y REFERENCIAS (secciones 06 y 07 del PDF)
   ───────────────────────────────────────────────────────────── */

/** NOM-251, apartado 5.5.2 */
export const LIMITE_REFRIGERACION = 7;

export const PROTOCOLO_FUERA_DE_LIMITE =
  'Aislar el producto, anotar la acción en observaciones y avisar al grupo.';

/** Extracción % = TDS % × bebida (g) ÷ dosis (g) */
export const REFERENCIA_EXTRACCION = { min: 18, max: 22 } as const;
export const REFERENCIA_TDS = { min: 8, max: 12 } as const;

/* ─────────────────────────────────────────────────────────────
   APERTURA (secciones 02 y 03 del PDF)
   ───────────────────────────────────────────────────────────── */

const APERTURA: Turno = {
  id: 'apertura',
  numero: '02',
  etiqueta: 'Apertura',
  titulo: 'Checklist de apertura',
  bajada: 'Llegada, equipo, higiene, caja, producto y salón',
  cuando: '30 min · antes de abrir al público',
  numerar: true,
  secciones: [
    {
      titulo: 'Llegada y seguridad',
      tareas: [
        { texto: 'Revisar exterior y accesos antes de entrar; si algo está forzado, no entrar y avisar', critica: true },
        { texto: 'Desactivar la alarma', critica: true },
        { texto: 'Revisar fugas de agua, olor a gas o cosas fuera de lugar', critica: true },
        { texto: 'Encender luces, ventilación y extractor', critica: false },
        { texto: 'Leer la bitácora del cierre anterior: pendientes, faltantes y fallas', critica: false, herramienta: 'cierre-anterior' },
      ],
    },
    {
      titulo: 'Equipo',
      tareas: [
        { texto: 'Encender máquina de espresso, molinos y horno UNOX (primero: tardan en calentar)', critica: false },
        { texto: 'Revisar presión y temperatura de la caldera', critica: false },
        { texto: 'Purgar cada grupo y el vaporizador', critica: false },
        { texto: 'Montar portafiltros y canastillas que quedaron en remojo', critica: false },
        { texto: 'Revisar el nivel del filtro de agua', critica: false },
      ],
    },
    {
      titulo: 'Higiene personal',
      tareas: [
        { texto: 'Uniforme y mandil limpios, cabello recogido, uñas cortas, sin joyería', critica: true },
        { texto: 'Lavado de manos al iniciar y cada vez que se regresa a la barra', critica: true },
      ],
    },
    {
      titulo: 'Caja y sistemas',
      tareas: [
        { texto: 'Contar el fondo fijo', critica: true },
        { texto: 'Abrir punto de venta; probar terminal, impresora e internet', critica: false },
        { texto: 'Revisar si llegan proveedores hoy', critica: false },
      ],
    },
    {
      titulo: 'Temperaturas y producto',
      tareas: [
        { texto: 'Registrar temperatura de refrigeradores en la bitácora: máximo 7 °C', critica: true, herramienta: 'temperatura' },
        { texto: 'Confirmar que el congelador mantiene el producto congelado', critica: true },
        { texto: 'Caducidades y rotación PEPS; lo vencido se tira y se anota como merma', critica: true },
        { texto: 'Jarabes: nivel, fecha y etiqueta; con burbujas, olor a fermento o turbios se tiran', critica: true },
        { texto: 'Tés T1 y T2: colar y pasar a jarra etiquetada', critica: false },
        { texto: 'Leche: fechas y cantidad suficiente para el día', critica: false },
        { texto: 'Hielo: nivel y pala fuera del hielo', critica: true },
        { texto: 'Garnish: cortar limones y cítricos del día', critica: false },
      ],
    },
    {
      titulo: 'Calibración',
      tareas: [
        { texto: 'Refractómetro en cero con agua destilada', critica: false },
        { texto: 'Ajustar espresso: dosis, rendimiento, tiempo, sabor y TDS', critica: false, herramienta: 'calibracion' },
        { texto: 'Verificar la dosis de cada bomba de jarabe', critica: false },
      ],
    },
    {
      titulo: 'Salón',
      tareas: [
        { texto: 'Mesas, sillas, piso y vidrios limpios', critica: false },
        { texto: 'Estación de autoservicio surtida: servilletas, popotes y agua', critica: false },
        { texto: 'Menú y lista de agotados actualizados', critica: false },
        { texto: 'Música, iluminación y temperatura del lugar', critica: false },
      ],
    },
    {
      titulo: 'Última revisión',
      tareas: [
        { texto: 'Recorrido de 1 minuto con ojos de cliente', critica: false },
        { texto: 'Abrir la puerta', critica: false },
      ],
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   CIERRE (secciones 04 y 05 del PDF)
   ───────────────────────────────────────────────────────────── */

const CIERRE: Turno = {
  id: 'cierre',
  numero: '04',
  etiqueta: 'Cierre',
  titulo: 'Checklist de cierre',
  bajada: 'Precierre, equipo, producto, limpieza, caja y cierre final',
  cuando: 'Precierre en la última hora · cierre de 30 a 45 min',
  numerar: false,
  secciones: [
    {
      titulo: 'T–60 min · Precierre',
      tareas: [
        { texto: 'Dejar de preparar producto que no se va a vender (leche extra, garnish)', critica: false },
        { texto: 'Lavar loza por tandas y limpiar el equipo que ya no se usa', critica: false },
        { texto: 'Preparar cold brew de té T1 y T2 para mañana', critica: true },
        { texto: 'Anotar faltantes para mañana', critica: false, herramienta: 'faltantes' },
      ],
    },
    {
      titulo: 'T–30 min · Última orden y puerta',
      tareas: [
        { texto: 'Avisar a los clientes con cortesía', critica: false },
        { texto: 'Empezar la limpieza del salón mientras terminan', critica: false },
        { texto: 'Cerrar con llave al salir el último cliente y voltear el letrero', critica: true },
      ],
    },
    {
      titulo: 'Máquina de espresso',
      tareas: [
        { texto: 'Contralavado de cada grupo con agua', critica: true },
        { texto: 'Contralavado con detergente (diario o mínimo 3 veces por semana)', critica: false },
        { texto: 'Cepillar grupos y empaques', critica: false },
        { texto: 'Portafiltros y canastillas en remojo', critica: false },
        { texto: 'Vaporizador limpio por dentro y por fuera, y purgado', critica: false },
        { texto: 'Charola de goteo, rejilla y exterior de la máquina', critica: false },
      ],
    },
    {
      titulo: 'Molinos',
      tareas: [
        { texto: 'Limpiar cámara y charola con cepillo', critica: false },
        { texto: 'Cerrar o vaciar la tolva', critica: false },
      ],
    },
    {
      titulo: 'Producto, hielo y horno',
      tareas: [
        { texto: 'Tirar la leche abierta que estuvo fuera de refrigeración', critica: true },
        { texto: 'Todo tapado, etiquetado con fecha y en refrigeración', critica: true },
        { texto: 'Registrar temperatura de cierre en la bitácora', critica: true, herramienta: 'temperatura' },
        { texto: 'Jarabes tapados y boquillas de las bombas limpias', critica: false },
        { texto: 'Vaciar la hielera y dejarla abierta para secar', critica: false },
        { texto: 'Ciclo de limpieza del horno UNOX y apagarlo', critica: false },
      ],
    },
    {
      titulo: 'Limpieza y basura',
      tareas: [
        { texto: 'Tarjas y superficies con desinfectante', critica: false },
        { texto: 'Trapos sucios a lavar', critica: false },
        { texto: 'Piso de barra y salón', critica: false },
        { texto: 'Sacar basura, cartón y posos de café (mínimo una vez al día)', critica: true },
      ],
    },
    {
      titulo: 'Caja',
      tareas: [
        { texto: 'Corte en el punto de venta y cierre de lote de la terminal', critica: true },
        { texto: 'Contar efectivo por denominación con la puerta cerrada, fuera de la vista de la calle', critica: true },
        { texto: 'Separar fondo fijo; sobre sellado a la caja fuerte; anotar diferencias', critica: true },
      ],
    },
    {
      titulo: 'Reporte al grupo',
      tareas: [
        { texto: 'Ventas, tickets por hora, merma, agotados, incidencias, faltantes y foto de la barra', critica: false, herramienta: 'reporte' },
      ],
    },
    {
      titulo: 'Cierre final',
      tareas: [
        { texto: 'Apagar equipos, excepto refrigeradores', critica: false },
        { texto: 'Revisar llaves de gas y agua, ventanas y puerta trasera', critica: true },
        { texto: 'Activar la alarma y cerrar', critica: true },
      ],
    },
  ],
  aviso: {
    /*
     * El PDF dice "SI SE CIERRA SOLO · VIERNES Y SÁBADO 0:30". Esta página es
     * pública, así que la versión en línea NO publica qué días y a qué hora
     * alguien cierra solo con el efectivo del día: eso le dice a cualquiera
     * cuándo encontrar a una persona sola saliendo del local. Las
     * precauciones sí se quedan. Para la versión interna, con acceso
     * protegido, se puede devolver el dato al título.
     */
    titulo: 'Si se cierra solo',
    texto:
      'El efectivo se queda en la caja fuerte · avisar al grupo al salir y al llegar a casa · transporte por app o alguien que pase, sin esperar en la calle.',
    despuesDe: 3,
  },
};

export const TURNOS: Turno[] = [APERTURA, CIERRE];

/* ─────────────────────────────────────────────────────────────
   TAREAS PERIÓDICAS (sección 08 del PDF)
   ───────────────────────────────────────────────────────────── */

export const PERIODICAS = [
  {
    frecuencia: 'Semanal',
    tareas: [
      'Vaporizador en remojo con limpiador de leche',
      'Limpieza de molinos con pastillas',
      'Desinfectar la hielera',
      'Desmontar y lavar bombas de jarabe',
      'Limpieza profunda de refrigeradores',
    ],
  },
  {
    frecuencia: 'Mensual',
    tareas: [
      'Inventario completo',
      'Revisar el filtro de agua según los litros que marca el fabricante',
    ],
  },
  {
    frecuencia: 'Cada 6 a 12 meses',
    tareas: [
      'Cambiar empaques y regaderas de los grupos',
      'Servicio técnico de la máquina',
    ],
  },
  {
    frecuencia: 'Continuo',
    tareas: [
      'Control de plagas con empresa con licencia; la NOM-251 exige un plan y sus registros',
    ],
  },
] as const;

/* ─────────────────────────────────────────────────────────────
   TÉCNICO
   ───────────────────────────────────────────────────────────── */

/** Ruta pública. Se usa en la etiqueta canónica. */
export const URL_CHECKLIST = 'https://antemano.com.mx/ryocafe/checklist';

/**
 * Versión del formato guardado en el teléfono. Si cambian las tareas de forma
 * que el progreso guardado ya no corresponda, súbela: el progreso viejo se
 * ignora en vez de marcar casillas equivocadas.
 */
export const VERSION_DATOS = 1;
