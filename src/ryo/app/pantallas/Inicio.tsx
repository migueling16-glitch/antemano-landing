/**
 * Inicio: qué hacer ahora.
 *
 * - "Ahora": lo siguiente por hacer, con un solo botón que lleva directo a
 *   hacerlo. Es el aviso en el momento justo (Fogg: sin aviso no hay
 *   conducta; y hacerla fácil pesa más que motivar).
 * - "Lo que toca hoy": casillas con lo que falta primero (lo atrasado
 *   arriba) y lo hecho tachado al final. La barra que se llena aprovecha el
 *   efecto de gradiente de meta: entre más cerca, más ganas de terminar.
 * - "Tu semana": lo que cada quien lleva desde el lunes, solo para esa
 *   persona. Sin rachas ni ranking: en un trabajo por turnos, una racha
 *   castiga el día de descanso.
 */
import {
  useEstado, yo, usuario, plantillasDeHoy, ejecucionDe, fueraDeRango, progresoDe, puede, maquinaDe, nombreBoton,
  plantilla as buscarPlantilla, cafe as buscarCafe, recetaCasa, recetaDe, avisosDe, marcarLeida, marcarTodasLeidas,
  type Estado, type Usuario,
} from '../estado';
import { Sup, Seccion, Estado as Etq, Casilla, Vacio, BarraProg, Pista } from '../componentes';
import { personasDe, turnosDe, horasDe } from '../lib/turnos';
import { resumen } from './Checklists';
import { porDecidir } from './Panel';
import { tocaHoy } from '../lib/repaso';
import { jornadaDe, hora, fechaCorta, nombreDia, lunesDe, sumarDias, cuando, dgo, tsDgo, minutos, minutosAhora } from '../lib/tiempo';

/** El turno publicado de alguien en una fecha. */
export function turnoDe(e: Estado, usuarioId: string, fecha: string) {
  const sem = e.semanas.find((s) => s.id === lunesDe(fecha) && s.estado === 'publicada');
  const id = sem?.turnos[`${usuarioId}|${fecha}`];
  return id ? e.turnosTipo.find((t) => t.id === id) : undefined;
}

function saludo() {
  const h = dgo().getHours();
  return h >= 5 && h < 12 ? 'Buenos días' : h >= 12 && h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

const corto = (nombre: string) => nombre.split(' · ')[0];
const diaYNum = (f: string) => `${nombreDia(f).toLowerCase()} ${fechaCorta(f).split(' ').slice(1).join(' ')}`;

/* ═══ LO QUE TOCA ═════════════════════════════════════════ */

export type Tarea = {
  id: string;
  texto: string;
  detalle: string;
  ruta: string;
  hecha: boolean;
  /** Ya pasó su hora límite, o sin ella no se puede servir. */
  urgente?: boolean;
  /** El verbo del botón que lleva a hacerla. */
  accion: string;
};

const ordenar = (t: Tarea[]) =>
  [...t].sort((a, b) => Number(a.hecha) - Number(b.hecha) || Number(!!b.urgente) - Number(!!a.urgente));

/** Lo que le toca hoy a cualquiera en barra. */
export function tareasDe(e: Estado, u: Usuario, hoy = jornadaDe()): Tarea[] {
  const t: Tarea[] = [];

  for (const p of plantillasDeHoy(e, hoy)) {
    const ej = ejecucionDe(e, p.id, hoy);
    const r = resumen(p, ej);
    t.push({
      id: `checklist-${p.id}`,
      texto: `Checklist de ${p.nombre.toLowerCase()}`,
      detalle: r.hecho
        ? `Hecho a las ${hora(ej!.completadaEn!)} por ${usuario(e, ej!.completadaPor)?.nombre.split(' ')[0]}`
        : ej ? `Vas en ${r.hechas} de ${r.total} · antes de las ${p.horaLimite}` : `${r.total} tareas · antes de las ${p.horaLimite}`,
      ruta: ej ? `#/checklists/ej/${ej.id}` : '#/checklists',
      hecha: r.hecho,
      urgente: r.atrasada,
      accion: ej ? 'Seguir el checklist' : 'Empezar el checklist',
    });
  }

  const activos = e.cafes.filter((c) => c.activo);
  const faltan = activos.filter((c) => !recetaDe(e, hoy, c.id));
  const casa = activos.find((c) => c.casa);
  t.push({
    id: 'calibrar',
    texto: 'Calibrar espresso',
    detalle: !faltan.length
      ? `Los ${activos.length} cafés tienen receta de hoy`
      : `Falta: ${faltan.map((c) => corto(c.nombre)).join(', ')}`,
    ruta: faltan.length === 1 ? `#/calibrar/nueva/${faltan[0].id}` : '#/calibrar',
    hecha: !faltan.length,
    // Sin la receta de la casa no sale ninguna bebida del menú.
    urgente: !!casa && faltan.includes(casa),
    accion: faltan.length === 1 ? `Calibrar ${corto(faltan[0].nombre)}` : 'Calibrar',
  });

  const prog = progresoDe(e, u.id);
  const repaso = Object.values(prog.repaso).filter((x) => tocaHoy(x, hoy)).length;
  if (repaso > 0) {
    t.push({ id: 'repaso', texto: 'Repaso de hoy', detalle: `${repaso} pregunta${repaso === 1 ? '' : 's'} · 2 minutos`, ruta: '#/aprender/repaso', hecha: false, accion: 'Repasar' });
  }
  for (const a of prog.asignadas) {
    t.push({ id: `leccion-${a.leccionId}`, texto: 'Lección que te asignaron', detalle: `${a.motivo} · ${usuario(e, a.por)?.nombre.split(' ')[0]}`, ruta: `#/aprender/leccion/${a.leccionId}`, hecha: false, accion: 'Abrir la lección' });
  }

  for (const x of e.incidencias.filter((i) => i.responsable === u.id && !i.cerradaEn)) {
    t.push({
      id: `incidencia-${x.id}`,
      texto: `Resolver: ${x.titulo}`,
      detalle: x.vence ? `Para el ${fechaCorta(x.vence)}${x.vence < hoy ? ' · ya venció' : ''}` : 'Te la asignaron',
      ruta: `#/panel/incidencia/${x.id}`,
      hecha: false,
      urgente: x.prioridad === 'alta' || (!!x.vence && x.vence <= hoy),
      accion: 'Ver la incidencia',
    });
  }

  for (const c of e.cambios.filter((x) => x.estado === 'abierto' && x.para === u.id && x.fecha >= hoy)) {
    t.push({
      id: `cambio-${c.id}`,
      texto: c.aCambio ? `${usuario(e, c.de)?.nombre.split(' ')[0]} te propone un intercambio` : `${usuario(e, c.de)?.nombre.split(' ')[0]} te pide cubrir un turno`,
      detalle: `El ${diaYNum(c.fecha)} · contesta sí o no`,
      ruta: '#/horarios/cambios',
      hecha: false,
      accion: 'Contestar',
    });
  }
  return ordenar(t);
}

/** Lo que espera la firma del encargado. */
export function firmasDe(e: Estado, hoy = jornadaDe()): Tarea[] {
  const t: Tarea[] = [];
  for (const x of e.ejecuciones.filter((y) => y.completadaEn && !y.validadaEn)) {
    t.push({
      id: `validar-${x.id}`,
      texto: `Validar ${buscarPlantilla(e, x.plantillaId)?.nombre.toLowerCase()}`,
      detalle: `${cuando(x.jornada)} · ${usuario(e, x.completadaPor)?.nombre.split(' ')[0]} a las ${hora(x.completadaEn!)}`,
      ruta: `#/checklists/ej/${x.id}`,
      hecha: false,
      accion: 'Validar',
    });
  }
  for (const x of e.ejecuciones.filter((y) => y.jornada >= sumarDias(hoy, -1))) {
    fueraDeRango(x).forEach((mk, i) => t.push({
      id: `fuera-${x.id}-${i}`,
      texto: `Revisar lectura de ${mk.valor?.toFixed(1)} °C`,
      detalle: `${cuando(x.jornada)} · ${mk.acciones?.length ? mk.acciones.join(', ') : 'sin acción anotada'}`,
      ruta: `#/checklists/ej/${x.id}`,
      hecha: false,
      urgente: true,
      accion: 'Revisar',
    }));
  }
  for (const c of e.cambios.filter((x) => x.estado === 'aceptado')) {
    t.push({
      id: `aprobar-${c.id}`,
      texto: c.aCambio ? 'Aprobar intercambio de turnos' : 'Aprobar cambio de turno',
      detalle: `${usuario(e, c.de)?.nombre.split(' ')[0]} → ${usuario(e, c.acepta)?.nombre.split(' ')[0]} · ${diaYNum(c.fecha)}`,
      ruta: '#/horarios/cambios',
      hecha: false,
      accion: 'Revisar el cambio',
    });
  }
  for (const a of e.ausencias.filter((x) => x.estado === 'pendiente')) {
    t.push({
      id: `ausencia-${a.id}`,
      texto: `Contestar ${a.tipo === 'vacaciones' ? 'vacaciones' : 'día libre'} de ${usuario(e, a.usuarioId)?.nombre.split(' ')[0]}`,
      detalle: a.desde === a.hasta ? diaYNum(a.desde) : `Del ${fechaCorta(a.desde)} al ${fechaCorta(a.hasta)}`,
      ruta: '#/horarios/cambios',
      hecha: false,
      accion: 'Contestar',
    });
  }
  return ordenar(t);
}

/** Qué pestañas llevan cuadrito de "algo espera aquí". */
export function pendientesPorPestana(e: Estado, u: Usuario, hoy = jornadaDe()) {
  const tareas = tareasDe(e, u, hoy);
  return {
    inicio: avisosDe(e, u.id).filter((n) => !n.leidaPor.includes(u.id)).length,
    checklists: tareas.filter((t) => t.id.startsWith('checklist-') && t.urgente).length,
    calibrar: e.cafes.filter((c) => c.activo && !recetaDe(e, hoy, c.id)).length,
    mas: tareas.filter((t) => t.id.startsWith('cambio-')).length,
    panel: puede(e, 'encargado', 'admin') ? porDecidir(e) : 0,
  } as Record<string, number>;
}

function ListaTareas({ tareas }: { tareas: Tarea[] }) {
  return (
    <div className="lista">
      {tareas.map((t) => (
        <a key={t.id} className="fila tarea" href={t.ruta} data-hecha={t.hecha ? 'si' : 'no'}>
          <Casilla hecha={t.hecha} />
          <span className="fila-texto">
            <span className="tarea-texto">{t.texto}</span>
            <span className="fila-sub">{t.detalle}</span>
          </span>
          {t.urgente && !t.hecha && <Etq alerta>Ya</Etq>}
        </a>
      ))}
    </div>
  );
}

/** Lo que lleva cada quien desde el lunes: solo lo ve esa persona. */
function TuSemana({ e, u, hoy }: { e: Estado; u: Usuario; hoy: string }) {
  const lunes = lunesDe(hoy);
  const desde = tsDgo(lunes, '05:00');
  const checklists = e.ejecuciones.filter((x) => x.completadaPor === u.id && x.jornada >= lunes).length;
  const recetas = e.sesiones.filter((x) => x.por === u.id && x.aprobadoId && x.jornada >= lunes).length;
  const lecciones = Object.values(progresoDe(e, u.id).lecciones).filter((t) => t >= desde).length;
  const sem = e.semanas.find((x) => x.id === lunes && x.estado === 'publicada');
  const horas = sem ? horasDe(turnosDe(e, lunes, sem.turnos, u.id)) : 0;
  const cifra = (n: number, una: string, varias: string) => (
    <div className="cifra">
      <span className="num-l">{n}</span>
      <span className="etq">{n === 1 ? una : varias}</span>
    </div>
  );
  return (
    <Seccion consulta titulo="Tu semana" extra={horas ? `${horas.toFixed(horas % 1 ? 1 : 0)} h de turno` : undefined}>
      <div className="rejilla-3">
        {cifra(checklists, 'checklist', 'checklists')}
        {cifra(recetas, 'receta', 'recetas')}
        {cifra(lecciones, 'lección', 'lecciones')}
      </div>
      <p className="cuerpo">Lo que llevas desde el lunes. Solo lo ves tú.</p>
      <a className="enlace" href="#/horarios">Mi horario</a>
    </Seccion>
  );
}

export function Inicio() {
  const e = useEstado();
  const u = yo(e)!;
  const hoy = jornadaDe();
  const m = maquinaDe(e);
  const rd = recetaCasa(e, hoy);
  const cafeHoy = rd && buscarCafe(e, rd.cafeId);
  const turnoHoy = turnoDe(e, u.id, hoy);
  const proximo = !turnoHoy
    ? Array.from({ length: 13 }, (_, i) => sumarDias(hoy, i + 1)).map((f) => ({ f, t: turnoDe(e, u.id, f) })).find((x) => x.t)
    : undefined;
  const esEncargado = puede(e, 'encargado', 'admin');
  const semanaHoy = e.semanas.find((s) => s.id === lunesDe(hoy) && s.estado === 'publicada');
  const contigo = personasDe(e, hoy, semanaHoy?.turnos ?? {})
    .filter((p) => p.usuarioId !== u.id)
    .map((p) => usuario(e, p.usuarioId)?.nombre.split(' ')[0]);
  const nuevos = avisosDe(e, u.id).filter((n) => !n.leidaPor.includes(u.id));
  const tareas = tareasDe(e, u, hoy);
  const listas = tareas.filter((t) => t.hecha).length;
  const decidir = esEncargado ? porDecidir(e) : 0;

  // ¿Estás en turno ahora? Lo de la barra (checklists, calibrar) toca a
  // quien está en turno; lo personal (repaso, incidencias, cambios) es tuyo
  // siempre.
  const enJ = (m: number) => (m < 300 ? m + 1440 : m);
  const ahoraMin = enJ(minutosAhora());
  const ini = turnoHoy ? enJ(minutos(turnoHoy.inicio)) : 0;
  let fin = turnoHoy ? enJ(minutos(turnoHoy.fin)) : 0;
  if (turnoHoy && fin <= ini) fin += 1440;
  const momento = !turnoHoy ? 'descanso' : ahoraMin < ini ? 'antes' : ahoraMin >= fin ? 'despues' : 'turno';
  const personal = (t: Tarea) => !t.id.startsWith('checklist-') && t.id !== 'calibrar';
  const siguiente = momento === 'turno' ? tareas.find((t) => !t.hecha) : tareas.find((t) => !t.hecha && personal(t));
  // La lista no repite lo que ya está en "Ahora".
  const resto = tareas.filter((t) => t !== siguiente);
  const contexto = momento === 'antes'
    ? `Tu turno empieza a las ${turnoHoy!.inicio}.`
    : momento === 'despues' ? `Tu turno de hoy terminó a las ${turnoHoy!.fin}.`
      : momento === 'descanso' ? 'Hoy descansas.' : '';

  const fecha = `${nombreDia(hoy)} ${fechaCorta(hoy).split(' ').slice(1).join(' ')}`;
  const turno = turnoHoy
    ? `${turnoHoy.nombre} ${turnoHoy.inicio}–${turnoHoy.fin}${contigo.length ? ` con ${contigo.join(' y ')}` : ''}`
    : `Hoy descansas${proximo ? `; vuelves ${cuando(proximo.f).toLowerCase()} a las ${proximo.t!.inicio}` : ''}`;

  return (
    <>
      <Sup marca titulo={`${saludo()}, ${u.nombre.split(' ')[0]}`} sub={`${fecha} · ${turno}`} />
      <main className="pant pila">
        <Pista id="inicio">Aquí empieza cada turno. "Ahora" es lo siguiente que te toca; tócalo y te lleva directo. Abajo está lo demás del día.</Pista>

        <section className="bloque inv ahora" aria-label="Ahora">
          <span className="etq">{siguiente?.urgente ? 'Ahora · ya es hora' : 'Ahora'}</span>
          {contexto && <span className="cuerpo">{contexto}{siguiente ? ' Esto es tuyo:' : ''}</span>}
          {siguiente ? (
            <>
              <span className="subtitulo">{siguiente.texto}</span>
              <span className="cuerpo">{siguiente.detalle}</span>
              <a className="boton grande lleno" href={siguiente.ruta}>{siguiente.accion}</a>
            </>
          ) : momento === 'turno' ? (
            <>
              <span className="subtitulo">Todo listo por ahora.</span>
              <span className="cuerpo">No queda nada pendiente en tu lista. Buen turno.</span>
            </>
          ) : (
            <>
              <span className="subtitulo">Nada pendiente para ti.</span>
              <a className="enlace" href="#/horarios">Mi horario</a>
            </>
          )}
        </section>

        <Seccion titulo={momento === 'turno' ? 'Después' : 'En la barra hoy'} extra={listas === tareas.length ? 'Todo listo' : `${listas} de ${tareas.length} listas`}>
          {momento !== 'turno' && <p className="meta">Lo hace quien está en turno; puedes verlo y ayudar.</p>}
          <BarraProg valor={tareas.length ? listas / tareas.length : 1} />
          <ListaTareas tareas={resto} />
        </Seccion>

        {esEncargado && (
          <Seccion titulo="Tu Panel" extra={decidir ? `${decidir} por decidir` : 'Al día'}>
            <p className="cuerpo">{decidir ? 'Validaciones, cambios de turno, días libres e incidencias esperan tu decisión.' : 'Nada espera tu decisión. Los indicadores de la semana están en el Panel.'}</p>
            <a className={`boton grande${decidir ? ' lleno' : ''}`} href="#/panel">Abrir el Panel</a>
          </Seccion>
        )}

        {nuevos.length > 0 && (
          <Seccion titulo="Avisos" extra={`${nuevos.length} nuevo${nuevos.length === 1 ? '' : 's'}`}>
            <div className="lista">
              {nuevos.slice(0, 3).map((n) => (
                <a key={n.id} className="fila" href={n.ruta ?? '#/avisos'} onClick={() => marcarLeida(n.id)}>
                  <span className="fila-texto">
                    <span>{n.texto}</span>
                    <span className="fila-sub">{cuando(jornadaDe(n.en))} · {hora(n.en)}</span>
                  </span>
                </a>
              ))}
            </div>
            <div className="fila-h entre">
              <a className="enlace" href="#/avisos">Todos</a>
              <button type="button" className="enlace" onClick={marcarTodasLeidas}>Marcar como leídos</button>
            </div>
          </Seccion>
        )}

        <Seccion consulta titulo="Espresso de hoy" extra={rd ? `${hora(rd.en)} · ${usuario(e, rd.por)?.nombre.split(' ')[0]}` : undefined}>
          {rd && cafeHoy ? (
            <>
              <span className="num-m">{rd.dosis.toFixed(1)} → {rd.rendimiento.toFixed(1)} g · {rd.tiempo.toFixed(0)} s</span>
              <span className="cuerpo">{corto(cafeHoy.nombre)} · molienda {rd.molienda} · botón {nombreBoton(m, rd.botonId)}</span>
            </>
          ) : (
            <p className="cuerpo">Todavía no hay receta de hoy: calibra antes de servir el primer espresso.</p>
          )}
          <a className="enlace" href="#/calibrar">{rd ? 'Calibración' : 'Calibrar ahora'}</a>
        </Seccion>

        <TuSemana e={e} u={u} hoy={hoy} />
      </main>
    </>
  );
}

/* ═══ AVISOS ══════════════════════════════════════════════ */

/** Todos los avisos: horario publicado, cambios, días libres. */
export function Avisos() {
  const e = useEstado();
  const u = yo(e)!;
  const lista = avisosDe(e, u.id);
  const nuevos = lista.filter((n) => !n.leidaPor.includes(u.id)).length;
  return (
    <>
      <Sup titulo="Avisos" sub={nuevos ? `${nuevos} sin leer · toca uno para ir a lo que dice` : 'Todo leído'} volver="inicio"
        accion={nuevos ? { texto: 'Marcar leídos', hacer: marcarTodasLeidas } : undefined} />
      <main className="pant pila">
        {lista.length ? (
          <div className="lista">
            {lista.map((n) => {
              const leida = n.leidaPor.includes(u.id);
              return (
                <a key={n.id} className="fila" href={n.ruta ?? '#/inicio'} onClick={() => marcarLeida(n.id)}>
                  <span className={`avatar${leida ? '' : ' lleno'}`} aria-hidden="true">{usuario(e, n.de)?.iniciales ?? 'R'}</span>
                  <span className="fila-texto">
                    <span className={leida ? 'italica' : ''}>{n.texto}</span>
                    <span className="fila-sub">{cuando(jornadaDe(n.en))} · {hora(n.en)}</span>
                  </span>
                  {!leida && <Etq>Nuevo</Etq>}
                </a>
              );
            })}
          </div>
        ) : (
          <Vacio>Sin avisos por ahora.</Vacio>
        )}
      </main>
    </>
  );
}
