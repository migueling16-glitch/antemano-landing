/**
 * ALDO chef LUGO — guardado del cuestionario del chef.
 *
 *   const almacen = crearAlmacen({ url: SUPABASE_URL, key: SUPABASE_KEY, alEstado });
 *   almacen.leerLocal(token)                       → lo que hay en este teléfono (síncrono, para pintar ya)
 *   await almacen.leer(token)                      → local + remoto fusionados campo por campo
 *   almacen.guardar(token, respuestas)             → local al instante; remoto con espera de ~800 ms
 *   almacen.guardar(token, respuestas, { enviado: true })  → sube ya y marca el envío
 *
 * Siempre guarda en localStorage (clave por token; sin token, "vista-previa"). Si hay url y llave de Supabase
 * (llave PUBLICABLE: es pública por diseño), además llama por fetch a las funciones RPC de PostgREST:
 *   POST {url}/rest/v1/rpc/aldo_cuestionario_guardar  { p_token, p_respuestas, p_enviado }
 *   POST {url}/rest/v1/rpc/aldo_cuestionario_leer     { p_token }
 * Las tablas no se tocan directo (RLS sin políticas): ver supabase/esquema.sql.
 *
 * Fusión: cada respuesta lleva su hora de edición `t` (ms). Gana la más reciente, campo por campo, aquí y en el
 * servidor (aldo_cuestionario_fusionar). Así dos teléfonos no se pisan y una edición sin red no se pierde.
 * Sin red: queda en la cola (el registro local marcado `sucio`), reintenta con espera creciente y al volver la señal.
 *
 * Sin dependencias y sin tocar el DOM: se prueba en Node con fetch, storage y temporizador simulados.
 */

export interface Entrada {
  /** Valor: string (opción única, texto), string[] (múltiple), number, objeto de celdas (tabla) o null (borrado). */
  v: unknown;
  /** Dato extra por opción ("Otro: ____"). */
  d?: Record<string, string>;
  /** Hora de la edición (ms desde 1970). */
  t: number;
}
export type Respuestas = Record<string, Entrada>;

export interface Registro {
  v: 1;
  respuestas: Respuestas;
  /** Última edición local (ms, reloj del teléfono). */
  actualizado: number;
  /** Última versión remota conocida. */
  version: number;
  /** `actualizado` del servidor (ISO) la última vez que se sincronizó. */
  remoto: string | null;
  enviadoEn: string | null;
  /** Hay cambios que el servidor todavía no tiene. */
  sucio: boolean;
  /** Hay un "Enviar" pendiente de confirmar (0 = no; si no, la hora en que se pidió). */
  enviar: number;
}

export type EstadoGuardado =
  | 'local' // sin guardado remoto (vista previa, demo o enlace no reconocido): guardado en el teléfono
  | 'guardando'
  | 'guardado'
  | 'sin-conexion'
  | 'reintentando' // el servidor respondió con un error pasajero (5xx, 429)
  | 'error' // el servidor rechazó el guardado (4xx): no se reintenta hasta el siguiente cambio
  | 'token-invalido'
  | 'sin-almacen'; // el navegador no deja escribir en localStorage

export type ResultadoRemoto = 'ok' | 'desactivado' | 'desconocido' | 'sin-red' | 'error';

export interface InfoEstado {
  token: string | null;
  /** ms de la última confirmación del servidor (o null si nunca). */
  cuando?: number | null;
  /** false si la última escritura en localStorage falló. */
  local: boolean;
  status?: number;
  mensaje?: string;
}

export interface Lectura {
  respuestas: Respuestas;
  registro: Registro | null;
  remoto: ResultadoRemoto;
  enviadoEn: string | null;
}

type AlmacenLocal = Pick<Storage, 'getItem' | 'setItem'> & { removeItem?: (k: string) => void };

export interface OpcionesAlmacen {
  url?: string | null;
  key?: string | null;
  fetch?: typeof fetch;
  /** localStorage por omisión; null = solo memoria. */
  storage?: AlmacenLocal | null;
  prefijo?: string;
  /** Espera antes de subir (debounce). */
  esperaMs?: number;
  reintento?: { baseMs: number; maxMs: number };
  ahora?: () => number;
  azar?: () => number;
  enLinea?: () => boolean;
  temporizador?: { poner: (fn: () => void, ms: number) => unknown; quitar: (id: unknown) => void };
  alEstado?: (estado: EstadoGuardado, info: InfoEstado) => void;
}

export interface Almacen {
  /** true si hay url y llave: además del teléfono, se guarda en Supabase. */
  readonly remotoActivo: boolean;
  /** ¿Este token se sincroniza? (remoto activo, formato válido y el servidor no lo rechazó). */
  usaRemoto(token: string | null): boolean;
  leerLocal(token: string | null): Registro | null;
  leer(token: string | null): Promise<Lectura>;
  guardar(token: string | null, respuestas: Respuestas, opciones?: { enviado?: boolean }): Promise<{ local: boolean; remoto: ResultadoRemoto }>;
  /** Sube ya lo pendiente (al volver la red o al salir de la página con keepalive). */
  sincronizar(token: string | null, opciones?: { keepalive?: boolean }): Promise<ResultadoRemoto>;
}

/** Formato del token del enlace (?k=). El servidor exige lo mismo (20–128). */
export const tokenValido = (t: unknown): t is string => typeof t === 'string' && /^[A-Za-z0-9_-]{20,128}$/.test(t);

const CLAVE_PREVIA = 'vista-previa';

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const hora = (e: unknown): number => (esObjeto(e) && typeof e.t === 'number' && Number.isFinite(e.t) ? e.t : -Infinity);

/** Fusión campo por campo: gana la entrada con `t` mayor; en empate, la de `b` (el servidor). */
export function fusionar(a: Respuestas | null | undefined, b: Respuestas | null | undefined): Respuestas {
  const x = esObjeto(a) ? a : {};
  const y = esObjeto(b) ? b : {};
  const r: Respuestas = {};
  for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
    if (!(k in y)) r[k] = x[k];
    else if (!(k in x)) r[k] = y[k];
    else r[k] = hora(x[k]) > hora(y[k]) ? x[k] : y[k];
  }
  return r;
}

/** Igualdad profunda (el jsonb del servidor reordena las claves, así que no sirve comparar JSON.stringify). */
export function iguales(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => iguales(v, b[i]));
  }
  if (esObjeto(a) && esObjeto(b)) {
    const ka = Object.keys(a);
    if (ka.length !== Object.keys(b).length) return false;
    return ka.every((k) => k in b && iguales(a[k], b[k]));
  }
  return false;
}

function normalizar(x: unknown): Registro | null {
  if (!esObjeto(x) || !esObjeto(x.respuestas)) return null;
  return {
    v: 1,
    respuestas: x.respuestas as Respuestas,
    actualizado: typeof x.actualizado === 'number' ? x.actualizado : 0,
    version: typeof x.version === 'number' ? x.version : 0,
    remoto: typeof x.remoto === 'string' ? x.remoto : null,
    enviadoEn: typeof x.enviadoEn === 'string' ? x.enviadoEn : null,
    sucio: x.sucio === true,
    enviar: typeof x.enviar === 'number' ? x.enviar : 0,
  };
}

const vacio = (): Registro => ({ v: 1, respuestas: {}, actualizado: 0, version: 0, remoto: null, enviadoEn: null, sucio: false, enviar: 0 });

interface EstadoToken {
  reloj: unknown;
  enVuelo: Promise<ResultadoRemoto> | null;
  esperando: Array<(r: ResultadoRemoto) => void>;
  intentos: number;
  desconocido: boolean;
  local: boolean;
  cuando: number | null;
}

export function crearAlmacen(op: OpcionesAlmacen = {}): Almacen {
  const url = (op.url ?? '').trim().replace(/\/+$/, '');
  const key = (op.key ?? '').trim();
  const remotoActivo = Boolean(url && key);
  const fetchFn: typeof fetch | null = op.fetch ?? (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  const storage: AlmacenLocal | null =
    op.storage !== undefined
      ? op.storage
      : (() => {
          try {
            return globalThis.localStorage ?? null;
          } catch {
            return null; // Safari con cookies bloqueadas lanza al leer localStorage
          }
        })();
  const prefijo = op.prefijo ?? 'al-cuestionario:v1:';
  const esperaMs = op.esperaMs ?? 800;
  const { baseMs, maxMs } = op.reintento ?? { baseMs: 2000, maxMs: 60000 };
  const ahora = op.ahora ?? (() => Date.now());
  const azar = op.azar ?? Math.random;
  const enLinea = op.enLinea ?? (() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  const poner = op.temporizador?.poner ?? ((fn: () => void, ms: number) => setTimeout(fn, ms));
  const quitar = op.temporizador?.quitar ?? ((id: unknown) => clearTimeout(id as ReturnType<typeof setTimeout>));
  const alEstado = op.alEstado ?? (() => {});

  /** ¿Se puede escribir? (modo privado viejo, cuota llena o datos bloqueados → no) */
  const almacenOk = (() => {
    if (!storage) return false;
    try {
      const k = `${prefijo}__prueba`;
      storage.setItem(k, '1');
      storage.removeItem?.(k);
      return true;
    } catch {
      return false;
    }
  })();

  /** Copia en memoria: manda durante la sesión aunque localStorage falle. */
  const memoria = new Map<string, Registro>();
  const estados = new Map<string, EstadoToken>();
  const clave = (token: string | null) => prefijo + (token || CLAVE_PREVIA);

  function estadoDe(token: string | null): EstadoToken {
    const k = clave(token);
    let st = estados.get(k);
    if (!st) {
      st = { reloj: null, enVuelo: null, esperando: [], intentos: 0, desconocido: false, local: almacenOk, cuando: null };
      estados.set(k, st);
    }
    return st;
  }

  function emitir(token: string | null, estado: EstadoGuardado, extra: Partial<InfoEstado> = {}) {
    const st = estadoDe(token);
    try {
      alEstado(estado, { token, cuando: st.cuando, local: st.local, ...extra });
    } catch {
      /* un error en la UI no detiene el guardado */
    }
  }

  function leerLocal(token: string | null): Registro | null {
    const k = clave(token);
    const m = memoria.get(k);
    if (m) return m;
    if (!storage) return null;
    try {
      const s = storage.getItem(k);
      const r = s ? normalizar(JSON.parse(s)) : null;
      if (r) memoria.set(k, r);
      return r;
    } catch {
      return null;
    }
  }

  function escribir(token: string | null, r: Registro): boolean {
    const k = clave(token);
    memoria.set(k, r);
    let ok = false;
    if (storage) {
      try {
        storage.setItem(k, JSON.stringify(r));
        ok = true;
      } catch {
        ok = false; // lleno, modo privado o bloqueado
      }
    }
    estadoDe(token).local = ok;
    return ok;
  }

  const usaRemoto = (token: string | null) => remotoActivo && !!fetchFn && tokenValido(token) && !estadoDe(token).desconocido;

  function cabeceras(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json', apikey: key };
    // Llave legacy (JWT "eyJ…"): también en Authorization. Llave publicable (sb_publishable_…): solo en apikey;
    // Supabase rechaza un Bearer que no sea JWT y su gateway arma el Authorization del rol anon por su cuenta.
    if (key.startsWith('eyJ')) h.Authorization = `Bearer ${key}`;
    return h;
  }

  async function rpc(fn: string, cuerpo: unknown, keepalive = false): Promise<Response> {
    if (!enLinea()) throw new Error('sin-red');
    const body = JSON.stringify(cuerpo);
    return fetchFn!(`${url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: cabeceras(),
      body,
      cache: 'no-store',
      // keepalive solo al salir de la página y con cuerpos chicos (los navegadores lo limitan a 64 KB).
      keepalive: keepalive && body.length < 60000,
    });
  }

  async function mensajeDe(res: Response): Promise<string | undefined> {
    try {
      const j = await res.json();
      return esObjeto(j) && typeof j.message === 'string' ? j.message : undefined;
    } catch {
      return undefined;
    }
  }

  const fila = (j: unknown): Record<string, unknown> | null => {
    const f = Array.isArray(j) ? j[0] : j;
    return esObjeto(f) ? f : null;
  };

  const espera = (intento: number) => Math.round(Math.min(maxMs, baseMs * 2 ** intento) * (0.8 + 0.4 * azar()));

  function programar(token: string | null, ms: number) {
    const st = estadoDe(token);
    if (st.reloj !== null) quitar(st.reloj);
    st.reloj = poner(() => {
      st.reloj = null;
      void vaciar(token);
    }, ms);
  }

  /** Pide una subida. Se resuelve con el resultado del siguiente intento (no espera a los reintentos). */
  function solicitar(token: string | null, ms: number): Promise<ResultadoRemoto> {
    const st = estadoDe(token);
    return new Promise((res) => {
      st.esperando.push(res);
      if (!st.enVuelo) programar(token, ms); // si hay uno en vuelo, al terminar se vuelve a programar
    });
  }

  async function subir(token: string, keepalive: boolean): Promise<{ r: ResultadoRemoto; reintentar: boolean }> {
    const st = estadoDe(token);
    const reg = leerLocal(token);
    if (!reg || (!reg.sucio && !reg.enviar)) return { r: 'ok', reintentar: false };
    const foto = { actualizado: reg.actualizado, enviar: reg.enviar };
    emitir(token, 'guardando');
    let res: Response;
    try {
      res = await rpc('aldo_cuestionario_guardar', { p_token: token, p_respuestas: reg.respuestas, p_enviado: reg.enviar > 0 }, keepalive);
    } catch {
      emitir(token, 'sin-conexion');
      return { r: 'sin-red', reintentar: true };
    }
    if (!res.ok) {
      const mensaje = await mensajeDe(res);
      if (res.status >= 500 || res.status === 429 || res.status === 408) {
        emitir(token, 'reintentando', { status: res.status, mensaje });
        return { r: 'sin-red', reintentar: true };
      }
      emitir(token, 'error', { status: res.status, mensaje });
      return { r: 'error', reintentar: false };
    }
    let datos: unknown = null;
    try {
      datos = await res.json();
    } catch {
      /* cuerpo vacío = sin fila */
    }
    const f = fila(datos);
    if (!f) {
      // El servidor no tiene ese token (no está pre-registrado o se dio de baja): desde aquí, solo local.
      st.desconocido = true;
      emitir(token, 'token-invalido');
      return { r: 'desconocido', reintentar: false };
    }
    st.intentos = 0;
    st.cuando = ahora();
    const actual = leerLocal(token) ?? reg;
    const cambio = actual.actualizado !== foto.actualizado;
    escribir(token, {
      ...actual,
      version: typeof f.version === 'number' ? f.version : actual.version,
      remoto: typeof f.actualizado === 'string' ? f.actualizado : actual.remoto,
      enviadoEn: typeof f.enviado_en === 'string' ? f.enviado_en : actual.enviadoEn,
      // Si hubo ediciones mientras viajaba la petición, sigue sucio y se vuelve a subir.
      sucio: cambio ? actual.sucio : false,
      enviar: foto.enviar && actual.enviar === foto.enviar ? 0 : actual.enviar,
    });
    emitir(token, 'guardado');
    return { r: 'ok', reintentar: false };
  }

  async function vaciar(token: string | null, keepalive = false): Promise<ResultadoRemoto> {
    const st = estadoDe(token);
    if (st.enVuelo) return st.enVuelo;
    const lote = st.esperando.splice(0);
    let r: ResultadoRemoto = 'desactivado';
    let reintentar = false;
    if (usaRemoto(token)) {
      const p = subir(token as string, keepalive).then((x) => {
        reintentar = x.reintentar;
        return x.r;
      });
      st.enVuelo = p;
      r = await p;
      st.enVuelo = null;
    } else if (st.desconocido) {
      r = 'desconocido';
    }
    for (const f of lote) f(r);
    if (st.desconocido) {
      for (const f of st.esperando.splice(0)) f('desconocido');
      return r;
    }
    if (st.esperando.length) programar(token, esperaMs);
    else if (reintentar) programar(token, espera(st.intentos++));
    else if (r === 'ok') {
      const reg = leerLocal(token);
      if (reg && (reg.sucio || reg.enviar)) programar(token, 0);
    }
    return r;
  }

  async function leer(token: string | null): Promise<Lectura> {
    const st = estadoDe(token);
    const local = leerLocal(token);
    const base = { respuestas: local?.respuestas ?? {}, registro: local, enviadoEn: local?.enviadoEn ?? null };
    if (!usaRemoto(token)) {
      const remoto: ResultadoRemoto = st.desconocido || (remotoActivo && token && !tokenValido(token)) ? 'desconocido' : 'desactivado';
      emitir(token, st.local ? 'local' : 'sin-almacen');
      return { ...base, remoto };
    }
    let res: Response;
    try {
      res = await rpc('aldo_cuestionario_leer', { p_token: token });
    } catch {
      emitir(token, 'sin-conexion');
      if (local && (local.sucio || local.enviar)) void solicitar(token, espera(st.intentos++));
      return { ...base, remoto: 'sin-red' };
    }
    if (!res.ok) {
      const mensaje = await mensajeDe(res);
      const pasajero = res.status >= 500 || res.status === 429 || res.status === 408;
      emitir(token, pasajero ? 'reintentando' : 'error', { status: res.status, mensaje });
      if (pasajero && local && (local.sucio || local.enviar)) void solicitar(token, espera(st.intentos++));
      return { ...base, remoto: pasajero ? 'sin-red' : 'error' };
    }
    let datos: unknown = null;
    try {
      datos = await res.json();
    } catch {
      /* vacío */
    }
    const f = fila(datos);
    if (!f) {
      st.desconocido = true;
      emitir(token, 'token-invalido');
      return { ...base, remoto: 'desconocido' };
    }
    const remotas = esObjeto(f.respuestas) ? (f.respuestas as Respuestas) : {};
    const previo = leerLocal(token) ?? vacio(); // releer: pudo haber ediciones mientras llegaba la respuesta
    const fusion = fusionar(previo.respuestas, remotas);
    const pendiente = !iguales(fusion, remotas);
    const reg: Registro = {
      ...previo,
      respuestas: fusion,
      actualizado: iguales(fusion, previo.respuestas) ? previo.actualizado : Math.max(ahora(), previo.actualizado + 1),
      version: typeof f.version === 'number' ? f.version : previo.version,
      remoto: typeof f.actualizado === 'string' ? f.actualizado : null,
      enviadoEn: typeof f.enviado_en === 'string' ? f.enviado_en : previo.enviadoEn,
      sucio: pendiente,
    };
    escribir(token, reg);
    const t = typeof f.actualizado === 'string' ? Date.parse(f.actualizado) : NaN;
    st.cuando = Number.isFinite(t) ? t : st.cuando;
    if (reg.sucio || reg.enviar) void solicitar(token, 0);
    else emitir(token, 'guardado');
    return { respuestas: fusion, registro: reg, remoto: 'ok', enviadoEn: reg.enviadoEn };
  }

  function guardar(token: string | null, respuestas: Respuestas, opciones: { enviado?: boolean } = {}) {
    const previo = leerLocal(token) ?? vacio();
    const t = Math.max(ahora(), previo.actualizado + 1);
    const local = escribir(token, {
      ...previo,
      respuestas,
      actualizado: t,
      sucio: true,
      enviar: opciones.enviado ? t : previo.enviar,
    });
    if (!usaRemoto(token)) {
      emitir(token, local ? 'local' : 'sin-almacen');
      return Promise.resolve({ local, remoto: (estadoDe(token).desconocido ? 'desconocido' : 'desactivado') as ResultadoRemoto });
    }
    if (!local) emitir(token, 'sin-almacen');
    return solicitar(token, opciones.enviado ? 0 : esperaMs).then((remoto) => ({ local, remoto }));
  }

  function sincronizar(token: string | null, opciones: { keepalive?: boolean } = {}) {
    const st = estadoDe(token);
    if (st.reloj !== null) {
      quitar(st.reloj);
      st.reloj = null;
    }
    if (!usaRemoto(token)) return Promise.resolve<ResultadoRemoto>(st.desconocido ? 'desconocido' : 'desactivado');
    const reg = leerLocal(token);
    if (!reg || (!reg.sucio && !reg.enviar)) return Promise.resolve<ResultadoRemoto>('ok');
    return vaciar(token, opciones.keepalive);
  }

  return { remotoActivo, usaRemoto, leerLocal, leer, guardar, sincronizar };
}
