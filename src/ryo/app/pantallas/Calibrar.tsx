/**
 * Calibración de espresso: el corazón de la app.
 *
 * Tiene que sentirse como un instrumento, no como un formulario: steppers
 * que también se arrastran en lugar de teclado, el shot moviéndose por la
 * gráfica mientras se captura, brújula de sabor con el rastro de los shots
 * anteriores, y siempre a la vista el ajuste que toca aplicar.
 *
 * En barra hay dos cafés, el blend de la casa y el descafeinado: cada uno
 * tiene su receta del día y su ficha, y el inicio es un tablero de lo que
 * falta.
 *
 * Está hecha para la La Marzocco Linea Classic AV de un grupo de la barra:
 * - Es volumétrica y se programa en pulsos: el flujómetro cuenta el agua
 *   que entra al grupo y corta al llegar a los pulsos del botón. Cuenta
 *   agua, no bebida: con los mismos pulsos, el peso en taza cambia si
 *   cambian la molienda o la dosis, así que siempre se comprueba en báscula.
 * - La molienda mueve el tiempo; el peso se corrige con pulsos. La app
 *   aprende cuántos gramos mueve un pulso y dice a cuántos pulsos pasar.
 * - Con continuo, el barista corta en la báscula (cafés invitados).
 * - El tiempo lo marca la botonera: se captura, no se cronometra.
 * - Un solo PID para la caldera de café: la temperatura no es por café.
 */
import { useMemo, useState } from 'react';
import {
  useEstado, cafe as buscarCafe, usuario, nuevaSesion, guardarShot, evaluarShot, aprobarShot, terminarSesion,
  corregirShot, reabrirSesion, recetaDe, canastillaDe, cabe, HOLGURA_CANASTILLA, programarBoton, programarPulsos, pulsosDe, pulsosPara, maquinaDe, nombreBoton, programadoDe, avisar, celebrar,
  vibrar, CONTINUO,
  type Estado, type Cafe, type SesionCal, type Shot, type Maquina, type Canastilla,
} from '../estado';
import {
  Sup, Seccion, Stepper, Brujula, GraficaSesion, GraficaTendencia, Estado as Etq, Hoja, ir, describirSabor,
} from '../componentes';
import {
  sugerir, ratioTexto, ventanaRatio, tendencia, redondear, enVentana,
  GOTEO, type Objetivo, type Sabor, type Sugerencia,
} from '../lib/calibracion';
import { jornadaDe, diasEntre, hora, cuando, fechaCorta } from '../lib/tiempo';

/** Sin historial, se arranca a media escala del molino. */
const MOLIENDA_INICIAL = 6;

const reposoDe = (c: Cafe, jornada = jornadaDe()) => diasEntre(c.tueste, jornada);
const molinoDe = (e: Estado) => e.equipos.find((x) => x.tipo === 'molino' && x.uso !== 'filtrados');
const pasoDe = (e: Estado, molinoId?: string) => e.equipos.find((x) => x.id === molinoId)?.paso ?? 0.5;
const aprobadoDe = (s: SesionCal) => s.shots.find((x) => x.id === s.aprobadoId);
const alPaso = (v: number, paso: number) => redondear(Math.round(v / paso) * paso, 2);
const corto = (c: Cafe) => c.nombre.split(' · ')[0];
const primerNombre = (e: Estado, id?: string) => usuario(e, id)?.nombre.split(' ')[0] ?? 'Alguien';

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

/**
 * Con qué molienda arrancar hoy: con historia suficiente, lo que dice la
 * tendencia para los días de reposo de hoy (sin salirse de lo que ya se ha
 * usado); si no, lo último que funcionó.
 */
function puntoDePartida(e: Estado, c: Cafe, paso: number) {
  const mem = memoria(e, c.id);
  const reposo = reposoDe(c);
  if (mem.recta && mem.puntos.length >= 4) {
    const ys = mem.puntos.map((p) => p.y);
    const acotada = Math.min(Math.max(...ys) + 2 * paso, Math.max(Math.min(...ys) - 2 * paso, mem.recta(reposo)));
    return { molienda: alPaso(acotada, paso), fuente: 'tendencia' as const, mem, reposo };
  }
  if (mem.shot) return { molienda: mem.shot.molienda, fuente: 'ultima' as const, mem, reposo };
  return { molienda: undefined, fuente: 'nada' as const, mem, reposo };
}

/** El shot que sigue: cuenta el que está esperando sabor. */
const shotEnCurso = (s: SesionCal) => s.shots.length + (s.shots.some((x) => !x.sabor) ? 0 : 1);

/** Cómo se cambian los pulsos de un botón. */
function PasosProgramar({ boton, de, a, gramos }: { boton: string; de?: number; a: number; gramos: number }) {
  return (
    <ol className="pasos">
      <li>Entra a la programación de dosis de la máquina.</li>
      <li>En {boton}, {de ? `cambia de ${de} a ${a} pulsos` : `pon ${a} pulsos`}.</li>
      <li>Guarda y sal. No muevas molienda ni dosis en este shot.</li>
      <li>Tira un shot normal y pésalo: debería caer cerca de {gramos.toFixed(1)} g. Con ese peso la app afina cuánto mueve cada pulso.</li>
    </ol>
  );
}

const rangoCan = (c: Canastilla) => `${c.gramos - HOLGURA_CANASTILLA} a ${c.gramos + HOLGURA_CANASTILLA} g`;
/** Por qué una dosis no cabe en la canastilla. */
function avisoCanastilla(c: Canastilla | undefined, dosis: number) {
  const x = cabe(c, dosis);
  if (!c || x === 'bien') return null;
  return x === 'de-mas'
    ? `${dosis.toFixed(1)} g es de más para la canastilla de ${c.gramos} g (${rangoCan(c)}): el café toca la regadera y el agua no se reparte. Baja la dosis o cambia a una canastilla más grande.`
    : `${dosis.toFixed(1)} g es de menos para la canastilla de ${c.gramos} g (${rangoCan(c)}): queda espacio de sobra, la pastilla sale aguada y el agua se abre camino. Sube la dosis o cambia a una canastilla más chica.`;
}

/** "Reprograma Doble casa a 36 g" dicho en pulsos. */
function enPulsos(sug: Sugerencia, boton: string | undefined, de: number | undefined, a: number | undefined) {
  if (sug.reprogramar === undefined || !boton || !a) return sug.accion;
  return de && de !== a ? `${boton}: de ${de} a ${a} pulsos` : `${boton}: deja ${a} pulsos`;
}

const Dato = ({ etq, valor, grande }: { etq: string; valor: string; grande?: boolean }) => (
  <div className="pila-s" style={{ gap: 2 }}>
    <span className="etq">{etq}</span>
    <span className={grande ? 'num-l' : 'num-m'}>{valor}</span>
  </div>
);

const FilaDato = ({ etq, valor }: { etq: string; valor: string }) => (
  <div className="par">
    <span className="etq">{etq}</span>
    <span>{valor}</span>
  </div>
);

/* ═══ INICIO: EL TABLERO DEL DÍA ══════════════════════════ */

export function CalibrarInicio() {
  const e = useEstado();
  const m = maquinaDe(e);
  const hoy = jornadaDe();
  const activos = e.cafes.filter((x) => x.activo);
  const sesionesHoy = e.sesiones.filter((s) => s.jornada === hoy).sort((a, b) => b.inicio - a.inicio);
  const abiertaDe = (c: Cafe) => sesionesHoy.find((s) => s.cafeId === c.id && !s.fin);
  const listos = activos.filter((c) => recetaDe(e, hoy, c.id)).length;
  // El primer café sin receta ni sesión abierta es el que sigue: su botón va lleno.
  const siguiente = activos.find((c) => !recetaDe(e, hoy, c.id) && !abiertaDe(c));
  const paso = pasoDe(e, molinoDe(e)?.id);
  const usados = m?.botones.filter((b) => activos.some((x) => x.boton === b.id)) ?? [];

  return (
    <>
      <Sup
        titulo="Calibrar"
        sub={listos === activos.length ? 'Todos los cafés tienen receta hoy' : `${listos} de ${activos.length} cafés con receta hoy`}
      />
      <main className="pant pila">
        <div className="pila-s">
          {activos.map((c) => (
            <TarjetaCafe key={c.id} e={e} c={c} m={m} hoy={hoy} paso={paso} abierta={abiertaDe(c)} siguiente={siguiente?.id === c.id} />
          ))}
        </div>

        {m && (
          <Seccion titulo="Máquina" extra={`PID ${m.pid.toFixed(1)} °C`}>
            <p className="cuerpo">
              {m.detalle}. Volumétrica: cada botón corta al llegar a sus pulsos de agua. Aquí van los pulsos y lo que entregaron en la báscula la última vez (cada pulso mueve unos {m.gPorPulso.toFixed(2)} g en taza):
            </p>
            <div className="lista">
              {usados.map((b) => {
                const cafes = activos.filter((x) => x.boton === b.id).map(corto);
                const p = programadoDe(m, b.id);
                return (
                  <div key={b.id} className="fila">
                    <span className="fila-texto">
                      <span>{b.nombre}</span>
                      <span className="fila-sub">{cafes.join(', ')}{p ? ` · medido ${cuando(jornadaDe(p.en)).toLowerCase()} ${hora(p.en)}` : ''}</span>
                    </span>
                    <span className="fila-der">{pulsosDe(m, b.id) ? `${pulsosDe(m, b.id)} pulsos · ` : ''}{p ? `${p.gramos.toFixed(1)} g` : 'sin medir'}</span>
                  </div>
                );
              })}
            </div>
          </Seccion>
        )}

        {sesionesHoy.length > 0 && (
          <Seccion titulo="Sesiones de hoy">
            <div className="lista">
              {sesionesHoy.map((s) => {
                const c = buscarCafe(e, s.cafeId);
                return (
                  <a key={s.id} className="fila" href={`#/calibrar/sesion/${s.id}`}>
                    <span className="fila-texto">
                      <span>{c ? corto(c) : 'Café'}</span>
                      <span className="fila-sub">{usuario(e, s.por)?.iniciales} · {hora(s.inicio)} · {s.shots.length} shot{s.shots.length === 1 ? '' : 's'}</span>
                    </span>
                    {s.aprobadoId ? <Etq fuerte>Aprobada</Etq> : s.fin ? <Etq tenue>Sin aprobar</Etq> : <Etq>Abierta</Etq>}
                  </a>
                );
              })}
            </div>
          </Seccion>
        )}
      </main>
    </>
  );
}

/** Un café en el tablero: con receta se llena, como una casilla. */
function TarjetaCafe({ e, c, m, hoy, paso, abierta, siguiente }: {
  e: Estado; c: Cafe; m?: Maquina; hoy: string; paso: number; abierta?: SesionCal; siguiente: boolean;
}) {
  const rd = recetaDe(e, hoy, c.id);
  const mia = abierta?.por === e.usuarioId;
  const pp = puntoDePartida(e, c, paso);
  return (
    <section className={`bloque tarjeta-cafe${rd ? ' inv' : ''}`} aria-label={c.nombre}>
      <div className="fila-h entre" style={{ alignItems: 'flex-start' }}>
        <a className="subtitulo tarjeta-nombre" href={`#/calibrar/cafe/${c.id}`}>{c.nombre}</a>
        {abierta ? <Etq>Calibrando</Etq> : rd ? <Etq fuerte>Receta {hora(rd.en)}</Etq> : <Etq tenue>Pendiente</Etq>}
      </div>
      {rd ? (
        <>
          <span className="num-m">{rd.dosis.toFixed(1)} → {rd.rendimiento.toFixed(1)} g · {rd.tiempo.toFixed(0)} s</span>
          <span className="cuerpo">Molienda {rd.molienda} · {nombreBoton(m, rd.botonId)}{rd.pulsos ? ` a ${rd.pulsos} pulsos` : ''}{canastillaDe(m, rd.canastillaId) ? ` · canastilla ${canastillaDe(m, rd.canastillaId)!.gramos} g` : ''} · {pp.reposo} días de reposo · {primerNombre(e, rd.por)}</span>
        </>
      ) : (
        <span className="cuerpo">
          {nombreBoton(m, c.boton)} · {pp.reposo} días de reposo ·{' '}
          {abierta
            ? `${mia ? 'vas' : `${primerNombre(e, abierta.por)} va`} en el shot ${shotEnCurso(abierta)}`
            : pp.molienda !== undefined ? `arranca en molienda ${pp.molienda}` : 'sin historial'}
        </span>
      )}
      {abierta ? (
        <a className={`boton grande${mia ? ' lleno' : ''}`} href={`#/calibrar/sesion/${abierta.id}`}>
          {mia ? `Continuar · shot ${shotEnCurso(abierta)}` : `Ver la sesión de ${primerNombre(e, abierta.por)}`}
        </a>
      ) : rd ? (
        <a className="enlace" href={`#/calibrar/nueva/${c.id}`}>Recalibrar</a>
      ) : (
        <a className={`boton grande${siguiente ? ' lleno' : ''}`} href={`#/calibrar/nueva/${c.id}`}>Calibrar {corto(c)}</a>
      )}
      <a className="enlace" href={`#/calibrar/cafe/${c.id}`}>Ficha del café</a>
    </section>
  );
}

/* ═══ NUEVA SESIÓN ════════════════════════════════════════ */

export function CalibrarNueva({ cafeId: pedido }: { cafeId?: string }) {
  const e = useEstado();
  const m = maquinaDe(e);
  const hoy = jornadaDe();
  const cafes = e.cafes.filter((x) => x.activo);
  const molinos = e.equipos.filter((x) => x.tipo === 'molino' && x.uso !== 'filtrados');
  // Sin café pedido, el primero que no tiene receta hoy.
  const inicialCafe = cafes.find((x) => x.id === pedido)?.id ?? cafes.find((x) => !recetaDe(e, hoy, x.id))?.id ?? cafes[0]?.id;
  const [cafeId, setCafeId] = useState(inicialCafe);
  const [molinoId, setMolinoId] = useState(molinos[0]?.id);
  const [botonId, setBotonId] = useState(buscarCafe(e, inicialCafe)?.boton ?? CONTINUO);
  const [canId, setCanId] = useState(buscarCafe(e, inicialCafe)?.canastilla ?? m?.canastillas[0]?.id);
  const c = buscarCafe(e, cafeId);
  if (!c) return null;
  const paso = pasoDe(e, molinoId);
  const pp = puntoDePartida(e, c, paso);
  const o = c.objetivo;
  const [rmin, rmax] = ventanaRatio(o);
  const prog = programadoDe(m, botonId);
  const rd = recetaDe(e, hoy, c.id);
  const abierta = e.sesiones.find((s) => s.cafeId === c.id && s.jornada === hoy && !s.fin && s.por === e.usuarioId);

  const elegirCafe = (x: Cafe) => { setCafeId(x.id); setBotonId(x.boton); if (x.canastilla) setCanId(x.canastilla); vibrar(5); };
  const can = canastillaDe(m, canId);
  const noCabe = avisoCanastilla(can, o.dosis);
  const porque = pp.fuente === 'tendencia'
    ? `Con ${pp.reposo} días de reposo, la tendencia de ${pp.mem.puntos.length} calibraciones apunta aquí.${pp.mem.shot && pp.mem.ultima ? ` La última que funcionó fue ${pp.mem.shot.molienda}, ${cuando(pp.mem.ultima.jornada).toLowerCase()} con ${pp.mem.ultima.diasReposo} días.` : ''}`
    : pp.fuente === 'ultima' && pp.mem.ultima
      ? `Es lo último que funcionó con este café: ${cuando(pp.mem.ultima.jornada).toLowerCase()}, con ${pp.mem.ultima.diasReposo} días de reposo.`
      : 'Sin historial con este café: arranca a media escala y deja que la brújula te guíe.';

  return (
    <>
      <Sup titulo={`Calibrar ${corto(c)}`} sub={`${pp.reposo} días de reposo · tueste ${fechaCorta(c.tueste)}`} volver="calibrar" />
      <main className="pant pila">
        {abierta && (
          <a className="bloque bloque-toque" href={`#/calibrar/sesion/${abierta.id}`} style={{ textDecoration: 'none' }}>
            <span className="etq">Ya tienes una sesión abierta</span>
            <span className="cuerpo">
              La empezaste a las {hora(abierta.inicio)} y vas en el shot {shotEnCurso(abierta)}. Toca para seguir ahí.
            </span>
          </a>
        )}

        <section className="bloque inv cambia" key={`${c.id}-${molinoId}`} aria-label="Punto de partida">
          <span className="etq">Arranca con</span>
          <div className="rejilla-2">
            <Dato etq="Molienda" valor={String(pp.molienda ?? MOLIENDA_INICIAL)} grande />
            <Dato etq="Dosis" valor={`${o.dosis.toFixed(1)} g`} grande />
          </div>
          <p className="cuerpo">{porque}</p>
        </section>

        {rd && (
          <p className="cuerpo">
            Hoy ya hay receta: {rd.dosis.toFixed(1)} → {rd.rendimiento.toFixed(1)} g · {rd.tiempo.toFixed(0)} s, de {primerNombre(e, rd.por)} a las {hora(rd.en)}. Si apruebas otro shot, la reemplaza.
          </p>
        )}

        {cafes.length > 1 && (
          <Seccion titulo="Café">
            <div className="chips">
              {cafes.map((x) => (
                <button key={x.id} type="button" className="chip" aria-pressed={x.id === cafeId} onClick={() => elegirCafe(x)}>
                  {corto(x)}{recetaDe(e, hoy, x.id) ? ' · con receta' : ''}
                </button>
              ))}
            </div>
          </Seccion>
        )}

        {m && m.canastillas.length > 0 && (
          <Seccion titulo="Canastilla" extra="La que está en el portafiltro">
            <div className="chips">
              {m.canastillas.map((x) => (
                <button key={x.id} type="button" className="chip" aria-pressed={x.id === canId} onClick={() => { setCanId(x.id); vibrar(5); }}>
                  {x.nombre} · {x.gramos} g
                </button>
              ))}
            </div>
            {noCabe
              ? <p className="bloque inv recta" role="alert">{noCabe}</p>
              : can && <p className="cuerpo">Le caben de {rangoCan(can)}: los {o.dosis} g de la receta van bien. Si cambias de canastilla cambia cuánta agua retiene el café, así que hay que volver a ajustar molienda y pulsos.</p>}
          </Seccion>
        )}

        <Seccion titulo="Objetivo">
          <div className="lista">
            <FilaDato etq="Receta" valor={`${o.dosis} g → ${o.rendimiento} g`} />
            <FilaDato etq="Tiempo" valor={`${o.tiempo} ± ${o.tolTiempo} s`} />
            <FilaDato etq="Ratio" valor={`1:${(o.rendimiento / o.dosis).toFixed(2)} · ventana 1:${rmin.toFixed(2)}–1:${rmax.toFixed(2)}`} />
            {m && <FilaDato etq="Temperatura" valor={`PID ${m.pid.toFixed(1)} °C`} />}
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
                : `La máquina corta sola al llegar a ${pulsosDe(m, botonId) ?? '—'} pulsos de agua. ${prog ? `Hoy eso entrega ${prog.gramos.toFixed(1)} g en taza.` : 'Todavía sin medir en la báscula.'} La molienda mueve el tiempo; el peso se corrige con pulsos.`}
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
            onClick={() => { const id = nuevaSesion(c.id, molinoId, pp.reposo, botonId, canId); vibrar(15); ir(`calibrar/sesion/${id}`); }}
          >{abierta ? 'Empezar otra sesión' : `Empezar con ${corto(c)}`}</button>
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

type Datos = { dosis: number; rendimiento: number; molienda: number; tiempo: number; pulsos?: number };

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
  const [corrigiendo, setCorrigiendo] = useState(false);

  // La sugerencia de un shot ya probado es el ajuste que toca en el siguiente.
  const sugDe = (x?: Shot): Sugerencia | undefined => (x?.sabor ? sugerir(x, o, paso, ctx) : undefined);
  const porAplicar = (x?: Shot) => { const g = sugDe(x); return g && !g.aprobar ? g : undefined; };

  // Con qué arranca el siguiente shot: el ajuste sugerido sobre el anterior,
  // o el punto de partida del café si es el primero. Con botón, el peso
  // esperado es lo que el botón entrega hoy.
  const inicial = useMemo((): Datos => {
    const sug = sugDe(ultimo);
    if (ultimo && sug) {
      const dosis = sug.ajuste.dosis ?? ultimo.dosis;
      return {
        dosis,
        rendimiento: sug.ajuste.rendimiento ?? (conBoton ? ultimo.rendimiento : redondear(dosis * (o.rendimiento / o.dosis))),
        molienda: sug.ajuste.molienda ?? ultimo.molienda,
        tiempo: ultimo.tiempo,
        pulsos: conBoton ? pulsosDe(m, s.botonId) ?? ultimo.pulsos : undefined,
      };
    }
    const prog = conBoton ? programadoDe(m, s.botonId) : undefined;
    return {
      dosis: o.dosis, rendimiento: prog?.gramos ?? o.rendimiento, molienda: puntoDePartida(e, c, paso).molienda ?? MOLIENDA_INICIAL, tiempo: o.tiempo,
      pulsos: conBoton ? pulsosDe(m, s.botonId) : undefined,
    };
  }, [s.shots.length, ultimo?.sabor]); // eslint-disable-line react-hooks/exhaustive-deps

  // `antes` guarda la evaluación del shot; si hay que confirmar el reemplazo,
  // espera a la confirmación para no dejar la sesión a medias.
  const aprobar = (shot: Shot, antes: () => void) => {
    const actual = recetaDe(e, hoy, s.cafeId);
    if (actual && actual.sesionId !== s.id) { setConfirmar({ shot, antes }); return; }
    antes();
    fijar(shot);
  };
  const fijar = (shot: Shot) => {
    aprobarShot(s.id, shot.id);
    vibrar([30, 60, 30]);
    celebrar('Receta del día.', `${corto(c)} · ${shot.dosis.toFixed(1)} → ${shot.rendimiento.toFixed(1)} g · ${shot.tiempo.toFixed(0)} s. Ya la ve todo el turno.`);
    window.scrollTo({ top: 0 });
  };
  const terminar = () => {
    terminarSesion(s.id);
    vibrar(10);
    avisar('Sesión cerrada sin receta.', { etiqueta: 'Deshacer', hacer: () => reabrirSesion(s.id) });
  };

  const n = pendiente ? pendiente.n : s.shots.length + 1;
  const actual = recetaDe(e, hoy, s.cafeId);
  const modo = cerrada ? 'cierre' : pendiente ? (corrigiendo ? 'corregir' : 'sabor') : 'shot';
  const anteriorA = (x: Shot) => s.shots.find((y) => y.n === x.n - 1);

  return (
    <>
      <Sup
        titulo={cerrada ? 'Sesión cerrada' : modo === 'corregir' ? `Shot ${n} · corregir` : pendiente ? `Shot ${n} · sabor` : `Shot ${n}`}
        sub={`${c.nombre} · ${s.diasReposo} días de reposo`}
        volver="calibrar"
        accion={cerrada ? undefined : { texto: 'Terminar', hacer: terminar }}
      />
      <main className="pant pila">
        <p className="etq" aria-label="Receta y máquina">
          {conBoton ? `Botón ${boton}` : 'Continuo'}{canastillaDe(m, s.canastillaId) ? ` · canastilla de ${canastillaDe(m, s.canastillaId)!.gramos} g` : ''} · objetivo {o.dosis} → {o.rendimiento} g en {o.tiempo} ± {o.tolTiempo} s{m ? ` · PID ${m.pid.toFixed(1)} °C` : ''}
        </p>

        {modo === 'cierre' ? (
          <Cierre e={e} s={s} c={c} m={m} />
        ) : modo === 'corregir' && pendiente ? (
          <Composer
            key={`corregir-${pendiente.id}`} n={n} inicial={pendiente} objetivo={o} paso={paso} s={s} m={m}
            previo={anteriorA(pendiente)} ajuste={porAplicar(anteriorA(pendiente))} otros={s.shots.filter((x) => x.id !== pendiente.id)}
            textoGuardar={`Guardar corrección del shot ${n}`}
            onGuardar={(d) => { corregirShot(s.id, pendiente.id, d); setCorrigiendo(false); vibrar(12); avisar(`Shot ${n} corregido.`); window.scrollTo({ top: 0 }); }}
            onCancelar={() => { setCorrigiendo(false); window.scrollTo({ top: 0 }); }}
          />
        ) : modo === 'sabor' && pendiente ? (
          <Evaluacion
            key={pendiente.id} shot={pendiente} previos={s.shots.filter((x) => x.sabor)} objetivo={o} paso={paso} s={s} ctx={ctx} m={m}
            onAprobar={aprobar} onCorregir={() => { setCorrigiendo(true); window.scrollTo({ top: 0 }); }}
          />
        ) : (
          <Composer
            key={s.shots.length} n={n} inicial={inicial} objetivo={o} paso={paso} s={s} m={m}
            previo={ultimo} ajuste={porAplicar(ultimo)} otros={s.shots}
            onGuardar={(d) => { guardarShot(s.id, d); vibrar(15); window.scrollTo({ top: 0 }); }}
          />
        )}

        {s.shots.length > 0 && (
          <Seccion titulo="La sesión" extra={`${s.shots.length} shot${s.shots.length === 1 ? '' : 's'}`}>
            {/* Al capturar, la gráfica ya va arriba con el shot en vivo. */}
            {(modo === 'sabor' || modo === 'cierre') && (
              <>
                <GraficaSesion shots={s.shots} objetivo={o} dosis={o.dosis} />
                <p className="cuerpo">La zona con trama es la receta objetivo. Cada shot debería acercarse a ella.</p>
              </>
            )}
            <div className="lista">
              {s.shots.map((x) => {
                const v = enVentana(x, o);
                return (
                  <div key={x.id} className="fila">
                    <span className="avatar" style={{ borderRadius: 0 }}>{x.n}</span>
                    <span className="fila-texto">
                      <span>{x.rendimiento.toFixed(1)} g · {x.tiempo.toFixed(0)} s</span>
                      <span className="fila-sub">
                        {x.dosis.toFixed(1)} g · molienda {x.molienda}{x.pulsos ? ` · ${x.pulsos} pulsos` : ''} · {ratioTexto(x.dosis, x.rendimiento)} · {x.sabor ? describirSabor(x.sabor) : 'sin probar'}
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

      <Hoja abierta={!!confirmar} alCerrar={() => setConfirmar(null)} titulo={`Reemplazar receta de ${corto(c)}`}>
        {actual && (
          <p className="cuerpo">
            Hoy ya hay receta de {corto(c)}, fijada a las {hora(actual.en)} por {usuario(e, actual.por)?.nombre}: {actual.dosis} g → {actual.rendimiento} g · {actual.tiempo} s · molienda {actual.molienda}.
            Si apruebas este shot, todo el turno pasa a la nueva receta.
          </p>
        )}
        <button type="button" className="boton grande lleno" onClick={() => { const x = confirmar!; setConfirmar(null); x.antes(); fijar(x.shot); }}>Reemplazar y fijar</button>
      </Hoja>
    </>
  );
}

/* ── Registrar el shot ─────────────────────────────────── */

/**
 * Captura de un shot. `previo` es el shot anterior (para decir qué cambió) y
 * `ajuste` lo que sugirió: arriba, para no olvidarlo camino al molino.
 */
function Composer({ n, inicial, objetivo, paso, s, m, previo, ajuste, otros, textoGuardar, onGuardar, onCancelar }: {
  n: number; inicial: Datos; objetivo: Objetivo; paso: number; s: SesionCal; m?: Maquina;
  previo?: Shot; ajuste?: Sugerencia; otros: Shot[]; textoGuardar?: string;
  onGuardar: (d: Datos) => void; onCancelar?: () => void;
}) {
  const [dosis, setDosis] = useState(inicial.dosis);
  const [rendimiento, setRendimiento] = useState(inicial.rendimiento);
  const [molienda, setMolienda] = useState(inicial.molienda);
  const [tiempo, setTiempo] = useState(Math.round(inicial.tiempo));
  const [pulsos, setPulsos] = useState(inicial.pulsos ?? 120);
  const rObj = objetivo.rendimiento / objetivo.dosis;
  const [rmin, rmax] = ventanaRatio(objetivo);
  const r = rendimiento / dosis;
  const conBoton = s.botonId !== CONTINUO;
  const corte = redondear(dosis * rObj - GOTEO);
  const v = enVentana({ dosis, rendimiento, tiempo, molienda }, objetivo);
  const dT = tiempo - objetivo.tiempo;
  const decMol = paso < 1 ? 1 : 0;

  // Qué cambió contra el shot anterior, y si es lo que se sugirió.
  const cambio = (valor: number, antes: number | undefined, sugerido: number | undefined, dec: number, unidad = '') => {
    if (!previo || antes === undefined) return undefined;
    if (Math.abs(valor - antes) < 1e-6) return `Igual que el shot ${previo.n}.`;
    const txt = `Shot ${previo.n}: ${antes.toFixed(dec)}${unidad} → ${valor.toFixed(dec)}${unidad}`;
    return sugerido !== undefined && Math.abs(sugerido - valor) < 1e-6 ? `${txt}, el ajuste sugerido.` : `${txt}.`;
  };
  const movidas = !previo ? [] : [
    Math.abs(molienda - previo.molienda) > 1e-6 && 'molienda',
    Math.abs(dosis - previo.dosis) > 0.05 && 'dosis',
    conBoton && previo.pulsos !== undefined && pulsos !== previo.pulsos && 'pulsos',
  ].filter(Boolean) as string[];
  const k = m?.gPorPulso ?? 0.5;
  const can = canastillaDe(m, s.canastillaId);
  const noCabe = avisoCanastilla(can, dosis);
  const datos = (): Datos => ({ dosis, rendimiento, molienda, tiempo, ...(conBoton ? { pulsos } : {}) });

  return (
    <div className="pila cambia">
      {ajuste && previo && (
        <section className="bloque inv" aria-label="Ajuste a aplicar">
          <span className="etq">Ajuste del shot {previo.n}</span>
          <p className="subtitulo">{enPulsos(ajuste, nombreBoton(m, s.botonId), previo.pulsos, inicial.pulsos)}</p>
          {ajuste.reprogramar !== undefined && (
            <p className="cuerpo">Para que entregue {ajuste.reprogramar.toFixed(1)} g. Los pulsos ya van así abajo; pesa el shot para comprobarlo.</p>
          )}
        </section>
      )}

      <Seccion titulo="Antes del shot">
        <Stepper etiqueta={`Molienda · paso ${paso}`} valor={molienda} paso={paso} min={0} max={40} dec={decMol} onCambio={setMolienda}
          nota={cambio(molienda, previo?.molienda, ajuste?.ajuste.molienda, decMol)} />
        <Stepper etiqueta={can ? `Dosis · canastilla de ${can.gramos} g` : 'Dosis'} valor={dosis} paso={0.1} min={5} max={25} unidad=" g" onCambio={setDosis}
          fuera={!!noCabe}
          nota={[cambio(dosis, previo?.dosis, ajuste?.ajuste.dosis, 1, ' g'), can && !noCabe ? `Cabe: la canastilla va de ${rangoCan(can)}.` : null].filter(Boolean).join(' ') || undefined} />
        {noCabe && <p className="bloque inv recta" role="alert">{noCabe}</p>}
        {conBoton && (
          <Stepper etiqueta={`Pulsos de ${nombreBoton(m, s.botonId)}`} valor={pulsos} paso={1} min={20} max={400} dec={0} onCambio={setPulsos}
            nota={`${cambio(pulsos, previo?.pulsos, inicial.pulsos, 0) ?? 'Lo que tiene programado el botón.'} Cada pulso mueve unos ${k.toFixed(2)} g en taza.`} />
        )}
        {movidas.length > 1 && (
          <p className="bloque cuerpo" role="note">
            Moviste {movidas.join(' y ')}. Mueve una sola cosa por shot, así sabes qué cambió el sabor.
          </p>
        )}
      </Seccion>

      <Seccion titulo="El shot">
        <p className="cuerpo">
          {conBoton
            ? `Engancha, báscula en cero y presiona ${nombreBoton(m, s.botonId)}. La máquina corta sola: anota el tiempo de la botonera y pesa cuando deje de gotear.`
            : `Presiona continuo y corta cuando la báscula marque ${corte.toFixed(1)} g. Anota el tiempo de la botonera.`}
        </p>
        <Stepper etiqueta="Tiempo en la botonera" valor={tiempo} paso={1} min={5} max={60} dec={0} unidad=" s" onCambio={setTiempo}
          fuera={!v.tiempo}
          nota={v.tiempo
            ? `En tiempo: objetivo ${objetivo.tiempo} ± ${objetivo.tolTiempo} s.`
            : `${Math.abs(dT)} s ${dT < 0 ? 'rápido' : 'lento'}: objetivo ${objetivo.tiempo} ± ${objetivo.tolTiempo} s.`} />
        <Stepper etiqueta={conBoton ? 'Lo que marcó la báscula' : 'Rendimiento en la báscula'} valor={rendimiento} paso={0.1} min={10} max={80} unidad=" g"
          onCambio={setRendimiento} fuera={!v.ratio}
          nota={`Ratio 1:${r.toFixed(2)}, ${v.ratio ? 'en ventana' : r < rmin ? 'corto' : 'largo'} (1:${rmin.toFixed(2)}–1:${rmax.toFixed(2)}).`} />
      </Seccion>

      <Seccion titulo="Dónde cae" extra={v.tiempo && v.ratio ? 'En la zona' : 'Fuera de la zona'}>
        <GraficaSesion shots={otros} objetivo={objetivo} dosis={objetivo.dosis} vivo={{ n, tiempo, rendimiento }} />
        <p className="cuerpo">La zona con trama es la receta objetivo. El shot {n} se mueve con los números; se llena al caer en la zona.</p>
      </Seccion>

      <div className="pie-accion pila-s">
        <button type="button" className="boton grande lleno" onClick={() => onGuardar(datos())}>
          {textoGuardar ?? `Guardar shot ${n} y probar`}
        </button>
        {onCancelar && (
          <button type="button" className="enlace" style={{ alignSelf: 'center' }} onClick={onCancelar}>Cancelar</button>
        )}
      </div>
    </div>
  );
}

/* ── Probar y decidir ──────────────────────────────────── */

/** Atajos de la brújula: cada uno mueve un eje y deja el otro como está. */
const ATAJOS: { texto: string; eje: 'x' | 'y'; v: number }[] = [
  { texto: 'Ácido', eje: 'x', v: -0.6 },
  { texto: 'Amargo', eje: 'x', v: 0.6 },
  { texto: 'Débil', eje: 'y', v: -0.6 },
  { texto: 'Intenso', eje: 'y', v: 0.6 },
];

function Evaluacion({ shot, previos, objetivo, paso, s, ctx, m, onAprobar, onCorregir }: {
  shot: Shot; previos: Shot[]; objetivo: Objetivo; paso: number; s: SesionCal; m?: Maquina;
  ctx: { boton?: string; pid?: number }; onAprobar: (s: Shot, antes: () => void) => void; onCorregir: () => void;
}) {
  const [sabor, setSabor] = useState<Sabor | undefined>(shot.sabor);
  const sug = sabor ? sugerir({ ...shot, sabor }, objetivo, paso, ctx) : null;
  const v = enVentana(shot, objetivo);

  const guardar = () => evaluarShot(s.id, shot.id, { sabor });
  // El peso que pide la sugerencia, en pulsos de esta máquina.
  const pulsosAhora = shot.pulsos ?? pulsosDe(m, s.botonId);
  const pulsosNuevos = sug?.reprogramar !== undefined && pulsosAhora ? pulsosPara(m, pulsosAhora, shot.rendimiento, sug.reprogramar) : undefined;
  const activo = (a: (typeof ATAJOS)[number]) => !!sabor && (a.v < 0 ? sabor[a.eje] < -0.25 : sabor[a.eje] > 0.25);
  // Tocar un atajo activo regresa ese eje al centro.
  const atajo = (a: (typeof ATAJOS)[number]) => {
    const b = sabor ?? { x: 0, y: 0 };
    setSabor({ ...b, [a.eje]: activo(a) ? 0 : a.v });
    vibrar(6);
  };
  const balance = !!sabor && describirSabor(sabor) === 'balanceado';

  return (
    <div className="pila cambia">
      <section className="bloque">
        <div className="fila-h entre">
          <span className="etq">Shot {shot.n}</span>
          <span className="chips">
            <Etq {...(v.tiempo ? { fuerte: true } : { alerta: true })}>{v.tiempo ? 'Tiempo ok' : shot.tiempo < objetivo.tiempo ? 'Rápido' : 'Lento'}</Etq>
            <Etq {...(v.ratio ? { fuerte: true } : { alerta: true })}>{v.ratio ? 'Ratio ok' : 'Ratio fuera'}</Etq>
          </span>
        </div>
        <span className="num-m">{shot.dosis.toFixed(1)} → {shot.rendimiento.toFixed(1)} g · {shot.tiempo.toFixed(0)} s</span>
        <span className="cuerpo">molienda {shot.molienda}{shot.pulsos ? ` · ${shot.pulsos} pulsos` : ''} · {ratioTexto(shot.dosis, shot.rendimiento)}</span>
        <button type="button" className="enlace" onClick={onCorregir}>Corregir números</button>
      </section>

      <Seccion titulo="¿Cómo sabe?" extra={sabor ? describirSabor(sabor) : 'Toca o arrastra'}>
        <Brujula valor={sabor} previos={previos.map((x) => ({ n: x.n, sabor: x.sabor! }))} onCambio={setSabor} />
        <div className="chips" role="group" aria-label="Atajos de sabor">
          {ATAJOS.map((a) => (
            <button key={a.texto} type="button" className="chip" aria-pressed={activo(a)} onClick={() => atajo(a)}>{a.texto}</button>
          ))}
          <button type="button" className="chip" aria-pressed={balance} onClick={() => { setSabor({ x: 0, y: 0 }); vibrar(6); }}>Balanceado</button>
        </div>
        {previos.length > 0 && (
          <p className="cuerpo">Los cuadros punteados son los shots que ya probaste: el sabor debería ir cerrándose hacia el centro.</p>
        )}
      </Seccion>

      {sug && (
        <section className={`bloque${sug.aprobar ? ' inv' : ''}`} aria-live="polite">
          <span className="etq">{sug.aprobar ? 'Listo' : 'Siguiente ajuste'}</span>
          <p className="subtitulo">{enPulsos(sug, ctx.boton, pulsosAhora, pulsosNuevos)}</p>
          <p className="cuerpo">{sug.porque}</p>
          {sug.reprogramar !== undefined && ctx.boton && pulsosNuevos && (
            <>
              <p className="cuerpo">
                Meta: {sug.reprogramar.toFixed(1)} g en taza (hoy salen {shot.rendimiento.toFixed(1)} g). En esta máquina cada pulso mueve unos {(m?.gPorPulso ?? 0.5).toFixed(2)} g.
              </p>
              <PasosProgramar boton={ctx.boton} de={pulsosAhora} a={pulsosNuevos} gramos={sug.reprogramar} />
            </>
          )}
        </section>
      )}

      <div className="pie-accion pila-s">
        {sug?.aprobar ? (
          <>
            <button type="button" className="boton grande lleno" onClick={() => onAprobar(shot, guardar)}>Aprobar shot {shot.n}</button>
            <button type="button" className="enlace" style={{ alignSelf: 'center' }} onClick={() => { guardar(); window.scrollTo({ top: 0 }); }}>Hacer otro shot</button>
          </>
        ) : (
          <>
            <button type="button" className="boton grande lleno" disabled={!sabor}
              onClick={() => {
                if (sug?.reprogramar !== undefined) {
                  programarBoton(s.botonId, sug.reprogramar);
                  if (pulsosNuevos) programarPulsos(s.botonId, pulsosNuevos);
                  avisar(pulsosNuevos ? `${ctx.boton} en ${pulsosNuevos} pulsos.` : `${ctx.boton} reprogramado a ${sug.reprogramar.toFixed(1)} g.`);
                }
                guardar();
                vibrar(12);
                window.scrollTo({ top: 0 });
              }}>
              {!sabor ? 'Toca la brújula para seguir' : pulsosNuevos ? `Ya lo puse en ${pulsosNuevos} pulsos · siguiente shot` : sug?.reprogramar !== undefined ? 'Ya lo reprogramé · siguiente shot' : 'Siguiente shot con el ajuste'}
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

function Cierre({ e, s, c, m }: { e: Estado; s: SesionCal; c: Cafe; m?: Maquina }) {
  const a = aprobadoDe(s);
  const hoy = jornadaDe();
  const esHoy = s.jornada === hoy;
  const conBoton = s.botonId !== CONTINUO;
  const faltan = esHoy ? e.cafes.filter((x) => x.activo && x.id !== s.cafeId && !recetaDe(e, hoy, x.id)) : [];
  return (
    <>
      {a ? (
        <section className="bloque inv">
          <span className="etq">Receta de {corto(c)} · shot {a.n}</span>
          <span className="num-m">{a.dosis.toFixed(1)} → {a.rendimiento.toFixed(1)} g · {a.tiempo.toFixed(0)} s</span>
          <span className="cuerpo">
            Molienda {a.molienda} · {ratioTexto(a.dosis, a.rendimiento)} ·{' '}
            {conBoton ? `botón ${nombreBoton(m, s.botonId)}${a.pulsos ? ` a ${a.pulsos} pulsos` : ''}` : `continuo, cortando en ${(a.rendimiento - GOTEO).toFixed(1)} g`}
          </span>
        </section>
      ) : (
        <section className="bloque">
          <span className="etq">Sin receta</span>
          <p className="cuerpo">Se cerró sin aprobar ningún shot.</p>
          {esHoy && s.por === e.usuarioId && (
            <button type="button" className="boton" onClick={() => { reabrirSesion(s.id); vibrar(10); }}>Reabrir la sesión</button>
          )}
        </section>
      )}

      {esHoy && (
        <Seccion titulo="Qué sigue">
          {faltan.length ? (
            <div className="pila-s">
              {faltan.map((x, i) => (
                <a key={x.id} className={`boton grande${i === 0 ? ' lleno' : ''}`} href={`#/calibrar/nueva/${x.id}`}>Calibrar {corto(x)}</a>
              ))}
            </div>
          ) : (
            <p className="cuerpo">{a ? 'Todos los cafés tienen receta del día.' : 'Los demás cafés ya tienen receta del día.'}</p>
          )}
          <a className="enlace" href="#/inicio">Volver a Inicio</a>
        </Seccion>
      )}
    </>
  );
}

/* ═══ FICHA DEL CAFÉ ══════════════════════════════════════ */

export function CalibrarCafe({ id }: { id: string }) {
  const e = useEstado();
  const c = buscarCafe(e, id);
  if (!c) return <><Sup titulo="Café" volver="calibrar" /><main className="pant"><p className="cuerpo">No encontrado.</p></main></>;
  const m = maquinaDe(e);
  const hoy = jornadaDe();
  const paso = pasoDe(e, molinoDe(e)?.id);
  const pp = puntoDePartida(e, c, paso);
  const mem = pp.mem;
  const o = c.objetivo;
  const [rmin, rmax] = ventanaRatio(o);
  const rd = recetaDe(e, hoy, c.id);
  const abierta = e.sesiones.find((s) => s.cafeId === c.id && s.jornada === hoy && !s.fin && s.por === e.usuarioId);

  return (
    <>
      <Sup titulo={c.nombre} sub={c.casa ? 'El espresso de todas las bebidas del menú' : 'Ficha del café'} volver="calibrar" />
      <main className="pant pila">
        <div className="rejilla-2">
          <div className="bloque"><span className="etq">Días de reposo</span><span className="num-l">{pp.reposo}</span></div>
          <div className="bloque"><span className="etq">Tueste</span><span className="num-m">{fechaCorta(c.tueste)}</span></div>
        </div>

        <Seccion titulo="Ficha del café">
          <div className="lista">
            <FilaDato etq="Origen" valor={c.origen} />
            <FilaDato etq="Proceso" valor={c.proceso} />
            <FilaDato etq="Tostador" valor={c.tostador} />
            <FilaDato etq="Notas de cata" valor={c.notas} />
          </div>
        </Seccion>

        {rd ? (
          <section className="bloque inv">
            <span className="etq">Receta de hoy · {hora(rd.en)} · {primerNombre(e, rd.por)}</span>
            <span className="num-m">{rd.dosis.toFixed(1)} → {rd.rendimiento.toFixed(1)} g · {rd.tiempo.toFixed(0)} s</span>
            <span className="cuerpo">Molienda {rd.molienda} · {nombreBoton(m, rd.botonId)}</span>
          </section>
        ) : (
          <section className="bloque">
            <span className="etq">Hoy</span>
            <p className="cuerpo">
              Sin receta del día todavía.{pp.molienda !== undefined ? ` Arranca en molienda ${pp.molienda}.` : ''}
            </p>
          </section>
        )}

        <Seccion titulo="Receta objetivo">
          <div className="lista">
            <FilaDato etq="Dosis" valor={`${o.dosis} g`} />
            <FilaDato etq="Rendimiento" valor={`${o.rendimiento} g`} />
            <FilaDato etq="Tiempo" valor={`${o.tiempo} ± ${o.tolTiempo} s`} />
            <FilaDato etq="Ratio" valor={`1:${(o.rendimiento / o.dosis).toFixed(2)} (1:${rmin.toFixed(2)}–1:${rmax.toFixed(2)})`} />
            <FilaDato etq="Botón" valor={`${nombreBoton(m, c.boton)}${pulsosDe(m, c.boton) ? ` · ${pulsosDe(m, c.boton)} pulsos` : ''}`} />
            {canastillaDe(m, c.canastilla) && <FilaDato etq="Canastilla" valor={`${canastillaDe(m, c.canastilla)!.nombre} · ${canastillaDe(m, c.canastilla)!.gramos} g`} />}
            {m && <FilaDato etq="Temperatura" valor={`PID ${m.pid.toFixed(1)} °C, igual para todos`} />}
          </div>
        </Seccion>

        {mem.puntos.length > 1 && (
          <Seccion titulo="Molienda contra reposo" extra={`${mem.puntos.length} calibraciones`}>
            <GraficaTendencia puntos={mem.puntos} recta={mem.recta} hoy={pp.reposo} />
            <p className="cuerpo">
              Cada punto es una calibración aprobada. Conforme el café reposa, se muele más fino.
              {pp.fuente === 'tendencia' && ` Con ${pp.reposo} días de reposo, la tendencia apunta a ${pp.molienda}.`}
            </p>
          </Seccion>
        )}

        {mem.aprobadas.length > 0 && (
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
        )}

        <div className="pie-accion">
          <a className="boton grande lleno" href={abierta ? `#/calibrar/sesion/${abierta.id}` : `#/calibrar/nueva/${c.id}`}>
            {abierta ? `Continuar · shot ${shotEnCurso(abierta)}` : rd ? `Recalibrar ${corto(c)}` : `Calibrar ${corto(c)}`}
          </a>
        </div>
      </main>
    </>
  );
}
