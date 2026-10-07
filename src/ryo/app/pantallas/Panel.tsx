/**
 * Panel del encargado y del admin: decidir, ver cómo va y a quién apoyar.
 *
 * Ordenado por gestión por excepción (Stephen Few; NN/g, dashboards):
 * - Bandeja: solo lo que espera una decisión, con el botón ahí mismo y
 *   validación en lote para lo que está en orden (como Deputy, que aprueba
 *   desde el celular y en lote).
 * - Hoy en vivo: cómo va el día sin abrir cada pantalla.
 * - Indicadores: siete días contra los siete anteriores (como Toast), con
 *   barras del tamaño de una palabra (sparklines, Tufte). Sin pasteles ni
 *   velocímetros.
 * - Equipo: una fila por persona; lo que hay que mirar sale marcado.
 * - Herramientas: incidencias, bitácora, reporte, plantillas, horarios.
 */
import { useMemo, useState } from 'react';
import {
  useEstado, yo, usuario, puede, fueraDeRango, validarVarios, quitarValidacion, responderCambio, responderAusencia,
  plantilla as buscarPlantilla, recetaDe, avisar, vibrar, avisosDe,
  type Estado, type Ejecucion,
} from '../estado';
import { Sup, Seccion, Estado as Etq, Avatar, Vacio, Casilla, Pestanas, Pista, ir } from '../componentes';
import { LECCIONES, MODULOS, NIVELES } from '../contenido';
import {
  indicadores, veredicto, cumplimiento, porPersona, dias, tocaban, type Indicador, type FichaPersona,
} from '../lib/indicadores';
import { alertasDe, encajeDe, personasDe, tramosDe, horarioLocal, reloj, turnosDe, horasDe, type Movimiento } from '../lib/turnos';
import { jornadaDe, hora, cuando, fechaCorta, nombreDia, sumarDias, lunesDe, minutosAhora, diaCorto } from '../lib/tiempo';
import { resumen } from './Checklists';

const primer = (e: Estado, id?: string) => usuario(e, id)?.nombre.split(' ')[0] ?? 'Alguien';
const diaYNum = (f: string) => `${nombreDia(f).toLowerCase()} ${fechaCorta(f).split(' ').slice(1).join(' ')}`;
const ahoraEnJornada = () => (minutosAhora() < 300 ? minutosAhora() + 1440 : minutosAhora());

/* ═══ PIEZAS ══════════════════════════════════════════════ */

/**
 * Barras del tamaño de una palabra: un día por barra, el último lleno.
 * Lo que no tiene dato queda como una raya en la base.
 */
export function MiniBarras({ serie, alto = 26, ancho = 64 }: { serie: number[]; alto?: number; ancho?: number }) {
  const validos = serie.filter((v) => Number.isFinite(v));
  const max = Math.max(...validos, 0) || 1;
  const w = ancho / serie.length;
  return (
    <svg className="mini-barras" viewBox={`0 0 ${ancho} ${alto}`} width={ancho} height={alto} aria-hidden="true">
      {serie.map((v, i) => {
        const h = Number.isFinite(v) ? Math.max(2, (v / max) * (alto - 2)) : 1;
        const ultimo = i === serie.length - 1;
        return <rect key={i} x={i * w + 1} y={alto - h} width={w - 2} height={h} className={ultimo ? 'mb-ultima' : 'mb'} />;
      })}
    </svg>
  );
}

/** Barras grandes de varios días, con su día y su valor. */
export function BarrasDias({ js, serie, texto }: { js: string[]; serie: number[]; texto: (v: number) => string }) {
  const validos = serie.filter((v) => Number.isFinite(v));
  const max = Math.max(...validos, 0) || 1;
  return (
    <div className="barras-dias" role="img" aria-label={js.map((j, i) => `${diaYNum(j)}: ${Number.isFinite(serie[i]) ? texto(serie[i]) : 'sin datos'}`).join('; ')}>
      {js.map((j, i) => {
        const v = serie[i];
        return (
          <div key={j} className="bd-col" data-hoy={j === jornadaDe() ? 'si' : undefined}>
            <span className="bd-valor">{Number.isFinite(v) ? texto(v) : '–'}</span>
            <span className="bd-barra" style={{ height: `${Number.isFinite(v) ? Math.max(3, (v / max) * 100) : 0}%` }} />
            <span className="bd-dia">{diaCorto(j).slice(0, 2)}<br />{Number(j.slice(8))}</span>
          </div>
        );
      })}
    </div>
  );
}

/** "+5 pts que la semana pasada", con su estado. */
function Cambio({ i }: { i: Indicador }) {
  const v = veredicto(i);
  if (v === 'sin-datos') return <span className="fila-sub">Sin datos de la semana pasada</span>;
  const d = i.valor - i.antes;
  const num = Math.abs(d) < 10 ? Math.round(Math.abs(d) * 10) / 10 : Math.round(Math.abs(d));
  const txt = v === 'igual' ? 'igual que la semana pasada' : `${d > 0 ? '+' : '−'}${num}${i.unidadCambio ? ` ${i.unidadCambio}` : ''} vs. semana pasada`;
  return v === 'peor' ? <Etq alerta>{txt}</Etq> : v === 'mejor' ? <Etq fuerte>{txt}</Etq> : <Etq>{txt}</Etq>;
}

/* ═══ BANDEJA ═════════════════════════════════════════════ */

type Pendiente = { id: string; texto: string; detalle: string; ruta?: string; acciones?: { texto: string; lleno?: boolean; hacer: () => void }[] };

function bandejaDe(e: Estado): { enOrden: Ejecucion[]; resto: Pendiente[] } {
  const hoy = jornadaDe();
  const porValidar = e.ejecuciones.filter((x) => x.completadaEn && !x.validadaEn);
  const conAlgo = (x: Ejecucion) => fueraDeRango(x).length > 0 || e.incidencias.some((i) => i.ejecucionId === x.id && !i.cerradaEn);
  const enOrden = porValidar.filter((x) => !conAlgo(x));
  const resto: Pendiente[] = [];

  for (const x of porValidar.filter(conAlgo)) {
    resto.push({
      id: `val-${x.id}`, texto: `Revisar ${buscarPlantilla(e, x.plantillaId)?.nombre.toLowerCase()} de ${cuando(x.jornada).toLowerCase()}`,
      detalle: `${primer(e, x.completadaPor)} · trae una lectura fuera de rango`, ruta: `#/checklists/ej/${x.id}`,
    });
  }

  for (const c of e.cambios.filter((x) => x.estado === 'aceptado' && x.acepta)) {
    const movs: Movimiento[] = [
      { usuarioId: c.de, fecha: c.fecha, turnoId: null }, { usuarioId: c.acepta!, fecha: c.fecha, turnoId: c.turnoId },
      ...(c.aCambio ? [{ usuarioId: c.acepta!, fecha: c.aCambio.fecha, turnoId: null }, { usuarioId: c.de, fecha: c.aCambio.fecha, turnoId: c.aCambio.turnoId }] : []),
    ];
    const alertas = [...encajeDe(e, c.acepta!, movs).alertas, ...(c.aCambio ? encajeDe(e, c.de, movs).alertas : [])];
    resto.push({
      id: `cam-${c.id}`,
      texto: `${c.aCambio ? 'Intercambio' : 'Cambio'} de ${primer(e, c.de)} a ${primer(e, c.acepta)}`,
      detalle: `${diaYNum(c.fecha)} · ${alertas.length ? alertas[0].texto : 'sin alertas'}`,
      ruta: '#/horarios/cambios',
      acciones: alertas.length ? undefined : [
        { texto: 'Rechazar', hacer: () => { responderCambio(c.id, 'rechazar'); avisar('Cambio rechazado. Les avisamos.'); } },
        { texto: 'Aprobar', lleno: true, hacer: () => { responderCambio(c.id, 'aprobar'); vibrar([30, 60, 30]); avisar('Aprobado: el horario ya cambió.'); } },
      ],
    });
  }

  for (const a of e.ausencias.filter((x) => x.estado === 'pendiente')) {
    const choques = e.semanas.flatMap((s) => Object.keys(s.turnos).filter((k) => {
      const [uid, f] = k.split('|');
      return uid === a.usuarioId && f >= a.desde && f <= a.hasta;
    }));
    resto.push({
      id: `aus-${a.id}`,
      texto: `${primer(e, a.usuarioId)} pide ${a.tipo === 'vacaciones' ? 'vacaciones' : 'día libre'}`,
      detalle: `${a.desde === a.hasta ? diaYNum(a.desde) : `del ${fechaCorta(a.desde)} al ${fechaCorta(a.hasta)}`} · “${a.motivo}”${choques.length ? ` · ya tiene ${choques.length} turno${choques.length === 1 ? '' : 's'}` : ''}`,
      acciones: [
        { texto: 'No aprobar', hacer: () => { responderAusencia(a.id, 'rechazar'); avisar('Le avisamos que no se aprobó.'); } },
        { texto: 'Aprobar', lleno: true, hacer: () => { responderAusencia(a.id, 'aprobar'); vibrar([30, 60, 30]); avisar(choques.length ? 'Aprobado. Ajusta sus turnos: salen con alerta.' : 'Aprobado.'); } },
      ],
    });
  }

  for (const i of e.incidencias.filter((x) => !x.cerradaEn && (!x.responsable || (x.vence && x.vence < hoy)))) {
    resto.push({
      id: `inc-${i.id}`, texto: i.responsable ? `Vencida: ${i.titulo}` : `Sin responsable: ${i.titulo}`,
      detalle: `${i.prioridad === 'alta' ? 'Prioridad alta · ' : ''}abierta ${cuando(jornadaDe(i.abiertaEn)).toLowerCase()} por ${primer(e, i.abiertaPor)}`,
      ruta: `#/panel/incidencia/${i.id}`,
    });
  }

  for (const c of e.cambios.filter((x) => x.estado === 'abierto' && x.fecha >= hoy && x.fecha <= sumarDias(hoy, 2))) {
    resto.push({
      id: `abierto-${c.id}`, texto: `Nadie ha tomado el turno de ${primer(e, c.de)}`,
      detalle: `${diaYNum(c.fecha)} · ${c.para ? `se lo pidió a ${primer(e, c.para)}` : 'lo ve todo el equipo'}`, ruta: '#/horarios/cambios',
    });
  }

  const siguiente = e.semanas.find((s) => s.id === sumarDias(lunesDe(hoy), 7));
  if (siguiente && siguiente.estado !== 'publicada') {
    const n = alertasDe(e, siguiente.id).length;
    resto.push({
      id: 'semana', texto: `Publicar la semana del ${fechaCorta(siguiente.id)}`,
      detalle: `Está en borrador${n ? ` con ${n} cosa${n === 1 ? '' : 's'} por revisar` : ' y sin alertas'}`, ruta: `#/horarios/semana/${siguiente.id}`,
    });
  }

  for (const u of e.usuarios.filter((x) => x.activo && x.rol === 'barista' && x.nivel < 3)) {
    const mods = MODULOS.filter((m) => m.nivel === u.nivel).map((m) => m.id);
    const todas = LECCIONES.filter((l) => mods.includes(l.moduloId));
    const p = e.progreso[u.id];
    if (todas.length && todas.every((l) => p?.lecciones[l.id]) && !p?.evaluaciones[u.nivel]) {
      resto.push({ id: `eval-${u.id}`, texto: `${primer(e, u.id)} está listo para su evaluación`, detalle: `Terminó las lecciones de Barista ${u.nivel}`, ruta: `#/aprender/evaluar/${u.id}` });
    }
  }
  return { enOrden, resto };
}

/** Cuántas decisiones esperan al encargado (para Inicio y la pestaña). */
export function porDecidir(e: Estado) {
  const { enOrden, resto } = bandejaDe(e);
  return (enOrden.length ? 1 : 0) + resto.length;
}

/* ═══ PANEL ═══════════════════════════════════════════════ */

export type VistaPanel = 'hoy' | 'datos' | 'equipo' | 'herramientas';

export function PanelInicio({ vista = 'hoy' }: { vista?: VistaPanel }) {
  const e = useEstado();
  const u = yo(e)!;
  const hoy = jornadaDe();
  const esAdmin = puede(e, 'admin');
  const { enOrden, resto } = bandejaDe(e);
  const inds = useMemo(() => indicadores(e, hoy), [e, hoy]);
  const equipo = useMemo(() => porPersona(e, hoy), [e, hoy]);
  const total = (enOrden.length ? 1 : 0) + resto.length;

  const validarEnOrden = () => {
    const ids = enOrden.map((x) => x.id);
    validarVarios(ids);
    vibrar([30, 60, 30]);
    avisar(`${ids.length} checklist${ids.length === 1 ? '' : 's'} validado${ids.length === 1 ? '' : 's'}.`, { etiqueta: 'Deshacer', hacer: () => quitarValidacion(ids) });
  };

  return (
    <>
      <Sup titulo="Panel" sub={`${nombreDia(hoy)} ${fechaCorta(hoy).split(' ').slice(1).join(' ')} · ${u.rol === 'admin' ? 'Admin' : 'Encargada'}: ${u.nombre.split(' ')[0]}`} />
      <main className="pant pila">
        <Pestanas etiqueta="Vista del Panel" activa={vista}
          onCambio={(v) => location.replace(v === 'hoy' ? '#/panel' : `#/panel/${v}`)}
          opciones={[
            { id: 'hoy', texto: 'Hoy', n: total },
            { id: 'datos', texto: 'Datos' },
            { id: 'equipo', texto: 'Equipo', n: equipo.filter((f) => f.ojo.length).length },
            { id: 'herramientas', texto: 'Más' },
          ]} />

        {vista === 'hoy' && <>
        <Pista id="panel">Aquí decides y supervisas. "Hoy" junta lo que espera tu decisión; en "Datos" ves cómo va la semana y en "Equipo", a cada persona.</Pista>
        <Seccion titulo="Por decidir" extra={total ? `${total}` : 'Al día'}>
          {total === 0 && <Vacio>Nada espera tu decisión. Buen trabajo.</Vacio>}
          {enOrden.length > 0 && (
            <div className="bloque inv decision">
              <span className="etq">Checklists en orden</span>
              <span className="subtitulo">{enOrden.length} listo{enOrden.length === 1 ? '' : 's'} para validar</span>
              <span className="cuerpo">
                {enOrden.map((x) => `${buscarPlantilla(e, x.plantillaId)?.nombre} de ${cuando(x.jornada).toLowerCase()} (${primer(e, x.completadaPor)})`).join(' · ')}.
                Completos y sin lecturas fuera de rango.
              </span>
              <button type="button" className="boton grande lleno" onClick={validarEnOrden}>Validar {enOrden.length === 1 ? 'el checklist' : `los ${enOrden.length}`}</button>
            </div>
          )}
          {resto.length > 0 && (
            <div className="lista">
              {resto.map((p) => (
                <div key={p.id} className="fila decision-fila">
                  <span className="fila-texto">
                    {p.ruta ? <a className="negrita decision-enlace" href={p.ruta}>{p.texto} →</a> : <span className="negrita">{p.texto}</span>}
                    <span className="fila-sub">{p.detalle}</span>
                    {p.acciones && (
                      <span className="rejilla-2 decision-acciones">
                        {p.acciones.map((a) => (
                          <button key={a.texto} type="button" className={`boton${a.lleno ? ' lleno' : ''}`} onClick={a.hacer}>{a.texto}</button>
                        ))}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Seccion>

        <HoyEnVivo e={e} hoy={hoy} />
        </>}

        {vista === 'datos' && <>
        <p className="meta">Los últimos 7 días contra los 7 anteriores. Toca uno para verlo día por día.</p>
        <Seccion titulo="Indicadores" extra="7 días">
          <div className="lista">
            {inds.map((i) => (
              <a key={i.id} className="fila indicador" href={`#/panel/indicador/${i.id}`}>
                <span className="fila-texto">
                  <span>{i.nombre}</span>
                  <Cambio i={i} />
                </span>
                <span className="ind-lado">
                  <span className="ind-valor">{Number.isFinite(i.valor) ? i.texto(i.valor) : '–'}</span>
                  <MiniBarras serie={i.serie} />
                </span>
              </a>
            ))}
          </div>
        </Seccion>

        </>}

        {vista === 'equipo' && (
        <Seccion titulo="Equipo" extra="Últimos 14 días">
          <div className="lista">
            {equipo.map((f) => <FilaPersona key={f.u.id} f={f} />)}
          </div>
        </Seccion>
        )}

        {vista === 'herramientas' && <>
        <Seccion titulo="Herramientas">
          <div className="lista">
            <a className="fila" href="#/panel/incidencias">
              <span className="fila-texto"><span>Incidencias</span><span className="fila-sub">{e.incidencias.filter((x) => !x.cerradaEn).length} abiertas · seguimiento y cierre</span></span>
            </a>
            <a className="fila" href="#/panel/bitacora">
              <span className="fila-texto"><span>Bitácora</span><span className="fila-sub">Notas entre encargados · {e.bitacora.filter((x) => x.jornada === hoy).length} hoy</span></span>
            </a>
            <a className="fila" href="#/panel/reporte">
              <span className="fila-texto"><span>Reporte de la semana</span><span className="fila-sub">Listo para copiar y mandar</span></span>
            </a>
            <a className="fila" href="#/horarios/semana">
              <span className="fila-texto"><span>Armar la semana</span><span className="fila-sub">Turnos, reglas y publicar</span></span>
            </a>
            <a className="fila" href="#/horarios/cambios">
              <span className="fila-texto"><span>Solicitudes</span><span className="fila-sub">Cambios de turno y días libres</span></span>
            </a>
            <a className="fila" href="#/admin/plantillas">
              <span className="fila-texto"><span>Plantillas de checklist</span><span className="fila-sub">Editar tareas, horarios y fotos</span></span>
            </a>
            <a className="fila" href="#/admin">
              <span className="fila-texto"><span>Administración</span><span className="fila-sub">{esAdmin ? 'Equipo, cafés, máquina y sucursal' : 'Cafés y máquina'}</span></span>
            </a>
          </div>
        </Seccion>

        <Seccion titulo="Lo tuyo">
          <div className="lista">
            <a className="fila" href="#/avisos">
              <span className="fila-texto"><span>Avisos</span><span className="fila-sub">{avisosDe(e, u.id).filter((n) => !n.leidaPor.includes(u.id)).length} sin leer</span></span>
            </a>
            <a className="fila" href="#/horarios"><span className="fila-texto"><span>Mi horario</span><span className="fila-sub">Turnos, disponibilidad y cambios</span></span></a>
            <a className="fila" href="#/aprender"><span className="fila-texto"><span>Aprender</span><span className="fila-sub">Lecciones y repaso</span></span></a>
            <a className="fila" href="#/mas"><span className="fila-texto"><span>Cuenta y ajustes</span><span className="fila-sub">Tamaño de letra, tema, ayuda, salir</span></span></a>
          </div>
        </Seccion>
        </>}
      </main>
    </>
  );
}

function FilaPersona({ f }: { f: FichaPersona }) {
  const nivel = f.u.rol === 'barista' ? `Barista ${f.u.nivel}` : f.u.rol === 'encargado' ? 'Encargada' : 'Admin';
  return (
    <a className="fila" href={`#/panel/persona/${f.u.id}`}>
      <Avatar texto={f.u.iniciales} />
      <span className="fila-texto">
        <span>{f.u.nombre}</span>
        <span className="fila-sub">
          {nivel} · {f.checklists} checklist{f.checklists === 1 ? '' : 's'}{Number.isFinite(f.aTiempo) ? ` (${Math.round(f.aTiempo)} % a tiempo)` : ''} · {f.horasSemana.toFixed(f.horasSemana % 1 ? 1 : 0)} h esta semana
        </span>
        {f.ojo.length > 0 && <Etq alerta>{f.ojo[0]}</Etq>}
      </span>
    </a>
  );
}

/** Cómo va el día sin abrir cada pantalla. */
function HoyEnVivo({ e, hoy }: { e: Estado; hoy: string }) {
  const semana = e.semanas.find((s) => s.id === lunesDe(hoy) && s.estado === 'publicada');
  const personas = personasDe(e, hoy, semana?.turnos ?? {});
  const ahora = ahoraEnJornada();
  const enBarra = personas.filter((p) => p.ini <= ahora && ahora < p.fin);
  const { ini, fin } = horarioLocal(e);
  const huecos = tramosDe(personas, ini, fin).filter((t) => t.n === 0 && t.fin > ahora);
  const cafes = e.cafes.filter((c) => c.activo);
  const abiertas = e.incidencias.filter((x) => !x.cerradaEn);
  const nota = e.bitacora.find((n) => n.fijada) ?? e.bitacora.find((n) => n.jornada === hoy);
  return (
    <Seccion consulta titulo="Hoy en vivo" extra={`${hora(Date.now())}`}>
      <div className="lista">
        {tocaban(e, hoy).map((p) => {
          const ej = e.ejecuciones.find((x) => x.plantillaId === p.id && x.jornada === hoy);
          const r = resumen(p, ej);
          return (
            <a key={p.id} className="fila" href={ej ? `#/checklists/ej/${ej.id}` : '#/checklists'}>
              <Casilla hecha={r.hecho} />
              <span className="fila-texto">
                <span>{p.nombre}</span>
                <span className="fila-sub">{r.hecho ? `${r.texto} · ${primer(e, ej?.completadaPor)}` : ej ? `${r.hechas} de ${r.total} · límite ${p.horaLimite}` : `Sin empezar · límite ${p.horaLimite}`}</span>
              </span>
              {r.atrasada && <Etq alerta>Atrasado</Etq>}
            </a>
          );
        })}
        <a className="fila" href="#/calibrar">
          <Casilla hecha={cafes.every((c) => recetaDe(e, hoy, c.id))} />
          <span className="fila-texto">
            <span>Recetas del día</span>
            <span className="fila-sub">{cafes.map((c) => { const r = recetaDe(e, hoy, c.id); return `${c.nombre.split(' · ')[0]} ${r ? hora(r.en) : 'pendiente'}`; }).join(' · ')}</span>
          </span>
        </a>
        <a className="fila" href="#/horarios">
          <span className="fila-texto">
            <span>En barra ahora</span>
            <span className="fila-sub">
              {enBarra.length ? enBarra.map((p) => `${primer(e, p.usuarioId)} hasta ${reloj(p.fin)}`).join(' · ') : 'Nadie en este momento'}
              {huecos.length ? ` · sin nadie de ${reloj(huecos[0].ini)} a ${reloj(huecos[0].fin)}` : ''}
            </span>
          </span>
          {huecos.length > 0 && <Etq alerta>Hueco</Etq>}
        </a>
        <a className="fila" href="#/panel/incidencias">
          <span className="fila-texto">
            <span>Incidencias abiertas</span>
            <span className="fila-sub">{abiertas.length ? abiertas.map((x) => x.titulo).slice(0, 2).join(' · ') : 'Ninguna'}</span>
          </span>
          {abiertas.some((x) => x.prioridad === 'alta') ? <Etq alerta>{abiertas.length}</Etq> : abiertas.length ? <Etq>{abiertas.length}</Etq> : null}
        </a>
      </div>
      {nota && (
        <a className="bloque bloque-toque nota-hoy" href="#/panel/bitacora" style={{ textDecoration: 'none' }}>
          <span className="etq">{nota.fijada ? 'Nota fijada' : 'Bitácora de hoy'} · {primer(e, nota.por)}</span>
          <span className="cuerpo">{nota.texto}</span>
        </a>
      )}
    </Seccion>
  );
}

/* ═══ DETALLE DE UN INDICADOR ═════════════════════════════ */

export function PanelIndicador({ id }: { id: string }) {
  const e = useEstado();
  const hoy = jornadaDe();
  const i = indicadores(e, hoy).find((x) => x.id === id);
  if (!i) return <><Sup titulo="Indicador" volver="panel" /><main className="pant"><Vacio>No encontrado.</Vacio></main></>;
  const js = dias(hoy, 14);
  // La serie de 14 días: la misma cuenta, día por día.
  const serie14 = [...indicadores(e, sumarDias(hoy, -7)).find((x) => x.id === id)!.serie, ...i.serie];

  return (
    <>
      <Sup titulo={i.nombre} sub={i.que} volver="panel/datos" />
      <main className="pant pila">
        <section className="bloque inv">
          <span className="etq">Últimos 7 días</span>
          <span className="num-l">{Number.isFinite(i.valor) ? i.texto(i.valor) : '–'}</span>
          <span className="cuerpo">Los 7 anteriores: {Number.isFinite(i.antes) ? i.texto(i.antes) : 'sin datos'}.</span>
          <Cambio i={i} />
        </section>
        <Seccion consulta titulo="Día por día" extra="14 días">
          <BarrasDias js={js} serie={serie14} texto={i.texto} />
        </Seccion>
        <Desglose e={e} id={id} hoy={hoy} />
      </main>
    </>
  );
}

function Desglose({ e, id, hoy }: { e: Estado; id: string; hoy: string }) {
  const js = dias(hoy, 14);
  if (id === 'a-tiempo') {
    const c = cumplimiento(e, js);
    const malos = c.filter((x) => x.estado === 'tarde' || x.estado === 'no-se-hizo').reverse();
    const porPlantilla = [...new Set(c.map((x) => x.plantilla.id))].map((pid) => {
      const de = c.filter((x) => x.plantilla.id === pid && x.estado !== 'pendiente');
      return { p: de[0]?.plantilla ?? buscarPlantilla(e, pid)!, pct: de.length ? (de.filter((x) => x.estado === 'a-tiempo').length / de.length) * 100 : NaN, n: de.length };
    });
    return (
      <>
        <Seccion titulo="Por checklist">
          <div className="lista">
            {porPlantilla.map(({ p, pct, n }) => (
              <div key={p.id} className="fila">
                <span className="fila-texto"><span>{p.nombre}</span><span className="fila-sub">{n} en 14 días · límite {p.horaLimite}</span></span>
                <span className="fila-der">{Number.isFinite(pct) ? `${Math.round(pct)} %` : '–'}</span>
              </div>
            ))}
          </div>
        </Seccion>
        <Seccion titulo="Tarde o sin hacer" extra={`${malos.length}`}>
          {malos.length ? (
            <div className="lista">
              {malos.map((x) => (
                <a key={`${x.jornada}-${x.plantilla.id}`} className="fila" href={x.ej ? `#/checklists/ej/${x.ej.id}` : '#/checklists/historial'}>
                  <span className="fila-texto">
                    <span>{x.plantilla.nombre} · {cuando(x.jornada)}</span>
                    <span className="fila-sub">{x.estado === 'tarde' ? `Terminó a las ${hora(x.ej!.completadaEn!)} (límite ${x.plantilla.horaLimite}) · ${primer(e, x.ej?.completadaPor)}` : 'No se completó'}</span>
                  </span>
                  {x.estado === 'no-se-hizo' ? <Etq alerta>Sin hacer</Etq> : <Etq>Tarde</Etq>}
                </a>
              ))}
            </div>
          ) : <Vacio>Todo a tiempo en 14 días.</Vacio>}
        </Seccion>
      </>
    );
  }
  if (id === 'validar') {
    const sin = e.ejecuciones.filter((x) => x.completadaEn && !x.validadaEn);
    const lentas = e.ejecuciones.filter((x) => js.includes(x.jornada) && x.validadaEn && x.completadaEn)
      .map((x) => ({ x, h: (x.validadaEn! - x.completadaEn!) / 3_600_000 })).sort((a, b) => b.h - a.h).slice(0, 5);
    return (
      <>
        <Seccion titulo="Sin validar" extra={`${sin.length}`}>
          {sin.length ? <div className="lista">{sin.map((x) => (
            <a key={x.id} className="fila" href={`#/checklists/ej/${x.id}`}>
              <span className="fila-texto"><span>{buscarPlantilla(e, x.plantillaId)?.nombre} · {cuando(x.jornada)}</span><span className="fila-sub">Completó {primer(e, x.completadaPor)} a las {hora(x.completadaEn!)}</span></span>
            </a>
          ))}</div> : <Vacio>Todo validado.</Vacio>}
        </Seccion>
        <Seccion titulo="Las que más tardaron">
          <div className="lista">{lentas.map(({ x, h }) => (
            <div key={x.id} className="fila">
              <span className="fila-texto"><span>{buscarPlantilla(e, x.plantillaId)?.nombre} · {cuando(x.jornada)}</span><span className="fila-sub">Validó {primer(e, x.validadaPor)}</span></span>
              <span className="fila-der">{h.toFixed(1)} h</span>
            </div>
          ))}</div>
          <p className="cuerpo">Validar pronto cierra el ciclo: quien hizo el checklist sabe que alguien lo revisó.</p>
        </Seccion>
      </>
    );
  }
  if (id === 'incidencias') {
    const lista = e.incidencias.filter((x) => js.includes(jornadaDe(x.abiertaEn)));
    const porCat = [...new Set(lista.map((x) => x.categoria))].map((c) => ({ c, n: lista.filter((x) => x.categoria === c).length })).sort((a, b) => b.n - a.n);
    const maxN = Math.max(...porCat.map((x) => x.n), 1);
    return (
      <>
        {porCat.length > 0 && (
          <Seccion titulo="Por tipo">
            <div className="barras-h">
              {porCat.map(({ c, n }) => (
                <div key={c} className="bh-fila"><span className="etq">{c}</span><span className="bh-barra" style={{ width: `${(n / maxN) * 100}%` }} /><span className="bh-n">{n}</span></div>
              ))}
            </div>
          </Seccion>
        )}
        <Seccion titulo="En 14 días" extra={`${lista.length}`}>
          {lista.length ? <div className="lista">{lista.map((x) => (
            <a key={x.id} className="fila" href={`#/panel/incidencia/${x.id}`}>
              <span className="fila-texto"><span>{x.titulo}</span><span className="fila-sub">{cuando(jornadaDe(x.abiertaEn))} · {primer(e, x.abiertaPor)}</span></span>
              {x.cerradaEn ? <Etq fuerte>Cerrada</Etq> : <Etq alerta>Abierta</Etq>}
            </a>
          ))}</div> : <Vacio>Sin incidencias.</Vacio>}
        </Seccion>
      </>
    );
  }
  if (id === 'shots') {
    const ses = e.sesiones.filter((s) => js.includes(s.jornada) && s.aprobadoId).sort((a, b) => b.inicio - a.inicio);
    return (
      <Seccion titulo="Calibraciones aprobadas" extra={`${ses.length}`}>
        <div className="lista">{ses.map((s) => (
          <a key={s.id} className="fila" href={`#/calibrar/sesion/${s.id}`}>
            <span className="fila-texto"><span>{e.cafes.find((c) => c.id === s.cafeId)?.nombre} · {cuando(s.jornada)}</span><span className="fila-sub">{primer(e, s.por)} · aprobada a las {hora(s.fin!)}</span></span>
            <span className="fila-der">{s.shots.length} shot{s.shots.length === 1 ? '' : 's'}</span>
          </a>
        ))}</div>
        <p className="cuerpo">Muchos shots por receta seguido puede ser café con más reposo, molino que se movió o alguien que necesita práctica.</p>
      </Seccion>
    );
  }
  if (id === 'huecos') {
    const conHueco = js.flatMap((j) => {
      const semana = e.semanas.find((s) => s.id === lunesDe(j) && s.estado === 'publicada');
      if (!semana) return [];
      const { ini, fin } = horarioLocal(e);
      return tramosDe(personasDe(e, j, semana.turnos), ini, fin).filter((t) => t.n === 0).map((t) => ({ j, t }));
    });
    return (
      <Seccion titulo="Huecos" extra={`${conHueco.length}`}>
        {conHueco.length ? <div className="lista">{conHueco.map(({ j, t }) => (
          <a key={`${j}-${t.ini}`} className="fila" href={`#/horarios/semana/${lunesDe(j)}`}>
            <span className="fila-texto"><span>{diaYNum(j)}</span><span className="fila-sub">Sin nadie de {reloj(t.ini)} a {reloj(t.fin)}</span></span>
          </a>
        ))}</div> : <Vacio>Todo el horario del local tuvo gente.</Vacio>}
      </Seccion>
    );
  }
  // repasos
  const gente = e.usuarios.filter((u) => u.activo && u.rol === 'barista').map((u) => {
    const qs = Object.values(e.progreso[u.id]?.repaso ?? {});
    return { u, total: qs.length, vencidos: qs.filter((q) => q.proxima < hoy).length };
  });
  return (
    <Seccion titulo="Por persona">
      <div className="lista">{gente.map(({ u, total, vencidos }) => (
        <a key={u.id} className="fila" href={`#/panel/persona/${u.id}`}>
          <span className="fila-texto"><span>{u.nombre}</span><span className="fila-sub">{total} preguntas · {vencidos} vencidas</span></span>
          {vencidos >= 3 ? <Etq alerta>Atrasado</Etq> : <Etq fuerte>Al día</Etq>}
        </a>
      ))}</div>
    </Seccion>
  );
}

/* ═══ FICHA DE UNA PERSONA ════════════════════════════════ */

export function PanelPersona({ id }: { id: string }) {
  const e = useEstado();
  const hoy = jornadaDe();
  const f = porPersona(e, hoy).find((x) => x.u.id === id);
  const [periodo] = useState(14);
  if (!f) return <><Sup titulo="Persona" volver="panel" /><main className="pant"><Vacio>No encontrada.</Vacio></main></>;
  const u = f.u;
  const js = dias(hoy, periodo);
  const c = cumplimiento(e, js).filter((x) => x.ej?.completadaPor === u.id && (x.estado === 'a-tiempo' || x.estado === 'tarde')).reverse();
  const lunes = lunesDe(hoy);
  const semana = e.semanas.find((s) => s.id === lunes && s.estado === 'publicada');
  const turnos = semana ? turnosDe(e, lunes, semana.turnos, u.id) : [];
  const p = e.progreso[u.id];
  const nivel = NIVELES.find((n) => n.nivel === u.nivel);
  const cifra = (n: string, t: string) => <div className="cifra"><span className="num-m">{n}</span><span className="etq">{t}</span></div>;

  return (
    <>
      <Sup titulo={u.nombre} sub={`${u.rol === 'barista' ? nivel?.nombre : u.rol === 'encargado' ? 'Encargada' : 'Admin'} · desde ${fechaCorta(u.ingreso)}`} volver="panel/equipo" />
      <main className="pant pila">
        {f.ojo.length > 0 && (
          <section className="bloque inv">
            <span className="etq">Para mirar</span>
            {f.ojo.map((x) => <span key={x} className="subtitulo">{x}</span>)}
          </section>
        )}
        <Seccion consulta titulo="Últimos 14 días">
          <div className="rejilla-3">
            {cifra(String(f.checklists), 'checklists')}
            {cifra(Number.isFinite(f.aTiempo) ? `${Math.round(f.aTiempo)} %` : '–', 'a tiempo')}
            {cifra(String(f.recetas), 'recetas')}
            {cifra(Number.isFinite(f.shotsPorReceta) ? f.shotsPorReceta.toFixed(1) : '–', 'shots / receta')}
            {cifra(String(f.reportes), 'reportes')}
            {cifra(String(f.lecciones), 'lecciones')}
          </div>
        </Seccion>

        <Seccion titulo="Esta semana" extra={`${horasDe(turnos).toFixed(1)} h`}>
          {turnos.length ? (
            <div className="lista">{turnos.map((t) => (
              <div key={t.fecha} className="fila">
                <span className="fila-texto"><span>{diaYNum(t.fecha)}</span><span className="fila-sub">{t.turno.nombre} · {t.turno.inicio}–{t.turno.fin}</span></span>
              </div>
            ))}</div>
          ) : <p className="cuerpo">Sin turnos publicados esta semana.</p>}
        </Seccion>

        <Seccion titulo="Capacitación" extra={u.rol === 'barista' ? nivel?.nombre : undefined}>
          <div className="lista">
            <div className="par"><span className="etq">Repasos vencidos</span><span>{f.repasosVencidos}</span></div>
            <div className="par"><span className="etq">Lecciones hechas</span><span>{Object.keys(p?.lecciones ?? {}).length} de {LECCIONES.length}</span></div>
            {p?.asignadas.map((a) => (
              <div key={a.leccionId} className="par"><span className="etq">Asignada</span><span>{LECCIONES.find((l) => l.id === a.leccionId)?.titulo} · “{a.motivo}”</span></div>
            ))}
          </div>
          {u.rol === 'barista' && <a className="boton grande" href={`#/aprender/evaluar/${u.id}`}>Evaluar o asignar lección</a>}
        </Seccion>

        <Seccion titulo="Sus checklists" extra={`${c.length}`}>
          {c.length ? (
            <div className="lista">{c.slice(0, 8).map((x) => (
              <a key={x.ej!.id} className="fila" href={`#/checklists/ej/${x.ej!.id}`}>
                <span className="fila-texto"><span>{x.plantilla.nombre} · {cuando(x.jornada)}</span><span className="fila-sub">Terminó a las {hora(x.ej!.completadaEn!)} · límite {x.plantilla.horaLimite}</span></span>
                {x.estado === 'tarde' ? <Etq>Tarde</Etq> : <Etq fuerte>A tiempo</Etq>}
              </a>
            ))}</div>
          ) : <p className="cuerpo">No completó checklists en estos días.</p>}
        </Seccion>
        <button type="button" className="enlace" onClick={() => ir('panel')}>Volver al Panel</button>
      </main>
    </>
  );
}
