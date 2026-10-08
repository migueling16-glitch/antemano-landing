/**
 * La app ↔ las tablas de Supabase.
 *
 * La app trabaja con un solo objeto (Estado, en estado.ts). La base guarda
 * ese mismo contenido en tablas con nombres y unidades explícitas (ver
 * supabase/migrations). Aquí se traduce en los dos sentidos:
 *   aFilas(estado)  → una lista de filas por tabla
 *   deFilas(filas)  → el Estado que entienden las pantallas
 * y diferencias(antes, después) dice qué filas subir o borrar después de
 * cada cambio. Es puro: no habla con la red, así se prueba sin base.
 */
import type {
  Estado, Usuario, Plantilla, ItemPlantilla, Ejecucion, Marca, FotoMeta, Equipo, Cafe, SesionCal, Shot,
  RecetaDelDia, TurnoTipo, Semana, CambioTurno, Ausencia, Notificacion, Incidencia, NotaBitacora, Progreso,
} from '../estado';
import { FRANJAS, type Franja } from '../lib/turnos';

export type Fila = Record<string, unknown>;

/**
 * Las tablas, de padres a hijos: así se suben (y al revés se borran) sin
 * romper llaves foráneas. `llave` = su llave primaria.
 */
export const TABLAS = [
  { tabla: 'negocios', llave: ['id'], soloLectura: true },
  { tabla: 'sucursales', llave: ['id'], soloLectura: true },
  { tabla: 'personas', llave: ['id'] },
  { tabla: 'plantillas', llave: ['id'] },
  { tabla: 'plantilla_items', llave: ['plantilla_id', 'id'], seRetira: true },
  { tabla: 'ejecuciones', llave: ['id'] },
  { tabla: 'marcas', llave: ['ejecucion_id', 'item_id'] },
  { tabla: 'fotos', llave: ['id'] },
  { tabla: 'equipos', llave: ['id'] },
  { tabla: 'botones', llave: ['equipo_id', 'id'] },
  { tabla: 'canastillas', llave: ['id'] },
  { tabla: 'cafes', llave: ['id'] },
  { tabla: 'sesiones_calibracion', llave: ['id'] },
  { tabla: 'shots', llave: ['id'] },
  { tabla: 'recetas_del_dia', llave: ['sucursal_id', 'jornada', 'cafe_id'] },
  { tabla: 'turnos_tipo', llave: ['id'] },
  { tabla: 'semanas', llave: ['sucursal_id', 'lunes'] },
  { tabla: 'asignaciones', llave: ['sucursal_id', 'persona_id', 'fecha'] },
  { tabla: 'disponibilidad', llave: ['persona_id', 'dia_semana'] },
  { tabla: 'cambios_turno', llave: ['id'] },
  { tabla: 'ausencias', llave: ['id'] },
  { tabla: 'notificaciones', llave: ['id'] },
  { tabla: 'incidencias', llave: ['id'] },
  { tabla: 'incidencia_seguimiento', llave: ['incidencia_id', 'numero'] },
  { tabla: 'bitacora', llave: ['id'] },
  { tabla: 'lecciones_completadas', llave: ['persona_id', 'leccion_id'] },
  { tabla: 'repasos', llave: ['persona_id', 'pregunta_id'] },
  { tabla: 'evaluaciones', llave: ['persona_id', 'nivel'] },
  { tabla: 'lecciones_asignadas', llave: ['persona_id', 'numero'] },
] as const satisfies readonly { tabla: string; llave: readonly string[]; soloLectura?: boolean; seRetira?: boolean }[];

export type Tabla = (typeof TABLAS)[number]['tabla'];
export type Filas = Record<Tabla, Fila[]>;

const DEF = Object.fromEntries(TABLAS.map((t) => [t.tabla, t])) as Record<Tabla, (typeof TABLAS)[number]>;

/** "u-ana" o "ej-p-apertura-2026-10-08|a1": la llave de una fila como texto. */
export const llaveDe = (tabla: Tabla, f: Fila) => DEF[tabla].llave.map((c) => String(f[c])).join('|');

/* ─── Conversiones ─── */

const iso = (ms?: number) => (ms == null ? null : new Date(ms).toISOString());
const ms = (v: unknown) => (v == null ? undefined : Date.parse(String(v)));
/** Postgres devuelve "07:30:00"; la app usa "07:30". */
const hm = (v: unknown) => String(v).slice(0, 5);
const num = (v: unknown) => (v == null ? undefined : Number(v));
const nulo = <T>(v: T | undefined) => (v === undefined ? null : v);
/** Quita lo que vale null/undefined: la app usa campos opcionales, no nulls. */
function opc<T extends object>(o: T): T {
  for (const k of Object.keys(o) as (keyof T)[]) if (o[k] === null || o[k] === undefined) delete o[k];
  return o;
}
const slug = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ═══ Estado → filas ═══ */

export function aFilas(e: Estado): Filas {
  const s = e.sucursal.id;
  const f = Object.fromEntries(TABLAS.map((t) => [t.tabla, [] as Fila[]])) as Filas;

  f.negocios.push({ id: slug(e.sucursal.negocio), nombre: e.sucursal.negocio });
  f.sucursales.push({ id: s, negocio_id: slug(e.sucursal.negocio), nombre: e.sucursal.nombre, apertura: e.sucursal.apertura, cierre: e.sucursal.cierre });

  for (const u of e.usuarios) {
    f.personas.push({
      id: u.id, sucursal_id: s, nombre: u.nombre, iniciales: u.iniciales, correo: u.correo.toLowerCase(), rol: u.rol,
      nivel: u.nivel, activo: u.activo, ingreso: u.ingreso, invitado: !!u.invitado,
    });
  }

  e.plantillas.forEach((p, orden) => {
    f.plantillas.push({
      id: p.id, sucursal_id: s, orden, nombre: p.nombre, descripcion: p.descripcion, frecuencia: p.frecuencia,
      dia_semana: nulo(p.dia), hora_limite: p.horaLimite, activa: p.activa,
    });
    p.items.forEach((i, ordenItem) => {
      f.plantilla_items.push({
        plantilla_id: p.id, id: i.id, sucursal_id: s, orden: ordenItem, seccion: i.seccion, texto: i.texto, tipo: i.tipo,
        critica: !!i.critica, minimo: nulo(i.min), maximo: nulo(i.max), unidad: nulo(i.unidad), paso: nulo(i.paso),
        inicial: nulo(i.inicial), foto: nulo(i.foto), retirado: false,
      });
    });
  });

  for (const x of e.ejecuciones) {
    f.ejecuciones.push({
      id: x.id, sucursal_id: s, plantilla_id: x.plantillaId, jornada: x.jornada, iniciada_por: x.iniciadaPor,
      iniciada_en: iso(x.iniciadaEn), completada_por: nulo(x.completadaPor), completada_en: iso(x.completadaEn),
      validada_por: nulo(x.validadaPor), validada_en: iso(x.validadaEn),
    });
    for (const [itemId, m] of Object.entries(x.marcas)) {
      f.marcas.push({
        ejecucion_id: x.id, item_id: itemId, sucursal_id: s, marcada_por: m.por, marcada_en: iso(m.en),
        valor: nulo(m.valor), texto: nulo(m.texto), foto_id: nulo(m.fotoId), fuera_de_rango: !!m.fuera, acciones: nulo(m.acciones),
      });
    }
  }

  for (const foto of Object.values(e.fotos)) {
    f.fotos.push({
      id: foto.id, sucursal_id: s, tomada_por: foto.por, tomada_en: iso(foto.en), bytes: foto.bytes,
      bytes_original: foto.bytesOriginal, estado: foto.estado,
    });
  }

  e.equipos.forEach((q, orden) => {
    const m = q.maquina;
    f.equipos.push({
      id: q.id, sucursal_id: s, orden, nombre: q.nombre, tipo: q.tipo, paso_molienda: nulo(q.paso), uso: nulo(q.uso),
      modelo: nulo(m?.modelo), detalle: nulo(m?.detalle), pid_c: nulo(m?.pid), g_por_pulso: nulo(m?.gPorPulso),
    });
    if (!m) return;
    m.botones.forEach((b, ordenBoton) => {
      const prog = m.programado[b.id];
      f.botones.push({
        equipo_id: q.id, id: b.id, sucursal_id: s, orden: ordenBoton, nombre: b.nombre, pulsos: nulo(m.pulsos[b.id]),
        programado_g: nulo(prog?.gramos), programado_en: iso(prog?.en), programado_por: nulo(prog?.por),
      });
    });
    m.canastillas.forEach((c, ordenCan) => {
      f.canastillas.push({ id: c.id, sucursal_id: s, equipo_id: q.id, orden: ordenCan, nombre: c.nombre, capacidad_g: c.gramos });
    });
  });

  e.cafes.forEach((c, orden) => {
    f.cafes.push({
      id: c.id, sucursal_id: s, orden, nombre: c.nombre, origen: c.origen, proceso: c.proceso, tostador: c.tostador,
      tueste: c.tueste || null, activo: c.activo, notas: c.notas, es_casa: !!c.casa, boton_id: c.boton, canastilla_id: nulo(c.canastilla),
      objetivo_dosis_g: c.objetivo.dosis, objetivo_rendimiento_g: c.objetivo.rendimiento, objetivo_tiempo_s: c.objetivo.tiempo,
      tolerancia_tiempo_s: c.objetivo.tolTiempo, tolerancia_ratio: c.objetivo.tolRatio,
    });
  });

  for (const x of e.sesiones) {
    f.sesiones_calibracion.push({
      id: x.id, sucursal_id: s, cafe_id: x.cafeId, molino_id: x.molinoId, boton_id: x.botonId, canastilla_id: nulo(x.canastillaId),
      calibrada_por: x.por, jornada: x.jornada, dias_reposo: x.diasReposo, inicio: iso(x.inicio), fin: iso(x.fin),
      shot_aprobado_id: nulo(x.aprobadoId),
    });
    for (const sh of x.shots) {
      f.shots.push({
        id: sh.id, sesion_id: x.id, sucursal_id: s, numero: sh.n, dosis_g: sh.dosis, rendimiento_g: sh.rendimiento,
        tiempo_s: sh.tiempo, molienda: sh.molienda, pulsos: nulo(sh.pulsos),
        previsto_tiempo_s: nulo(sh.previsto?.tiempo), previsto_rendimiento_g: nulo(sh.previsto?.rendimiento),
        sabor_acidez: nulo(sh.sabor?.x), sabor_intensidad: nulo(sh.sabor?.y), aprobado: !!sh.aprobado, hecho_en: iso(sh.en),
      });
    }
  }

  for (const porCafe of Object.values(e.recetasDelDia)) {
    for (const r of Object.values(porCafe)) {
      f.recetas_del_dia.push({
        sucursal_id: s, jornada: r.jornada, cafe_id: r.cafeId, sesion_id: r.sesionId, shot_id: r.shotId, aprobada_por: r.por,
        aprobada_en: iso(r.en), boton_id: r.botonId, canastilla_id: nulo(r.canastillaId), dosis_g: r.dosis,
        rendimiento_g: r.rendimiento, tiempo_s: r.tiempo, molienda: r.molienda, pulsos: nulo(r.pulsos),
      });
    }
  }

  e.turnosTipo.forEach((t, orden) => {
    f.turnos_tipo.push({ id: t.id, sucursal_id: s, orden, nombre: t.nombre, corto: t.corto, inicio: t.inicio, fin: t.fin });
  });

  for (const w of e.semanas) {
    f.semanas.push({ sucursal_id: s, lunes: w.id, estado: w.estado, publicada_en: iso(w.publicadaEn) });
    for (const [clave, turnoId] of Object.entries(w.turnos)) {
      const [personaId, fecha] = clave.split('|');
      f.asignaciones.push({ sucursal_id: s, persona_id: personaId, fecha, lunes: w.id, turno_tipo_id: turnoId });
    }
  }

  for (const [personaId, dias] of Object.entries(e.disponibilidad)) {
    dias.forEach((franjas, dia) => f.disponibilidad.push({ sucursal_id: s, persona_id: personaId, dia_semana: dia, franjas: [...franjas] }));
  }

  for (const c of e.cambios) {
    f.cambios_turno.push({
      id: c.id, sucursal_id: s, pedido_por: c.de, fecha: c.fecha, turno_tipo_id: c.turnoId, motivo: c.motivo, para: nulo(c.para),
      a_cambio_fecha: nulo(c.aCambio?.fecha), a_cambio_turno_tipo_id: nulo(c.aCambio?.turnoId), aceptado_por: nulo(c.acepta),
      estado: c.estado, pedido_en: iso(c.en), aceptado_en: iso(c.aceptadoEn), resuelto_en: iso(c.resueltoEn),
    });
  }

  for (const a of e.ausencias) {
    f.ausencias.push({
      id: a.id, sucursal_id: s, persona_id: a.usuarioId, desde: a.desde, hasta: a.hasta, tipo: a.tipo, motivo: a.motivo,
      estado: a.estado, pedida_en: iso(a.en), resuelta_por: nulo(a.resolvio),
    });
  }

  for (const n of e.notificaciones) {
    f.notificaciones.push({
      id: n.id, sucursal_id: s, para: n.para, de: nulo(n.de), texto: n.texto, ruta: nulo(n.ruta), enviada_en: iso(n.en), leida_por: [...n.leidaPor],
    });
  }

  for (const i of e.incidencias) {
    f.incidencias.push({
      id: i.id, sucursal_id: s, titulo: i.titulo, detalle: nulo(i.detalle), origen: i.origen, categoria: i.categoria,
      prioridad: i.prioridad, ejecucion_id: nulo(i.ejecucionId), item_id: nulo(i.itemId), abierta_por: i.abiertaPor,
      abierta_en: iso(i.abiertaEn), responsable: nulo(i.responsable), vence: nulo(i.vence), cerrada_por: nulo(i.cerradaPor),
      cerrada_en: iso(i.cerradaEn), cierre: nulo(i.cierre),
    });
    i.seguimiento.forEach((x, numero) => {
      f.incidencia_seguimiento.push({ incidencia_id: i.id, numero, sucursal_id: s, escrito_por: x.por, escrito_en: iso(x.en), texto: x.texto });
    });
  }

  for (const b of e.bitacora) {
    f.bitacora.push({
      id: b.id, sucursal_id: s, jornada: b.jornada, categoria: b.categoria, texto: b.texto, escrita_por: b.por,
      escrita_en: iso(b.en), fijada: !!b.fijada,
    });
  }

  for (const [personaId, p] of Object.entries(e.progreso)) {
    for (const [leccionId, en] of Object.entries(p.lecciones)) {
      f.lecciones_completadas.push({ persona_id: personaId, leccion_id: leccionId, sucursal_id: s, completada_en: iso(en) });
    }
    for (const [preguntaId, r] of Object.entries(p.repaso)) {
      f.repasos.push({ persona_id: personaId, pregunta_id: preguntaId, sucursal_id: s, intervalo: r.idx, proxima: r.proxima });
    }
    for (const [nivel, v] of Object.entries(p.evaluaciones)) {
      f.evaluaciones.push({ persona_id: personaId, nivel: Number(nivel), sucursal_id: s, firmada_por: v.por, firmada_en: iso(v.en), criterios: [...v.criterios] });
    }
    p.asignadas.forEach((a, numero) => {
      f.lecciones_asignadas.push({
        persona_id: personaId, numero, sucursal_id: s, leccion_id: a.leccionId, asignada_por: a.por, asignada_en: iso(a.en), motivo: a.motivo,
      });
    });
  }

  return f;
}

/* ═══ filas → Estado ═══ */

/** Lo que no viene de la base: es de este teléfono. */
export type Local = Pick<Estado, 'v' | 'usuarioId' | 'recordar' | 'tema' | 'letra'>;

const por = <T extends Fila>(xs: T[], k: string) => {
  const m = new Map<string, T[]>();
  for (const x of xs) { const v = String(x[k]); m.set(v, [...(m.get(v) ?? []), x]); }
  return m;
};
const ordenar = (xs: Fila[], k = 'orden') => [...xs].sort((a, b) => Number(a[k]) - Number(b[k]));

export function deFilas(f: Filas, local: Local): Estado {
  const suc = f.sucursales[0];
  const neg = f.negocios.find((n) => n.id === suc?.negocio_id);

  const itemsDe = por(f.plantilla_items.filter((i) => !i.retirado), 'plantilla_id');
  const marcasDe = por(f.marcas, 'ejecucion_id');
  const botonesDe = por(f.botones, 'equipo_id');
  const canastillasDe = por(f.canastillas, 'equipo_id');
  const shotsDe = por(f.shots, 'sesion_id');
  const asignDe = por(f.asignaciones, 'lunes');
  const segDe = por(f.incidencia_seguimiento, 'incidencia_id');

  const usuarios: Usuario[] = f.personas.map((p) => opc({
    id: String(p.id), nombre: String(p.nombre), iniciales: String(p.iniciales), correo: String(p.correo),
    rol: p.rol as Usuario['rol'], nivel: Number(p.nivel) as Usuario['nivel'], activo: !!p.activo, ingreso: String(p.ingreso),
    invitado: p.invitado ? true : undefined,
  }));

  const plantillas: Plantilla[] = ordenar(f.plantillas).map((p) => opc({
    id: String(p.id), nombre: String(p.nombre), descripcion: String(p.descripcion), frecuencia: p.frecuencia as Plantilla['frecuencia'],
    dia: num(p.dia_semana), horaLimite: hm(p.hora_limite), activa: !!p.activa,
    items: ordenar(itemsDe.get(String(p.id)) ?? []).map((i): ItemPlantilla => opc({
      id: String(i.id), seccion: String(i.seccion), texto: String(i.texto), tipo: i.tipo as ItemPlantilla['tipo'],
      critica: i.critica ? true : undefined, min: num(i.minimo), max: num(i.maximo), unidad: (i.unidad as string) ?? undefined,
      paso: num(i.paso), inicial: num(i.inicial), foto: (i.foto as ItemPlantilla['foto']) ?? undefined,
    })),
  }));

  const ejecuciones: Ejecucion[] = f.ejecuciones.map((x) => opc({
    id: String(x.id), plantillaId: String(x.plantilla_id), jornada: String(x.jornada), iniciadaPor: String(x.iniciada_por),
    iniciadaEn: ms(x.iniciada_en)!, completadaEn: ms(x.completada_en), completadaPor: (x.completada_por as string) ?? undefined,
    validadaPor: (x.validada_por as string) ?? undefined, validadaEn: ms(x.validada_en),
    marcas: Object.fromEntries((marcasDe.get(String(x.id)) ?? []).map((m) => [String(m.item_id), opc<Marca>({
      por: String(m.marcada_por), en: ms(m.marcada_en)!, valor: num(m.valor), texto: (m.texto as string) ?? undefined,
      fotoId: (m.foto_id as string) ?? undefined, fuera: m.fuera_de_rango ? true : undefined, acciones: (m.acciones as string[]) ?? undefined,
    })])),
  }));

  const fotos: Record<string, FotoMeta> = Object.fromEntries(f.fotos.map((x) => [String(x.id), {
    id: String(x.id), por: String(x.tomada_por), en: ms(x.tomada_en)!, bytes: Number(x.bytes), bytesOriginal: Number(x.bytes_original),
    estado: x.estado as FotoMeta['estado'],
  }]));

  const equipos: Equipo[] = ordenar(f.equipos).map((q) => {
    const base: Equipo = opc({
      id: String(q.id), nombre: String(q.nombre), tipo: q.tipo as Equipo['tipo'], paso: num(q.paso_molienda), uso: (q.uso as Equipo['uso']) ?? undefined,
    });
    if (q.tipo !== 'maquina') return base;
    const botones = ordenar(botonesDe.get(String(q.id)) ?? []);
    base.maquina = {
      modelo: String(q.modelo ?? ''), detalle: String(q.detalle ?? ''), pid: Number(q.pid_c), gPorPulso: Number(q.g_por_pulso),
      botones: botones.map((b) => ({ id: String(b.id), nombre: String(b.nombre) })),
      pulsos: Object.fromEntries(botones.filter((b) => b.pulsos != null).map((b) => [String(b.id), Number(b.pulsos)])),
      programado: Object.fromEntries(botones.filter((b) => b.programado_g != null).map((b) => [String(b.id), {
        gramos: Number(b.programado_g), en: ms(b.programado_en)!, por: String(b.programado_por),
      }])),
      canastillas: ordenar(canastillasDe.get(String(q.id)) ?? []).map((c) => ({ id: String(c.id), nombre: String(c.nombre), gramos: Number(c.capacidad_g) })),
    };
    return base;
  });

  const cafes: Cafe[] = ordenar(f.cafes).map((c) => opc({
    id: String(c.id), nombre: String(c.nombre), origen: String(c.origen), proceso: String(c.proceso), tostador: String(c.tostador),
    tueste: (c.tueste as string) ?? '', activo: !!c.activo, notas: String(c.notas), boton: String(c.boton_id ?? ''),
    casa: c.es_casa ? true : undefined, canastilla: (c.canastilla_id as string) ?? undefined,
    objetivo: {
      dosis: Number(c.objetivo_dosis_g), rendimiento: Number(c.objetivo_rendimiento_g), tiempo: Number(c.objetivo_tiempo_s),
      tolTiempo: Number(c.tolerancia_tiempo_s), tolRatio: Number(c.tolerancia_ratio),
    },
  }));

  const sesiones: SesionCal[] = f.sesiones_calibracion.map((x) => opc({
    id: String(x.id), cafeId: String(x.cafe_id), molinoId: String(x.molino_id), botonId: String(x.boton_id),
    canastillaId: (x.canastilla_id as string) ?? undefined, por: String(x.calibrada_por), jornada: String(x.jornada),
    diasReposo: Number(x.dias_reposo), inicio: ms(x.inicio)!, fin: ms(x.fin), aprobadoId: (x.shot_aprobado_id as string) ?? undefined,
    shots: ordenar(shotsDe.get(String(x.id)) ?? [], 'numero').map((sh): Shot => opc({
      id: String(sh.id), n: Number(sh.numero), dosis: Number(sh.dosis_g), rendimiento: Number(sh.rendimiento_g), tiempo: Number(sh.tiempo_s),
      molienda: Number(sh.molienda), pulsos: num(sh.pulsos),
      previsto: sh.previsto_tiempo_s != null ? { tiempo: Number(sh.previsto_tiempo_s), rendimiento: Number(sh.previsto_rendimiento_g) } : undefined,
      sabor: sh.sabor_acidez != null ? { x: Number(sh.sabor_acidez), y: Number(sh.sabor_intensidad) } : undefined,
      en: ms(sh.hecho_en)!, aprobado: sh.aprobado ? true : undefined,
    })),
  }));

  const recetasDelDia: Estado['recetasDelDia'] = {};
  for (const r of f.recetas_del_dia) {
    const j = String(r.jornada);
    recetasDelDia[j] ??= {};
    recetasDelDia[j][String(r.cafe_id)] = opc<RecetaDelDia>({
      jornada: j, cafeId: String(r.cafe_id), sesionId: String(r.sesion_id), shotId: String(r.shot_id), por: String(r.aprobada_por),
      en: ms(r.aprobada_en)!, botonId: String(r.boton_id), dosis: Number(r.dosis_g), rendimiento: Number(r.rendimiento_g),
      tiempo: Number(r.tiempo_s), molienda: Number(r.molienda), pulsos: num(r.pulsos), canastillaId: (r.canastilla_id as string) ?? undefined,
    });
  }

  const turnosTipo: TurnoTipo[] = ordenar(f.turnos_tipo).map((t) => ({
    id: String(t.id), nombre: String(t.nombre), corto: String(t.corto), inicio: hm(t.inicio), fin: hm(t.fin),
  }));

  const semanas: Semana[] = f.semanas.map((w) => opc({
    id: String(w.lunes), estado: w.estado as Semana['estado'], publicadaEn: ms(w.publicada_en),
    turnos: Object.fromEntries((asignDe.get(String(w.lunes)) ?? []).map((a) => [`${a.persona_id}|${a.fecha}`, String(a.turno_tipo_id)])),
  }));

  const disponibilidad: Estado['disponibilidad'] = {};
  for (const [personaId, filas] of por(f.disponibilidad, 'persona_id')) {
    const dias = Array.from({ length: 7 }, () => FRANJAS.map((x) => x.id) as Franja[]);
    for (const d of filas) dias[Number(d.dia_semana)] = [...(d.franjas as Franja[])];
    disponibilidad[personaId] = dias;
  }

  const cambios: CambioTurno[] = f.cambios_turno.map((c) => opc({
    id: String(c.id), de: String(c.pedido_por), fecha: String(c.fecha), turnoId: String(c.turno_tipo_id), motivo: String(c.motivo),
    para: (c.para as string) ?? undefined,
    aCambio: c.a_cambio_fecha != null ? { fecha: String(c.a_cambio_fecha), turnoId: String(c.a_cambio_turno_tipo_id) } : undefined,
    acepta: (c.aceptado_por as string) ?? undefined, estado: c.estado as CambioTurno['estado'], en: ms(c.pedido_en)!,
    aceptadoEn: ms(c.aceptado_en), resueltoEn: ms(c.resuelto_en),
  }));

  const ausencias: Ausencia[] = f.ausencias.map((a) => opc({
    id: String(a.id), usuarioId: String(a.persona_id), desde: String(a.desde), hasta: String(a.hasta), tipo: a.tipo as Ausencia['tipo'],
    motivo: String(a.motivo ?? ''), estado: a.estado as Ausencia['estado'], en: ms(a.pedida_en)!, resolvio: (a.resuelta_por as string) ?? undefined,
  }));

  const notificaciones: Notificacion[] = f.notificaciones.map((n) => opc({
    id: String(n.id), para: String(n.para), de: (n.de as string) ?? undefined, texto: String(n.texto), ruta: (n.ruta as string) ?? undefined,
    en: ms(n.enviada_en)!, leidaPor: [...((n.leida_por as string[]) ?? [])],
  }));

  const incidencias: Incidencia[] = f.incidencias.map((i) => opc({
    id: String(i.id), titulo: String(i.titulo), detalle: (i.detalle as string) ?? undefined, origen: i.origen as Incidencia['origen'],
    categoria: i.categoria as Incidencia['categoria'], prioridad: i.prioridad as Incidencia['prioridad'],
    ejecucionId: (i.ejecucion_id as string) ?? undefined, itemId: (i.item_id as string) ?? undefined, abiertaPor: String(i.abierta_por),
    abiertaEn: ms(i.abierta_en)!, responsable: (i.responsable as string) ?? undefined, vence: (i.vence as string) ?? undefined,
    seguimiento: ordenar(segDe.get(String(i.id)) ?? [], 'numero').map((x) => ({ por: String(x.escrito_por), en: ms(x.escrito_en)!, texto: String(x.texto) })),
    cerradaPor: (i.cerrada_por as string) ?? undefined, cerradaEn: ms(i.cerrada_en), cierre: (i.cierre as string) ?? undefined,
  }));

  const bitacora: NotaBitacora[] = f.bitacora.map((b) => opc({
    id: String(b.id), jornada: String(b.jornada), categoria: b.categoria as NotaBitacora['categoria'], texto: String(b.texto),
    por: String(b.escrita_por), en: ms(b.escrita_en)!, fijada: b.fijada ? true : undefined,
  }));

  // Cada persona tiene su progreso, aunque esté vacío.
  const progreso: Record<string, Progreso> = Object.fromEntries(usuarios.map((u) => [u.id, { lecciones: {}, repaso: {}, evaluaciones: {}, asignadas: [] }]));
  const de = (id: unknown) => (progreso[String(id)] ??= { lecciones: {}, repaso: {}, evaluaciones: {}, asignadas: [] });
  for (const l of f.lecciones_completadas) de(l.persona_id).lecciones[String(l.leccion_id)] = ms(l.completada_en)!;
  for (const r of f.repasos) de(r.persona_id).repaso[String(r.pregunta_id)] = { idx: Number(r.intervalo), proxima: String(r.proxima) };
  for (const v of f.evaluaciones) de(v.persona_id).evaluaciones[String(v.nivel)] = { por: String(v.firmada_por), en: ms(v.firmada_en)!, criterios: [...(v.criterios as boolean[])] };
  for (const a of ordenar(f.lecciones_asignadas, 'numero')) {
    de(a.persona_id).asignadas.push({ leccionId: String(a.leccion_id), por: String(a.asignada_por), en: ms(a.asignada_en)!, motivo: String(a.motivo) });
  }

  return {
    ...local,
    sucursal: {
      id: String(suc?.id ?? ''), negocio: String(neg?.nombre ?? ''), nombre: String(suc?.nombre ?? ''),
      apertura: suc?.apertura ? hm(suc.apertura) : '', cierre: suc?.cierre ? hm(suc.cierre) : '',
    },
    usuarios, plantillas, ejecuciones, fotos, equipos, cafes, sesiones, recetasDelDia, turnosTipo, semanas,
    disponibilidad, cambios, ausencias, notificaciones, progreso, incidencias, bitacora,
  };
}

/* ═══ Qué cambió ═══ */

export type Operacion =
  | { tabla: Tabla; tipo: 'subir'; fila: Fila }
  | { tabla: Tabla; tipo: 'borrar'; llave: Fila }
  | { tabla: Tabla; tipo: 'retirar'; llave: Fila };

/** JSON con las llaves en orden: dos filas iguales dan el mismo texto. */
const firma = (f: Fila) => JSON.stringify(Object.keys(f).sort().map((k) => [k, f[k]]));

/**
 * Las operaciones para llevar la base de "antes" a "después": filas nuevas o
 * cambiadas se suben (de padres a hijos) y las que ya no están se borran (de
 * hijos a padres). Las tareas de checklist no se borran: se retiran.
 */
export function diferencias(antes: Filas, despues: Filas): Operacion[] {
  const subir: Operacion[] = [];
  const borrar: Operacion[] = [];
  for (const def of TABLAS) {
    if ('soloLectura' in def && def.soloLectura) continue;
    const t = def.tabla;
    const previas = new Map(antes[t].map((f) => [llaveDe(t, f), f]));
    const nuevas = new Map(despues[t].map((f) => [llaveDe(t, f), f]));
    for (const [k, f] of nuevas) {
      const p = previas.get(k);
      if (!p || firma(p) !== firma(f)) subir.push({ tabla: t, tipo: 'subir', fila: f });
    }
    for (const [k, f] of previas) {
      if (nuevas.has(k)) continue;
      const llave = Object.fromEntries(def.llave.map((c) => [c, f[c]]));
      borrar.unshift({ tabla: t, tipo: 'seRetira' in def && def.seRetira ? 'retirar' : 'borrar', llave });
    }
  }
  return [...subir, ...borrar];
}

/** Aplica operaciones sobre filas (para no perder lo pendiente al recargar de la base). */
export function aplicar(f: Filas, ops: Operacion[]): Filas {
  const out = Object.fromEntries(TABLAS.map((t) => [t.tabla, [...f[t.tabla]]])) as Filas;
  for (const op of ops) {
    if (op.tipo === 'subir') {
      const k = llaveDe(op.tabla, op.fila);
      out[op.tabla] = [...out[op.tabla].filter((x) => llaveDe(op.tabla, x) !== k), op.fila];
    } else {
      const k = llaveDe(op.tabla, op.llave);
      out[op.tabla] = out[op.tabla].filter((x) => llaveDe(op.tabla, x) !== k);
    }
  }
  return out;
}

export const vacias = (): Filas => Object.fromEntries(TABLAS.map((t) => [t.tabla, [] as Fila[]])) as Filas;
