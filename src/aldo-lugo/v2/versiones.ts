/**
 * Versiones de la landing (27-nov-2026): el mismo guion y el mismo texto, contados con otras tomas del evento.
 * Cada ranura apunta a un loop de public/aldo-lugo/video (sin extensión); '' = solo foto.
 * A usa los loops originales (_tools/loops_web.py); B, C y D, los de _tools/loops_versiones.py (vNNN = clip VNNN).
 * Dentro de una versión ningún clip se repite. La chapa se queda igual en todas: es la única toma de la chapa
 * encendida y el comparador "servido / al fuego" depende de ella.
 *
 * Correcciones de Aldo (27-nov, WhatsApp):
 * - "Así se vive" muestra estructura y comida, no el lugar ni las mesas: que no se entienda que los eventos son ahí.
 * - Cierre: fuego prendiendo de su cocina (c2067 / c2068, carpeta de Canito, sin marca), no la piedra volcánica de la vinata.
 */

export type Ranura =
  | 'hero'
  | 'historia-1' | 'historia-2' | 'historia-3' | 'historia-4'
  | 'guia'
  | 'colgadero' | 'domo' | 'parrilla' | 'chapa' | 'rescoldo' | 'olla'
  | 'prueba' | 'cierre'
  | 'plato-picadas' | 'plato-hummus' | 'plato-muhamara' | 'plato-risotto' | 'plato-pollo' | 'plato-tomahawk' | 'plato-postre';

export type VersionId = 'a' | 'b' | 'c' | 'd';

export const VERSIONES: Record<VersionId, { nombre: string; ruta: string; clips: Record<Ranura, string> }> = {
  a: {
    nombre: 'A',
    ruta: '/aldolugo/',
    clips: {
      hero: 'hero', // V057 Aldo mueve la olla
      'historia-1': 'imagina-1', // V001 colgadero con tomahawks y leña
      'historia-2': 'v011', // Aldo entre el humo y el domo
      'historia-3': 'v276', // Aldo emplata
      'historia-4': 'v142', // tuétanos de noche
      guia: 'guia', // V085
      colgadero: 'colgadero', // V096
      domo: 'jaula', // V054
      parrilla: 'parrilla', // V017
      chapa: 'disco', // V087
      rescoldo: 'rescoldo', // V095
      olla: '', // la olla ya está en la portada
      prueba: 'prueba', // V236
      cierre: 'c2068', // leña prendiendo en la reja de hierro
      'plato-picadas': 'v141',
      'plato-hummus': 'v084',
      'plato-muhamara': 'v111',
      'plato-risotto': 'v145',
      'plato-pollo': 'v055',
      'plato-tomahawk': 'v094',
      'plato-postre': 'v161',
    },
  },
  // B · de día: el proceso a plena luz
  b: {
    nombre: 'B',
    ruta: '/aldolugo/b/',
    clips: {
      hero: 'v011', // Aldo camina por la cocina, con humo y el domo
      'historia-1': 'v238', // colgadero con flama
      'historia-2': 'v056', // domo con piñas y berenjenas
      'historia-3': 'guia', // V085 Aldo emplata
      'historia-4': 'v141', // tuétanos de noche
      guia: 'v276', // Aldo emplata el hummus
      colgadero: 'v002',
      domo: 'v055',
      parrilla: 'v015',
      chapa: 'disco',
      rescoldo: 'v014',
      olla: 'hero', // V057
      prueba: 'v229', // dron: la cruz de mesas y la hacienda
      cierre: 'c2067', // leña ardiendo
      'plato-picadas': 'v142',
      'plato-hummus': 'v277',
      'plato-muhamara': 'v112',
      'plato-risotto': 'v145',
      'plato-pollo': 'jaula', // V054
      'plato-tomahawk': 'v094',
      'plato-postre': 'v162',
    },
  },
  // C · al caer la noche: luz cálida
  c: {
    nombre: 'C',
    ruta: '/aldolugo/c/',
    clips: {
      hero: 'v093', // Aldo emplata de noche
      'historia-1': 'v007', // tomahawks colgados
      'historia-2': 'colgadero', // V096 tomahawk de noche
      'historia-3': 'v110', // emplatado de noche
      'historia-4': 'v111', // muhamara servida
      guia: 'v086',
      colgadero: 'v094',
      domo: 'v056',
      parrilla: 'rescoldo', // V095
      chapa: 'disco',
      rescoldo: 'v014',
      olla: 'hero', // V057
      prueba: 'v234', // dron cenital al anochecer
      cierre: 'c2068',
      'plato-picadas': 'v142',
      'plato-hummus': 'v084',
      'plato-muhamara': 'v112',
      'plato-risotto': 'v145',
      'plato-pollo': 'v055',
      'plato-tomahawk': 'v008',
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
      'historia-2': 'v015', // Aldo en el colgadero
      'historia-3': 'v086', // Aldo emplata al atardecer
      'historia-4': 'v161', // postre
      guia: 'v028', // Aldo habla a cámara
      colgadero: 'v008',
      domo: 'jaula', // V054
      parrilla: 'v237',
      chapa: 'disco',
      rescoldo: 'rescoldo', // V095
      olla: 'hero', // V057
      prueba: 'v221', // dron cenital de día
      cierre: 'c2067',
      'plato-picadas': 'v141',
      'plato-hummus': 'v277',
      'plato-muhamara': 'v111',
      'plato-risotto': 'v145',
      'plato-pollo': 'v055',
      'plato-tomahawk': 'v094',
      'plato-postre': 'v162',
    },
  },
};
