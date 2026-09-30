/**
 * La matemática y el criterio de la calibración.
 *
 * Convención de molienda: número más bajo = más fino. El paso del molino
 * viene del equipo registrado.
 *
 * Pensado para una La Marzocco Linea Classic AV: con un botón volumétrico la
 * máquina corta sola cuando el flujómetro cuenta el volumen programado, así
 * que la molienda mueve el tiempo (y un poco el peso), y el rendimiento se
 * cambia reprogramando el botón. Con el botón continuo, el barista corta en
 * la báscula. La temperatura la fija el PID de la caldera de café: es la
 * misma para todos los cafés. El tiempo se lee en la botonera.
 */

export type Objetivo = {
  dosis: number;
  rendimiento: number;
  tiempo: number;
  /** ± segundos */
  tolTiempo: number;
  /** ± fracción del ratio (0.05 = 5 %) */
  tolRatio: number;
};

/** Brújula de sabor. x: −1 ácido/subextraído … +1 amargo/sobreextraído. y: −1 débil … +1 intenso. */
export type Sabor = { x: number; y: number };

export type ShotBase = {
  dosis: number;
  rendimiento: number;
  tiempo: number;
  molienda: number;
  sabor?: Sabor;
  pulsos?: number;
};

export const redondear = (n: number, dec = 1) => Math.round(n * 10 ** dec) / 10 ** dec;

export const ratio = (dosis: number, rendimiento: number) => rendimiento / dosis;

/** "1:2.03" */
export const ratioTexto = (dosis: number, rendimiento: number) => `1:${ratio(dosis, rendimiento).toFixed(2)}`;


/** El botón continuo: el barista corta a mano en la báscula. */
export const CONTINUO = 'continuo';

/** Gramos que siguen cayendo después de cortar (continuo o al programar). */
export const GOTEO = 1.5;

export function ventanaRatio(o: Objetivo): [number, number] {
  const r = o.rendimiento / o.dosis;
  return [r * (1 - o.tolRatio), r * (1 + o.tolRatio)];
}

export function enVentana(s: ShotBase, o: Objetivo) {
  const [rmin, rmax] = ventanaRatio(o);
  const r = ratio(s.dosis, s.rendimiento);
  return {
    ratio: r >= rmin && r <= rmax,
    tiempo: Math.abs(s.tiempo - o.tiempo) <= o.tolTiempo,
  };
}

/* ═══ EL MODELO ═══════════════════════════════════════════
 *
 * Un shot tiene dos resultados que se miden (tiempo y peso en taza) y tres
 * perillas (molienda, pulsos, dosis). No son independientes:
 *
 *   Δtiempo = tM · Δmolienda + tP · Δpulsos
 *   Δpeso   = gM · Δmolienda + gP · Δpulsos
 *
 * - tM: segundos por punto de molienda (más fino = más lento).
 * - gM: gramos por punto de molienda (más fino = el café retiene más agua y
 *       cae menos, con los mismos pulsos).
 * - gP: gramos en taza por pulso.
 * - tP: segundos por pulso (más agua = más tiempo).
 *
 * Las cuatro sensibilidades se aprenden de los shots del propio café: pares
 * seguidos de una sesión donde solo cambió una perilla. Con pocos datos se
 * mezclan con valores de arranque.
 *
 * El sabor mueve la meta dentro de la ventana: ácido pide más extracción
 * (más tiempo), amargo menos; débil pide un ratio más corto, intenso uno más
 * largo. Con la meta puesta, se resuelven las dos ecuaciones a la vez: la
 * molienda se redondea al paso del molino y los pulsos compensan lo que la
 * molienda le quita o le da al peso. Por eso puede pedir dos cambios en un
 * shot: son un solo ajuste, y dice qué espera que salga.
 */

export type Modelo = {
  tM: number; gM: number; gP: number; tP: number;
  /** Pares de shots de los que se aprendió. */
  n: number;
};

/** Valores de arranque: los de una doble típica en esta máquina. */
export const MODELO_BASE = { tM: -6, gM: 1.6, gP: 0.5 };

type ShotModelo = ShotBase & { pulsos?: number };

const mediana = (xs: number[]) => { const o = [...xs].sort((x, y) => x - y); const m = o.length >> 1; return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2; };
const entre = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Aprende las sensibilidades de las sesiones de un café. `gPorPulso` es lo
 * que la máquina ya sabe de sus pulsos (sirve de arranque para gP).
 */
export function aprender(sesiones: { shots: ShotModelo[] }[], gPorPulso = MODELO_BASE.gP): Modelo {
  const tM: number[] = [], gM: number[] = [], gP: number[] = [], tP: number[] = [];
  for (const s of sesiones) {
    for (let i = 1; i < s.shots.length; i++) {
      const a = s.shots[i - 1], b = s.shots[i];
      if (Math.abs(a.dosis - b.dosis) > 0.15) continue;
      const dM = b.molienda - a.molienda;
      const dP = (b.pulsos ?? 0) - (a.pulsos ?? 0);
      if (Math.abs(dM) > 1e-6 && dP === 0) {
        tM.push((b.tiempo - a.tiempo) / dM);
        gM.push((b.rendimiento - a.rendimiento) / dM);
      } else if (Math.abs(dM) < 1e-6 && dP !== 0 && a.pulsos && b.pulsos) {
        gP.push((b.rendimiento - a.rendimiento) / dP);
        tP.push((b.tiempo - a.tiempo) / dP);
      }
    }
  }
  // Entre más pares, más pesa lo aprendido contra el valor de arranque.
  const mezcla = (xs: number[], base: number, min: number, max: number) => {
    if (!xs.length) return base;
    const w = xs.length / (xs.length + 2);
    return entre(w * mediana(xs) + (1 - w) * base, min, max);
  };
  return {
    tM: mezcla(tM, MODELO_BASE.tM, -14, -1.5),
    gM: mezcla(gM, MODELO_BASE.gM, 0, 5),
    gP: mezcla(gP, gPorPulso, 0.15, 1.5),
    tP: mezcla(tP, NaN, 0, 0.6),
    n: tM.length + gP.length,
  };
}

export type Sugerencia = {
  /** Lo que hay que hacer, en una línea. */
  accion: string;
  /** Cada cambio por separado, para listarlos. */
  cambios: string[];
  /** Por qué, en una o dos frases. */
  porque: string;
  /** Si el shot ya se puede aprobar. */
  aprobar: boolean;
  /** Valores con los que arrancar el siguiente shot. */
  ajuste: Partial<Pick<ShotModelo, 'dosis' | 'rendimiento' | 'molienda' | 'pulsos'>>;
  /** Lo que el modelo espera del siguiente shot con ese ajuste. */
  prediccion?: { tiempo: number; rendimiento: number };
  /** La meta que buscó (la receta, movida por el sabor). */
  meta?: { tiempo: number; rendimiento: number };
};

/** Cómo termina el shot y lo que se sabe del café y la máquina. */
export type Contexto = {
  boton?: string; pid?: number; modelo?: Modelo;
  /** Capacidad de la canastilla, en gramos. */
  canastilla?: number;
};

/**
 * El siguiente ajuste. Primero lo que invalida el shot (dosis fuera de
 * receta, señales de canalización); si no, resuelve el modelo.
 */
export function sugerir(s: ShotModelo, o: Objetivo, paso: number, ctx: Contexto = {}): Sugerencia {
  const sabor = s.sabor ?? { x: 0, y: 0 };
  const acido = sabor.x < -0.25;
  const amargo = sabor.x > 0.25;
  const debil = sabor.y < -0.25;
  const intenso = sabor.y > 0.25;
  const balanceado = !acido && !amargo && !debil && !intenso;
  const v = enVentana(s, o);
  const rapido = s.tiempo - o.tiempo < -o.tolTiempo;
  const lento = s.tiempo - o.tiempo > o.tolTiempo;
  const boton = ctx.boton;
  const M = ctx.modelo ?? { ...MODELO_BASE, tP: NaN, n: 0 };
  const conPulsos = !!boton && !!s.pulsos;
  const una = (accion: string, porque: string, ajuste: Sugerencia['ajuste'] = {}): Sugerencia =>
    ({ accion, cambios: [accion], porque, aprobar: false, ajuste });

  // 1. La dosis manda: fuera de receta no se sabe qué movió el sabor.
  if (Math.abs(s.dosis - o.dosis) > 0.3) {
    const noCabe = ctx.canastilla !== undefined && Math.abs(o.dosis - ctx.canastilla) > 1;
    return una(
      `Vuelve a ${o.dosis.toFixed(1)} g de dosis`,
      `Primero la dosis de la receta: cada gramo de café retiene agua y cambia tiempo y peso a la vez.${noCabe ? ` Ojo: ${o.dosis} g no caben en la canastilla de ${ctx.canastilla} g; cambia de canastilla.` : ''}`,
      { dosis: o.dosis },
    );
  }

  // 2. Ya está.
  if (balanceado && v.ratio && v.tiempo) {
    return { accion: 'Apruébalo', cambios: [], porque: 'Está dentro de la ventana y sabe balanceado. Esta es la receta del día.', aprobar: true, ajuste: {} };
  }
  if (balanceado) {
    return {
      accion: 'Sabe balanceado: puedes aprobarlo', cambios: [],
      porque: `Salió de la ventana de ${v.tiempo ? 'ratio' : 'tiempo'}, pero el tiempo y el ratio son guía y el sabor manda. Queda anotado.`,
      aprobar: true, ajuste: {},
    };
  }

  // 3. Señales que ninguna perilla arregla.
  if (acido && lento) {
    return una('Revisa distribución y tampeo', `Lento y ácido suele ser canalización: el agua se abre un camino y deja café sin extraer. Mover la molienda no lo arregla.${ctx.pid ? ` Si la distribución está bien y sigue ácido, el encargado puede subir el PID de ${ctx.pid} a ${ctx.pid + 0.5} °C (cambia la temperatura de todos los cafés).` : ''}`);
  }
  if (amargo && rapido) {
    return una('Revisa distribución y tampeo', 'Rápido y amargo suele ser canalización: una parte se sobreextrae mientras el resto pasa de largo.');
  }

  // 4. El modelo. La meta es la receta, movida por el sabor dentro de la ventana.
  const tMeta = o.tiempo + entre(-sabor.x, -1, 1) * o.tolTiempo;
  const gMeta = s.dosis * (o.rendimiento / o.dosis) * (1 + entre(sabor.y, -1, 1) * o.tolRatio);
  const dT = tMeta - s.tiempo;
  const dG = gMeta - s.rendimiento;
  const tP = Number.isFinite(M.tP) ? M.tP : (s.pulsos ? s.tiempo / s.pulsos : 0);

  // Dos ecuaciones, dos incógnitas. Sin pulsos (continuo) solo hay molienda.
  let dM = conPulsos ? (dT * M.gP - tP * dG) / (M.tM * M.gP - tP * M.gM) : dT / M.tM;
  if (Math.abs(dT) <= 0.75) dM = 0; // el tiempo ya está: no se toca el molino
  dM = entre(Math.round(dM / paso) * paso, -3 * paso, 3 * paso);
  // Los pulsos cubren lo que falta de peso, contando lo que la molienda le mueve.
  let dP = conPulsos ? Math.round((dG - M.gM * dM) / M.gP) : 0;
  if (Math.abs(dG - M.gM * dM) < 0.6) dP = 0;
  dP = entre(dP, -30, 30);

  const molienda = redondear(s.molienda + dM, 2);
  const pulsos = conPulsos ? s.pulsos! + dP : undefined;
  const prediccion = {
    tiempo: Math.round(s.tiempo + M.tM * dM + tP * dP),
    rendimiento: redondear(conPulsos ? s.rendimiento + M.gM * dM + M.gP * dP : gMeta),
  };
  const meta = { tiempo: Math.round(tMeta), rendimiento: redondear(gMeta) };

  const cambios: string[] = [];
  if (dM) cambios.push(`Molienda ${dM < 0 ? 'más fina' : 'más gruesa'}: ${s.molienda} → ${molienda}`);
  if (dP) cambios.push(`${boton}: de ${s.pulsos} a ${pulsos} pulsos`);
  if (!conPulsos && Math.abs(dG) >= 0.6) cambios.push(`Corta el shot en ${(gMeta - GOTEO).toFixed(1)} g (caen ${gMeta.toFixed(1)} g)`);
  if (!cambios.length) {
    return una('Repite el shot igual', 'Los números ya están donde el modelo los quiere y el sabor no: antes de mover algo, confirma con otro shot cuidando distribución y tampeo.');
  }

  const sabe = [acido && 'ácido', amargo && 'amargo', debil && 'débil', intenso && 'intenso'].filter(Boolean).join(' y ');
  const razones: string[] = [];
  if (dM) razones.push(`${dM < 0 ? 'Más fino frena el agua y extrae más' : 'Más grueso la deja correr y extrae menos'}: unos ${Math.abs(Math.round(M.tM * dM))} s ${dM < 0 ? 'más' : 'menos'}.`);
  if (dM && dP) razones.push(`Ese cambio de molienda ${M.gM * dM < 0 ? 'le quita' : 'le suma'} unos ${Math.abs(M.gM * dM).toFixed(1)} g a la taza, y los pulsos lo compensan: van juntos, son un solo ajuste.`);
  if (!dM && dP) razones.push(`El tiempo ya está; lo que falla es el peso, y eso es de pulsos (${M.gP.toFixed(2)} g por pulso). Mover la molienda te sacaría de tiempo.`);
  const porque = `${sabe ? `Sabe ${sabe}. ` : ''}Busco ${meta.tiempo} s y ${meta.rendimiento.toFixed(1)} g. ${razones.join(' ')}`;

  return {
    accion: cambios.join(' + '), cambios, porque, aprobar: false,
    ajuste: { ...(dM ? { molienda } : {}), ...(dP ? { pulsos } : {}), ...(!conPulsos ? { rendimiento: redondear(gMeta) } : {}) },
    prediccion, meta,
  };
}

/** Recta de mínimos cuadrados (para la tendencia de molienda contra reposo). */
export function tendencia(puntos: { x: number; y: number }[]) {
  const n = puntos.length;
  if (n < 2) return null;
  const sx = puntos.reduce((a, p) => a + p.x, 0);
  const sy = puntos.reduce((a, p) => a + p.y, 0);
  const sxx = puntos.reduce((a, p) => a + p.x * p.x, 0);
  const sxy = puntos.reduce((a, p) => a + p.x * p.y, 0);
  const den = n * sxx - sx * sx;
  if (!den) return null;
  const m = (n * sxy - sx * sy) / den;
  const b = (sy - m * sx) / n;
  return { m, b, en: (x: number) => m * x + b };
}
