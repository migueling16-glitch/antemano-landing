/**
 * Contenido de la maqueta: biblioteca de recetas y capacitación.
 *
 * Es contenido de ejemplo, escrito con criterio de barra para que la maqueta
 * se sienta real. En el sistema lo edita el admin desde la app.
 */

/* ═══ BIBLIOTECA DE RECETAS ═══════════════════════════════ */

export type Receta = {
  id: string;
  nombre: string;
  categoria: 'Espresso' | 'Con leche' | 'Matcha y té' | 'Métodos' | 'Frías';
  vaso: string;
  temperatura: string;
  tiempo: string;
  gramos: [string, string][];
  pasos: string[];
  estandar: string;
};

export const RECETAS: Receta[] = [
  {
    id: 'espresso', nombre: 'Espresso', categoria: 'Espresso', vaso: 'Taza de espresso', temperatura: 'PID 93.5 °C', tiempo: '26–30 s',
    gramos: [['Dosis', '18.0 g'], ['Rendimiento', '36.0 g'], ['Ratio', '1:2'], ['Botón', 'Doble casa']],
    pasos: [
      'Purga el grupo 2 segundos.', 'Muele 18.0 g y distribuye parejo.', 'Tampea nivelado, sin girar.',
      'Engancha, báscula en cero y presiona Doble casa: la Linea corta sola.', 'Revisa la báscula (36 g) y el tiempo en la botonera (26–30 s).', 'Sirve de inmediato.',
    ],
    estandar: 'Crema avellana y continua. Dulce, con acidez limpia. Si sale ácido o amargo, revisa la receta del día antes de servir.',
  },
  {
    id: 'americano', nombre: 'Americano', categoria: 'Espresso', vaso: 'Vaso 12 oz', temperatura: 'Agua a 85 °C', tiempo: '1 min',
    gramos: [['Espresso', '18 g → 36 g'], ['Agua caliente', '150 g']],
    pasos: ['Sirve primero el agua caliente.', 'Extrae el espresso directo sobre el agua.', 'No revuelvas: la crema queda arriba.'],
    estandar: 'Crema visible en la superficie. El agua primero evita que la crema se rompa.',
  },
  {
    id: 'cortado', nombre: 'Cortado', categoria: 'Con leche', vaso: 'Vaso 4.5 oz', temperatura: 'Leche a 55–60 °C', tiempo: '2 min',
    gramos: [['Espresso', '18 g → 36 g'], ['Leche', '60 g']],
    pasos: ['Extrae el espresso en el vaso.', 'Texturiza poca leche, casi sin aire.', 'Vierte despacio, pegado a la superficie.'],
    estandar: 'Proporción 1:1 aproximada. Capa fina de espuma, menos de medio centímetro.',
  },
  {
    id: 'flat-white', nombre: 'Flat white', categoria: 'Con leche', vaso: 'Taza 6 oz', temperatura: 'Leche a 60–65 °C', tiempo: '2 min',
    gramos: [['Doble ristretto', '18 g → 30 g'], ['Leche', '120 g']],
    pasos: ['Extrae el ristretto en la taza.', 'Aire solo al inicio, 2 segundos. Luego integra.', 'Vierte alto al inicio y baja para dibujar.', 'Arte simple: corazón o tulipán.'],
    estandar: 'Microespuma brillante, sin burbujas visibles. Superficie plana, capa de espuma de 0.5 cm.',
  },
  {
    id: 'cappuccino', nombre: 'Cappuccino', categoria: 'Con leche', vaso: 'Taza 8 oz', temperatura: 'Leche a 60–65 °C', tiempo: '2 min',
    gramos: [['Espresso', '18 g → 36 g'], ['Leche', '150 g']],
    pasos: ['Extrae el espresso en la taza.', 'Aire 4–5 segundos: más espuma que un latte.', 'Vierte y termina con la espuma.'],
    estandar: 'Espuma de 1.5 cm, sedosa. Canela solo si el cliente la pide.',
  },
  {
    id: 'latte', nombre: 'Latte', categoria: 'Con leche', vaso: 'Vaso 12 oz', temperatura: 'Leche a 60–65 °C', tiempo: '2 min',
    gramos: [['Espresso', '18 g → 36 g'], ['Leche', '250 g']],
    pasos: ['Extrae el espresso en el vaso.', 'Aire 2–3 segundos.', 'Vierte y dibuja al final.'],
    estandar: 'Espuma de 0.5–1 cm. La leche nunca pasa de 65 °C: se quema y pierde dulzor.',
  },
  {
    id: 'cold-brew', nombre: 'Cold brew', categoria: 'Frías', vaso: 'Vaso 16 oz con hielo', temperatura: 'Frío', tiempo: '18 h de extracción',
    gramos: [['Café molienda gruesa', '100 g'], ['Agua fría', '1000 g'], ['Por vaso', '180 g']],
    pasos: ['Mezcla café y agua en el contenedor.', 'Tapa, etiqueta con fecha y hora.', 'Refrigera 18 horas.', 'Filtra y pasa a jarra etiquetada.', 'Sirve 180 g sobre hielo.'],
    estandar: 'Dura 3 días refrigerado. Sin etiqueta no se sirve.',
  },
  {
    id: 'matcha-latte', nombre: 'Matcha latte', categoria: 'Matcha y té', vaso: 'Vaso 12 oz', temperatura: 'Agua a 75 °C', tiempo: '2 min',
    gramos: [['Matcha ceremonial', '3 g'], ['Agua', '60 g'], ['Leche', '180 g']],
    pasos: ['Tamiza el matcha en el tazón.', 'Agrega el agua a 75 °C.', 'Bate en zigzag hasta que no queden grumos.', 'Texturiza la leche y vierte el matcha encima.'],
    estandar: 'Sin grumos. El agua hirviendo amarga el matcha: nunca más de 80 °C.',
  },
  {
    id: 'dirty-matcha', nombre: 'Dirty matcha', categoria: 'Matcha y té', vaso: 'Vaso 12 oz', temperatura: 'Leche a 60 °C', tiempo: '3 min',
    gramos: [['Matcha latte', 'receta completa'], ['Espresso', '18 g → 36 g']],
    pasos: ['Prepara el matcha latte.', 'Extrae el espresso.', 'Vierte el espresso encima, despacio, para marcar la capa.'],
    estandar: 'Tres capas visibles al servir: leche, matcha y espresso.',
  },
  {
    id: 'v60', nombre: 'V60', categoria: 'Métodos', vaso: 'Jarra y taza', temperatura: 'Agua a 94 °C', tiempo: '2:45–3:15',
    gramos: [['Café molienda media', '15 g'], ['Agua', '250 g'], ['Ratio', '1:16.7']],
    pasos: ['Enjuaga el filtro con agua caliente.', 'Preinfusión: 45 g de agua, 30 segundos.', 'Vierte en espiral hasta 150 g.', 'Completa a 250 g.', 'Termina entre 2:45 y 3:15.'],
    estandar: 'Si termina antes de 2:45, muele más fino. Si pasa de 3:15, más grueso.',
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
  { id: 'm-metodos', nivel: 2, titulo: 'Métodos filtrados' },
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
      { tipo: 'texto', texto: 'La refrigeración va a máximo 7 °C (NOM-251, apartado 5.5.2) y el congelador debe mantener el producto congelado. Se registra en apertura y en cierre.' },
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
    id: 'l-tds', moduloId: 'm-calibracion', titulo: 'TDS y extracción', minutos: 5,
    bloques: [
      { tipo: 'texto', texto: 'El refractómetro mide el TDS: cuánto café disuelto hay en la bebida. Con TDS, rendimiento y dosis sale la extracción.' },
      { tipo: 'ficha', filas: [['Extracción', 'TDS × rendimiento ÷ dosis'], ['Referencia', '18–22 %'], ['TDS espresso', '8–12 %'], ['Ejemplo', '10 × 36 ÷ 18 = 20 %']] },
      { tipo: 'clave', texto: 'El número confirma lo que dice el sabor. Si no coinciden, gana el sabor y se revisa la medición.' },
    ],
    preguntas: [
      { id: 'q-tds-1', pregunta: '¿Cómo se calcula la extracción?', respuesta: 'TDS × rendimiento ÷ dosis.' },
      { id: 'q-tds-2', pregunta: 'Un shot de 18 g → 36 g da TDS 10 %. ¿Cuánto extrajo?', respuesta: '20 %.' },
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
    id: 'l-v60', moduloId: 'm-metodos', titulo: 'V60 de la casa', minutos: 6,
    bloques: [
      { tipo: 'receta', recetaId: 'v60' },
      { tipo: 'clave', texto: 'El tiempo total te dice la molienda: rápido → más fino, lento → más grueso.' },
    ],
    preguntas: [
      { id: 'q-v60-1', pregunta: '¿Cuál es la receta del V60 de la casa?', respuesta: '15 g de café, 250 g de agua a 94 °C, en 2:45 a 3:15.' },
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
    'Mide TDS y extracción de un shot y lo interpreta',
    'Prepara un V60 dentro de receta',
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
