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
  tds?: number;
  sabor?: Sabor;
};

export const redondear = (n: number, dec = 1) => Math.round(n * 10 ** dec) / 10 ** dec;

export const ratio = (dosis: number, rendimiento: number) => rendimiento / dosis;

/** "1:2.03" */
export const ratioTexto = (dosis: number, rendimiento: number) => `1:${ratio(dosis, rendimiento).toFixed(2)}`;

/** Extracción % = TDS % × rendimiento ÷ dosis */
export const extraccion = (tds: number, rendimiento: number, dosis: number) => (tds * rendimiento) / dosis;

export const REFERENCIA_EY = { min: 18, max: 22 } as const;
export const REFERENCIA_TDS = { min: 8, max: 12 } as const;

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

export type Sugerencia = {
  /** Lo que hay que hacer, en una línea. */
  accion: string;
  /** Por qué, en una o dos frases. */
  porque: string;
  /** Si el shot ya se puede aprobar. */
  aprobar: boolean;
  /** Valores con los que arrancar el siguiente shot. */
  ajuste: Partial<Pick<ShotBase, 'dosis' | 'rendimiento' | 'molienda'>>;
  /** Con botón volumétrico: gramos a los que hay que reprogramarlo. */
  reprogramar?: number;
};

/** Cómo termina el shot: botón volumétrico (con su nombre) o continuo. */
export type Contexto = { boton?: string; pid?: number };

/**
 * Sugiere el siguiente ajuste con el orden que se enseña en barra: primero
 * una sola variable a la vez (dosis), luego igualar la receta (rendimiento),
 * y con la receta igualada, el sabor manda (molienda).
 */
export function sugerir(s: ShotBase, o: Objetivo, paso: number, ctx: Contexto = {}): Sugerencia {
  const sabor = s.sabor ?? { x: 0, y: 0 };
  const acido = sabor.x < -0.25;
  const amargo = sabor.x > 0.25;
  const debil = sabor.y < -0.25;
  const intenso = sabor.y > 0.25;
  const balanceado = !acido && !amargo && !debil && !intenso;
  const v = enVentana(s, o);
  const dT = s.tiempo - o.tiempo;
  const rapido = dT < -o.tolTiempo;
  const lento = dT > o.tolTiempo;
  const rendObjetivo = redondear(s.dosis * (o.rendimiento / o.dosis));
  const fino = redondear(s.molienda - paso, 2);
  const grueso = redondear(s.molienda + paso, 2);
  const boton = ctx.boton;

  if (Math.abs(s.dosis - o.dosis) > 0.3) {
    return {
      accion: `Vuelve a ${o.dosis.toFixed(1)} g de dosis`,
      porque: 'Cambia una sola variable a la vez. Con la dosis fuera de receta no sabes qué movió el sabor.',
      aprobar: false,
      ajuste: { dosis: o.dosis },
    };
  }

  if (balanceado && v.ratio && v.tiempo) {
    return {
      accion: 'Apruébalo',
      porque: 'Está dentro de la ventana y sabe balanceado. Esta es la receta del día.',
      aprobar: true,
      ajuste: {},
    };
  }

  if (balanceado) {
    return {
      accion: 'Sabe balanceado: puedes aprobarlo',
      porque: `Salió de la ventana de ${v.tiempo ? 'ratio' : 'tiempo'}, pero el tiempo y el ratio son guía y el sabor manda. Queda anotado.`,
      aprobar: true,
      ajuste: {},
    };
  }

  if (!v.ratio) {
    if (!boton) {
      return {
        accion: `Corta el shot en ${rendObjetivo.toFixed(1)} g`,
        porque: `Primero iguala el rendimiento a la receta: cambia el sabor tanto como la molienda. Corta en ${(rendObjetivo - GOTEO).toFixed(1)} g, lo demás gotea.`,
        aprobar: false,
        ajuste: { rendimiento: rendObjetivo },
      };
    }
    // Con volumen fijo, la molienda mueve tiempo y peso a la vez: si los dos
    // fallan hacia el mismo lado, basta con la molienda.
    const sobra = s.rendimiento > rendObjetivo;
    if ((rapido && sobra) || (lento && !sobra)) {
      const m = rapido ? fino : grueso;
      return {
        accion: `Muele más ${rapido ? 'fino' : 'grueso'}: ${s.molienda} → ${m}`,
        porque: rapido
          ? 'Rápido y con peso de más. Con el mismo volumen, más fino frena el flujo y deja menos bebida en la taza. No reprogrames todavía.'
          : 'Lento y con peso de menos. Con el mismo volumen, más grueso deja pasar más bebida. No reprogrames todavía.',
        aprobar: false,
        ajuste: { molienda: m },
      };
    }
    return {
      accion: `Reprograma ${boton} a ${rendObjetivo.toFixed(1)} g`,
      porque: `El tiempo ya está; lo que falla es cuánta agua mide el botón. Mover la molienda para corregir el peso te sacaría de tiempo.`,
      aprobar: false,
      ajuste: { rendimiento: rendObjetivo },
      reprogramar: rendObjetivo,
    };
  }

  if (acido) {
    if (lento) {
      return {
        accion: 'Revisa distribución y tampeo',
        porque: `Lento y ácido suele ser canalización: el agua se abre un camino y deja café sin extraer. Mover la molienda no lo arregla.${ctx.pid ? ` Si la distribución está bien y sigue ácido, el encargado puede subir el PID de ${ctx.pid} a ${ctx.pid + 0.5} °C (cambia la temperatura de todos los cafés).` : ''}`,
        aprobar: false,
        ajuste: {},
      };
    }
    return {
      accion: `Muele más fino: ${s.molienda} → ${fino}`,
      porque: `Ácido y ${rapido ? 'rápido' : 'en tiempo'}: le falta extracción. Más fino frena el flujo y saca más dulzor.${boton ? ' Con el botón, el peso baja un poco: revísalo en la báscula.' : ''}`,
      aprobar: false,
      ajuste: { molienda: fino },
    };
  }

  if (amargo) {
    if (rapido) {
      return {
        accion: 'Revisa distribución y tampeo',
        porque: 'Rápido y amargo suele ser canalización: una parte se sobreextrae mientras el resto pasa de largo.',
        aprobar: false,
        ajuste: {},
      };
    }
    return {
      accion: `Muele más grueso: ${s.molienda} → ${grueso}`,
      porque: `Amargo y ${lento ? 'lento' : 'en tiempo'}: está sobreextraído. Más grueso deja correr el agua y quita astringencia.${boton ? ' Con el botón, el peso sube un poco: revísalo en la báscula.' : ''}`,
      aprobar: false,
      ajuste: { molienda: grueso },
    };
  }

  if (debil || intenso) {
    const r = redondear(s.rendimiento + (debil ? -2 : 2));
    const porque = debil
      ? 'Débil es poca concentración: un ratio más corto concentra el shot sin cambiar la extracción.'
      : 'Muy intenso: un ratio más largo lo abre y deja ver la dulzura.';
    return {
      accion: boton ? `Reprograma ${boton} a ${r.toFixed(1)} g` : `${debil ? 'Baja' : 'Sube'} el rendimiento a ${r.toFixed(1)} g`,
      porque: boton ? `${porque} Con botón volumétrico, eso se cambia reprogramándolo.` : porque,
      aprobar: false,
      ajuste: { rendimiento: r },
      ...(boton ? { reprogramar: r } : {}),
    };
  }

  return { accion: 'Apruébalo', porque: 'Sabe balanceado.', aprobar: true, ajuste: {} };
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
