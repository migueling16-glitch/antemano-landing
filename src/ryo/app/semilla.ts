/**
 * Datos de ejemplo con los que arranca la maqueta.
 *
 * Todo se calcula relativo a hoy, así que la maqueta siempre se ve "viva":
 * la apertura de hoy ya está hecha, el cierre está pendiente, ayer quedó un
 * cierre sin validar y hay preguntas de repaso para hoy.
 *
 * Las plantillas de apertura y cierre salen del checklist en papel de Ryo
 * (src/ryo/checklist/datos.ts): las mismas 64 tareas, con las críticas.
 */
import type {
  Estado, Plantilla, ItemPlantilla, Ejecucion, SesionCal, Shot, Semana, Marca, Progreso,
} from './estado';
import { TURNOS, PERIODICAS, LIMITE_REFRIGERACION } from '../checklist/datos';
import { jornadaDe, sumarDias, tsDgo, lunesDe } from './lib/tiempo';
import { redondear, CONTINUO } from './lib/calibracion';
import { programar } from './lib/repaso';

/* ── Plantillas desde el checklist en papel ─────────────── */

function desdePapel(turno: (typeof TURNOS)[number], id: string, extras: Record<number, ItemPlantilla[]>): Plantilla {
  const items: ItemPlantilla[] = [];
  turno.secciones.forEach((sec, si) => {
    sec.tareas.forEach((t, ti) => {
      const base = { id: `${id}-${si}-${ti}`, seccion: sec.titulo, critica: t.critica };
      // La barra calibra sin refractómetro: esa tarea del papel no pasa a la app.
      if (/refractómetro/i.test(t.texto)) return;
      if (t.herramienta === 'temperatura') {
        // La tarea de bitácora se vuelve dos lecturas con rango.
        for (const [n, suf] of [[1, 'a'], [2, 'b']] as const) {
          items.push({
            ...base, id: `${base.id}${suf}`, tipo: 'numero', texto: `Temperatura refrigerador ${n}`,
            min: 0, max: LIMITE_REFRIGERACION, unidad: '°C', paso: 0.5, inicial: 4,
          });
        }
        return;
      }
      if (t.herramienta === 'calibracion') {
        items.push({ ...base, tipo: 'calibracion', texto: 'Calibrar el espresso del día (dosis, rendimiento, tiempo, sabor)' });
        return;
      }
      if (t.herramienta === 'faltantes') {
        items.push({ ...base, tipo: 'nota', texto: 'Faltantes para mañana' });
        return;
      }
      if (t.herramienta === 'reporte') {
        items.push({ ...base, tipo: 'nota', texto: 'Incidencias del turno para el reporte' });
        return;
      }
      items.push({ ...base, tipo: 'check', texto: t.texto });
    });
    items.push(...(extras[si] ?? []));
  });
  // Evidencia opcional en tareas donde una foto ayuda a validar.
  for (const it of items) {
    if (/^Caducidades|^Mesas, sillas|^Vaciar la hielera|^Tarjas/.test(it.texto)) it.foto = 'opcional';
  }
  return {
    id, nombre: turno.titulo.replace('Checklist de ', '').replace(/^./, (c) => c.toUpperCase()),
    descripcion: turno.bajada, frecuencia: 'diaria', activa: true,
    horaLimite: turno.id === 'apertura' ? '08:00' : '23:30',
    items,
  };
}

function crearPlantillas(): Plantilla[] {
  const [ap, ci] = TURNOS;
  const apertura = desdePapel(ap, 'p-apertura', {
    [ap.secciones.length - 1]: [{ id: 'p-apertura-foto', seccion: 'Última revisión', tipo: 'foto', texto: 'Foto de la barra lista para abrir', foto: 'opcional' }],
  });
  const cierre = desdePapel(ci, 'p-cierre', {
    [ci.secciones.length - 1]: [{ id: 'p-cierre-foto', seccion: 'Cierre final', tipo: 'foto', texto: 'Foto de la barra al cerrar', foto: 'obligatoria', critica: true }],
  });
  const semanal = PERIODICAS.find((p) => p.frecuencia === 'Semanal')!;
  const profunda: Plantilla = {
    id: 'p-profunda', nombre: 'Limpieza profunda', descripcion: 'Semanal · lo que no va en el checklist diario',
    frecuencia: 'semanal', dia: 6, horaLimite: '23:30', activa: true,
    items: [
      ...semanal.tareas.map((t, i) => ({ id: `p-profunda-${i}`, seccion: 'Semanal', tipo: 'check' as const, texto: t })),
      { id: 'p-profunda-foto', seccion: 'Semanal', tipo: 'foto', texto: 'Foto de los refrigeradores limpios', foto: 'obligatoria' },
    ],
  };
  return [apertura, cierre, profunda];
}

/* ── Ejecuciones ya hechas ──────────────────────────────── */

function ejecutada(
  p: Plantilla, jornada: string, por: string, desde: string, hasta: string,
  opciones: { validadaPor?: string; validadaA?: string; especiales?: Record<string, Partial<Marca>> } = {},
): Ejecucion {
  const t0 = tsDgo(jornada, desde);
  let t1 = tsDgo(jornada, hasta);
  if (t1 < t0) t1 += 86_400_000;
  const marcas: Record<string, Marca> = {};
  p.items.forEach((it, i) => {
    const en = Math.round(t0 + ((t1 - t0) * (i + 1)) / (p.items.length + 1));
    const m: Marca = { por, en };
    if (it.tipo === 'numero') m.valor = it.inicial;
    if (it.tipo === 'nota') m.texto = 'Sin novedad';
    if (it.tipo === 'foto' || it.foto === 'obligatoria') m.fotoId = 'demo';
    marcas[it.id] = { ...m, ...opciones.especiales?.[it.id] };
  });
  return {
    id: `ej-${p.id}-${jornada}`, plantillaId: p.id, jornada, iniciadaPor: por, iniciadaEn: t0,
    completadaEn: t1, completadaPor: por, marcas,
    ...(opciones.validadaPor ? { validadaPor: opciones.validadaPor, validadaEn: tsDgo(jornada, opciones.validadaA ?? '09:30') } : {}),
  };
}

/* ── Sesiones de calibración que convergen ──────────────── */

type Paso = [molienda: number, tiempo: number, rendimiento: number, x: number, y: number];

function sesion(id: string, cafeId: string, botonId: string, por: string, jornada: string, diasReposo: number, hora: string, pasos: Paso[]): SesionCal {
  const inicio = tsDgo(jornada, hora);
  const shots: Shot[] = pasos.map(([molienda, tiempo, rendimiento, x, y], i) => ({
    id: `${id}-s${i + 1}`, n: i + 1, dosis: 18, molienda, tiempo, rendimiento,
    sabor: { x, y }, en: inicio + (i + 1) * 4 * 60_000,
  }));
  const ultimo = shots[shots.length - 1];
  ultimo.aprobado = true;
  return { id, cafeId, molinoId: 'eq-molino', botonId, por, jornada, diasReposo, inicio, fin: ultimo.en, shots, aprobadoId: ultimo.id };
}

/**
 * Shots típicos con botón volumétrico: rápido y ácido, se afina, se aprueba.
 * Con el volumen fijo, al moler más fino el peso baja un poco. La versión
 * larga se pasa de fino, regresa, y termina reprogramando el botón.
 */
function convergencia(final: number, larga = false): Paso[] {
  if (!larga) {
    return [
      [final + 1, 22, 37.9, -0.72, -0.3],
      [final + 0.5, 25, 37.1, -0.34, -0.06],
      [final, 28, 36.3, 0.06, 0.08],
    ];
  }
  return [
    [final + 0.5, 22, 37.4, -0.7, -0.3],
    [final - 0.5, 34, 34.9, 0.58, 0.35],
    [final, 29, 33.9, 0.1, 0.4],
    [final, 29, 36.1, 0.04, 0.06],
  ];
}

/* ── Todo ───────────────────────────────────────────────── */

/** Sube cuando cambia la forma del estado: lo guardado con otra versión se descarta. */
export const VERSION = 5;

export function crearSemilla(): Estado {
  const hoy = jornadaDe();
  const d = (n: number) => sumarDias(hoy, n);
  const plantillas = crearPlantillas();
  const [ap, ci, prof] = plantillas;

  const usuarios: Estado['usuarios'] = [
    { id: 'u-ana', nombre: 'Ana Ruiz', iniciales: 'AR', correo: 'ana@ryocafe.mx', rol: 'barista', nivel: 2, activo: true, ingreso: d(-120) },
    { id: 'u-diego', nombre: 'Diego Luna', iniciales: 'DL', correo: 'diego@ryocafe.mx', rol: 'barista', nivel: 1, activo: true, ingreso: d(-9) },
    { id: 'u-carla', nombre: 'Carla Méndez', iniciales: 'CM', correo: 'carla@ryocafe.mx', rol: 'encargado', nivel: 3, activo: true, ingreso: d(-400) },
    { id: 'u-sofia', nombre: 'Sofía Treviño', iniciales: 'ST', correo: 'sofia@ryocafe.mx', rol: 'admin', nivel: 3, activo: true, ingreso: d(-500) },
  ];

  // Calibración: dos lotes del Chiapas para que la tendencia de molienda
  // contra reposo tenga historia, más los otros cafés.
  const sesiones: SesionCal[] = [
    sesion('cal-h20', 'cafe-chiapas', 'b2', 'u-carla', d(-20), 4, '07:40', convergencia(7.0)),
    sesion('cal-h17', 'cafe-chiapas', 'b2', 'u-ana', d(-17), 7, '07:38', convergencia(6.5)),
    sesion('cal-h14', 'cafe-chiapas', 'b2', 'u-diego', d(-14), 10, '07:45', convergencia(6.0, true)),
    sesion('cal-h11', 'cafe-chiapas', 'b2', 'u-ana', d(-11), 13, '07:36', convergencia(5.5)),
    sesion('cal-h6', 'cafe-chiapas', 'b2', 'u-ana', d(-6), 4, '07:41', convergencia(7.0)),
    sesion('cal-h4', 'cafe-chiapas', 'b2', 'u-diego', d(-4), 6, '07:50', convergencia(6.5, true)),
    sesion('cal-h2', 'cafe-chiapas', 'b2', 'u-ana', d(-2), 8, '07:35', convergencia(6.5)),
    sesion('cal-h1', 'cafe-chiapas', 'b2', 'u-carla', d(-1), 9, '07:39', convergencia(6.0)),
    sesion('cal-oax', 'cafe-oaxaca', 'b3', 'u-ana', d(-1), 3, '12:10', [[7.5, 31, 38.4, 0.1, 0.05]]),
    sesion('cal-eti', 'cafe-etiopia', CONTINUO, 'u-carla', d(-3), 13, '12:20', [[6.0, 25, 40.6, -0.4, -0.1], [5.5, 27, 40.2, 0.02, 0.1]]),
    sesion('cal-hoy', 'cafe-chiapas', 'b2', 'u-ana', hoy, 10, '07:36', convergencia(6.0)),
  ];
  const hoySesion = sesiones[sesiones.length - 1];
  const aprobado = hoySesion.shots.find((s) => s.aprobado)!;
  const recetasDelDia: Estado['recetasDelDia'] = {};
  for (const s of sesiones.filter((x) => x.cafeId === 'cafe-chiapas')) {
    const a = s.shots.find((x) => x.aprobado)!;
    recetasDelDia[s.jornada] = {
      jornada: s.jornada, cafeId: s.cafeId, sesionId: s.id, shotId: a.id, por: s.por, en: s.fin!,
      botonId: s.botonId,
      dosis: a.dosis, rendimiento: a.rendimiento, tiempo: a.tiempo, molienda: a.molienda,
    };
  }

  // Checklists: la apertura de hoy hecha (con una lectura fuera de rango),
  // el cierre de ayer sin validar, lo demás validado.
  const refri2 = ap.items.find((i) => i.tipo === 'numero' && i.texto.endsWith('2'))!;
  const calItem = ap.items.find((i) => i.tipo === 'calibracion')!;
  const ejecuciones: Ejecucion[] = [
    ejecutada(ap, hoy, 'u-ana', '07:31', '07:58', {
      especiales: {
        [refri2.id]: { valor: 8.5, fuera: true, acciones: ['Aislé el producto', 'Avisé al encargado'] },
        [calItem.id]: { en: aprobado.en, texto: `Receta aprobada: ${aprobado.dosis} g → ${aprobado.rendimiento} g · ${aprobado.tiempo} s` },
        'p-apertura-foto': { fotoId: undefined },
      },
    }),
    ejecutada(ci, d(-1), 'u-diego', '22:48', '23:41', {
      especiales: { [ci.items.find((i) => i.tipo === 'nota' && i.texto.startsWith('Faltantes'))!.id]: { texto: 'Leche de avena (2 L), vasos de 12 oz' } },
    }),
    ejecutada(ap, d(-1), 'u-ana', '07:30', '07:57', { validadaPor: 'u-carla', validadaA: '09:12' }),
    ejecutada(ap, d(-2), 'u-diego', '07:33', '08:06', { validadaPor: 'u-carla' }),
    ejecutada(ci, d(-2), 'u-ana', '22:50', '23:28', { validadaPor: 'u-carla', validadaA: '09:05' }),
    ejecutada(prof, sumarDias(lunesDe(hoy), -2), 'u-diego', '21:10', '22:40', { validadaPor: 'u-carla' }),
  ];

  // Horario: esta semana publicada, la siguiente en borrador.
  const lunes = lunesDe(hoy);
  const semana = (inicio: string, estado: Semana['estado']): Semana => {
    const t: Record<string, string> = {};
    const pon = (u: string, dias: number[], turno: string) => dias.forEach((n) => { t[`${u}|${sumarDias(inicio, n)}`] = turno; });
    pon('u-ana', [0, 1, 2, 3, 4], 't-ap');
    pon('u-diego', [0, 2, 3], 't-ci');
    pon('u-diego', [4, 5], 't-cl');
    pon('u-carla', [1, 2, 3, 4, 5], 't-in');
    pon('u-carla', [6], 't-ci');
    pon('u-sofia', [5, 6], 't-ap');
    pon('u-sofia', [0], 't-in');
    pon('u-sofia', [1], 't-ci');
    return { id: inicio, estado, turnos: t, ...(estado === 'publicada' ? { publicadaEn: tsDgo(sumarDias(inicio, -3), '18:00') } : {}) };
  };

  // Capacitación: Ana va en Barista 2; Diego es de nuevo ingreso.
  const hace = (dias: number) => tsDgo(d(-dias), '16:00');
  const repasoDe = (ids: string[], proxima: string, idx = 1) =>
    Object.fromEntries(ids.map((q) => [q, { idx, proxima }]));
  const progreso: Record<string, Progreso> = {
    'u-ana': {
      lecciones: {
        'l-receta': hace(110), 'l-ratio': hace(105), 'l-leer': hace(100), 'l-texturizar': hace(95),
        'l-vaporizador': hace(95), 'l-criticas': hace(112), 'l-temperaturas': hace(112), 'l-calibrar': hace(5),
      },
      repaso: {
        ...repasoDe(['q-receta-1', 'q-receta-2', 'q-ratio-1', 'q-ratio-2', 'q-tex-1', 'q-tex-2', 'q-vap-1', 'q-crit-1', 'q-crit-2', 'q-temp-1'], d(12), 4),
        ...repasoDe(['q-leer-1', 'q-temp-2', 'q-cal-2'], hoy, 2),
        ...repasoDe(['q-leer-2', 'q-leer-3', 'q-cal-1'], d(4), 3),
      },
      evaluaciones: { 1: { por: 'u-carla', en: hace(60), criterios: [true, true, true] } },
      asignadas: [],
    },
    'u-diego': {
      lecciones: { 'l-receta': hace(7), 'l-criticas': hace(8), 'l-temperaturas': hace(8) },
      repaso: {
        ...repasoDe(['q-receta-1', 'q-crit-2', 'q-temp-1'], hoy, 1),
        'q-receta-2': programar(undefined, true, d(-1)),
        'q-crit-1': programar(undefined, true, d(-1)),
        'q-temp-2': programar(undefined, false, d(-1)),
      },
      evaluaciones: {},
      asignadas: [],
    },
  };

  return {
    v: VERSION,
    usuarioId: null,
    tema: 'auto',
    sucursal: { id: 's-durango', negocio: 'Ryo Café', nombre: 'Barra Durango', apertura: '08:00', cierre: '22:00' },
    usuarios,
    plantillas,
    ejecuciones,
    fotos: {},
    equipos: [
      { id: 'eq-molino', nombre: 'Molino de espresso', tipo: 'molino', paso: 0.5, uso: 'espresso' },
      { id: 'eq-molino-filtro', nombre: 'Molino de filtrados', tipo: 'molino', paso: 1, uso: 'filtrados' },
      {
        id: 'eq-maquina', nombre: 'Linea Classic AV', tipo: 'maquina',
        maquina: {
          modelo: 'La Marzocco Linea Classic AV', detalle: '1 grupo · botonera con timer', pid: 93.5,
          botones: [
            { id: 'b1', nombre: 'Sencillo' },
            { id: 'b2', nombre: 'Doble casa' },
            { id: 'b3', nombre: 'Doble origen' },
            { id: 'b4', nombre: 'Sin asignar' },
          ],
          programado: {
            b1: { gramos: 18.2, en: tsDgo(d(-20), '07:52'), por: 'u-carla' },
            b2: { gramos: aprobado.rendimiento, en: hoySesion.fin!, por: 'u-ana' },
            b3: { gramos: 38.4, en: tsDgo(d(-1), '12:14'), por: 'u-ana' },
          },
        },
      },
    ],
    cafes: [
      {
        id: 'cafe-chiapas', nombre: 'Chiapas · de la casa', origen: 'Chiapas, México', proceso: 'Lavado', tostador: 'Tostado en casa',
        tueste: d(-10), activo: true, notas: 'Cacao, panela, final limpio.', boton: 'b2',
        objetivo: { dosis: 18, rendimiento: 36, tiempo: 28, tolTiempo: 2, tolRatio: 0.05 },
      },
      {
        id: 'cafe-oaxaca', nombre: 'Oaxaca · Pluma', origen: 'Oaxaca, México', proceso: 'Natural', tostador: 'Tostado en casa',
        tueste: d(-4), activo: true, notas: 'Frutos rojos, cuerpo medio.', boton: 'b3',
        objetivo: { dosis: 18, rendimiento: 38, tiempo: 30, tolTiempo: 2, tolRatio: 0.05 },
      },
      {
        id: 'cafe-etiopia', nombre: 'Etiopía · Guji', origen: 'Guji, Etiopía', proceso: 'Natural', tostador: 'Tostador invitado',
        tueste: d(-16), activo: true, notas: 'Floral, durazno, acidez brillante. Café invitado: se sirve con continuo.', boton: CONTINUO,
        objetivo: { dosis: 18, rendimiento: 40, tiempo: 27, tolTiempo: 2, tolRatio: 0.05 },
      },
    ],
    sesiones,
    recetasDelDia,
    turnosTipo: [
      { id: 't-ap', nombre: 'Apertura', corto: 'AP', inicio: '07:30', fin: '15:30' },
      { id: 't-in', nombre: 'Intermedio', corto: 'IN', inicio: '11:00', fin: '19:00' },
      { id: 't-ci', nombre: 'Cierre', corto: 'CI', inicio: '15:00', fin: '23:30' },
      { id: 't-cl', nombre: 'Cierre largo', corto: 'CL', inicio: '16:30', fin: '01:00' },
    ],
    semanas: [semana(lunes, 'publicada'), semana(sumarDias(lunes, 7), 'borrador')],
    disponibilidad: {
      'u-ana': [false, true, true, true, true, true, true],
      'u-diego': [true, true, false, true, true, true, true],
      'u-carla': [true, true, true, true, true, true, true],
      'u-sofia': [true, true, true, false, false, true, true],
    },
    cambios: [
      {
        id: 'cam-1', de: 'u-diego', fecha: sumarDias(lunes, 5), turnoId: 't-cl', motivo: 'Examen el domingo temprano',
        acepta: 'u-ana', estado: 'aceptado', en: tsDgo(d(-1), '13:20'),
      },
      { id: 'cam-2', de: 'u-ana', fecha: sumarDias(lunes, 3), turnoId: 't-ap', motivo: 'Cita médica en la mañana', estado: 'abierto', en: tsDgo(hoy, '06:50') },
    ],
    progreso,
  };
}

/** Ayuda para mostrar valores de semilla con un decimal. */
export const uno = (n: number) => redondear(n, 1).toFixed(1);
