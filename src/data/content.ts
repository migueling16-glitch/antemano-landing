// ─────────────────────────────────────────────────────────────────────────────
// Manual Vivo™ × Spiral — Contenido del portal de capacitación
//
// PARA AGREGAR UN MÓDULO: añade un objeto al array MODULOS y reinicia el servidor.
// PARA CAMBIAR UN VIDEO: agrega `videoUrl: "https://..."` al módulo — el
// reproductor lo toma automáticamente.
// ─────────────────────────────────────────────────────────────────────────────

export type TipoModulo = 'subreceta' | 'platillo' | 'protocolo';

export interface FichaTecnica {
  [ingrediente: string]: string;
}

export interface CriterioCalidad {
  bien: string;
  mal: string;
}

export interface Modulo {
  slug: string;
  titulo: string;
  estacion: string;
  tipo: TipoModulo;
  duracion: string;
  descripcion: string;
  /** slugs de subrecetas que este platillo/preparación necesita */
  usaRecetas: string[];
  /** slugs de platillos donde esta subreceta aparece */
  usadaEn: string[];
  /** cuando el video esté listo, pegar la URL aquí */
  videoUrl?: string;
  ficha?: FichaTecnica;
  criterio?: CriterioCalidad;
}

export interface Estacion {
  slug: string;
  titulo: string;
  descripcion: string;
}

export interface Ruta {
  slug: string;
  titulo: string;
  descripcion: string;
  puesto: string;
  /** slugs de módulos en orden de aprendizaje */
  modulos: string[];
}

// Video de demostración — reemplazar por URL definitiva de cada módulo
// cuando los videos reales estén listos (ver GUIA-CONTENIDO.md).
const DEMO_VIDEO_URL = 'https://www.youtube.com/embed/RkIhIuhGMZM?rel=0';

// ─────────────────────────────────────────────────────────────────────────────
// ESTACIONES
// ─────────────────────────────────────────────────────────────────────────────

export const ESTACIONES: Estacion[] = [
  {
    slug: 'masa-pizza',
    titulo: 'Masa & Pizza',
    descripcion: 'Fermentación, laminado y cocción. La base de todo Spiral.',
  },
  {
    slug: 'pasta-fresca',
    titulo: 'Pasta fresca',
    descripcion: 'Masa de huevo, formatos y cocciones al punto exacto.',
  },
  {
    slug: 'salsas-base',
    titulo: 'Salsas base',
    descripcion: 'Pomodoro, bechamel, spicy vodka y fondos.',
  },
  {
    slug: 'principios-postres',
    titulo: 'Principios y postres',
    descripcion: 'Emulsiones, fondos y terminaciones dulces.',
  },
  {
    slug: 'protocolos',
    titulo: 'Protocolos de cocina',
    descripcion: 'Términos, tiempos, temperaturas y criterios de calidad.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULOS
// ─────────────────────────────────────────────────────────────────────────────

export const MODULOS: Modulo[] = [

  // ── SUBRECETAS BASE ──────────────────────────────────────────────────────

  {
    slug: 'masa-48-horas',
    titulo: 'Masa de 48 horas',
    estacion: 'masa-pizza',
    tipo: 'subreceta',
    duracion: '6 min',
    descripcion:
      'La base de todas las pizzas. Fermentación lenta de 48 horas que desarrolla sabor, estructura y los alveolos que distinguen a Spiral.',
    usaRecetas: [],
    usadaEn: ['pizza-margherita', 'pizza-spicy-vodka', 'pizza-funghi'],
    ficha: {
      'Harina': '1000 g',
      'Agua': '650 ml',
      'Sal': '28 g',
      'Levadura': '3 g',
      'Fermentación': '48 horas · 4 °C',
      'Rendimiento': '6 bases de 250 g',
      'Temp. de horno': '350 °C',
    },
    criterio: {
      bien:
        'La masa tiene alveolos visibles al estirar. La superficie es húmeda pero no pegajosa — cede sin resistencia. Al doblarla regresa a su forma: tiene fuerza y elasticidad. El aroma es ligeramente ácido, a fermentación viva.',
      mal:
        'Si el borde se desgarra al estirar, el gluten no desarrolló o la fermentación fue insuficiente. Si la masa se encoge inmediatamente, necesita más reposo. Si el aroma es fuertemente alcohólico o muy ácido, se pasó de fermentación — descartar el lote.',
    },
  },

  {
    slug: 'salsa-pomodoro',
    titulo: 'Salsa pomodoro',
    estacion: 'salsas-base',
    tipo: 'subreceta',
    duracion: '4 min',
    descripcion:
      'Salsa de tomate italiana base. Sin cocción prolongada — la frescura del tomate San Marzano es el punto.',
    usaRecetas: [],
    usadaEn: ['pizza-margherita', 'pizza-spicy-vodka', 'pizza-funghi'],
    ficha: {
      'Tomate San Marzano': '800 g',
      'Albahaca': '10 g',
      'Sal': '12 g',
      'Aceite de oliva': '40 ml',
      'Rendimiento': '4 pizzas',
    },
    criterio: {
      bien:
        'Color rojo vivo, no anaranjado. Textura ligeramente rústica — no completamente lisa. El sabor es brillante, ácido y fresco. No tiene aroma a "enlatado".',
      mal:
        'Si el color es anaranjado o café, los tomates se oxidaron o se cocinaron de más. Si la textura es completamente lisa, el proceso fue incorrecto. El sabor nunca debe ser dulce por reducción.',
    },
  },

  {
    slug: 'pasta-fresca-base',
    titulo: 'Pasta fresca — masa base',
    estacion: 'pasta-fresca',
    tipo: 'subreceta',
    duracion: '8 min',
    descripcion:
      'Masa de huevo para laminado. Base de todos los formatos de pasta de Spiral — desde spaghetti hasta ravioles.',
    usaRecetas: [],
    usadaEn: ['carbonara', 'ravioles-ricotta'],
    ficha: {
      'Harina 00': '500 g',
      'Huevos enteros': '5 piezas',
      'Yemas adicionales': '3 piezas',
      'Aceite de oliva': '10 ml',
      'Reposo': '30 min',
    },
    criterio: {
      bien:
        'La masa es sedosa al tacto, elástica y no se pega a la mano. Al laminarse es traslúcida — puedes ver la sombra de tu mano. Al cocerse, el exterior es firme y el interior tiene resistencia: al dente real.',
      mal:
        'Si la masa se rompe al laminar, le falta hidratación o reposo. Si se pega al rodillo, tiene exceso de humedad — agregar harina gradualmente. La pasta sobre-cocida no tiene corrección posible.',
    },
  },

  // ── PLATILLOS ─────────────────────────────────────────────────────────────

  {
    slug: 'pizza-margherita',
    titulo: 'Pizza Margherita',
    estacion: 'masa-pizza',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion:
      'El clásico de Spiral. Pomodoro, mozzarella fior di latte, albahaca fresca. El estándar de la casa.',
    usaRecetas: ['masa-48-horas', 'salsa-pomodoro'],
    usadaEn: [],
    ficha: {
      'Masa': '250 g (1 base)',
      'Salsa pomodoro': '80 g',
      'Mozzarella fior di latte': '120 g',
      'Albahaca fresca': '5 hojas',
      'Aceite de oliva': 'al terminar',
      'Temp. de horno': '350 °C · 3–4 min',
    },
    criterio: {
      bien:
        'El borde (cornicione) está inflado y con manchas oscuras de leña. La mozzarella se fundió pero no se quemó — manchas doradas, no cafés. El centro no está húmedo ni crudo.',
      mal:
        'Si el centro está flácido o acuoso, necesita más temperatura o menos humedad en los ingredientes. Si el borde está pálido, el horno no estaba a temperatura. Si la mozzarella está quemada, entró demasiado fría.',
    },
  },

  {
    slug: 'pizza-spicy-vodka',
    titulo: 'Pizza Spicy Vodka',
    estacion: 'masa-pizza',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion:
      'Salsa rosa de vodka especiada, mozzarella, pepperoni y stracciatella al terminar. La firma de Spiral.',
    usaRecetas: ['masa-48-horas', 'salsa-pomodoro'],
    usadaEn: [],
    ficha: {
      'Masa': '250 g (1 base)',
      'Salsa spicy vodka': '90 g',
      'Mozzarella': '100 g',
      'Pepperoni': '60 g',
      'Stracciatella': '30 g (fuera del horno)',
      'Temp. de horno': '350 °C · 3–4 min',
    },
    criterio: {
      bien:
        'El pepperoni tiene los bordes rizados — señal de que el horno estaba a temperatura. La stracciatella se agrega FUERA del horno, nunca adentro. La salsa tiene cuerpo y no se escurre.',
      mal:
        'Si el pepperoni está plano y pálido, el horno estaba frío. Si la stracciatella está caliente y líquida, se agregó antes de tiempo. Si la salsa forma un charco, estaba demasiado delgada.',
    },
  },

  {
    slug: 'pizza-funghi',
    titulo: 'Pizza Funghi',
    estacion: 'masa-pizza',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion:
      'Champiñones salteados, mozzarella fior di latte, aceite de trufa. La opción vegetariana de Spiral.',
    usaRecetas: ['masa-48-horas', 'salsa-pomodoro'],
    usadaEn: [],
    ficha: {
      'Masa': '250 g (1 base)',
      'Salsa pomodoro': '80 g',
      'Mozzarella fior di latte': '100 g',
      'Champiñones': '80 g (salteados)',
      'Aceite de trufa': '5 ml (al terminar)',
      'Temp. de horno': '350 °C · 3–4 min',
    },
    criterio: {
      bien:
        'Los champiñones están salteados previamente — nunca crudos sobre la pizza. El aceite de trufa se aplica fuera del horno, en frío. El balance entre el pomodoro y el umami del hongo es el punto.',
      mal:
        'Si los champiñones sueltan agua sobre la pizza, no fueron salteados correctamente. Si el aceite de trufa se aplicó dentro del horno, el aroma se pierde por completo.',
    },
  },

  {
    slug: 'ravioles-ricotta',
    titulo: 'Ravioles de ricotta y albahaca',
    estacion: 'pasta-fresca',
    tipo: 'platillo',
    duracion: '6 min',
    descripcion:
      'Ravioles de pasta fresca rellenos de ricotta y albahaca. Servidos con mantequilla dorada y salvia.',
    usaRecetas: ['pasta-fresca-base'],
    usadaEn: [],
    ficha: {
      'Pasta fresca': '180 g (laminada)',
      'Ricotta': '200 g',
      'Albahaca': '8 hojas picadas',
      'Pecorino': '20 g (en el relleno)',
      'Mantequilla': '40 g (para la salsa)',
      'Salvia': '4 hojas',
    },
    criterio: {
      bien:
        'El sello de los ravioles es hermético — sin burbujas de aire. La pasta es traslúcida y uniforme. La mantequilla está dorada (noisette), no quemada.',
      mal:
        'Si los ravioles se abren al cocerse, el sello estaba mal hecho o la masa demasiado húmeda en los bordes. Si la mantequilla está café oscuro o amarga, se pasó el punto.',
    },
  },

  {
    slug: 'carbonara',
    titulo: 'Pasta Carbonara',
    estacion: 'pasta-fresca',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion:
      'Pasta fresca, yema curada, guanciale, pecorino. Sin crema — nunca.',
    usaRecetas: ['pasta-fresca-base'],
    usadaEn: [],
    ficha: {
      'Pasta fresca': '180 g',
      'Guanciale': '60 g',
      'Yema de huevo': '2 piezas',
      'Pecorino romano': '40 g',
      'Pimienta negra': 'abundante, recién molida',
      'Agua de cocción': 'c/s para emulsionar',
    },
    criterio: {
      bien:
        'La salsa es cremosa y brillante, se adhiere a la pasta. La yema no coaguló. El guanciale está crujiente en exterior, tierno adentro. Sin crema en ningún caso.',
      mal:
        'Si la salsa está granulada o la yema cuajó en hebras, el calor fue demasiado alto. Bajar temperatura y usar más agua de cocción. Nunca agregar crema.',
    },
  },

  // ── PROTOCOLO ─────────────────────────────────────────────────────────────

  {
    slug: 'terminos-carne',
    titulo: 'Términos de carne',
    estacion: 'protocolos',
    tipo: 'protocolo',
    duracion: '5 min',
    descripcion:
      'Temperatura interna, tiempo de reposo y criterio visual para cada término. Aplica al Ribeye y los principales cortes de Spiral.',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Término azul': '< 46 °C · centro frío',
      'Término inglés': '49–52 °C · rojo vivo',
      'Término rojo': '52–55 °C · rojo uniforme',
      'Término medio': '57–63 °C · rosado',
      'Término ¾': '65–69 °C · ligeramente rosado',
      'Bien cocido': '> 71 °C · sin rosado',
      'Reposo mínimo': '3 min antes de cortar',
    },
    criterio: {
      bien:
        'La carne descansó el tiempo correcto — los jugos no se escapan al cortar. La corteza tiene Maillard uniforme, no manchas grises. El término es exacto al pedido.',
      mal:
        'Si los jugos forman charco en el plato, no hubo reposo suficiente. Si hay partes grises en el exterior, la parrilla estaba fría. Nunca pinchar la carne para revisar — se pierden los jugos.',
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS DE APRENDIZAJE
// ─────────────────────────────────────────────────────────────────────────────

export const RUTAS: Ruta[] = [
  {
    slug: 'cocinero-de-pizzas',
    titulo: 'Cocinero de pizzas',
    descripcion:
      'Domina la estación de pizzas de Spiral. Empezamos por los protocolos y la base más importante, y terminamos con los ensambles.',
    puesto: 'Cocinero · Estación Masa & Pizza',
    modulos: [
      'terminos-carne',
      'masa-48-horas',
      'salsa-pomodoro',
      'pizza-margherita',
      'pizza-spicy-vodka',
      'pizza-funghi',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function getAllModulos(): Modulo[] {
  return MODULOS.map((m) => ({ ...m, videoUrl: m.videoUrl ?? DEMO_VIDEO_URL }));
}

export function getModuloBySlug(slug: string): Modulo | undefined {
  const m = MODULOS.find((m) => m.slug === slug);
  return m ? { ...m, videoUrl: m.videoUrl ?? DEMO_VIDEO_URL } : undefined;
}

export function getModulosByEstacion(estacionSlug: string): Modulo[] {
  return MODULOS.filter((m) => m.estacion === estacionSlug);
}

export function getAllEstaciones(): Estacion[] {
  return ESTACIONES;
}

export function getEstacionBySlug(slug: string): Estacion | undefined {
  return ESTACIONES.find((e) => e.slug === slug);
}

export function getAllRutas(): Ruta[] {
  return RUTAS;
}

export function getRutaBySlug(slug: string): Ruta | undefined {
  return RUTAS.find((r) => r.slug === slug);
}

export function getRelatedModulos(slugs: string[]): Modulo[] {
  return slugs
    .map((s) => getModuloBySlug(s))
    .filter((m): m is Modulo => m !== undefined);
}

export function getNextInRuta(
  moduloSlug: string,
  rutaSlug: string,
): Modulo | undefined {
  const ruta = getRutaBySlug(rutaSlug);
  if (!ruta) return undefined;
  const idx = ruta.modulos.indexOf(moduloSlug);
  if (idx === -1 || idx === ruta.modulos.length - 1) return undefined;
  return getModuloBySlug(ruta.modulos[idx + 1]);
}

/** Returns which rutas include a given module slug */
export function getRutasForModulo(moduloSlug: string): Ruta[] {
  return RUTAS.filter((r) => r.modulos.includes(moduloSlug));
}

export function getTipoBadge(tipo: TipoModulo): { label: string; cls: string } {
  const map: Record<TipoModulo, { label: string; cls: string }> = {
    subreceta: {
      label: 'Subreceta',
      cls: 'border border-[#C4522A] text-[#C4522A] bg-transparent',
    },
    platillo: {
      label: 'Platillo',
      cls: 'bg-[#C4522A]/10 text-[#C4522A] border border-[#C4522A]/30',
    },
    protocolo: {
      label: 'Protocolo',
      cls: 'border border-[#2C1810]/30 text-[#2C1810]/50 bg-transparent',
    },
  };
  return map[tipo];
}
