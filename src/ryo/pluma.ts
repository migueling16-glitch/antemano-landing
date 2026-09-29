/**
 * La pluma de la intro de Ryo: destapa el isotipo real con una máscara
 * hecha de los ejes centrales de cada trazo (src/ryo/assets/isotipo-trazo.svg).
 * La usan la bio (/ryocafe) y la apertura de la app (/ryocafe/app).
 *
 * Se lee como una sola mano dibujando, no como piezas que se arman:
 * - Un trazo empieza justo cuando termina el anterior: nunca hay dos pedazos
 *   apareciendo a la vez en lugares distintos.
 * - Sin pausas entre elementos. El orden (taza, café, persona, ojos) viene
 *   del archivo, así los elementos no se revuelven.
 * - Una sola curva de velocidad para todo el dibujo (seno de entrada y
 *   salida sobre el largo acumulado): arranca suave, fluye y aterriza suave.
 *   Cada trazo avanza a la velocidad que le toca en ese punto de la curva.
 */

/** Inversa de la curva seno de entrada y salida: qué fracción del tiempo lleva recorrida una fracción del largo. */
const tiempoDe = (largo: number) => Math.acos(1 - 2 * Math.min(1, Math.max(0, largo))) / Math.PI;

/**
 * Colchón del patrón de guiones. Sin él, el offset inicial cae justo en la
 * frontera entre guión y hueco: con stroke-linecap round eso pinta un punto
 * del grosor del trazo, y el dibujo no arrancaría en blanco.
 */
const COLCHON = 2;

/** Anima los trazos de la pluma en orden y devuelve cuándo termina (ms). */
export function dibujar(trazos: SVGPathElement[], duracion: number): number {
  const largos = trazos.map((p) => p.getTotalLength());
  const total = largos.reduce((a, b) => a + b, 0) || 1;
  let recorrido = 0;
  trazos.forEach((p, i) => {
    const len = largos[i];
    const desde = tiempoDe(recorrido / total) * duracion;
    recorrido += len;
    const hasta = tiempoDe(recorrido / total) * duracion;
    const arranque = len + COLCHON;
    p.style.strokeDasharray = `${len} ${len + COLCHON * 2}`;
    p.style.strokeDashoffset = String(arranque);
    p.animate(
      [{ strokeDashoffset: String(arranque) }, { strokeDashoffset: '0' }],
      { duration: Math.max(1, hasta - desde), delay: desde, easing: 'linear', fill: 'forwards' },
    );
  });
  return duracion;
}

/** Los trazos de la pluma dentro de un contenedor, en el orden del dibujo. */
export const trazosDe = (raiz: ParentNode) =>
  Array.from(raiz.querySelectorAll<SVGPathElement>('[data-pluma] path'));
