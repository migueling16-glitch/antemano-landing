/**
 * Reglas de los horarios: qué alertas salen al armar la semana, cuánta
 * gente hay en barra a cada hora y el archivo de calendario del barista.
 *
 * Lógica pura sobre el estado: la pantalla solo la pinta.
 */
import type { Estado, TurnoTipo, Usuario } from '../estado';
import { sumarDias, minutos, diaSemana, diaCorto, tsDgo, lunesDe } from './tiempo';

/* ═══ FRANJAS DE DISPONIBILIDAD ═══════════════════════════ */

export type Franja = 'manana' | 'tarde' | 'noche';

/** Minutos del día (la noche pasa de la medianoche). */
export const FRANJAS: { id: Franja; nombre: string; desde: number; hasta: number }[] = [
  { id: 'manana', nombre: 'Mañana', desde: 6 * 60, hasta: 12 * 60 },
  { id: 'tarde', nombre: 'Tarde', desde: 12 * 60, hasta: 18 * 60 },
  { id: 'noche', nombre: 'Noche', desde: 18 * 60, hasta: 26 * 60 },
];

/* ═══ REGLAS ══════════════════════════════════════════════ */

export const REGLAS = {
  /** Ley Federal del Trabajo: jornada máxima de 48 h a la semana. */
  horasMax: 48,
  /** Descanso recomendado entre el fin de un turno y el siguiente. */
  descansoMin: 11,
  /** Mínimo de personas en barra durante el horario del local. */
  minEnBarra: 1,
};

export type Nivel = 'ley' | 'aviso' | 'cobertura';
export type Alerta = { nivel: Nivel; texto: string; usuarioId?: string; fecha?: string };

export type Turnos = Record<string, string>;
type Intervalo = { fecha: string; turno: TurnoTipo; ini: number; fin: number };

/** Inicio y fin de un turno en minutos desde el lunes 00:00 de la semana. */
function intervalo(lunes: string, fecha: string, t: TurnoTipo): [number, number] {
  const dia = Math.round((Date.parse(fecha) - Date.parse(lunes)) / 86_400_000);
  const ini = dia * 1440 + minutos(t.inicio);
  let fin = dia * 1440 + minutos(t.fin);
  if (fin <= ini) fin += 1440;
  return [ini, fin];
}

export const diasDe = (lunes: string) => Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
const tipo = (e: Estado, id?: string) => (id ? e.turnosTipo.find((t) => t.id === id) : undefined);

/** Los turnos de una persona en la semana, en orden. */
export function turnosDe(e: Estado, lunes: string, turnos: Turnos, usuarioId: string): Intervalo[] {
  return diasDe(lunes)
    .map((fecha) => ({ fecha, turno: tipo(e, turnos[`${usuarioId}|${fecha}`]) }))
    .filter((x): x is { fecha: string; turno: TurnoTipo } => !!x.turno)
    .map(({ fecha, turno }) => { const [ini, fin] = intervalo(lunes, fecha, turno); return { fecha, turno, ini, fin }; });
}

export const horasDe = (lista: Intervalo[]) => lista.reduce((a, x) => a + (x.fin - x.ini) / 60, 0);

/** Franjas del día que toca un turno. */
function franjasDe(t: TurnoTipo): Franja[] {
  let ini = minutos(t.inicio);
  let fin = minutos(t.fin);
  if (fin <= ini) fin += 1440;
  if (ini < 360) { ini += 1440; fin += 1440; }
  return FRANJAS.filter((f) => ini < f.hasta && fin > f.desde).map((f) => f.id);
}

const corto = (fecha: string) => `${diaCorto(fecha)} ${Number(fecha.slice(8))}`;
const nombre = (u?: Usuario) => u?.nombre.split(' ')[0] ?? 'Alguien';

/** Días libres o vacaciones de alguien que tocan una fecha. */
export const ausenciaEn = (e: Estado, usuarioId: string, fecha: string) =>
  e.ausencias.find((a) => a.usuarioId === usuarioId && a.estado !== 'rechazada' && a.desde <= fecha && fecha <= a.hasta);

/**
 * Todo lo que conviene revisar antes de publicar una semana. `turnos` deja
 * simular un cambio sin tocar el estado (p. ej. antes de aprobar un cambio).
 */
export function alertasDe(e: Estado, lunes: string, turnos?: Turnos): Alerta[] {
  const sem = turnos ?? e.semanas.find((s) => s.id === lunes)?.turnos ?? {};
  const previa = e.semanas.find((s) => s.id === sumarDias(lunes, -7))?.turnos ?? {};
  const alertas: Alerta[] = [];

  for (const u of e.usuarios.filter((x) => x.activo)) {
    const lista = turnosDe(e, lunes, sem, u.id);
    if (!lista.length) continue;
    const quien = nombre(u);

    // Ley: un día de descanso por cada seis de trabajo (LFT art. 69).
    if (lista.length >= 7) alertas.push({ nivel: 'ley', usuarioId: u.id, texto: `${quien} trabaja los 7 días: le falta su día de descanso (LFT art. 69).` });
    // Ley: 48 h a la semana.
    const horas = horasDe(lista);
    if (horas > REGLAS.horasMax) alertas.push({ nivel: 'ley', usuarioId: u.id, texto: `${quien} suma ${horas.toFixed(1)} h: pasa del tope de ${REGLAS.horasMax} h a la semana.` });

    // Descanso entre turnos, contando el último de la semana anterior.
    const antes = turnosDe(e, sumarDias(lunes, -7), previa, u.id).map((x) => ({ ...x, ini: x.ini - 7 * 1440, fin: x.fin - 7 * 1440 }));
    const todos = [...antes.slice(-1), ...lista];
    for (let i = 1; i < todos.length; i++) {
      const hueco = (todos[i].ini - todos[i - 1].fin) / 60;
      if (hueco < REGLAS.descansoMin) {
        alertas.push({
          nivel: 'aviso', usuarioId: u.id, fecha: todos[i].fecha,
          texto: `${quien}: solo ${hueco.toFixed(1)} h entre ${todos[i - 1].turno.nombre.toLowerCase()} del ${corto(todos[i - 1].fecha)} y ${todos[i].turno.nombre.toLowerCase()} del ${corto(todos[i].fecha)} (se recomiendan ${REGLAS.descansoMin}).`,
        });
      }
    }

    for (const x of lista) {
      // Días libres o vacaciones.
      const a = ausenciaEn(e, u.id, x.fecha);
      if (a) {
        alertas.push({
          nivel: a.estado === 'aprobada' ? 'ley' : 'aviso', usuarioId: u.id, fecha: x.fecha,
          texto: `${quien} tiene ${a.tipo === 'vacaciones' ? 'vacaciones' : 'día libre'} ${a.estado === 'aprobada' ? 'aprobado' : 'pedido'} el ${corto(x.fecha)}.`,
        });
      }
      // Disponibilidad.
      const puede = e.disponibilidad[u.id]?.[diaSemana(x.fecha)] ?? FRANJAS.map((f) => f.id);
      const faltan = franjasDe(x.turno).filter((f) => !puede.includes(f));
      if (faltan.length) {
        alertas.push({
          nivel: 'aviso', usuarioId: u.id, fecha: x.fecha,
          texto: `${quien} no está disponible el ${corto(x.fecha)} en la ${faltan.map((f) => FRANJAS.find((y) => y.id === f)!.nombre.toLowerCase()).join(' ni en la ')}.`,
        });
      }
    }
  }

  // Cobertura: cada minuto del horario del local, con al menos una persona.
  for (const fecha of diasDe(lunes)) {
    for (const h of huecosDe(e, lunes, fecha, sem)) {
      alertas.push({ nivel: 'cobertura', fecha, texto: `${corto(fecha)}: nadie en barra de ${reloj(h.ini)} a ${reloj(h.fin)}.` });
    }
  }
  return alertas;
}

/* ═══ CAMBIOS DE TURNO: SIMULAR ANTES DE PEDIR ════════════ */

/** Un turno que cambia de manos: `turnoId` null lo quita. */
export type Movimiento = { usuarioId: string; fecha: string; turnoId: string | null };

/** Los turnos de cada semana tocada, con los movimientos aplicados. */
export function simular(e: Estado, movs: Movimiento[]): Map<string, Turnos> {
  const semanas = new Map<string, Turnos>();
  for (const m of movs) {
    const lunes = lunesDe(m.fecha);
    if (!semanas.has(lunes)) semanas.set(lunes, { ...(e.semanas.find((s) => s.id === lunes)?.turnos ?? {}) });
    const t = semanas.get(lunes)!;
    const k = `${m.usuarioId}|${m.fecha}`;
    if (m.turnoId) t[k] = m.turnoId; else delete t[k];
  }
  return semanas;
}

/**
 * Cómo le queda un cambio a una persona: si de plano no puede (ya trabaja
 * ese día, o lo tiene libre aprobado), sus horas de esa semana antes y
 * después, y las alertas nuevas que le saldrían (tope de horas, descanso
 * entre turnos, disponibilidad).
 */
export type Encaje = { puede: boolean; bloqueo?: string; antes: number; despues: number; alertas: Alerta[] };

export function encajeDe(e: Estado, usuarioId: string, movs: Movimiento[]): Encaje {
  const semanas = simular(e, movs);
  let bloqueo: string | undefined;
  for (const m of movs.filter((x) => x.usuarioId === usuarioId && x.turnoId)) {
    const actual = e.semanas.find((s) => s.id === lunesDe(m.fecha))?.turnos[`${usuarioId}|${m.fecha}`];
    const suelta = movs.some((x) => x.usuarioId === usuarioId && x.fecha === m.fecha && !x.turnoId);
    if (actual && !suelta) bloqueo = `Ya trabaja el ${corto(m.fecha)}`;
    const a = ausenciaEn(e, usuarioId, m.fecha);
    if (a?.estado === 'aprobada') bloqueo = `Tiene ${a.tipo === 'vacaciones' ? 'vacaciones' : 'día libre'} el ${corto(m.fecha)}`;
  }
  // Las horas son las de la semana del turno que recibe (o del primero que se mueve).
  const principal = lunesDe((movs.find((x) => x.usuarioId === usuarioId && x.turnoId) ?? movs[0]).fecha);
  const previo = e.semanas.find((s) => s.id === principal)?.turnos ?? {};
  const antes = horasDe(turnosDe(e, principal, previo, usuarioId));
  const despues = horasDe(turnosDe(e, principal, semanas.get(principal) ?? previo, usuarioId));
  const alertas: Alerta[] = [];
  for (const [lunes, turnos] of semanas) {
    const ya = new Set(alertasDe(e, lunes).map((a) => a.texto));
    alertas.push(...alertasDe(e, lunes, turnos).filter((a) => a.usuarioId === usuarioId && !ya.has(a.texto)));
  }
  return { puede: !bloqueo, bloqueo, antes, despues, alertas };
}

/* ═══ COBERTURA DEL DÍA ═══════════════════════════════════ */

export type Persona = { usuarioId: string; turno: TurnoTipo; ini: number; fin: number };
export type Tramo = { ini: number; fin: number; n: number };

/** "7:30" a partir de minutos del día (acepta más de 24 h). */
export const reloj = (m: number) => { const x = ((m % 1440) + 1440) % 1440; return `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`; };

/** Quién está en barra ese día (minutos desde las 0:00 de esa fecha). */
export function personasDe(e: Estado, fecha: string, turnos: Turnos): Persona[] {
  return e.usuarios
    .filter((u) => u.activo)
    .map((u) => ({ u, t: tipo(e, turnos[`${u.id}|${fecha}`]) }))
    .filter((x): x is { u: Usuario; t: TurnoTipo } => !!x.t)
    .map(({ u, t }) => {
      const ini = minutos(t.inicio);
      let fin = minutos(t.fin);
      if (fin <= ini) fin += 1440;
      return { usuarioId: u.id, turno: t, ini, fin };
    })
    .sort((a, b) => a.ini - b.ini);
}

/** El día partido en tramos con cuántas personas hay en cada uno. */
export function tramosDe(personas: Persona[], desde: number, hasta: number): Tramo[] {
  const cortes = [...new Set([desde, hasta, ...personas.flatMap((p) => [p.ini, p.fin])])]
    .filter((m) => m >= desde && m <= hasta)
    .sort((a, b) => a - b);
  const tramos: Tramo[] = [];
  for (let i = 0; i < cortes.length - 1; i++) {
    const [ini, fin] = [cortes[i], cortes[i + 1]];
    const n = personas.filter((p) => p.ini <= ini && p.fin >= fin).length;
    const previo = tramos[tramos.length - 1];
    if (previo && previo.n === n && previo.fin === ini) previo.fin = fin;
    else tramos.push({ ini, fin, n });
  }
  return tramos;
}

/** Horario del local ese día, en minutos. */
export function horarioLocal(e: Estado) {
  const ini = minutos(e.sucursal.apertura);
  let fin = minutos(e.sucursal.cierre);
  if (fin <= ini) fin += 1440;
  return { ini, fin };
}

function huecosDe(e: Estado, _lunes: string, fecha: string, turnos: Turnos) {
  const { ini, fin } = horarioLocal(e);
  return tramosDe(personasDe(e, fecha, turnos), ini, fin).filter((t) => t.n < REGLAS.minEnBarra);
}

/* ═══ CALENDARIO DEL BARISTA (.ics) ═══════════════════════ */

const utc = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/**
 * Los turnos publicados de alguien, de hoy en adelante, como archivo de
 * calendario: el teléfono los agrega a su app de calendario.
 */
export function icsDe(e: Estado, usuarioId: string, desde: string): { texto: string; n: number } {
  const eventos: string[] = [];
  for (const sem of e.semanas.filter((s) => s.estado === 'publicada')) {
    for (const [clave, turnoId] of Object.entries(sem.turnos)) {
      const [uid, fecha] = clave.split('|');
      const t = tipo(e, turnoId);
      if (uid !== usuarioId || !t || fecha < desde) continue;
      const ini = tsDgo(fecha, t.inicio);
      let fin = tsDgo(fecha, t.fin);
      if (fin <= ini) fin += 86_400_000;
      eventos.push([
        'BEGIN:VEVENT',
        `UID:${usuarioId}-${fecha}@barra.ryocafe`,
        `DTSTAMP:${utc(Date.now())}`,
        `DTSTART:${utc(ini)}`,
        `DTEND:${utc(fin)}`,
        `SUMMARY:Ryo Café · ${t.nombre}`,
        `LOCATION:${e.sucursal.negocio} · ${e.sucursal.nombre}`,
        'END:VEVENT',
      ].join('\r\n'));
    }
  }
  const texto = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ryo Cafe//Barra//ES', 'CALSCALE:GREGORIAN', ...eventos, 'END:VCALENDAR'].join('\r\n');
  return { texto, n: eventos.length };
}
