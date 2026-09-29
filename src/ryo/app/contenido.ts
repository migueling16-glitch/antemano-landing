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
};

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
  },
  {
    id: 'ryo-matcha', nombre: 'Ryo matcha', categoria: 'Matchas', vaso: 'Vaso 12 oz', temperatura: 'Agua a 75 °C', tiempo: '2 min',
    gramos: [['Matcha ceremonial', '3 g'], ['Agua', '60 ml'], ['Toque de la casa', 'por definir']],
    pasos: ['Receta de la casa por definir con la barra.'],
    estandar: 'La matcha firma de Ryo: se define en barra y se registra aquí.',
    porConfirmar: true,
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
  { id: 'm-calibracion', nivel: 2, titulo: 'Calibración' },
  { id: 'm-perfilar', nivel: 3, titulo: 'Perfilar y enseñar' },
];

export const LECCIONES: Leccion[] = [
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
      { tipo: 'clave', texto: 'Ácido → más fino. Amargo → más grueso. Una variable a la vez.' },
      { tipo: 'texto', texto: 'La brújula de sabor de la app tiene esos dos ejes: de ácido a amargo, y de débil a intenso. Toca dónde cae tu shot y te sugiere el siguiente ajuste.' },
    ],
    preguntas: [
      { id: 'q-leer-1', pregunta: 'El shot corre en 22 s y sabe ácido. ¿Qué ajustas primero?', respuesta: 'Molienda más fina.' },
      { id: 'q-leer-2', pregunta: '¿Qué significa que un shot sepa seco o astringente?', respuesta: 'Que está sobreextraído.' },
      { id: 'q-leer-3', pregunta: '¿Cuántas variables se cambian entre un shot y el siguiente?', respuesta: 'Una sola.' },
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
      { tipo: 'texto', texto: 'La Linea Classic AV corta el shot sola: un flujómetro cuenta el agua y cierra al llegar al volumen programado. Con el volumen fijo, la molienda mueve el tiempo y el peso casi no cambia; más fino deja un poco menos de bebida.' },
      { tipo: 'ficha', filas: [['Botones', '4 dosis programables'], ['Continuo', 'Cortas tú en la báscula'], ['Tiempo', 'Lo marca la botonera'], ['Temperatura', 'Un PID para todos los cafés']] },
      { tipo: 'clave', texto: 'Molienda para el tiempo, botón para el peso. Si el tiempo ya está y el peso no, se reprograma el botón.' },
      { tipo: 'texto', texto: 'El flujómetro mide agua, no bebida: por eso el botón se programa mirando la báscula, y se comprueba con un shot normal después de reprogramarlo.' },
      { tipo: 'video', titulo: 'Programar una dosis en la botonera', duracion: '2:10' },
    ],
    preguntas: [
      { id: 'q-av-1', pregunta: 'Con botón volumétrico, ¿con qué corriges el tiempo?', respuesta: 'Con la molienda.' },
      { id: 'q-av-2', pregunta: 'El tiempo está en ventana pero el botón entrega 34 g en lugar de 36. ¿Qué haces?', respuesta: 'Reprogramar el botón a 36 g.' },
      { id: 'q-av-3', pregunta: '¿Por qué el botón se programa mirando la báscula?', respuesta: 'Porque el flujómetro mide agua, no bebida: parte del agua se queda en el café.' },
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
