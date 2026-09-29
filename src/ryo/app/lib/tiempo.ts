/**
 * Tiempo de la barra: todo se mide con la hora de pared de Durango (UTC-6,
 * sin horario de verano), sin importar la zona del teléfono.
 *
 * La jornada corta a las 5:00: un cierre que termina a las 0:30 sigue siendo
 * del día anterior. Es la misma regla del checklist en papel.
 */
import { ahoraEnDurango, NEGOCIO } from '../../config';

const DIA = 86_400_000;
const dos = (n: number) => String(n).padStart(2, '0');

/** Fecha con los campos locales en hora de Durango. */
export const dgo = (ts = Date.now()) => ahoraEnDurango(new Date(ts));

/** "AAAA-MM-DD" de la jornada a la que pertenece un momento. */
export function jornadaDe(ts = Date.now()): string {
  const d = dgo(ts - 5 * 3_600_000);
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** "7:42" */
export function hora(ts: number): string {
  const d = dgo(ts);
  return `${d.getHours()}:${dos(d.getMinutes())}`;
}

/** Momento real (ms) de una hora de pared de Durango en una fecha. */
export function tsDgo(fecha: string, hhmm: string): number {
  const [y, m, d] = fecha.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  // Date.UTC con la hora de pared y se corrige el desfase de Durango.
  return Date.UTC(y, m - 1, d, h, mi) - NEGOCIO.utcOffset * 3_600_000;
}

export function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + dias * DIA);
  return `${t.getUTCFullYear()}-${dos(t.getUTCMonth() + 1)}-${dos(t.getUTCDate())}`;
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / DIA);
}

/** 0 = domingo … 6 = sábado */
export function diaSemana(fecha: string): number {
  return new Date(`${fecha}T12:00:00Z`).getUTCDay();
}

/** Lunes de la semana de una fecha. */
export function lunesDe(fecha: string): string {
  const d = diaSemana(fecha);
  return sumarDias(fecha, d === 0 ? -6 : 1 - d);
}

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DIAS_LARGOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "lun 28 sep" */
export function fechaCorta(fecha: string): string {
  const [, m, d] = fecha.split('-').map(Number);
  return `${DIAS[diaSemana(fecha)]} ${d} ${MESES[m - 1]}`;
}
export const nombreDia = (fecha: string) => DIAS_LARGOS[diaSemana(fecha)];
export const diaCorto = (fecha: string) => DIAS[diaSemana(fecha)];

/** "Hoy", "Ayer" o la fecha corta. */
export function cuando(fecha: string, hoy = jornadaDe()): string {
  const d = diasEntre(fecha, hoy);
  if (d === 0) return 'Hoy';
  if (d === 1) return 'Ayer';
  return fechaCorta(fecha);
}

/** Minutos desde medianoche de una "HH:MM". Después de medianoche cuenta como día siguiente. */
export function minutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Horas entre dos "HH:MM" (si termina antes de empezar, cruzó la medianoche). */
export function horasEntre(inicio: string, fin: string): number {
  let d = minutos(fin) - minutos(inicio);
  if (d <= 0) d += 24 * 60;
  return d / 60;
}

/** Hora actual de Durango en minutos desde medianoche. */
export function minutosAhora(): number {
  const d = dgo();
  return d.getHours() * 60 + d.getMinutes();
}
