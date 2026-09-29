/**
 * Estado de la maqueta.
 *
 * Todo vive en el teléfono (localStorage; las fotos en IndexedDB). La forma
 * de los datos es la del modelo acordado en la Fase 0 (negocio → sucursal →
 * operación), para que pasar a Supabase sea cambiar de dónde se leen y
 * escriben, no rediseñar.
 */
import { useSyncExternalStore } from 'react';
import { crearSemilla, VERSION } from './semilla';
import { jornadaDe, fechaCorta, sumarDias } from './lib/tiempo';
import { programar, type EstadoPregunta } from './lib/repaso';
import { CONTINUO, type Objetivo, type Sabor } from './lib/calibracion';
import { borrarFotos } from './lib/fotos';
import { FRANJAS, type Franja } from './lib/turnos';

/* ═══ TIPOS ═══════════════════════════════════════════════ */

export type Rol = 'admin' | 'encargado' | 'barista';

export type Usuario = {
  id: string;
  nombre: string;
  iniciales: string;
  correo: string;
  rol: Rol;
  nivel: 1 | 2 | 3;
  activo: boolean;
  /** "AAAA-MM-DD" de ingreso: define la ruta de onboarding */
  ingreso: string;
  invitado?: boolean;
};

export type TipoItem = 'check' | 'numero' | 'foto' | 'nota' | 'calibracion';

export type ItemPlantilla = {
  id: string;
  seccion: string;
  texto: string;
  tipo: TipoItem;
  /** Letra recta en el checklist: seguridad, inocuidad o dinero. */
  critica?: boolean;
  min?: number;
  max?: number;
  unidad?: string;
  paso?: number;
  inicial?: number;
  /** Botón de evidencia en el ítem */
  foto?: 'opcional' | 'obligatoria';
};

export type Plantilla = {
  id: string;
  nombre: string;
  descripcion: string;
  frecuencia: 'diaria' | 'semanal';
  /** Para las semanales: 0 = domingo … 6 = sábado */
  dia?: number;
  /** "HH:MM" en hora de Durango. Pasada la hora sin completar = atrasada. */
  horaLimite: string;
  activa: boolean;
  items: ItemPlantilla[];
};

export type Marca = {
  por: string;
  /** Hora del servidor (en la maqueta, la del teléfono) */
  en: number;
  valor?: number;
  texto?: string;
  fotoId?: string;
  fuera?: boolean;
  acciones?: string[];
};

export type Ejecucion = {
  id: string;
  plantillaId: string;
  jornada: string;
  iniciadaPor: string;
  iniciadaEn: number;
  completadaEn?: number;
  completadaPor?: string;
  marcas: Record<string, Marca>;
  validadaPor?: string;
  validadaEn?: number;
};

export type FotoMeta = {
  id: string;
  por: string;
  en: number;
  bytes: number;
  bytesOriginal: number;
  /** Sin red, la foto espera en el teléfono y sube al reconectar. */
  estado: 'subida' | 'pendiente';
};

export type Equipo = {
  id: string; nombre: string; tipo: 'molino' | 'maquina';
  paso?: number;
  /** Los molinos de filtrados no aparecen al calibrar espresso. */
  uso?: 'espresso' | 'filtrados';
  maquina?: Maquina;
};

/** Lo que sabe la app de un botón: cuánto entrega en la báscula. */
export type Programacion = { gramos: number; en: number; por: string };

/**
 * La Marzocco Linea Classic AV de un grupo: caldera de café con PID (una sola
 * temperatura para todos los cafés), flujómetro, y botonera con timer y 4
 * dosis programables más continuo. El tiempo del shot se lee en la botonera.
 */
export type Maquina = {
  modelo: string;
  detalle: string;
  /** °C de la caldera de café */
  pid: number;
  botones: { id: string; nombre: string }[];
  /** botonId → última medición */
  programado: Record<string, Programacion>;
};
export { CONTINUO };

export type Cafe = {
  id: string;
  nombre: string;
  origen: string;
  proceso: string;
  tostador: string;
  /** "AAAA-MM-DD" */
  tueste: string;
  activo: boolean;
  notas: string;
  objetivo: Objetivo;
  /** Botón de la máquina con el que se sirve, o continuo. */
  boton: string;
  /** El espresso de la casa: el que llevan las bebidas del menú. */
  casa?: boolean;
};

export type Shot = {
  id: string;
  n: number;
  dosis: number;
  rendimiento: number;
  tiempo: number;
  molienda: number;
  sabor?: Sabor;
  en: number;
  aprobado?: boolean;
};

export type SesionCal = {
  id: string;
  cafeId: string;
  molinoId: string;
  /** id del botón volumétrico, o CONTINUO */
  botonId: string;
  por: string;
  jornada: string;
  diasReposo: number;
  inicio: number;
  fin?: number;
  shots: Shot[];
  aprobadoId?: string;
};

export type RecetaDelDia = {
  jornada: string;
  cafeId: string;
  sesionId: string;
  shotId: string;
  por: string;
  en: number;
  botonId: string;
  dosis: number;
  rendimiento: number;
  tiempo: number;
  molienda: number;
};

export type TurnoTipo = { id: string; nombre: string; corto: string; inicio: string; fin: string };

export type Semana = {
  /** "AAAA-MM-DD" del lunes */
  id: string;
  estado: 'borrador' | 'publicada';
  publicadaEn?: number;
  /** clave `${usuarioId}|${fecha}` → id del turno tipo */
  turnos: Record<string, string>;
};

export type CambioTurno = {
  id: string;
  de: string;
  fecha: string;
  turnoId: string;
  motivo: string;
  acepta?: string;
  estado: 'abierto' | 'aceptado' | 'aprobado' | 'rechazado';
  en: number;
};

/** Días libres o vacaciones: los pide el barista y los aprueba el encargado. */
export type Ausencia = {
  id: string;
  usuarioId: string;
  /** "AAAA-MM-DD", inclusive */
  desde: string;
  hasta: string;
  tipo: 'dia-libre' | 'vacaciones';
  motivo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  en: number;
  resolvio?: string;
};

/**
 * Aviso en la bandeja de Inicio. `para` es un usuario, 'todos' o
 * 'encargados' (encargado y admin). Quien lo generó no lo recibe.
 */
export type Notificacion = {
  id: string;
  para: string;
  de?: string;
  texto: string;
  ruta?: string;
  en: number;
  leidaPor: string[];
};

export type Progreso = {
  /** leccionId → momento en que se completó */
  lecciones: Record<string, number>;
  /** preguntaId → cuándo toca repasarla */
  repaso: Record<string, EstadoPregunta>;
  /** nivel → firma de la evaluación práctica */
  evaluaciones: Record<string, { por: string; en: number; criterios: boolean[] }>;
  /** Lecciones reasignadas por el encargado (reentrenamiento) */
  asignadas: { leccionId: string; por: string; en: number; motivo: string }[];
};

export type Estado = {
  v: number;
  usuarioId: string | null;
  /** "Mantener la sesión en este teléfono". Si no, abrir la app de nuevo pide iniciar sesión. */
  recordar?: boolean;
  tema: 'auto' | 'champagne' | 'cafe';
  sucursal: { id: string; negocio: string; nombre: string; apertura: string; cierre: string };
  usuarios: Usuario[];
  plantillas: Plantilla[];
  ejecuciones: Ejecucion[];
  fotos: Record<string, FotoMeta>;
  equipos: Equipo[];
  cafes: Cafe[];
  sesiones: SesionCal[];
  /** jornada → cafeId → receta aprobada ese día (cada café tiene la suya) */
  recetasDelDia: Record<string, Record<string, RecetaDelDia>>;
  turnosTipo: TurnoTipo[];
  semanas: Semana[];
  /** usuarioId → por día (0 = domingo) las franjas en que SÍ puede trabajar */
  disponibilidad: Record<string, Franja[][]>;
  cambios: CambioTurno[];
  ausencias: Ausencia[];
  notificaciones: Notificacion[];
  progreso: Record<string, Progreso>;
};

/* ═══ ALMACÉN ═════════════════════════════════════════════ */

export { VERSION };
/** Cambia sola con VERSION: lo guardado con otra forma no se lee. */
export const CLAVE = `ryo-app:v${VERSION}`;

/** Marca de la pestaña: sobrevive a recargar, no a cerrar la app. */
const SESION = 'ryo-app:sesion';
const sesionViva = () => { try { return sessionStorage.getItem(SESION) === '1'; } catch { return false; } };

function cargar(): Estado {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Estado | null;
    if (guardado && guardado.v === VERSION) {
      if (!guardado.recordar && !sesionViva()) guardado.usuarioId = null;
      return guardado;
    }
  } catch {}
  return crearSemilla();
}

let estado: Estado = typeof window === 'undefined' ? crearSemilla() : cargar();
const oyentes = new Set<() => void>();

function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch {}
}

export function useEstado(): Estado {
  return useSyncExternalStore(
    (f) => { oyentes.add(f); return () => oyentes.delete(f); },
    () => estado,
    () => estado,
  );
}

export const leerEstado = () => estado;

/** Cambia el estado sobre una copia y avisa a la interfaz. */
export function actualizar(fn: (e: Estado) => void) {
  const copia = structuredClone(estado);
  fn(copia);
  estado = copia;
  guardar();
  oyentes.forEach((o) => o());
}

export function reiniciarDemo() {
  const usuarioId = estado.usuarioId;
  estado = { ...crearSemilla(), usuarioId };
  guardar();
  borrarFotos();
  oyentes.forEach((o) => o());
}

export const nuevoId = (prefijo: string) =>
  `${prefijo}-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 8)}`;

/* ═══ CONSULTAS ═══════════════════════════════════════════ */

export const usuario = (e: Estado, id?: string) => e.usuarios.find((u) => u.id === id);
export const yo = (e: Estado) => usuario(e, e.usuarioId ?? undefined);
export const cafe = (e: Estado, id: string) => e.cafes.find((c) => c.id === id);
export const plantilla = (e: Estado, id: string) => e.plantillas.find((p) => p.id === id);
export const maquinaDe = (e: Estado) => e.equipos.find((x) => x.tipo === 'maquina')?.maquina;
export const nombreBoton = (m: Maquina | undefined, botonId: string) =>
  botonId === CONTINUO ? 'Continuo' : m?.botones.find((b) => b.id === botonId)?.nombre ?? botonId;
export const programadoDe = (m: Maquina | undefined, botonId: string) => m?.programado[botonId];

/** La receta del día de un café. */
export const recetaDe = (e: Estado, jornada: string, cafeId: string): RecetaDelDia | undefined =>
  e.recetasDelDia[jornada]?.[cafeId];

/**
 * La receta del día del espresso de la casa (la que llevan las bebidas); si
 * la casa no se ha calibrado, la más reciente de ese día.
 */
export function recetaCasa(e: Estado, jornada: string): RecetaDelDia | undefined {
  const del = e.recetasDelDia[jornada] ?? {};
  const casa = e.cafes.find((c) => c.activo && c.casa);
  return (casa && del[casa.id]) ?? Object.values(del).sort((a, b) => b.en - a.en)[0];
}
export const puede = (e: Estado, ...roles: Rol[]) => {
  const u = yo(e);
  return !!u && roles.includes(u.rol);
};

/** La ejecución de una plantilla en una jornada, si existe. */
export const ejecucionDe = (e: Estado, plantillaId: string, jornada: string) =>
  e.ejecuciones.find((x) => x.plantillaId === plantillaId && x.jornada === jornada);

/** Qué plantillas tocan hoy. */
export function plantillasDeHoy(e: Estado, hoy = jornadaDe()) {
  const dia = new Date(`${hoy}T12:00:00Z`).getUTCDay();
  return e.plantillas.filter((p) => p.activa && (p.frecuencia === 'diaria' || p.dia === dia));
}

/** Ítems que faltan para poder completar (los de foto obligatoria cuentan). */
export function pendientes(p: Plantilla, ej?: Ejecucion) {
  return p.items.filter((i) => {
    const m = ej?.marcas[i.id];
    if (!m) return true;
    if (i.foto === 'obligatoria' && !m.fotoId) return true;
    return false;
  });
}

export const fueraDeRango = (ej?: Ejecucion) => Object.values(ej?.marcas ?? {}).filter((m) => m.fuera);

export function progresoDe(e: Estado, usuarioId: string): Progreso {
  return e.progreso[usuarioId] ?? { lecciones: {}, repaso: {}, evaluaciones: {}, asignadas: [] };
}

/* ═══ ACCIONES ════════════════════════════════════════════ */

export function entrar(usuarioId: string, recordar?: boolean) {
  try { sessionStorage.setItem(SESION, '1'); } catch {}
  actualizar((e) => { e.usuarioId = usuarioId; if (recordar !== undefined) e.recordar = recordar; });
}

export function salir() {
  try { sessionStorage.removeItem(SESION); } catch {}
  actualizar((e) => { e.usuarioId = null; e.recordar = false; });
}
export const cambiarTema = (tema: Estado['tema']) => actualizar((e) => { e.tema = tema; });

/* ── Checklists ─────────────────────────────────────────── */

export function iniciarEjecucion(plantillaId: string): string {
  const hoy = jornadaDe();
  const existente = ejecucionDe(estado, plantillaId, hoy);
  if (existente) return existente.id;
  const id = nuevoId('ej');
  actualizar((e) => {
    e.ejecuciones.push({ id, plantillaId, jornada: hoy, iniciadaPor: e.usuarioId!, iniciadaEn: Date.now(), marcas: {} });
  });
  return id;
}

export function marcar(ejecucionId: string, itemId: string, datos: Partial<Marca> = {}) {
  actualizar((e) => {
    const ej = e.ejecuciones.find((x) => x.id === ejecucionId);
    if (!ej || ej.completadaEn) return;
    const previa = ej.marcas[itemId];
    ej.marcas[itemId] = { ...previa, ...datos, por: e.usuarioId!, en: previa?.en ?? Date.now() };
  });
}

export function desmarcar(ejecucionId: string, itemId: string): Marca | undefined {
  let quitada: Marca | undefined;
  actualizar((e) => {
    const ej = e.ejecuciones.find((x) => x.id === ejecucionId);
    if (!ej || ej.completadaEn) return;
    quitada = ej.marcas[itemId];
    delete ej.marcas[itemId];
  });
  return quitada;
}

export function restaurarMarca(ejecucionId: string, itemId: string, marca: Marca) {
  actualizar((e) => {
    const ej = e.ejecuciones.find((x) => x.id === ejecucionId);
    if (ej && !ej.completadaEn) ej.marcas[itemId] = marca;
  });
}

export function registrarFoto(meta: FotoMeta) {
  actualizar((e) => { e.fotos[meta.id] = meta; });
}

/** Al volver la red, lo que esperaba en el teléfono se sube. */
export function subirPendientes(): number {
  const n = Object.values(estado.fotos).filter((f) => f.estado === 'pendiente').length;
  if (n) actualizar((e) => { Object.values(e.fotos).forEach((f) => { f.estado = 'subida'; }); });
  return n;
}

export function completar(ejecucionId: string) {
  actualizar((e) => {
    const ej = e.ejecuciones.find((x) => x.id === ejecucionId);
    if (ej) { ej.completadaEn = Date.now(); ej.completadaPor = e.usuarioId!; }
  });
}

export function reabrir(ejecucionId: string) {
  actualizar((e) => {
    const ej = e.ejecuciones.find((x) => x.id === ejecucionId);
    if (ej) { delete ej.completadaEn; delete ej.completadaPor; delete ej.validadaEn; delete ej.validadaPor; }
  });
}

export function validar(ejecucionId: string) {
  actualizar((e) => {
    const ej = e.ejecuciones.find((x) => x.id === ejecucionId);
    if (ej) { ej.validadaPor = e.usuarioId!; ej.validadaEn = Date.now(); }
  });
}

/* ── Calibración ────────────────────────────────────────── */

export function nuevaSesion(cafeId: string, molinoId: string, diasReposo: number, botonId: string): string {
  const id = nuevoId('cal');
  actualizar((e) => {
    e.sesiones.push({ id, cafeId, molinoId, botonId, por: e.usuarioId!, jornada: jornadaDe(), diasReposo, inicio: Date.now(), shots: [] });
  });
  return id;
}

/** Reprogramar un botón: la app anota lo que ahora entrega en la báscula. */
export function programarBoton(botonId: string, gramos: number) {
  actualizar((e) => {
    const m = maquinaDe(e);
    if (m) m.programado[botonId] = { gramos, en: Date.now(), por: e.usuarioId! };
  });
}

export function cambiarPid(pid: number) {
  actualizar((e) => { const m = maquinaDe(e); if (m) m.pid = pid; });
}

export function renombrarBoton(botonId: string, nombre: string) {
  actualizar((e) => {
    const b = maquinaDe(e)?.botones.find((x) => x.id === botonId);
    if (b && nombre.trim()) b.nombre = nombre.trim();
  });
}

export function asignarBoton(cafeId: string, botonId: string) {
  actualizar((e) => { const c = e.cafes.find((x) => x.id === cafeId); if (c) c.boton = botonId; });
}

export function guardarShot(sesionId: string, datos: Omit<Shot, 'id' | 'n' | 'en'>): string {
  const id = nuevoId('shot');
  actualizar((e) => {
    const s = e.sesiones.find((x) => x.id === sesionId);
    if (s) s.shots.push({ ...datos, id, n: s.shots.length + 1, en: Date.now() });
  });
  return id;
}

export function evaluarShot(sesionId: string, shotId: string, datos: Pick<Shot, 'sabor'>) {
  actualizar((e) => {
    const shot = e.sesiones.find((x) => x.id === sesionId)?.shots.find((x) => x.id === shotId);
    if (shot) Object.assign(shot, datos);
  });
}

/** Corregir los números de un shot mal capturado. */
export function corregirShot(sesionId: string, shotId: string, datos: Pick<Shot, 'dosis' | 'rendimiento' | 'molienda' | 'tiempo'>) {
  actualizar((e) => {
    const shot = e.sesiones.find((x) => x.id === sesionId)?.shots.find((x) => x.id === shotId);
    if (shot) Object.assign(shot, datos);
  });
}

/** Cerrar una sesión sin aprobar ningún shot. */
export function terminarSesion(sesionId: string) {
  actualizar((e) => {
    const s = e.sesiones.find((x) => x.id === sesionId);
    if (s && !s.fin) s.fin = Date.now();
  });
}

/** Deshacer el cierre de una sesión que no tenía receta aprobada. */
export function reabrirSesion(sesionId: string) {
  actualizar((e) => {
    const s = e.sesiones.find((x) => x.id === sesionId);
    if (s && !s.aprobadoId) delete s.fin;
  });
}

/**
 * Aprobar un shot lo fija como receta del día para todo el turno, y completa
 * los ítems de checklist enlazados a calibración.
 */
export function aprobarShot(sesionId: string, shotId: string) {
  actualizar((e) => {
    const s = e.sesiones.find((x) => x.id === sesionId);
    const shot = s?.shots.find((x) => x.id === shotId);
    if (!s || !shot) return;
    s.shots.forEach((x) => { x.aprobado = x.id === shotId; });
    s.aprobadoId = shotId;
    s.fin = Date.now();
    e.recetasDelDia[s.jornada] ??= {};
    e.recetasDelDia[s.jornada][s.cafeId] = {
      jornada: s.jornada, cafeId: s.cafeId, sesionId, shotId, por: e.usuarioId!, en: Date.now(),
      botonId: s.botonId,
      dosis: shot.dosis, rendimiento: shot.rendimiento, tiempo: shot.tiempo, molienda: shot.molienda,
    };
    // El shot aprobado es la medición más reciente de ese botón.
    const m = maquinaDe(e);
    if (m && s.botonId !== CONTINUO) m.programado[s.botonId] = { gramos: shot.rendimiento, en: Date.now(), por: e.usuarioId! };
    for (const ej of e.ejecuciones.filter((x) => x.jornada === s.jornada && !x.completadaEn)) {
      const p = e.plantillas.find((x) => x.id === ej.plantillaId);
      p?.items.filter((i) => i.tipo === 'calibracion' && !ej.marcas[i.id]).forEach((i) => {
        ej.marcas[i.id] = { por: e.usuarioId!, en: Date.now(), texto: `Receta aprobada: ${shot.dosis} g → ${shot.rendimiento} g · ${shot.tiempo} s` };
      });
    }
  });
}

/* ── Horarios ───────────────────────────────────────────── */

const rango = (lunes: string) => `${fechaCorta(lunes)} al ${fechaCorta(sumarDias(lunes, 6))}`;
const primer = (e: Estado, id?: string) => e.usuarios.find((u) => u.id === id)?.nombre.split(' ')[0] ?? 'Alguien';

function notificar(e: Estado, para: string, texto: string, ruta?: string) {
  e.notificaciones.unshift({ id: nuevoId('not'), para, de: e.usuarioId ?? undefined, texto, ruta, en: Date.now(), leidaPor: [] });
}

function semanaDe(e: Estado, semanaId: string) {
  let sem = e.semanas.find((s) => s.id === semanaId);
  if (!sem) { sem = { id: semanaId, estado: 'borrador', turnos: {} }; e.semanas.push(sem); }
  return sem;
}

export function asignarTurno(semanaId: string, usuarioId: string, fecha: string, turnoId: string | null) {
  actualizar((e) => {
    const sem = semanaDe(e, semanaId);
    const k = `${usuarioId}|${fecha}`;
    if (turnoId) sem.turnos[k] = turnoId; else delete sem.turnos[k];
    if (sem.estado === 'publicada') sem.estado = 'borrador';
  });
}

/** Copia los turnos de la semana anterior, día por día. */
export function copiarSemana(semanaId: string) {
  actualizar((e) => {
    const origen = e.semanas.find((s) => s.id === sumarDias(semanaId, -7));
    const sem = semanaDe(e, semanaId);
    sem.turnos = {};
    for (const [k, t] of Object.entries(origen?.turnos ?? {})) {
      const [u, fecha] = k.split('|');
      sem.turnos[`${u}|${sumarDias(fecha, 7)}`] = t;
    }
    sem.estado = 'borrador';
  });
}

export function limpiarSemana(semanaId: string) {
  actualizar((e) => { const sem = semanaDe(e, semanaId); sem.turnos = {}; sem.estado = 'borrador'; });
}

export function publicarSemana(semanaId: string) {
  actualizar((e) => {
    const sem = e.semanas.find((s) => s.id === semanaId);
    if (!sem) return;
    const otraVez = !!sem.publicadaEn;
    sem.estado = 'publicada';
    sem.publicadaEn = Date.now();
    notificar(e, 'todos', otraVez ? `Cambió el horario del ${rango(semanaId)}.` : `Ya está el horario del ${rango(semanaId)}.`, '#/horarios');
  });
}

export function alternarFranja(usuarioId: string, dia: number, franja: Franja) {
  actualizar((e) => {
    const d = e.disponibilidad[usuarioId] ?? Array.from({ length: 7 }, () => FRANJAS.map((f) => f.id));
    d[dia] = d[dia].includes(franja) ? d[dia].filter((f) => f !== franja) : [...d[dia], franja];
    e.disponibilidad[usuarioId] = d;
  });
}

export function solicitarCambio(fecha: string, turnoId: string, motivo: string) {
  actualizar((e) => {
    e.cambios.unshift({ id: nuevoId('cam'), de: e.usuarioId!, fecha, turnoId, motivo, estado: 'abierto', en: Date.now() });
    notificar(e, 'todos', `${primer(e, e.usuarioId!)} busca quién le cubra el ${fechaCorta(fecha)}.`, '#/horarios/cambios');
  });
}

export function responderCambio(id: string, accion: 'aceptar' | 'aprobar' | 'rechazar') {
  actualizar((e) => {
    const c = e.cambios.find((x) => x.id === id);
    if (!c) return;
    const dia = fechaCorta(c.fecha);
    if (accion === 'aceptar') {
      c.acepta = e.usuarioId!;
      c.estado = 'aceptado';
      notificar(e, c.de, `${primer(e, c.acepta)} aceptó cubrir tu turno del ${dia}. Falta la aprobación.`, '#/horarios/cambios');
      notificar(e, 'encargados', `${primer(e, c.acepta)} aceptó cubrir el ${dia} de ${primer(e, c.de)}. Falta tu aprobación.`, '#/horarios/cambios');
    }
    if (accion === 'rechazar') {
      c.estado = 'rechazado';
      notificar(e, c.de, `No se aprobó el cambio de tu turno del ${dia}.`, '#/horarios/cambios');
    }
    if (accion === 'aprobar' && c.acepta) {
      c.estado = 'aprobado';
      // El turno pasa a quien aceptó.
      const sem = e.semanas.find((s) => s.turnos[`${c.de}|${c.fecha}`]);
      if (sem) {
        delete sem.turnos[`${c.de}|${c.fecha}`];
        sem.turnos[`${c.acepta}|${c.fecha}`] = c.turnoId;
      }
      notificar(e, c.de, `Aprobado: ${primer(e, c.acepta)} cubre tu turno del ${dia}.`, '#/horarios');
      notificar(e, c.acepta, `Aprobado: el ${dia} trabajas tú en lugar de ${primer(e, c.de)}.`, '#/horarios');
    }
  });
}

export function pedirAusencia(desde: string, hasta: string, tipo: Ausencia['tipo'], motivo: string) {
  actualizar((e) => {
    const [a, b] = desde <= hasta ? [desde, hasta] : [hasta, desde];
    e.ausencias.unshift({ id: nuevoId('aus'), usuarioId: e.usuarioId!, desde: a, hasta: b, tipo, motivo, estado: 'pendiente', en: Date.now() });
    const cuando = a === b ? `el ${fechaCorta(a)}` : `del ${fechaCorta(a)} al ${fechaCorta(b)}`;
    notificar(e, 'encargados', `${primer(e, e.usuarioId!)} pidió ${tipo === 'vacaciones' ? 'vacaciones' : 'día libre'} ${cuando}.`, '#/horarios/cambios');
  });
}

export function responderAusencia(id: string, accion: 'aprobar' | 'rechazar') {
  actualizar((e) => {
    const a = e.ausencias.find((x) => x.id === id);
    if (!a) return;
    a.estado = accion === 'aprobar' ? 'aprobada' : 'rechazada';
    a.resolvio = e.usuarioId!;
    const cuando = a.desde === a.hasta ? `del ${fechaCorta(a.desde)}` : `del ${fechaCorta(a.desde)} al ${fechaCorta(a.hasta)}`;
    notificar(e, a.usuarioId, `${accion === 'aprobar' ? 'Aprobaron' : 'No aprobaron'} tus ${a.tipo === 'vacaciones' ? 'vacaciones' : 'día libre'} ${cuando}.`, '#/horarios/disponibilidad');
  });
}

/** Los avisos que le tocan a alguien, del más nuevo al más viejo. */
export function avisosDe(e: Estado, usuarioId: string) {
  const u = e.usuarios.find((x) => x.id === usuarioId);
  const encargado = u?.rol === 'encargado' || u?.rol === 'admin';
  return e.notificaciones.filter((n) =>
    n.de !== usuarioId && (n.para === 'todos' || n.para === usuarioId || (n.para === 'encargados' && encargado)));
}

export function marcarLeida(id: string) {
  actualizar((e) => { const n = e.notificaciones.find((x) => x.id === id); if (n && !n.leidaPor.includes(e.usuarioId!)) n.leidaPor.push(e.usuarioId!); });
}

export function marcarTodasLeidas() {
  actualizar((e) => {
    for (const n of avisosDe(e, e.usuarioId!)) if (!n.leidaPor.includes(e.usuarioId!)) n.leidaPor.push(e.usuarioId!);
  });
}

/* ── Capacitación ───────────────────────────────────────── */

function conProgreso(e: Estado, usuarioId: string, fn: (p: Progreso) => void) {
  const p = e.progreso[usuarioId] ?? { lecciones: {}, repaso: {}, evaluaciones: {}, asignadas: [] };
  fn(p);
  e.progreso[usuarioId] = p;
}

/** Terminar una lección programa sus preguntas para repasarlas mañana. */
export function completarLeccion(leccionId: string, preguntas: string[], aciertos: boolean[]) {
  const hoy = jornadaDe();
  actualizar((e) => conProgreso(e, e.usuarioId!, (p) => {
    p.lecciones[leccionId] = Date.now();
    preguntas.forEach((q, i) => { p.repaso[q] = programar(undefined, aciertos[i], hoy); });
    p.asignadas = p.asignadas.filter((a) => a.leccionId !== leccionId);
  }));
}

export function responderRepaso(preguntaId: string, acierto: boolean) {
  const hoy = jornadaDe();
  actualizar((e) => conProgreso(e, e.usuarioId!, (p) => {
    p.repaso[preguntaId] = programar(p.repaso[preguntaId], acierto, hoy);
  }));
}

export function firmarEvaluacion(usuarioId: string, nivel: number, criterios: boolean[]) {
  actualizar((e) => {
    conProgreso(e, usuarioId, (p) => { p.evaluaciones[nivel] = { por: e.usuarioId!, en: Date.now(), criterios }; });
    const u = e.usuarios.find((x) => x.id === usuarioId);
    if (u && criterios.every(Boolean) && u.nivel === nivel && nivel < 3) u.nivel = (nivel + 1) as 2 | 3;
  });
}

export function reasignar(usuarioId: string, leccionId: string, motivo: string) {
  actualizar((e) => conProgreso(e, usuarioId, (p) => {
    delete p.lecciones[leccionId];
    p.asignadas.push({ leccionId, por: e.usuarioId!, en: Date.now(), motivo });
  }));
}

/* ── Administración ─────────────────────────────────────── */

export function invitar(nombre: string, correo: string, rol: Rol) {
  const partes = nombre.trim().split(/\s+/);
  actualizar((e) => {
    e.usuarios.push({
      id: nuevoId('u'), nombre: nombre.trim(), correo: correo.trim(), rol, nivel: 1, activo: true, invitado: true,
      iniciales: partes.slice(0, 2).map((p) => p[0]).join('').toUpperCase(), ingreso: jornadaDe(),
    });
  });
}

export const cambiarRol = (id: string, rol: Rol) =>
  actualizar((e) => { const u = e.usuarios.find((x) => x.id === id); if (u) u.rol = rol; });

export const alternarActivo = (id: string) =>
  actualizar((e) => { const u = e.usuarios.find((x) => x.id === id); if (u) u.activo = !u.activo; });

export const alternarPlantilla = (id: string) =>
  actualizar((e) => { const p = e.plantillas.find((x) => x.id === id); if (p) p.activa = !p.activa; });

export function agregarCafe(c: Omit<Cafe, 'id'>) {
  actualizar((e) => { e.cafes.unshift({ ...c, id: nuevoId('cafe') }); });
}

/* ═══ AVISOS (interfaz) ═══════════════════════════════════ */

type Aviso = { id: number; texto: string; accion?: { etiqueta: string; hacer: () => void } };
let aviso: Aviso | null = null;
const oyentesAviso = new Set<() => void>();
let reloj = 0;

export function avisar(texto: string, accion?: Aviso['accion']) {
  aviso = { id: Date.now(), texto, accion };
  oyentesAviso.forEach((o) => o());
  clearTimeout(reloj);
  reloj = window.setTimeout(() => { aviso = null; oyentesAviso.forEach((o) => o()); }, accion ? 5000 : 2800);
}

export function cerrarAviso() {
  aviso = null;
  oyentesAviso.forEach((o) => o());
}

export function useAviso() {
  return useSyncExternalStore(
    (f) => { oyentesAviso.add(f); return () => oyentesAviso.delete(f); },
    () => aviso,
    () => aviso,
  );
}

/* ═══ RITUAL CUMPLIDO (interfaz) ═════════════════════════ */

type Ritual = { id: number; titulo: string; sub?: string };
let ritual: Ritual | null = null;
const oyentesRitual = new Set<() => void>();

/** Momento de cierre: la apertura lista, la receta fijada, un nivel nuevo. */
export function celebrar(titulo: string, sub?: string) {
  ritual = { id: Date.now(), titulo, sub };
  oyentesRitual.forEach((o) => o());
}

export function cerrarRitual() {
  if (!ritual) return;
  ritual = null;
  oyentesRitual.forEach((o) => o());
}

export function useRitual() {
  return useSyncExternalStore(
    (f) => { oyentesRitual.add(f); return () => oyentesRitual.delete(f); },
    () => ritual,
    () => ritual,
  );
}

/** Vibración corta: en Android se siente; en iPhone no hace nada. */
export const vibrar = (patron: number | number[] = 10) => {
  try {
    // Solo dentro de un toque: fuera de él Chrome lo bloquea y lo marca como error.
    if (navigator.userActivation && !navigator.userActivation.isActive) return;
    navigator.vibrate?.(patron);
  } catch {}
};
