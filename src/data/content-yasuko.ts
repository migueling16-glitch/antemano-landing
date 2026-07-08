// ─────────────────────────────────────────────────────────────────────────────
// Manual Vivo™ × Yasuko — Contenido del portal de capacitación
//
// PARA AGREGAR UN MÓDULO: añade un objeto al array MODULOS y reinicia el servidor.
// PARA CAMBIAR UN VIDEO:  agrega `videoUrl: "https://..."` al módulo — el
//   reproductor lo toma automáticamente y reemplaza el placeholder.
// GRAMAJES CON †: pendiente de validación con el chef. Precios: del menú real.
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
  /** slugs de módulos donde esta subreceta/protocolo aparece */
  usadaEn: string[];
  videoUrl?: string;
  ficha?: FichaTecnica;
  criterio?: CriterioCalidad;
}

export interface Estacion {
  slug: string;
  titulo: string;
  descripcion: string;
  /** Nota de aviso visible en la página de la estación */
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
// cuando los videos reales estén listos.
const DEMO_VIDEO_URL = 'https://www.youtube.com/embed/RkIhIuhGMZM?rel=0';

// ─────────────────────────────────────────────────────────────────────────────
// ESTACIONES
// ─────────────────────────────────────────────────────────────────────────────

export const ESTACIONES: Estacion[] = [
  {
    slug: 'protocolos',
    titulo: 'Protocolos de operación',
    descripcion: 'Apertura, recepción, producción, crudos, servicio, limpieza y cierre. El restaurante completo, documentado.',
  },
  {
    slug: 'entradas-frias',
    titulo: 'Entradas frías',
    descripcion: 'Ensaladas, tostadas, battera, crispy rice y tataki. La primera impresión de la mesa.',
  },
  {
    slug: 'entradas-calientes',
    titulo: 'Entradas calientes',
    descripcion: 'Edamames, gyozas, tempura y wok. La estación de fuego de Yasuko.',
  },
  {
    slug: 'sopas',
    titulo: 'Sopas',
    descripcion: 'Miso y ramen. Fondos de horas, servidos en minutos.',
  },
  {
    slug: 'arroces',
    titulo: 'Arroces',
    descripcion: 'Yakimeshi al wok y donburi. El arroz gohan como base de todo.',
  },
  {
    slug: 'barra-fria',
    titulo: 'Barra fría',
    descripcion: 'Nigiris, sashimi y tiraditos. El corte es la técnica; la frescura, la regla.',
  },
  {
    slug: 'rollos',
    titulo: 'Rollos',
    descripcion: 'Los 15 rollos de la carta, hand rolls y hoso maki. Todos nacen del shari.',
  },
  {
    slug: 'bases-salsas',
    titulo: 'Bases y salsas',
    descripcion: 'Shari, spicy mayo, salsa de anguila, ponzu y las demás bases que arman la carta. El núcleo del sistema.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULOS
// ─────────────────────────────────────────────────────────────────────────────

export const MODULOS: Modulo[] = [

  // ── SUBRECETAS BASE ──────────────────────────────────────────────────────

  {
    // HÉROE DEL SISTEMA: 1 subreceta → 20 módulos de 5 categorías
    slug: 'shari',
    titulo: 'Shari — arroz de sushi',
    estacion: 'bases-salsas',
    tipo: 'subreceta',
    duracion: '8 min',
    descripcion:
      'El arroz avinagrado que sostiene toda la barra: nigiris, battera, crispy rice, los 15 rollos, hand rolls y hoso maki. Si el shari está mal, todo lo demás está mal. La subreceta más reutilizada de Yasuko.',
    usaRecetas: ['produccion-diaria'],
    usadaEn: [
      'battera', 'crispy-rice', 'nigiri-tecnica',
      'maguro-trufa-roll', 'spicy-tuna-salmon-roll', 'trufa-hamachi-roll',
      'crunchy-callo', 'yasuko-roll', 'dragon-roll', 'hot-roll',
      'anguila-unagi-especial', 'okinawa-chutoro', 'jalapeno-roll',
      'soft-shell-crab', 'everest-roll', 'futo-maguro', 'rainbow',
      'lemon-salmon-roll', 'hand-rolls', 'hoso-maki',
    ],
    ficha: {
      'Arroz de grano corto': '†',
      'Lavado': 'hasta agua transparente',
      'Vinagre de arroz (awasezu)': '†',
      'Azúcar y sal': '†',
      'Temperatura de trabajo': 'temperatura corporal (36–38 °C)',
      'Vida útil': 'solo el turno — nunca se refrigera ni se guarda',
    },
    criterio: {
      bien:
        'Granos enteros, brillantes y separados — se distinguen uno a uno pero se sostienen juntos. Temperatura corporal al armar: ni caliente ni frío. El vinagre se percibe como aroma, no como acidez agresiva.',
      mal:
        'Arroz batido o pastoso: se mezcló en caliente con movimientos de amasado en lugar de cortes. Arroz frío de refrigerador: cristalizó y se endurece — el shari nunca se refrigera, se produce por turno y se descarta.',
    },
  },

  {
    slug: 'arroz-gohan',
    titulo: 'Arroz gohan',
    estacion: 'bases-salsas',
    tipo: 'subreceta',
    duracion: '4 min',
    descripcion:
      'Arroz blanco al vapor. Base de los donburi y del yakimeshi, y se vende solo ($59). No lleva vinagre — es la contraparte neutra del shari.',
    usaRecetas: ['produccion-diaria'],
    usadaEn: ['yakimeshi', 'donburi'],
    ficha: {
      'Arroz de grano corto': '†',
      'Proporción agua': '†',
      'Reposo tras cocción': '10 min tapado',
      'Precio en carta (solo)': '$59',
    },
    criterio: {
      bien:
        'Granos cocidos por completo, sueltos y brillantes. Para yakimeshi se usa gohan del día anterior refrigerado — el grano firme no se bate en el wok.',
      mal:
        'Arroz aguado o con centro duro: proporción de agua incorrecta. Yakimeshi con arroz recién hecho: se apelmaza y suelta almidón en el wok.',
    },
  },

  {
    slug: 'spicy-mayo',
    titulo: 'Spicy mayo',
    estacion: 'bases-salsas',
    tipo: 'subreceta',
    duracion: '3 min',
    descripcion:
      'La salsa más reutilizada después del shari: aparece en 15 módulos de la carta, de las tostadas a los rollos y el donburi. Una sola receta, un solo sabor en toda la casa.',
    usaRecetas: [],
    usadaEn: [
      'battera', 'tostadas', 'donburi', 'tiradito-serrano-ponzu',
      'crunchy-callo', 'yasuko-roll', 'dragon-roll', 'hot-roll',
      'jalapeno-roll', 'soft-shell-crab', 'everest-roll',
      'lemon-salmon-roll', 'hand-rolls', 'hoso-maki', 'firecracker-cauliflower',
    ],
    ficha: {
      'Mayonesa japonesa': '†',
      'Sriracha': '†',
      'Aceite de ajonjolí': '†',
      'Vida útil refrigerada': '†',
    },
    criterio: {
      bien:
        'Color naranja uniforme, consistencia que sostiene línea al aplicarse con biberón. El mismo tono en cada platillo — es la firma visual de la casa.',
      mal:
        'Color distinto entre lotes: las proporciones se hicieron al ojo. La spicy mayo se prepara con receta y báscula, nunca al tanteo.',
    },
  },

  {
    slug: 'salsa-anguila',
    titulo: 'Salsa de anguila (unagi)',
    estacion: 'bases-salsas',
    tipo: 'subreceta',
    duracion: '4 min',
    descripcion:
      'Reducción dulce-salada que termina los rollos calientes y glasea el nigiri de anguila. Brillo y cuerpo son el estándar.',
    usaRecetas: [],
    usadaEn: ['nigiri-tecnica', 'yasuko-roll', 'dragon-roll', 'hot-roll', 'everest-roll'],
    ficha: {
      'Salsa de soya': '†',
      'Mirin': '†',
      'Azúcar': '†',
      'Reducción': 'hasta punto de jarabe ligero',
    },
    criterio: {
      bien:
        'Brillante, con cuerpo de jarabe: dibuja línea sobre el rollo sin escurrirse ni encharcarse. Sabor dulce-salado balanceado.',
      mal:
        'Salsa aguada que se escurre: falta reducción. Salsa que endurece al enfriar: se pasó de punto — rehidratar con mirin caliente.',
    },
  },

  {
    slug: 'ponzu',
    titulo: 'Salsa ponzu',
    estacion: 'bases-salsas',
    tipo: 'subreceta',
    duracion: '3 min',
    descripcion:
      'Soya cítrica base de los tiraditos y el tataki de res. Siempre fría — el ácido es su carácter.',
    usaRecetas: [],
    usadaEn: ['tataki-res', 'tiradito-serrano-ponzu', 'tiradito-hamachi'],
    ficha: {
      'Salsa de soya': '†',
      'Cítricos (yuzu/limón)': '†',
      'Mirin': '†',
      'Reposo': '†',
    },
    criterio: {
      bien:
        'Balance entre salado y cítrico — ninguno domina. Se sirve fría y se aplica al momento: sobre pescado crudo, el ácido "cocina" si se adelanta.',
      mal:
        'Ponzu aplicada con anticipación sobre el tiradito: el corte pierde color y textura. Siempre salsear al pase, nunca antes.',
    },
  },

  {
    slug: 'aderezo-trufa',
    titulo: 'Aderezo de trufa',
    estacion: 'bases-salsas',
    tipo: 'subreceta',
    duracion: '3 min',
    descripcion:
      'El aderezo premium de la casa: firma de los rollos de trufa, el tataki y el unagi especial. Se dosifica — la trufa perfuma, no domina.',
    usaRecetas: [],
    usadaEn: [
      'tataki-res', 'maguro-trufa-roll', 'trufa-hamachi-roll',
      'anguila-unagi-especial', 'okinawa-chutoro', 'hand-rolls',
    ],
    ficha: {
      'Base cremosa': '†',
      'Aceite de trufa': '†',
      'Dosificación': 'en puntos o línea fina — nunca cobertura total',
    },
    criterio: {
      bien:
        'El aroma de trufa se percibe al acercar el platillo, no aplasta al pescado. Aplicación en frío, dosificada.',
      mal:
        'Exceso de aderezo: la trufa tapa el sabor del atún o hamachi y encarece la porción. Más no es mejor — es la dosis exacta.',
    },
  },

  {
    slug: 'tempura-base',
    titulo: 'Tempura — mezcla y técnica',
    estacion: 'bases-salsas',
    tipo: 'subreceta',
    duracion: '6 min',
    descripcion:
      'La mezcla de tempura y su técnica de fritura. Alimenta 11 módulos: de los vegetales tempura a los flakes crujientes de los rollos.',
    usaRecetas: [],
    usadaEn: [
      'camarones-melon', 'firecracker-cauliflower', 'vegetales-tempura',
      'maguro-trufa-roll', 'crunchy-callo', 'yasuko-roll', 'dragon-roll',
      'hot-roll', 'anguila-unagi-especial', 'everest-roll', 'hoso-maki',
    ],
    ficha: {
      'Harina': '†',
      'Agua helada': '†',
      'Temperatura de mezcla': 'siempre fría — con hielo',
      'Temperatura de aceite': '170–180 °C',
      'Flakes (tenkasu)': 'goteo de mezcla sobre aceite caliente',
    },
    criterio: {
      bien:
        'Cobertura ligera, crujiente y pálida — no dorada oscura. La mezcla se mantiene fría y con grumos: no se bate hasta lisa. Los flakes crujen horas después.',
      mal:
        'Tempura grasosa y pesada: aceite frío o mezcla caliente. Cobertura dura tipo empanizado: la mezcla se batió de más y desarrolló gluten.',
    },
  },

  {
    slug: 'kanikama-spicy',
    titulo: 'Kanikama spicy',
    estacion: 'bases-salsas',
    tipo: 'subreceta',
    duracion: '3 min',
    descripcion:
      'Mezcla de cangrejo kanikama con salsa spicy. Relleno de los pajaritos y del Yasuko Roll.',
    usaRecetas: [],
    usadaEn: ['pajaritos', 'yasuko-roll'],
    ficha: {
      'Kanikama deshebrado': '†',
      'Base spicy': '†',
      'Vida útil refrigerada': '†',
    },
    criterio: {
      bien:
        'Hebras integradas con la salsa sin quedar aguadas. Se prepara por turno y se mantiene en frío.',
      mal:
        'Mezcla que suelta líquido: el kanikama no se escurrió o lleva demasiado tiempo preparada.',
    },
  },

  {
    slug: 'salsa-teriyaki',
    titulo: 'Salsa teriyaki',
    estacion: 'bases-salsas',
    tipo: 'subreceta',
    duracion: '4 min',
    descripcion:
      'Glaseado dulce de soya para el salmón teriyaki. Brillo de laca, no de charco.',
    usaRecetas: [],
    usadaEn: ['salmon-teriyaki'],
    ficha: {
      'Salsa de soya': '†',
      'Mirin': '†',
      'Sake': '†',
      'Azúcar': '†',
    },
    criterio: {
      bien:
        'Glasea el salmón con capa brillante que se adhiere. Se aplica en las últimas vueltas de cocción para que caramelice sin quemarse.',
      mal:
        'Teriyaki quemada y amarga: entró al fuego demasiado pronto. Salsa que escurre al plato: falta reducción.',
    },
  },

  {
    slug: 'fondo-ramen',
    titulo: 'Fondo de ramen',
    estacion: 'bases-salsas',
    tipo: 'subreceta',
    duracion: '8 min',
    descripcion:
      'Fondo mixto de pollo y cerdo — la base de horas detrás de los dos ramen de la carta. Se produce con anticipación; el servicio solo ensambla.',
    usaRecetas: ['produccion-diaria'],
    usadaEn: ['ramen', 'ramen-miso'],
    ficha: {
      'Huesos de pollo y cerdo': '†',
      'Aromáticos': '†',
      'Tiempo de cocción': '†',
      'Enfriado y almacenaje': 'baño de hielo → etiquetado con fecha',
    },
    criterio: {
      bien:
        'Fondo con cuerpo y colágeno — al enfriar gelatiniza. Sabor profundo sin exceso de sal: la sal llega con el tare al armar el bowl.',
      mal:
        'Fondo aguado: proporción hueso-agua incorrecta o falta de tiempo. Fondo turbio con impurezas: no se espumó durante la cocción.',
    },
  },

  {
    slug: 'huevo-marinado',
    titulo: 'Huevo marinado (ajitama)',
    estacion: 'bases-salsas',
    tipo: 'subreceta',
    duracion: '4 min',
    descripcion:
      'Huevo de yema líquida marinado en soya. El topping que define la foto del ramen.',
    usaRecetas: ['produccion-diaria'],
    usadaEn: ['ramen'],
    ficha: {
      'Cocción': '6:30–7:00 min desde agua hirviendo †',
      'Choque térmico': 'baño de hielo inmediato',
      'Marinado': 'soya + mirin, mínimo 4 h †',
      'Vida útil': '†',
    },
    criterio: {
      bien:
        'Clara firme, yema líquida color naranja al corte. El marinado tiñe la clara de ámbar parejo.',
      mal:
        'Yema dura y gris: se pasó la cocción — no hay corrección. Clara sin teñir: falta tiempo de marinado.',
    },
  },

  {
    slug: 'spicy-rayu',
    titulo: 'Spicy rayu',
    estacion: 'bases-salsas',
    tipo: 'subreceta',
    duracion: '3 min',
    descripcion:
      'Aceite de chile japonés con sriracha. El picante de los spicy rolls y hand rolls spicy.',
    usaRecetas: [],
    usadaEn: ['spicy-tuna-salmon-roll', 'hand-rolls'],
    ficha: {
      'Aceite de chile (rayu)': '†',
      'Sriracha': '†',
      'Ajonjolí': '†',
    },
    criterio: {
      bien:
        'Picante presente pero con sabor — el aceite aporta aroma tostado, no solo calor.',
      mal:
        'Mezcla separada en el contenedor: agitar antes de cada uso. Picante plano sin aroma: proporciones incorrectas.',
    },
  },

  {
    slug: 'vinagreta-yuzu',
    titulo: 'Vinagreta de yuzu',
    estacion: 'bases-salsas',
    tipo: 'subreceta',
    duracion: '3 min',
    descripcion:
      'Vinagreta cítrica de yuzu. Aparece en la Ensalada Yasu y en el Sésamo Maki (versión ajonjolí-yuzu).',
    usaRecetas: [],
    usadaEn: ['ensalada-yasu', 'hoso-maki'],
    ficha: {
      'Jugo de yuzu': '†',
      'Aceite': '†',
      'Soya ligera': '†',
      'Variante Sésamo Maki': 'con pasta de ajonjolí †',
    },
    criterio: {
      bien:
        'Emulsión ligera y estable, perfume cítrico al frente. Se aplica al momento — las hojas se aliñan al pase.',
      mal:
        'Ensalada aliñada con anticipación: la espinaca se marchita en minutos. La vinagreta nunca espera montada.',
    },
  },

  // ── PROTOCOLOS DE OPERACIÓN ──────────────────────────────────────────────

  {
    slug: 'apertura',
    titulo: 'Protocolo de apertura',
    estacion: 'protocolos',
    tipo: 'protocolo',
    duracion: '6 min',
    descripcion:
      'La secuencia de apertura del turno: equipos, temperaturas, arroz en marcha y revisión de frescura. Lo que pasa antes de que llegue el primer cliente define el servicio completo.',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      '1 — Equipos': 'encender extracción, planchas, wok, arrocera',
      '2 — Temperaturas': 'registrar refrigeradores y congeladores (≤4 °C / ≤-18 °C)',
      '3 — Arroz': 'shari y gohan del día en marcha — primero que todo',
      '4 — Frescura': 'revisión de pescados y mariscos del día',
      '5 — Mise en place': 'checklist por estación completo antes del servicio',
      'Registro': 'bitácora firmada por el responsable de turno',
    },
    criterio: {
      bien:
        'La apertura sigue el mismo orden todos los días y queda registrada. El arroz arranca primero — es lo que más tarda. A la hora de abrir, cada estación tiene su mise en place completo.',
      mal:
        'Apertura sin registro de temperaturas: no hay evidencia de la cadena de frío. Arroz que arranca tarde: la barra abre coja y el servicio arrastra el retraso todo el turno.',
    },
  },

  {
    slug: 'recepcion-producto',
    titulo: 'Recepción de producto',
    estacion: 'protocolos',
    tipo: 'protocolo',
    duracion: '5 min',
    descripcion:
      'Cómo se recibe, inspecciona y almacena el producto — especialmente el pescado fresco. La calidad de la barra se decide en la puerta de atrás.',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Temperatura de recepción': 'pescado fresco a 4 °C o menos',
      'Ojos': 'brillantes y convexos — nunca hundidos u opacos',
      'Agallas': 'rojo vivo, húmedas',
      'Olor': 'a mar limpio — cualquier olor "a pescado" es rechazo',
      'Textura': 'carne firme que regresa al presionar',
      'Etiquetado': 'fecha de recepción + rotación FIFO',
    },
    criterio: {
      bien:
        'Todo producto se inspecciona antes de firmar. Lo que no pasa el estándar se rechaza en la puerta — con proveedor presente. Todo entra etiquetado con fecha.',
      mal:
        'Producto guardado sin inspección "por prisa": el problema aparece en la mesa del cliente. Sin etiquetas de fecha: la rotación FIFO es imposible y la merma crece.',
    },
  },

  {
    slug: 'produccion-diaria',
    titulo: 'Producción diaria',
    estacion: 'protocolos',
    tipo: 'protocolo',
    duracion: '6 min',
    descripcion:
      'El mise en place del día: shari, gohan, fondos, salsas madre y huevo marinado. Producir con método para que el servicio solo ensamble.',
    usaRecetas: [],
    usadaEn: ['shari', 'arroz-gohan', 'fondo-ramen', 'huevo-marinado'],
    ficha: {
      'Orden de producción': 'arroces → fondos → salsas → toppings',
      'Etiquetado': 'toda preparación con fecha y hora',
      'Cantidades': 'según pronóstico del día — no "por si acaso"',
      'Shari': 'por turno, nunca se guarda',
      'Registro': 'checklist de producción firmado',
    },
    criterio: {
      bien:
        'Al abrir el servicio, todo está producido, etiquetado y en su lugar. El cocinero de servicio ensambla — no produce. Las cantidades siguen el pronóstico.',
      mal:
        'Producir durante el servicio: los tiempos de mesa se disparan. Preparaciones sin etiqueta: nadie sabe qué tan viejas son — se descartan por seguridad, y eso es merma pura.',
    },
  },

  {
    slug: 'manejo-de-crudos',
    titulo: 'Manejo de crudos',
    estacion: 'protocolos',
    tipo: 'protocolo',
    duracion: '6 min',
    descripcion:
      'El protocolo más crítico de Yasuko: cadena de frío, tablas dedicadas, sanitización de cuchillos y tiempos máximos. El consumo de alimentos crudos es responsabilidad de quien lo consume — el manejo impecable es responsabilidad nuestra.',
    usaRecetas: [],
    usadaEn: [
      'nigiri-tecnica', 'sashimi-cortes', 'tiradito-serrano-ponzu',
      'tiradito-hamachi', 'tiradito-pesca-blanca', 'battera',
      'tostadas', 'crispy-rice', 'donburi',
    ],
    ficha: {
      'Cadena de frío': 'nunca se interrumpe — del proveedor al plato',
      'Temperatura de trabajo': 'producto a 4 °C o menos',
      'Tiempo máximo fuera de frío': '30 min — luego regresa o se descarta',
      'Tabla dedicada': 'exclusiva para crudos, nunca compartida',
      'Cuchillos': 'sanitizados entre especies',
      'Manos': 'lavado entre cada cambio de producto',
    },
    criterio: {
      bien:
        'El producto crudo pasa el menor tiempo posible fuera del frío. Tablas y cuchillos dedicados. Color brillante, aroma limpio, textura firme en todo momento.',
      mal:
        'Cualquier duda sobre la cadena de frío: no se sirve, sin excepción. Color opaco, aroma distinto o textura blanda: se descarta. En crudos no hay "más o menos".',
    },
  },

  {
    slug: 'servicio',
    titulo: 'Protocolo de servicio',
    estacion: 'protocolos',
    tipo: 'protocolo',
    duracion: '5 min',
    descripcion:
      'El flujo de la comanda: tiempos de salida, orden de armado y comunicación entre barra fría y cocina caliente. Que la mesa reciba todo en su momento.',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Entradas frías': 'salida en ≤8 min †',
      'Rollos': 'salida en ≤12 min †',
      'Cocina caliente': 'coordinada con barra — la mesa come junta',
      'Orden de armado': 'frío se arma al final, caliente marca el tiempo',
      'Check final': 'el responsable revisa cada plato antes del pase',
    },
    criterio: {
      bien:
        'Barra y cocina se comunican en voz alta al recibir comanda. Los platillos de una mesa salen coordinados. Cada plato pasa por el check de emplatado antes de salir.',
      mal:
        'El rollo sale 10 minutos después del ramen: la mesa come por turnos. Plato que sale sin revisión: el error lo encuentra el cliente, no la cocina.',
    },
  },

  {
    slug: 'limpieza-estacion',
    titulo: 'Limpieza de estación',
    estacion: 'protocolos',
    tipo: 'protocolo',
    duracion: '4 min',
    descripcion:
      'Limpieza durante el turno: la estación se limpia mientras se trabaja, no al final. Tabla, cuchillo, makisu y superficies en ciclo constante.',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Tabla y cuchillo': 'sanitizados cada 30 min y entre especies',
      'Makisu (tapete)': 'lavado y forrado — sin residuos de arroz',
      'Trapos': 'cambio por turno y por zona (nunca el mismo para todo)',
      'Sanitizante': 'a la mano en cada estación, concentración correcta',
      'Piso y superficies': 'ciclo de limpieza continuo, no acumulado',
    },
    criterio: {
      bien:
        'La estación se ve igual de limpia a las 2 pm que a la apertura. Limpiar es parte del movimiento de trabajo, no una tarea aparte.',
      mal:
        'Residuos de arroz seco en el makisu o la tabla: además de higiene, arrastran sabor. Un solo trapo para todo: contaminación cruzada garantizada.',
    },
  },

  {
    slug: 'cierre',
    titulo: 'Protocolo de cierre',
    estacion: 'protocolos',
    tipo: 'protocolo',
    duracion: '5 min',
    descripcion:
      'La secuencia de cierre: almacenaje etiquetado, registro de temperaturas, merma del día y checklist final. El cierre de hoy es la apertura de mañana.',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      '1 — Almacenaje': 'todo producto filmado, etiquetado y en frío',
      '2 — Shari': 'se descarta — nunca se guarda para mañana',
      '3 — Temperaturas': 'registro final de refrigeradores',
      '4 — Merma': 'registro de merma del día por estación',
      '5 — Equipos': 'apagado y limpieza profunda de wok y planchas',
      '6 — Checklist': 'firmado por el responsable antes de salir',
    },
    criterio: {
      bien:
        'Todo lo que entra al refrigerador entra etiquetado. La merma se registra — es el dato que permite ajustar la producción de mañana. El checklist se firma.',
      mal:
        'Contenedores sin etiqueta ni fecha: mañana nadie sabe qué es ni de cuándo. Shari guardado "para no tirarlo": mañana es arroz duro que no se puede servir — y un riesgo.',
    },
  },

  // ── ENTRADAS FRÍAS ───────────────────────────────────────────────────────

  {
    slug: 'seaweed-salad-cangrejo',
    titulo: 'Seaweed Salad con Cangrejo',
    estacion: 'entradas-frias',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Lechuga sangría, alga preparada, aderezo cítrico, kanikama y tomate cherry. $179',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Lechuga sangría': '†',
      'Alga preparada': '†',
      'Kanikama': '†',
      'Tomate cherry': '†',
      'Aderezo cítrico': '†',
    },
    criterio: {
      bien: 'Hojas frías y secas, alga escurrida. El aderezo se aplica al pase. Montaje con volumen — no aplastado.',
      mal: 'Alga que suelta líquido al plato: no se escurrió. Ensalada aliñada con anticipación: se marchita.',
    },
  },

  {
    slug: 'ensalada-yasu',
    titulo: 'Ensalada Yasu',
    estacion: 'entradas-frias',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Espinaca, tomate cherry salteado, poro crunchy, dry miso, parmesano y vinagreta de yuzu. $169',
    usaRecetas: ['vinagreta-yuzu'],
    usadaEn: [],
    ficha: {
      'Espinaca': '†',
      'Tomate cherry salteado': '†',
      'Poro crunchy': '†',
      'Dry miso': '†',
      'Parmesano': '†',
      'Vinagreta de yuzu': '†',
    },
    criterio: {
      bien: 'El tomate salteado va tibio sobre la espinaca fría — el contraste es parte del plato. El poro crunchy cruje al servir.',
      mal: 'Poro crunchy blando: absorbió humedad — se guarda hermético. Espinaca aliñada con anticipación: marchita en minutos.',
    },
  },

  {
    slug: 'battera',
    titulo: 'Battera Atún o Salmón',
    estacion: 'entradas-frias',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Arroz prensado con aguacate, atún o salmón flameado con spicy mayo y chile serrano. $229',
    usaRecetas: ['shari', 'spicy-mayo', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Shari prensado': '†',
      'Atún o salmón': '†',
      'Aguacate': '†',
      'Spicy mayo': '†',
      'Chile serrano': '†',
      'Flameado': 'soplete al pase',
    },
    criterio: {
      bien: 'El prensado es firme y los cortes salen limpios y parejos. El flameado dora la superficie del pescado sin cocerlo — segundos, no minutos.',
      mal: 'Battera que se desarma al cortar: prensado flojo o shari frío. Pescado cocido por exceso de soplete: se pierde el punto crudo del centro.',
    },
  },

  {
    slug: 'pajaritos',
    titulo: 'Pajaritos (4)',
    estacion: 'entradas-frias',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Cangrejo spicy y aguacate, envuelto en láminas de atún y/o salmón. $209',
    usaRecetas: ['kanikama-spicy', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Láminas de atún/salmón': '†',
      'Kanikama spicy': '†',
      'Aguacate': '†',
      'Piezas': '4',
    },
    criterio: {
      bien: 'Láminas de corte uniforme que envuelven sin romperse. Las 4 piezas idénticas en tamaño — se sirven como conjunto.',
      mal: 'Láminas de grosor irregular: unas se rompen, otras quedan gruesas y correosas. El corte parejo es la técnica del plato.',
    },
  },

  {
    slug: 'tostadas',
    titulo: 'Tostadas (2)',
    estacion: 'entradas-frias',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Atún, salmón o hamachi con aguacate, spicy mayo, cebollín frito y salsa macha. $209',
    usaRecetas: ['spicy-mayo', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Tostada': '2 piezas',
      'Atún / salmón / hamachi': '†',
      'Aguacate': '†',
      'Spicy mayo': '†',
      'Cebollín frito': '†',
      'Salsa macha': '†',
    },
    criterio: {
      bien: 'La tostada se monta al pase — cruje al morder. El pescado en cubos parejos, frío. La salsa macha en puntos, no encharcada.',
      mal: 'Tostada montada con anticipación: la humedad la ablanda en minutos. Es el error más común del plato.',
    },
  },

  {
    slug: 'crispy-rice',
    titulo: 'Crispy Rice (4)',
    estacion: 'entradas-frias',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Cubos de arroz crujiente con tartar de atún y/o salmón. $209',
    usaRecetas: ['shari', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Shari prensado y frito': '4 cubos',
      'Tartar de atún/salmón': '†',
      'Topping': '†',
    },
    criterio: {
      bien: 'Cubo dorado y crujiente por fuera, arroz suave por dentro. El tartar frío sobre el arroz tibio — el contraste es el plato.',
      mal: 'Cubo aceitoso: aceite frío al freír. Tartar montado con anticipación sobre el arroz caliente: el pescado se "cocina" y pierde color.',
    },
  },

  {
    slug: 'tataki-res',
    titulo: 'Tataki de Res',
    estacion: 'entradas-frias',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Res sellada en corte fino, coles de Bruselas, aderezo de trufa y ponzu. $239',
    usaRecetas: ['ponzu', 'aderezo-trufa'],
    usadaEn: [],
    ficha: {
      'Res (sellada, centro crudo)': '†',
      'Coles de Bruselas': '†',
      'Aderezo de trufa': '†',
      'Ponzu': '†',
    },
    criterio: {
      bien: 'Sellado fuerte y rápido: anillo cocido delgado, centro rojo uniforme. Corte fino y parejo, en frío tras el sellado.',
      mal: 'Anillo gris grueso: el sellado fue lento o la sartén estaba fría. Corte grueso: el tataki se come como lámina, no como bistec.',
    },
  },

  // ── ENTRADAS CALIENTES ───────────────────────────────────────────────────

  {
    slug: 'edamames',
    titulo: 'Edamames — 3 estilos',
    estacion: 'entradas-calientes',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Al vapor ($129), spicy ($159) o al ajo ($159). Una base, tres terminados.',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Al vapor': '$129 — sal de grano al servir',
      'Spicy': '$159 — salteados con salsa picante †',
      'Al ajo': '$159 — salteados con ajo dorado †',
    },
    criterio: {
      bien: 'Vaina verde vivo, grano al dente. Los salteados van a wok muy caliente — la salsa cubre, no encharca.',
      mal: 'Edamame gris o aguado: sobre-cocción al vapor. Salteado con salsa cruda: no alcanzó a reducir en el wok.',
    },
  },

  {
    slug: 'gyozas',
    titulo: 'Gyozas',
    estacion: 'entradas-calientes',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Rellenas de carne de cerdo, al vapor y selladas al sartén. $199',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Gyozas': '†',
      'Relleno de cerdo': '†',
      'Método': 'vapor + sellado en sartén (base crujiente)',
      'Salsa de servicio': '†',
    },
    criterio: {
      bien: 'Base dorada y crujiente, cuerpo suave al vapor. El relleno jugoso y a temperatura. Se sirven con la base dorada hacia arriba.',
      mal: 'Base pálida y blanda: faltó sellado. Gyoza abierta: exceso de vapor o relleno pasado de humedad.',
    },
  },

  {
    slug: 'camarones-melon',
    titulo: 'Camarones Melón',
    estacion: 'entradas-calientes',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Camarones tempura, aderezo cremoso ligeramente dulce, nuez caramelizada y perlas de melón. $269',
    usaRecetas: ['tempura-base'],
    usadaEn: [],
    ficha: {
      'Camarón tempura': '†',
      'Aderezo cremoso dulce': '†',
      'Nuez caramelizada': '†',
      'Perlas de melón': '†',
    },
    criterio: {
      bien: 'El camarón se envuelve en el aderezo al momento — la tempura sigue crujiendo bajo la salsa. Perlas de melón frías como contraste.',
      mal: 'Camarón bañado con anticipación: la tempura se ablanda y el plato se vuelve pesado. Salsear y salir.',
    },
  },

  {
    slug: 'firecracker-cauliflower',
    titulo: 'Firecracker Cauliflower',
    estacion: 'entradas-calientes',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Palomitas de coliflor con salsa spicy. $219',
    usaRecetas: ['tempura-base', 'spicy-mayo'],
    usadaEn: [],
    ficha: {
      'Coliflor en floretes': '†',
      'Cobertura tempura': '†',
      'Salsa spicy': '†',
    },
    criterio: {
      bien: 'Floretes crujientes con la salsa adherida en capa fina. El interior de la coliflor al dente — no aguado.',
      mal: 'Coliflor aguada dentro de la costra: floretes demasiado grandes o aceite frío. La pieza es del tamaño de un bocado.',
    },
  },

  {
    slug: 'shishito-peppers',
    titulo: 'Shishito Peppers',
    estacion: 'entradas-calientes',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Pimientos orientales salteados al wok. Disponibles en temporada. $169',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Shishito peppers': '†',
      'Método': 'wok muy caliente, sellado con ampolla',
      'Terminado': 'sal de grano †',
    },
    criterio: {
      bien: 'Piel ampollada y ligeramente tatemada, interior jugoso. Se sirven inmediatamente — pierden textura en minutos.',
      mal: 'Pimiento aguado sin ampolla: el wok no estaba a temperatura. Es fuego alto y movimiento constante.',
    },
  },

  {
    slug: 'vegetales-tempura',
    titulo: 'Vegetales Tempura',
    estacion: 'entradas-calientes',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Vegetales de temporada en tempura ligera. $159',
    usaRecetas: ['tempura-base'],
    usadaEn: [],
    ficha: {
      'Vegetales de temporada': '†',
      'Mezcla tempura': 'ver subreceta',
      'Salsa de servicio': '†',
    },
    criterio: {
      bien: 'Cobertura ligera que deja ver el color del vegetal. Cada vegetal con su tiempo de fritura — no todos entran juntos.',
      mal: 'Todos los vegetales fritos al mismo tiempo: el camote queda crudo y la calabaza aguada. Se fríen por tandas según densidad.',
    },
  },

  {
    slug: 'brochetas-pork-belly',
    titulo: 'Brochetas de Pork Belly (2)',
    estacion: 'entradas-calientes',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Pork belly en salsa de curry. $169',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Pork belly': '†',
      'Salsa de curry': '†',
      'Piezas': '2 brochetas',
    },
    criterio: {
      bien: 'Grasa rendida y dorada, carne tierna. La salsa de curry glasea la brocheta caliente al pase.',
      mal: 'Grasa blanda sin render: falta tiempo o temperatura. El pork belly sin dorar es grasa cruda al paladar.',
    },
  },

  {
    slug: 'salmon-teriyaki',
    titulo: 'Salmón Teriyaki',
    estacion: 'entradas-calientes',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Salmón en salsa teriyaki con guarnición de coliflor y coles de Bruselas. $349',
    usaRecetas: ['salsa-teriyaki'],
    usadaEn: [],
    ficha: {
      'Salmón': '†',
      'Salsa teriyaki': 'ver subreceta',
      'Coliflor': '†',
      'Coles de Bruselas': '†',
    },
    criterio: {
      bien: 'Piel dorada, centro jugoso y apenas rosado. El teriyaki lacado en las últimas vueltas — brillante, caramelizado, sin quemarse.',
      mal: 'Salmón seco y pálido por dentro: se pasó de cocción. Teriyaki negro y amargo: entró al fuego demasiado pronto.',
    },
  },

  // ── SOPAS ────────────────────────────────────────────────────────────────

  {
    slug: 'sopa-miso',
    titulo: 'Sopa Miso',
    estacion: 'sopas',
    tipo: 'platillo',
    duracion: '3 min',
    descripcion: 'Tofu, alga wakame y cebollín. $89',
    usaRecetas: [],
    usadaEn: [],
    ficha: {
      'Caldo dashi': '†',
      'Pasta de miso': '†',
      'Tofu': '†',
      'Alga wakame': '†',
      'Cebollín': '†',
    },
    criterio: {
      bien: 'El miso se disuelve fuera del hervor — el caldo humea pero no hierve al servir. Tofu en cubos parejos, wakame hidratada.',
      mal: 'Miso hervido: pierde aroma y se corta. El miso entra al final, con el fuego bajo. Nunca hervir después.',
    },
  },

  {
    slug: 'ramen',
    titulo: 'Ramen',
    estacion: 'sopas',
    tipo: 'platillo',
    duracion: '6 min',
    descripcion: 'Fondo mixto de pollo y cerdo, fideos de trigo, panceta, huevo marinado, naruto, espinaca y cebollín. $259',
    usaRecetas: ['fondo-ramen', 'huevo-marinado'],
    usadaEn: [],
    ficha: {
      'Fondo de ramen': 'ver subreceta',
      'Fideos de trigo': '†',
      'Panceta de cerdo': '†',
      'Huevo marinado': '½ pieza',
      'Naruto, espinaca, cebollín': '†',
    },
    criterio: {
      bien: 'El bowl se arma en orden: tare, fondo hirviendo, fideos, toppings. Fideos al dente servidos al instante. El huevo al corte muestra yema líquida.',
      mal: 'Fideos que esperaron en el caldo: se pasan en 2 minutos y absorben el fondo. El ramen no espera en la barra — sale al momento.',
    },
  },

  {
    slug: 'ramen-miso',
    titulo: 'Ramen Miso',
    estacion: 'sopas',
    tipo: 'platillo',
    duracion: '6 min',
    descripcion: 'Fondo de pollo y cerdo con base de miso picante, panceta, germinado de soya, cebollín y mantequilla. $269',
    usaRecetas: ['fondo-ramen'],
    usadaEn: [],
    ficha: {
      'Fondo de ramen': 'ver subreceta',
      'Base de miso picante': '†',
      'Fideos de trigo': '†',
      'Panceta de cerdo': '†',
      'Germinado de soya': '†',
      'Mantequilla': '1 cubo al servir',
    },
    criterio: {
      bien: 'La base de miso picante se integra al fondo caliente sin hervir. La mantequilla se coloca al final y se funde en la mesa.',
      mal: 'Miso hervido en el fondo: pierde el aroma que lo distingue del ramen clásico. El germinado aguado: entra al final, crujiente.',
    },
  },

  // ── ARROCES ──────────────────────────────────────────────────────────────

  {
    slug: 'yakimeshi',
    titulo: 'Yakimeshi — técnica de wok',
    estacion: 'arroces',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion:
      'Arroz frito al wok en 5 versiones: verduras ($179), camarón ($269), filete ($269), mixto ($289) y chazu con pork belly ($269). Una técnica, cinco platillos.',
    usaRecetas: ['arroz-gohan'],
    usadaEn: [],
    ficha: {
      'Yakimeshi Verduras': '$179',
      'Yakimeshi Camarón': '$269',
      'Yakimeshi Filete': '$269',
      'Yakimeshi Mixto': '$289',
      'Yakimeshi Chazu (pork belly)': '$269',
      'Base': 'gohan del día anterior, refrigerado',
    },
    criterio: {
      bien: 'Grano suelto y salteado con "aliento de wok" — fuego alto y movimiento constante. La proteína se sella primero y regresa al final.',
      mal: 'Arroz apelmazado: se usó gohan recién hecho o el wok estaba frío. El yakimeshi se hace con arroz de ayer, siempre.',
    },
  },

  {
    slug: 'donburi',
    titulo: 'Donburi — armado del bowl',
    estacion: 'arroces',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion:
      'Tazón de arroz con pescado crudo en 5 versiones: atún ($219), chutoro ($259), toro ($299), salmón ($219) y spicy mayo tuna/salmón ($219).',
    usaRecetas: ['arroz-gohan', 'spicy-mayo', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Donburi Atún': '$219',
      'Donburi Chutoro': '$259',
      'Donburi Toro': '$299',
      'Donburi Salmón': '$219',
      'Donburi Spicy Mayo (tuna/salmón)': '$219',
      'Base común': 'gohan + cebollín + aguacate',
    },
    criterio: {
      bien: 'El arroz tibio, el pescado frío — se montan al pase para conservar el contraste. Cubos de corte parejo, gramaje exacto por versión.',
      mal: 'Pescado montado sobre arroz caliente con anticipación: se "cocina" por contacto y pierde color. El donburi se arma y sale.',
    },
  },

  // ── BARRA FRÍA ───────────────────────────────────────────────────────────

  {
    slug: 'nigiri-tecnica',
    titulo: 'Nigiri — técnica de la casa',
    estacion: 'barra-fria',
    tipo: 'platillo',
    duracion: '6 min',
    descripcion:
      'La pieza fundamental de la barra: presión, proporción arroz-pescado y las 9 variedades de la carta, del atún ($65) a la hueva de salmón ($89).',
    usaRecetas: ['shari', 'manejo-de-crudos', 'salsa-anguila'],
    usadaEn: [],
    ficha: {
      'Atún': '$65',
      'Chutoro': '$79',
      'Toro': '$85',
      'Salmón': '$65',
      'Anguila (glaseada con unagi)': '$65',
      'Pesca Blanca': '$54',
      'Hamachi': '$54',
      'Hueva de Salmón': '$89',
      'Negitoro': '$85',
    },
    criterio: {
      bien: 'El arroz se compacta con 2–3 presiones — se sostiene entero al tomarlo con palillos y se deshace en la boca. La lámina cubre el arroz sin colgar en exceso.',
      mal: 'Nigiri prensado como bola de masa: demasiada presión. Nigiri que se desarma al levantarlo: le faltó forma. La presión exacta es la técnica que más tarda en aprenderse — por eso está en video.',
    },
  },

  {
    slug: 'sashimi-cortes',
    titulo: 'Sashimi — cortes tradicionales',
    estacion: 'barra-fria',
    tipo: 'platillo',
    duracion: '6 min',
    descripcion:
      'Los cortes de la carta: akami ($289), toro ($499), chutoro ($359), salmón ($299), hamachi ($289), pesca blanca ($289) y los mixtos. El cuchillo hace el platillo.',
    usaRecetas: ['manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Akami 100 g': '$289',
      'Toro 100 g': '$499',
      'Chutoro 100 g': '$359',
      'Salmón 100 g': '$299',
      'Hamachi 100 g': '$289',
      'Pesca Blanca 100 g': '$289',
      'Maguro Mixto 120 g': '$399',
      'Sashimi Mixto 120 g': '$369',
      'Corte': 'un solo movimiento, hacia el cuerpo — nunca aserrar',
    },
    criterio: {
      bien: 'Cada lámina sale de un solo trazo de cuchillo — superficie lisa y brillante. Grosor idéntico entre piezas. El gramaje corresponde al platillo en crudo.',
      mal: 'Superficie rasgada con marcas de sierra: el cuchillo iba sin filo o el corte fue en varios movimientos. El sashimi mal cortado se percibe en la lengua.',
    },
  },

  {
    slug: 'tiradito-serrano-ponzu',
    titulo: 'Tiradito Atún o Salmón Serrano Ponzu',
    estacion: 'barra-fria',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Corte fino de atún o salmón, salsa ponzu, chile serrano y spicy mayo. $299',
    usaRecetas: ['ponzu', 'spicy-mayo', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Atún o salmón (corte fino)': '†',
      'Ponzu': '†',
      'Chile serrano': 'láminas finas',
      'Spicy mayo': 'en puntos',
    },
    criterio: {
      bien: 'Láminas extendidas sin encimarse, ponzu al pase. El serrano en láminas casi traslúcidas — picante que acompaña, no que domina.',
      mal: 'Ponzu aplicada antes de tiempo: el ácido opaca el pescado. El tiradito se salsea cuando la comanda sale, no antes.',
    },
  },

  {
    slug: 'tiradito-hamachi',
    titulo: 'Tiradito Hamachi',
    estacion: 'barra-fria',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Corte fino de hamachi, flameado con aceite de ajonjolí y ponzu. $299',
    usaRecetas: ['ponzu', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Hamachi (corte fino)': '†',
      'Aceite de ajonjolí': 'caliente, al pase',
      'Ponzu': '†',
    },
    criterio: {
      bien: 'El aceite de ajonjolí se calienta a punto de humo y se vierte sobre el corte en la mesa de pase — el "flameado" es ese golpe de calor aromático.',
      mal: 'Aceite tibio: no sella ni perfuma, solo engrasa. El aceite tiene que sonar al tocar el pescado.',
    },
  },

  {
    slug: 'tiradito-pesca-blanca',
    titulo: 'Tiradito Pesca Blanca Cítrica',
    estacion: 'barra-fria',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Corte fino de pesca blanca, emulsión de yuzu, ajo frito y yuzu kosho. $299',
    usaRecetas: ['manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Pesca blanca (corte fino)': '†',
      'Emulsión de yuzu': '†',
      'Ajo frito': '†',
      'Yuzu kosho': 'en puntos — es intenso',
    },
    criterio: {
      bien: 'El yuzu kosho en puntos mínimos: es sal, chile y cítrico concentrado. El ajo frito crujiente, dorado claro.',
      mal: 'Exceso de yuzu kosho: un punto de más y domina todo el plato. Ajo frito oscuro: amarga.',
    },
  },

  // ── ROLLOS ───────────────────────────────────────────────────────────────

  {
    slug: 'maguro-trufa-roll',
    titulo: 'Maguro Trufa Roll',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Atún, flakes de tempura, aderezo de trufa, aguacate y ajonjolí. $219',
    usaRecetas: ['shari', 'aderezo-trufa', 'tempura-base', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Shari': '†',
      'Atún': '†',
      'Flakes de tempura': '†',
      'Aderezo de trufa': '†',
      'Aguacate y ajonjolí': '†',
    },
    criterio: {
      bien: 'Rollo firme de 8 cortes parejos. Los flakes crujen al morder — se agregan al armar, no antes. La trufa perfuma sin tapar el atún.',
      mal: 'Flakes blandos: se mezclaron con humedad anticipadamente. Rollo flojo que se abre al corte: presión de makisu insuficiente.',
    },
  },

  {
    slug: 'spicy-tuna-salmon-roll',
    titulo: 'Spicy Tuna / Spicy Salmon Roll',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion: 'Atún o salmón, sriracha, rayu, aguacate y alga por fuera. $219',
    usaRecetas: ['shari', 'spicy-rayu', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Shari': '†',
      'Atún o salmón': '†',
      'Sriracha + spicy rayu': '†',
      'Aguacate': '†',
      'Presentación': 'alga por fuera',
    },
    criterio: {
      bien: 'El picante integrado en la mezcla del pescado, parejo en cada corte. El alga exterior tensa y crujiente.',
      mal: 'Alga correosa: el rollo esperó armado. Con alga por fuera, el rollo se arma al pase — la humedad del arroz la ablanda en minutos.',
    },
  },

  {
    slug: 'trufa-hamachi-roll',
    titulo: 'Trufa Hamachi Roll',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Hamachi y aguacate por dentro; aderezo de trufa, poro crunchy y tobiko negro por fuera. $239',
    usaRecetas: ['shari', 'aderezo-trufa', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Shari': '†',
      'Hamachi y aguacate': 'por dentro',
      'Aderezo de trufa': 'por fuera',
      'Poro crunchy': '†',
      'Tobiko negro': '†',
    },
    criterio: {
      bien: 'El tobiko negro distribuido parejo — es la firma visual del rollo. El poro crunchy se agrega al final para que cruja.',
      mal: 'Poro crunchy húmedo y doblado: se aplicó antes de tiempo o el contenedor quedó abierto.',
    },
  },

  {
    slug: 'crunchy-callo',
    titulo: 'Crunchy Callo',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Camarón tempura, atún y aguacate por dentro; callo, jalapeño sellado con spicy mayo y pimienta por fuera. $259',
    usaRecetas: ['shari', 'tempura-base', 'spicy-mayo', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Shari': '†',
      'Camarón tempura, atún, aguacate': 'por dentro',
      'Callo': 'por fuera',
      'Jalapeño + spicy mayo': 'sellado con soplete',
      'Pimienta': 'al terminar',
    },
    criterio: {
      bien: 'El callo por fuera se sella con soplete al pase — dorado superficial, centro crudo y dulce. El jalapeño pierde el filo del picante con el sellado.',
      mal: 'Callo cocido por exceso de soplete: se vuelve hule. Son pasadas rápidas de flama, no cocción.',
    },
  },

  {
    slug: 'yasuko-roll',
    titulo: 'Yasuko Roll',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '6 min',
    descripcion:
      'El rollo insignia: hamachi, spicy mayo, salsa de anguila, crunchy tempura, serrano, tobiko y cebollín por fuera; kanikama spicy, pepino y aguacate por dentro. Usa 5 bases del sistema. $239',
    usaRecetas: ['shari', 'spicy-mayo', 'salsa-anguila', 'tempura-base', 'kanikama-spicy', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Shari': '†',
      'Kanikama spicy, pepino, aguacate': 'por dentro',
      'Hamachi': 'por fuera',
      'Spicy mayo + salsa de anguila': '†',
      'Crunchy tempura, serrano, tobiko, cebollín': '†',
    },
    criterio: {
      bien: 'Es el rollo con más componentes de la carta — el orden de armado es la receta. Cada corte muestra las capas completas y las salsas dibujan líneas, no manchas.',
      mal: 'Componentes olvidados o en desorden: con 9 elementos, la única defensa es la secuencia exacta. Por eso este rollo tiene video propio.',
    },
  },

  {
    slug: 'dragon-roll',
    titulo: 'Dragón Roll',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Camarón tempura, queso crema y pepino por dentro; aguacate, salsa de anguila con spicy mayo y zanahoria frita por fuera. $239',
    usaRecetas: ['shari', 'tempura-base', 'salsa-anguila', 'spicy-mayo'],
    usadaEn: [],
    ficha: {
      'Shari': '†',
      'Camarón tempura, queso crema, pepino': 'por dentro',
      'Aguacate': 'laminado por fuera',
      'Salsa de anguila + spicy mayo': '†',
      'Zanahoria frita': '†',
    },
    criterio: {
      bien: 'El aguacate exterior en láminas traslúcidas y continuas — el "lomo del dragón" parejo. La zanahoria frita crujiente como escamas.',
      mal: 'Aguacate oxidado o en trozos desiguales: se lamina al momento, de piezas en su punto exacto de madurez.',
    },
  },

  {
    slug: 'hot-roll',
    titulo: 'Hot Roll',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Salmón, camarón tempura y espárrago por dentro; camarón cocido con spicy mayo, alga rallada, furikake, quinoa inflada y salsa de anguila por fuera. $249',
    usaRecetas: ['shari', 'tempura-base', 'spicy-mayo', 'salsa-anguila', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Shari': '†',
      'Salmón, camarón tempura, espárrago': 'por dentro',
      'Camarón cocido + spicy mayo': 'por fuera',
      'Alga rallada, furikake, quinoa inflada': '†',
      'Salsa de anguila': '†',
    },
    criterio: {
      bien: 'Los toppings secos (furikake, quinoa) se aplican al final y crujen. El camarón exterior en mariposa pareja.',
      mal: 'Quinoa inflada aguada: tocó las salsas demasiado pronto. Los secos siempre son lo último que toca el rollo.',
    },
  },

  {
    slug: 'anguila-unagi-especial',
    titulo: 'Anguila Unagi Especial',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '6 min',
    descripcion: 'Anguila con foie gras flameado por fuera; flakes de tempura, aderezo de trufa y aguacate por dentro. $249',
    usaRecetas: ['shari', 'tempura-base', 'aderezo-trufa'],
    usadaEn: [],
    ficha: {
      'Shari': '†',
      'Flakes de tempura, aderezo de trufa, aguacate': 'por dentro',
      'Anguila': 'por fuera',
      'Foie gras': 'flameado al pase',
    },
    criterio: {
      bien: 'El foie se flamea segundos antes de salir — superficie dorada, centro fundente. Es el rollo más rico de la carta: porciones exactas.',
      mal: 'Foie derretido por completo: exceso de soplete. El foie se atempera, se flamea y sale — no se cocina.',
    },
  },

  {
    slug: 'okinawa-chutoro',
    titulo: 'Okinawa Chutoro',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Chutoro y cebolla frita con spicy trufado por dentro; forrado de aguacate, punto de sriracha y cebollín. $249',
    usaRecetas: ['shari', 'aderezo-trufa', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Shari': '†',
      'Chutoro + cebolla frita + spicy trufado': 'por dentro',
      'Aguacate': 'forrado exterior',
      'Sriracha': 'en puntos',
      'Cebollín': '†',
    },
    criterio: {
      bien: 'El chutoro es graso y delicado — cortes limpios, manejo mínimo con las manos. El forrado de aguacate continuo.',
      mal: 'Chutoro manoseado: la grasa se opaca con el calor de las manos. Se corta y se coloca, sin retrabajar.',
    },
  },

  {
    slug: 'jalapeno-roll',
    titulo: 'Jalapeño Roll',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Atún sellado y aguacate por dentro; tobiko, jalapeño, cebolla frita y spicy mayo por fuera. $239',
    usaRecetas: ['shari', 'spicy-mayo', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Shari': '†',
      'Atún sellado + aguacate': 'por dentro',
      'Tobiko, jalapeño, cebolla frita': 'por fuera',
      'Spicy mayo': '†',
    },
    criterio: {
      bien: 'El atún interior va sellado — anillo cocido fino, centro crudo. El jalapeño en rodajas finas distribuidas pareja sobre los 8 cortes.',
      mal: 'Atún sellado de más: pierde el contraste que define al rollo. Sellado es superficie, no cocción.',
    },
  },

  {
    slug: 'soft-shell-crab',
    titulo: 'Soft Shell Crab Roll',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Soft shell crab, cangrejo, aguacate, pepino, tobiko y spicy mayo. $249',
    usaRecetas: ['shari', 'spicy-mayo'],
    usadaEn: [],
    ficha: {
      'Shari': '†',
      'Soft shell crab frito': '†',
      'Cangrejo, aguacate, pepino': '†',
      'Tobiko + spicy mayo': '†',
    },
    criterio: {
      bien: 'El soft shell crab frito y crujiente, con las patas asomando del corte — es la presentación clásica del rollo. Se fríe al momento de la comanda.',
      mal: 'Cangrejo frito con anticipación: pierde el crujido que da nombre al rollo. Fritura por comanda, sin excepción.',
    },
  },

  {
    slug: 'everest-roll',
    titulo: 'Everest Roll',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Camarón tempura flameado con spicy mayo, cebollín, tobiko y salsa de anguila por fuera; atún y aguacate por dentro. El rollo que lleva el nombre de la montaña de Yasuko. $239',
    usaRecetas: ['shari', 'tempura-base', 'spicy-mayo', 'salsa-anguila', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Shari': '†',
      'Atún + aguacate': 'por dentro',
      'Camarón tempura flameado': 'por fuera',
      'Spicy mayo, cebollín, tobiko': '†',
      'Salsa de anguila': '†',
    },
    criterio: {
      bien: 'El flameado dora la spicy mayo sobre el camarón — gratinado ligero, no quemado. Las salsas en líneas cruzadas limpias.',
      mal: 'Spicy mayo quemada en manchas negras: el soplete se detuvo en un punto. El soplete siempre en movimiento.',
    },
  },

  {
    slug: 'futo-maguro',
    titulo: 'Futo Maguro',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Tres partes de atún — akami, chutoro y toro — con cebollín y tacuan. La degustación de maguro en un rollo. $249',
    usaRecetas: ['shari', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Shari': '†',
      'Akami': '†',
      'Chutoro': '†',
      'Toro': '†',
      'Cebollín + tacuan': '†',
    },
    criterio: {
      bien: 'Los tres cortes de atún visibles y diferenciados en cada pieza — del rojo magro del akami al veteado del toro. El tacuan aporta el crujido.',
      mal: 'Cortes mezclados sin orden: el rollo es una degustación — cada parte del atún tiene que distinguirse.',
    },
  },

  {
    slug: 'rainbow',
    titulo: 'Rainbow Roll',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Pesca blanca, salmón y aguacate por dentro; atún, nikiri y cebollín por fuera. $229',
    usaRecetas: ['shari', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Shari': '†',
      'Pesca blanca, salmón, aguacate': 'por dentro',
      'Atún': 'láminas por fuera',
      'Nikiri': 'pincelado al pase',
      'Cebollín': '†',
    },
    criterio: {
      bien: 'Las láminas exteriores alternadas con precisión — el degradado de colores es el nombre del rollo. El nikiri pincelado da el brillo final.',
      mal: 'Láminas desiguales o mal traslapadas: el "arcoíris" se rompe. Este rollo se juzga primero con los ojos.',
    },
  },

  {
    slug: 'lemon-salmon-roll',
    titulo: 'Lemon Salmón Roll',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion: 'Salmón, limón amarillo, yuzu kosho, sal negra, dry miso y spicy mayo por fuera; espárrago y aguacate por dentro. $219',
    usaRecetas: ['shari', 'spicy-mayo', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Shari': '†',
      'Espárrago + aguacate': 'por dentro',
      'Salmón': 'por fuera',
      'Limón amarillo': 'láminas muy finas',
      'Yuzu kosho, sal negra, dry miso': 'en puntos',
    },
    criterio: {
      bien: 'El limón amarillo en láminas casi transparentes sobre el salmón — se come, no se retira. La sal negra y el dry miso en dosis mínimas.',
      mal: 'Rodajas de limón gruesas: amargan y dominan. La lámina fina es la diferencia entre perfume y castigo.',
    },
  },

  {
    slug: 'hand-rolls',
    titulo: 'Hand Rolls — técnica de cono',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '4 min',
    descripcion:
      'El cono de alga con las 5 versiones de la carta: tuna/salmón spicy mayo ($125), maguro trufa ($125), negitoro ($179), salmón ikura ($169) y tuna/salmón spicy ($125).',
    usaRecetas: ['shari', 'spicy-mayo', 'spicy-rayu', 'aderezo-trufa', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Hand Roll Tuna/Salmón Spicy Mayo': '$125',
      'Hand Roll Maguro Trufa': '$125',
      'Hand Roll Negitoro': '$179',
      'Hand Roll Salmón Ikura': '$169',
      'Hand Roll Tuna/Salmón Spicy': '$125',
      'Alga': 'tostada y crujiente — se arma frente al cliente idealmente',
    },
    criterio: {
      bien: 'El cono se arma y se entrega de inmediato — el alga cruje en la primera mordida. Arroz tibio, relleno frío, cono firme que no gotea.',
      mal: 'Hand roll que espera en la barra: en 3 minutos el alga es papel mojado. Es el platillo más urgente del pase.',
    },
  },

  {
    slug: 'hoso-maki',
    titulo: 'Hoso Maki — rollos tradicionales',
    estacion: 'rollos',
    tipo: 'platillo',
    duracion: '5 min',
    descripcion:
      'Los rollos delgados de 6 piezas: tekka ($169), salmón ($169), kappa ($125), negitoro ($179), hamachi ($169) y sésamo maki ($169).',
    usaRecetas: ['shari', 'tempura-base', 'spicy-mayo', 'vinagreta-yuzu', 'manejo-de-crudos'],
    usadaEn: [],
    ficha: {
      'Tekka (atún)': '$169',
      'Salmón Maki': '$169',
      'Kappa Maki (pepino)': '$125',
      'Negitoro Maki': '$179',
      'Hamachi Maki': '$169',
      'Sésamo Maki (camarón tempura)': '$169',
      'Formato': '6 piezas, media hoja de alga',
    },
    criterio: {
      bien: 'Rollo delgado y uniforme, relleno centrado en las 6 piezas. El corte con cuchillo húmedo — piezas idénticas, alga tensa.',
      mal: 'Relleno descentrado que se sale por un extremo: la distribución antes de enrollar es toda la técnica del hoso maki.',
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS DE APRENDIZAJE
// ─────────────────────────────────────────────────────────────────────────────

export const RUTAS: Ruta[] = [
  {
    slug: 'sushiman-barra',
    titulo: 'Sushiman — Barra fría y rollos',
    descripcion:
      'De los protocolos al rollo insignia. Empieza por apertura y manejo de crudos, domina el shari y las bases, y termina armando el Yasuko Roll.',
    puesto: 'Sushiman · Barra fría',
    modulos: [
      'apertura',
      'recepcion-producto',
      'manejo-de-crudos',
      'shari',
      'spicy-mayo',
      'salsa-anguila',
      'aderezo-trufa',
      'spicy-rayu',
      'tempura-base',
      'nigiri-tecnica',
      'sashimi-cortes',
      'hoso-maki',
      'hand-rolls',
      'spicy-tuna-salmon-roll',
      'maguro-trufa-roll',
      'dragon-roll',
      'everest-roll',
      'yasuko-roll',
      'limpieza-estacion',
      'cierre',
    ],
  },
  {
    slug: 'cocina-caliente',
    titulo: 'Cocinero — Cocina caliente',
    descripcion:
      'La estación de fuego: producción diaria, fondos, wok y fritura. De los edamames al salmón teriyaki, pasando por los dos ramen de la carta.',
    puesto: 'Cocinero · Cocina caliente',
    modulos: [
      'apertura',
      'produccion-diaria',
      'arroz-gohan',
      'salsa-teriyaki',
      'fondo-ramen',
      'huevo-marinado',
      'tempura-base',
      'edamames',
      'gyozas',
      'shishito-peppers',
      'vegetales-tempura',
      'firecracker-cauliflower',
      'camarones-melon',
      'brochetas-pork-belly',
      'yakimeshi',
      'sopa-miso',
      'ramen',
      'ramen-miso',
      'salmon-teriyaki',
      'limpieza-estacion',
      'cierre',
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

export function getTipoBadge(tipo: TipoModulo): { label: string; style: string } {
  const map: Record<TipoModulo, { label: string; style: string }> = {
    subreceta: {
      label: 'Subreceta',
      style: 'border:1px solid #C9A45D;color:#C9A45D;background:transparent;',
    },
    platillo: {
      label: 'Platillo',
      style: 'border:1px solid rgba(201,164,93,0.35);color:#C9A45D;background:rgba(201,164,93,0.1);',
    },
    protocolo: {
      label: 'Protocolo',
      style: 'border:1px solid rgba(242,239,232,0.3);color:rgba(242,239,232,0.55);background:transparent;',
    },
  };
  return map[tipo];
}
