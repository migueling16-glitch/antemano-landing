/**
 * Calibración de espresso: el corazón de la app.
 *
 * Tiene que sentirse como un instrumento, no como un formulario: steppers
 * en lugar de teclado, ratio y tiempo en vivo contra la ventana,
 * brújula de sabor que sugiere el siguiente ajuste, y la gráfica de la sesión
 * donde se ve cómo los shots convergen hacia la zona objetivo.
 *
 * Está hecha para la La Marzocco Linea Classic AV de un grupo de la barra:
 * - Con un botón volumétrico la máquina corta sola; la molienda mueve el
 *   tiempo y el rendimiento se cambia reprogramando el botón.
 * - Con continuo, el barista corta en la báscula (cafés invitados).
 * - El tiempo lo marca la botonera: se captura, no se cronometra.
 * - Un solo PID para la caldera de café: la temperatura no es por café.
 */
import { useMemo, useState } from 'react';
import {
  useEstado, cafe as buscarCafe, usuario, nuevaSesion, guardarShot, evaluarShot, aprobarShot, terminarSesion,
  programarBoton, maquinaDe, nombreBoton, programadoDe, avisar, celebrar, vibrar, CONTINUO,
  type Estado, type Cafe, type SesionCal, type Shot, type Maquina,
} from '../estado';
import {
  Sup, Seccion, Stepper, Brujula, Gauge, GraficaSesion, GraficaTendencia,
  Estado as Etq, Hoja, ir,
} from '../componentes';
import {
  sugerir, ratioTexto, ventanaRatio, tendencia, redondear, enVentana,
  GOTEO, type Objetivo, type Sabor,
} from '../lib/calibracion';
import { jornadaDe, diasEntre, hora, cuando, fechaCorta } from '../lib/tiempo';

const reposoDe = (c: Cafe, jornada = jornadaDe()) => diasEntre(c.tueste, jornada);
const pasoDe = (e: Estado, molinoId: string) => e.equipos.find((x) => x.id === molinoId)?.paso ?? 0.5;
const aprobadoDe = (s: SesionCal) => s.shots.find((x) => x.id === s.aprobadoId);
const alPaso = (v: number, paso: number) => redondear(Math.round(v / paso) * paso, 2);

/** Memoria del equipo: lo último que funcionó y la tendencia de molienda contra reposo. */
function memoria(e: Estado, cafeId: string) {
  const aprobadas = e.sesiones
    .filter((s) => s.cafeId === cafeId && s.aprobadoId)
    .sort((a, b) => (b.fin ?? 0) - (a.fin ?? 0));
  const ultima = aprobadas[0];
  const puntos = aprobadas.map((s) => ({ x: s.diasReposo, y: aprobadoDe(s)!.molienda }));
  const t = tendencia(puntos);
  return { ultima, shot: ultima && aprobadoDe(ultima), puntos, recta: t?.en ?? null, aprobadas };
}

/** Cómo se reprograma una dosis en la botonera de la Linea. */
function PasosProgramar({ boton, gramos }: { boton: string; gramos: number }) {
  return (
    <ol className="pasos">
      <li>En la botonera, mantén presionado el botón de programación hasta que entre en modo programación.</li>
      <li>Báscula en cero bajo el portafiltro, con la misma dosis y molienda.</li>
      <li>Presiona {boton}: el grupo empieza a correr.</li>
      <li>Presiónalo otra vez cuando la báscula marque {(gramos - GOTEO).toFixed(1)} g. Lo demás gotea hasta {gramos.toFixed(1)} g.</li>
      <li>Sal de programación y tira un shot normal para comprobar el peso.</li>
    </ol>
  );
}

/* ═══ INICIO DE CALIBRAR ══════════════════════════════════ */

export function CalibrarInicio() {
  const e = useEstado();
  const m = maquinaDe(e);
  const hoy = jornadaDe();
  const rd = e.recetasDelDia[hoy];
  const c = rd && buscarCafe(e, rd.cafeId);
  const sesionesHoy = e.sesiones.filter((s) => s.jornada === hoy).sort((a, b) => b.inicio - a.inicio);
  const abierta = sesionesHoy.find((s) => !s.fin && s.por === e.usuarioId);
  const usados = m?.botones.filter((b) => e.cafes.some((x) => x.activo && x.boton === b.id)) ?? [];

  return (
    <>
      <Sup titulo="Calibrar" sub={m ? m.modelo : 'Espresso'} />
      <main className="pant pila">
        {rd && c ? (
          <section className="bloque" aria-label="Receta del día">
            <div className="fila-h entre">
              <span className="etq">Receta del día</span>
              <Etq fuerte>Fijada {hora(rd.en)}</Etq>
            </div>
            <p className="subtitulo">{c.nombre}</p>
            <div className="rejilla-2">
              <Dato etq="Dosis" valor={`${rd.dosis.toFixed(1)} g`} />
              <Dato etq="Rendimiento" valor={`${rd.rendimiento.toFixed(1)} g`} />
              <Dato etq="Tiempo" valor={`${rd.tiempo.toFixed(0)} s`} />
              <Dato etq="Molienda" valor={String(rd.molienda)} />
            </div>
            <p className="cuerpo">
              Botón {nombreBoton(m, rd.botonId)} · {ratioTexto(rd.dosis, rd.rendimiento)} · {reposoDe(c)} días de reposo · aprobó {usuario(e, rd.por)?.nombre}
            </p>
          </section>
        ) : (
          <section className="bloque inv">
            <span className="etq">Sin receta del día</span>
            <p className="cuerpo">Todavía no se calibra hoy. El primer espresso se sirve con receta aprobada.</p>
          </section>
        )}

        {abierta && (
          <a className="boton grande lleno" href={`#/calibrar/sesion/${abierta.id}`}>
            Continuar sesión · shot {abierta.shots.length + (abierta.shots.some((x) => !x.sabor) ? 0 : 1)}
          </a>
        )}
        <a className={`boton grande${abierta ? '' : ' lleno'}`} href="#/calibrar/nueva">{rd ? 'Recalibrar' : 'Calibrar ahora'}</a>

        {m && (
          <Seccion titulo="Máquina" extra={`PID ${m.pid.toFixed(1)} °C`}>
            <p className="cuerpo">
              {m.detalle}. La caldera de café está a {m.pid.toFixed(1)} °C para todos los cafés. Lo que entrega cada botón, medido en la báscula:
            </p>
            <div className="lista">
              {usados.map((b) => {
                const cafes = e.cafes.filter((x) => x.activo && x.boton === b.id).map((x) => x.nombre.split(' · ')[0]);
                const p = programadoDe(m, b.id);
                return (
                  <div key={b.id} className="fila">
                    <span className="fila-texto">
                      <span>{b.nombre}</span>
                      <span className="fila-sub">{cafes.join(', ')}{p ? ` · medido ${cuando(jornadaDe(p.en)).toLowerCase()} ${hora(p.en)}` : ''}</span>
                    </span>
                    <span className="fila-der">{p ? `${p.gramos.toFixed(1)} g` : 'Sin medir'}</span>
                  </div>
                );
              })}
            </div>
          </Seccion>
        )}

        <Seccion titulo="Cafés">
          <div className="lista">
            {e.cafes.filter((x) => x.activo).map((x) => {
              const mem = memoria(e, x.id);
              return (
                <a key={x.id} className="fila" href={`#/calibrar/cafe/${x.id}`}>
                  <span className="fila-texto">
                    <span>{x.nombre}</span>
                    <span className="fila-sub">
                      {nombreBoton(m, x.boton)} · {reposoDe(x)} días de reposo{mem.shot ? ` · molienda ${mem.shot.molienda}` : ''}
                    </span>
                  </span>
                  <span className="fila-der">{x.objetivo.dosis}→{x.objetivo.rendimiento} g</span>
                </a>
              );
            })}
          </div>
        </Seccion>

        {sesionesHoy.length > 0 && (
          <Seccion titulo="Sesiones de hoy">
            <div className="lista">
              {sesionesHoy.map((s) => (
                <a key={s.id} className="fila" href={`#/calibrar/sesion/${s.id}`}>
                  <span className="fila-texto">
                    <span>{buscarCafe(e, s.cafeId)?.nombre}</span>
                    <span className="fila-sub">{usuario(e, s.por)?.iniciales} · {hora(s.inicio)} · {s.shots.length} shots</span>
                  </span>
                  {s.aprobadoId ? <Etq fuerte>Aprobada</Etq> : s.fin ? <Etq tenue>Sin aprobar</Etq> : <Etq>Abierta</Etq>}
                </a>
              ))}
            </div>
          </Seccion>
        )}
      </main>
    </>
  );
}

const Dato = ({ etq, valor }: { etq: string; valor: string }) => (
  <div className="pila-s" style={{ gap: 2 }}>
    <span className="etq">{etq}</span>
    <span className="num-m">{valor}</span>
  </div>
);

const FilaDato = ({ etq, valor }: { etq: string; valor: string }) => (
  <div className="par">
    <span className="etq">{etq}</span>
    <span>{valor}</span>
  </div>
);

/* ═══ NUEVA SESIÓN ════════════════════════════════════════ */

export function CalibrarNueva() {
  const e = useEstado();
  const m = maquinaDe(e);
  const cafes = e.cafes.filter((x) => x.activo);
  const molinos = e.equipos.filter((x) => x.tipo === 'molino' && x.uso !== 'filtrados');
  const inicialCafe = e.recetasDelDia[jornadaDe()]?.cafeId ?? cafes[0]?.id;
  const [cafeId, setCafeId] = useState(inicialCafe);
  const [molinoId, setMolinoId] = useState(molinos[0]?.id);
  const [botonId, setBotonId] = useState(buscarCafe(e, inicialCafe)?.boton ?? CONTINUO);
  const c = buscarCafe(e, cafeId);
  if (!c) return null;
  const paso = pasoDe(e, molinoId);
  const mem = memoria(e, cafeId);
  const reposo = reposoDe(c);
  const estimada = mem.recta && mem.puntos.length >= 4 ? alPaso(mem.recta(reposo), paso) : undefined;
  const o = c.objetivo;
  const [rmin, rmax] = ventanaRatio(o);
  const prog = programadoDe(m, botonId);

  const elegirCafe = (x: Cafe) => { setCafeId(x.id); setBotonId(x.boton); vibrar(5); };

  return (
    <>
      <Sup titulo="Nueva calibración" volver="calibrar" />
      <main className="pant pila">
        <Seccion titulo="Café">
          <div className="pila-s">
            {cafes.map((x) => (
              <button
                key={x.id}
                type="button"
                className={`bloque bloque-toque${x.id === cafeId ? ' inv' : ''}`}
                aria-pressed={x.id === cafeId}
                onClick={() => elegirCafe(x)}
              >
                <span className="fila-h entre">
                  <span>{x.nombre}</span>
                  <span className="etq">{reposoDe(x)} días</span>
                </span>
                <span className="cuerpo">{x.proceso} · {x.tostador} · tueste {fechaCorta(x.tueste)}</span>
              </button>
            ))}
          </div>
        </Seccion>

        {m && (
          <Seccion titulo="Cómo corta" extra={m.modelo.replace('La Marzocco ', '')}>
            <div className="chips">
              {c.boton !== CONTINUO && (
                <button type="button" className="chip" aria-pressed={botonId === c.boton} onClick={() => setBotonId(c.boton)}>
                  Botón {nombreBoton(m, c.boton)}
                </button>
              )}
              <button type="button" className="chip" aria-pressed={botonId === CONTINUO} onClick={() => setBotonId(CONTINUO)}>Continuo</button>
            </div>
            <p className="cuerpo">
              {botonId === CONTINUO
                ? `Tú cortas el shot en la báscula, en ${(o.rendimiento - GOTEO).toFixed(1)} g; lo demás gotea.`
                : `La máquina corta sola por volumen. ${prog ? `Hoy entrega ${prog.gramos.toFixed(1)} g.` : 'Todavía sin medir en la báscula.'} La molienda mueve el tiempo; el peso se cambia reprogramando el botón.`}
            </p>
          </Seccion>
        )}

        {molinos.length > 1 && <Seccion titulo="Molino">
          <div className="chips">
            {molinos.map((x) => (
              <button key={x.id} type="button" className="chip" aria-pressed={x.id === molinoId} onClick={() => setMolinoId(x.id)}>
                {x.nombre} · paso {x.paso}
              </button>
            ))}
          </div>
        </Seccion>}

        <Seccion titulo="Punto de partida">
          {mem.shot && mem.ultima ? (
            <div className="bloque inv">
              <span className="etq">Molienda sugerida</span>
              <span className="num-l">{mem.shot.molienda}</span>
              <p className="cuerpo">
                Es lo último que funcionó con este café: {cuando(mem.ultima.jornada).toLowerCase()}, con {mem.ultima.diasReposo} días de reposo.
                {estimada !== undefined && estimada !== mem.shot.molienda && ` Con ${reposo} días de reposo, la tendencia apunta a ${estimada}.`}
              </p>
            </div>
          ) : (
            <div className="bloque">
              <p className="cuerpo">Sin historial con este café. Arranca en el punto medio del molino y ajusta con la brújula.</p>
            </div>
          )}
          <div className="lista">
            <FilaDato etq="Receta objetivo" valor={`${o.dosis} g → ${o.rendimiento} g`} />
            <FilaDato etq="Tiempo" valor={`${o.tiempo} ± ${o.tolTiempo} s`} />
            <FilaDato etq="Ratio" valor={`1:${(o.rendimiento / o.dosis).toFixed(2)} · ventana 1:${rmin.toFixed(2)}–1:${rmax.toFixed(2)}`} />
            {m && <FilaDato etq="Temperatura" valor={`PID ${m.pid.toFixed(1)} °C`} />}
          </div>
        </Seccion>

        <Seccion titulo="Antes del primer shot">
          <ol className="pasos">
            <li>Purga el grupo dos o tres segundos para estabilizar la regadera.</li>
            <li>Portafiltro seco y caliente: vive enganchado en el grupo.</li>
            <li>Báscula en cero con la taza encima.</li>
          </ol>
        </Seccion>

        <div className="pie-accion">
          <button
            type="button"
            className="boton grande lleno"
            onClick={() => { const id = nuevaSesion(cafeId, molinoId, reposo, botonId); ir(`calibrar/sesion/${id}`); }}
          >Empezar sesión</button>
        </div>
      </main>
    </>
  );
}

/* ═══ SESIÓN ══════════════════════════════════════════════ */

export function CalibrarSesion({ id }: { id: string }) {
  const e = useEstado();
  const s = e.sesiones.find((x) => x.id === id);
  const c = s && buscarCafe(e, s.cafeId);
  if (!s || !c) {
    return (
      <>
        <Sup titulo="Sesión" volver="calibrar" />
        <main className="pant"><p className="cuerpo">Esta sesión ya no existe.</p></main>
      </>
    );
  }
  return <Sesion e={e} s={s} c={c} />;
}

function Sesion({ e, s, c }: { e: Estado; s: SesionCal; c: Cafe }) {
  const o = c.objetivo;
  const m = maquinaDe(e);
  const paso = pasoDe(e, s.molinoId);
  const pendiente = s.shots.find((x) => !x.sabor && !x.aprobado);
  const ultimo = s.shots[s.shots.length - 1];
  const cerrada = !!s.fin;
  const hoy = jornadaDe();
  const conBoton = s.botonId !== CONTINUO;
  const boton = nombreBoton(m, s.botonId);
  const ctx = { boton: conBoton ? boton : undefined, pid: m?.pid };
  const [confirmar, setConfirmar] = useState<{ shot: Shot; antes: () => void } | null>(null);

  // Con qué arranca el siguiente shot: el ajuste sugerido sobre el anterior,
  // o la memoria del café si es el primero. Con botón, el peso esperado es lo
  // que el botón entrega hoy.
  const inicial = useMemo(() => {
    if (ultimo?.sabor) {
      const sug = sugerir(ultimo, o, paso, ctx);
      const dosis = sug.ajuste.dosis ?? ultimo.dosis;
      return {
        dosis,
        rendimiento: sug.ajuste.rendimiento ?? (conBoton ? ultimo.rendimiento : redondear(dosis * (o.rendimiento / o.dosis))),
        molienda: sug.ajuste.molienda ?? ultimo.molienda,
        tiempo: ultimo.tiempo,
      };
    }
    const mem = memoria(e, s.cafeId);
    const prog = conBoton ? programadoDe(m, s.botonId) : undefined;
    return { dosis: o.dosis, rendimiento: prog?.gramos ?? o.rendimiento, molienda: mem.shot?.molienda ?? 6, tiempo: o.tiempo };
  }, [s.shots.length, ultimo?.sabor]); // eslint-disable-line react-hooks/exhaustive-deps

  // `antes` guarda la evaluación del shot; si hay que confirmar el reemplazo,
  // espera a la confirmación para no dejar la sesión a medias.
  const aprobar = (shot: Shot, antes: () => void) => {
    const actual = e.recetasDelDia[hoy];
    if (actual && actual.sesionId !== s.id) { setConfirmar({ shot, antes }); return; }
    antes();
    fijar(shot);
  };
  const fijar = (shot: Shot) => {
    aprobarShot(s.id, shot.id);
    vibrar([30, 60, 30]);
    celebrar('Receta del día.', `${shot.dosis.toFixed(1)} → ${shot.rendimiento.toFixed(1)} g · ${shot.tiempo.toFixed(0)} s. Ya la ve todo el turno.`);
    window.scrollTo({ top: 0 });
  };

  const n = pendiente ? pendiente.n : s.shots.length + 1;
  const actual = e.recetasDelDia[hoy];

  return (
    <>
      <Sup
        titulo={cerrada ? 'Sesión cerrada' : pendiente ? `Shot ${n} · sabor` : `Shot ${n}`}
        sub={`${c.nombre} · ${s.diasReposo} días de reposo`}
        volver="calibrar"
        accion={cerrada ? undefined : { texto: 'Terminar', hacer: () => { terminarSesion(s.id); avisar('Sesión cerrada sin receta aprobada.'); } }}
      />
      <main className="pant pila">
        <div className="chips" aria-label="Receta y máquina">
          <span className="estado fuerte">{conBoton ? boton : 'Continuo'}</span>
          <span className="estado">{o.dosis} → {o.rendimiento} g</span>
          <span className="estado">{o.tiempo} ± {o.tolTiempo} s</span>
          {m && <span className="estado">PID {m.pid.toFixed(1)} °C</span>}
        </div>

        {cerrada ? (
          <Cierre s={s} m={m} />
        ) : pendiente ? (
          <Evaluacion key={pendiente.id} shot={pendiente} objetivo={o} paso={paso} s={s} ctx={ctx} onAprobar={aprobar} />
        ) : (
          <Composer key={s.shots.length} n={n} inicial={inicial} objetivo={o} paso={paso} s={s} m={m}
            onGuardar={(datos) => { guardarShot(s.id, datos); vibrar(15); window.scrollTo({ top: 0 }); }} />
        )}

        {s.shots.length > 0 && (
          <Seccion titulo="La sesión" extra={`${s.shots.length} shot${s.shots.length === 1 ? '' : 's'}`}>
            <GraficaSesion shots={s.shots} objetivo={o} dosis={o.dosis} />
            <p className="cuerpo">La zona con trama es la receta objetivo. Cada shot debería acercarse a ella.</p>
            <div className="lista">
              {s.shots.map((x) => {
                const v = enVentana(x, o);
                return (
                  <div key={x.id} className="fila">
                    <span className="avatar" style={{ borderRadius: 0 }}>{x.n}</span>
                    <span className="fila-texto">
                      <span>{x.rendimiento.toFixed(1)} g · {x.tiempo.toFixed(0)} s</span>
                      <span className="fila-sub">
                        {x.dosis.toFixed(1)} g · molienda {x.molienda} · {ratioTexto(x.dosis, x.rendimiento)}
                      </span>
                    </span>
                    {x.aprobado ? <Etq fuerte>Aprobado</Etq> : v.tiempo && v.ratio ? <Etq>En ventana</Etq> : <Etq tenue>Fuera</Etq>}
                  </div>
                );
              })}
            </div>
          </Seccion>
        )}
      </main>

      <Hoja abierta={!!confirmar} alCerrar={() => setConfirmar(null)} titulo="Reemplazar receta del día">
        {actual && (
          <p className="cuerpo">
            Hoy ya hay receta fijada a las {hora(actual.en)} por {usuario(e, actual.por)?.nombre}: {actual.dosis} g → {actual.rendimiento} g · {actual.tiempo} s · molienda {actual.molienda}.
            Si apruebas este shot, todo el turno pasa a la nueva receta.
          </p>
        )}
        <button type="button" className="boton grande lleno" onClick={() => { const x = confirmar!; setConfirmar(null); x.antes(); fijar(x.shot); }}>Reemplazar y fijar</button>
      </Hoja>
    </>
  );
}

/* ── Registrar el shot ─────────────────────────────────── */

function Composer({ n, inicial, objetivo, paso, s, m, onGuardar }: {
  n: number; inicial: { dosis: number; rendimiento: number; molienda: number; tiempo: number }; objetivo: Objetivo; paso: number;
  s: SesionCal; m?: Maquina;
  onGuardar: (d: { dosis: number; rendimiento: number; molienda: number; tiempo: number }) => void;
}) {
  const [dosis, setDosis] = useState(inicial.dosis);
  const [rendimiento, setRendimiento] = useState(inicial.rendimiento);
  const [molienda, setMolienda] = useState(inicial.molienda);
  const [tiempo, setTiempo] = useState(Math.round(inicial.tiempo));
  const rObj = objetivo.rendimiento / objetivo.dosis;
  const [rmin, rmax] = ventanaRatio(objetivo);
  const r = rendimiento / dosis;
  const conBoton = s.botonId !== CONTINUO;
  const corte = redondear(dosis * rObj - GOTEO);

  return (
    <div className="pila cambia">
      <Seccion titulo="Antes del shot">
        <Stepper etiqueta={`Molienda · paso ${paso}`} valor={molienda} paso={paso} min={0} max={40} dec={paso < 1 ? 1 : 0} onCambio={setMolienda} />
        <Stepper etiqueta="Dosis" valor={dosis} paso={0.1} min={10} max={25} unidad=" g" onCambio={setDosis} />
      </Seccion>

      <Seccion titulo="El shot">
        <p className="cuerpo">
          {conBoton
            ? `Engancha, báscula en cero y presiona ${nombreBoton(m, s.botonId)}. La máquina corta sola: anota el tiempo de la botonera y pesa cuando deje de gotear.`
            : `Presiona continuo y corta cuando la báscula marque ${corte.toFixed(1)} g. Anota el tiempo de la botonera.`}
        </p>
        <Stepper etiqueta="Tiempo en la botonera" valor={tiempo} paso={1} min={5} max={60} dec={0} unidad=" s" onCambio={setTiempo}
          fuera={Math.abs(tiempo - objetivo.tiempo) > objetivo.tolTiempo} />
        <Gauge
          etiqueta="Tiempo"
          texto={`${tiempo} s · objetivo ${objetivo.tiempo} ± ${objetivo.tolTiempo}`}
          valor={tiempo}
          desde={objetivo.tiempo - objetivo.tolTiempo}
          hasta={objetivo.tiempo + objetivo.tolTiempo}
          vmin={objetivo.tiempo - 12}
          vmax={objetivo.tiempo + 12}
        />
        <Stepper etiqueta={conBoton ? 'Lo que marcó la báscula' : 'Rendimiento en la báscula'} valor={rendimiento} paso={0.1} min={10} max={80} unidad=" g"
          onCambio={setRendimiento} fuera={r < rmin || r > rmax} />
        <Gauge
          etiqueta="Ratio"
          texto={`1:${r.toFixed(2)} · objetivo 1:${rObj.toFixed(2)}`}
          valor={r}
          desde={rmin}
          hasta={rmax}
          vmin={rObj * 0.8}
          vmax={rObj * 1.2}
        />
      </Seccion>

      <div className="pie-accion">
        <button type="button" className="boton grande lleno" onClick={() => onGuardar({ dosis, rendimiento, molienda, tiempo })}>
          Guardar shot {n}
        </button>
      </div>
    </div>
  );
}

/* ── Probar y decidir ──────────────────────────────────── */

function Evaluacion({ shot, objetivo, paso, s, ctx, onAprobar }: {
  shot: Shot; objetivo: Objetivo; paso: number; s: SesionCal;
  ctx: { boton?: string; pid?: number }; onAprobar: (s: Shot, antes: () => void) => void;
}) {
  const [sabor, setSabor] = useState<Sabor | undefined>(shot.sabor);
  const sug = sabor ? sugerir({ ...shot, sabor }, objetivo, paso, ctx) : null;
  const v = enVentana(shot, objetivo);

  const guardar = () => evaluarShot(s.id, shot.id, { sabor });

  return (
    <div className="pila cambia">
      <section className="bloque">
        <div className="fila-h entre">
          <span className="etq">Shot {shot.n}</span>
          <span className="chips">
            <Etq {...(v.tiempo ? {} : { fuerte: true })}>{v.tiempo ? 'Tiempo ok' : shot.tiempo < objetivo.tiempo ? 'Rápido' : 'Lento'}</Etq>
            <Etq {...(v.ratio ? {} : { fuerte: true })}>{v.ratio ? 'Ratio ok' : 'Ratio fuera'}</Etq>
          </span>
        </div>
        <span className="num-m">{shot.dosis.toFixed(1)} → {shot.rendimiento.toFixed(1)} g · {shot.tiempo.toFixed(0)} s</span>
        <span className="cuerpo">molienda {shot.molienda} · {ratioTexto(shot.dosis, shot.rendimiento)}</span>
      </section>

      <Seccion titulo="¿Cómo sabe?" extra={sabor ? 'Arrastra para ajustar' : 'Toca la brújula'}>
        <Brujula valor={sabor} onCambio={setSabor} />
      </Seccion>

      {sug && (
        <section className={`bloque${sug.aprobar ? ' inv' : ''}`} aria-live="polite">
          <span className="etq">{sug.aprobar ? 'Listo' : 'Siguiente ajuste'}</span>
          <p className="subtitulo">{sug.accion}</p>
          <p className="cuerpo">{sug.porque}</p>
          {sug.reprogramar !== undefined && ctx.boton && (
            <PasosProgramar boton={ctx.boton} gramos={sug.reprogramar} />
          )}
        </section>
      )}

      <div className="pie-accion pila-s">
        {sug?.aprobar ? (
          <>
            <button type="button" className="boton grande lleno" onClick={() => onAprobar(shot, guardar)}>Aprobar shot {shot.n}</button>
            <button type="button" className="boton grande" onClick={() => { guardar(); window.scrollTo({ top: 0 }); }}>Hacer otro shot</button>
          </>
        ) : (
          <>
            <button type="button" className="boton grande lleno" disabled={!sabor}
              onClick={() => {
                if (sug?.reprogramar !== undefined) {
                  programarBoton(s.botonId, sug.reprogramar);
                  avisar(`${ctx.boton} reprogramado a ${sug.reprogramar.toFixed(1)} g.`);
                }
                guardar();
                window.scrollTo({ top: 0 });
              }}>
              {!sabor ? 'Toca la brújula para seguir' : sug?.reprogramar !== undefined ? 'Ya lo reprogramé · siguiente shot' : 'Siguiente shot con el ajuste'}
            </button>
            {sabor && (
              <button type="button" className="enlace" style={{ alignSelf: 'center' }} onClick={() => onAprobar(shot, guardar)}>
                Aprobar de todos modos
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Sesión cerrada ───────────────────────────────────── */

function Cierre({ s, m }: { s: SesionCal; m?: Maquina }) {
  const a = aprobadoDe(s);
  if (!a) return <section className="bloque"><p className="cuerpo">Se cerró sin aprobar ningún shot.</p></section>;
  const conBoton = s.botonId !== CONTINUO;
  return (
    <section className="bloque inv">
      <span className="etq">Aprobado en el shot {a.n}</span>
      <span className="num-m">{a.dosis.toFixed(1)} → {a.rendimiento.toFixed(1)} g · {a.tiempo.toFixed(0)} s</span>
      <span className="cuerpo">
        Molienda {a.molienda} · {ratioTexto(a.dosis, a.rendimiento)} ·{' '}
        {conBoton ? `botón ${nombreBoton(m, s.botonId)}` : `continuo, cortando en ${(a.rendimiento - GOTEO).toFixed(1)} g`}
      </span>
    </section>
  );
}

/* ═══ FICHA DEL CAFÉ ══════════════════════════════════════ */

export function CalibrarCafe({ id }: { id: string }) {
  const e = useEstado();
  const c = buscarCafe(e, id);
  if (!c) return <><Sup titulo="Café" volver="calibrar" /><main className="pant"><p className="cuerpo">No encontrado.</p></main></>;
  const m = maquinaDe(e);
  const mem = memoria(e, c.id);
  const reposo = reposoDe(c);
  const paso = e.equipos.find((x) => x.tipo === 'molino')?.paso ?? 0.5;
  const estimada = mem.recta && mem.puntos.length >= 4 ? alPaso(mem.recta(reposo), paso) : undefined;
  const o = c.objetivo;
  const [rmin, rmax] = ventanaRatio(o);

  return (
    <>
      <Sup titulo={c.nombre} sub={`${c.origen} · ${c.proceso}`} volver="calibrar" />
      <main className="pant pila">
        <div className="rejilla-2">
          <div className="bloque"><span className="etq">Días de reposo</span><span className="num-l">{reposo}</span></div>
          <div className="bloque"><span className="etq">Tueste</span><span className="num-m">{fechaCorta(c.tueste)}</span><span className="cuerpo">{c.tostador}</span></div>
        </div>
        <p className="cuerpo">{c.notas}</p>

        <Seccion titulo="Receta objetivo">
          <div className="lista">
            <FilaDato etq="Dosis" valor={`${o.dosis} g`} />
            <FilaDato etq="Rendimiento" valor={`${o.rendimiento} g`} />
            <FilaDato etq="Tiempo" valor={`${o.tiempo} ± ${o.tolTiempo} s`} />
            <FilaDato etq="Ratio" valor={`1:${(o.rendimiento / o.dosis).toFixed(2)} (1:${rmin.toFixed(2)}–1:${rmax.toFixed(2)})`} />
            <FilaDato etq="Botón" valor={nombreBoton(m, c.boton)} />
            {m && <FilaDato etq="Temperatura" valor={`PID ${m.pid.toFixed(1)} °C, igual para todos`} />}
          </div>
        </Seccion>

        {mem.puntos.length > 1 && (
          <Seccion titulo="Molienda contra reposo" extra={`${mem.puntos.length} calibraciones`}>
            <GraficaTendencia puntos={mem.puntos} recta={mem.recta} hoy={reposo} />
            <p className="cuerpo">
              Cada punto es una calibración aprobada. Conforme el café reposa, se muele más fino.
              {estimada !== undefined && ` Con ${reposo} días de reposo, la tendencia apunta a ${estimada}.`}
            </p>
          </Seccion>
        )}

        <Seccion titulo="Historial">
          <div className="lista">
            {mem.aprobadas.map((s) => {
              const a = aprobadoDe(s)!;
              return (
                <a key={s.id} className="fila" href={`#/calibrar/sesion/${s.id}`}>
                  <span className="fila-texto">
                    <span>{cuando(s.jornada)} · molienda {a.molienda}</span>
                    <span className="fila-sub">{usuario(e, s.por)?.iniciales} · {s.diasReposo} días de reposo · {s.shots.length} shots</span>
                  </span>
                  <span className="fila-der">{a.rendimiento.toFixed(1)} g · {a.tiempo.toFixed(0)} s</span>
                </a>
              );
            })}
          </div>
        </Seccion>
      </main>
    </>
  );
}
