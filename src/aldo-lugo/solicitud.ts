/**
 * Formulario de prospectos del DEMO (propuesta §7; ESPEC §8). Corre en el navegador.
 *
 * - Hoja <dialog> de 6 pasos con presets (data-preset), "Paso i de total" que cuenta solo los pasos visibles,
 *   validación amable (si falta un dato, lleva al campo y lo explica; "Continuar" nunca está deshabilitado),
 *   auto-avance solo con toque en el paso 2, revelado progresivo en el paso 4 y botón en flujo con teclado.
 * - Historial sincronizado: atrás del navegador cierra la hoja (o el aviso de privacidad) sin romper nada.
 * - Autoguardado local de los pasos 1–5 (try/catch, caduca a los 7 días; nombre y WhatsApp nunca se guardan).
 * - DEMO: "Enviar" no manda nada a ningún servidor. Muestra la pantalla de gracias con folio de ejemplo,
 *   la vista previa del mensaje de WhatsApp y, solo en el demo, la ficha que recibiría el chef con su nivel A/B/C.
 * - Los chips "Lo quiero en mi mesa" de Las lumbres también viven aquí (lumbres_pre).
 */
import {
  DEMO, BANDAS, OCASIONES, LUGAR, FORMULARIO, OFERTA, LUMBRES, AVISO_WA_DEMO,
  formatoSugerido, formatoPorId, nuevoFolio, normalizarWa, fechaCorta, mensajeWhatsApp, waHref, mxn,
  type BandaId, type OcasionId, type FormatoId, type Formato,
} from './config';
import { capa, cerrarYEsperar } from './components/capa';

// =====================================================================================
// Datos y reglas puras (se pueden probar sin DOM)
// =====================================================================================

export const PASOS = ['fecha', 'ocasion', 'invitados', 'lugar', 'inversion', 'contacto'] as const;
export type PasoId = (typeof PASOS)[number];

/** Umbrales de niveles (propuesta §7.3; ESPEC §8.3) [ESTIMADO, recalibrar con los primeros 30–50 leads]. */
export const NIVELES = { semanasMin: 3, semanasMinBoda: 8, sinLugarSemanas: 8, urgenteDias: 7, llamadaMinInvitados: 50 };

const P = Object.fromEntries(FORMULARIO.pasos.map((p) => [p.id, p])) as Record<string, any>;
const CORTES = (P.inversion?.cortes ?? null) as [number, number, number] | null;

/** Campos que se autoguardan (pasos 1–5, presets y perfil). Nunca nombre, WhatsApp, correo ni empresa. */
const GUARDADOS = [
  'fecha_estado', 'fecha', 'fecha_mes', 'flexible', 'ocasion', 'invitados', 'lugar_estado', 'tipo_lugar', 'fuego',
  'sugerir_lugares', 'zona', 'municipio', 'inversion', 'perfil', 'formato_pre', 'lumbres_pre',
] as const;

export interface Datos {
  fecha_estado: 'dia' | 'mes' | 'sin_fecha' | null;
  fecha: string | null;
  fecha_mes: string | null;
  flexible: boolean;
  ocasion: OcasionId | null;
  invitados: BandaId | null;
  lugar_estado: 'si' | 'opciones' | 'aun_no' | null;
  tipo_lugar: string | null;
  fuego: 'si' | 'no_se' | 'no' | null;
  sugerir_lugares: 'si' | 'no' | null;
  zona: string | null;
  municipio: string;
  inversion: string | null;
  perfil: 'aliado' | null;
  formato_pre: FormatoId | null;
  lumbres_pre: string[];
  nombre: string;
  wa_pais: '52' | '1';
  wa_numero: string;
  correo: string;
  empresa: string;
}

export interface Preset {
  formato?: FormatoId;
  ocasion?: OcasionId;
  invitados?: BandaId;
  perfil?: 'aliado';
}

const TZ = OFERTA.zonaHoraria;

/** Hoy en America/Monterrey, "AAAA-MM-DD" (la lista de fechas se calcula al abrir la hoja, no en el build). */
export function hoyISO(d = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
const aUTC = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return Date.UTC(a, (m || 1) - 1, d || 1);
};
export const diasEntre = (desde: string, hasta: string) => Math.round((aUTC(hasta) - aUTC(desde)) / 864e5);
const sumarAnios = (iso: string, n: number) => {
  const [a, m, d] = iso.split('-');
  return `${Number(a) + n}-${m}-${m === '02' && d === '29' ? '28' : d}`;
};
export function proximosMeses(hoy: string, n: number): string[] {
  const [a, m] = hoy.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const t = m - 1 + i;
    return `${a + Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
  });
}
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Rango por invitado de una opción del paso 5. null mientras falten los cortes (P5) o con "Prefiero platicarlo". */
function rangoInversion(id: string | null): { min: number; max: number } | null {
  if (!CORTES || !id || id === 'platicar') return null;
  const [A, B, C] = CORTES;
  return ({ b1: { min: 0, max: A }, b2: { min: A, max: B }, b3: { min: B, max: C }, b4: { min: C, max: Infinity } } as Record<string, { min: number; max: number }>)[id] ?? null;
}
const conIva = (x: number, iva: 'incluido' | 'mas_iva') => (iva === 'mas_iva' ? x * (1 + OFERTA.ivaTasa) : x);

/** Compara la inversión con el formato sugerido (ESPEC §8.3). evaluable = false mientras falten precios (P5). */
function inversionBaja(d: Datos, f: Formato | null): { bajo: boolean; evaluable: boolean } {
  const r = rangoInversion(d.inversion);
  const banda = BANDAS.find((b) => b.id === d.invitados);
  if (!r || !f || !banda) return { bajo: false, evaluable: false };
  const b2b = OCASIONES.find((o) => o.id === d.ocasion)?.b2b === true;
  const invMax = conIva(r.max, b2b ? 'mas_iva' : 'incluido');
  const n = banda.nRef ?? banda.min;
  const totalMax = invMax * n;
  if (f.precio.tipo === 'por_evento') {
    const p = f.precio;
    if (p.desde === null) return { bajo: false, evaluable: false };
    const extra = p.extraPorInvitado && p.extraDesdeInvitados && n >= p.extraDesdeInvitados ? (n - p.extraDesdeInvitados + 1) * p.extraPorInvitado : 0;
    return { bajo: totalMax < conIva(p.desde + extra, p.iva === 'incluido' ? 'incluido' : 'mas_iva'), evaluable: true };
  }
  const p = f.precio;
  if (p.desde === null || p.minimo === null) return { bajo: false, evaluable: false };
  return { bajo: invMax < conIva(p.desde, p.iva) && totalMax < conIva(p.minimo, p.iva), evaluable: true };
}

export type Duda = 'fuera_zona' | 'sin_espacio' | 'sin_fecha' | 'fecha_cercana' | 'sin_lugar_cerca';
export type Bandera = 'urgente' | 'revision_manual' | 'aliado' | 'sin_espacio' | 'viaticos';

/** Nivel A/B/C (propuesta §7.3; ESPEC §8.3). En producción se calcula solo en el servidor y nunca se muestra. */
export function puntuar(d: Datos, hoy = hoyISO()) {
  const banda = BANDAS.find((b) => b.id === d.invitados) ?? null;
  const sug = formatoSugerido(d.invitados, d.ocasion);
  const f = sug ? formatoPorId(sug.formato) : null;
  const zona = LUGAR.zonas.find((z) => z.id === d.zona);
  const dudas: Duda[] = [];
  const banderas: Bandera[] = [];

  if (zona?.cubierta !== true) dudas.push('fuera_zona');
  if (d.lugar_estado !== 'aun_no' && d.fuego === 'no') {
    dudas.push('sin_espacio');
    banderas.push('sin_espacio');
  }
  const ref = d.fecha_estado === 'dia' ? d.fecha : d.fecha_estado === 'mes' && d.fecha_mes ? `${d.fecha_mes}-01` : null;
  const dias = ref ? diasEntre(hoy, ref) : null;
  if (dias === null) dudas.push('sin_fecha');
  else {
    const sem = dias / 7;
    if (sem < (d.ocasion === 'boda' ? NIVELES.semanasMinBoda : NIVELES.semanasMin)) dudas.push('fecha_cercana');
    if (d.lugar_estado === 'aun_no' && sem < NIVELES.sinLugarSemanas) dudas.push('sin_lugar_cerca');
    if (d.fecha_estado === 'dia' && dias < NIVELES.urgenteDias) banderas.push('urgente');
  }

  const platicar = !d.inversion || d.inversion === 'platicar';
  const inv = inversionBaja(d, f);
  let nivel: 'A' | 'B' | 'C' = inv.bajo || dudas.length >= 2 ? 'C' : platicar || dudas.length === 1 ? 'B' : 'A';
  if (banda?.accion === 'revision_manual') {
    banderas.push('revision_manual');
    if (nivel === 'A') nivel = 'B';
  }
  if (d.perfil === 'aliado') banderas.push('aliado');
  if (zona?.viaticos === true) banderas.push('viaticos');
  const llamada = nivel === 'A' && (d.ocasion === 'boda' || d.ocasion === 'empresa') && (banda?.min ?? 0) > NIVELES.llamadaMinInvitados;
  return { nivel, formato: sug?.formato ?? null, revisionManual: !!sug?.revisionManual, dudas, banderas, llamada, platicar, bajo: inv.bajo, evaluable: inv.evaluable };
}

// =====================================================================================
// Textos de la ficha y el resumen
// =====================================================================================

const etiquetaOcasion = (id: string | null) => OCASIONES.find((o) => o.id === id)?.etiqueta ?? 'Evento';
const etiquetaBanda = (id: string | null) => BANDAS.find((b) => b.id === id)?.etiqueta ?? '';
const etiquetaTipo = (id: string | null) => LUGAR.tipos.find((t) => t.id === id)?.etiqueta ?? '';
const etiquetaZona = (id: string | null) => {
  const z = LUGAR.zonas.find((x) => x.id === id);
  return z ? (z.etiqueta ?? z.provisional) : '';
};
const ESTADO_LUGAR: Record<string, string> = { si: 'ya tiene', opciones: 'tiene opciones', aun_no: 'aún no' };
const FUEGO: Record<string, string> = { si: 'sí', no_se: 'no sabe', no: 'no' };

function fechaDe(d: Datos): string | null {
  return d.fecha_estado === 'dia' ? d.fecha : d.fecha_estado === 'mes' ? d.fecha_mes : null;
}
function fechaFicha(d: Datos): string {
  const iso = fechaDe(d);
  if (!iso) return 'Fecha: por definir';
  let txt = fechaCorta(iso);
  if (d.fecha_estado === 'dia') {
    try {
      txt = `${new Intl.DateTimeFormat('es-MX', { weekday: 'short', timeZone: 'UTC' }).format(new Date(aUTC(iso))).replace('.', '')} ${txt}`;
    } catch { /* sin Intl: solo la fecha */ }
  }
  return txt + (d.flexible ? ' (flexible)' : '');
}
function ahoraFicha(): string {
  try {
    const p = new Intl.DateTimeFormat('es-MX', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(new Date());
    const v = (t: string) => p.find((x) => x.type === t)?.value ?? '';
    return `${v('day')}-${v('month').replace('.', '')} ${v('hour')}:${v('minute')}`;
  } catch {
    return '';
  }
}
function etiquetaInversion(d: Datos): string {
  if (!d.inversion || d.inversion === 'platicar') return 'prefiere platicarlo';
  const o = (P.inversion?.opciones ?? []).find((x: any) => x.id === d.inversion);
  const r = rangoInversion(d.inversion);
  const b2b = OCASIONES.find((x) => x.id === d.ocasion)?.b2b === true;
  const nombre = r ? (r.min === 0 ? `menos de ${mxn(r.max)}` : r.max === Infinity ? `más de ${mxn(r.min)}` : `${mxn(r.min)}–${mxn(r.max)}`) : (o?.provisional ?? d.inversion);
  return `${nombre} por invitado${b2b ? ' + IVA' : ''}${CORTES ? '' : ' (cortes por confirmar)'}`;
}
const TXT_DUDA = (d: Duda, datos: Datos): string => {
  switch (d) {
    case 'fuera_zona': {
      const z = LUGAR.zonas.find((x) => x.id === datos.zona);
      return z?.cubierta === false ? 'Fuera de zona: viáticos aparte' : 'Zona sin cobertura confirmada todavía';
    }
    case 'sin_espacio': return 'El lugar no permite fuego abierto';
    case 'sin_fecha': return 'Todavía sin fecha';
    case 'fecha_cercana': return `Fecha a menos de ${datos.ocasion === 'boda' ? NIVELES.semanasMinBoda : NIVELES.semanasMin} semanas`;
    case 'sin_lugar_cerca': return `Sin lugar y la fecha a menos de ${NIVELES.sinLugarSemanas} semanas`;
  }
};
const TXT_BANDERA: Record<Bandera, string> = {
  urgente: 'URGENTE',
  revision_manual: 'revisión manual',
  aliado: 'cola aliado',
  sin_espacio: 'sin espacio',
  viaticos: 'viáticos aparte',
};
const TXT_NIVEL = { A: 'WhatsApp prioritario', B: 'WhatsApp normal', C: 'Mensaje honesto con una salida, por WhatsApp' };

function telOculto(e164: string, n: string) {
  return n.length >= 7 ? `${e164.slice(0, e164.length - n.length)} ${n.slice(0, 3)} ••• ${n.slice(-4)}` : e164;
}
const formatoTel = (n: string) => (n.length === 10 ? `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` : n);

// =====================================================================================
// Hoja en el navegador
// =====================================================================================

export function montarSolicitud() {
  const dlg = document.querySelector<HTMLDialogElement>('[data-hoja]');
  const form = dlg?.querySelector<HTMLFormElement>('[data-form]');
  if (!dlg || !form) return;
  const hoja = dlg;
  const formulario = form;

  const raiz = document.documentElement;
  const quieto = () => raiz.hasAttribute('data-quieto');
  const aviso = (t: string) => (window as any).alAviso?.(t);
  const q = <T extends Element = HTMLElement>(s: string, r: ParentNode = hoja) => r.querySelector<T>(s);
  const qq = <T extends Element = HTMLElement>(s: string, r: ParentNode = hoja) => Array.from(r.querySelectorAll<T>(s));

  const pasoEl = new Map(PASOS.map((p) => [p, q(`[data-paso="${p}"]`)!] as const));
  const cuerpo = q('[data-cuerpo]')!;
  const progresoTxt = q('[data-progreso-texto]')!;
  const progresoBar = q('[data-progreso]')!;
  const atrasBtn = q<HTMLButtonElement>('[data-atras]')!;
  const gracias = q('[data-gracias]')!;
  const recuperar = q('[data-recuperar]')!;
  const fechaInput = q<HTMLInputElement>('#ml-fecha')!;
  const mesSelect = q<HTMLSelectElement>('#ml-mes')!;
  const waInput = q<HTMLInputElement>('#ml-wa')!;
  const paisSelect = q<HTMLSelectElement>('[name="wa_pais"]')!;
  const privDlg = q<HTMLDialogElement>('[data-privacidad-dlg]');

  const abrirCapa = capa(hoja, 'hoja');
  const abrirPriv = privDlg ? capa(privDlg, 'privacidad') : null;

  let actual = 0;
  const saltar = new Set<PasoId>();
  let enviado = false;
  let pasoGuardado = 0;
  let presetActual: Preset = {};
  let ultimoPuntero = 0;
  let relojAuto = 0;
  let relojGuardar = 0;
  let folio = '';
  let mensaje = '';

  // ---------- leer / escribir campos ----------
  type Control = RadioNodeList | HTMLInputElement | HTMLSelectElement;
  const campo = (n: string) => formulario.elements.namedItem(n) as Control | null;
  function valor(n: string): string {
    const c = campo(n);
    if (!c) return '';
    if (typeof RadioNodeList !== 'undefined' && c instanceof RadioNodeList) return c.value;
    if (c instanceof HTMLInputElement && c.type === 'checkbox') return c.checked ? c.value : '';
    return (c as HTMLInputElement).value ?? '';
  }
  function poner(n: string, v: string | boolean | null | undefined) {
    const c = campo(n);
    if (!c) return;
    if (typeof RadioNodeList !== 'undefined' && c instanceof RadioNodeList) {
      if (!v) Array.from(c).forEach((r) => ((r as HTMLInputElement).checked = false));
      else c.value = String(v);
      return;
    }
    if (c instanceof HTMLInputElement && c.type === 'checkbox') {
      c.checked = !!v;
      return;
    }
    (c as HTMLInputElement).value = v ? String(v) : '';
  }
  /** ¿El bloque del campo está a la vista según [data-si]? Un bloque oculto no cuenta como respondido. */
  const visibleCampo = (n: string) => {
    const g = q(`[data-grupo="${n}"]`);
    return !g || !(g.matches('[data-si][hidden]') || g.closest('[data-si][hidden]'));
  };
  const val = (n: string) => (visibleCampo(n) ? valor(n) || null : null);

  function leer(): Datos {
    let lumbres: string[] = [];
    try { lumbres = JSON.parse(valor('lumbres_pre') || '[]'); } catch { lumbres = []; }
    return {
      fecha_estado: (valor('fecha_estado') || null) as Datos['fecha_estado'],
      fecha: val('fecha'),
      fecha_mes: val('fecha_mes'),
      flexible: valor('flexible') === '1' && valor('fecha_estado') !== 'sin_fecha',
      ocasion: (valor('ocasion') || null) as OcasionId | null,
      invitados: (valor('invitados') || null) as BandaId | null,
      lugar_estado: (valor('lugar_estado') || null) as Datos['lugar_estado'],
      tipo_lugar: val('tipo_lugar'),
      fuego: val('fuego') as Datos['fuego'],
      sugerir_lugares: val('sugerir_lugares') as Datos['sugerir_lugares'],
      zona: val('zona'),
      municipio: (val('municipio') ?? '').trim(),
      inversion: valor('inversion') || null,
      perfil: valor('perfil') === 'aliado' ? 'aliado' : null,
      formato_pre: (valor('formato_pre') || null) as FormatoId | null,
      lumbres_pre: lumbres,
      nombre: valor('nombre').trim(),
      wa_pais: (valor('wa_pais') || '52') as '52' | '1',
      wa_numero: valor('wa_numero'),
      correo: valor('correo').trim(),
      empresa: val('empresa')?.trim() ?? '',
    };
  }

  // ---------- bloques condicionales [data-si] ----------
  function cumple(expr: string): boolean {
    return expr.split('||').some((alt) =>
      alt.split(';').every((cl) => {
        const [n, vs = '*'] = cl.trim().split('=');
        const v = valor(n.trim());
        return vs.trim() === '*' ? v !== '' : vs.split('|').map((s) => s.trim()).includes(v);
      }),
    );
  }
  function revelar(llevar = false) {
    const nuevos: HTMLElement[] = [];
    qq<HTMLElement>('[data-si]').forEach((el) => {
      const ver = cumple(el.dataset.si || '');
      if (el.hidden === ver) {
        el.hidden = !ver;
        if (ver) nuevos.push(el);
      }
    });
    const enPaso = nuevos.filter((el) => pasoEl.get(PASOS[actual])?.contains(el));
    if (llevar && enPaso.length) {
      const ultimo = enPaso[enPaso.length - 1];
      requestAnimationFrame(() => ultimo.scrollIntoView({ block: 'nearest', behavior: quieto() ? 'auto' : 'smooth' }));
    }
  }

  // ---------- errores ----------
  interface Falta { grupo: string; mensaje: string; foco?: HTMLElement | null }
  function marcarError(f: Falta, llevar = true) {
    const g = q(`[data-grupo="${f.grupo}"]`);
    if (!g) return;
    const err = g.querySelector<HTMLElement>(':scope > [data-error], [data-error]');
    if (err && f.mensaje) {
      err.textContent = f.mensaje;
      err.hidden = false;
    }
    g.classList.add('is-error');
    const controles = qq<HTMLInputElement>('input, select, textarea', g);
    controles.forEach((c) => {
      c.setAttribute('aria-invalid', 'true');
      if (err && f.mensaje) {
        const ids = new Set((c.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
        ids.add(err.id);
        c.setAttribute('aria-describedby', [...ids].join(' '));
      }
    });
    if (!llevar) return;
    const foco = f.foco ?? g.querySelector<HTMLElement>('input:checked') ?? controles[0];
    (f.foco ?? g).scrollIntoView({ block: 'center', behavior: quieto() ? 'auto' : 'smooth' });
    foco?.focus({ preventScroll: true });
  }
  function limpiarError(nombre: string) {
    const g = q(`[data-grupo="${nombre}"]`);
    if (!g || !g.classList.contains('is-error')) return;
    g.classList.remove('is-error');
    const err = g.querySelector<HTMLElement>('[data-error]');
    if (err) { err.hidden = true; err.textContent = ''; }
    qq<HTMLInputElement>('input, select, textarea', g).forEach((c) => c.removeAttribute('aria-invalid'));
  }
  const limpiarTodo = () => qq('[data-grupo].is-error').forEach((g) => limpiarError(g.dataset.grupo || ''));

  const M = FORMULARIO.mensajes;
  const correoValido = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

  function validarPaso(p: PasoId): Falta | null {
    switch (p) {
      case 'fecha': {
        const est = valor('fecha_estado');
        if (!est) return { grupo: 'fecha_estado', mensaje: M.falta };
        if (est === 'dia') {
          const f = valor('fecha');
          if (!f) return { grupo: 'fecha', mensaje: 'Elige el día de tu evento, o toca «Aún no tengo día».' };
          if (f < fechaInput.min) return { grupo: 'fecha', mensaje: 'Elige una fecha a partir de hoy.' };
          if (fechaInput.max && f > fechaInput.max) return { grupo: 'fecha', mensaje: 'Elige una fecha dentro de los próximos 3 años.' };
        }
        if (est === 'mes' && !valor('fecha_mes')) return { grupo: 'fecha_mes', mensaje: M.falta };
        return null;
      }
      case 'ocasion':
        return valor('ocasion') ? null : { grupo: 'ocasion', mensaje: M.falta };
      case 'invitados': {
        const v = valor('invitados');
        if (!v) return { grupo: 'invitados', mensaje: M.falta };
        if (v === 'menos-10') return { grupo: 'invitados', mensaje: '', foco: q('[data-salida-texto]') };
        return null;
      }
      case 'lugar': {
        const est = valor('lugar_estado');
        if (!est) return { grupo: 'lugar_estado', mensaje: M.falta };
        if (est !== 'aun_no') {
          if (!valor('tipo_lugar')) return { grupo: 'tipo_lugar', mensaje: M.falta };
          if (!valor('fuego')) return { grupo: 'fuego', mensaje: M.falta };
        }
        if (!valor('zona')) return { grupo: 'zona', mensaje: M.falta };
        const m = valor('municipio').trim();
        if (m.length < 2) return { grupo: 'municipio', mensaje: 'Escribe el municipio o la ciudad del evento.' };
        return null;
      }
      case 'inversion':
        return valor('inversion') ? null : { grupo: 'inversion', mensaje: M.falta };
      case 'contacto': {
        const nom = valor('nombre').trim();
        if (nom.length < 2) return { grupo: 'nombre', mensaje: M.nombre };
        const wa = revisarWa(false);
        if (!wa?.valido) return { grupo: 'wa_numero', mensaje: waInput.value.trim() ? M.wa : M.falta };
        const c = valor('correo').trim();
        if (c && !correoValido(c)) return { grupo: 'correo', mensaje: M.correo };
        return null;
      }
    }
  }

  // ---------- navegación ----------
  const visibles = () => PASOS.filter((p) => !saltar.has(p));
  const interp = (c: number[], t: number) => {
    const a = Math.floor(t);
    const b = Math.min(c.length - 1, a + 1);
    return c[a] + (c[b] - c[a]) * (t - a);
  };
  function pintarProgreso(fin = false) {
    const vis = visibles();
    const k = Math.max(0, vis.indexOf(PASOS[actual]));
    const n = vis.length;
    const c = FORMULARIO.curva;
    const pct = fin ? 100 : n <= 1 ? c[0] : interp(c, (k * (c.length - 1)) / (n - 1));
    progresoBar.style.transform = `scaleX(${pct / 100})`;
    progresoTxt.textContent = fin ? 'Listo' : FORMULARIO.progreso(k + 1, n);
    const primero = fin || k === 0;
    atrasBtn.classList.toggle('is-oculto', primero);
    atrasBtn.tabIndex = primero ? -1 : 0;
    atrasBtn.setAttribute('aria-hidden', primero ? 'true' : 'false');
  }
  function enfocarPaso() {
    pasoEl.get(PASOS[actual])?.querySelector<HTMLElement>('.ml-paso__q')?.focus({ preventScroll: true });
  }
  function mostrar(i: number, dir: 0 | 1 | -1 = 0) {
    actual = Math.max(0, Math.min(PASOS.length - 1, i));
    PASOS.forEach((p, k) => {
      const el = pasoEl.get(p)!;
      el.hidden = k !== actual;
      el.classList.remove('is-entra', 'is-entra-atras');
    });
    const el = pasoEl.get(PASOS[actual])!;
    if (dir && !quieto()) {
      void el.offsetWidth;
      el.classList.add(dir > 0 ? 'is-entra' : 'is-entra-atras');
    }
    revelar(false);
    pintarProgreso();
    if (PASOS[actual] === 'inversion') pintarInversion();
    cuerpo.scrollTop = 0;
    if (hoja.open) enfocarPaso();
    guardarPronto();
  }
  function continuar() {
    clearTimeout(relojAuto);
    const p = PASOS[actual];
    const falta = validarPaso(p);
    if (falta) {
      marcarError(falta);
      return;
    }
    recuperar.hidden = true;
    if (p === 'contacto') return enviar();
    let j = actual + 1;
    while (j < PASOS.length - 1 && saltar.has(PASOS[j])) j++;
    mostrar(j, 1);
  }
  function atras() {
    clearTimeout(relojAuto);
    if (actual === 0) return;
    const j = actual - 1;
    saltar.delete(PASOS[j]); // un paso que llegó con preset vuelve a contar: "Atrás" permite cambiarlo
    recuperar.hidden = true;
    mostrar(j, -1);
  }

  // ---------- fecha ----------
  function prepararFecha() {
    const hoy = hoyISO();
    fechaInput.min = hoy;
    fechaInput.max = sumarAnios(hoy, 3);
    const previo = mesSelect.value;
    const lista = proximosMeses(hoy, P.fecha?.horizonteMeses ?? 36);
    mesSelect.replaceChildren(new Option('Elige el mes', ''), ...lista.map((m) => new Option(capital(fechaCorta(m)), m)));
    if (lista.includes(previo)) mesSelect.value = previo;
  }
  function revisarPronto() {
    const nota = q('[data-pronto]');
    if (!nota) return;
    const f = valor('fecha');
    const dias = f ? diasEntre(hoyISO(), f) : null;
    nota.hidden = !(valor('fecha_estado') === 'dia' && dias !== null && dias >= 0 && dias < (P.fecha?.semanasPronto ?? 3) * 7);
  }

  // ---------- WhatsApp del cliente ----------
  function revisarWa(mostrarError: boolean) {
    const v = waInput.value;
    if (!v.trim()) return null;
    const r = normalizarWa(v, (paisSelect.value || '52') as '52' | '1');
    if (r.pais !== paisSelect.value) paisSelect.value = r.pais;
    if (r.valido) {
      waInput.value = formatoTel(r.n);
      limpiarError('wa_numero');
    } else if (mostrarError) marcarError({ grupo: 'wa_numero', mensaje: M.wa }, false);
    return r;
  }

  // ---------- paso 5: IVA para empresas y totales (cuando existan los cortes) ----------
  function pintarInversion() {
    const b2b = OCASIONES.find((o) => o.id === valor('ocasion'))?.b2b === true;
    qq('[data-unidad]').forEach((s) => (s.textContent = b2b ? 'por invitado + IVA' : 'por invitado, IVA incluido'));
    const banda = BANDAS.find((b) => b.id === valor('invitados'));
    const n = banda?.nRef ?? null;
    qq<HTMLInputElement>('input[name="inversion"]').forEach((inp) => {
      const t = inp.closest('label')?.querySelector<HTMLElement>('[data-total]');
      if (!t) return;
      const min = Number(inp.dataset.min);
      const max = inp.dataset.max ? Number(inp.dataset.max) : Infinity;
      if (!CORTES || !n || Number.isNaN(min)) { t.textContent = ''; return; }
      t.textContent = max === Infinity ? ` · ≈ más de ${mxn(min * n)} para ${n}` : ` · ≈ ${mxn(min * n)}–${mxn(max * n)} para ${n}`;
    });
  }

  // ---------- lumbres (chips de la sección Las lumbres) ----------
  const chips = () => Array.from(document.querySelectorAll<HTMLButtonElement>('[data-lumbre]'));
  const elegidas = () => chips().filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.lumbre!);
  function pintarLumbres(anunciar: boolean) {
    const n = elegidas().length;
    const texto = LUMBRES.anuncio(n);
    const visible = document.querySelector<HTMLElement>('[data-lumbres-visible]');
    if (visible) {
      visible.hidden = n === 0;
      visible.textContent = n ? texto : '';
    }
    const vivo = document.querySelector<HTMLElement>('[data-lumbres-anuncio]');
    if (vivo && anunciar) vivo.textContent = texto;
  }
  const sincronizarLumbres = () => poner('lumbres_pre', JSON.stringify(elegidas()));
  document.addEventListener('click', (ev) => {
    const c = (ev.target as Element | null)?.closest<HTMLButtonElement>('[data-lumbre]');
    if (!c) return;
    c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    sincronizarLumbres();
    pintarLumbres(true);
    guardarPronto();
  });

  // ---------- aliado ----------
  const aliadoBtn = q<HTMLButtonElement>('[data-aliado]');
  function pintarAliado() {
    const on = valor('perfil') === 'aliado';
    aliadoBtn?.setAttribute('aria-pressed', on ? 'true' : 'false');
    const nota = q('[data-aliado-nota]');
    if (nota) nota.hidden = !on;
  }
  aliadoBtn?.addEventListener('click', () => {
    poner('perfil', valor('perfil') === 'aliado' ? '' : 'aliado');
    pintarAliado();
    revelar();
    guardarPronto();
  });

  // ---------- autoguardado local ----------
  const CLAVE = FORMULARIO.almacen.clave;
  const VIDA = FORMULARIO.almacen.dias * 864e5;
  function guardar() {
    if (enviado) return;
    try {
      const d = leer() as unknown as Record<string, unknown>;
      const datos: Record<string, unknown> = {};
      for (const k of GUARDADOS) datos[k] = d[k];
      // Con la franja "¿Seguimos…?" a la vista se conserva el paso guardado hasta que la persona elija.
      const paso = hoja.open && recuperar.hidden ? actual : pasoGuardado;
      localStorage.setItem(CLAVE, JSON.stringify({ v: 1, t: Date.now(), paso, datos }));
    } catch { /* almacenamiento bloqueado: la hoja funciona igual */ }
  }
  const guardarPronto = () => {
    clearTimeout(relojGuardar);
    relojGuardar = window.setTimeout(guardar, 250);
  };
  function borrarGuardado() {
    try { localStorage.removeItem(CLAVE); } catch { /* nada */ }
  }
  function restaurar() {
    try {
      const raw = localStorage.getItem(CLAVE);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (!s || typeof s.t !== 'number' || Date.now() - s.t > VIDA || !s.datos) return borrarGuardado();
      const d = s.datos as Record<string, any>;
      for (const k of GUARDADOS) {
        if (k === 'lumbres_pre') poner(k, JSON.stringify(Array.isArray(d[k]) ? d[k] : []));
        else if (k === 'flexible') poner(k, !!d[k]);
        else if (d[k] !== undefined && d[k] !== null) poner(k, String(d[k]));
      }
      if (!d.fecha_estado) poner('fecha_estado', 'dia');
      const lum: string[] = Array.isArray(d.lumbres_pre) ? d.lumbres_pre : [];
      chips().forEach((c) => c.setAttribute('aria-pressed', lum.includes(c.dataset.lumbre!) ? 'true' : 'false'));
      pasoGuardado = Math.max(0, Math.min(PASOS.length - 1, Number(s.paso) || 0));
    } catch {
      borrarGuardado();
    }
  }

  // ---------- reinicio ----------
  function reiniciar() {
    formulario.reset();
    ['formato_pre', 'lumbres_pre', 'perfil'].forEach((n) => poner(n, ''));
    sincronizarLumbres();
    enviado = false;
    pasoGuardado = 0;
    saltar.clear();
    gracias.hidden = true;
    formulario.hidden = false;
    limpiarTodo();
    pintarAliado();
    prepararFecha();
    revisarPronto();
    revelar();
  }
  function aplicarPreset(p: Preset) {
    presetActual = p;
    saltar.clear();
    poner('formato_pre', p.formato ?? '');
    if (p.perfil === 'aliado') poner('perfil', 'aliado');
    if (p.ocasion) { poner('ocasion', p.ocasion); saltar.add('ocasion'); }
    if (p.invitados) { poner('invitados', p.invitados); saltar.add('invitados'); }
    pintarAliado();
  }

  // ---------- abrir / cerrar ----------
  const avisoCaja = document.querySelector<HTMLElement>('[data-al-aviso-caja]');
  function moverAviso(dentro: boolean) {
    if (!avisoCaja) return;
    // La hoja vive en la capa superior: el aviso tiene que ir dentro para verse encima.
    if (dentro) hoja.append(avisoCaja);
    else document.body.append(avisoCaja);
  }
  function pintarRecuperar() {
    let destino = pasoGuardado;
    while (destino > 0 && saltar.has(PASOS[destino])) destino--;
    const vis = visibles();
    const k = vis.indexOf(PASOS[destino]);
    if (destino <= 0 || k <= 0) {
      recuperar.hidden = true;
      return;
    }
    const t = q('[data-recuperar-texto]');
    if (t) t.textContent = M.recuperar(k + 1, vis.length);
    recuperar.dataset.destino = String(destino);
    recuperar.hidden = false;
  }

  function abrir(p: Preset) {
    if (typeof hoja.showModal !== 'function') {
      aviso('Tu navegador no puede abrir el formulario. Escríbenos por WhatsApp.');
      return;
    }
    if (enviado) reiniciar();
    aplicarPreset(p);
    sincronizarLumbres();
    prepararFecha();
    revisarPronto();
    limpiarTodo();
    pintarRecuperar();
    moverAviso(true);
    abrirCapa();
    mostrar(0);
    document.dispatchEvent(new CustomEvent('al:hoja', { detail: { abierta: true } }));
  }

  hoja.addEventListener('close', () => {
    clearTimeout(relojAuto);
    if (!enviado) {
      if (recuperar.hidden) pasoGuardado = actual;
      guardar();
    }
    moverAviso(false);
    document.dispatchEvent(new CustomEvent('al:hoja', { detail: { abierta: false } }));
  });
  q('[data-cerrar]')?.addEventListener('click', () => hoja.close());
  atrasBtn.addEventListener('click', atras);

  document.addEventListener('click', (ev) => {
    const t = (ev.target as Element | null)?.closest<HTMLElement>('[data-abrir-hoja]');
    if (!t || hoja.contains(t)) return;
    ev.preventDefault();
    let preset: Preset = {};
    try { preset = JSON.parse(t.dataset.preset || '{}'); } catch { preset = {}; }
    abrir(preset);
  });

  q('[data-recuperar-seguir]')?.addEventListener('click', () => {
    const destino = Number(recuperar.dataset.destino) || 0;
    recuperar.hidden = true;
    mostrar(destino, 1);
  });
  q('[data-recuperar-nuevo]')?.addEventListener('click', () => {
    reiniciar();
    aplicarPreset(presetActual);
    sincronizarLumbres();
    recuperar.hidden = true;
    mostrar(0);
    aviso('Empezamos de nuevo.');
  });

  // ---------- eventos del formulario ----------
  formulario.addEventListener('pointerdown', () => (ultimoPuntero = Date.now()), true);
  formulario.addEventListener('change', (ev) => {
    const t = ev.target as HTMLInputElement;
    if (!t.name) return;
    limpiarError(t.name);
    if (t.name === 'fecha_estado') ['fecha', 'fecha_mes'].forEach(limpiarError);
    revelar(true);
    if (t.name === 'fecha' || t.name === 'fecha_estado') revisarPronto();
    if (t.name === 'ocasion') {
      pintarInversion();
      // Auto-avance de 250 ms solo con toque o clic (WCAG 3.2.2: nunca al cambiar la opción con el teclado).
      if (Date.now() - ultimoPuntero < 1200 && PASOS[actual] === 'ocasion') {
        clearTimeout(relojAuto);
        relojAuto = window.setTimeout(() => {
          if (hoja.open && PASOS[actual] === 'ocasion' && valor('ocasion')) continuar();
        }, quieto() ? 0 : 250);
      }
    }
    if (t.name === 'invitados') pintarInversion();
    guardarPronto();
  });
  formulario.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement;
    if (t.name) limpiarError(t.name === 'wa_pais' ? 'wa_numero' : t.name);
    if (t.name === 'municipio') guardarPronto();
  });
  formulario.addEventListener('submit', (ev) => {
    ev.preventDefault();
    continuar();
  });
  qq('[data-continuar]').forEach((b) =>
    b.addEventListener('click', (ev) => {
      ev.preventDefault();
      continuar();
    }),
  );

  // Validación al salir del campo (sin robar el foco).
  const alSalir: Record<string, () => void> = {
    nombre: () => {
      const v = valor('nombre').trim();
      if (v && v.length < 2) marcarError({ grupo: 'nombre', mensaje: M.nombre }, false);
    },
    wa_numero: () => { revisarWa(true); },
    correo: () => {
      const v = valor('correo').trim();
      if (v && !correoValido(v)) marcarError({ grupo: 'correo', mensaje: M.correo }, false);
    },
    municipio: () => {
      const v = valor('municipio').trim();
      if (v && v.length < 2) marcarError({ grupo: 'municipio', mensaje: 'Escribe el municipio o la ciudad del evento.' }, false);
    },
  };
  formulario.addEventListener('focusout', (ev) => {
    const n = (ev.target as HTMLInputElement).name;
    alSalir[n]?.();
  });
  waInput.addEventListener('paste', () => setTimeout(() => revisarWa(false), 0));

  // Enter en los campos de texto: pasa al siguiente o continúa (con teclado en pantalla, el botón va en el flujo).
  const siguiente: Record<string, string | null> = { nombre: 'wa_numero', wa_numero: 'correo', correo: null, empresa: null, municipio: null };
  formulario.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLInputElement;
    if (ev.key !== 'Enter' || !(t instanceof HTMLInputElement) || !(t.name in siguiente)) return;
    ev.preventDefault();
    const sig = siguiente[t.name];
    const destino = sig ? (campo(sig) as HTMLInputElement | null) : null;
    if (destino && visibleCampo(sig!)) destino.focus();
    else {
      t.blur();
      continuar();
    }
  });

  // Con el teclado abierto, el campo enfocado queda al centro de lo visible.
  hoja.addEventListener('focusin', (ev) => {
    const t = ev.target as HTMLElement;
    const vv = window.visualViewport;
    if (!vv || !t.matches('input[type="text"], input[type="tel"], input[type="email"], input[type="number"]')) return;
    const centrar = () => {
      t.scrollIntoView({ block: 'center' });
      vv.removeEventListener('resize', centrar);
    };
    vv.addEventListener('resize', centrar);
    setTimeout(() => vv.removeEventListener('resize', centrar), 900);
  });

  // Menos de 10: "Cambiar el número"
  q('[data-cambiar-numero]')?.addEventListener('click', () => {
    poner('invitados', null);
    limpiarError('invitados');
    revelar();
    const primero = q<HTMLInputElement>('input[name="invitados"]');
    primero?.focus();
    primero?.scrollIntoView({ block: 'center', behavior: quieto() ? 'auto' : 'smooth' });
  });

  // Aviso de privacidad: segunda capa dentro de la hoja (no se sale del formulario ni se pierde lo escrito).
  q('[data-privacidad]')?.addEventListener('click', () => {
    if (!abrirPriv || !privDlg) return;
    abrirPriv();
    privDlg.querySelector<HTMLElement>('h3')?.focus();
  });
  q('[data-privacidad-cerrar]')?.addEventListener('click', () => privDlg?.close());

  // ---------- enviar (DEMO: no sale nada del navegador) ----------
  function enviar() {
    const d = leer();
    const r = puntuar(d);
    folio = nuevoFolio();
    mensaje = mensajeWhatsApp({
      folio,
      ocasion: d.ocasion,
      fecha: fechaDe(d),
      flexible: d.flexible,
      invitados: d.invitados,
      municipio: d.municipio || null,
      tipoLugar: d.lugar_estado === 'aun_no' ? null : d.tipo_lugar,
      lugarEstado: d.lugar_estado,
    });
    // Fuera del DEMO, aquí iría el guardado en el servidor ANTES del salto a WhatsApp (propuesta §7.1).
    enviado = true;
    borrarGuardado();
    pintarGracias(d, r);
    formulario.hidden = true;
    gracias.hidden = false;
    pintarProgreso(true);
    cuerpo.scrollTop = 0;
    q<HTMLElement>('#ml-gracias-h')?.focus({ preventScroll: true });
  }

  function pintarGracias(d: Datos, r: ReturnType<typeof puntuar>) {
    const lugar = [d.municipio, d.lugar_estado === 'aun_no' ? 'lugar por definir' : etiquetaTipo(d.tipo_lugar)].filter(Boolean).join(' · ');
    const filas: [string, string][] = [
      ['Folio', folio],
      ['Ocasión', etiquetaOcasion(d.ocasion)],
      ['Fecha', fechaDe(d) ? fechaCorta(fechaDe(d)) + (d.flexible ? ' (flexible)' : '') : 'Por definir'],
      ['Invitados', etiquetaBanda(d.invitados)],
      ['Lugar', lugar || '—'],
    ];
    const dl = q('[data-resumen]');
    if (dl) {
      dl.replaceChildren(
        ...filas.flatMap(([k, v]) => {
          const dt = document.createElement('dt');
          dt.textContent = k;
          const dd = document.createElement('dd');
          dd.textContent = v;
          if (k === 'Folio') dd.className = 'al-num ml-resumen__folio';
          return [dt, dd];
        }),
      );
    }
    const previa = q('[data-wa-previa]');
    if (previa) previa.textContent = mensaje;

    // Ficha del chef (solo DEMO): lo que llegaría por Telegram o correo (propuesta §7.6).
    if (!DEMO) return;
    const sug = r.formato ? formatoPorId(r.formato).nombre : '—';
    const zona = LUGAR.zonas.find((z) => z.id === d.zona);
    const zonaTxt = zona?.cubierta === true ? 'zona cubierta' : zona?.cubierta === false ? 'fuera de zona' : 'zona por confirmar';
    const lumbres = d.lumbres_pre.map((id) => LUMBRES.items.find((l) => l.id === id)?.nombre.toLowerCase()).filter(Boolean).join(', ') || '—';
    const wa = normalizarWa(d.wa_numero, d.wa_pais);
    const espacio = d.lugar_estado === 'aun_no' ? `lugar por definir${d.sugerir_lugares === 'si' ? ' · quiere sugerencias de lugares' : ''}` : (FUEGO[d.fuego ?? ''] ?? '—');
    const alertas = r.banderas.map((b) => TXT_BANDERA[b]).join(' · ') || '—';
    let origen = 'directo';
    try {
      const u = new URLSearchParams(location.search);
      origen = [u.get('utm_source'), u.get('utm_medium')].filter(Boolean).join('/') || 'directo';
    } catch { /* nada */ }
    const inApp = raiz.hasAttribute('data-inapp') ? ' · in_app: sí' : '';
    const lineas = [
      `NUEVO · ${folio} · NIVEL ${r.nivel} · v${OFERTA.version} · ${ahoraFicha()}`,
      `${etiquetaOcasion(d.ocasion)} · ${fechaFicha(d)} · ${etiquetaBanda(d.invitados)} invitados`,
      `Lugar: ${ESTADO_LUGAR[d.lugar_estado ?? ''] ?? '—'}${d.lugar_estado !== 'aun_no' && d.tipo_lugar ? ` · ${etiquetaTipo(d.tipo_lugar)}` : ''} · ${d.municipio || '—'} · ${etiquetaZona(d.zona)} (${zonaTxt})`,
      `Espacio y fuego: ${espacio} · Inversión: ${etiquetaInversion(d)}`,
      `Sugerido: ${sug}${r.revisionManual ? ' · REVISIÓN MANUAL (más de 300)' : ''}${d.formato_pre ? ` · Llegó desde: ${formatoPorId(d.formato_pre).nombre}` : ''} · Lumbres: ${lumbres} · Alertas: ${alertas}`,
      `Contacto: ${d.nombre} · ${telOculto(wa.e164, wa.n)}${d.correo ? ' · con correo' : ''}${d.empresa ? ` · ${d.empresa}` : ''} · Origen: ${origen}${inApp}`,
    ];
    const ficha = q('[data-ficha]');
    if (ficha) ficha.textContent = lineas.join('\n');
    const letra = q('[data-nivel]');
    if (letra) {
      letra.textContent = r.nivel;
      letra.dataset.nivel = r.nivel;
    }
    const desc = q('[data-nivel-desc]');
    if (desc) desc.textContent = `${TXT_NIVEL[r.nivel]}${r.llamada ? ' · llamada de 15 min' : ''}`;
    const razones: string[] = r.dudas.map((x) => TXT_DUDA(x, d));
    if (r.platicar) razones.push('Prefiere platicar la inversión');
    if (r.bajo) razones.push('La inversión queda por debajo del mínimo');
    if (!r.platicar && !r.evaluable) razones.push('Sin precios confirmados todavía, la inversión no se compara (pregunta 5)');
    if (r.revisionManual) razones.push('Más de 300 invitados: revisión manual, nivel máximo B');
    if (r.nivel === 'A' && !r.dudas.length) razones.unshift('Fecha con margen, zona cubierta y lugar con espacio para la lumbre');
    const ul = q('[data-nivel-razones]');
    if (ul) ul.replaceChildren(...razones.map((t) => Object.assign(document.createElement('li'), { textContent: t })));

    // Afina: lumbres prellenadas con los chips.
    qq<HTMLInputElement>('input[name="afina_lumbres"]').forEach((c) => (c.checked = d.lumbres_pre.includes(c.value)));
  }

  q('[data-wa-resumen]')?.addEventListener('click', () => {
    const href = waHref(mensaje); // se arma al tocar
    if (href) window.open(href, '_blank', 'noopener');
    else aviso(AVISO_WA_DEMO);
  });
  q('[data-copiar-folio]')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(folio);
      aviso(`Folio copiado: ${folio}`);
    } catch {
      aviso(`Tu folio es ${folio}. Mantenlo presionado en el resumen para copiarlo.`);
    }
  });
  q('[data-afina]')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    aviso('Demo: esto no se guarda. En la versión final se suma a tu folio y le llega al chef.');
  });
  q('[data-nueva]')?.addEventListener('click', () => {
    reiniciar();
    aplicarPreset({});
    sincronizarLumbres();
    mostrar(0);
    enfocarPaso();
  });
  q('[data-ir-noche]')?.addEventListener('click', async (ev) => {
    ev.preventDefault();
    await cerrarYEsperar(hoja);
    document.getElementById('una-noche')?.scrollIntoView({ behavior: quieto() ? 'auto' : 'smooth', block: 'start' });
  });

  // ---------- arranque ----------
  prepararFecha();
  restaurar();
  sincronizarLumbres();
  pintarLumbres(false);
  pintarAliado();
  revisarPronto();
  revelar();
  pintarProgreso();
}
