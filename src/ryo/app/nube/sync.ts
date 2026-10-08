/**
 * La app conectada al equipo real (Supabase), "local primero".
 *
 * Las pantallas no cambian: siguen leyendo y cambiando el Estado en el
 * teléfono, así todo es instantáneo y funciona sin red. Este módulo:
 *   1. Al entrar, carga de Supabase todo lo de la sucursal y lo convierte
 *      en Estado (tablas.ts).
 *   2. Después de cada cambio propio, calcula qué filas cambiaron, las pone
 *      en una cola guardada en el teléfono y las sube en orden (padres
 *      antes que hijos). Sin red, esperan; al volver, se suben solas.
 *   3. Escucha en vivo (Realtime) lo que cambian los demás y lo trae, sin
 *      perder lo que este teléfono todavía no sube.
 *   4. Sube las fotos de evidencia a Storage y las baja cuando otro
 *      teléfono las necesita.
 * Si el servidor rechaza un cambio (una regla de permisos), se avisa y se
 * vuelve a cargar lo que de verdad hay en la base.
 */
import { useSyncExternalStore } from 'react';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_LLAVE, URL_APP, hayNube } from './config';
import { TABLAS, aFilas, deFilas, diferencias, aplicar, vacias, type Filas, type Fila, type Operacion, type Tabla } from './tablas';
import { alCambiar, reemplazar, leerEstado, usarFuente, fuente, entrar, actualizar, avisar, VERSION } from '../estado';
import { leerFotoLocal, guardarFoto, usarFotosRemotas } from '../lib/fotos';

/* ═══ Lo que ve la interfaz ═══ */

export type EstadoNube = {
  fase: 'apagada' | 'conectando' | 'lista' | 'error';
  /** Cambios de este teléfono que todavía no llegan a la base. */
  pendientes: number;
  error?: string;
  /** Llegó por el enlace del correo: invitación (crear contraseña) o recuperación. */
  pideClave?: 'invitacion' | 'recuperacion';
};

let info: EstadoNube = { fase: 'apagada', pendientes: 0 };
const oyentes = new Set<() => void>();
const pon = (cambio: Partial<EstadoNube>) => { info = { ...info, ...cambio }; oyentes.forEach((o) => o()); };
export const useNube = () => useSyncExternalStore((f) => { oyentes.add(f); return () => oyentes.delete(f); }, () => info, () => info);

/* ═══ Cliente ═══ */

let cliente: SupabaseClient | null = null;
let sucursalId = '';
let personaId = '';
let canal: RealtimeChannel | null = null;

/** Lo último que se sabe de la base, tal cual (por tabla). */
let servidor: Filas = vacias();
/** Lo que la app tenía después del último cambio (forma de app), para calcular diferencias. */
let base: Filas = vacias();

const COLA = 'ryo-app:nube:cola';
const RECORDAR = 'ryo-app:nube:recordar';
let cola: Operacion[] = leerCola();

function leerCola(): Operacion[] {
  try { return JSON.parse(localStorage.getItem(COLA) ?? '[]'); } catch { return []; }
}
function guardarCola() {
  try { localStorage.setItem(COLA, JSON.stringify(cola)); } catch { /* sin espacio: sigue en memoria */ }
  pon({ pendientes: cola.length });
}

/** "Mantener la sesión en este teléfono": si no, la sesión vive solo mientras la pestaña esté abierta. */
const recordarSesion = () => { try { return localStorage.getItem(RECORDAR) !== 'no'; } catch { return true; } };
const almacenSesion = {
  getItem: (k: string) => { try { return localStorage.getItem(k) ?? sessionStorage.getItem(k); } catch { return null; } },
  setItem: (k: string, v: string) => {
    try {
      const [usa, quita] = recordarSesion() ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
      usa.setItem(k, v); quita.removeItem(k);
    } catch { /* sin almacenamiento */ }
  },
  removeItem: (k: string) => { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch { /* nada */ } },
};

async function obtenerCliente(): Promise<SupabaseClient> {
  if (cliente) return cliente;
  const { createClient } = await import('@supabase/supabase-js');
  cliente = createClient(SUPABASE_URL, SUPABASE_LLAVE, {
    auth: { storage: almacenSesion, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
  });
  return cliente;
}

/* ═══ Arranque ═══ */

let iniciada = false;

/** Se llama una vez al abrir la app. Si había sesión, reconecta; si llegó de un correo, pide contraseña. */
export async function iniciarNube() {
  if (!hayNube || iniciada) return;
  iniciada = true;
  // El enlace del correo trae la sesión en el hash (#access_token=…&type=invite).
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const llegada = hash.get('access_token') ? hash.get('type') : null;
  const c = await obtenerCliente();
  c.auth.onAuthStateChange((evento) => {
    if (evento === 'PASSWORD_RECOVERY') pon({ pideClave: 'recuperacion' });
  });
  const { data } = await c.auth.getSession();
  if (llegada) history.replaceState(null, '', `${location.pathname}#/inicio`);
  if (llegada === 'invite' || llegada === 'signup' || llegada === 'magiclink') pon({ pideClave: 'invitacion' });
  if (llegada === 'recovery') pon({ pideClave: 'recuperacion' });
  addEventListener('online', () => { vaciar(); subirFotos(); });
  if (data.session && (fuente() === 'nube' || llegada)) await conectar();
}

/** Entrar con correo y contraseña. Devuelve el error a mostrar, o null si entró. */
export async function entrarNube(correo: string, clave: string, recordar: boolean): Promise<string | null> {
  try { localStorage.setItem(RECORDAR, recordar ? 'si' : 'no'); } catch { /* nada */ }
  const c = await obtenerCliente();
  const { error } = await c.auth.signInWithPassword({ email: correo.trim().toLowerCase(), password: clave });
  if (error) {
    if (/invalid login/i.test(error.message)) return 'Correo o contraseña incorrectos.';
    if (/email not confirmed/i.test(error.message)) return 'Primero abre el enlace de la invitación que te llegó por correo.';
    if (!navigator.onLine || /fetch/i.test(error.message)) return 'Sin conexión. Para entrar la primera vez hace falta internet.';
    return error.message;
  }
  return conectar();
}

/** La demo: datos de ejemplo, solo en este teléfono. */
export function entrarDemo(usuarioId: string) {
  usarFuente('demo');
  entrar(usuarioId);
}

/** Crear contraseña (al aceptar la invitación) o cambiarla (al recuperarla). */
export async function crearClave(clave: string): Promise<string | null> {
  const c = await obtenerCliente();
  const { error } = await c.auth.updateUser({ password: clave });
  if (error) return /should be different/i.test(error.message) ? 'Usa una contraseña distinta a la anterior.' : error.message;
  pon({ pideClave: undefined });
  if (info.fase !== 'lista') return conectar();
  return null;
}

/** "¿Olvidaste tu contraseña?": manda el enlace por correo. */
export async function recuperarClave(correo: string): Promise<string | null> {
  const c = await obtenerCliente();
  const { error } = await c.auth.resetPasswordForEmail(correo.trim().toLowerCase(), { redirectTo: URL_APP });
  return error ? error.message : null;
}

/**
 * Manda el correo de invitación (lo hace la función "invitar" del servidor,
 * la única que usa la llave secreta). La persona ya debe estar dada de alta.
 */
export async function invitarNube(correo: string): Promise<string | null> {
  const c = await obtenerCliente();
  await vaciar(); // primero que la persona exista en la base
  const { error } = await c.functions.invoke('invitar', { body: { correo: correo.trim().toLowerCase(), redirectTo: URL_APP } });
  if (!error) return null;
  return 'La persona quedó dada de alta, pero el correo no salió. Revisa que la función "invitar" esté publicada en Supabase.';
}

export async function salirNube() {
  canal?.unsubscribe();
  canal = null;
  sucursalId = personaId = '';
  pon({ fase: 'apagada', error: undefined });
  const c = await obtenerCliente();
  await c.auth.signOut();
}

/* ═══ Conectar: quién soy y cargar todo ═══ */

async function conectar(): Promise<string | null> {
  const c = await obtenerCliente();
  pon({ fase: 'conectando', error: undefined });
  const { data: { user } } = await c.auth.getUser();
  if (!user) { pon({ fase: 'apagada' }); return 'La sesión venció. Vuelve a entrar.'; }

  const { data: yo, error } = await c.from('personas').select('id, sucursal_id').eq('auth_id', user.id).eq('activo', true).limit(1);
  if (error) { pon({ fase: 'error', error: error.message }); return 'No se pudo conectar con la base. Intenta de nuevo.'; }
  if (!yo?.length) {
    await c.auth.signOut();
    pon({ fase: 'apagada' });
    return 'Tu cuenta no tiene invitación en Ryo. Pídela a tu encargado.';
  }

  const cambioDePersona = personaId && personaId !== yo[0].id;
  sucursalId = yo[0].sucursal_id;
  personaId = yo[0].id;
  if (fuente() !== 'nube') usarFuente('nube');
  if (cambioDePersona) { cola = []; guardarCola(); }

  // Lo que había en el teléfono se ve de inmediato; la base lo actualiza enseguida.
  const cache = leerEstado();
  base = cache.sucursal.id === sucursalId ? aFilas(cache) : vacias();
  if (cache.sucursal.id !== sucursalId) { cola = []; guardarCola(); }
  servidor = vacias();

  try {
    await recargar();
  } catch (e) {
    pon({ fase: 'error', error: String(e) });
    return 'No se pudo cargar la información. Revisa la conexión.';
  }
  if (!leerEstado().usuarioId) reemplazar({ ...leerEstado(), usuarioId: personaId });
  escucharCambios();
  pon({ fase: 'lista', pendientes: cola.length });
  usarFotosRemotas(bajarFoto);
  vaciar();
  subirFotos();
  return null;
}

/* ═══ Bajar ═══ */

async function traer(c: SupabaseClient, tabla: string): Promise<Fila[]> {
  const filas: Fila[] = [];
  for (let desde = 0; ; desde += 1000) {
    let q = c.from(tabla).select('*');
    if (tabla === 'sucursales') q = q.eq('id', sucursalId);
    else if (tabla !== 'negocios') q = q.eq('sucursal_id', sucursalId);
    const { data, error } = await q.range(desde, desde + 999);
    if (error) throw new Error(`${tabla}: ${error.message}`);
    filas.push(...(data ?? []));
    if (!data || data.length < 1000) return filas;
  }
}

/** Trae tablas de la base y pone el Estado resultante (con lo pendiente de este teléfono encima). */
async function recargar(tablas: Tabla[] = TABLAS.map((t) => t.tabla)) {
  const c = await obtenerCliente();
  const traidas = await Promise.all(tablas.map(async (t) => [t, await traer(c, t)] as const));
  const nuevo = { ...servidor };
  for (const [t, filas] of traidas) nuevo[t] = filas;
  // Un barista ve sus ausencias con motivo y las del equipo sin él (para cubrir turnos).
  if (tablas.includes('ausencias')) {
    const propias = new Set(nuevo.ausencias.map((a) => a.id));
    const equipo = await traer(c, 'ausencias_equipo');
    nuevo.ausencias = [...nuevo.ausencias, ...equipo.filter((a) => !propias.has(a.id)).map((a) => ({ ...a, motivo: '' }))];
  }
  servidor = nuevo;
  const actual = leerEstado();
  const estado = deFilas(aplicar(servidor, cola), {
    v: VERSION, usuarioId: actual.usuarioId ?? personaId, recordar: actual.recordar, tema: actual.tema, letra: actual.letra,
  });
  base = aFilas(estado);
  reemplazar(estado);
}

/** En vivo: cuando otro teléfono cambia algo, se trae esa tabla (agrupado, medio segundo). */
function escucharCambios() {
  if (!cliente || canal) return;
  const porTraer = new Set<Tabla>();
  let reloj: ReturnType<typeof setTimeout> | null = null;
  const pedir = (t: Tabla) => {
    porTraer.add(t);
    if (reloj) clearTimeout(reloj);
    reloj = setTimeout(() => {
      const ts = [...porTraer];
      porTraer.clear();
      recargar(ts).catch(() => { /* se reintenta con el siguiente cambio */ });
    }, 500);
  };
  canal = cliente.channel(`ryo-${sucursalId}`);
  for (const { tabla } of TABLAS) {
    if (tabla === 'negocios' || tabla === 'sucursales') continue;
    canal.on('postgres_changes', { event: '*', schema: 'public', table: tabla, filter: `sucursal_id=eq.${sucursalId}` }, () => pedir(tabla));
  }
  canal.subscribe();
}

/* ═══ Subir ═══ */

if (hayNube) {
  alCambiar((antes, despues) => {
    if (fuente() !== 'nube' || !sucursalId) return;
    if (antes.usuarioId && !despues.usuarioId) { salirNube(); return; }
    const nuevas = aFilas(despues);
    const ops = diferencias(base, nuevas);
    base = nuevas;
    if (!ops.length) return;
    cola.push(...ops);
    guardarCola();
    vaciar();
  });
}

const LLAVES = Object.fromEntries(TABLAS.map((t) => [t.tabla, t.llave.join(',')])) as Record<Tabla, string>;
const esDeRed = (error: { message?: string; code?: string }) =>
  !navigator.onLine || /fetch|network|timeout|Failed/i.test(error.message ?? '') || !error.code;

let vaciando = false;

/** Sube la cola en orden. Junta las filas seguidas de la misma tabla en una sola petición. */
async function vaciar() {
  if (vaciando || !cola.length || !sucursalId || !navigator.onLine) return;
  vaciando = true;
  const c = await obtenerCliente();
  let subidas = 0;
  try {
    while (cola.length) {
      const primera = cola[0];
      let n = 1;
      while (n < cola.length && n < 200 && cola[n].tipo === 'subir' && primera.tipo === 'subir' && cola[n].tabla === primera.tabla) n++;
      const lote = cola.slice(0, n);
      let error: { message: string; code?: string } | null = null;
      if (primera.tipo === 'subir') {
        ({ error } = await c.from(primera.tabla).upsert(lote.map((o) => (o as Extract<Operacion, { tipo: 'subir' }>).fila), { onConflict: LLAVES[primera.tabla] }));
      } else if (primera.tipo === 'borrar') {
        ({ error } = await c.from(primera.tabla).delete().match(primera.llave));
      } else {
        ({ error } = await c.from(primera.tabla).update({ retirado: true }).match(primera.llave));
      }
      if (error) {
        if (esDeRed(error)) break; // se reintenta al volver la red
        // La base lo rechazó (permisos o reglas): no se reintenta; se vuelve a lo real.
        cola.splice(0, n);
        guardarCola();
        avisar(`No se guardó un cambio: ${error.message.replace(/^.*?: /, '')}`);
        await recargar().catch(() => {});
        break;
      }
      cola.splice(0, n);
      subidas += n;
      guardarCola();
    }
  } finally {
    vaciando = false;
  }
  if (subidas && !cola.length && sinRedAntes) avisar(`Conexión de vuelta: ${subidas === 1 ? 'se subió 1 cambio' : `se subieron ${subidas} cambios`}.`);
  sinRedAntes = cola.length > 0 && !navigator.onLine;
}
let sinRedAntes = false;
if (typeof window !== 'undefined') addEventListener('offline', () => { sinRedAntes = true; });

/* ═══ Fotos ═══ */

const rutaFoto = (id: string) => `${sucursalId}/${id}.jpg`;

async function subirFotos() {
  if (!sucursalId || !navigator.onLine) return;
  const c = await obtenerCliente();
  const pendientes = Object.values(leerEstado().fotos).filter((f) => f.estado === 'pendiente' && f.por === personaId);
  let n = 0;
  for (const f of pendientes) {
    const blob = await leerFotoLocal(f.id);
    if (!blob) continue;
    const { error } = await c.storage.from('evidencias').upload(rutaFoto(f.id), blob, { upsert: true, contentType: blob.type || 'image/jpeg' });
    if (error) break;
    actualizar((e) => { if (e.fotos[f.id]) e.fotos[f.id].estado = 'subida'; });
    n++;
  }
  if (n) avisar(n === 1 ? 'Se subió 1 foto de evidencia.' : `Se subieron ${n} fotos de evidencia.`);
}

async function bajarFoto(id: string): Promise<Blob | undefined> {
  if (!sucursalId) return undefined;
  const c = await obtenerCliente();
  const { data } = await c.storage.from('evidencias').download(rutaFoto(id));
  if (data) await guardarFoto(id, data).catch(() => {});
  return data ?? undefined;
}
