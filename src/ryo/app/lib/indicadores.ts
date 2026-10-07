/**
 * Indicadores del Panel: lo que el encargado necesita saber de un vistazo.
 *
 * Cada indicador trae su valor de los últimos 7 días, el de los 7
 * anteriores (para decir si va mejor o peor, como hace Toast contra la
 * semana pasada) y una serie diaria para la mini gráfica de barras. Se
 * leen con barras (largo y posición), nunca con pasteles o velocímetros
 * (NN/g, dashboards y atributos preatentivos).
 *
 * Lógica pura sobre el estado: las pantallas solo pintan.
 */
import type { Estado, Plantilla, Ejecucion, Usuario } from '../estado';
import { sumarDias, tsDgo, minutos, lunesDe, jornadaDe } from './tiempo';
import { alertasDe, turnosDe, horasDe, personasDe, tramosDe, horarioLocal } from './turnos';

export const dias = (hasta: string, n: number) => Array.from({ length: n }, (_, i) => sumarDias(hasta, i - n + 1));

const promedio = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

/** Momento límite de una plantilla en una jornada (la jornada corta a las 5:00). */
export function limiteDe(p: Plantilla, jornada: string) {
  const t = tsDgo(jornada, p.horaLimite);
  return minutos(p.horaLimite) < 300 ? t + 86_400_000 : t;
}

/** Las plantillas que tocaban ese día (activas hoy; las semanales en su día). */
export function tocaban(e: Estado, jornada: string) {
  const dia = new Date(`${jornada}T12:00:00Z`).getUTCDay();
  return e.plantillas.filter((p) => p.activa && (p.frecuencia === 'diaria' || p.dia === dia));
}

export type Cumplimiento = {
  jornada: string; plantilla: Plantilla; ej?: Ejecucion;
  estado: 'a-tiempo' | 'tarde' | 'no-se-hizo' | 'pendiente';
};

/** Cada checklist que tocaba en esos días y cómo terminó. */
export function cumplimiento(e: Estado, jornadas: string[]): Cumplimiento[] {
  const hoy = jornadaDe();
  const ahora = Date.now();
  return jornadas.flatMap((j) => tocaban(e, j).map((p): Cumplimiento => {
    const ej = e.ejecuciones.find((x) => x.plantillaId === p.id && x.jornada === j);
    const limite = limiteDe(p, j);
    if (ej?.completadaEn) return { jornada: j, plantilla: p, ej, estado: ej.completadaEn <= limite ? 'a-tiempo' : 'tarde' };
    if (j < hoy || ahora > limite) return { jornada: j, plantilla: p, ej, estado: 'no-se-hizo' };
    return { jornada: j, plantilla: p, ej, estado: 'pendiente' };
  }));
}

/** % a tiempo de lo que ya se podía cumplir (lo pendiente de hoy no cuenta). */
const pctATiempo = (c: Cumplimiento[]) => {
  const cuentan = c.filter((x) => x.estado !== 'pendiente');
  return cuentan.length ? (cuentan.filter((x) => x.estado === 'a-tiempo').length / cuentan.length) * 100 : NaN;
};

export type Indicador = {
  id: string;
  nombre: string;
  /** Qué mide, en una frase. */
  que: string;
  valor: number;
  antes: number;
  /** Cómo se escribe el valor ("92 %", "3.2 h"). */
  texto: (v: number) => string;
  /** La diferencia contra la semana anterior, ya redactada. */
  unidadCambio: string;
  serie: number[];
  /** 'arriba' si más es mejor. */
  mejor: 'arriba' | 'abajo';
  /** Margen dentro del cual "no cambió". */
  umbral: number;
};

export function veredicto(i: Indicador): 'mejor' | 'peor' | 'igual' | 'sin-datos' {
  if (!Number.isFinite(i.valor) || !Number.isFinite(i.antes)) return 'sin-datos';
  const d = i.valor - i.antes;
  if (Math.abs(d) < i.umbral) return 'igual';
  return (d > 0) === (i.mejor === 'arriba') ? 'mejor' : 'peor';
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function indicadores(e: Estado, hoy = jornadaDe()): Indicador[] {
  const sem = dias(hoy, 7);
  const ant = dias(sumarDias(hoy, -7), 7);

  // 1. Checklists a tiempo
  const cumple = (js: string[]) => pctATiempo(cumplimiento(e, js));

  // 2. Horas para validar
  const validar = (js: string[]) => promedio(e.ejecuciones
    .filter((x) => js.includes(x.jornada) && x.completadaEn && x.validadaEn)
    .map((x) => (x.validadaEn! - x.completadaEn!) / 3_600_000));

  // 3. Incidencias abiertas en esos días
  const abiertas = (js: string[]) => e.incidencias.filter((x) => js.includes(jornadaDe(x.abiertaEn))).length;

  // 4. Shots para aprobar la receta
  const shots = (js: string[]) => promedio(e.sesiones.filter((s) => js.includes(s.jornada) && s.aprobadoId).map((s) => s.shots.length));

  // 5. Horas sin nadie en barra (de lo publicado)
  const huecos = (js: string[]) => js.reduce((tot, j) => {
    const semana = e.semanas.find((s) => s.id === lunesDe(j) && s.estado === 'publicada');
    if (!semana) return tot;
    const { ini, fin } = horarioLocal(e);
    return tot + tramosDe(personasDe(e, j, semana.turnos), ini, fin).filter((t) => t.n === 0).reduce((a, t) => a + (t.fin - t.ini) / 60, 0);
  }, 0);

  // 6. Repasos al día del equipo de barra (foto de hoy; antes = hace 7 días)
  const repasos = (fecha: string) => {
    const preguntas = e.usuarios.filter((u) => u.activo && u.rol === 'barista').flatMap((u) => Object.values(e.progreso[u.id]?.repaso ?? {}));
    if (!preguntas.length) return NaN;
    return (preguntas.filter((q) => q.proxima >= fecha).length / preguntas.length) * 100;
  };

  return [
    {
      id: 'a-tiempo', nombre: 'Checklists a tiempo', que: 'De los checklists que tocaban, cuántos se completaron antes de su hora límite.',
      valor: cumple(sem), antes: cumple(ant), texto: (v) => `${Math.round(v)} %`, unidadCambio: 'pts',
      serie: sem.map((j) => cumple([j])), mejor: 'arriba', umbral: 3,
    },
    {
      id: 'validar', nombre: 'Horas para validar', que: 'Cuánto tarda un checklist completado en ser validado por el encargado.',
      valor: validar(sem), antes: validar(ant), texto: (v) => `${r1(v)} h`, unidadCambio: 'h',
      serie: sem.map((j) => validar([j])), mejor: 'abajo', umbral: 0.5,
    },
    {
      id: 'incidencias', nombre: 'Incidencias nuevas', que: 'Lecturas fuera de rango y reportes que se abrieron.',
      valor: abiertas(sem), antes: abiertas(ant), texto: (v) => `${Math.round(v)}`, unidadCambio: '',
      serie: sem.map((j) => abiertas([j])), mejor: 'abajo', umbral: 1,
    },
    {
      id: 'shots', nombre: 'Shots por receta', que: 'Cuántos shots cuesta llegar a la receta aprobada.',
      valor: shots(sem), antes: shots(ant), texto: (v) => `${r1(v)}`, unidadCambio: 'shots',
      serie: sem.map((j) => shots([j])), mejor: 'abajo', umbral: 0.3,
    },
    {
      id: 'huecos', nombre: 'Horas sin nadie en barra', que: 'Horas del horario del local sin nadie programado.',
      valor: huecos(sem), antes: huecos(ant), texto: (v) => `${r1(v)} h`, unidadCambio: 'h',
      serie: sem.map((j) => huecos([j])), mejor: 'abajo', umbral: 0.5,
    },
    {
      id: 'repasos', nombre: 'Repasos al día', que: 'Preguntas de capacitación del equipo que no están vencidas.',
      valor: repasos(hoy), antes: repasos(sumarDias(hoy, -7)), texto: (v) => `${Math.round(v)} %`, unidadCambio: 'pts',
      serie: sem.map((j) => repasos(j)), mejor: 'arriba', umbral: 3,
    },
  ];
}

/* ═══ POR PERSONA ═════════════════════════════════════════ */

export type FichaPersona = {
  u: Usuario;
  checklists: number;
  aTiempo: number;
  recetas: number;
  shotsPorReceta: number;
  reportes: number;
  repasosVencidos: number;
  lecciones: number;
  horasSemana: number;
  /** Algo para mirar: atrasos, repasos vencidos, horas de más. */
  ojo: string[];
};

export function porPersona(e: Estado, hoy = jornadaDe(), n = 14): FichaPersona[] {
  const js = dias(hoy, n);
  const c = cumplimiento(e, js);
  const lunes = lunesDe(hoy);
  const semana = e.semanas.find((s) => s.id === lunes && s.estado === 'publicada');
  const alertas = semana ? alertasDe(e, lunes) : [];
  return e.usuarios.filter((u) => u.activo).map((u) => {
    const mias = c.filter((x) => x.ej?.completadaPor === u.id);
    const hechas = mias.filter((x) => x.estado === 'a-tiempo' || x.estado === 'tarde');
    const ses = e.sesiones.filter((s) => s.por === u.id && js.includes(s.jornada) && s.aprobadoId);
    const p = e.progreso[u.id];
    const vencidos = Object.values(p?.repaso ?? {}).filter((q) => q.proxima < hoy).length;
    const horas = semana ? horasDe(turnosDe(e, lunes, semana.turnos, u.id)) : 0;
    const aTiempo = hechas.length ? (hechas.filter((x) => x.estado === 'a-tiempo').length / hechas.length) * 100 : NaN;
    const ojo: string[] = [];
    if (hechas.length >= 3 && aTiempo < 80) ojo.push(`${Math.round(aTiempo)} % a tiempo`);
    if (vencidos >= 3) ojo.push(`${vencidos} repasos vencidos`);
    if (alertas.some((a) => a.usuarioId === u.id && a.nivel === 'ley')) ojo.push('alerta de horario');
    if (p?.asignadas.length) ojo.push('lección asignada sin terminar');
    return {
      u,
      checklists: hechas.length,
      aTiempo,
      recetas: ses.length,
      shotsPorReceta: ses.length ? ses.reduce((a, s) => a + s.shots.length, 0) / ses.length : NaN,
      reportes: e.incidencias.filter((x) => x.abiertaPor === u.id && js.includes(jornadaDe(x.abiertaEn))).length,
      repasosVencidos: vencidos,
      lecciones: Object.values(p?.lecciones ?? {}).filter((t) => jornadaDe(t) >= js[0]).length,
      horasSemana: horas,
      ojo,
    };
  });
}
