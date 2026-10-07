/**
 * Checklists: lo de hoy, la ejecución ítem por ítem y el historial.
 *
 * Reglas que vienen del checklist en papel y de la revisión de UX:
 * - Tocar una tarea siempre hace algo: marca con iniciales y hora.
 * - Desmarcar se puede deshacer desde el aviso.
 * - "Completar" nunca está muerto: si falta algo, lleva a lo que falta.
 * - Las críticas van en letra recta; el resto en itálica.
 */
import { useRef, useState } from 'react';
import {
  useEstado, yo, usuario, plantilla as buscarPlantilla, plantillasDeHoy, ejecucionDe, pendientes, fueraDeRango,
  iniciarEjecucion, marcar, desmarcar, restaurarMarca, registrarFoto, completar, reabrir, validar, puede, nuevoId,
  avisar, celebrar, vibrar, maquinaDe, nombreBoton,
  type Estado, type Plantilla, type Ejecucion, type ItemPlantilla, type Marca,
  recetaCasa,
} from '../estado';
import { Sup, Seccion, BarraProg, Casilla, Stepper, Hoja, Foto, Estado as Etq, Vacio, Pestanas, Pista, ir } from '../componentes';

/** Las dos vistas de Checklists. */
function VistasChecklists({ activa }: { activa: 'hoy' | 'historial' }) {
  return (
    <Pestanas etiqueta="Vista" activa={activa} onCambio={(v) => location.replace(v === 'hoy' ? '#/checklists' : '#/checklists/historial')}
      opciones={[
        { id: 'hoy', texto: 'Hoy', leyenda: 'Los checklists que tocan hoy' },
        { id: 'historial', texto: 'Historial', leyenda: 'Los últimos 14 días, con filtros' },
      ]} />
  );
}
import { procesarFoto, guardarFoto, kb, type FotoProcesada } from '../lib/fotos';
import { ReportarIncidencia } from './Herramientas';
import { jornadaDe, hora, cuando, fechaCorta, minutos, minutosAhora, sumarDias } from '../lib/tiempo';

const ACCIONES_FUERA = ['Aislé el producto', 'Moví a otro refri', 'Avisé al encargado', 'Descarté producto'];

/** Lo que dice la pantalla de ritual al completar cada checklist. */
function frase(p: Plantilla, hhmm: string): [string, string] {
  if (p.id === 'p-apertura') return ['Barra lista.', `Apertura completa a las ${hhmm}. Que el turno fluya.`];
  if (p.id === 'p-cierre') return ['Barra cerrada.', `Cierre completo a las ${hhmm}. A descansar.`];
  if (p.id === 'p-profunda') return ['Limpieza profunda.', `Hecha a las ${hhmm}. La barra respira.`];
  return [`${p.nombre}.`, `Completo a las ${hhmm}.`];
}

/** Minutos desde el inicio de la jornada (que corta a las 5:00). */
const enJornada = (min: number) => (min < 300 ? min + 1440 : min);

export function atrasada(p: Plantilla, ej?: Ejecucion, jornada = jornadaDe()) {
  if (ej?.completadaEn) return false;
  if (jornada < jornadaDe()) return true;
  return enJornada(minutosAhora()) > enJornada(minutos(p.horaLimite));
}

/** "Hecho", "12 de 34", "Atrasado" o "Pendiente", listo para una fila. */
export function resumen(p: Plantilla, ej?: Ejecucion, jornada = jornadaDe()) {
  const total = p.items.length;
  const faltan = pendientes(p, ej).length;
  const hechas = total - faltan;
  return {
    total, hechas, faltan,
    hecho: !!ej?.completadaEn,
    atrasada: atrasada(p, ej, jornada),
    texto: ej?.completadaEn ? `Hecho ${hora(ej.completadaEn)}` : ej ? `${hechas} de ${total}` : `Límite ${p.horaLimite}`,
  };
}

/* ═══ LISTA DE HOY ════════════════════════════════════════ */

export function ChecklistsInicio() {
  const e = useEstado();
  const hoy = jornadaDe();
  const deHoy = plantillasDeHoy(e, hoy);
  const esEncargado = puede(e, 'encargado', 'admin');
  const [reportar, setReportar] = useState(false);
  const porValidar = e.ejecuciones
    .filter((x) => x.completadaEn && !x.validadaEn)
    .sort((a, b) => (b.completadaEn ?? 0) - (a.completadaEn ?? 0));

  const abrir = (p: Plantilla) => {
    const ej = ejecucionDe(e, p.id, hoy);
    ir(`checklists/ej/${ej ? ej.id : iniciarEjecucion(p.id)}`);
  };

  return (
    <>
      <Sup titulo="Checklists" sub={`${cuando(hoy)} · ${fechaCorta(hoy)}`} />
      <main className="pant pila">
        <VistasChecklists activa="hoy" />
        <Seccion titulo="Hoy" extra="Toca uno para abrirlo">
          <div className="lista">
            {deHoy.map((p) => {
              const ej = ejecucionDe(e, p.id, hoy);
              const r = resumen(p, ej);
              return (
                <button key={p.id} type="button" className="fila ir tarea" data-hecha={r.hecho ? 'si' : 'no'} onClick={() => abrir(p)}>
                  <Casilla hecha={r.hecho} />
                  <span className="fila-texto">
                    <span className="tarea-texto">{p.nombre}</span>
                    <span className="fila-sub">{p.descripcion}</span>
                    {ej && !r.hecho && <BarraProg valor={r.hechas / r.total} />}
                    <span className="etq">
                      {r.hecho ? r.texto : ej ? `Vas en ${r.hechas} de ${r.total} · antes de las ${p.horaLimite}` : `${r.total} tareas · antes de las ${p.horaLimite}`}
                    </span>
                  </span>
                  {r.atrasada && <Etq alerta>Atrasado</Etq>}
                </button>
              );
            })}
          </div>
        </Seccion>

        {esEncargado && porValidar.length > 0 && (
          <Seccion titulo="Por validar" extra={String(porValidar.length)}>
            <div className="lista">
              {porValidar.map((x) => <FilaEjecucion key={x.id} e={e} ej={x} />)}
            </div>
          </Seccion>
        )}

        <button type="button" className="boton grande" onClick={() => setReportar(true)}>Reportar un problema</button>
        <ReportarIncidencia abierta={reportar} alCerrar={() => setReportar(false)} />
      </main>
    </>
  );
}

function FilaEjecucion({ e, ej }: { e: Estado; ej: Ejecucion }) {
  const p = buscarPlantilla(e, ej.plantillaId);
  if (!p) return null;
  const fuera = fueraDeRango(ej).length;
  const fotos = Object.values(ej.marcas).filter((m) => m.fotoId).length;
  return (
    <a className="fila" href={`#/checklists/ej/${ej.id}`}>
      <span className="fila-texto">
        <span>{p.nombre} · {cuando(ej.jornada)}</span>
        <span className="fila-sub">
          {usuario(e, ej.completadaPor ?? ej.iniciadaPor)?.iniciales} · {ej.completadaEn ? hora(ej.completadaEn) : 'sin completar'}
          {fuera ? ` · ${fuera} fuera de rango` : ''}{fotos ? ` · ${fotos} foto${fotos === 1 ? '' : 's'}` : ''}
        </span>
      </span>
      {ej.validadaEn ? <Etq fuerte>Validado</Etq> : ej.completadaEn ? <Etq>Sin validar</Etq> : <Etq tenue>Abierto</Etq>}
    </a>
  );
}

/* ═══ HISTORIAL ═══════════════════════════════════════════ */

type Filtro = 'todas' | 'sin-validar' | 'incidencias';

export function ChecklistsHistorial() {
  const e = useEstado();
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const desde = sumarDias(jornadaDe(), -14);
  const lista = e.ejecuciones
    .filter((x) => x.jornada >= desde)
    .filter((x) => filtro === 'todas' || (filtro === 'sin-validar' ? x.completadaEn && !x.validadaEn : fueraDeRango(x).length > 0))
    .sort((a, b) => (b.jornada === a.jornada ? b.iniciadaEn - a.iniciadaEn : b.jornada.localeCompare(a.jornada)));

  return (
    <>
      <Sup titulo="Checklists" sub="Historial de los últimos 14 días" />
      <main className="pant pila">
        <VistasChecklists activa="historial" />
        <div className="chips" role="group" aria-label="Filtro">
          {([['todas', 'Todas'], ['sin-validar', 'Sin validar'], ['incidencias', 'Fuera de rango']] as const).map(([id, t]) => (
            <button key={id} type="button" className="chip" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{t}</button>
          ))}
        </div>
        {lista.length ? (
          <div className="lista">{lista.map((x) => <FilaEjecucion key={x.id} e={e} ej={x} />)}</div>
        ) : (
          <Vacio>Nada con este filtro.</Vacio>
        )}
      </main>
    </>
  );
}

/* ═══ EJECUCIÓN ═══════════════════════════════════════════ */

export function ChecklistEjecucion({ id }: { id: string }) {
  const e = useEstado();
  const ej = e.ejecuciones.find((x) => x.id === id);
  const p = ej && buscarPlantilla(e, ej.plantillaId);
  if (!ej || !p) {
    return <><Sup titulo="Checklist" volver="checklists" /><main className="pant"><p className="cuerpo">No encontrado.</p></main></>;
  }
  return <Ejecutar e={e} ej={ej} p={p} />;
}

function Ejecutar({ e, ej, p }: { e: Estado; ej: Ejecucion; p: Plantilla }) {
  const r = resumen(p, ej, ej.jornada);
  const cerrada = !!ej.completadaEn;
  const esEncargado = puede(e, 'encargado', 'admin');
  const faltan = pendientes(p, ej);
  const fueraSinAccion = p.items.filter((i) => ej.marcas[i.id]?.fuera && !ej.marcas[i.id]?.acciones?.length);
  const secciones = [...new Set(p.items.map((i) => i.seccion))];
  const [foto, setFoto] = useState<{ item: ItemPlantilla; datos?: FotoProcesada; cargando?: boolean } | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const [itemFoto, setItemFoto] = useState<ItemPlantilla | null>(null);

  const irA = (itemId: string) => {
    const el = document.getElementById(`item-${itemId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('sacude');
    void el.offsetWidth;
    el.classList.add('sacude');
    vibrar([20, 40, 20]);
  };

  const pedirFoto = (item: ItemPlantilla) => { setItemFoto(item); entrada.current?.click(); };

  const alElegir = async (archivo?: File) => {
    const item = itemFoto;
    if (!archivo || !item) return;
    const u = yo(e)!;
    setFoto({ item, cargando: true });
    const ahora = Date.now();
    const datos = await procesarFoto(archivo, [
      `${e.sucursal.negocio} · ${e.sucursal.nombre}`,
      `${fechaCorta(jornadaDe(ahora))} · ${hora(ahora)}`,
      `${u.iniciales} · ${u.nombre}`,
    ]);
    setFoto({ item, datos });
  };

  const usarFoto = async () => {
    if (!foto?.datos) return;
    const fotoId = nuevoId('foto');
    await guardarFoto(fotoId, foto.datos.blob);
    const enLinea = navigator.onLine;
    registrarFoto({
      id: fotoId, por: e.usuarioId!, en: Date.now(), bytes: foto.datos.bytes, bytesOriginal: foto.datos.bytesOriginal,
      estado: enLinea ? 'subida' : 'pendiente',
    });
    marcar(ej.id, foto.item.id, { fotoId });
    URL.revokeObjectURL(foto.datos.url);
    setFoto(null);
    vibrar(15);
    avisar(enLinea ? 'Foto guardada.' : 'Sin red: la foto se sube sola al reconectar.');
  };

  const alCompletar = () => {
    if (faltan.length) { irA(faltan[0].id); avisar(faltan.length === 1 ? 'Falta 1 tarea. Te llevo a ella.' : `Faltan ${faltan.length} tareas. Te llevo a la primera.`); return; }
    if (fueraSinAccion.length) { irA(fueraSinAccion[0].id); avisar('Anota qué hiciste con la lectura fuera de rango.'); return; }
    completar(ej.id);
    vibrar([30, 60, 30]);
    celebrar(...frase(p, hora(Date.now())));
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <Sup titulo={p.nombre} sub={`${cuando(ej.jornada)} · límite ${p.horaLimite}`} volver="checklists" />
      <main className="pant pila">
        {cerrada ? (
          <section className="bloque inv">
            <span className="etq">Completado</span>
            <p className="cuerpo">
              Por {usuario(e, ej.completadaPor)?.nombre} a las {hora(ej.completadaEn!)}.
              {ej.validadaEn ? ` Validado por ${usuario(e, ej.validadaPor)?.nombre} a las ${hora(ej.validadaEn)}.` : ' Falta que el encargado lo valide.'}
            </p>
            {esEncargado && (
              <div className="fila-h" style={{ gap: 8, flexWrap: 'wrap' }}>
                {!ej.validadaEn && (
                  <button type="button" className="boton lleno" onClick={() => { validar(ej.id); vibrar(15); avisar('Validado.'); }}>Validar</button>
                )}
                <button type="button" className="boton" onClick={() => { reabrir(ej.id); avisar('Checklist reabierto.'); }}>Reabrir</button>
              </div>
            )}
          </section>
        ) : (
          <section className={`bloque${r.atrasada ? ' inv' : ''}`}>
            <div className="fila-h entre" style={{ alignItems: 'flex-start' }}>
              <span className="subtitulo">Vas en {r.hechas} de {r.total}</span>
              {r.atrasada && <Etq alerta>Atrasado</Etq>}
            </div>
            <BarraProg valor={r.hechas / r.total} />
            <span className="meta">Lo empezó {usuario(e, ej.iniciadaPor)?.nombre.split(' ')[0]} a las {hora(ej.iniciadaEn)}</span>
          </section>
        )}

        {!cerrada && <Pista id="checklist">Toca cada tarea cuando la hagas: queda tu nombre y la hora. Las que dicen CRÍTICA son obligatorias. Si te equivocas, toca otra vez y se deshace.</Pista>}
        {secciones.map((sec) => {
          const items = p.items.filter((i) => i.seccion === sec);
          const hechas = items.filter((i) => !faltan.includes(i)).length;
          return (
            <Seccion key={sec} titulo={sec} extra={`${hechas}/${items.length}`}>
              <div className="lista">
                {items.map((i) => (
                  <Item key={i.id} e={e} ej={ej} item={i} marca={ej.marcas[i.id]} cerrada={cerrada} onFoto={() => pedirFoto(i)} />
                ))}
              </div>
            </Seccion>
          );
        })}

        {!cerrada && (
          <div className="pie-accion">
            <button type="button" className={`boton grande${faltan.length || fueraSinAccion.length ? '' : ' lleno'}`} onClick={alCompletar}>
              {faltan.length ? `Faltan ${faltan.length} · ir a la siguiente` : fueraSinAccion.length ? 'Falta anotar una acción' : `Completar ${p.nombre.toLowerCase()}`}
            </button>
          </div>
        )}
      </main>

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(ev) => { alElegir(ev.target.files?.[0]); ev.target.value = ''; }}
      />

      <Hoja abierta={!!foto} alCerrar={() => { if (foto?.datos) URL.revokeObjectURL(foto.datos.url); setFoto(null); }} titulo="Evidencia">
        {foto?.cargando || !foto?.datos ? (
          <p className="cuerpo">Comprimiendo y sellando la foto…</p>
        ) : (
          <>
            <img className="foto-previa" src={foto.datos.url} alt="Vista previa de la evidencia" />
            <p className="cuerpo">
              {foto.item.texto}. Se comprimió de {kb(foto.datos.bytesOriginal)} a {kb(foto.datos.bytes)} y lleva sello con sucursal, hora y quién la tomó.
            </p>
            <div className="rejilla-2">
              <button type="button" className="boton grande" onClick={() => entrada.current?.click()}>Repetir</button>
              <button type="button" className="boton grande lleno" onClick={usarFoto}>Usar foto</button>
            </div>
          </>
        )}
      </Hoja>
    </>
  );
}

/* ── Un ítem ───────────────────────────────────────────── */

function Firma({ e, m }: { e: Estado; m?: Marca }) {
  if (!m) return null;
  return <span className="firma">{usuario(e, m.por)?.iniciales} · {hora(m.en)}</span>;
}

function Item({ e, ej, item, marca, cerrada, onFoto }: {
  e: Estado; ej: Ejecucion; item: ItemPlantilla; marca?: Marca; cerrada: boolean; onFoto: () => void;
}) {
  const texto = <span>{item.texto}{item.critica && <span className="etiqueta-critica" data-leyenda="Obligatoria: el checklist no se completa sin ella.">Crítica</span>}</span>;
  const faltaFoto = item.foto === 'obligatoria' && marca && !marca.fotoId;

  const botonFoto = item.foto && (
    <div className="fila-h" style={{ gap: 8, paddingBottom: 16, paddingLeft: 38 }}>
      {marca?.fotoId ? <Foto id={marca.fotoId} /> : null}
      {!cerrada && (
        <button type="button" className={`chip${faltaFoto ? ' inv' : ''}`} onClick={onFoto}>
          {marca?.fotoId ? 'Repetir foto' : item.foto === 'obligatoria' ? 'Foto obligatoria' : 'Agregar foto'}
        </button>
      )}
      {marca?.fotoId && e.fotos[marca.fotoId]?.estado === 'pendiente' && <Etq tenue>Por subir</Etq>}
    </div>
  );

  if (item.tipo === 'check') {
    const alternar = () => {
      if (cerrada) return;
      if (marca) {
        const quitada = desmarcar(ej.id, item.id);
        vibrar(8);
        if (quitada) avisar(`Desmarcaste: ${item.texto}`, { etiqueta: 'Deshacer', hacer: () => restaurarMarca(ej.id, item.id, quitada) });
      } else {
        marcar(ej.id, item.id);
        vibrar(12);
      }
    };
    return (
      <div id={`item-${item.id}`} className={`item${item.foto ? ' item-foto' : ''}`}>
        <button type="button" className="fila" onClick={alternar} aria-pressed={!!marca} disabled={cerrada && !marca}>
          <Casilla hecha={!!marca} />
          <span className="fila-texto">{texto}<Firma e={e} m={marca} /></span>
        </button>
        {botonFoto}
      </div>
    );
  }

  if (item.tipo === 'numero') return <ItemNumero e={e} ej={ej} item={item} marca={marca} cerrada={cerrada} texto={texto} />;

  if (item.tipo === 'foto') {
    return (
      <div id={`item-${item.id}`} className="fila" style={{ flexWrap: 'wrap' }}>
        <Casilla hecha={!!marca?.fotoId} />
        <span className="fila-texto">
          {texto}
          <span className="fila-sub">{item.foto === 'obligatoria' ? 'Foto obligatoria' : 'Foto'}</span>
          <Firma e={e} m={marca} />
        </span>
        <div className="fila-h" style={{ gap: 8, width: '100%', paddingLeft: 38 }}>
          {marca?.fotoId && <Foto id={marca.fotoId} />}
          {!cerrada && <button type="button" className="boton" onClick={onFoto}>{marca?.fotoId ? 'Repetir' : 'Tomar foto'}</button>}
          {marca?.fotoId && e.fotos[marca.fotoId]?.estado === 'pendiente' && <Etq tenue>Por subir</Etq>}
        </div>
      </div>
    );
  }

  if (item.tipo === 'nota') return <ItemNota e={e} ej={ej} item={item} marca={marca} cerrada={cerrada} texto={texto} />;

  // Calibración: se marca sola al aprobar la receta del día.
  const rd = recetaCasa(e, ej.jornada);
  const m = maquinaDe(e);
  return (
    <div id={`item-${item.id}`} className="fila" style={{ flexWrap: 'wrap' }}>
      <Casilla hecha={!!marca} />
      <span className="fila-texto">
        {texto}
        <span className="fila-sub">
          {marca?.texto ?? (rd ? `Receta del día aprobada a las ${hora(rd.en)} · ${nombreBoton(m, rd.botonId)}` : 'Se marca sola al aprobar la receta del día')}
        </span>
        <Firma e={e} m={marca} />
      </span>
      {!marca && !cerrada && (
        <div className="fila-h" style={{ gap: 8, width: '100%', paddingLeft: 38 }}>
          {rd ? (
            <button type="button" className="boton" onClick={() => {
              marcar(ej.id, item.id, { texto: `Receta aprobada: ${rd.dosis} g → ${rd.rendimiento} g · ${rd.tiempo} s` });
              vibrar(12);
            }}>Usar receta del día</button>
          ) : (
            <button type="button" className="boton lleno" onClick={() => ir('calibrar/nueva')}>Calibrar ahora</button>
          )}
        </div>
      )}
    </div>
  );
}

function ItemNumero({ e, ej, item, marca, cerrada, texto }: {
  e: Estado; ej: Ejecucion; item: ItemPlantilla; marca?: Marca; cerrada: boolean; texto: JSX.Element;
}) {
  const [borrador, setBorrador] = useState(item.inicial ?? item.min ?? 0);
  const valor = marca?.valor ?? borrador;
  const fuera = (v: number) => (item.max !== undefined && v > item.max) || (item.min !== undefined && v < item.min);
  const registrar = (v: number) => {
    const f = fuera(v);
    marcar(ej.id, item.id, { valor: v, fuera: f, ...(f ? {} : { acciones: [] }) });
  };
  const alternarAccion = (a: string) => {
    const actuales = marca?.acciones ?? [];
    marcar(ej.id, item.id, { acciones: actuales.includes(a) ? actuales.filter((x) => x !== a) : [...actuales, a] });
  };
  const limite = item.max !== undefined ? `máx. ${item.max} ${item.unidad ?? ''}` : '';

  return (
    <div id={`item-${item.id}`} className="pila-s" style={{ padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
      <span className="fila-texto">{texto}<span className="fila-sub">{limite}</span><Firma e={e} m={marca} /></span>
      {cerrada ? (
        <span className="num-m">{marca?.valor?.toFixed(1) ?? '—'} {item.unidad}</span>
      ) : (
        <>
          <Stepper
            etiqueta={marca ? 'Lectura registrada' : 'Lectura'}
            valor={valor}
            paso={item.paso ?? 0.5}
            min={-30}
            max={30}
            unidad={item.unidad ? ` ${item.unidad}` : ''}
            fuera={fuera(valor)}
            onCambio={(v) => (marca ? registrar(v) : setBorrador(v))}
          />
          {!marca && (
            <button type="button" className="boton" onClick={() => { registrar(borrador); vibrar(12); }}>
              Registrar {borrador.toFixed(1)} {item.unidad}
            </button>
          )}
        </>
      )}
      {marca?.fuera && (
        <div className="bloque inv">
          <span className="etq">Fuera de rango · {limite}</span>
          <p className="cuerpo">¿Qué hiciste? Marca al menos una acción.</p>
          <div className="chips">
            {ACCIONES_FUERA.map((a) => (
              <button key={a} type="button" className="chip" disabled={cerrada} aria-pressed={!!marca.acciones?.includes(a)} onClick={() => alternarAccion(a)}>{a}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemNota({ e, ej, item, marca, cerrada, texto }: {
  e: Estado; ej: Ejecucion; item: ItemPlantilla; marca?: Marca; cerrada: boolean; texto: JSX.Element;
}) {
  const [valor, setValor] = useState(marca?.texto ?? '');
  const guardar = () => {
    const t = valor.trim();
    if (t && t !== marca?.texto) marcar(ej.id, item.id, { texto: t });
  };
  return (
    <div id={`item-${item.id}`} className="pila-s" style={{ padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
      <span className="fila-texto">{texto}<Firma e={e} m={marca} /></span>
      {cerrada ? (
        <p className="cuerpo">{marca?.texto ?? '—'}</p>
      ) : (
        <>
          <label className="campo">
            <span className="etq">Nota</span>
            <textarea rows={2} value={valor} placeholder="Escribe o toca “Nada que reportar”"
              onChange={(ev) => setValor(ev.target.value)} onBlur={guardar} />
          </label>
          {!marca && (
            <div className="chips">
              <button type="button" className="chip" onClick={() => { setValor('Nada que reportar'); marcar(ej.id, item.id, { texto: 'Nada que reportar' }); vibrar(12); }}>
                Nada que reportar
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
