/**
 * Contenido de la maqueta: biblioteca de recetas y capacitación.
 *
 * Las recetas siguen el menú real de Ryo; la capacitación es contenido de
 * ejemplo escrito con criterio de barra. En el sistema lo edita el admin.
 */

/* ═══ BIBLIOTECA DE RECETAS ═══════════════════════════════ */

export type Receta = {
  id: string;
  nombre: string;
  /** Los tres grupos del menú de Ryo. */
  categoria: 'Clásicos' | 'Especiales' | 'Matchas';
  vaso: string;
  temperatura: string;
  tiempo: string;
  gramos: [string, string][];
  pasos: string[];
  estandar: string;
  /** Las que también se sirven en frío (flecha en el menú). */
  frio?: { vaso: string; gramos?: [string, string][]; pasos: string[] };
  /** Receta de la casa todavía sin cantidades definidas. */
  porConfirmar?: boolean;
  /** Tutorial guiado, paso por paso, con el porqué de cada uno. */
  tutorial?: Tutorial;
};

/** Un paso del tutorial: qué hacer, por qué, y cómo saber que quedó. */
export type PasoGuia = { titulo: string; que: string; porque: string; senal: string };

export type Tutorial = {
  intro: string;
  utensilios: [string, string][];
  pasos: PasoGuia[];
  /** Cómo se ve, huele y sabe cuando está bien hecho. */
  bien: string[];
  /** Lo que sale mal → qué lo causa y cómo se corrige. */
  fallas: [string, string][];
  /** Cuidado del producto y de los utensilios. */
  cuidado: string[];
};

/*
 * Matcha ceremonial: el de primera cosecha, de hoja cultivada a la sombra y
 * molida en piedra. Es dulce y umami por sí solo; casi todo lo que puede
 * salir mal es de técnica (grumos, agua muy caliente, batido flojo), por eso
 * el tutorial explica el porqué de cada paso. La técnica es la tradicional;
 * los gramos y mililitros son la base de barra de Ryo.
 */
const PASOS_MATCHA: PasoGuia[] = [
  {
    titulo: 'Entibia el tazón y remoja el batidor',
    que: 'Llena el tazón con agua caliente y deja las puntas del chasen (el batidor de bambú) dentro unos 30 segundos. Tira el agua y seca el tazón por completo con un paño limpio.',
    porque: 'El bambú seco es quebradizo: remojado se vuelve flexible y no se rompe. El tazón tibio no le roba temperatura al matcha, y seco evita grumos desde el primer momento.',
    senal: 'Las puntas del chasen se abren y se sienten suaves. El tazón está tibio y sin una gota.',
  },
  {
    titulo: 'Pesa 3 g de matcha',
    que: 'Con la cuchara seca, pesa 3 g en la báscula. Cierra la lata de inmediato.',
    porque: 'El matcha ceremonial se oxida con el aire, la luz y la humedad: cada segundo abierto pierde color y dulzor. Pesar en lugar de calcular a ojo hace que todas las tazas sepan igual.',
    senal: 'La báscula marca 3.0 g y la lata ya está cerrada.',
  },
  {
    titulo: 'Tamiza sobre el tazón',
    que: 'Pasa el matcha por el colador fino directo al tazón, empujando suave con la cuchara. Sin prisa y sin golpear.',
    porque: 'El polvo es tan fino que se apelmaza por estática. Un grumo que entra al agua ya no se deshace batiendo: queda como una bolita amarga en el fondo del vaso.',
    senal: 'Queda un polvo parejo y esponjoso, verde brillante, sin bolitas.',
  },
  {
    titulo: 'Agrega un chorrito de agua y haz una pasta',
    que: 'Vierte solo unos 15 ml del agua a 75 °C y mezcla despacio con el chasen hasta tener una pasta lisa y brillante.',
    porque: 'Con poca agua el batidor alcanza todo el polvo y lo moja parejo. Si echas toda el agua de golpe, el polvo flota y se forman grumos.',
    senal: 'Pasta lisa y brillante, como pintura espesa. Nada de polvo seco en las orillas.',
  },
  {
    titulo: 'Completa el agua a 75 °C',
    que: 'Agrega el resto del agua hasta 60 ml en total. Mide la temperatura: 75 °C, nunca más de 80 °C.',
    porque: 'El agua hirviendo quema el matcha: saca el amargor y tapa lo dulce y umami, que es justo por lo que se paga un ceremonial. Más fría de 70 °C no se integra bien ni hace espuma.',
    senal: 'El termómetro marca entre 70 y 80 °C antes de verter.',
  },
  {
    titulo: 'Bate en zigzag, rápido y desde la muñeca',
    que: 'Sostén el tazón con una mano. Con la otra, mueve el chasen de adelante hacia atrás dibujando una M o una W, rápido, durante 15 a 20 segundos. Las puntas rozan el líquido: no las aplastes contra el fondo.',
    porque: 'El zigzag mete aire y forma la espuma fina; en círculos solo se revuelve y no espuma. Apretar contra el fondo dobla y rompe las puntas del chasen.',
    senal: 'Espuma fina y pareja en toda la superficie, sin burbujas grandes. Se oye un siseo suave.',
  },
  {
    titulo: 'Rompe las burbujas grandes y levanta al centro',
    que: 'Baja la velocidad, pasa las puntas solo por la superficie para reventar las burbujas grandes y saca el chasen por el centro, despacio.',
    porque: 'Las burbujas grandes se revientan solas y dejan huecos. Sacar por el centro deja un pequeño montículo de espuma, la señal de un matcha bien batido.',
    senal: 'Superficie verde jade, cremosa, con microespuma y un leve montículo al centro.',
  },
];

const BIEN_MATCHA = [
  'Color verde jade intenso y brillante. Si se ve verde olivo o amarillento, el matcha está oxidado.',
  'Espuma fina y pareja, sin burbujas grandes.',
  'Huele fresco, a hierba dulce y un poco a nuez.',
  'Sabe dulce y umami, con un amargor ligero y limpio al final. Nunca áspero ni a pasto quemado.',
  'Al terminar el vaso no queda polvo ni grumos en el fondo.',
];

const FALLAS_MATCHA: [string, string][] = [
  ['Quedan grumos', 'No se tamizó o el tazón estaba húmedo. Tamiza siempre y seca el tazón antes de poner el polvo.'],
  ['Sabe amargo o áspero', 'El agua estaba muy caliente. Mide: 75 °C, nunca más de 80 °C. Si el agua acaba de hervir, déjala reposar o pásala a otra jarra para que baje.'],
  ['No hace espuma', 'Se batió en círculos, muy lento, o con el chasen seco. Zigzag rápido desde la muñeca, 15 a 20 segundos.'],
  ['Espuma con burbujas grandes', 'Faltó el último paso: pasar las puntas por la superficie y sacar despacio por el centro.'],
  ['Color apagado u olivo', 'El matcha se oxidó: lata abierta, con luz, calor o humedad. Avisa al encargado; ese matcha ya no es para servirse solo.'],
  ['Sabe aguado', 'Se pasó de agua o faltó matcha. Pesa los 3 g y mide los 60 ml.'],
];

const CUIDADO_MATCHA = [
  'La lata se cierra en cuanto sacas el matcha y se guarda en frío, lejos de la luz y de olores fuertes. Al sacarla del refri, espera a que tome temperatura antes de abrirla: si se abre fría, se condensa humedad adentro.',
  'Anota la fecha al abrir una lata. Abierto, el matcha ceremonial da lo mejor en las primeras semanas.',
  'La cuchara entra siempre seca. Una gota de agua en la lata echa a perder el resto.',
  'El chasen se enjuaga solo con agua tibia, sin jabón, y se seca al aire en su soporte con las puntas hacia abajo. Guardado húmedo en un cajón se llena de moho.',
  'El colador se sacude y se seca después de cada uso: el polvo húmedo tapa la malla.',
];

const UTENSILIOS_MATCHA: [string, string][] = [
  ['Chasen', 'Batidor de bambú'],
  ['Tazón', 'Ancho, para poder batir'],
  ['Colador fino', 'Para tamizar'],
  ['Báscula', 'De 0.1 g'],
  ['Termómetro', 'Para el agua'],
  ['Paño limpio', 'Solo para el tazón'],
];


/*
 * El menú de Ryo (nota de la barra, 29-sep-2026). De la nota salen: los tres
 * grupos, qué va también en frío, 150 ml de leche en el latte, 120 ml en el
 * matcha latte y el foam del miso caramel latte. Lo demás es una base de
 * barra para ajustar; los especiales de la casa quedan por confirmar.
 */
const DOBLE = ['Espresso', '18 g → 36 g · Doble casa'] as [string, string];

export const RECETAS: Receta[] = [
  /* ── Clásicos ── */
  {
    id: 'espresso', nombre: 'Espresso', categoria: 'Clásicos', vaso: 'Taza de espresso', temperatura: 'PID 93.5 °C', tiempo: '26–30 s',
    gramos: [['Dosis', '18.0 g'], ['Rendimiento', '36.0 g'], ['Ratio', '1:2'], ['Botón', 'Doble casa']],
    pasos: [
      'Purga el grupo 2 segundos.', 'Muele 18.0 g y distribuye parejo.', 'Tampea nivelado, sin girar.',
      'Engancha, báscula en cero y presiona Doble casa: la Linea corta sola.', 'Revisa la báscula (36 g) y el tiempo en la botonera (26–30 s).', 'Sirve de inmediato.',
    ],
    estandar: 'Crema avellana y continua. Dulce, con acidez limpia. Si sale ácido o amargo, revisa la receta del día antes de servir.',
  },
  {
    id: 'cortado', nombre: 'Cortado', categoria: 'Clásicos', vaso: 'Vaso 4.5 oz', temperatura: 'Leche a 55–60 °C', tiempo: '2 min',
    gramos: [DOBLE, ['Leche', '60 ml']],
    pasos: ['Extrae el espresso en el vaso.', 'Texturiza poca leche, casi sin aire.', 'Vierte despacio, pegado a la superficie.'],
    estandar: 'Mitad espresso, mitad leche. Capa fina de espuma, menos de medio centímetro.',
  },
  {
    id: 'flat-white', nombre: 'Flat white', categoria: 'Clásicos', vaso: 'Taza 6 oz', temperatura: 'Leche a 60–65 °C', tiempo: '2 min',
    gramos: [DOBLE, ['Leche', '110 ml']],
    pasos: ['Extrae el espresso en la taza.', 'Aire solo al inicio, 2 segundos. Luego integra.', 'Vierte alto al inicio y baja para dibujar.', 'Arte simple: corazón o tulipán.'],
    estandar: 'Microespuma brillante, sin burbujas visibles. Superficie plana, capa de espuma de 0.5 cm.',
    frio: {
      vaso: 'Vaso 12 oz con hielo',
      gramos: [DOBLE, ['Leche fría', '110 ml'], ['Hielo', 'al borde']],
      pasos: ['Llena el vaso de hielo.', 'Sirve la leche fría.', 'Extrae el espresso y viértelo encima, despacio.'],
    },
  },
  {
    id: 'cappuccino', nombre: 'Cappuccino', categoria: 'Clásicos', vaso: 'Taza 8 oz', temperatura: 'Leche a 60–65 °C', tiempo: '2 min',
    gramos: [DOBLE, ['Leche', '120 ml']],
    pasos: ['Extrae el espresso en la taza.', 'Aire 4–5 segundos: más espuma que un latte.', 'Vierte y termina con la espuma.'],
    estandar: 'Espuma de 1.5 cm, sedosa. Canela solo si el cliente la pide.',
  },
  {
    id: 'latte', nombre: 'Latte', categoria: 'Clásicos', vaso: 'Vaso 12 oz', temperatura: 'Leche a 60–65 °C', tiempo: '2 min',
    gramos: [DOBLE, ['Leche', '150 ml']],
    pasos: ['Extrae el espresso en el vaso.', 'Texturiza 150 ml de leche, aire 2–3 segundos.', 'Vierte y dibuja al final.'],
    estandar: 'Espuma de 0.5–1 cm. La leche nunca pasa de 65 °C: se quema y pierde dulzor.',
    frio: {
      vaso: 'Vaso 12 oz con hielo',
      gramos: [DOBLE, ['Leche fría', '150 ml'], ['Hielo', 'al borde']],
      pasos: ['Llena el vaso de hielo.', 'Sirve 150 ml de leche fría.', 'Extrae el espresso y viértelo encima para marcar la capa.'],
    },
  },
  {
    id: 'americano', nombre: 'Americano', categoria: 'Clásicos', vaso: 'Vaso 12 oz', temperatura: 'Agua a 85 °C', tiempo: '1 min',
    gramos: [DOBLE, ['Agua caliente', '150 ml']],
    pasos: ['Extrae el espresso en el vaso.', 'Completa con el agua caliente.', 'Sirve sin revolver.'],
    estandar: 'Largo y limpio. Si lo quieren más suave, se agrega agua; nunca se hace un shot más largo.',
    frio: {
      vaso: 'Vaso 12 oz con hielo',
      gramos: [DOBLE, ['Agua fría', '150 ml'], ['Hielo', 'al borde']],
      pasos: ['Llena el vaso de hielo.', 'Sirve el agua fría.', 'Extrae el espresso y viértelo encima.'],
    },
  },
  {
    id: 'long-black', nombre: 'Long black', categoria: 'Clásicos', vaso: 'Taza 6 oz', temperatura: 'Agua a 85 °C', tiempo: '1 min',
    gramos: [['Agua caliente', '100 ml'], DOBLE],
    pasos: ['Sirve primero el agua caliente.', 'Extrae el espresso directo sobre el agua.', 'No revuelvas: la crema queda arriba.'],
    estandar: 'Más corto e intenso que el americano, con la crema intacta en la superficie. El agua va primero.',
  },
  {
    id: 'moka', nombre: 'Moka', categoria: 'Clásicos', vaso: 'Vaso 12 oz', temperatura: 'Leche a 60–65 °C', tiempo: '2 min',
    gramos: [DOBLE, ['Chocolate', '20 g'], ['Leche', '150 ml']],
    pasos: ['Pon el chocolate en el vaso.', 'Extrae el espresso encima y mezcla hasta integrar.', 'Texturiza la leche y vierte.'],
    estandar: 'Sin chocolate asentado en el fondo: se integra con el espresso antes de la leche.',
    frio: {
      vaso: 'Vaso 12 oz con hielo',
      gramos: [DOBLE, ['Chocolate', '20 g'], ['Leche fría', '150 ml'], ['Hielo', 'al borde']],
      pasos: ['Integra el chocolate con el espresso en la jarra.', 'Llena el vaso de hielo y sirve la leche fría.', 'Vierte el espresso con chocolate encima.'],
    },
  },

  /* ── Especiales ── */
  {
    id: 'miso-caramel-latte', nombre: 'Miso caramel latte', categoria: 'Especiales', vaso: 'Vaso 12 oz', temperatura: 'Leche a 60–65 °C', tiempo: '3 min',
    gramos: [DOBLE, ['Caramelo de miso', 'por confirmar'], ['Leche', '150 ml'], ['Foam', 'por confirmar']],
    pasos: ['Pon el caramelo de miso en el vaso.', 'Extrae el espresso encima e integra.', 'Vierte la leche.', 'Corona con el foam.'],
    estandar: 'El foam va al final y se sirve de inmediato, antes de que baje.',
    porConfirmar: true,
  },
  {
    id: 'maple-salt-latte', nombre: 'Maple salt latte', categoria: 'Especiales', vaso: 'Vaso 12 oz', temperatura: 'Leche a 60–65 °C', tiempo: '2 min',
    gramos: [DOBLE, ['Maple', 'por confirmar'], ['Sal', 'por confirmar'], ['Leche', '150 ml']],
    pasos: ['Integra el maple con el espresso en el vaso.', 'Vierte la leche texturizada.', 'Termina con la sal.'],
    estandar: 'Dulce con un final salado: la sal se nota, no domina.',
    porConfirmar: true,
  },
  {
    id: 'cortadito', nombre: 'Cortadito', categoria: 'Especiales', vaso: 'Vaso 4.5 oz', temperatura: 'Leche a 55–60 °C', tiempo: '2 min',
    gramos: [DOBLE, ['Azúcar', 'por confirmar'], ['Leche', '60 ml']],
    pasos: ['Bate el azúcar con las primeras gotas del espresso hasta hacer una espumita.', 'Termina de extraer encima.', 'Vierte la leche despacio.'],
    estandar: 'Espumita de azúcar visible arriba. Dulce desde el primer sorbo.',
    porConfirmar: true,
  },
  {
    id: 'ryo-latte', nombre: 'Ryo latte', categoria: 'Especiales', vaso: 'Vaso 12 oz', temperatura: 'Leche a 60–65 °C', tiempo: '2 min',
    gramos: [DOBLE, ['Leche', '150 ml'], ['Toque de la casa', 'por definir']],
    pasos: ['Receta de la casa por definir con la barra.'],
    estandar: 'La bebida firma de Ryo: se define en barra y se registra aquí.',
    porConfirmar: true,
  },

  /* ── Matchas ── */
  {
    id: 'matcha-latte', nombre: 'Matcha latte', categoria: 'Matchas', vaso: 'Vaso 12 oz', temperatura: 'Agua a 75 °C', tiempo: '2 min',
    gramos: [['Matcha ceremonial', '3 g'], ['Agua', '60 ml'], ['Leche', '120 ml']],
    pasos: ['Tamiza el matcha en el tazón.', 'Agrega el agua a 75 °C.', 'Bate en zigzag hasta que no queden grumos.', 'Texturiza 120 ml de leche y vierte el matcha encima.'],
    estandar: 'Sin grumos. El agua hirviendo amarga el matcha: nunca más de 80 °C.',
    tutorial: {
      intro: 'Usamos matcha ceremonial de la más alta calidad: es dulce y umami por sí solo. Bien preparado no necesita nada para saber bien; mal preparado, se desperdicia. Sigue los pasos en orden.',
      utensilios: [...UTENSILIOS_MATCHA, ['Jarra y vaporizador', 'Para la leche']],
      pasos: [
        ...PASOS_MATCHA,
        {
          titulo: 'Texturiza 120 ml de leche',
          que: 'Purga el vaporizador. Texturiza 120 ml de leche con poca espuma, sedosa, y detén entre 55 y 60 °C. Limpia y purga el vaporizador.',
          porque: 'La leche muy caliente tapa el sabor del matcha y lo amarga. Poca espuma y fina deja que el verde se vea y se sienta.',
          senal: 'Leche brillante, como pintura, sin burbujas. La jarra se puede sostener sin quemarse.',
        },
        {
          titulo: 'Sirve la leche y el matcha encima',
          que: 'Vierte la leche en el vaso de 12 oz y enseguida el matcha batido encima, despacio y por el centro.',
          porque: 'El matcha se sirve recién batido: si espera, el polvo se asienta y la espuma se cae. Encima de la leche se ve el verde y se integra solo.',
          senal: 'Vaso con un verde parejo y cremoso, sin puntos oscuros. Sale a la barra de inmediato.',
        },
      ],
      bien: BIEN_MATCHA,
      fallas: [...FALLAS_MATCHA, ['La leche tapa el matcha', 'La leche salió muy caliente o con demasiada espuma. Detén entre 55 y 60 °C y mete poco aire.']],
      cuidado: CUIDADO_MATCHA,
    },
  },
  {
    id: 'ryo-matcha', nombre: 'Ryo matcha', categoria: 'Matchas', vaso: 'Vaso 12 oz', temperatura: 'Agua a 75 °C', tiempo: '2 min',
    gramos: [['Matcha ceremonial', '3 g'], ['Agua', '60 ml'], ['Toque de la casa', 'por definir']],
    pasos: ['Receta de la casa por definir con la barra.'],
    estandar: 'La matcha firma de Ryo: se define en barra y se registra aquí.',
    porConfirmar: true,
    tutorial: {
      intro: 'La base es la misma de todo nuestro matcha ceremonial: estos pasos no cambian. El toque de la casa se agrega al final y está por definirse con la barra.',
      utensilios: UTENSILIOS_MATCHA,
      pasos: PASOS_MATCHA,
      bien: BIEN_MATCHA,
      fallas: FALLAS_MATCHA,
      cuidado: CUIDADO_MATCHA,
    },
  },
  {
    id: 'hojicha', nombre: 'Hojicha', categoria: 'Matchas', vaso: 'Vaso 12 oz', temperatura: 'Agua a 85 °C', tiempo: '2 min',
    gramos: [['Hojicha', 'por confirmar'], ['Agua', '60 ml'], ['Leche', '120 ml']],
    pasos: ['Tamiza la hojicha en el tazón.', 'Agrega el agua a 85 °C y bate hasta integrar.', 'Texturiza la leche y vierte la hojicha encima.'],
    estandar: 'Tostado y suave, sin amargor. Aguanta agua más caliente que el matcha.',
    porConfirmar: true,
  },
];

export const receta = (id: string) => RECETAS.find((r) => r.id === id);

/* ═══ CAPACITACIÓN ════════════════════════════════════════ */

export type Bloque =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'clave'; texto: string }
  | { tipo: 'ficha'; filas: [string, string][] }
  | { tipo: 'receta'; recetaId: string }
  | { tipo: 'video'; titulo: string; duracion: string };

export type Pregunta = { id: string; pregunta: string; respuesta: string };

export type Leccion = {
  id: string;
  moduloId: string;
  titulo: string;
  minutos: number;
  bloques: Bloque[];
  /** Práctica de recuperación: se contestan de memoria antes de ver la respuesta. */
  preguntas: Pregunta[];
};

export type Modulo = { id: string; nivel: 1 | 2 | 3; titulo: string };

export const NIVELES = [
  { nivel: 1, nombre: 'Barista 1', meta: 'Opera la barra con la receta de la casa' },
  { nivel: 2, nombre: 'Barista 2', meta: 'Calibra solo y entiende la extracción' },
  { nivel: 3, nombre: 'Barista 3', meta: 'Perfila cafés nuevos y enseña a otros' },
] as const;

export const MODULOS: Modulo[] = [
  { id: 'm-espresso', nivel: 1, titulo: 'Espresso de la casa' },
  { id: 'm-leche', nivel: 1, titulo: 'Leche' },
  { id: 'm-higiene', nivel: 1, titulo: 'Higiene y seguridad' },
  { id: 'm-matcha', nivel: 1, titulo: 'Matcha ceremonial' },
  { id: 'm-calibracion', nivel: 2, titulo: 'Calibración' },
  { id: 'm-perfilar', nivel: 3, titulo: 'Perfilar y enseñar' },
];

export const LECCIONES: Leccion[] = [
  {
    id: 'l-matcha-que', moduloId: 'm-matcha', titulo: 'Qué es el matcha ceremonial', minutos: 4,
    bloques: [
      { tipo: 'texto', texto: 'El matcha es hoja de té verde molida en piedra hasta volverse polvo. No se infusiona y se tira: te tomas la hoja entera. Por eso la calidad de la hoja se nota tanto.' },
      { tipo: 'texto', texto: 'El ceremonial es el grado más alto: hoja de la primera cosecha, cultivada a la sombra las últimas semanas. La sombra hace que la planta guarde más clorofila y aminoácidos: de ahí el verde intenso y el sabor dulce y umami.' },
      { tipo: 'ficha', filas: [['Color', 'Verde jade, brillante'], ['Aroma', 'Fresco, hierba dulce, nuez'], ['Sabor', 'Dulce y umami, amargor ligero'], ['Textura', 'Polvo finísimo, como talco']] },
      { tipo: 'clave', texto: 'En Ryo usamos ceremonial de la más alta calidad. Se trata como el mejor café de la barra: se pesa, se mide el agua y se sirve recién hecho.' },
      { tipo: 'texto', texto: 'Sus enemigos son cuatro: aire, luz, calor y humedad. Un matcha oxidado se ve verde olivo, huele a heno y sabe amargo.' },
    ],
    preguntas: [
      { id: 'q-matcha-1', pregunta: '¿Qué hace diferente al matcha ceremonial?', respuesta: 'Es de la primera cosecha, de hoja cultivada a la sombra y molida en piedra: verde intenso, dulce y umami.' },
      { id: 'q-matcha-2', pregunta: '¿Cuáles son los cuatro enemigos del matcha?', respuesta: 'Aire, luz, calor y humedad.' },
      { id: 'q-matcha-3', pregunta: '¿Cómo se ve un matcha oxidado?', respuesta: 'Verde olivo o amarillento, apagado. Ya no se sirve solo: se avisa al encargado.' },
    ],
  },
  {
    id: 'l-matcha-como', moduloId: 'm-matcha', titulo: 'Preparar matcha: tamizar, agua y batido', minutos: 6,
    bloques: [
      { tipo: 'texto', texto: 'Son tres cosas las que deciden la taza: tamizar, la temperatura del agua y el batido. Si una falla, se nota.' },
      { tipo: 'ficha', filas: [['Matcha', '3 g, tamizado'], ['Agua', '60 ml a 75 °C'], ['Batido', 'Zigzag, 15 a 20 s'], ['Leche (latte)', '120 ml a 55–60 °C']] },
      { tipo: 'clave', texto: 'Nunca agua hirviendo: arriba de 80 °C el matcha se amarga y pierde lo dulce.' },
      { tipo: 'texto', texto: 'Primero una pasta con un chorrito de agua; luego el resto del agua. Se bate rápido en M o W, desde la muñeca, sin aplastar las puntas del chasen contra el fondo. Al final se pasan las puntas por la superficie y se saca por el centro.' },
      { tipo: 'receta', recetaId: 'matcha-latte' },
    ],
    preguntas: [
      { id: 'q-matcha-4', pregunta: '¿A qué temperatura va el agua del matcha?', respuesta: 'A 75 °C. Nunca más de 80 °C.' },
      { id: 'q-matcha-5', pregunta: '¿Por qué se tamiza el matcha?', respuesta: 'Porque se apelmaza por estática, y un grumo que entra al agua ya no se deshace batiendo.' },
      { id: 'q-matcha-6', pregunta: '¿Cómo se mueve el chasen?', respuesta: 'En zigzag (M o W), rápido y desde la muñeca, 15 a 20 segundos, sin aplastar las puntas contra el fondo.' },
      { id: 'q-matcha-7', pregunta: '¿Por qué se hace primero una pasta con poca agua?', respuesta: 'Para mojar todo el polvo parejo. Con toda el agua de golpe, el polvo flota y se hacen grumos.' },
    ],
  },
  {
    id: 'l-matcha-cuidado', moduloId: 'm-matcha', titulo: 'Cuidar el matcha y el chasen', minutos: 3,
    bloques: [
      { tipo: 'texto', texto: 'La lata se cierra en cuanto sacas el matcha. Se guarda en frío, lejos de la luz y de olores. Al sacarla del refri, espera a que tome temperatura antes de abrirla: si se abre fría, se condensa humedad adentro.' },
      { tipo: 'clave', texto: 'La cuchara entra seca. Una gota de agua en la lata echa a perder el resto.' },
      { tipo: 'texto', texto: 'El chasen se remoja antes de usarlo para que el bambú no se rompa. Después se enjuaga solo con agua tibia, sin jabón, y se seca al aire en su soporte.' },
    ],
    preguntas: [
      { id: 'q-matcha-8', pregunta: '¿Cómo se lava el chasen?', respuesta: 'Solo con agua tibia, sin jabón, y se seca al aire en su soporte.' },
      { id: 'q-matcha-9', pregunta: '¿Qué haces con la lata al sacarla del refri?', respuesta: 'Esperar a que tome temperatura antes de abrirla, para que no se condense humedad adentro.' },
    ],
  },
  {
    id: 'l-receta', moduloId: 'm-espresso', titulo: 'La receta: dosis, rendimiento, tiempo', minutos: 4,
    bloques: [
      { tipo: 'texto', texto: 'Un espresso se describe con tres números: cuánto café entra (dosis), cuánta bebida sale (rendimiento) y cuánto tarda (tiempo). Con esos tres, cualquier barista hace el mismo shot en cualquier turno.' },
      { tipo: 'ficha', filas: [['Dosis', '18.0 g'], ['Rendimiento', '36.0 g'], ['Tiempo', '26–30 s'], ['Temperatura', '93.5 °C, la fija el PID'], ['Ratio', '1:2']] },
      { tipo: 'clave', texto: 'Se pesa la bebida, no se mide en onzas: la crema ocupa volumen y engaña al ojo.' },
      { tipo: 'video', titulo: 'Pesar dosis y rendimiento en la báscula', duracion: '1:40' },
    ],
    preguntas: [
      { id: 'q-receta-1', pregunta: '¿Cuál es la receta base del espresso de la casa?', respuesta: '18 g de café → 36 g de bebida, en 26 a 30 segundos. Ratio 1:2.' },
      { id: 'q-receta-2', pregunta: '¿Por qué se pesa la bebida en lugar de medirla en volumen?', respuesta: 'Porque la crema ocupa volumen y cambia de un shot a otro. El peso no miente.' },
    ],
  },
  {
    id: 'l-ratio', moduloId: 'm-espresso', titulo: 'Ratio: la proporción que define la taza', minutos: 3,
    bloques: [
      { tipo: 'texto', texto: 'El ratio es rendimiento ÷ dosis. 18 g → 36 g es 1:2. Un ratio más corto (1:1.5) concentra; uno más largo (1:2.5) abre la taza y la aligera.' },
      { tipo: 'clave', texto: 'La app calcula el ratio sola y marca la ventana de tolerancia: ±5 % del objetivo.' },
    ],
    preguntas: [
      { id: 'q-ratio-1', pregunta: 'Sacas 40 g de bebida con 18 g de café. ¿Cuál es el ratio?', respuesta: '1:2.22 (40 ÷ 18).' },
      { id: 'q-ratio-2', pregunta: '¿Qué le pasa a la taza si acortas el ratio?', respuesta: 'Sale más concentrada e intensa.' },
    ],
  },
  {
    id: 'l-leer', moduloId: 'm-espresso', titulo: 'Leer un shot: ácido o amargo', minutos: 5,
    bloques: [
      { tipo: 'texto', texto: 'Ácido, salado o delgado: subextraído, le faltó extracción. Amargo, seco o astringente: sobreextraído, se extrajo de más. El punto está en medio: dulce, con cuerpo y un final limpio.' },
      { tipo: 'clave', texto: 'Ácido → más fino. Amargo → más grueso. No muevas nada por tu cuenta además de lo que pide la app.' },
      { tipo: 'texto', texto: 'A veces la app pide dos cosas juntas, molienda y pulsos. No rompe la regla: moler más fino le quita peso a la taza, y los pulsos se lo devuelven. Es un solo ajuste, y la app dice qué tiempo y qué peso espera para que compruebes si acertó.' },
      { tipo: 'texto', texto: 'La brújula de sabor de la app tiene esos dos ejes: de ácido a amargo, y de débil a intenso. Toca dónde cae tu shot y te sugiere el siguiente ajuste.' },
    ],
    preguntas: [
      { id: 'q-leer-1', pregunta: 'El shot corre en 22 s y sabe ácido. ¿Qué ajustas primero?', respuesta: 'Molienda más fina.' },
      { id: 'q-leer-2', pregunta: '¿Qué significa que un shot sepa seco o astringente?', respuesta: 'Que está sobreextraído.' },
      { id: 'q-leer-3', pregunta: '¿Cuántas variables se cambian entre un shot y el siguiente?', respuesta: 'Solo lo que pide la app: una, o molienda y pulsos juntos cuando uno compensa al otro.' },
    ],
  },
  {
    id: 'l-texturizar', moduloId: 'm-leche', titulo: 'Texturizar para flat white', minutos: 5,
    bloques: [
      { tipo: 'texto', texto: 'Purga el vaporizador. Mete aire solo al inicio, 2 a 3 segundos, hasta que la leche gane un 10 % de volumen. Luego hunde un poco la punta y deja que el remolino integre la espuma.' },
      { tipo: 'texto', texto: 'Detén a 60–65 °C: es cuando ya no puedes sostener la jarra más de un segundo. Más caliente, la leche se quema y pierde dulzor.' },
      { tipo: 'receta', recetaId: 'flat-white' },
    ],
    preguntas: [
      { id: 'q-tex-1', pregunta: '¿A qué temperatura se detiene la leche?', respuesta: '60 a 65 °C.' },
      { id: 'q-tex-2', pregunta: '¿En qué momento se mete aire al texturizar?', respuesta: 'Solo al inicio, 2 a 3 segundos.' },
    ],
  },
  {
    id: 'l-vaporizador', moduloId: 'm-leche', titulo: 'Limpieza del vaporizador', minutos: 3,
    bloques: [
      { tipo: 'texto', texto: 'Purga antes y después de cada uso. Limpia la punta de inmediato con el trapo exclusivo para leche: la leche seca tapa los orificios y contamina.' },
      { tipo: 'clave', texto: 'El trapo de la leche no se usa para nada más.' },
    ],
    preguntas: [
      { id: 'q-vap-1', pregunta: '¿Cuándo se purga el vaporizador?', respuesta: 'Antes y después de cada uso.' },
    ],
  },
  {
    id: 'l-criticas', moduloId: 'm-higiene', titulo: 'Las tareas críticas del checklist', minutos: 4,
    bloques: [
      { tipo: 'texto', texto: 'En el checklist, las tareas en letra recta son críticas: tienen que ver con seguridad, inocuidad o dinero. No se saltan, y el turno no se cierra si falta una.' },
      { tipo: 'clave', texto: 'Cada tarea lleva iniciales y hora. Sin firma, la tarea cuenta como no hecha.' },
    ],
    preguntas: [
      { id: 'q-crit-1', pregunta: '¿Qué hace que una tarea sea crítica?', respuesta: 'Que tiene que ver con seguridad, inocuidad o dinero.' },
      { id: 'q-crit-2', pregunta: '¿Qué pasa con una tarea que no lleva firma?', respuesta: 'Cuenta como no hecha.' },
    ],
  },
  {
    id: 'l-temperaturas', moduloId: 'm-higiene', titulo: 'Temperaturas de refrigeración', minutos: 3,
    bloques: [
      { tipo: 'texto', texto: 'La refrigeración va a máximo 7 °C (NOM-251, apartado 5.5.2) y el congelador debe mantener el producto congelado. Se revisa al checar el stock del refri en la apertura.' },
      { tipo: 'clave', texto: 'Si una lectura sale del límite: aislar el producto, anotar la acción y avisar al grupo.' },
    ],
    preguntas: [
      { id: 'q-temp-1', pregunta: '¿Cuál es la temperatura máxima de refrigeración?', respuesta: '7 °C (NOM-251).' },
      { id: 'q-temp-2', pregunta: 'Una lectura sale del límite. ¿Qué tres cosas haces?', respuesta: 'Aislar el producto, anotar la acción y avisar al grupo.' },
    ],
  },
  {
    id: 'l-calibrar', moduloId: 'm-calibracion', titulo: 'Calibrar con método', minutos: 6,
    bloques: [
      { tipo: 'texto', texto: 'Fija la dosis. Iguala el rendimiento a la receta: con botón, reprogramándolo; con continuo, cortando en la báscula. Con la receta igualada, mueve la molienda un paso y prueba. Anota cada shot: la gráfica de la sesión muestra si vas convergiendo hacia la zona objetivo.' },
      { tipo: 'clave', texto: 'Dosis fija → rendimiento → molienda. Si mueves dos cosas a la vez, no sabes cuál cambió el sabor.' },
    ],
    preguntas: [
      { id: 'q-cal-1', pregunta: '¿En qué orden se ajustan las variables al calibrar?', respuesta: 'Dosis fija, luego rendimiento, luego molienda.' },
      { id: 'q-cal-2', pregunta: '¿Por qué se cambia una sola variable a la vez?', respuesta: 'Para saber qué causó el cambio en el sabor.' },
    ],
  },
  {
    id: 'l-linea', moduloId: 'm-calibracion', titulo: 'Calibrar en la Linea: botones volumétricos', minutos: 6,
    bloques: [
      { tipo: 'texto', texto: 'La Linea Classic AV es volumétrica: corta el shot sola. Dentro lleva un flujómetro, una ruedita con imanes que gira con el agua que entra al grupo. Cada giro es un pulso, y cada botón tiene programado un número de pulsos: al llegar, cierra.' },
      { tipo: 'texto', texto: 'Los pulsos cuentan el agua que entra, no la bebida que cae en la taza. Una parte del agua se queda en el café. Por eso, con los mismos pulsos, el peso cambia si cambias la molienda o la dosis: más fino o más café retienen más agua y cae un poco menos.' },
      { tipo: 'ficha', filas: [['Botones', '4 dosis, en pulsos'], ['Continuo', 'Cortas tú en la báscula'], ['Tiempo', 'Lo marca la botonera'], ['Temperatura', 'Un PID para todos los cafés']] },
      { tipo: 'clave', texto: 'Molienda para el tiempo, pulsos para el peso. Si el tiempo ya está y el peso no, se cambian los pulsos del botón.' },
      { tipo: 'texto', texto: 'La canastilla manda en la dosis: cada una tiene su capacidad y la dosis debe quedar a 1 g de ella. De más, el café toca la regadera y el agua no se reparte; de menos, la pastilla queda aguada y el agua se abre camino. Si cambias de canastilla, se recalibra: otra dosis retiene otra cantidad de agua y los pulsos ya no dan el mismo peso.' },
      { tipo: 'texto', texto: 'La app te dice a cuántos pulsos pasar: sabe cuántos gramos mueve un pulso en nuestra máquina porque lo aprende de los shots. Después de cambiar pulsos, siempre se tira un shot y se pesa.' },
      { tipo: 'texto', texto: 'Si con los mismos pulsos el peso empieza a variar de un shot a otro sin que nadie mueva nada, avisa al encargado: puede ser la distribución o el flujómetro.' },
      { tipo: 'video', titulo: 'Programar una dosis en la botonera', duracion: '2:10' },
    ],
    preguntas: [
      { id: 'q-av-1', pregunta: 'Con botón volumétrico, ¿con qué corriges el tiempo?', respuesta: 'Con la molienda.' },
      { id: 'q-av-2', pregunta: 'El tiempo está en ventana pero el botón entrega 34 g en lugar de 36. ¿Qué haces?', respuesta: 'Subir los pulsos del botón (la app dice cuántos) y comprobar con un shot en la báscula.' },
      { id: 'q-av-3', pregunta: '¿Qué cuenta un pulso?', respuesta: 'Un giro del flujómetro: agua que entra al grupo. No es bebida en taza, porque parte del agua se queda en el café.' },
      { id: 'q-av-6', pregunta: '¿Cuánto se puede alejar la dosis de la capacidad de la canastilla?', respuesta: '1 g arriba o abajo. Fuera de eso se cambia la dosis o la canastilla, y se recalibra.' },
      { id: 'q-av-5', pregunta: 'Mueles más fino sin tocar los pulsos. ¿Qué le pasa al peso en taza?', respuesta: 'Baja un poco: el café retiene más agua. Por eso siempre se pesa.' },
      { id: 'q-av-4', pregunta: '¿Se puede poner una temperatura distinta para cada café?', respuesta: 'No: el PID de la caldera de café es uno para todos los cafés.' },
    ],
  },
  {
    id: 'l-reposo', moduloId: 'm-calibracion', titulo: 'Reposo del café', minutos: 4,
    bloques: [
      { tipo: 'texto', texto: 'Recién tostado, el café suelta CO₂ y corre irregular. Con los días se asienta, y normalmente hay que moler un poco más fino para mantener la receta.' },
      { tipo: 'clave', texto: 'En Calibrar, cada café muestra sus días de reposo y la tendencia de molienda contra reposo: es la memoria del equipo.' },
    ],
    preguntas: [
      { id: 'q-rep-1', pregunta: '¿Qué suele pasar con la molienda conforme el café reposa?', respuesta: 'Hay que moler un poco más fino.' },
    ],
  },
  {
    id: 'l-perfilar', moduloId: 'm-perfilar', titulo: 'Perfilar un café nuevo', minutos: 7,
    bloques: [
      { tipo: 'texto', texto: 'Arranca con la receta base y el reposo mínimo de 5 días. Explora el ratio de 1:1.8 a 1:2.4 con la misma molienda y quédate con el que muestre más dulzor. Esa es la receta objetivo que se registra en el catálogo.' },
    ],
    preguntas: [
      { id: 'q-perf-1', pregunta: '¿Qué rango de ratio exploras al perfilar un café nuevo?', respuesta: 'De 1:1.8 a 1:2.4.' },
    ],
  },
];

export const leccion = (id: string) => LECCIONES.find((l) => l.id === id);
export const leccionesDe = (moduloId: string) => LECCIONES.filter((l) => l.moduloId === moduloId);
export const preguntaPorId = (id: string) => {
  for (const l of LECCIONES) {
    const p = l.preguntas.find((q) => q.id === id);
    if (p) return { ...p, leccion: l };
  }
  return undefined;
};

/** Evaluación práctica presencial de cada nivel: la firma el encargado. */
export const RUBRICAS: Record<number, string[]> = {
  1: [
    '3 flat whites dentro del estándar: 60–65 °C, microespuma brillante, arte simple',
    'Una apertura completa sin tareas críticas pendientes',
    'Explica la receta del espresso sin ver la ficha',
  ],
  2: [
    'Calibra el espresso de la casa en 5 shots o menos',
    'Reprograma un botón de la Linea y comprueba el peso en la báscula',
    'Prepara un especial del menú dentro de receta',
  ],
  3: [
    'Perfila un café nuevo y propone su receta objetivo',
    'Acompaña a un Barista 1 en su evaluación práctica',
  ],
};

/** Ruta de ingreso: calendario sugerido por semanas. */
export const ONBOARDING = [
  { semana: 1, titulo: 'Conoce la barra', lecciones: ['l-receta', 'l-criticas', 'l-temperaturas'], practica: 'Acompaña dos aperturas y dos cierres' },
  { semana: 2, titulo: 'Espresso', lecciones: ['l-ratio', 'l-leer'], practica: 'Saca 20 shots con la receta de la casa' },
  { semana: 3, titulo: 'Leche', lecciones: ['l-texturizar', 'l-vaporizador'], practica: '10 flat whites con retroalimentación' },
  { semana: 4, titulo: 'Evaluación Barista 1', lecciones: [], practica: 'Evaluación práctica con el encargado' },
];

/* ═══ GLOSARIO ════════════════════════════════════════════ */

/**
 * Las palabras de la barra, dichas para alguien que llega nuevo. Se abren
 * a un toque desde donde aparecen (reconocer en lugar de recordar).
 */
export const GLOSARIO: Record<string, { palabra: string; que: string; ejemplo?: string }> = {
  molienda: { palabra: 'Molienda', que: 'Qué tan fino muele el molino. Número más bajo = más fino. Más fino frena el agua: el shot tarda más y sale más intenso.', ejemplo: 'De 6 a 5.5 es moler un paso más fino.' },
  dosis: { palabra: 'Dosis', que: 'Cuántos gramos de café molido van en el portafiltro. Se pesa en la báscula.', ejemplo: '18 g en la canastilla de 18.' },
  rendimiento: { palabra: 'Rendimiento', que: 'Cuántos gramos de bebida caen en la taza. Se pesa con la taza en la báscula.', ejemplo: '36 g de espresso.' },
  ratio: { palabra: 'Ratio', que: 'Cuánta bebida sale por cada gramo de café: rendimiento ÷ dosis. Más corto concentra; más largo aligera.', ejemplo: '18 g → 36 g es 1:2.' },
  pulsos: { palabra: 'Pulsos', que: 'Lo que cuenta la máquina para saber cuánta agua pasar. Cada botón corta al llegar a sus pulsos. Cuenta agua que entra, no bebida que cae: por eso se pesa.', ejemplo: '120 pulsos ≈ 36 g en taza con nuestra receta.' },
  canastilla: { palabra: 'Canastilla', que: 'El filtro de metal dentro del portafiltro. Cada una tiene su capacidad en gramos y la dosis debe quedar a 1 g de ella.', ejemplo: 'En la de 18 g caben de 17 a 19 g.' },
  pid: { palabra: 'PID', que: 'El control de temperatura de la caldera de café. Es uno para todos los cafés y solo lo cambia el encargado.', ejemplo: '93.5 °C.' },
  tiempo: { palabra: 'Tiempo del shot', que: 'Los segundos que tarda en salir el espresso. Lo marca la pantalla de la máquina; aquí solo se anota.', ejemplo: '28 s, con margen de ± 2.' },
  validar: { palabra: 'Validar', que: 'Cuando el encargado revisa un checklist completado y confirma que está bien. Cierra el ciclo: quien lo hizo sabe que alguien lo vio.' },
  critica: { palabra: 'Tarea crítica', que: 'Una tarea de seguridad, inocuidad o dinero. El checklist no se puede completar sin ella.' },
  incidencia: { palabra: 'Incidencia', que: 'Un problema que hay que resolver: una lectura fuera de rango o algo que alguien reportó. Tiene responsable y no se cierra sin decir qué se hizo.' },
  jornada: { palabra: 'Jornada', que: 'El día de trabajo. Corta a las 5:00, así un cierre después de medianoche cuenta en el día que empezó.' },
  receta: { palabra: 'Receta del día', que: 'La dosis, rendimiento, tiempo y molienda aprobados hoy al calibrar. Es la que usa todo el turno.' },
};
