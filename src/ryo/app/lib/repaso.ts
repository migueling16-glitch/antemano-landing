/**
 * Repetición espaciada para el "Repaso del día".
 *
 * Cada pregunta avanza por intervalos crecientes cuando se recuerda bien.
 * Si se falla, vuelve al inicio: se repregunta mañana, no en un mes.
 */
import { sumarDias } from './tiempo';

export const INTERVALOS = [1, 3, 7, 14, 30] as const;

export type EstadoPregunta = { idx: number; proxima: string };

export function programar(previo: EstadoPregunta | undefined, acierto: boolean, hoy: string): EstadoPregunta {
  const idx = acierto ? Math.min((previo?.idx ?? -1) + 1, INTERVALOS.length - 1) : 0;
  return { idx, proxima: sumarDias(hoy, INTERVALOS[idx]) };
}

export const tocaHoy = (e: EstadoPregunta, hoy: string) => e.proxima <= hoy;
