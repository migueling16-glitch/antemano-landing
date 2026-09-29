/**
 * Horarios: mis turnos, la semana del equipo (el encargado la arma y la
 * publica), disponibilidad y cambios de turno entre compañeros.
 */
import { useState } from 'react';
import {
  useEstado, yo, usuario, puede, asignarTurno, publicarSemana, alternarDisponible, solicitarCambio, responderCambio,
  avisar, vibrar, type Estado, type TurnoTipo,
} from '../estado';
import { Sup, Seccion, Hoja, Avatar, Estado as Etq, Vacio, ir } from '../componentes';
import { turnoDe } from './Inicio';
import { jornadaDe, sumarDias, lunesDe, diaCorto, nombreDia, fechaCorta, cuando, horasEntre, hora } from '../lib/tiempo';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const diasDe = (lunes: string) => Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
const numDia = (f: string) => Number(f.slice(8));

/* ═══ MIS TURNOS ══════════════════════════════════════════ */

export function HorariosInicio() {
  const e = useEstado();
  const u = yo(e)!;
  const hoy = jornadaDe();
  const lunes = lunesDe(hoy);
  const [pedir, setPedir] = useState<{ fecha: string; t: TurnoTipo } | null>(null);
  const [motivo, setMotivo] = useState('');
  const abiertos = e.cambios.filter((c) => c.estado === 'abierto' && c.de !== u.id && c.fecha >= hoy);
  const porAprobar = puede(e, 'encargado', 'admin') ? e.cambios.filter((c) => c.estado === 'aceptado').length : 0;

  const semanaDe = (inicio: string, titulo: string) => {
    const sem = e.semanas.find((s) => s.id === inicio);
    const dias = diasDe(inicio);
    const horas = dias.reduce((a, f) => { const t = turnoDe(e, u.id, f); return a + (t ? horasEntre(t.inicio, t.fin) : 0); }, 0);
    return (
      <Seccion titulo={titulo} extra={sem?.estado === 'publicada' ? `${horas.toFixed(1)} h` : 'Sin publicar'}>
        {sem?.estado !== 'publicada' ? (
          <p className="cuerpo">El encargado todavía no publica esta semana.</p>
        ) : (
          <div className="lista">
            {dias.map((f) => {
              const t = turnoDe(e, u.id, f);
              const cambio = e.cambios.find((c) => c.de === u.id && c.fecha === f && (c.estado === 'abierto' || c.estado === 'aceptado'));
              const pasado = f < hoy;
              return (
                <div key={f} className="fila" style={{ opacity: pasado ? 0.55 : 1 }}>
                  <span className={`avatar${f === hoy ? ' lleno' : ''}`} style={{ borderRadius: 0 }}>{numDia(f)}</span>
                  <span className="fila-texto">
                    <span>{nombreDia(f)}{f === hoy ? ' · hoy' : ''}</span>
                    <span className="fila-sub">{t ? `${t.nombre} · ${t.inicio}–${t.fin}` : 'Descanso'}</span>
                  </span>
                  {cambio ? <Etq tenue>{cambio.estado === 'abierto' ? 'Buscando cambio' : 'Por aprobar'}</Etq>
                    : t && !pasado ? <button type="button" className="sup-accion" onClick={() => setPedir({ fecha: f, t })}>Cambiar</button>
                    : null}
                </div>
              );
            })}
          </div>
        )}
      </Seccion>
    );
  };

  return (
    <>
      <Sup titulo="Horarios" sub={e.sucursal.nombre} volver="mas" />
      <main className="pant pila">
        <div className="lista">
          <a className="fila" href="#/horarios/semana">
            <span className="fila-texto"><span>Semana del equipo</span><span className="fila-sub">{puede(e, 'encargado', 'admin') ? 'Armar y publicar' : 'Quién trabaja cada día'}</span></span>
          </a>
          <a className="fila" href="#/horarios/cambios">
            <span className="fila-texto">
              <span>Cambios de turno</span>
              <span className="fila-sub">{abiertos.length ? `${abiertos.length} compañero${abiertos.length === 1 ? ' busca' : 's buscan'} cambio` : 'Nadie busca cambio'}{porAprobar ? ` · ${porAprobar} por aprobar` : ''}</span>
            </span>
          </a>
          <a className="fila" href="#/horarios/disponibilidad">
            <span className="fila-texto"><span>Mi disponibilidad</span><span className="fila-sub">Qué días puedes trabajar</span></span>
          </a>
        </div>
        {semanaDe(lunes, 'Esta semana')}
        {semanaDe(sumarDias(lunes, 7), 'La que sigue')}
      </main>

      <Hoja abierta={!!pedir} alCerrar={() => setPedir(null)} titulo="Pedir cambio">
        {pedir && <p className="cuerpo">{nombreDia(pedir.fecha)} {fechaCorta(pedir.fecha).split(' ').slice(1).join(' ')} · {pedir.t.nombre} {pedir.t.inicio}–{pedir.t.fin}. Lo ve el equipo; cuando alguien lo acepte, el encargado lo aprueba.</p>}
        <label className="campo">
          <span className="etq">Motivo</span>
          <input value={motivo} placeholder="Ej. cita médica" onChange={(ev) => setMotivo(ev.target.value)} />
        </label>
        <button type="button" className="boton grande lleno" disabled={!motivo.trim()}
          onClick={() => { solicitarCambio(pedir!.fecha, pedir!.t.id, motivo.trim()); setPedir(null); setMotivo(''); vibrar(12); avisar('Cambio publicado para el equipo.'); }}>
          {motivo.trim() ? 'Publicar para el equipo' : 'Escribe el motivo'}
        </button>
      </Hoja>
    </>
  );
}

/* ═══ SEMANA DEL EQUIPO ═══════════════════════════════════ */

export function HorariosSemana({ inicio }: { inicio?: string }) {
  const e = useEstado();
  const hoy = jornadaDe();
  const lunes = inicio ?? lunesDe(hoy);
  const edita = puede(e, 'encargado', 'admin');
  const sem = e.semanas.find((s) => s.id === lunes);
  const dias = diasDe(lunes);
  const equipo = e.usuarios.filter((u) => u.activo);
  const [celda, setCelda] = useState<{ usuarioId: string; fecha: string } | null>(null);
  const visible = edita || sem?.estado === 'publicada';

  const turnoEn = (usuarioId: string, fecha: string) => {
    const id = sem?.turnos[`${usuarioId}|${fecha}`];
    return id ? e.turnosTipo.find((t) => t.id === id) : undefined;
  };
  const horasDe = (usuarioId: string) => dias.reduce((a, f) => { const t = turnoEn(usuarioId, f); return a + (t ? horasEntre(t.inicio, t.fin) : 0); }, 0);
  const cubre = (f: string) => ({
    ap: equipo.some((u) => turnoEn(u.id, f)?.id === 't-ap'),
    ci: equipo.some((u) => ['t-ci', 't-cl'].includes(turnoEn(u.id, f)?.id ?? '')),
  });
  const huecos = dias.filter((f) => { const c = cubre(f); return !c.ap || !c.ci; });
  const u = celda && usuario(e, celda.usuarioId);
  const disponible = celda ? e.disponibilidad[celda.usuarioId]?.[new Date(`${celda.fecha}T12:00:00Z`).getUTCDay()] ?? true : true;

  return (
    <>
      <Sup titulo="Semana del equipo" sub={`${fechaCorta(lunes)} – ${fechaCorta(dias[6])}`} volver="horarios" />
      <main className="pant pila">
        <div className="fila-h entre">
          <button type="button" className="sup-accion" onClick={() => ir(`horarios/semana/${sumarDias(lunes, -7)}`)}>← Anterior</button>
          {sem ? <Etq {...(sem.estado === 'publicada' ? { fuerte: true } : { tenue: true })}>{sem.estado === 'publicada' ? 'Publicada' : 'Borrador'}</Etq> : <Etq tenue>Vacía</Etq>}
          <button type="button" className="sup-accion" onClick={() => ir(`horarios/semana/${sumarDias(lunes, 7)}`)}>Siguiente →</button>
        </div>

        {!visible ? (
          <p className="cuerpo">Esta semana todavía no se publica.</p>
        ) : (
          <>
            <div className="semana" role="grid" aria-label="Turnos de la semana">
              <div className="cab" />
              {dias.map((f) => <div key={f} className="cab">{diaCorto(f)}<br />{numDia(f)}</div>)}
              {equipo.map((p) => (
                <FilaSemana key={p.id} e={e} usuarioId={p.id} dias={dias} hoy={hoy} turnoEn={turnoEn} horas={horasDe(p.id)}
                  onCelda={edita ? (fecha) => setCelda({ usuarioId: p.id, fecha }) : undefined} />
              ))}
            </div>
            <p className="cuerpo">
              {e.turnosTipo.map((t) => `${t.corto} ${t.nombre.toLowerCase()} ${t.inicio}–${t.fin}`).join(' · ')}
            </p>
            {edita && (
              huecos.length ? (
                <section className="bloque inv">
                  <span className="etq">Sin cubrir</span>
                  <span className="cuerpo">{huecos.map((f) => { const c = cubre(f); return `${diaCorto(f)} ${numDia(f)}: ${[!c.ap && 'apertura', !c.ci && 'cierre'].filter(Boolean).join(' y ')}`; }).join(' · ')}</span>
                </section>
              ) : <p className="cuerpo">Todos los días tienen apertura y cierre.</p>
            )}
            {edita && sem?.estado !== 'publicada' && (
              <div className="pie-accion">
                <button type="button" className="boton grande lleno" onClick={() => { publicarSemana(lunes); vibrar([30, 60, 30]); avisar('Semana publicada. El equipo ya la ve.'); }}>
                  Publicar semana
                </button>
              </div>
            )}
            {edita && sem?.estado === 'publicada' && <p className="cuerpo">Publicada {sem.publicadaEn ? `${cuando(jornadaDe(sem.publicadaEn)).toLowerCase()} a las ${hora(sem.publicadaEn)}` : ''}. Si cambias un turno, vuelve a borrador hasta que la publiques otra vez.</p>}
          </>
        )}
      </main>

      <Hoja abierta={!!celda} alCerrar={() => setCelda(null)} titulo={u ? `${u.nombre.split(' ')[0]} · ${celda ? nombreDia(celda.fecha) : ''}` : 'Turno'}>
        {!disponible && <p className="cuerpo">Marcó este día como no disponible.</p>}
        <div className="pila-s">
          {e.turnosTipo.map((t) => (
            <button key={t.id} type="button" className="chip" aria-pressed={celda ? turnoEn(celda.usuarioId, celda.fecha)?.id === t.id : false}
              onClick={() => { asignarTurno(lunes, celda!.usuarioId, celda!.fecha, t.id); setCelda(null); vibrar(10); }}>
              {t.nombre} · {t.inicio}–{t.fin}
            </button>
          ))}
          <button type="button" className="chip" onClick={() => { asignarTurno(lunes, celda!.usuarioId, celda!.fecha, null); setCelda(null); vibrar(10); }}>Descanso</button>
        </div>
      </Hoja>
    </>
  );
}

function FilaSemana({ e, usuarioId, dias, hoy, turnoEn, horas, onCelda }: {
  e: Estado; usuarioId: string; dias: string[]; hoy: string; horas: number;
  turnoEn: (u: string, f: string) => TurnoTipo | undefined; onCelda?: (fecha: string) => void;
}) {
  const u = usuario(e, usuarioId)!;
  const disp = e.disponibilidad[usuarioId];
  return (
    <>
      <div><span>{u.nombre.split(' ')[0]}</span><span className="italica">{horas.toFixed(0)} h</span></div>
      {dias.map((f) => {
        const t = turnoEn(usuarioId, f);
        const noDisp = disp && !disp[new Date(`${f}T12:00:00Z`).getUTCDay()];
        const contenido = t ? t.corto : noDisp ? '×' : '';
        const props = { className: 'celda', 'data-turno': t ? t.id : undefined, 'data-hoy': f === hoy ? 'si' : undefined };
        return onCelda ? (
          <button key={f} type="button" {...props} onClick={() => onCelda(f)} aria-label={`${u.nombre}, ${nombreDia(f)}: ${t ? t.nombre : 'descanso'}`}>{contenido}</button>
        ) : (
          <div key={f} {...props}>{contenido}</div>
        );
      })}
    </>
  );
}

/* ═══ DISPONIBILIDAD ══════════════════════════════════════ */

export function HorariosDisponibilidad() {
  const e = useEstado();
  const u = yo(e)!;
  const d = e.disponibilidad[u.id] ?? Array(7).fill(true);
  const orden = [1, 2, 3, 4, 5, 6, 0];
  return (
    <>
      <Sup titulo="Mi disponibilidad" volver="horarios" />
      <main className="pant pila">
        <p className="cuerpo">El encargado la ve al armar la semana. Toca un día para cambiarlo.</p>
        <div className="lista">
          {orden.map((i) => (
            <button key={i} type="button" className="fila" aria-pressed={d[i]} onClick={() => { alternarDisponible(u.id, i); vibrar(10); }}>
              <span className="fila-texto">{DIAS_SEMANA[i]}</span>
              {d[i] ? <Etq fuerte>Disponible</Etq> : <Etq tenue>No puedo</Etq>}
            </button>
          ))}
        </div>
      </main>
    </>
  );
}

/* ═══ CAMBIOS ═════════════════════════════════════════════ */

export function HorariosCambios() {
  const e = useEstado();
  const u = yo(e)!;
  const hoy = jornadaDe();
  const edita = puede(e, 'encargado', 'admin');
  const lista = e.cambios.filter((c) => c.fecha >= sumarDias(hoy, -7));

  return (
    <>
      <Sup titulo="Cambios de turno" volver="horarios" />
      <main className="pant pila">
        {lista.length === 0 && <Vacio>No hay cambios en curso.</Vacio>}
        {lista.map((c) => {
          const t = e.turnosTipo.find((x) => x.id === c.turnoId);
          const mio = c.de === u.id;
          const yaTrabajo = !!turnoDe(e, u.id, c.fecha);
          return (
            <section key={c.id} className={`bloque${c.estado === 'aceptado' && edita ? ' inv' : ''}`}>
              <div className="fila-h entre">
                <span className="fila-h" style={{ gap: 8 }}><Avatar texto={usuario(e, c.de)?.iniciales ?? ''} /><span>{mio ? 'Tu turno' : usuario(e, c.de)?.nombre}</span></span>
                <Etq {...(c.estado === 'aprobado' ? { fuerte: true } : c.estado === 'rechazado' ? { tenue: true } : {})}>
                  {{ abierto: 'Buscando', aceptado: 'Por aprobar', aprobado: 'Aprobado', rechazado: 'Rechazado' }[c.estado]}
                </Etq>
              </div>
              <span className="subtitulo">{nombreDia(c.fecha)} {fechaCorta(c.fecha).split(' ').slice(1).join(' ')} · {t?.nombre} {t?.inicio}–{t?.fin}</span>
              <span className="cuerpo">“{c.motivo}”{c.acepta ? ` · lo toma ${usuario(e, c.acepta)?.nombre}` : ''}</span>
              {c.estado === 'abierto' && !mio && (
                yaTrabajo
                  ? <span className="cuerpo">Ese día ya trabajas.</span>
                  : <button type="button" className="boton lleno" onClick={() => { responderCambio(c.id, 'aceptar'); vibrar(12); avisar('Aceptado. Falta que el encargado lo apruebe.'); }}>Yo lo tomo</button>
              )}
              {c.estado === 'aceptado' && edita && (
                <div className="rejilla-2">
                  <button type="button" className="boton" onClick={() => { responderCambio(c.id, 'rechazar'); avisar('Cambio rechazado.'); }}>Rechazar</button>
                  <button type="button" className="boton lleno" onClick={() => { responderCambio(c.id, 'aprobar'); vibrar([30, 60, 30]); avisar('Aprobado: el horario ya cambió.'); }}>Aprobar</button>
                </div>
              )}
            </section>
          );
        })}
      </main>
    </>
  );
}
