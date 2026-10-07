/**
 * Herramientas del Panel: incidencias con acción correctiva, bitácora del
 * encargado y el reporte de la semana.
 *
 * - Incidencias: como las acciones de SafetyCulture o Crunchtime (Zenput),
 *   cada problema tiene responsable, fecha, seguimiento y un cierre que dice
 *   qué se hizo. Una lectura fuera de rango abre una sola.
 * - Bitácora: como el log book de 7shifts, notas por día y categoría que se
 *   pueden fijar y buscar, para pasarse el turno entre encargados.
 * - Reporte: el resumen de la semana listo para mandar.
 */
import { useMemo, useState } from 'react';
import {
  useEstado, yo, usuario, puede, reportarIncidencia, asignarIncidencia, comentarIncidencia, cerrarIncidencia,
  reabrirIncidencia, anotarBitacora, fijarNota, borrarNota, plantilla as buscarPlantilla, avisar, vibrar,
  type Estado, type Incidencia, type NotaBitacora,
} from '../estado';
import { Sup, Seccion, Estado as Etq, Hoja, Vacio, ir } from '../componentes';
import { indicadores, veredicto, porPersona } from '../lib/indicadores';
import { jornadaDe, hora, cuando, fechaCorta, sumarDias, lunesDe } from '../lib/tiempo';

const primer = (e: Estado, id?: string) => usuario(e, id)?.nombre.split(' ')[0] ?? 'Alguien';
const enfocar = (id: string) => {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el?.focus({ preventScroll: true });
};

/* ═══ REPORTAR (para todos) ═══════════════════════════════ */

const CATEGORIAS: [Incidencia['categoria'], string][] = [
  ['equipo', 'Equipo'], ['inocuidad', 'Inocuidad'], ['producto', 'Producto'], ['limpieza', 'Limpieza'], ['personal', 'Personal'], ['otro', 'Otro'],
];
const nombreCat = (c: Incidencia['categoria']) => CATEGORIAS.find((x) => x[0] === c)?.[1] ?? c;

/** Hoja para reportar un problema: la puede abrir cualquiera del equipo. */
export function ReportarIncidencia({ abierta, alCerrar }: { abierta: boolean; alCerrar: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [detalle, setDetalle] = useState('');
  const [categoria, setCategoria] = useState<Incidencia['categoria']>('equipo');
  const [alta, setAlta] = useState(false);
  const enviar = () => {
    if (titulo.trim().length < 3) { avisar('Escribe qué pasa, en pocas palabras.'); enfocar('inc-titulo'); return; }
    reportarIncidencia({ titulo: titulo.trim(), detalle: detalle.trim() || undefined, categoria, prioridad: alta ? 'alta' : 'normal' });
    vibrar(12);
    avisar('Reportado. El encargado ya lo ve en su Panel.');
    setTitulo(''); setDetalle(''); setAlta(false);
    alCerrar();
  };
  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} titulo="Reportar un problema">
      <label className="campo"><span className="etq">Qué pasa</span>
        <input id="inc-titulo" value={titulo} placeholder="Ej. gotea la llave del vaporizador" onChange={(ev) => setTitulo(ev.target.value)} />
      </label>
      <span className="etq">De qué tipo</span>
      <div className="chips">{CATEGORIAS.map(([c, t]) => (
        <button key={c} type="button" className="chip" aria-pressed={categoria === c} onClick={() => setCategoria(c)}>{t}</button>
      ))}</div>
      <label className="campo"><span className="etq">Detalle (opcional)</span>
        <textarea rows={3} value={detalle} placeholder="Desde cuándo, qué tan seguido, qué ya intentaste" onChange={(ev) => setDetalle(ev.target.value)} />
      </label>
      <button type="button" className="chip" aria-pressed={alta} onClick={() => setAlta(!alta)}>{alta ? 'Urgente: afecta el servicio o la inocuidad' : 'Marcar como urgente'}</button>
      <button type="button" className="boton grande lleno" onClick={enviar}>Reportar</button>
    </Hoja>
  );
}

/* ═══ INCIDENCIAS ═════════════════════════════════════════ */

function EtqIncidencia({ x }: { x: Incidencia }) {
  const hoy = jornadaDe();
  if (x.cerradaEn) return <Etq fuerte>Cerrada</Etq>;
  if (x.vence && x.vence < hoy) return <Etq alerta>Vencida</Etq>;
  if (!x.responsable) return <Etq alerta>Sin responsable</Etq>;
  if (x.prioridad === 'alta') return <Etq alerta>Urgente</Etq>;
  return <Etq>Abierta</Etq>;
}

export function PanelIncidencias() {
  const e = useEstado();
  const u = yo(e)!;
  const [filtro, setFiltro] = useState<'abiertas' | 'mias' | 'cerradas'>('abiertas');
  const [reportar, setReportar] = useState(false);
  const abiertas = e.incidencias.filter((x) => !x.cerradaEn);
  const lista = (filtro === 'abiertas' ? abiertas : filtro === 'mias' ? abiertas.filter((x) => x.responsable === u.id) : e.incidencias.filter((x) => x.cerradaEn))
    .sort((a, b) => (a.prioridad === b.prioridad ? b.abiertaEn - a.abiertaEn : a.prioridad === 'alta' ? -1 : 1));
  return (
    <>
      <Sup titulo="Incidencias" sub="Cada problema con responsable, fecha y cierre" volver="panel" accion={{ texto: 'Reportar', hacer: () => setReportar(true) }} />
      <main className="pant pila">
        <div className="chips" role="group" aria-label="Filtro">
          <button type="button" className="chip" aria-pressed={filtro === 'abiertas'} onClick={() => setFiltro('abiertas')}>Abiertas · {abiertas.length}</button>
          <button type="button" className="chip" aria-pressed={filtro === 'mias'} onClick={() => setFiltro('mias')}>A mi cargo · {abiertas.filter((x) => x.responsable === u.id).length}</button>
          <button type="button" className="chip" aria-pressed={filtro === 'cerradas'} onClick={() => setFiltro('cerradas')}>Cerradas</button>
        </div>
        {lista.length ? (
          <div className="lista">
            {lista.map((x) => (
              <a key={x.id} className="fila" href={`#/panel/incidencia/${x.id}`}>
                <span className="fila-texto">
                  <span>{x.titulo}</span>
                  <span className="fila-sub">
                    {nombreCat(x.categoria)} · {x.cerradaEn ? `cerró ${primer(e, x.cerradaPor)} ${cuando(jornadaDe(x.cerradaEn)).toLowerCase()}` : x.responsable ? `${primer(e, x.responsable)}${x.vence ? `, para el ${fechaCorta(x.vence)}` : ''}` : `reportó ${primer(e, x.abiertaPor)} ${cuando(jornadaDe(x.abiertaEn)).toLowerCase()}`}
                  </span>
                  <EtqIncidencia x={x} />
                </span>
              </a>
            ))}
          </div>
        ) : <Vacio>{filtro === 'cerradas' ? 'Todavía no se cierra ninguna.' : 'Nada abierto. Todo en orden.'}</Vacio>}
      </main>
      <ReportarIncidencia abierta={reportar} alCerrar={() => setReportar(false)} />
    </>
  );
}

export function PanelIncidencia({ id }: { id: string }) {
  const e = useEstado();
  const u = yo(e)!;
  const hoy = jornadaDe();
  const x = e.incidencias.find((i) => i.id === id);
  const [resp, setResp] = useState<string | undefined>(x?.responsable);
  const [vence, setVence] = useState<string>(x?.vence ?? hoy);
  const [nota, setNota] = useState('');
  const [cierre, setCierre] = useState('');
  if (!x) return <><Sup titulo="Incidencia" volver="panel/incidencias" /><main className="pant"><Vacio>No encontrada.</Vacio></main></>;
  const encargado = puede(e, 'encargado', 'admin');
  const puedeCerrar = encargado || x.responsable === u.id;
  const ej = x.ejecucionId ? e.ejecuciones.find((j) => j.id === x.ejecucionId) : undefined;
  const fechas: [string, string][] = [['Hoy', hoy], ['Mañana', sumarDias(hoy, 1)], ['En 3 días', sumarDias(hoy, 3)], ['En una semana', sumarDias(hoy, 7)]];

  const asignar = () => {
    if (!resp) { avisar('Elige quién se encarga.'); return; }
    asignarIncidencia(x.id, resp, vence);
    vibrar(12);
    avisar(resp === u.id ? 'Quedó a tu cargo.' : `Asignada a ${primer(e, resp)}. Le avisamos.`);
  };
  const cerrar = () => {
    if (cierre.trim().length < 4) { avisar('Escribe qué se hizo para resolverlo.'); enfocar('inc-cierre'); return; }
    cerrarIncidencia(x.id, cierre.trim());
    vibrar([30, 60, 30]);
    avisar('Incidencia cerrada.', { etiqueta: 'Deshacer', hacer: () => reabrirIncidencia(x.id) });
    setCierre('');
  };

  return (
    <>
      <Sup titulo="Incidencia" sub={`${nombreCat(x.categoria)} · ${x.origen === 'lectura' ? 'lectura fuera de rango' : 'reporte'}`} volver={encargado ? 'panel/incidencias' : 'inicio'} />
      <main className="pant pila">
        <section className={`bloque${!x.cerradaEn && x.prioridad === 'alta' ? ' inv' : ''}`}>
          <div className="fila-h entre"><span className="etq">Abrió {primer(e, x.abiertaPor)} · {cuando(jornadaDe(x.abiertaEn))} {hora(x.abiertaEn)}</span></div>
          <span className="subtitulo">{x.titulo}</span>
          {x.detalle && <span className="cuerpo">{x.detalle}</span>}
          <EtqIncidencia x={x} />
          {ej && <a className="enlace" href={`#/checklists/ej/${ej.id}`}>{buscarPlantilla(e, ej.plantillaId)?.nombre} de {cuando(ej.jornada).toLowerCase()}</a>}
        </section>

        {x.cerradaEn ? (
          <Seccion titulo="Cómo se resolvió" extra={`${primer(e, x.cerradaPor)} · ${cuando(jornadaDe(x.cerradaEn))}`}>
            <p className="cuerpo">{x.cierre}</p>
            {encargado && <button type="button" className="boton" onClick={() => { reabrirIncidencia(x.id); avisar('Reabierta.'); }}>Reabrir</button>}
          </Seccion>
        ) : (
          <>
            {encargado && (
              <Seccion titulo="1 · Quién y para cuándo" extra={x.responsable ? `Hoy: ${primer(e, x.responsable)}` : 'Sin responsable'}>
                <div className="chips">{e.usuarios.filter((p) => p.activo).map((p) => (
                  <button key={p.id} type="button" className="chip" aria-pressed={resp === p.id} onClick={() => { setResp(p.id); vibrar(6); }}>{p.id === u.id ? 'Yo' : p.nombre.split(' ')[0]}</button>
                ))}</div>
                <div className="chips">{fechas.map(([t, f]) => (
                  <button key={t} type="button" className="chip" aria-pressed={vence === f} onClick={() => { setVence(f); vibrar(6); }}>{t}</button>
                ))}</div>
                <button type="button" className="boton grande lleno" onClick={asignar}>
                  {resp ? `Asignar a ${resp === u.id ? 'mí' : primer(e, resp)} · ${fechaCorta(vence)}` : 'Elige quién se encarga'}
                </button>
              </Seccion>
            )}
            {puedeCerrar && (
              <Seccion titulo={encargado ? '2 · Cerrarla' : 'Cerrarla'}>
                <label className="campo"><span className="etq">Qué se hizo</span>
                  <textarea id="inc-cierre" rows={3} value={cierre} placeholder="Ej. el técnico cambió el empaque; el refri volvió a 3 °C" onChange={(ev) => setCierre(ev.target.value)} />
                </label>
                <button type="button" className="boton grande" onClick={cerrar}>Cerrar incidencia</button>
              </Seccion>
            )}
          </>
        )}

        <Seccion titulo="Seguimiento" extra={`${x.seguimiento.length}`}>
          {x.seguimiento.length ? (
            <ol className="pasos">{x.seguimiento.map((s, i) => (
              <li key={i}><span><strong className="negrita recta">{primer(e, s.por)}</strong> · {cuando(jornadaDe(s.en)).toLowerCase()} {hora(s.en)}<br />{s.texto}</span></li>
            ))}</ol>
          ) : <p className="cuerpo">Todavía sin notas.</p>}
          {!x.cerradaEn && (
            <>
              <label className="campo"><span className="etq">Agregar nota</span>
                <input id="inc-nota" value={nota} placeholder="Ej. el técnico viene el jueves" onChange={(ev) => setNota(ev.target.value)} />
              </label>
              <button type="button" className="boton" onClick={() => {
                if (!nota.trim()) { avisar('Escribe la nota.'); enfocar('inc-nota'); return; }
                comentarIncidencia(x.id, nota.trim()); setNota(''); vibrar(8);
              }}>Agregar al seguimiento</button>
            </>
          )}
        </Seccion>
      </main>
    </>
  );
}

/* ═══ BITÁCORA ════════════════════════════════════════════ */

const CATS_NOTA: [NotaBitacora['categoria'], string][] = [
  ['turno', 'Turno'], ['equipo', 'Equipo'], ['producto', 'Producto'], ['personal', 'Personal'], ['clientes', 'Clientes'], ['otro', 'Otro'],
];
const nombreCatNota = (c: NotaBitacora['categoria']) => CATS_NOTA.find((x) => x[0] === c)?.[1] ?? c;

export function PanelBitacora() {
  const e = useEstado();
  const u = yo(e)!;
  const [cat, setCat] = useState<NotaBitacora['categoria']>('turno');
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState<NotaBitacora['categoria'] | 'todas'>('todas');
  const [q, setQ] = useState('');
  const [borrar, setBorrar] = useState<string | null>(null);
  const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const lista = e.bitacora.filter((n) => (filtro === 'todas' || n.categoria === filtro) && norm(n.texto).includes(norm(q.trim())));
  const fijadas = lista.filter((n) => n.fijada);
  const dias = [...new Set(lista.filter((n) => !n.fijada).map((n) => n.jornada))];

  const guardar = () => {
    if (texto.trim().length < 3) { avisar('Escribe la nota.'); enfocar('bit-texto'); return; }
    anotarBitacora(cat, texto.trim());
    setTexto('');
    vibrar(10);
    avisar('Anotado en la bitácora.');
  };

  const Nota = ({ n }: { n: NotaBitacora }) => (
    <div className="fila nota" style={{ alignItems: 'flex-start' }}>
      <span className="fila-texto">
        <span className="etq">{nombreCatNota(n.categoria)} · {primer(e, n.por)} · {hora(n.en)}</span>
        <span className="nota-texto">{n.texto}</span>
        <span className="fila-h" style={{ gap: 14 }}>
          <button type="button" className="enlace" onClick={() => { fijarNota(n.id); vibrar(6); }}>{n.fijada ? 'Desfijar' : 'Fijar'}</button>
          {n.por === u.id && (borrar === n.id
            ? <button type="button" className="enlace" onClick={() => { borrarNota(n.id); setBorrar(null); avisar('Nota borrada.'); }}>Sí, borrar</button>
            : <button type="button" className="enlace" onClick={() => setBorrar(n.id)}>Borrar</button>)}
        </span>
      </span>
    </div>
  );

  return (
    <>
      <Sup titulo="Bitácora" sub="Lo que el siguiente encargado necesita saber" volver="panel" />
      <main className="pant pila">
        <Seccion titulo="Nueva nota">
          <div className="chips">{CATS_NOTA.map(([c, t]) => (
            <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{t}</button>
          ))}</div>
          <label className="campo"><span className="sr">Nota</span>
            <textarea id="bit-texto" rows={3} value={texto} placeholder="Ej. llegó el pedido de leche; falta la de avena" onChange={(ev) => setTexto(ev.target.value)} />
          </label>
          <button type="button" className="boton grande lleno" onClick={guardar}>Anotar</button>
        </Seccion>

        <label className="buscador"><span className="sr">Buscar en la bitácora</span>
          <input type="search" value={q} placeholder="Buscar: leche, técnico, Diego…" onChange={(ev) => setQ(ev.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Categoría">
          <button type="button" className="chip" aria-pressed={filtro === 'todas'} onClick={() => setFiltro('todas')}>Todas</button>
          {CATS_NOTA.map(([c, t]) => <button key={c} type="button" className="chip" aria-pressed={filtro === c} onClick={() => setFiltro(c)}>{t}</button>)}
        </div>

        {fijadas.length > 0 && (
          <Seccion titulo="Fijadas" extra={`${fijadas.length}`}>
            <div className="lista">{fijadas.map((n) => <Nota key={n.id} n={n} />)}</div>
          </Seccion>
        )}
        {dias.map((j) => (
          <Seccion key={j} titulo={cuando(j)} extra={cuando(j) === fechaCorta(j) ? undefined : fechaCorta(j)}>
            <div className="lista">{lista.filter((n) => !n.fijada && n.jornada === j).map((n) => <Nota key={n.id} n={n} />)}</div>
          </Seccion>
        ))}
        {!lista.length && <Vacio>{q ? `Nada con “${q}”.` : 'Sin notas todavía.'}</Vacio>}
      </main>
    </>
  );
}

/* ═══ REPORTE DE LA SEMANA ════════════════════════════════ */

export function reporteTexto(e: Estado, hoy = jornadaDe()) {
  const inds = indicadores(e, hoy);
  const gente = porPersona(e, hoy, 7);
  const abiertas = e.incidencias.filter((x) => !x.cerradaEn);
  const fijadas = e.bitacora.filter((n) => n.fijada);
  const cambio = (i: (typeof inds)[number]) => {
    const v = veredicto(i);
    if (v === 'sin-datos') return '';
    if (v === 'igual') return ' (igual que la semana pasada)';
    const d = i.valor - i.antes;
    const n = Math.abs(d) < 10 ? Math.round(Math.abs(d) * 10) / 10 : Math.round(Math.abs(d));
    return ` (${d > 0 ? '+' : '−'}${n}${i.unidadCambio ? ` ${i.unidadCambio}` : ''}; ${v === 'mejor' ? 'mejor' : 'peor'})`;
  };
  const lineas = [
    `${e.sucursal.negocio} · ${e.sucursal.nombre}`,
    `Semana: del ${fechaCorta(sumarDias(hoy, -6))} al ${fechaCorta(hoy)}`,
    '',
    ...inds.map((i) => `• ${i.nombre}: ${Number.isFinite(i.valor) ? i.texto(i.valor) : 'sin datos'}${cambio(i)}`),
    '',
    abiertas.length ? `Incidencias abiertas (${abiertas.length}):` : 'Sin incidencias abiertas.',
    ...abiertas.map((x) => `• ${x.titulo}${x.responsable ? ` · ${primer(e, x.responsable)}` : ' · sin responsable'}${x.vence ? `, para el ${fechaCorta(x.vence)}` : ''}`),
  ];
  const ojo = gente.filter((g) => g.ojo.length);
  if (ojo.length) lineas.push('', 'Para apoyar:', ...ojo.map((g) => `• ${g.u.nombre.split(' ')[0]}: ${g.ojo.join(', ')}`));
  if (fijadas.length) lineas.push('', 'Notas fijadas:', ...fijadas.map((n) => `• ${n.texto}`));
  const siguiente = e.semanas.find((s) => s.id === sumarDias(lunesDe(hoy), 7));
  lineas.push('', siguiente?.estado === 'publicada' ? 'El horario de la semana que viene ya está publicado.' : 'Falta publicar el horario de la semana que viene.');
  return lineas.join('\n');
}

export function PanelReporte() {
  const e = useEstado();
  const texto = useMemo(() => reporteTexto(e), [e]);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto); vibrar(12); avisar('Copiado. Pégalo en WhatsApp o en un correo.'); }
    catch { avisar('No se pudo copiar: mantén presionado el texto para seleccionarlo.'); }
  };
  const compartir = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'Reporte de la semana', text: texto }); } catch { /* canceló */ } }
    else copiar();
  };
  return (
    <>
      <Sup titulo="Reporte de la semana" sub="Los últimos 7 días, listo para mandar" volver="panel" />
      <main className="pant pila">
        <div className="reporte" aria-label="Reporte">{texto}</div>
        <div className="pie-accion pila-s">
          <button type="button" className="boton grande lleno" onClick={compartir}>{typeof navigator !== 'undefined' && 'share' in navigator ? 'Compartir' : 'Copiar el reporte'}</button>
          {typeof navigator !== 'undefined' && 'share' in navigator && <button type="button" className="enlace" style={{ alignSelf: 'center' }} onClick={copiar}>Solo copiar</button>}
        </div>
        <button type="button" className="enlace" onClick={() => ir('panel')}>Volver al Panel</button>
      </main>
    </>
  );
}
