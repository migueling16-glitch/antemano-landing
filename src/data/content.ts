// ─────────────────────────────────────────────────────────────────────────────
// Manual Vivo™ × Spiral — Contenido del portal de capacitación
//
// PARA AGREGAR UN MÓDULO: añade un objeto al array MODULOS y reinicia el servidor.
// PARA CAMBIAR UN VIDEO:  agrega `videoUrl: "https://..."` al módulo — el
//   reproductor lo toma automáticamente y reemplaza el placeholder.
// GRAMAJES CON †: pendiente de validación con la chef. Temperaturas de carne: reales.
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
  /** slugs de subrecetas/protocolos que este módulo necesita */
  usaRecetas: string[];
  /** slugs de platillos donde esta subreceta/protocolo aparece */
  usadaEn: string[];
  videoUrl?: string;
  ficha?: FichaTecnica;
  criterio?: CriterioCalidad;
}

export interface Estacion {
  slug: string;
  titulo: string;
  descripcion: string;
  /** Nota de aviso visible en la página de la estación (ej. contenido placeholder) */
  nota?: string;
}

export interface Ruta {
  slug: string;
  titulo: string;
  descripcion: string;
  puesto: string;
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
    slug: 'entradas',
    titulo: 'Entradas',
    descripcion: 'Crudos, carpaccios, tiraditos y el pan de masa madre de la casa.',
  },
  {
    slug: 'ensaladas',
    titulo: 'Ensaladas',
    descripcion: 'Aderezos, vinagretas y montaje de los platos fríos de la carta.',
  },
  {
    slug: 'pasta-fresca',
    titulo: 'Pasta fresca',
    descripcion: 'Masa de huevo, laminado y todos los formatos de pasta hechos en casa.',
  },
  {
    slug: 'pizzas',
    titulo: 'Pizzas',
    descripcion: 'Masa de 48 horas, 30 cm de diámetro. Fermentación, laminado y cocción.',
  },
  {
    slug: 'platos-fuertes',
    titulo: 'Platos fuertes',
    descripcion: 'Cortes de res, milanesa y pescado. Términos, tiempos y emplatado.',
  },
  {
    slug: 'postres',
    titulo: 'Postres',
    descripcion: 'Técnicas de repostería: merengue italiano, tarta, tiramisú y affogato.',
  },
  {
    slug: 'bar-bebidas',
    titulo: 'Bar / Bebidas',
    descripcion: 'Cócteles de programa aperitivo italiano: build, técnica y garnish estándar.',
    nota: 'Bebidas — contenido de muestra. Se reemplaza con el menú de bar real.',
  },
  {
    slug: 'salsas-bases',
    titulo: 'Salsas y bases',
    descripcion: 'Las preparaciones base que alimentan a múltiples platillos. El núcleo del sistema.',
  },
  {
    slug: 'protocolos',
    titulo: 'Protocolos de cocina',
    descripcion: 'Términos de carne, fermentación de la masa y manejo de crudos.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULOS
// ─────────────────────────────────────────────────────────────────────────────

export const MODULOS: Modulo[] = [

  // ── SUBRECETAS BASE — SALSAS Y BASES ────────────────────────────────────

  {
    slug: 'masa-48-horas',
    titulo: 'Masa de 48 horas',
    estacion: 'pizzas',
    tipo: 'subreceta',
    duracion: '6 min',
    descripcion:
      'La base de las 8 pizzas. Fermentación lenta de 48 horas que desarrolla sabor, estructura y los alveolos que distinguen a Spiral. Diámetro final: 30 cm (opción 25 cm para 2).',
    usaRecetas: ['fermentacion-48h'],
    usadaEn: [
      'pizza-margherita', 'pizza-alcachofa', 'pizza-salame-pepperoncino',
      'pizza-pepperoni', 'pizza-prosciutto', 'pizza-vodka-spiral',
      'pizza-spicy-honey', 'pizza-nduja-pomodoro',
    ],
    ficha: {
      'Harina': '1000 g †',
      'Agua': '650 ml †',
      'Sal': '28 g †',
      'Levadura': '3 g †',
      'Fermentación': '48 h · 4 °C',
      'Diámetro': '30 cm (estándar) · 25 cm (para 2)',
      'Rendimiento': '6 bases de 250 g †',
      'Temp. de horno': '350 °C+',
    },
    criterio: {
      bien:
        'Alveolos visibles al estirar. Superficie húmeda pero no pegajosa — cede sin resistencia. Al doblarla regresa a su forma: fuerza y elasticidad. Aroma ligeramente ácido, a fermentación viva.',
      mal:
        'Borde que se desgarra al estirar: gluten sin desarrollar o fermentación insuficiente. Masa que se encoge al soltarla: falta reposo. Aroma fuertemente alcohólico o muy ácido: lote vencido de fermentación — descartar.',
    },
  },

  {
    slug: 'pasta-fresca-base',
    titulo: 'Pasta fresca — masa base',
    estacion: 'pasta-fresca',
    tipo: 'subreceta',
    duracion: '8 min',
    descripcion:
      'Masa de huevo para laminado. Base de todos los formatos de pasta hechos en casa en Spiral: spaghetti, rigatoni, mafalde, pappardelle, ravioles y lasagna.',
    usaRecetas: [],
    usadaEn: [
      'spaguetti-limon', 'white-truffle-mafalde', 'ravioles-ricotta',
      'spicy-vodka-rigatoni', 'carbonara', 'bucatini-arrabiata',
      'short-rib-pappardelle', 'lasagna',
    ],
    ficha: {
      'Harina 00': '500 g †',
      'Huevos enteros': '5 piezas †',
      'Yemas adicionales': '3 piezas †',
      'Aceite de oliva': '10 ml †',
      'Reposo': '30 min mínimo',
    },
    criterio: {
      bien:
        'Masa sedosa, elástica, no se pega a la mano. Al laminar es traslúcida — puedes ver la sombra de tu mano a través. Al cocer: exterior firme, interior con resistencia real. Al dente.',
      mal:
        'Se rompe al laminar: falta hidratación o reposo. Se pega al rodillo: exceso de humedad, agregar harina gradualmente. Pasta sobre-cocida: no tiene corrección posible.',
    },
  },

  {
    // HÉROE DEL SISTEMA: 1 subreceta, 5 platillos, 3 categorías
    slug: 'stracciatella',
    titulo: 'Stracciatella',
    estacion: 'salsas-bases',
    tipo: 'subreceta',
    duracion: '3 min',
    descripcion:
      'Queso fresco de hebras en crema. Aparece en 5 platillos de 3 categorías distintas: entrada, pasta y pizza. El mejor ejemplo del sistema: un solo estándar, reutilizado por toda la carta.',
    usaRecetas: [],
    usadaEn: [
      'stracciatella-tomate',  // entrada
      'spicy-vodka-rigatoni',  // pasta
      'bucatini-arrabiata',    // pasta
      'pizza-vodka-spiral',    // pizza
      'pizza-nduja-pomodoro',  // pizza
    ],
    ficha: {
      'Stracciatella': 'porción por platillo †',
      'Temperatura de servicio': 'fría — nunca al horno',
      'Aplicación': 'siempre fuera del horno, al terminar',
    },
    criterio: {
      bien:
        'Textura de hebras cremosas, fría al paladar. Se aplica en el último momento, sobre el platillo ya emplatado. Contraste de temperatura con el plato caliente es parte de la experiencia.',
      mal:
        'Nunca entra al horno: el calor la rompe, pierde textura y se vuelve aguada. Si aparece caliente y líquida en el plato, se agregó demasiado pronto o sobre una superficie muy caliente.',
    },
  },

  {
    slug: 'salsa-pomodoro',
    titulo: 'Salsa pomodoro',
    estacion: 'salsas-bases',
    tipo: 'subreceta',
    duracion: '4 min',
    descripcion:
      'Base de tomate italiana. Sin cocción prolongada — la frescura del San Marzano es el punto. Alimenta 4 pizzas de la carta.',
    usaRecetas: [],
    usadaEn: [
      'pizza-margherita', 'pizza-prosciutto',
      'pizza-spicy-honey', 'pizza-nduja-pomodoro',
    ],
    ficha: {
      'Tomate San Marzano': '800 g †',
      'Albahaca': '10 g †',
      'Sal': '12 g †',
      'Aceite de oliva': '40 ml †',
      'Rendimiento': '4 pizzas †',
    },
    criterio: {
      bien:
        'Color rojo vivo, no anaranjado. Textura ligeramente rústica — no completamente lisa. Sabor brillante, ácido y fresco. Sin aroma a "enlatado".',
      mal:
        'Color anaranjado o café: los tomates se oxidaron o cocinaron de más. Textura completamente lisa: proceso incorrecto. Sabor dulce por reducción: la salsa se pasó de tiempo.',
    },
  },

  {
    slug: 'salsa-spicy-vodka',
    titulo: 'Salsa spicy vodka',
    estacion: 'salsas-bases',
    tipo: 'subreceta',
    duracion: '5 min',
    descripcion:
      'Salsa rosa especiada con vodka. Cruza dos estaciones: aparece en la pizza Vodka Spiral y en el rigatoni spicy vodka. El mismo estándar para ambos platillos.',
    usaRecetas: [],
    usadaEn: ['pizza-vodka-spiral', 'spicy-vodka-rigatoni'],
    ficha: {
      'Base de tomate': '†',
      'Crema': '†',
      'Vodka': '†',
      'Chile': '†',
      'Rendimiento': '†',
    },
    criterio: {
      bien:
        'Color rosa uniforme, con cuerpo y sin separación de grasa. El picante está presente pero no dominante — complementa el vodka. Consistencia que cubre la pasta o sostiene la pizza sin escurrirse.',
      mal:
        'Si la crema se separa de la salsa, el fuego estaba muy alto o no se integró correctamente. Si no tiene cuerpo y se escurre, falta reducción.',
    },
  },

  {
    slug: 'pan-masa-madre',
    titulo: 'Pan de masa madre (Mortirolo)',
    estacion: 'salsas-bases',
    tipo: 'subreceta',
    duracion: '5 min',
    descripcion:
      'Pan artesanal de masa madre. Se sirve solo ($69), y aparece en la Stracciatella con tomate y el Tartar de atún. Técnica clave: corteza, miga y temperatura de servicio.',
    usaRecetas: [],
    usadaEn: ['stracciatella-tomate', 'tartar-atun'],
    ficha: {
      'Harina de trigo integral': '†',
      'Starter de masa madre': '†',
      'Sal': '†',
      'Agua': '†',
      'Horneo': '†',
    },
    criterio: {
      bien:
        'Corteza crujiente, miga abierta y húmeda. Aroma a fermentación leve. Se sirve templado, nunca frío ni directamente del congelador.',
      mal:
        'Miga compacta sin alveolos: fermentación insuficiente. Corteza blanda: falta temperatura de horno o vapor. Sabor fuertemente ácido: masa sobre-fermentada.',
    },
  },

  {
    slug: 'pesto-verde',
    titulo: 'Pesto verde',
    estacion: 'salsas-bases',
    tipo: 'subreceta',
    duracion: '4 min',
    descripcion:
      'Pesto de albahaca fresca. Aparece en la Ensalada arúgula al limón y en la Pizza Vodka Spiral — une dos estaciones de la carta.',
    usaRecetas: [],
    usadaEn: ['arugula-limon', 'pizza-vodka-spiral'],
    ficha: {
      'Albahaca fresca': '†',
      'Piñones o nuez': '†',
      'Parmesano': '†',
      'Ajo': '†',
      'Aceite de oliva': '†',
      'Sal': '†',
    },
    criterio: {
      bien:
        'Verde vivo, no oxidado. Se procesa en frío o con hielo para conservar el color. Textura con pequeños trozos — no completamente lisa.',
      mal:
        'Color oscuro o café: la albahaca se oxidó por calor o exposición al aire. Preparar siempre al momento o conservar cubierto con aceite.',
    },
  },

  {
    slug: 'vinagreta-limon-amarillo',
    titulo: 'Vinagreta de limón amarillo',
    estacion: 'salsas-bases',
    tipo: 'subreceta',
    duracion: '3 min',
    descripcion:
      'Aderezo cítrico base. Aparece en la Ensalada salame y en el Pulpo a la vinagreta — dos platillos de estaciones distintas.',
    usaRecetas: [],
    usadaEn: ['ensalada-salame', 'pulpo-vinagreta'],
    ficha: {
      'Limón amarillo (jugo)': '†',
      'Aceite de oliva': '†',
      'Mostaza Dijon': '†',
      'Sal y pimienta': '†',
      'Rendimiento': '†',
    },
    criterio: {
      bien:
        'Emulsión estable, no se separa al momento de servir. Balance ácido-graso correcto: el limón no domina ni desaparece. Temperatura: fría o a temperatura ambiente.',
      mal:
        'Si la emulsión se corta, batir de nuevo con un poco de agua. Nunca calentar — destruye la emulsión y el perfume cítrico.',
    },
  },

  {
    slug: 'bechamel-salsa-blanca',
    titulo: 'Bechamel / Salsa blanca',
    estacion: 'salsas-bases',
    tipo: 'subreceta',
    duracion: '5 min',
    descripcion:
      'Salsa bechamel clásica. Base de la Lasagna y del Salame pepperoncino. La consistencia varía según el uso: más espesa para pizza, más fluida para lasagna.',
    usaRecetas: [],
    usadaEn: ['lasagna', 'pizza-salame-pepperoncino'],
    ficha: {
      'Mantequilla': '†',
      'Harina': '†',
      'Leche': '†',
      'Nuez moscada': 'al gusto',
      'Sal': '†',
    },
    criterio: {
      bien:
        'Sin grumos — el roux se cocina completamente antes de agregar la leche. Consistencia nappé: cubre la cuchara limpiamente. Sin sabor a harina cruda.',
      mal:
        'Grumos: el roux no se cocinó lo suficiente o se agregó la leche muy rápido. Sabor a harina cruda: falta cocción del roux. Consistencia aguada: agregar la leche en partes y reducir.',
    },
  },

  {
    slug: 'ragu',
    titulo: 'Ragú',
    estacion: 'salsas-bases',
    tipo: 'subreceta',
    duracion: '6 min',
    descripcion:
      'Salsa de carne estofada. Base compartida entre la Lasagna y el Short rib pappardelle. La misma preparación, dos formatos distintos.',
    usaRecetas: [],
    usadaEn: ['lasagna', 'short-rib-pappardelle'],
    ficha: {
      'Carne': '†',
      'Tomate': '†',
      'Vino tinto': '†',
      'Soffritto (cebolla, zanahoria, apio)': '†',
      'Tiempo de cocción': '†',
    },
    criterio: {
      bien:
        'Carne que se deshebra sola — completamente tierna. Salsa oscura, con cuerpo. El vino redujo y no hay acidez de alcohol crudo. Color café oscuro uniforme.',
      mal:
        'Carne todavía con resistencia: necesita más tiempo de cocción. Salsa aguada: no redujo lo suficiente. Sabor ácido de vino sin cocinar.',
    },
  },

  {
    slug: 'aioli-limon',
    titulo: 'Aïoli de limón',
    estacion: 'salsas-bases',
    tipo: 'subreceta',
    duracion: '3 min',
    descripcion:
      'Mayonesa de ajo emulsionada con limón. Base del Carpaccio de res.',
    usaRecetas: [],
    usadaEn: ['carpaccio-res'],
    ficha: {
      'Yema de huevo': '†',
      'Ajo': '†',
      'Jugo de limón': '†',
      'Aceite neutro': '†',
      'Sal': '†',
    },
    criterio: {
      bien:
        'Emulsión estable, cremosa, color amarillo pálido. El ajo es presente pero no agresivo. Se aplica en frío, en puntos o en línea fina sobre el carpaccio.',
      mal:
        'Si la emulsión se corta, el aceite se agregó muy rápido. Siempre a temperatura controlada — nunca con ingredientes calientes.',
    },
  },

  {
    slug: 'merengue-italiano',
    titulo: 'Merengue italiano',
    estacion: 'postres',
    tipo: 'subreceta',
    duracion: '8 min',
    descripcion:
      'Merengue estabilizado con almíbar caliente. Base del Pastel 3 leches de pistache y de la Pavlova. Técnica que requiere precisión de temperatura.',
    usaRecetas: [],
    usadaEn: ['tres-leches-pistache', 'pavlova'],
    ficha: {
      'Claras de huevo': '†',
      'Azúcar': '†',
      'Agua': '†',
      'Temperatura del almíbar': '118–121 °C',
    },
    criterio: {
      bien:
        'Picos firmes y brillantes. El merengue sostiene su forma sin colapsar. Temperatura del almíbar confirmada con termómetro — no aproximada.',
      mal:
        'Almíbar por debajo de 118 °C: merengue inestable, colapsa. Almíbar por arriba de 121 °C: las claras se cuecen y el merengue granula. Termómetro es obligatorio.',
    },
  },

  // ── SUBRECETAS BAR — PLACEHOLDER ────────────────────────────────────────

  {
    slug: 'jarabe-natural',
    titulo: 'Jarabe natural (bar) †',
    estacion: 'bar-bebidas',
    tipo: 'subreceta',
    duracion: '3 min',
    descripcion:
      'Jarabe de azúcar 1:1. Base de múltiples cócteles. Contenido de muestra — se actualiza con el menú de bar real.',
    usaRecetas: [],
    usadaEn: ['aperol-spritz', 'limoncello-spritz', 'americano-cocktail'],
    ficha: {
      'Azúcar': '500 g †',
      'Agua': '500 ml †',
      'Temperatura': 'Disolver sin hervir',
      'Rendimiento': '1 litro aprox. †',
    },
    criterio: {
      bien: 'Jarabe transparente, sin cristales. Completamente frío antes de usar.',
      mal: 'Si el jarabe cristaliza, la temperatura fue demasiado alta. Guardar refrigerado.',
    },
  },

  {
    slug: 'prep-citricos',
    titulo: 'Prep de cítricos (bar) †',
    estacion: 'bar-bebidas',
    tipo: 'subreceta',
    duracion: '3 min',
    descripcion:
      'Jugo fresco y zest de cítricos. Prep diaria de bar. Contenido de muestra — se actualiza con el menú de bar real.',
    usaRecetas: [],
    usadaEn: ['aperol-spritz', 'limoncello-spritz'],
    ficha: {
      'Limón amarillo (jugo)': 'al día †',
      'Naranja (jugo)': 'al día †',
      'Zest': 'para garnish †',
    },
    criterio: {
      bien: 'Jugos exprimidos el mismo día. Zest sin la parte blanca amarga.',
      mal: 'Jugo de día anterior: oxidado, pierde acidez y aroma. No usar.',
    },
  },

  {
    slug: 'estandar-de-garnish',
    titulo: 'Estándar de garnish (bar) †',
    estacion: 'bar-bebidas',
    tipo: 'subreceta',
    duracion: '4 min',
    descripcion:
      'Prep de garnishes por cóctel: rodajas, zests y twists. Contenido de muestra — se actualiza con el menú de bar real.',
    usaRecetas: [],
    usadaEn: ['aperol-spritz', 'negroni', 'limoncello-spritz', 'americano-cocktail'],
    ficha: {
      'Naranja (rodajas)': 'para Aperol Spritz y Americano †',
      'Naranja (twist)': 'para Negroni †',
      'Limón (twist)': 'para Limoncello Spritz †',
    },
    criterio: {
      bien: 'Garnishes cortados al momento del servicio. Grosor uniforme. Sin bordes oxidados.',
      mal: 'Garnishes de turno anterior: color café, textura flácida. Siempre cortar fresco.',
    },
  },

  // ── PROTOCOLOS ───────────────────────────────────────────────────────────

  {
    slug: 'terminos-carne',
    titulo: 'Términos de carne',
    estacion: 'protocolos',
    tipo: 'protocolo',
    duracion: '5 min',
    descripcion:
      'Temperatura interna real, tiempo de reposo y criterio visual. Aplica a Ribeye Choice, Ribeye Prime, Milanesa de filete y Pescado al limón.',
    usaRecetas: [],
    usadaEn: ['ribeye-choice', 'ribeye-prime', 'milanesa-filete', 'pescado-limon'],
    ficha: {
      'Rojo (Rare)': '48–50 °C',
      'Medium rare': '53–57 °C',
      'Medium': '58–63 °C',
      '3/4 (Medium well)': '63–69 °C',
      'Bien cocido': '71 °C+',
      'Reposo mínimo': '3 min antes de cortar',
      'Herramienta': 'Termómetro de inserción — obligatorio',
    },
    criterio: {
      bien:
        'Carne descansó el tiempo correcto — los jugos no se escapan al cortar. Corteza con Maillard uniforme, sin manchas grises. El término es exacto al pedido. Siempre confirmar con termómetro.',
      mal:
        'Jugos que forman charco en el plato: reposo insuficiente. Partes grises en el exterior: la parrilla estaba fría. Nunca pinchar la carne para revisar el término — se pierden los jugos.',
    },
  },

  {
    slug: 'fermentacion-48h',
    titulo: 'Fermentación de 48 horas',
    estacion: 'protocolos',
    tipo: 'protocolo',
    duracion: '4 min',
    descripcion:
      'El proceso completo de fermentación de la masa de pizza: mezcla, temperaturas, tiempos y señales visuales para cada fase. Requisito previo antes de trabajar con la masa.',
    usaRecetas: [],
    usadaEn: ['masa-48-horas'],
    ficha: {
      'Fase 1 — Mezcla': 'Temperatura de masa: 24–26 °C',
      'Fase 2 — Bulk (masa total)': '4–6 h a temperatura ambiente',
      'Fase 3 — Bollado': 'Porciones de 250 g †',
      'Fase 4 — Maduración': '48 h en refrigeración · 4 °C',
      'Fase 5 — Atemperado': '2 h antes de usar',
    },
    criterio: {
      bien:
        'Al final de las 48 h la masa creció 30–50%. Aroma suave a fermentación — ligeramente ácido, no alcohólico. Al presionar el bollito con el dedo, regresa lentamente: tiene fuerza.',
      mal:
        'Masa que no creció: levadura inactiva o temperatura de refrigeración muy baja. Aroma fuertemente alcohólico o muy ácido: fermentación excesiva — descartar el lote.',
    },
  },

  {
    slug: 'manejo-de-crudos',
    titulo: 'Manejo de crudos',
    estacion: 'protocolos',
    tipo: 'protocolo',
    duracion: '5 min',
    descripcion:
      'Protocolo de seguridad alimentaria para preparaciones crudas: tartar de atún, tiradito de jurel, carpaccio de res y pulpo. El consumo de alimentos crudos es responsabilidad de quien lo consume.',
    usaRecetas: [],
    usadaEn: ['tiradito-jurel', 'tartar-atun', 'carpaccio-res', 'pulpo-vinagreta'],
    ficha: {
      'Temperatura de trabajo': 'Superficies y utensilios a 4 °C o menos',
      'Cadena de frío': 'No interrumpir en ningún momento',
      'Fuente': 'Solo proveedores certificados',
      'Tiempo máximo fuera de frío': '30 min antes del servicio',
      'Tabla dedicada': 'Exclusiva para crudos — nunca compartir',
    },
    criterio: {
      bien:
        'Todo el flujo ocurre en frío. El producto tiene color brillante, aroma limpio, textura firme. Se prep inmediatamente antes del servicio.',
      mal:
        'Cualquier duda sobre la cadena de frío: no servir. Aroma distinto al normal, color opaco o textura blanda: descartar sin excepción.',
    },
  },

  // ── ENTRADAS ─────────────────────────────────────────────────────────────

  {
    slug: 'stracciatella-tomate',
    titulo: 'Stracciatella con tomate',
    estacion: 'entradas',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Stracciatella fría sobre tomate de temporada, con pan de masa madre. $209',
    usaRecetas: ['stracciatella', 'pan-masa-madre'],
    usadaEn: [],
    ficha: {
      'Stracciatella': '†',
      'Tomate de temporada': '†',
      'Pan masa madre': '2 rebanadas †',
      'Aceite de oliva extra virgen': '†',
      'Sal de mar': 'al terminar',
    },
    criterio: {
      bien:
        'La stracciatella está fría al servir. El tomate está a temperatura ambiente — no de refrigerador. El pan está templado. Contraste de texturas y temperaturas correcto.',
      mal:
        'Stracciatella caliente o líquida: salió del refrigerador con demasiado tiempo. Pan frío y duro: salió directo del congelador sin atemperar.',
    },
  },

  {
    slug: 'tiradito-jurel',
    titulo: 'Tiradito de jurel',
    estacion: 'entradas',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Jurel crudo en láminas finas con aderezo cítrico. Protocolo de manejo de crudos obligatorio. $329',
    usaRecetas: ['manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Jurel (lomo limpio)': '†',
      'Aderezo cítrico': '†',
      'Garnish': '†',
    },
    criterio: {
      bien:
        'Láminas uniformes, frías y brillantes. El aderezo se agrega al momento del servicio — nunca antes para no "cocinar" el pescado.',
      mal:
        'Láminas desiguales o con marcas de presión. Pescado que perdió brillo: se marinó demasiado tiempo en el ácido.',
    },
  },

  {
    slug: 'tartar-atun',
    titulo: 'Tartar de atún',
    estacion: 'entradas',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Atún de aleta amarilla picado a cuchillo con aderezo y pan de masa madre. $319',
    usaRecetas: ['manejo-de-crudos', 'pan-masa-madre'],
    usadaEn: [],
    ficha: {
      'Atún aleta amarilla (lomo)': '†',
      'Aderezo': '†',
      'Pan masa madre': '2 rebanadas †',
      'Garnish': '†',
    },
    criterio: {
      bien:
        'Picado a cuchillo — dados uniformes, no prensados. Aderezo incorporado justo antes del servicio. Temperatura del atún: entre 2–4 °C al llegar al plato.',
      mal:
        'Atún molido o triturado: textura perdida. Tartar armado con mucha anticipación: el ácido altera la textura y el color. Siempre prep al momento.',
    },
  },

  {
    slug: 'carpaccio-res',
    titulo: 'Carpaccio de res',
    estacion: 'entradas',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Res cruda en láminas muy finas con aïoli de limón, alcaparras y parmesano. $329',
    usaRecetas: ['manejo-de-crudos', 'aioli-limon'],
    usadaEn: [],
    ficha: {
      'Lomo de res (corte limpio)': '†',
      'Aïoli de limón': '†',
      'Alcaparras': '†',
      'Parmesano (viruta)': '†',
      'Aceite de oliva': 'al terminar',
    },
    criterio: {
      bien:
        'Láminas traslúcidas, uniformes, extendidas en frío. El aïoli en puntos — no cubre todo el plato. Temperatura de servicio: muy frío.',
      mal:
        'Láminas gruesas o irregulares: el corte fue incorrecto o la carne no estaba suficientemente fría/firme al momento de laminar.',
    },
  },

  {
    slug: 'pulpo-vinagreta',
    titulo: 'Pulpo a la vinagreta',
    estacion: 'entradas',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Pulpo cocinado con vinagreta de limón amarillo. Protocolo de cocción y temperatura al servicio. $429',
    usaRecetas: ['manejo-de-crudos', 'vinagreta-limon-amarillo'],
    usadaEn: [],
    ficha: {
      'Pulpo (cocido)': '†',
      'Vinagreta de limón amarillo': '†',
      'Garnish': '†',
    },
    criterio: {
      bien:
        'Pulpo completamente tierno — sin resistencia al morder. La vinagreta se aplica al servicio, no durante el recalentamiento. Temperatura del pulpo: caliente al centro.',
      mal:
        'Pulpo con chicle: falta tiempo de cocción. Vinagreta cocida con el pulpo: pierde acidez y aromas volátiles.',
    },
  },

  // ── ENSALADAS ─────────────────────────────────────────────────────────────

  {
    slug: 'arugula-limon',
    titulo: 'Arúgula al limón',
    estacion: 'ensaladas',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Arúgula fresca, pesto verde y limón. El pesto une esta entrada con la pizza Vodka Spiral. $189',
    usaRecetas: ['pesto-verde'],
    usadaEn: [],
    ficha: {
      'Arúgula fresca': '†',
      'Pesto verde': '†',
      'Limón (jugo y zest)': '†',
      'Parmesano (viruta)': '†',
    },
    criterio: {
      bien: 'Arúgula seca y fría — el agua residual diluye el aderezo. El pesto en puntos, no como aderezo total.',
      mal: 'Hojas aguadas o marchitas. Pesto aplicado con anticipación: la arúgula se oxida y se cae.',
    },
  },

  {
    slug: 'ensalada-pepinillos',
    titulo: 'Ensalada de pepinillos',
    estacion: 'ensaladas',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Ensalada fresca con pepinillos encurtidos. $199',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Pepinillos': '†',
      'Base de hojas': '†',
      'Aderezo': '†',
    },
    criterio: {
      bien: 'Pepinillos escurridos — sin líquido de encurtido sobre el plato. Balance agridulce presente.',
      mal: 'Líquido de pepinillo en el plato diluye todo el aderezo. Escurrir siempre.',
    },
  },

  {
    slug: 'ensalada-griega',
    titulo: 'Ensalada griega',
    estacion: 'ensaladas',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Tomate, pepino, aceituna y queso feta. $199',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Tomate': '†',
      'Pepino': '†',
      'Aceituna Kalamata': '†',
      'Queso feta': '†',
      'Aceite de oliva': '†',
      'Orégano seco': 'al terminar',
    },
    criterio: {
      bien: 'Verduras a temperatura ambiente, no del refrigerador directo. El feta sin desmenuzar demasiado — trozos generosos.',
      mal: 'Verduras frías de refrigerador: pierden sabor. Feta desmoronado en exceso: textura y presentación incorrecta.',
    },
  },

  {
    slug: 'cesar',
    titulo: 'Ensalada César',
    estacion: 'ensaladas',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Lechuga romana, aderezo César de la casa, crutones y parmesano. $199',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Lechuga romana': '†',
      'Aderezo César': '†',
      'Crutones': '†',
      'Parmesano (rallado)': '†',
      'Pimienta negra': 'recién molida',
    },
    criterio: {
      bien: 'Hojas frías y secas. Aderezo aplicado al momento — nunca con anticipación. Crutones crujientes.',
      mal: 'Aderezo aplicado mucho antes: las hojas se marchitan. Crutones blandos: guardados con humedad.',
    },
  },

  {
    slug: 'ensalada-salame',
    titulo: 'Ensalada salame',
    estacion: 'ensaladas',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Ensalada con salame y vinagreta de limón amarillo. La vinagreta une esta ensalada con el Pulpo a la vinagreta. $199',
    usaRecetas: ['vinagreta-limon-amarillo'],
    usadaEn: [],
    ficha: {
      'Base de hojas': '†',
      'Salame': '†',
      'Vinagreta de limón amarillo': '†',
      'Garnish': '†',
    },
    criterio: {
      bien: 'Salame a temperatura ambiente — no frío de refrigerador. Vinagreta al momento del servicio.',
      mal: 'Hojas marchitas por anticipación del aderezo. Salame rígido y frío.',
    },
  },

  // ── PASTA ─────────────────────────────────────────────────────────────────

  {
    slug: 'spaguetti-limon',
    titulo: 'Spaghetti al limón',
    estacion: 'pasta-fresca',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Spaghetti fresco con mantequilla, limón y parmesano. Pasta simple que exige la mejor ejecución. $259',
    usaRecetas: ['pasta-fresca-base'],
    usadaEn: [],
    ficha: {
      'Spaghetti fresco': '†',
      'Mantequilla': '†',
      'Limón (jugo y zest)': '†',
      'Parmesano': '†',
      'Agua de cocción': 'c/s para emulsionar',
    },
    criterio: {
      bien: 'La emulsión de mantequilla-agua cubre la pasta sin separarse. El limón es presente pero no domina. Al dente exacto.',
      mal: 'Mantequilla separada o aceitosa: calor excesivo. Pasta sobre-cocida: el limón no puede salvar la textura.',
    },
  },

  {
    slug: 'white-truffle-mafalde',
    titulo: 'White truffle mafalde',
    estacion: 'pasta-fresca',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Mafalde frescos con crema y trufa blanca. $299',
    usaRecetas: ['pasta-fresca-base'],
    usadaEn: [],
    ficha: {
      'Mafalde fresca': '†',
      'Crema': '†',
      'Aceite de trufa blanca': '†',
      'Parmesano': '†',
    },
    criterio: {
      bien: 'El aceite de trufa se agrega fuera del fuego — el calor destruye su aroma. La crema no hierve con el aceite de trufa.',
      mal: 'Aceite de trufa añadido mientras la sartén está muy caliente: el aroma se evapora y el platillo pierde su carácter.',
    },
  },

  {
    slug: 'ravioles-ricotta',
    titulo: 'Ravioles de ricotta y albahaca',
    estacion: 'pasta-fresca',
    tipo: 'platillo',
    duracion: '6 min',
    descripcion: 'Ravioles de pasta fresca rellenos de ricotta y albahaca, con mantequilla dorada y salvia. $299',
    usaRecetas: ['pasta-fresca-base'],
    usadaEn: [],
    ficha: {
      'Pasta fresca (laminada)': '†',
      'Ricotta': '†',
      'Albahaca picada': '†',
      'Pecorino (en el relleno)': '†',
      'Mantequilla (para la salsa)': '†',
      'Salvia': '4 hojas',
    },
    criterio: {
      bien: 'Sello hermético — sin burbujas de aire. La mantequilla está dorada (noisette), no quemada. La pasta es traslúcida y uniforme.',
      mal: 'Ravioles que se abren al cocer: sello incorrecto o masa muy húmeda en los bordes. Mantequilla café oscuro o amarga: pasó el punto.',
    },
  },

  {
    slug: 'spicy-vodka-rigatoni',
    titulo: 'Spicy vodka rigatoni',
    estacion: 'pasta-fresca',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Rigatoni fresco con salsa spicy vodka y stracciatella al terminar. La stracciatella une este plato con la entrada y la pizza. $299',
    usaRecetas: ['pasta-fresca-base', 'salsa-spicy-vodka', 'stracciatella'],
    usadaEn: [],
    ficha: {
      'Rigatoni fresco': '†',
      'Salsa spicy vodka': '†',
      'Stracciatella': '†',
    },
    criterio: {
      bien: 'La stracciatella se agrega fuera del fuego, en el último momento. La salsa tiene cuerpo y cubre bien los rigatoni. Temperatura alta al servir.',
      mal: 'Stracciatella agregada al fuego: se rompe y se vuelve aguada. La salsa escurre en el fondo del plato: falta reducción.',
    },
  },

  {
    slug: 'carbonara',
    titulo: 'Carbonara',
    estacion: 'pasta-fresca',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Pasta fresca, yema curada, guanciale, pecorino. Sin crema — nunca. La técnica es la receta. $309',
    usaRecetas: ['pasta-fresca-base'],
    usadaEn: [],
    ficha: {
      'Pasta fresca': '†',
      'Guanciale': '†',
      'Yema de huevo': '2 piezas †',
      'Pecorino romano': '†',
      'Pimienta negra': 'abundante, recién molida',
      'Agua de cocción': 'c/s para emulsionar',
    },
    criterio: {
      bien: 'Salsa cremosa y brillante, se adhiere a la pasta. La yema no coaguló. El guanciale crujiente afuera, tierno adentro. Sin crema en ningún caso.',
      mal: 'Salsa granulada o yema en hebras: calor demasiado alto. Bajar temperatura y usar más agua de cocción. Nunca agregar crema.',
    },
  },

  {
    slug: 'bucatini-arrabiata',
    titulo: 'Bucatini arrabiata con nduja',
    estacion: 'pasta-fresca',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Bucatini fresco en salsa arrabiata picante con nduja y stracciatella al terminar. $309',
    usaRecetas: ['pasta-fresca-base', 'stracciatella'],
    usadaEn: [],
    ficha: {
      'Bucatini fresco': '†',
      'Salsa arrabiata': '†',
      'Nduja': '†',
      'Stracciatella': '†',
    },
    criterio: {
      bien: 'La nduja se derrite en la salsa caliente, aportando grasa y picante. La stracciatella se agrega al momento del servicio — fría sobre la pasta caliente.',
      mal: 'Nduja sin integrarse: se cocinó poco. Stracciatella caliente: se aplicó con el fuego encendido.',
    },
  },

  {
    slug: 'short-rib-pappardelle',
    titulo: 'Short rib pappardelle',
    estacion: 'pasta-fresca',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Pappardelle fresca con ragú de short rib estofado. $329',
    usaRecetas: ['pasta-fresca-base', 'ragu'],
    usadaEn: [],
    ficha: {
      'Pappardelle fresca': '†',
      'Ragú de short rib': '†',
      'Parmesano': '†',
      'Gremolata o hierba al terminar': '†',
    },
    criterio: {
      bien: 'El ragú cubre generosamente la pappardelle. La carne se ve en trozos visibles — no molida. La pasta al dente con la salsa incorporada.',
      mal: 'Pasta sobre-cocida con ragú encima pero sin mezclar: se ve apilado. Integrar siempre en la sartén.',
    },
  },

  {
    slug: 'lasagna',
    titulo: 'Lasagna',
    estacion: 'pasta-fresca',
    tipo: 'platillo',
    duracion: '6 min',
    descripcion: 'Lasagna con pasta fresca, ragú y bechamel. La más compleja del sistema: usa 3 subrecetas base. $329',
    usaRecetas: ['pasta-fresca-base', 'bechamel-salsa-blanca', 'ragu'],
    usadaEn: [],
    ficha: {
      'Láminas de pasta fresca': '†',
      'Ragú': '†',
      'Bechamel': '†',
      'Parmesano': '†',
      'Capas': '†',
    },
    criterio: {
      bien: 'Capas bien definidas al corte. El centro llega a temperatura: 70 °C+ para servir. La bechamel no se separó durante el horneado.',
      mal: 'Centro frío: no alcanzó temperatura. Capas que se derrumban al corte: falta tiempo de horneado o reposo antes de porcionar.',
    },
  },

  // ── PIZZAS ───────────────────────────────────────────────────────────────

  {
    slug: 'pizza-margherita',
    titulo: 'Pizza Margherita',
    estacion: 'pizzas',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'El clásico de Spiral. Pomodoro, mozzarella fior di latte, albahaca fresca. El estándar de la casa. $289',
    usaRecetas: ['masa-48-horas', 'salsa-pomodoro'],
    usadaEn: [],
    ficha: {
      'Base de masa (30 cm)': '250 g †',
      'Salsa pomodoro': '80 g †',
      'Mozzarella fior di latte': '120 g †',
      'Albahaca fresca': '5 hojas',
      'Aceite de oliva': 'al terminar',
      'Horno': '350 °C+ · 3–4 min',
    },
    criterio: {
      bien: 'Cornicione inflado con manchas oscuras. La mozzarella se fundió pero no se quemó — manchas doradas, no cafés. Centro cocido, no flácido.',
      mal: 'Centro acuoso o crudo: temperatura o humedad de ingredientes incorrecta. Borde pálido: horno frío. Mozzarella quemada: entró demasiado fría.',
    },
  },

  {
    slug: 'pizza-alcachofa',
    titulo: 'Pizza Alcachofa espinaca trufa',
    estacion: 'pizzas',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Base blanca con alcachofas, espinaca y aceite de trufa. $349',
    usaRecetas: ['masa-48-horas'],
    usadaEn: [],
    ficha: {
      'Base de masa (30 cm)': '250 g †',
      'Base blanca': '†',
      'Alcachofa': '†',
      'Espinaca': '†',
      'Aceite de trufa': '†',
      'Horno': '350 °C+ · 3–4 min',
    },
    criterio: {
      bien: 'El aceite de trufa se agrega fuera del horno, en frío. La espinaca no se quemó. Base bien cocida en el centro.',
      mal: 'Aceite de trufa aplicado dentro del horno: el aroma se pierde por completo. Espinaca con exceso de agua: humedeció la base.',
    },
  },

  {
    slug: 'pizza-salame-pepperoncino',
    titulo: 'Pizza Salame pepperoncino',
    estacion: 'pizzas',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Base de bechamel con salame y pepperoncino. $349',
    usaRecetas: ['masa-48-horas', 'bechamel-salsa-blanca'],
    usadaEn: [],
    ficha: {
      'Base de masa (30 cm)': '250 g †',
      'Bechamel': '†',
      'Salame': '†',
      'Pepperoncino': '†',
      'Horno': '350 °C+ · 3–4 min',
    },
    criterio: {
      bien: 'La bechamel en capa uniforme — no chorreada. El salame se crujeó ligeramente en los bordes. La base está cocida al centro.',
      mal: 'Bechamel que se escurre al sacar del horno: estaba demasiado fluida. El salame pálido y sin textura: horno frío.',
    },
  },

  {
    slug: 'pizza-pepperoni',
    titulo: 'Pizza Pepperoni clásica',
    estacion: 'pizzas',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'El favorito de siempre. Pomodoro, mozzarella y pepperoni de calidad. $349',
    usaRecetas: ['masa-48-horas', 'salsa-pomodoro'],
    usadaEn: [],
    ficha: {
      'Base de masa (30 cm)': '250 g †',
      'Salsa pomodoro': '80 g †',
      'Mozzarella': '†',
      'Pepperoni': '†',
      'Horno': '350 °C+ · 3–4 min',
    },
    criterio: {
      bien: 'El pepperoni tiene los bordes rizados — señal de que el horno estaba a temperatura. No está plano ni pálido.',
      mal: 'Pepperoni plano y pálido: el horno estaba frío o se puso en frío.',
    },
  },

  {
    slug: 'pizza-prosciutto',
    titulo: 'Pizza Prosciutto balsámico',
    estacion: 'pizzas',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Pomodoro, mozzarella, prosciutto y reducción balsámica. El prosciutto entra fuera del horno. $349',
    usaRecetas: ['masa-48-horas', 'salsa-pomodoro'],
    usadaEn: [],
    ficha: {
      'Base de masa (30 cm)': '250 g †',
      'Salsa pomodoro': '80 g †',
      'Mozzarella': '†',
      'Prosciutto': '†',
      'Reducción balsámica': '†',
      'Horno': '350 °C+ · 3–4 min',
    },
    criterio: {
      bien: 'El prosciutto se coloca FUERA del horno sobre la pizza ya cocida — nunca adentro. La reducción balsámica al terminar en hilo fino.',
      mal: 'Prosciutto que entró al horno: se seca y pierde textura. Reducción aplicada antes de servir: se absorbe y desaparece.',
    },
  },

  {
    slug: 'pizza-vodka-spiral',
    titulo: 'Pizza Vodka Spiral',
    estacion: 'pizzas',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'La firma de la casa. Salsa spicy vodka, mozzarella, stracciatella y pesto verde. 4 bases en una sola pizza. $349',
    usaRecetas: ['masa-48-horas', 'salsa-spicy-vodka', 'stracciatella', 'pesto-verde'],
    usadaEn: [],
    ficha: {
      'Base de masa (30 cm)': '250 g †',
      'Salsa spicy vodka': '†',
      'Mozzarella': '†',
      'Stracciatella': '†',
      'Pesto verde': '†',
      'Horno': '350 °C+ · 3–4 min',
    },
    criterio: {
      bien: 'La stracciatella y el pesto se agregan FUERA del horno, en frío. La salsa spicy vodka tiene cuerpo y no se escurre. La base totalmente cocida.',
      mal: 'Stracciatella o pesto aplicados antes del horno: los dos pierden su carácter al calentarse. La pizza más compleja de la carta — no se puede improvisar.',
    },
  },

  {
    slug: 'pizza-spicy-honey',
    titulo: 'Pizza Spicy honey pepperoni',
    estacion: 'pizzas',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Pepperoni, miel de chile y pomodoro. El contraste dulce-picante de la carta. $349',
    usaRecetas: ['masa-48-horas', 'salsa-pomodoro'],
    usadaEn: [],
    ficha: {
      'Base de masa (30 cm)': '250 g †',
      'Salsa pomodoro': '80 g †',
      'Mozzarella': '†',
      'Pepperoni': '†',
      'Miel de chile (spicy honey)': '†',
      'Horno': '350 °C+ · 3–4 min',
    },
    criterio: {
      bien: 'La miel de chile se aplica fuera del horno — el calor directo la quema y amarga. El pepperoni con bordes rizados.',
      mal: 'Miel de chile dentro del horno: se carameliza demasiado y amarga. El dulce y el picante deben llegar frescos al plato.',
    },
  },

  {
    slug: 'pizza-nduja-pomodoro',
    titulo: 'Pizza Nduja pomodoro',
    estacion: 'pizzas',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Pomodoro, nduja, stracciatella. La nduja se derrite en el horno y da carácter a toda la pizza. $369',
    usaRecetas: ['masa-48-horas', 'salsa-pomodoro', 'stracciatella'],
    usadaEn: [],
    ficha: {
      'Base de masa (30 cm)': '250 g †',
      'Salsa pomodoro': '80 g †',
      'Nduja': '†',
      'Stracciatella': '†',
      'Horno': '350 °C+ · 3–4 min',
    },
    criterio: {
      bien: 'La nduja se derritió y distribuyó durante la cocción — puntos rojos de grasa integrados. La stracciatella fría al terminar, sobre la base caliente.',
      mal: 'Nduja en trozos sin derretirse: horno frío o porciones muy grandes. Stracciatella caliente y líquida: se agregó antes de sacar del horno.',
    },
  },

  // ── PLATOS FUERTES ───────────────────────────────────────────────────────

  {
    slug: 'milanesa-filete',
    titulo: 'Milanesa de filete parmesana',
    estacion: 'platos-fuertes',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Milanesa de filete 200g con salsa parmesana. Empanizado y término al punto. $429',
    usaRecetas: ['terminos-carne'],
    usadaEn: [],
    ficha: {
      'Filete de res': '200 g',
      'Empanizado': '†',
      'Salsa parmesana': '†',
      'Temperatura interna': 'ver protocolo de términos',
    },
    criterio: {
      bien: 'Empanizado dorado y crujiente uniforme. La carne en el término solicitado — confirmar con termómetro. Sin exceso de aceite al emplatar.',
      mal: 'Empanizado pálido: aceite frío. Empanizado quemado: aceite demasiado caliente. Centro frío o sin cocción: temperatura incorrecta.',
    },
  },

  {
    slug: 'pescado-limon',
    titulo: 'Pescado al limón',
    estacion: 'platos-fuertes',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Pescado 325g con limón, mantequilla y hierbas. Temperatura interna controlada. $689',
    usaRecetas: ['terminos-carne'],
    usadaEn: [],
    ficha: {
      'Filete de pescado': '325 g',
      'Mantequilla': '†',
      'Limón (jugo)': '†',
      'Hierbas frescas': '†',
      'Temperatura interna': '63 °C (bien cocido para pescado)',
    },
    criterio: {
      bien: 'La carne se separa en láminas naturalmente al presionar con el tenedor. Color opaco hasta el centro. La mantequilla forma una salsa brillante.',
      mal: 'Centro traslúcido o resistente: falta cocción. Mantequilla quemada y sin brillo: temperatura excesiva. El pescado no tiene corrección posible si se sobre-cocina.',
    },
  },

  {
    slug: 'ribeye-choice',
    titulo: 'Ribeye Choice 450g',
    estacion: 'platos-fuertes',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Ribeye Choice 450g. Temperatura interna confirmada con termómetro según el protocolo de términos de carne. $799',
    usaRecetas: ['terminos-carne'],
    usadaEn: [],
    ficha: {
      'Ribeye Choice': '450 g',
      'Temperatura interna': 'según pedido — ver protocolo',
      'Reposo': '3 min mínimo antes de cortar',
      'Garnish': '†',
    },
    criterio: {
      bien: 'Corteza con Maillard uniforme. Temperatura confirmada con termómetro. Reposo completo antes del corte — los jugos se quedan en la carne.',
      mal: 'Jugos que forman charco al cortar: reposo insuficiente. Partes grises en el exterior: parrilla fría. No adivinar el término — siempre termómetro.',
    },
  },

  {
    slug: 'ribeye-prime',
    titulo: 'Ribeye Prime 450g',
    estacion: 'platos-fuertes',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Ribeye Prime 450g. Mayor marmoleo que el Choice — el punto cambia más rápido. Termómetro obligatorio. $1,099',
    usaRecetas: ['terminos-carne'],
    usadaEn: [],
    ficha: {
      'Ribeye Prime': '450 g',
      'Temperatura interna': 'según pedido — ver protocolo',
      'Reposo': '3 min mínimo antes de cortar',
      'Nota': 'Mayor marmoleo: conduce más calor. Sube de término más rápido que el Choice.',
    },
    criterio: {
      bien: 'El marmoleo se distribuyó durante la cocción — la carne está brillante al corte. Temperatura confirmada con termómetro. Reposo completo.',
      mal: 'Término más allá del pedido: el corte de mayor marmoleo pierde todo su valor si se sobre-cocina. No hay corrección posible para el ribeye prime sobre-cocido.',
    },
  },

  // ── POSTRES ───────────────────────────────────────────────────────────────

  {
    slug: 'affogato',
    titulo: 'Affogato',
    estacion: 'postres',
    tipo: 'platillo',
    duracion: '2 min',
    descripcion: 'Espresso sobre helado de vainilla. Velocidad y temperatura son todo en este postre. $89',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Helado de vainilla': '†',
      'Espresso (doble)': '60 ml aprox.',
    },
    criterio: {
      bien: 'El espresso se vierte caliente sobre el helado frío en el momento del servicio — en la mesa o segundos antes de salir. El contraste de temperatura es el platillo.',
      mal: 'Espresso frío o tibio: el affogato pierde su razón de ser. Preparado con anticipación: el helado se derritió demasiado.',
    },
  },

  {
    slug: 'sorbete-citrico',
    titulo: 'Sorbete cítrico',
    estacion: 'postres',
    tipo: 'platillo',
    duracion: '2 min',
    descripcion: 'Sorbete de cítrico de la casa. Temperatura de servicio y presentación. $89',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Sorbete cítrico': '†',
      'Temperatura de servicio': '-18 °C o menor al emplatar',
      'Garnish': '†',
    },
    criterio: {
      bien: 'Textura firme pero que cede al presionar con la cuchara. Cristales de hielo uniformes — no es granizado. Color vivo.',
      mal: 'Textura blanda o aguada: la cadena de frío se interrumpió. Emplatar siempre en copa o plato pre-enfriado.',
    },
  },

  {
    slug: 'pavlova',
    titulo: 'Pavlova',
    estacion: 'postres',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Base de merengue italiano, crema y fruta fresca. Individual $169 / para compartir $229',
    usaRecetas: ['merengue-italiano'],
    usadaEn: [],
    ficha: {
      'Merengue italiano (horneado)': '†',
      'Crema batida': '†',
      'Fruta fresca de temporada': '†',
    },
    criterio: {
      bien: 'El exterior del merengue es crujiente y el interior suave y húmedo. La crema se aplica al momento del servicio — nunca antes. La fruta fresca y brillante.',
      mal: 'Merengue blando en el exterior: falta tiempo de horneado. Crema aplicada con anticipación: ablanda el merengue.',
    },
  },

  {
    slug: 'flourless-chocolate',
    titulo: 'Flourless dark chocolate tart',
    estacion: 'postres',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Tarta de chocolate oscuro sin harina. Densa, húmeda y servida a temperatura controlada. $229',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Chocolate oscuro': '†',
      'Mantequilla': '†',
      'Huevo': '†',
      'Azúcar': '†',
      'Temperatura de servicio': 'temperatura ambiente',
    },
    criterio: {
      bien: 'Textura húmeda y densa, no esponjosa. Se sirve a temperatura ambiente — nunca fría del refrigerador. El centro es levemente fundente.',
      mal: 'Tarta fría del refrigerador: la textura se vuelve dura y la experiencia se pierde. Siempre atemperar mínimo 30 min antes del servicio.',
    },
  },

  {
    slug: 'tarta-durazno',
    titulo: 'Tarta de durazno / pera',
    estacion: 'postres',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Tarta de fruta de temporada. Durazno o pera según disponibilidad. $229',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Masa de tarta': '†',
      'Crema de almendra (frangipane)': '†',
      'Fruta de temporada': '†',
      'Glasé o brillo': '†',
    },
    criterio: {
      bien: 'La masa está completamente cocida, sin zonas crudas. La fruta brillante con el glasé aplicado. Temperatura: ligeramente tibia o temperatura ambiente.',
      mal: 'Masa cruda en la base: necesita más tiempo de horneado o ciego previo. Fruta sin glasé: se seca y opaca visualmente.',
    },
  },

  {
    slug: 'tiramisu',
    titulo: 'Tiramisú',
    estacion: 'postres',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Tiramisú clásico de la casa. Frío, firme y con capas bien definidas. $239',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Mascarpone': '†',
      'Yema (curada)': '†',
      'Savoiardi': '†',
      'Espresso': '†',
      'Cacao en polvo': 'al terminar',
      'Refrigeración mínima': '6 h',
    },
    criterio: {
      bien: 'Capas bien definidas al corte. Frío y firme — no se derrumba. El savoiardi absorbe el espresso pero no está empapado hasta desintegrarse.',
      mal: 'Tiramisú que no mantiene forma: falta tiempo de refrigeración. Savoiardi demasiado empapado: se disolvió en el espresso.',
    },
  },

  {
    slug: 'tres-leches-pistache',
    titulo: 'Pastel 3 leches de pistache',
    estacion: 'postres',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Bizcocho empapado en 3 leches con merengue italiano de pistache. El postre más técnico de la carta. $239',
    usaRecetas: ['merengue-italiano'],
    usadaEn: [],
    ficha: {
      'Bizcocho (por porción)': '†',
      'Mezcla 3 leches': '†',
      'Merengue italiano de pistache': '†',
      'Pistache picado': 'al terminar',
    },
    criterio: {
      bien: 'El bizcocho está uniformemente empapado — húmedo hasta el centro sin desintegrarse. El merengue firme y brillante, con picos. Temperatura: frío.',
      mal: 'Bizcocho seco en el centro: falta tiempo de empapado. Merengue que colapsa: problema en el proceso del merengue italiano.',
    },
  },

  // ── BAR / BEBIDAS — PLACEHOLDER ──────────────────────────────────────────

  {
    slug: 'aperol-spritz',
    titulo: 'Aperol Spritz †',
    estacion: 'bar-bebidas',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Aperol, prosecco, soda. Build directo en copa. Contenido de muestra — se actualiza con el menú de bar real. $†',
    usaRecetas: ['jarabe-natural', 'prep-citricos', 'estandar-de-garnish'],
    usadaEn: [],
    ficha: {
      'Aperol': '†',
      'Prosecco': '†',
      'Soda': '†',
      'Hielo (cubo grande)': '†',
      'Garnish': 'rodaja de naranja †',
    },
    criterio: {
      bien: 'Build en orden correcto. La naranja como garnish, no sumergida. La proporción garantiza el color naranja característico.',
      mal: 'Proporciones incorrectas: el color se oscurece o se pierde. Siempre construir sobre hielo limpio, nunca sobre hielo de agua.',
    },
  },

  {
    slug: 'negroni',
    titulo: 'Negroni †',
    estacion: 'bar-bebidas',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Gin, Campari, vermut dulce. Revuelto, no agitado. Contenido de muestra — se actualiza con el menú de bar real. $†',
    usaRecetas: ['estandar-de-garnish'],
    usadaEn: [],
    ficha: {
      'Gin': '†',
      'Campari': '†',
      'Vermut dulce': '†',
      'Hielo': '†',
      'Garnish': 'twist de naranja †',
    },
    criterio: {
      bien: 'Revuelto 30–40 vueltas — frío sin diluir en exceso. El twist de naranja se exprime sobre la copa antes de colocar.',
      mal: 'Negroni agitado: la turbidez rompe la estética del cóctel. Revolver siempre, nunca agitar.',
    },
  },

  {
    slug: 'limoncello-spritz',
    titulo: 'Limoncello Spritz †',
    estacion: 'bar-bebidas',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Limoncello, prosecco, soda y cítrico. Aperitivo ligero. Contenido de muestra — se actualiza con el menú de bar real. $†',
    usaRecetas: ['jarabe-natural', 'prep-citricos', 'estandar-de-garnish'],
    usadaEn: [],
    ficha: {
      'Limoncello': '†',
      'Prosecco': '†',
      'Soda': '†',
      'Jugo de limón amarillo': '†',
      'Garnish': 'twist de limón †',
    },
    criterio: {
      bien: 'El cítrico fresco equilibra el dulce del limoncello. Servido muy frío, copa enfriada.',
      mal: 'Sin jugo de limón fresco: el limoncello domina y pierde balance. El cítrico fresco es el contrapeso.',
    },
  },

  {
    slug: 'americano-cocktail',
    titulo: 'Americano (cóctel) †',
    estacion: 'bar-bebidas',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Campari, vermut dulce y soda. El aperitivo italiano más sencillo. Contenido de muestra — se actualiza con el menú de bar real. $†',
    usaRecetas: ['jarabe-natural', 'estandar-de-garnish'],
    usadaEn: [],
    ficha: {
      'Campari': '†',
      'Vermut dulce': '†',
      'Soda': '†',
      'Hielo': '†',
      'Garnish': 'rodaja de naranja †',
    },
    criterio: {
      bien: 'La soda se agrega al último, vertiéndola suavemente para no perder la carbonatación. El cóctel se sirve en highball con abundante hielo.',
      mal: 'Soda agitada: pierde gas y el cóctel queda plano. Siempre agregar la soda al final y con movimiento suave.',
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
      'Domina la estación de pizzas de Spiral: desde el protocolo de fermentación hasta los 8 platillos de la carta. Las subrecetas base van primero — cada pizza las reutiliza.',
    puesto: 'Cocinero · Estación Pizzas',
    modulos: [
      'terminos-carne',
      'fermentacion-48h',
      'masa-48-horas',
      'salsa-pomodoro',
      'salsa-spicy-vodka',
      'bechamel-salsa-blanca',
      'stracciatella',
      'pesto-verde',
      'pizza-margherita',
      'pizza-pepperoni',
      'pizza-prosciutto',
      'pizza-spicy-honey',
      'pizza-nduja-pomodoro',
      'pizza-vodka-spiral',
      'pizza-salame-pepperoncino',
      'pizza-alcachofa',
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
