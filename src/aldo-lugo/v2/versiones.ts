/**
 * Versiones de la landing (27-nov-2026): el mismo guion y el mismo texto, contados con otras tomas del evento.
 * Cada ranura apunta a un loop de public/aldo-lugo/video (sin extensión); '' = solo foto.
 * A usa los loops originales (_tools/loops_web.py); B, C y D, los de _tools/loops_versiones.py (vNNN = clip VNNN).
 * Dentro de una versión ningún clip se repite. El disco se queda igual en todas: es la única toma del disco
 * encendido y el comparador "servido / al fuego" depende de ella.
 */

export type Ranura =
  | 'hero'
  | 'historia-1' | 'historia-2' | 'historia-3' | 'historia-4'
  | 'guia'
  | 'colgadero' | 'jaula' | 'parrilla' | 'disco' | 'rescoldo' | 'olla'
  | 'prueba' | 'cierre'
  | 'plato-tuetanos' | 'plato-longaniza' | 'plato-camote' | 'plato-arroz' | 'plato-pollo' | 'plato-lomo' | 'plato-postre';

export type VersionId = 'a' | 'b' | 'c' | 'd';

export const VERSIONES: Record<VersionId, { nombre: string; ruta: string; clips: Record<Ranura, string> }> = {
  a: {
    nombre: 'A',
    ruta: '/aldolugo/',
    clips: {
      hero: 'hero', // V057 Aldo mueve la olla
      'historia-1': 'imagina-1', // V001
      'historia-2': 'imagina-2', // V232
      'historia-3': 'imagina-3', // V091
      'historia-4': 'imagina-4', // V153
      guia: 'guia', // V085
      colgadero: 'colgadero', // V096
      jaula: 'jaula', // V054
      parrilla: 'parrilla', // V017
      disco: 'disco', // V087
      rescoldo: 'rescoldo', // V095
      olla: '', // la olla ya está en la portada
      prueba: 'prueba', // V236
      cierre: 'cierre', // V124
      'plato-tuetanos': 'v141',
      'plato-longaniza': 'v084',
      'plato-camote': 'v111',
      'plato-arroz': 'v145',
      'plato-pollo': 'v055',
      'plato-lomo': 'v094',
      'plato-postre': 'v161',
    },
  },
  // B · de día: el proceso a plena luz
  b: {
    nombre: 'B',
    ruta: '/aldolugo/b/',
    clips: {
      hero: 'v011', // Aldo camina por la cocina, con humo y la jaula
      'historia-1': 'v238', // colgadero con flama
      'historia-2': 'v231', // dron al atardecer
      'historia-3': 'v278', // cielo rosa sobre las mesas
      'historia-4': 'v138', // la mesa larga de noche
      guia: 'v276', // Aldo emplata la longaniza
      colgadero: 'v002',
      jaula: 'v055',
      parrilla: 'v015',
      disco: 'disco',
      rescoldo: 'v014',
      olla: 'hero', // V057
      prueba: 'v229', // dron: la cruz de mesas y la hacienda
      cierre: 'v123',
      'plato-tuetanos': 'v142',
      'plato-longaniza': 'v277',
      'plato-camote': 'v112',
      'plato-arroz': 'v145',
      'plato-pollo': 'jaula', // V054
      'plato-lomo': 'v094',
      'plato-postre': 'v162',
    },
  },
  // C · al caer la noche: luz cálida
  c: {
    nombre: 'C',
    ruta: '/aldolugo/c/',
    clips: {
      hero: 'v093', // Aldo emplata de noche
      'historia-1': 'v007',
      'historia-2': 'v092',
      'historia-3': 'v279',
      'historia-4': 'v192', // fogata bajo la pérgola
      guia: 'v086',
      colgadero: 'v094',
      jaula: 'v056',
      parrilla: 'rescoldo', // V095
      disco: 'disco',
      rescoldo: 'v014',
      olla: 'hero', // V057
      prueba: 'v234', // dron cenital al anochecer
      cierre: 'v125',
      'plato-tuetanos': 'v142',
      'plato-longaniza': 'v084',
      'plato-camote': 'v112',
      'plato-arroz': 'v145',
      'plato-pollo': 'v055',
      'plato-lomo': 'v008',
      'plato-postre': 'v161',
    },
  },
  // D · de cerca: Aldo a cámara, brasa y detalle
  d: {
    nombre: 'D',
    ruta: '/aldolugo/d/',
    clips: {
      hero: 'v013', // Aldo en la parrilla con el atizador
      'historia-1': 'v014', // brasa
      'historia-2': 'v233',
      'historia-3': 'v106',
      'historia-4': 'v115',
      guia: 'v028', // Aldo habla a cámara
      colgadero: 'v008',
      jaula: 'jaula', // V054
      parrilla: 'v237',
      disco: 'disco',
      rescoldo: 'rescoldo', // V095
      olla: 'hero', // V057
      prueba: 'v221', // dron cenital de día
      cierre: 'v172',
      'plato-tuetanos': 'v141',
      'plato-longaniza': 'v277',
      'plato-camote': 'v111',
      'plato-arroz': 'v145',
      'plato-pollo': 'v055',
      'plato-lomo': 'v094',
      'plato-postre': 'v162',
    },
  },
};
