/**
 * Datos de ejemplo con los que arranca la maqueta.
 *
 * Todo se calcula relativo a hoy, así que la maqueta siempre se ve "viva":
 * la apertura de hoy ya está hecha, el cierre está pendiente, ayer quedó un
 * cierre sin validar y hay preguntas de repaso para hoy.
 *
 * Apertura y cierre son las listas reales de la barra; la limpieza profunda
 * semanal sale del checklist en papel (src/ryo/checklist/datos.ts).
 */
import type {
  Estado, Plantilla, ItemPlantilla, Ejecucion, SesionCal, Shot, Semana, Marca, Progreso,
} from './estado';
import type { Franja } from './lib/turnos';
import { PERIODICAS } from '../checklist/datos';
import { jornadaDe, sumarDias, tsDgo, lunesDe, fechaCorta } from './lib/tiempo';
import { redondear, CONTINUO } from './lib/calibracion';
import { programar } from './lib/repaso';

/* ── Plantillas: las listas de la barra ────────────────── */

type Tarea = string | Partial<ItemPlantilla> & { texto: string };

function lista(id: string, seccion: string, tareas: Tarea[]): ItemPlantilla[] {
  return tareas.map((t, i): ItemPlantilla => ({ id: `${id}-${i}`, seccion, tipo: 'check', ...(typeof t === 'string' ? { texto: t } : t) }));
}

/**
 * Apertura y cierre son las listas de la barra de Ryo (nota del 29-sep-2026),
 * en su orden. Sobre ellas: el stock del refri se anota, la vitrina y la
 * barra llevan foto, y agua y máquina desconectada son críticas.
 */
function crearPlantillas(): Plantilla[] {
  const apertura: Plantilla = {
    id: 'p-apertura', nombre: 'Apertura', descripcion: 'Agua, máquina, luces, salón, baños y producto.',
    frecuencia: 'diaria', horaLimite: '08:00', activa: true,
    items: lista('p-apertura', 'Al llegar', [
      { texto: 'Checar agua', critica: true },
      'Revisar limpieza',
      'Encender máquina',
      'Encender sonido',
      'Encender luces',
      'Revisar barra de endulzantes y agitadores',
      'Revisar área comedor',
      'Abrir y revisar baños',
      { texto: 'Revisar vitrina de pan', foto: 'opcional' },
      { texto: 'Temperatura del refri', tipo: 'numero', critica: true, min: 0, max: 7, unidad: '°C', paso: 0.5, inicial: 3.5 },
      { texto: 'Revisar stock del refri', tipo: 'nota' },
    ]),
  };
  const cierre: Plantilla = {
    id: 'p-cierre', nombre: 'Cierre', descripcion: 'Barra, máquina, tarja, loza, remojos y desconectar.',
    frecuencia: 'diaria', horaLimite: '23:30', activa: true,
    items: lista('p-cierre', 'Al cerrar', [
      { texto: 'Limpieza de barra general', foto: 'obligatoria' },
      { texto: 'Limpieza de máquina', foto: 'opcional' },
      'Limpieza de tarja',
      'Limpieza de enjuagador',
      'Limpieza de loza',
      'Remojar portafiltros',
      'Remojar trapos',
      { texto: 'Desconectar máquina', critica: true },
    ]),
  };
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
  // Lo que se completa en la noche se valida a la mañana siguiente.
  let tv = tsDgo(jornada, opciones.validadaA ?? '09:30');
  if (tv < t1) tv += 86_400_000;
  return {
    id: `ej-${p.id}-${jornada}`, plantillaId: p.id, jornada, iniciadaPor: por, iniciadaEn: t0,
    completadaEn: t1, completadaPor: por, marcas,
    ...(opciones.validadaPor ? { validadaPor: opciones.validadaPor, validadaEn: tv } : {}),
  };
}

/* ── Sesiones de calibración que convergen ──────────────── */

type Paso = [molienda: number, tiempo: number, rendimiento: number, x: number, y: number];

function sesion(id: string, cafeId: string, botonId: string, por: string, jornada: string, diasReposo: number, hora: string, pasos: Paso[]): SesionCal {
  const inicio = tsDgo(jornada, hora);
  const shots: Shot[] = pasos.map(([molienda, tiempo, rendimiento, x, y], i) => ({
    id: `${id}-s${i + 1}`, n: i + 1, dosis: 18, molienda, tiempo, rendimiento,
    ...(botonId === CONTINUO ? {} : { pulsos: 120 }),
    sabor: { x, y }, en: inicio + (i + 1) * 4 * 60_000,
  }));
  const ultimo = shots[shots.length - 1];
  ultimo.aprobado = true;
  return { id, cafeId, molinoId: 'eq-molino', botonId, canastillaId: 'can-18', por, jornada, diasReposo, inicio, fin: ultimo.en, shots, aprobadoId: ultimo.id };
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
export const VERSION = 12;

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

  // Calibración: dos lotes del blend de la casa para que la tendencia de molienda
  // contra reposo tenga historia, más los otros cafés.
  const sesiones: SesionCal[] = [
    sesion('cal-h20', 'cafe-casa', 'b2', 'u-carla', d(-20), 4, '07:40', convergencia(7.0)),
    sesion('cal-h17', 'cafe-casa', 'b2', 'u-ana', d(-17), 7, '07:38', convergencia(6.5)),
    sesion('cal-h14', 'cafe-casa', 'b2', 'u-diego', d(-14), 10, '07:45', convergencia(6.0, true)),
    sesion('cal-h11', 'cafe-casa', 'b2', 'u-ana', d(-11), 13, '07:36', convergencia(5.5)),
    sesion('cal-h6', 'cafe-casa', 'b2', 'u-ana', d(-6), 4, '07:41', convergencia(7.0)),
    sesion('cal-h4', 'cafe-casa', 'b2', 'u-diego', d(-4), 6, '07:50', convergencia(6.5, true)),
    sesion('cal-h2', 'cafe-casa', 'b2', 'u-ana', d(-2), 8, '07:35', convergencia(6.5)),
    sesion('cal-h1', 'cafe-casa', 'b2', 'u-carla', d(-1), 9, '07:39', convergencia(6.0)),
    sesion('cal-desc3', 'cafe-descaf', 'b3', 'u-carla', d(-3), 6, '12:20', [[5.5, 24, 37.0, -0.4, -0.1], [5.0, 28, 36.2, 0.02, 0.1]]),
    sesion('cal-desc1', 'cafe-descaf', 'b3', 'u-ana', d(-1), 8, '12:10', [[5.0, 29, 36.4, 0.1, 0.05]]),
    sesion('cal-hoy', 'cafe-casa', 'b2', 'u-ana', hoy, 10, '07:36', convergencia(6.0)),
  ];
  const hoySesion = sesiones[sesiones.length - 1];
  const aprobado = hoySesion.shots.find((s) => s.aprobado)!;
  // Hoy solo está calibrado el de la casa: el descafeinado queda pendiente.
  const recetasDelDia: Estado['recetasDelDia'] = {};
  for (const s of sesiones) {
    const a = s.shots.find((x) => x.aprobado)!;
    recetasDelDia[s.jornada] ??= {};
    recetasDelDia[s.jornada][s.cafeId] = {
      jornada: s.jornada, cafeId: s.cafeId, sesionId: s.id, shotId: a.id, por: s.por, en: s.fin!,
      botonId: s.botonId,
      dosis: a.dosis, rendimiento: a.rendimiento, tiempo: a.tiempo, molienda: a.molienda, ...(a.pulsos ? { pulsos: a.pulsos } : {}), canastillaId: 'can-18',
    };
  }

  // Checklists: la apertura de hoy hecha, el cierre de ayer sin validar, lo
  // demás validado.
  const stock = ap.items.find((i) => i.tipo === 'nota')!;
  // Dos semanas de historia para que el Panel tenga tendencias: casi todo a
  // tiempo, algunos tarde, un cierre que no se hizo y un par de lecturas
  // del refri fuera de rango.
  const refri = ap.items.find((i) => i.tipo === 'numero')!;
  const quienAp = ['u-ana', 'u-ana', 'u-diego', 'u-ana', 'u-sofia', 'u-ana', 'u-diego'];
  const quienCi = ['u-diego', 'u-carla', 'u-diego', 'u-sofia', 'u-diego', 'u-carla', 'u-sofia'];
  // Esta semana va mejor que la anterior: menos atrasos y se valida más rápido.
  const finAp = ['07:52', '07:55', '08:12', '07:49', '07:58', '08:21', '08:09', '07:51', '08:15', '07:56', '07:53', '07:59'];
  const finCi = ['23:22', '23:18', '23:25', '23:25', '23:12', '23:28', '23:51', '23:44', '23:26', '23:15', '23:24', '23:19'];
  const historia: Ejecucion[] = [];
  for (let k = 3; k <= 14; k++) {
    const j = d(-k);
    const i = k - 3;
    const lect = k === 6 ? { [refri.id]: { valor: 8.5, fuera: true, acciones: ['Moví a otro refri', 'Avisé al encargado'] } } : {};
    historia.push(ejecutada(ap, j, quienAp[k % 7], '07:30', finAp[i], { validadaPor: 'u-carla', validadaA: k < 7 ? ['09:10', '09:40', '10:05'][k % 3] : ['12:30', '14:10', '10:40', '13:00'][k % 4], especiales: lect }));
    if (k !== 8) historia.push(ejecutada(ci, j, quienCi[k % 7], '22:45', finCi[i], { validadaPor: k % 3 ? 'u-carla' : 'u-sofia', validadaA: k < 7 ? '09:20' : '13:45' }));
  }
  const ejecuciones: Ejecucion[] = [
    ejecutada(ap, hoy, 'u-ana', '07:31', '07:52', {
      especiales: { [stock.id]: { texto: 'Queda 1 L de leche de avena; pedir para mañana.' } },
    }),
    ejecutada(ci, d(-1), 'u-diego', '22:48', '23:31'),
    ejecutada(ap, d(-1), 'u-ana', '07:30', '07:57', {
      validadaPor: 'u-carla', validadaA: '09:12',
      especiales: { [refri.id]: { valor: 7.5, fuera: true, acciones: ['Avisé al encargado'] } },
    }),
    ejecutada(ap, d(-2), 'u-diego', '07:33', '08:06', { validadaPor: 'u-carla' }),
    ejecutada(ci, d(-2), 'u-ana', '22:50', '23:28', { validadaPor: 'u-carla', validadaA: '09:05' }),
    ejecutada(prof, sumarDias(lunesDe(hoy), -2), 'u-diego', '21:10', '22:40', { validadaPor: 'u-carla' }),
    ...historia,
  ];

  const incidencias: Estado['incidencias'] = [
    {
      id: 'inc-refri', titulo: 'Temperatura del refri: 7.5 °C', detalle: 'Fuera del rango 0 a 7 °C. Ana lo vio al abrir.',
      origen: 'lectura', categoria: 'inocuidad', prioridad: 'alta', ejecucionId: `ej-${ap.id}-${d(-1)}`, itemId: refri.id,
      abiertaPor: 'u-ana', abiertaEn: tsDgo(d(-1), '07:41'), responsable: 'u-diego', vence: hoy,
      seguimiento: [
        { por: 'u-carla', en: tsDgo(d(-1), '09:12'), texto: 'Asignada a Diego, para hoy.' },
        { por: 'u-diego', en: tsDgo(d(-1), '17:30'), texto: 'El empaque de la puerta no sella bien. Llamé al técnico.' },
      ],
    },
    {
      id: 'inc-vapor', titulo: 'Gotea la llave del vaporizador', detalle: 'Gotea poquito al cerrarla, sobre todo en la mañana.',
      origen: 'reporte', categoria: 'equipo', prioridad: 'normal', abiertaPor: 'u-ana', abiertaEn: tsDgo(d(-2), '08:40'), seguimiento: [],
    },
    {
      id: 'inc-refri-ant', titulo: 'Temperatura del refri: 8.5 °C', detalle: 'Fuera del rango 0 a 7 °C.',
      origen: 'lectura', categoria: 'inocuidad', prioridad: 'alta', ejecucionId: `ej-${ap.id}-${d(-6)}`, itemId: refri.id,
      abiertaPor: quienAp[6 % 7], abiertaEn: tsDgo(d(-6), '07:44'), responsable: 'u-carla', vence: d(-5),
      seguimiento: [{ por: 'u-carla', en: tsDgo(d(-6), '10:40'), texto: 'Producto movido al refri de atrás.' }],
      cerradaPor: 'u-carla', cerradaEn: tsDgo(d(-5), '12:00'), cierre: 'Se descongeló y se limpió el refri; volvió a 3 °C.',
    },
  ];

  const bitacora: Estado['bitacora'] = [
    { id: 'bit-1', jornada: hoy, categoria: 'producto', texto: 'Queda 1 L de leche de avena. Pedido hecho para mañana a primera hora.', por: 'u-carla', en: tsDgo(hoy, '09:05') },
    { id: 'bit-2', jornada: d(-1), categoria: 'equipo', texto: 'El refri amaneció en 7.5 °C. El técnico viene el jueves; mientras, revisar la temperatura a medio día también.', por: 'u-carla', en: tsDgo(d(-1), '09:15'), fijada: true },
    { id: 'bit-3', jornada: d(-1), categoria: 'turno', texto: 'Cierre tranquilo. Diego terminó a las 23:31; faltó validar.', por: 'u-sofia', en: tsDgo(d(-1), '23:40') },
    { id: 'bit-4', jornada: d(-2), categoria: 'clientes', texto: 'Dos clientes preguntaron por leche de almendra. Valorar tenerla.', por: 'u-carla', en: tsDgo(d(-2), '18:10') },
    { id: 'bit-5', jornada: d(-3), categoria: 'personal', texto: 'Diego ya calibra solo el descafeinado; falta practicar el blend en hora pico.', por: 'u-carla', en: tsDgo(d(-3), '16:00') },
  ];

  // Horario: esta semana publicada y limpia (sin alertas); la siguiente en
  // borrador con cuatro cosas por revisar, para que se vean las reglas: un
  // día libre aprobado con turno, un cierre seguido de apertura, alguien
  // puesto en un día que no puede y una tarde sin nadie en barra.
  const lunes = lunesDe(hoy);
  const semana = (inicio: string, estado: Semana['estado'], plan: Record<string, [number[], string][]>): Semana => {
    const t: Record<string, string> = {};
    for (const [u, bloques] of Object.entries(plan)) {
      for (const [dias, turno] of bloques) dias.forEach((n) => { t[`${u}|${sumarDias(inicio, n)}`] = turno; });
    }
    return { id: inicio, estado, turnos: t, ...(estado === 'publicada' ? { publicadaEn: tsDgo(sumarDias(inicio, -3), '18:00') } : {}) };
  };
  const estaSemana = semana(lunes, 'publicada', {
    'u-ana': [[[0, 1, 2, 3, 4], 't-ap']],
    'u-diego': [[[0, 2, 3], 't-ci'], [[4, 5], 't-cl']],
    'u-carla': [[[1, 3, 4, 5], 't-in'], [[6], 't-ci']],
    'u-sofia': [[[5, 6], 't-ap'], [[0], 't-in'], [[1], 't-ci']],
  });
  const siguiente = semana(sumarDias(lunes, 7), 'borrador', {
    'u-ana': [[[0, 1, 2, 3, 4, 6], 't-ap']],
    'u-diego': [[[0, 2], 't-ci'], [[4], 't-cl'], [[5], 't-ap']],
    'u-carla': [[[1, 3, 4, 5], 't-in'], [[6], 't-ci']],
    'u-sofia': [[[0], 't-in'], [[1], 't-ci'], [[5], 't-cl']],
  });

  // Disponibilidad por franjas (0 = domingo).
  const todo = (): Franja[] => ['manana', 'tarde', 'noche'];
  const tardes = (): Franja[] => ['tarde', 'noche'];
  const disponibilidad: Estado['disponibilidad'] = {
    'u-ana': [[], todo(), todo(), todo(), todo(), todo(), todo()],
    'u-diego': [todo(), tardes(), [], tardes(), tardes(), tardes(), todo()],
    'u-carla': Array.from({ length: 7 }, todo),
    'u-sofia': [todo(), todo(), todo(), todo(), [], [], todo()],
  };

  const ausencias: Estado['ausencias'] = [
    {
      id: 'aus-1', usuarioId: 'u-sofia', desde: sumarDias(lunes, 7), hasta: sumarDias(lunes, 7), tipo: 'dia-libre',
      motivo: 'Trámite en la mañana', estado: 'aprobada', en: tsDgo(d(-4), '10:00'), resolvio: 'u-carla',
    },
    {
      id: 'aus-2', usuarioId: 'u-diego', desde: sumarDias(lunes, 14), hasta: sumarDias(lunes, 16), tipo: 'vacaciones',
      motivo: 'Viaje familiar', estado: 'pendiente', en: tsDgo(d(-1), '20:10'),
    },
  ];

  const aviso = (id: string, para: string, de: string, texto: string, ruta: string, en: number, leidaPor: string[] = []) =>
    ({ id, para, de, texto, ruta, en, leidaPor });
  const sab = fechaCorta(sumarDias(lunes, 5));
  const notificaciones: Estado['notificaciones'] = [
    aviso('not-1', 'todos', 'u-ana', `Ana busca quién le cubra el ${fechaCorta(sumarDias(lunes, 3))}.`, '#/horarios/cambios', tsDgo(hoy, '06:50')),
    aviso('not-2', 'encargados', 'u-diego', `Diego pidió vacaciones del ${fechaCorta(sumarDias(lunes, 14))} al ${fechaCorta(sumarDias(lunes, 16))}.`, '#/horarios/cambios', tsDgo(d(-1), '20:10')),
    aviso('not-3', 'encargados', 'u-ana', `Ana aceptó cubrir el ${sab} de Diego. Falta tu aprobación.`, '#/horarios/cambios', tsDgo(d(-1), '13:20')),
    aviso('not-4', 'u-diego', 'u-ana', `Ana aceptó cubrir tu turno del ${sab}. Falta la aprobación.`, '#/horarios/cambios', tsDgo(d(-1), '13:20')),
    aviso('not-5', 'u-sofia', 'u-carla', `Aprobaron tu día libre del ${fechaCorta(sumarDias(lunes, 7))}.`, '#/horarios/disponibilidad', tsDgo(d(-4), '10:00')),
    aviso('not-7', 'u-diego', 'u-carla', `Carla te propone cambiar: tú tomas su cierre del ${fechaCorta(sumarDias(lunes, 6))} y ella tu cierre del ${fechaCorta(sumarDias(lunes, 2))}.`, '#/horarios/cambios', tsDgo(hoy, '07:10')),
    aviso('not-6', 'todos', 'u-carla', `Ya está el horario del ${fechaCorta(lunes)} al ${fechaCorta(sumarDias(lunes, 6))}.`, '#/horarios', estaSemana.publicadaEn!, ['u-sofia']),
  ];

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
            { id: 'b3', nombre: 'Doble descaf' },
            { id: 'b4', nombre: 'Sin asignar' },
          ],
          pulsos: { b1: 70, b2: 120, b3: 120 },
          canastillas: [
            { id: 'can-7', nombre: 'Sencilla', gramos: 7 },
            { id: 'can-14', nombre: 'Doble chica', gramos: 14 },
            { id: 'can-18', nombre: 'Doble', gramos: 18 },
            { id: 'can-21', nombre: 'Triple', gramos: 21 },
          ],
          gPorPulso: 0.5,
          programado: {
            b1: { gramos: 18.2, en: tsDgo(d(-20), '07:52'), por: 'u-carla' },
            b2: { gramos: aprobado.rendimiento, en: hoySesion.fin!, por: 'u-ana' },
            b3: { gramos: 36.4, en: tsDgo(d(-1), '12:14'), por: 'u-ana' },
          },
        },
      },
    ],
    cafes: [
      {
        id: 'cafe-casa', nombre: 'Blend de la casa', origen: 'Por confirmar', proceso: 'Por confirmar', tostador: 'Por confirmar',
        tueste: d(-10), activo: true, notas: 'Notas de cata por confirmar con el tostador.', boton: 'b2', casa: true, canastilla: 'can-18',
        objetivo: { dosis: 18, rendimiento: 36, tiempo: 28, tolTiempo: 2, tolRatio: 0.05 },
      },
      {
        id: 'cafe-descaf', nombre: 'Descafeinado', origen: 'Por confirmar', proceso: 'Por confirmar', tostador: 'Por confirmar',
        tueste: d(-9), activo: true, notas: 'Notas de cata por confirmar con el tostador.', boton: 'b3', canastilla: 'can-18',
        objetivo: { dosis: 18, rendimiento: 36, tiempo: 28, tolTiempo: 2, tolRatio: 0.05 },
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
    semanas: [estaSemana, siguiente],
    disponibilidad,
    ausencias,
    notificaciones,
    cambios: [
      {
        id: 'cam-1', de: 'u-diego', fecha: sumarDias(lunes, 5), turnoId: 't-cl', motivo: 'Examen el domingo temprano',
        acepta: 'u-ana', estado: 'aceptado', en: tsDgo(d(-1), '11:05'), aceptadoEn: tsDgo(d(-1), '13:20'),
      },
      {
        id: 'cam-3', de: 'u-carla', fecha: sumarDias(lunes, 6), turnoId: 't-ci', motivo: 'Comida familiar el domingo',
        para: 'u-diego', aCambio: { fecha: sumarDias(lunes, 2), turnoId: 't-ci' }, estado: 'abierto', en: tsDgo(hoy, '07:10'),
      },
      { id: 'cam-2', de: 'u-ana', fecha: sumarDias(lunes, 3), turnoId: 't-ap', motivo: 'Cita médica en la mañana', estado: 'abierto', en: tsDgo(hoy, '06:50') },
    ],
    progreso,
    incidencias,
    bitacora,
  };
}

/** Ayuda para mostrar valores de semilla con un decimal. */
export const uno = (n: number) => redondear(n, 1).toFixed(1);
