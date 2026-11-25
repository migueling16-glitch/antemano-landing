/**
 * ALDO chef LUGO — cuestionario del chef, lógica en el navegador.
 *
 * La página (src/pages/aldolugo/cuestionario.astro) ya trae todo pintado; aquí solo:
 *   - se navega por hash (#inicio · #P1…#P34 · #resumen · #gracias), con barra de progreso y contador;
 *   - se leen los controles, se guarda cada cambio (almacen.ts) y se pinta el estado del guardado;
 *   - se arma el resumen, el texto para copiar y el envío.
 * Los datos llegan como JSON (#cq-datos): este archivo no importa cuestionario.ts en runtime (solo tipos),
 * así el texto de las 34 preguntas no viaja dos veces.
 *
 * Reglas de uso: todo toque responde (si falta algo al enviar, se dice qué y se lleva a la pregunta);
 * una opción elegida se quita tocándola otra vez; "No sé todavía" es válido; nada abre ventanas ni descarga.
 */
import { crearAlmacen, iguales, tokenValido, type EstadoGuardado, type InfoEstado, type Respuestas } from './almacen';
import type { Campo, CampoTabla, Columna, ModeloCliente, Opcion, Pregunta, Prioridad, TextosCliente } from './cuestionario';

export type EstadoPregunta = 'completa' | 'parcial' | 'nose' | 'pendiente';
type EstadoCampo = 'completo' | 'parcial' | 'vacio';
type Modo = 'vistaPrevia' | 'malFormado' | 'demo' | 'conectado' | 'desconocido';

interface Datos {
  modelo: ModeloCliente;
  textos: TextosCliente;
  conexion: { url: string; key: string };
}

// =====================================================================================
// Lógica pura (sin DOM)
// =====================================================================================

const PRIORIDADES: Prioridad[] = ['P0', 'P1', 'P2'];
export const claveNoSe = (p: Pregunta) => `${p.id}.nose`;
const esObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const lleno = (x: unknown) => (typeof x === 'number' ? Number.isFinite(x) : typeof x === 'string' ? x.trim() !== '' : false);
const valor = (r: Respuestas, id: string) => r[id]?.v;

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const MILES = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });
const DEC = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2, useGrouping: false });
const fmtNum = (n: number, unidad?: string) => `${DEC.format(n)}${unidad ? ` ${unidad}` : ''}`;

/** "1,500" → 1500 · "24.5" o "24,5" → 24.5 (si admite decimales) · "" → null */
export function leerNumero(s: string, decimales = false): number | null {
  let t = s.trim().replace(/\s|\$|mxn/gi, '');
  if (!t) return null;
  if (!decimales) {
    const d = t.replace(/\D/g, '');
    return d ? Number(d) : null;
  }
  if (t.includes('.') && t.includes(',')) t = t.replace(/,/g, '');
  else if (/^\d{1,3}(,\d{3})+$/.test(t)) t = t.replace(/,/g, '');
  else t = t.replace(',', '.');
  t = t.replace(/[^\d.]/g, '');
  const [ent, ...resto] = t.split('.');
  const n = parseFloat(ent + (resto.length ? `.${resto.join('')}` : ''));
  return Number.isFinite(n) ? n : null;
}

export function visible(c: Campo, r: Respuestas) {
  if (!c.si) return true;
  const v = valor(r, c.si.campo);
  return typeof v === 'string' && c.si.valores.includes(v);
}

const celdasDe = (c: CampoTabla) =>
  c.filas.flatMap((f) => c.columnas.filter((col) => !f.omitir?.includes(col.id)).map((col) => ({ f, col, clave: `${f.id}.${col.id}` })));

export function estadoCampo(c: Campo, r: Respuestas): EstadoCampo {
  const v = valor(r, c.id);
  if (c.tipo === 'multiple') return Array.isArray(v) && v.length ? 'completo' : 'vacio';
  if (c.tipo === 'tabla') {
    const t = esObj(v) ? v : {};
    const celdas = celdasDe(c);
    const n = celdas.filter((x) => lleno(t[x.clave])).length;
    return n === 0 ? 'vacio' : n === celdas.length ? 'completo' : 'parcial';
  }
  return lleno(v) ? 'completo' : 'vacio';
}

export function estadoPregunta(p: Pregunta, r: Respuestas): EstadoPregunta {
  const vis = p.campos.filter((c) => visible(c, r));
  const req = vis.filter((c) => !c.opcional);
  if (req.length && req.every((c) => estadoCampo(c, r) === 'completo')) return 'completa';
  if (valor(r, claveNoSe(p)) === true) return 'nose';
  if (vis.some((c) => estadoCampo(c, r) !== 'vacio')) return 'parcial';
  return 'pendiente';
}

const etiquetaDe = (ops: Opcion[] | undefined, id: string) => ops?.find((o) => o.id === id)?.etiqueta ?? id;
const conDetalle = (et: string, det: unknown) => (typeof det === 'string' && det.trim() ? `${et.replace(/…$/, '')}: ${det.trim()}` : et);

function textoCelda(col: Columna, t: Record<string, unknown>, clave: string): string | null {
  const x = t[clave];
  if (!lleno(x)) return null;
  if (col.tipo === 'opciones') return conDetalle(etiquetaDe(col.opciones, String(x)), t[`${clave}.d`]);
  if (col.tipo === 'monto') return typeof x === 'number' ? MXN.format(x) : String(x);
  if (col.tipo === 'numero') return typeof x === 'number' ? fmtNum(x, col.unidad) : String(x);
  return String(x).trim();
}

/** Una línea por fila con algo contestado: "21–50 invitados — Cocineros en tu brigada: 4 · …" */
export function filasTabla(c: CampoTabla, r: Respuestas): string[] {
  const t = esObj(valor(r, c.id)) ? (valor(r, c.id) as Record<string, unknown>) : {};
  const out: string[] = [];
  for (const f of c.filas) {
    const partes = c.columnas
      .filter((col) => !f.omitir?.includes(col.id))
      .map((col) => {
        const s = textoCelda(col, t, `${f.id}.${col.id}`);
        return s ? `${f.etiquetas?.[col.id] ?? col.etiqueta}: ${s}` : null;
      })
      .filter(Boolean);
    if (partes.length) out.push(`${f.etiqueta} — ${partes.join(' · ')}`);
  }
  return out;
}

/** Valor legible de un campo, o null si no tiene. */
export function textoCampo(c: Campo, r: Respuestas): string | null {
  const e = r[c.id];
  const v = e?.v;
  const d = e?.d ?? {};
  switch (c.tipo) {
    case 'unica':
    case 'sino':
      return lleno(v) ? conDetalle(etiquetaDe(c.opciones, v as string), d[v as string]) : null;
    case 'escala':
      return lleno(v) ? String(v) : null;
    case 'multiple':
      return Array.isArray(v) && v.length ? v.map((id) => conDetalle(etiquetaDe(c.opciones, id), d[id])).join('; ') : null;
    case 'corto':
    case 'largo':
      return lleno(v) ? (v as string).trim() : null;
    case 'numero':
      return typeof v === 'number' && Number.isFinite(v) ? fmtNum(v, c.unidad) : null;
    case 'monto':
      return typeof v === 'number' && Number.isFinite(v) ? MXN.format(v) : null;
    case 'tabla': {
      const filas = filasTabla(c, r);
      return filas.length ? filas.join(' · ') : null;
    }
  }
}

/** Una línea para el resumen. */
export function resumenPregunta(p: Pregunta, r: Respuestas, tx: TextosCliente): string {
  const est = estadoPregunta(p, r);
  if (est === 'pendiente') return tx.resumen.sinRespuesta;
  const partes = p.campos.filter((c) => visible(c, r)).map((c) => textoCampo(c, r)).filter(Boolean) as string[];
  if (est === 'nose') partes.unshift(tx.estados.nose);
  return partes.join(' · ') || tx.estados[est];
}

export function cuentas(m: ModeloCliente, r: Respuestas) {
  const est = new Map(m.preguntas.map((p) => [p.id, estadoPregunta(p, r)]));
  const listas = (pr?: Prioridad) => m.preguntas.filter((p) => !pr || p.prioridad === pr);
  const hechas = (ps: Pregunta[]) => ps.filter((p) => ['completa', 'nose'].includes(est.get(p.id)!)).length;
  return {
    est,
    contestadas: hechas(listas()),
    aMedias: m.preguntas.filter((p) => est.get(p.id) === 'parcial').length,
    porPrioridad: Object.fromEntries(PRIORIDADES.map((pr) => [pr, { hechas: hechas(listas(pr)), total: listas(pr).length }])) as Record<
      Prioridad,
      { hechas: number; total: number }
    >,
  };
}

const fechaHora = (d: Date) =>
  `${d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;

/** Todas las respuestas como texto legible para pegar en WhatsApp (negritas con *…*). */
export function textoRespuestas(m: ModeloCliente, r: Respuestas, tx: TextosCliente, ahora = new Date()): string {
  const c = cuentas(m, r);
  const sin = tx.etiquetaCopia.sinContestar;
  const L: string[] = [`*${tx.etiquetaCopia.encabezado}*`, `${fechaHora(ahora)} · ${tx.resumen.cuenta.replace('{c}', String(c.contestadas)).replace('{t}', String(m.total))}`];
  for (const pr of PRIORIDADES) {
    L.push('', `*${pr} · ${m.prioridades[pr].titulo.toUpperCase()}*`);
    for (const b of m.bloques.filter((x) => x.prioridad === pr)) {
      L.push('', `_${b.titulo}_`);
      for (const p of m.preguntas.filter((x) => x.bloque === b.id)) {
        const est = c.est.get(p.id)!;
        L.push('', `*${p.n}. ${p.titulo}*`);
        if (est === 'pendiente') {
          L.push(sin);
          continue;
        }
        if (valor(r, claveNoSe(p)) === true && est !== 'completa') L.push(`• ${tx.etiquetaCopia.noSe}`);
        for (const campo of p.campos.filter((x) => visible(x, r))) {
          if (campo.tipo === 'tabla') {
            const filas = filasTabla(campo, r);
            L.push(`• ${campo.etiqueta}:`);
            if (filas.length) filas.forEach((f) => L.push(`   – ${f}`));
            else L.push(`   ${sin}`);
          } else {
            const t = textoCampo(campo, r);
            if (t !== null || !campo.opcional) L.push(`• ${campo.etiqueta}: ${t ?? sin}`);
          }
        }
      }
    }
  }
  return L.join('\n').trim();
}

// =====================================================================================
// Navegador
// =====================================================================================

export function iniciar() {
  const raiz = document.getElementById('cq');
  const nodo = document.getElementById('cq-datos');
  if (!raiz || !nodo) return;
  let datos: Datos;
  try {
    datos = JSON.parse(nodo.textContent || '');
  } catch {
    return;
  }
  (window as any).__cqListo = true;
  const M = datos.modelo;
  const TX = datos.textos;
  const P = M.preguntas;
  const ids = P.map((p) => p.id);
  const porId = new Map(P.map((p) => [p.id, p]));
  const campos = new Map<string, { c: Campo; p: Pregunta }>();
  P.forEach((p) => p.campos.forEach((c) => campos.set(c.id, { c, p })));
  const aviso = (t: string) => {
    try {
      (window as any).alAviso?.(t);
    } catch {
      /* sin aviso no pasa nada */
    }
  };

  // ---------- DOM ----------
  const $ = <T extends Element = HTMLElement>(s: string, base: ParentNode = raiz) => base.querySelector<T>(s);
  const $$ = <T extends Element = HTMLElement>(s: string, base: ParentNode = raiz) => Array.from(base.querySelectorAll<T>(s));
  const pantallas = new Map($$('[data-pantalla]').map((s) => [s.dataset.pantalla!, s]));
  const campoEls = new Map($$('[data-campo]').map((el) => [el.dataset.campo!, el]));
  const estadoEl = $('[data-cq-estado]');
  const estadoTxt = $('[data-cq-estado-txt]');
  const prioEl = $('[data-cq-prio]');
  const contadorEl = $('[data-cq-contador]');
  const segs = new Map($$('[data-seg]').map((s) => [s.dataset.seg!, s]));
  const marcas = $$('[data-estado-de]');
  const nav = $('[data-cq-nav]');
  const atras = $<HTMLAnchorElement>('[data-cq-atras]');
  const siguiente = $<HTMLAnchorElement>('[data-cq-siguiente]');
  const siguienteTxt = $('[data-cq-siguiente-txt]');
  const indice = new Map($$<HTMLAnchorElement>('[data-ind]').map((a) => [a.dataset.ind!, a]));
  const filasRes = new Map($$<HTMLAnchorElement>('[data-res]').map((a) => [a.dataset.res!, a]));
  const panelFaltan = $('[data-cq-faltan]');
  const botonesEnviar = $$<HTMLButtonElement>('[data-cq-enviar]');
  const sinField = !(typeof CSS !== 'undefined' && CSS.supports?.('field-sizing', 'content'));
  const tactil = (() => {
    try {
      return matchMedia('(pointer: coarse)').matches;
    } catch {
      return false;
    }
  })();

  // ---------- Token, modo y almacén ----------
  const k = new URLSearchParams(location.search).get('k');
  let estadoActual: EstadoGuardado = 'local';
  let cuando: number | null = null;
  const avisados = new Set<string>();
  const almacen = crearAlmacen({ url: datos.conexion.url, key: datos.conexion.key, alEstado: pintarEstado });
  let token: string | null = null;
  let modo: Modo;
  if (!k) modo = 'vistaPrevia';
  else if (!tokenValido(k)) modo = 'malFormado';
  else {
    token = k;
    modo = almacen.remotoActivo ? 'conectado' : 'demo';
  }
  const local = almacen.leerLocal(token);
  let respuestas: Respuestas = local?.respuestas ?? {};
  let enviadoEn: string | null = local?.enviadoEn ?? null;
  let graciasVariante: 'ok' | 'pendiente' | 'local' | 'error' | null = null;
  let actual = 'inicio';
  const clavePos = `al-cuestionario:pos:${token ?? 'vista-previa'}`;

  // ---------- Estado del guardado ----------
  function hace(ms: number | null): string {
    if (!ms) return '';
    const s = (Date.now() - ms) / 1000;
    if (s < 45) return 'hace un momento';
    if (s < 3600) return `hace ${Math.max(1, Math.round(s / 60))} min`;
    return `a las ${new Date(ms).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
  }
  function textoEstado(): string {
    switch (estadoActual) {
      case 'guardado':
        return TX.estado.guardado.replace('{hace}', hace(cuando)).trim();
      case 'guardando':
        return TX.estado.guardando;
      case 'sin-conexion':
        return TX.estado.sinConexion;
      case 'reintentando':
        return TX.estado.reintentando;
      case 'error':
        return TX.estado.error;
      case 'sin-almacen':
        return TX.estado.sinAlmacen;
      default:
        return TX.estado.local;
    }
  }
  function pintarEstado(e: EstadoGuardado, info: InfoEstado) {
    const antes = estadoActual;
    // "token-invalido" no es un estado de la barra: desde ahí todo es local.
    estadoActual = e === 'token-invalido' ? (info.local ? 'local' : 'sin-almacen') : e;
    cuando = info.cuando ?? cuando;
    if (estadoEl) estadoEl.dataset.estado = estadoActual;
    if (estadoTxt) estadoTxt.textContent = textoEstado();
    const avisoUnaVez = (clave: string, t: string) => {
      if (!avisados.has(clave)) {
        avisados.add(clave);
        aviso(t);
      }
    };
    if (e === 'token-invalido') {
      modo = 'desconocido';
      pintarModo();
      avisoUnaVez('desconocido', TX.avisos.desconocido);
    } else if (e === 'sin-conexion' && antes !== 'sin-conexion') avisoUnaVez('sin-conexion', TX.avisos.sinConexion);
    else if (e === 'error') avisoUnaVez('error', TX.avisos.error);
    else if (e === 'guardado') avisados.delete('sin-conexion'); // si se vuelve a caer, se avisa otra vez
    if (!info.local) avisoUnaVez('sin-almacen', TX.avisos.sinAlmacen);
  }
  window.setInterval(() => {
    if (estadoActual === 'guardado' && estadoTxt) estadoTxt.textContent = textoEstado();
  }, 20000);

  function pintarModo() {
    $$('[data-cq-modo]').forEach((caja) =>
      $$('[data-modo]', caja).forEach((p) => {
        p.hidden = p.dataset.modo !== modo;
      }),
    );
  }

  // ---------- Leer / escribir controles ----------
  function detalles(el: HTMLElement, id: string): Record<string, string> | undefined {
    const d: Record<string, string> = {};
    $$<HTMLInputElement>(`[data-detalle-de="${id}"]`, el).forEach((i) => {
      if (i.value.trim()) d[i.dataset.opcion!] = i.value;
    });
    return Object.keys(d).length ? d : undefined;
  }

  function leerDom(c: Campo, el: HTMLElement): { v: unknown; d?: Record<string, string> } {
    switch (c.tipo) {
      case 'unica':
      case 'sino':
      case 'escala': {
        const on = $<HTMLInputElement>(`input[type="radio"][name="${c.id}"]:checked`, el);
        return { v: on ? on.value : null, d: detalles(el, c.id) };
      }
      case 'multiple':
        return { v: $$<HTMLInputElement>(`input[type="checkbox"][name="${c.id}"]:checked`, el).map((i) => i.value), d: detalles(el, c.id) };
      case 'corto':
      case 'largo':
        return { v: $<HTMLInputElement>(`[name="${c.id}"]`, el)?.value ?? '' };
      case 'numero':
      case 'monto': {
        const i = $<HTMLInputElement>(`[name="${c.id}"]`, el);
        return { v: i ? leerNumero(i.value, i.hasAttribute('data-decimales')) : null };
      }
      case 'tabla': {
        const t: Record<string, string | number> = {};
        $$<HTMLInputElement>('[data-celda]', el).forEach((i) => {
          const clave = i.dataset.celda!;
          if (i.type === 'radio') {
            if (i.checked) t[clave] = i.value;
          } else if (i.classList.contains('cq-input--num')) {
            const n = leerNumero(i.value, i.hasAttribute('data-decimales'));
            if (n !== null) t[clave] = n;
          } else if (i.value.trim()) t[clave] = i.value;
        });
        return { v: t };
      }
    }
  }

  const enfocado = (x: Element) => x === document.activeElement;
  const fmtInput = (n: number, monto: boolean) => (monto ? MILES.format(n) : DEC.format(n));

  function escribirDom(c: Campo, el: HTMLElement) {
    const e = respuestas[c.id];
    const v = e?.v;
    const d = e?.d ?? {};
    const ponerTexto = (i: HTMLInputElement | HTMLTextAreaElement, s: string) => {
      if (!enfocado(i) && i.value !== s) {
        i.value = s;
        if (i instanceof HTMLTextAreaElement) autoAlto(i);
      }
    };
    $$<HTMLInputElement>(`[data-detalle-de="${c.id}"]`, el).forEach((i) => ponerTexto(i, d[i.dataset.opcion!] ?? ''));
    switch (c.tipo) {
      case 'unica':
      case 'sino':
      case 'escala':
        $$<HTMLInputElement>(`input[type="radio"][name="${c.id}"]`, el).forEach((i) => (i.checked = i.value === v));
        break;
      case 'multiple':
        $$<HTMLInputElement>(`input[type="checkbox"][name="${c.id}"]`, el).forEach((i) => (i.checked = Array.isArray(v) && v.includes(i.value)));
        break;
      case 'corto':
      case 'largo': {
        const i = $<HTMLInputElement>(`[name="${c.id}"]`, el);
        if (i) ponerTexto(i, typeof v === 'string' ? v : '');
        break;
      }
      case 'numero':
      case 'monto': {
        const i = $<HTMLInputElement>(`[name="${c.id}"]`, el);
        if (i) ponerTexto(i, typeof v === 'number' ? fmtInput(v, c.tipo === 'monto') : '');
        break;
      }
      case 'tabla': {
        const t = esObj(v) ? v : {};
        $$<HTMLInputElement>('[data-celda]', el).forEach((i) => {
          const x = t[i.dataset.celda!];
          if (i.type === 'radio') i.checked = x === i.value;
          else if (i.classList.contains('cq-input--num')) ponerTexto(i, typeof x === 'number' ? fmtInput(x, i.hasAttribute('data-monto')) : '');
          else ponerTexto(i, typeof x === 'string' ? x : '');
        });
        break;
      }
    }
  }

  function autoAlto(t: HTMLTextAreaElement) {
    if (!sinField) return;
    t.style.height = 'auto';
    t.style.height = `${Math.min(t.scrollHeight + 2, window.innerHeight * 0.6)}px`;
  }

  // ---------- Refresco ----------
  function refrescarCampo(c: Campo, el: HTMLElement) {
    $$('.cq-op', el).forEach((l) => l.classList.toggle('is-on', !!$<HTMLInputElement>('input', l)?.checked));
    $$('[data-detalle-para]', el).forEach((caja) => {
      const s = caja.dataset.detallePara!;
      const corte = s.lastIndexOf(':');
      const i = $<HTMLInputElement>(`input[name="${s.slice(0, corte)}"][value="${s.slice(corte + 1)}"]`, el);
      caja.hidden = !i?.checked;
    });
    $$('[data-usar]', el).forEach((b) => (b.hidden = estadoCampo(c, respuestas) !== 'vacio'));
    if (c.tipo === 'tabla' && c.regla === 'minimo21') {
      const t = esObj(valor(respuestas, c.id)) ? (valor(respuestas, c.id) as Record<string, unknown>) : {};
      $$('[data-regla]', el).forEach((p) => {
        const fila = p.dataset.regla!.split(':')[1];
        const desde = t[`${fila}.precio`];
        const minimo = t[`${fila}.minimo`];
        const mal = typeof desde === 'number' && typeof minimo === 'number' && desde > 0 && minimo < desde * 21;
        p.hidden = !mal;
        if (mal) p.textContent = `Con «desde» de ${MXN.format(desde)} por invitado, el mínimo debería ser de al menos ${MXN.format(desde * 21)} (× 21 invitados). Puedes dejarlo así si lo prefieres.`;
      });
    }
  }

  let rafPendiente = 0;
  const programarRefresco = () => {
    if (!rafPendiente) rafPendiente = requestAnimationFrame(() => ((rafPendiente = 0), refrescarTodo()));
  };

  function refrescarTodo() {
    const cu = cuentas(M, respuestas);
    for (const p of P) {
      for (const c of p.campos) {
        const el = campoEls.get(c.id);
        if (el) el.hidden = !visible(c, respuestas);
      }
      const b = $(`[data-nose="${p.id}"]`);
      b?.setAttribute('aria-pressed', String(valor(respuestas, claveNoSe(p)) === true));
    }
    marcas.forEach((m) => {
      const e = cu.est.get(m.dataset.estadoDe!) ?? 'pendiente';
      m.dataset.estado = e;
      if (m.classList.contains('cq-chip-estado')) m.textContent = TX.estados[e];
    });
    // Resumen
    const cuenta = TX.resumen.cuenta.replace('{c}', String(cu.contestadas)).replace('{t}', String(M.total));
    $$('[data-cq-cuenta]').forEach((x) => (x.textContent = cu.aMedias ? `${cuenta} · ${cu.aMedias} ${TX.estados.parcial.toLowerCase()}` : cuenta));
    $$('[data-cq-cuenta-prio]').forEach((x) => {
      const c = cu.porPrioridad[x.dataset.cqCuentaPrio as Prioridad];
      x.textContent = `${c.hechas} de ${c.total}`;
    });
    $$('[data-cuenta-bloque]').forEach((x) => {
      const ps = P.filter((p) => p.bloque === x.dataset.cuentaBloque);
      x.textContent = `${ps.filter((p) => ['completa', 'nose'].includes(cu.est.get(p.id)!)).length}/${ps.length}`;
    });
    filasRes.forEach((a, id) => {
      const t = $('[data-res-texto]', a);
      if (t) {
        t.hidden = cu.est.get(id) === 'pendiente'; // el chip ya dice "Sin contestar"
        t.textContent = resumenPregunta(porId.get(id)!, respuestas, TX);
      }
    });
    const enviado = $('[data-cq-enviado]');
    if (enviado) {
      enviado.hidden = !enviadoEn;
      if (enviadoEn) enviado.textContent = TX.resumen.enviadoEl.replace('{cuando}', cuandoLegible(enviadoEn));
    }
    // Bienvenida
    const empezar = $<HTMLAnchorElement>('[data-cq-empezar]');
    if (empezar) {
      const hay = Object.keys(respuestas).some((k) => !k.startsWith('_'));
      const n = posicion() ?? P.find((p) => cu.est.get(p.id) === 'pendiente')?.n ?? 1;
      empezar.href = `#P${n}`;
      empezar.textContent = hay ? TX.bienvenida.seguir.replace('{n}', String(n)) : TX.bienvenida.empezar;
    }
    const ya = $('[data-cq-ya-enviado]');
    if (ya) {
      ya.hidden = !enviadoEn;
      if (enviadoEn) ya.textContent = TX.bienvenida.yaEnviado.replace('{cuando}', cuandoLegible(enviadoEn));
    }
    actualizarBarra(cu);
    actualizarNav();
  }

  function cuandoLegible(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `el ${d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} a las ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
  }

  function actualizarBarra(cu = cuentas(M, respuestas)) {
    const p = porId.get(actual);
    if (prioEl) prioEl.textContent = p ? p.prioridad : TX.nav.resumen;
    if (contadorEl) contadorEl.textContent = p ? `${p.n} de ${M.total}` : `${cu.contestadas} de ${M.total}`;
    segs.forEach((s, id) => s.classList.toggle('is-actual', id === actual));
    indice.forEach((a, id) => (id === actual ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  }

  function actualizarNav() {
    const i = ids.indexOf(actual);
    if (i < 0 || !atras || !siguiente) return;
    atras.href = i === 0 ? '#inicio' : `#${ids[i - 1]}`;
    const ultima = i === ids.length - 1;
    siguiente.href = ultima ? '#resumen' : `#${ids[i + 1]}`;
    if (siguienteTxt) {
      siguienteTxt.textContent = ultima
        ? TX.nav.revisar
        : estadoPregunta(porId.get(actual)!, respuestas) === 'pendiente'
          ? TX.nav.saltar
          : TX.nav.siguiente;
    }
  }

  function pintarTodo() {
    campos.forEach(({ c }, id) => {
      const el = campoEls.get(id);
      if (el) {
        escribirDom(c, el);
        refrescarCampo(c, el);
      }
    });
    refrescarTodo();
  }

  // ---------- Guardar ----------
  function guardar() {
    void almacen.guardar(token, respuestas);
  }

  function poner(id: string, v: unknown, d?: Record<string, string>) {
    const e: { v: unknown; d?: Record<string, string>; t: number } = { v, t: Date.now() };
    if (d) e.d = d;
    respuestas = { ...respuestas, [id]: e };
  }

  function alCambiar(ev: Event) {
    const t = ev.target;
    if (!(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement)) return;
    if (t.closest('[data-cq-copia]')) return;
    const el = t.closest<HTMLElement>('[data-campo]');
    const info = el && campos.get(el.dataset.campo!);
    if (!el || !info) return;
    if (t instanceof HTMLTextAreaElement) autoAlto(t);
    const nuevo = leerDom(info.c, el);
    const previo = respuestas[info.c.id];
    const vacio =
      nuevo.v === null || nuevo.v === '' || (Array.isArray(nuevo.v) && !nuevo.v.length) || (esObj(nuevo.v) && !Object.keys(nuevo.v).length);
    const igual = previo
      ? iguales({ v: previo.v ?? null, d: previo.d ?? null }, { v: nuevo.v ?? null, d: nuevo.d ?? null })
      : vacio && !nuevo.d;
    if (!igual) {
      poner(info.c.id, nuevo.v, nuevo.d);
      guardar();
    }
    refrescarCampo(info.c, el);
    programarRefresco();
  }

  // ---------- Navegación ----------
  function posicion(): number | null {
    try {
      const n = Number(localStorage.getItem(clavePos));
      return n >= 1 && n <= M.total ? n : null;
    } catch {
      return null;
    }
  }
  function guardarPosicion(n: number) {
    try {
      localStorage.setItem(clavePos, String(n));
    } catch {
      /* no pasa nada */
    }
  }

  /** El aviso (toast) del layout se coloca encima de la barra inferior: --al-barra-h = su alto real (0 si está oculta). */
  function altoNav() {
    document.documentElement.style.setProperty('--al-barra-h', `${nav?.offsetHeight ?? 0}px`);
  }
  if (nav && 'ResizeObserver' in window) new ResizeObserver(altoNav).observe(nav);

  function ruta(): string {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return 'inicio';
    if (h === 'gracias' && !graciasVariante) {
      // Recarga en #gracias: no hay envío que mostrar, se vuelve al resumen (y el hash lo dice).
      try {
        history.replaceState(null, '', '#resumen');
      } catch {
        /* sin history: no pasa nada */
      }
      return 'resumen';
    }
    return pantallas.has(h) ? h : 'inicio';
  }

  function mostrar(id: string, enfocar = true) {
    pantallas.forEach((s, k) => s.classList.toggle('is-activa', k === id));
    raiz!.dataset.actual = id;
    actual = id;
    const p = porId.get(id);
    if (p) guardarPosicion(p.n);
    if (panelFaltan) panelFaltan.hidden = true;
    if (id === 'gracias') {
      $$('[data-gracias]').forEach((g) => (g.hidden = g.dataset.gracias !== graciasVariante));
    }
    actualizarBarra();
    actualizarNav();
    altoNav();
    if (!enfocar) return;
    const y = id === 'inicio' ? 0 : raiz!.getBoundingClientRect().top + window.scrollY;
    try {
      window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
    } catch {
      window.scrollTo(0, y);
    }
    const pantalla = pantallas.get(id);
    const titulo =
      id === 'gracias'
        ? $<HTMLElement>(`[data-gracias="${graciasVariante}"] [tabindex="-1"]`, pantalla!)
        : pantalla && $<HTMLElement>('h1[tabindex="-1"], h2[tabindex="-1"]', pantalla);
    titulo?.focus({ preventScroll: true });
  }

  // ---------- Envío ----------
  let enviando = false;
  function pintarBotonesEnviar(ocupado: boolean) {
    botonesEnviar.forEach((b) => {
      b.textContent = ocupado ? TX.resumen.enviando : TX.resumen.enviar;
      b.setAttribute('aria-busy', String(ocupado));
    });
  }

  async function enviar(forzar: boolean) {
    if (enviando) return;
    const cu = cuentas(M, respuestas);
    const faltan = P.filter((p) => p.prioridad === 'P0' && ['pendiente', 'parcial'].includes(cu.est.get(p.id)!));
    if (!forzar && faltan.length && panelFaltan) {
      const sin = faltan.filter((p) => cu.est.get(p.id) === 'pendiente').map((p) => p.n);
      const medias = faltan.filter((p) => cu.est.get(p.id) === 'parcial').map((p) => p.n);
      const t = $('[data-cq-faltan-texto]', panelFaltan);
      const l = $('[data-cq-faltan-lista]', panelFaltan);
      const ir = $<HTMLAnchorElement>('[data-cq-ir-falta]', panelFaltan);
      if (t) t.textContent = faltan.length === 1 ? TX.resumen.faltan1 : TX.resumen.faltanN.replace('{n}', String(faltan.length));
      if (l)
        l.textContent = [sin.length && `${TX.estados.pendiente}: ${sin.join(', ')}`, medias.length && `${TX.estados.parcial}: ${medias.join(', ')}`]
          .filter(Boolean)
          .join(' · ');
      if (ir) {
        ir.href = `#P${faltan[0].n}`;
        ir.textContent = TX.resumen.irA.replace('{n}', String(faltan[0].n));
      }
      panelFaltan.hidden = false;
      panelFaltan.focus({ preventScroll: true });
      panelFaltan.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (panelFaltan) panelFaltan.hidden = true;
    enviando = true;
    pintarBotonesEnviar(true);
    poner('_texto', textoRespuestas(M, respuestas, TX));
    const limite = new Promise<{ local: boolean; remoto: 'sin-red' }>((res) => setTimeout(() => res({ local: true, remoto: 'sin-red' }), 15000));
    const r = await Promise.race([almacen.guardar(token, respuestas, { enviado: true }), limite]);
    enviando = false;
    pintarBotonesEnviar(false);
    graciasVariante = r.remoto === 'ok' ? 'ok' : r.remoto === 'sin-red' ? 'pendiente' : r.remoto === 'error' ? 'error' : 'local';
    if (r.remoto === 'ok') enviadoEn = almacen.leerLocal(token)?.enviadoEn ?? new Date().toISOString();
    refrescarTodo();
    if (location.hash === '#gracias') mostrar('gracias');
    else location.hash = '#gracias';
  }

  // ---------- Copiar ----------
  function copiarViejo(texto: string) {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, texto.length);
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }

  async function copiar(boton: HTMLButtonElement) {
    const caja = boton.closest('[data-cq-copia]');
    const area = caja ? $<HTMLTextAreaElement>('[data-cq-copia-area]', caja) : null;
    const texto = textoRespuestas(M, respuestas, TX);
    let ok = false;
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(texto);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) ok = copiarViejo(texto);
    if (ok) {
      if (area) area.hidden = true;
      const original = boton.textContent;
      boton.textContent = 'Copiado ✓';
      window.setTimeout(() => (boton.textContent = original), 2500);
      aviso(TX.avisos.copiado);
    } else if (area) {
      // Navegador interno que no deja copiar: el texto queda a la vista, seleccionado.
      area.value = texto;
      area.hidden = false;
      area.focus({ preventScroll: true });
      area.select();
      area.setSelectionRange(0, texto.length);
      area.scrollIntoView({ block: 'nearest' });
      aviso(TX.avisos.copiaManual);
    }
  }

  // ---------- Eventos ----------
  const antes = new WeakMap<HTMLInputElement, boolean>();
  raiz.addEventListener(
    'pointerdown',
    (ev) => {
      const i = (ev.target as Element).closest('.cq-op')?.querySelector<HTMLInputElement>('input[type="radio"]');
      if (i) antes.set(i, i.checked);
    },
    true,
  );
  raiz.addEventListener('input', alCambiar);
  raiz.addEventListener('change', alCambiar);
  raiz.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    // Tocar otra vez la opción elegida la quita.
    if (t instanceof HTMLInputElement && t.type === 'radio') {
      if (antes.get(t) === true) {
        t.checked = false;
        t.dispatchEvent(new Event('change', { bubbles: true }));
      }
      antes.delete(t);
      return;
    }
    const usar = t.closest<HTMLButtonElement>('[data-usar]');
    if (usar) {
      const id = usar.dataset.usar!;
      const info = campos.get(id);
      const el = campoEls.get(id);
      if (!info || !el) return;
      let v: unknown;
      try {
        v = JSON.parse(usar.dataset.valor || 'null');
      } catch {
        return;
      }
      poner(id, info.c.tipo === 'multiple' && !Array.isArray(v) ? [v] : v, respuestas[id]?.d);
      escribirDom(info.c, el);
      refrescarCampo(info.c, el);
      programarRefresco();
      guardar();
      aviso(TX.avisos.propuesta.replace('{v}', textoCampo(info.c, respuestas) ?? ''));
      if (ev.detail === 0) $<HTMLElement>('input:checked, .cq-input', el)?.focus(); // teclado: el foco no se pierde
      return;
    }
    const nose = t.closest<HTMLButtonElement>('[data-nose]');
    if (nose) {
      const p = porId.get(nose.dataset.nose!);
      if (!p) return;
      const on = valor(respuestas, claveNoSe(p)) !== true;
      poner(claveNoSe(p), on);
      nose.setAttribute('aria-pressed', String(on));
      guardar();
      refrescarTodo();
      return;
    }
    if (t.closest('[data-cq-enviar-asi]')) return void enviar(true);
    if (t.closest('[data-cq-enviar]')) return void enviar(false);
    const copia = t.closest<HTMLButtonElement>('[data-cq-copiar]');
    if (copia) return void copiar(copia);
    const chip = t.closest<HTMLElement>('[data-ir-bloque]');
    if (chip) {
      document.getElementById(`cq-b-${chip.dataset.irBloque}`)?.scrollIntoView({ block: 'start' });
      return;
    }
  });
  // Enter en un campo de una línea: pasa al siguiente campo de la pantalla (no envía nada).
  raiz.addEventListener('keydown', (ev) => {
    const t = ev.target;
    if (ev.key !== 'Enter' || ev.isComposing || !(t instanceof HTMLInputElement) || t.type === 'radio' || t.type === 'checkbox') return;
    ev.preventDefault();
    const pantalla = t.closest('.cq-pantalla');
    const lista = pantalla ? $$<HTMLInputElement>('input.cq-input, textarea.cq-input', pantalla).filter((x) => x.offsetParent !== null && !x.readOnly) : [];
    const sig = lista[lista.indexOf(t) + 1];
    if (sig) sig.focus();
    else t.blur();
  });
  // Con el teclado abierto en el teléfono, la barra inferior se esconde para dejar espacio.
  const esTexto = (x: unknown) => (x instanceof HTMLInputElement && x.classList.contains('cq-input')) || x instanceof HTMLTextAreaElement;
  raiz.addEventListener('focusin', (ev) => {
    if (tactil && esTexto(ev.target)) raiz.dataset.escribiendo = '';
  });
  raiz.addEventListener('focusout', (ev) => {
    const t = ev.target;
    // Monto con separador de miles al salir del campo.
    if (t instanceof HTMLInputElement && t.classList.contains('cq-input--num')) {
      const n = leerNumero(t.value, t.hasAttribute('data-decimales'));
      const monto = t.hasAttribute('data-monto') || campos.get(t.name)?.c.tipo === 'monto';
      if (n !== null) t.value = fmtInput(n, monto);
    }
    window.setTimeout(() => {
      if (!esTexto(document.activeElement)) delete raiz.dataset.escribiendo;
    }, 60);
  });

  window.addEventListener('hashchange', () => mostrar(ruta()));
  window.addEventListener('online', () => void almacen.sincronizar(token));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void almacen.sincronizar(token, { keepalive: true });
  });
  window.addEventListener('pagehide', () => void almacen.sincronizar(token, { keepalive: true }));

  // ---------- Arranque ----------
  pintarModo();
  pintarTodo();
  const inicial = ruta();
  mostrar(inicial, inicial !== 'inicio');
  if (estadoTxt) estadoTxt.textContent = textoEstado();

  void almacen.leer(token).then((l) => {
    if (l.remoto === 'desconocido' && k) modo = tokenValido(k) ? 'desconocido' : 'malFormado';
    else if (l.remoto === 'ok') modo = 'conectado';
    if (l.remoto === 'ok' || l.remoto === 'sin-red') {
      enviadoEn = l.enviadoEn ?? enviadoEn;
      if (!iguales(l.respuestas, respuestas)) {
        respuestas = l.respuestas;
        pintarTodo();
      }
    }
    pintarModo();
    refrescarTodo();
  });
}
