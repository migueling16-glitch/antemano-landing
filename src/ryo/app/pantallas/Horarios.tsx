/**
 * Horarios: mis turnos, la semana del equipo (el encargado la arma y la
 * publica), disponibilidad por franjas, días libres y cambios de turno.
 *
 * Las reglas (descanso semanal, tope de horas, descanso entre turnos,
 * disponibilidad, cobertura) viven en lib/turnos.ts; aquí solo se pintan.
 */
import { useMemo, useState } from 'react';
import {
  useEstado, yo, usuario, puede, asignarTurno, copiarSemana, limpiarSemana, publicarSemana, alternarFranja,
  solicitarCambio, responderCambio, pedirAusencia, responderAusencia, avisar, celebrar, vibrar,
  type Estado, type TurnoTipo, type Ausencia,
} from '../estado';
import { Sup, Seccion, Hoja, Avatar, Estado as Etq, Vacio, ir } from '../componentes';
import { turnoDe } from './Inicio';
import {
  FRANJAS, REGLAS, alertasDe, personasDe, tramosDe, horarioLocal, reloj, diasDe, turnosDe, horasDe, ausenciaEn, icsDe,
  type Alerta, type Turnos, type Franja,
} from '../lib/turnos';
import {
  jornadaDe, sumarDias, lunesDe, diaCorto, nombreDia, fechaCorta, cuando, hora, diaSemana, minutosAhora,
} from '../lib/tiempo';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const numDia = (f: string) => Number(f.slice(8));
const diaYNum = (f: string) => `${nombreDia(f)} ${fechaCorta(f).split(' ').slice(1).join(' ')}`;
const primerNombre = (e: Estado, id?: string) => usuario(e, id)?.nombre.split(' ')[0] ?? '';
const turnosPublicados = (e: Estado, fecha: string): Turnos =>
  e.semanas.find((s) => s.id === lunesDe(fecha) && s.estado === 'publicada')?.turnos ?? {};

/* ═══ LÍNEA DE TIEMPO DEL DÍA ═════════════════════════════ */

/**
 * Quién está en barra a cada hora de un día. Abajo, la cobertura dentro del
 * horario del local: los tramos sin nadie van en trama.
 */
function LineaDia({ e, fecha, turnos }: { e: Estado; fecha: string; turnos: Turnos }) {
  const personas = personasDe(e, fecha, turnos);
  const local = horarioLocal(e);
  const desde = Math.floor(Math.min(local.ini, ...personas.map((p) => p.ini)) / 60) * 60;
  const hasta = Math.ceil(Math.max(local.fin, ...personas.map((p) => p.fin)) / 60) * 60;
  const pos = (m: number) => `${((m - desde) / (hasta - desde)) * 100}%`;
  const ancho = (a: number, b: number) => `${((b - a) / (hasta - desde)) * 100}%`;
  const marcas: number[] = [];
  for (let m = desde; m <= hasta; m += 180) marcas.push(m);
  const tramos = tramosDe(personas, local.ini, local.fin);
  const ahora = fecha === jornadaDe() ? (minutosAhora() < 300 ? minutosAhora() + 1440 : minutosAhora()) : null;
  // Guías en cada fila: horario del local (punteadas) y la hora actual.
  const guias = (
    <>
      <span className="linea-local" style={{ left: pos(local.ini) }} />
      <span className="linea-local" style={{ left: pos(local.fin) }} />
      {ahora !== null && ahora >= desde && ahora <= hasta && <span className="linea-ahora" style={{ left: pos(ahora) }} />}
    </>
  );

  return (
    <div className="linea" role="img" aria-label={`Cobertura del ${diaYNum(fecha)}: ${personas.map((p) => `${primerNombre(e, p.usuarioId)} de ${reloj(p.ini)} a ${reloj(p.fin)}`).join(', ') || 'nadie'}`}>
      <div className="linea-fila linea-eje">
        <span className="linea-nombre" />
        <div className="linea-pista">
          {marcas.map((m, i) => (
            <span key={m} className="linea-marca"
              style={{ left: pos(m), transform: i === 0 ? 'none' : m === hasta ? 'translateX(-100%)' : undefined }}>{reloj(m)}</span>
          ))}
        </div>
      </div>
      {personas.map((p) => (
        <div key={p.usuarioId} className="linea-fila">
          <span className="linea-nombre">{primerNombre(e, p.usuarioId)}</span>
          <div className="linea-pista">
            {guias}
            <span className="linea-barra" style={{ left: pos(p.ini), width: ancho(p.ini, p.fin) }}>{p.turno.corto}</span>
          </div>
        </div>
      ))}
      <div className="linea-fila linea-cobertura">
        <span className="linea-nombre">En barra</span>
        <div className="linea-pista">
          {guias}
          {tramos.map((t) => (
            <span key={t.ini} className="linea-tramo" data-n={Math.min(t.n, 3)} style={{ left: pos(t.ini), width: ancho(t.ini, t.fin) }}
              title={`${reloj(t.ini)}–${reloj(t.fin)}: ${t.n}`}>{t.n || ''}</span>
          ))}
        </div>
      </div>
      <p className="cuerpo linea-nota">
        Local de {e.sucursal.apertura} a {e.sucursal.cierre} (líneas punteadas){ahora !== null ? '; la línea llena es la hora actual' : ''}.
        {tramos.some((t) => t.n < REGLAS.minEnBarra) ? ' La trama marca horas sin nadie en barra.' : ' Todo el horario tiene gente en barra.'}
      </p>
    </div>
  );
}

/* ═══ MIS TURNOS ══════════════════════════════════════════ */

export function HorariosInicio() {
  const e = useEstado();
  const u = yo(e)!;
  const hoy = jornadaDe();
  const lunes = lunesDe(hoy);
  const [vista, setVista] = useState<'semana' | 'mes'>('semana');
  const [pedir, setPedir] = useState<{ fecha: string; t: TurnoTipo } | null>(null);
  const [motivo, setMotivo] = useState('');
  const abiertos = e.cambios.filter((c) => c.estado === 'abierto' && c.de !== u.id && c.fecha >= hoy);
  const esEncargado = puede(e, 'encargado', 'admin');
  const pendientes = (esEncargado ? e.cambios.filter((c) => c.estado === 'aceptado').length : 0)
    + (esEncargado ? e.ausencias.filter((a) => a.estado === 'pendiente').length : 0);

  const agregarACalendario = () => {
    const { texto, n } = icsDe(e, u.id, hoy);
    if (!n) { avisar('No tienes turnos publicados de hoy en adelante.'); return; }
    const url = URL.createObjectURL(new Blob([texto], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'turnos-ryo.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    avisar(`${n} turno${n === 1 ? '' : 's'} listo${n === 1 ? '' : 's'} para tu calendario.`);
  };

  return (
    <>
      <Sup titulo="Horarios" sub={e.sucursal.nombre} volver="mas" />
      <main className="pant pila">
        <HoyEnBarra e={e} hoy={hoy} />

        <div className="chips" role="group" aria-label="Vista">
          <button type="button" className="chip" aria-pressed={vista === 'semana'} onClick={() => setVista('semana')}>Por semana</button>
          <button type="button" className="chip" aria-pressed={vista === 'mes'} onClick={() => setVista('mes')}>Mes</button>
        </div>

        {vista === 'semana' ? (
          <>
            <MiSemana e={e} inicio={lunes} titulo="Esta semana" onCambiar={(fecha, t) => setPedir({ fecha, t })} />
            <MiSemana e={e} inicio={sumarDias(lunes, 7)} titulo="La que sigue" onCambiar={(fecha, t) => setPedir({ fecha, t })} />
          </>
        ) : (
          <Calendario e={e} hoy={hoy} />
        )}

        <button type="button" className="boton grande" onClick={agregarACalendario}>Agregar a mi calendario</button>

        <div className="lista">
          <a className="fila" href="#/horarios/semana">
            <span className="fila-texto"><span>Semana del equipo</span><span className="fila-sub">{esEncargado ? 'Armar, revisar y publicar' : 'Quién trabaja cada día y a qué hora'}</span></span>
          </a>
          <a className="fila" href="#/horarios/cambios">
            <span className="fila-texto">
              <span>Solicitudes</span>
              <span className="fila-sub">
                Cambios de turno y días libres
                {abiertos.length ? ` · ${abiertos.length} busca${abiertos.length === 1 ? '' : 'n'} cambio` : ''}
                {pendientes ? ` · ${pendientes} por resolver` : ''}
              </span>
            </span>
          </a>
          <a className="fila" href="#/horarios/disponibilidad">
            <span className="fila-texto"><span>Mi disponibilidad</span><span className="fila-sub">Franjas por día, días libres y vacaciones</span></span>
          </a>
        </div>
      </main>

      <Hoja abierta={!!pedir} alCerrar={() => setPedir(null)} titulo="Pedir cambio">
        {pedir && <p className="cuerpo">{diaYNum(pedir.fecha)} · {pedir.t.nombre} {pedir.t.inicio}–{pedir.t.fin}. Lo ve el equipo; cuando alguien lo acepte, el encargado lo aprueba.</p>}
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

/** Quién trabaja hoy y si ya está en barra. */
function HoyEnBarra({ e, hoy }: { e: Estado; hoy: string }) {
  const personas = personasDe(e, hoy, turnosPublicados(e, hoy));
  const ahora = minutosAhora() < 300 ? minutosAhora() + 1440 : minutosAhora();
  return (
    <Seccion titulo="Hoy en barra" extra={diaYNum(hoy)}>
      {personas.length ? (
        <div className="lista">
          {personas.map((p) => {
            const estado = ahora < p.ini ? 'Entra' : ahora >= p.fin ? 'Ya salió' : 'En barra';
            return (
              <div key={p.usuarioId} className="fila">
                <Avatar texto={usuario(e, p.usuarioId)?.iniciales ?? ''} lleno={estado === 'En barra'} />
                <span className="fila-texto">
                  <span>{usuario(e, p.usuarioId)?.nombre}</span>
                  <span className="fila-sub">{p.turno.nombre} · {reloj(p.ini)}–{reloj(p.fin)}</span>
                </span>
                {estado === 'En barra' ? <Etq fuerte>En barra</Etq> : estado === 'Entra' ? <Etq>Entra {reloj(p.ini)}</Etq> : <Etq tenue>Ya salió</Etq>}
              </div>
            );
          })}
        </div>
      ) : (
        <Vacio>Hoy no hay turnos publicados.</Vacio>
      )}
    </Seccion>
  );
}

function MiSemana({ e, inicio, titulo, onCambiar }: {
  e: Estado; inicio: string; titulo: string; onCambiar: (fecha: string, t: TurnoTipo) => void;
}) {
  const u = yo(e)!;
  const hoy = jornadaDe();
  const sem = e.semanas.find((s) => s.id === inicio);
  const lista = sem?.estado === 'publicada' ? turnosDe(e, inicio, sem.turnos, u.id) : [];
  return (
    <Seccion titulo={titulo} extra={sem?.estado === 'publicada' ? `${horasDe(lista).toFixed(1)} h` : 'Sin publicar'}>
      {sem?.estado !== 'publicada' ? (
        <p className="cuerpo">El encargado todavía no publica esta semana.</p>
      ) : (
        <div className="lista">
          {diasDe(inicio).map((f) => {
            const t = turnoDe(e, u.id, f);
            const aus = ausenciaEn(e, u.id, f);
            const cambio = e.cambios.find((c) => c.de === u.id && c.fecha === f && (c.estado === 'abierto' || c.estado === 'aceptado'));
            const pasado = f < hoy;
            return (
              <div key={f} className="fila" style={{ opacity: pasado ? 0.55 : 1 }}>
                <span className={`avatar${f === hoy ? ' lleno' : ''}`} style={{ borderRadius: 0 }}>{numDia(f)}</span>
                <span className="fila-texto">
                  <span>{nombreDia(f)}{f === hoy ? ' · hoy' : ''}</span>
                  <span className="fila-sub">
                    {t ? `${t.nombre} · ${t.inicio}–${t.fin}` : aus?.estado === 'aprobada' ? (aus.tipo === 'vacaciones' ? 'Vacaciones' : 'Día libre') : 'Descanso'}
                  </span>
                </span>
                {cambio ? <Etq tenue>{cambio.estado === 'abierto' ? 'Buscando cambio' : 'Por aprobar'}</Etq>
                  : t && !pasado ? <button type="button" className="sup-accion" onClick={() => onCambiar(f, t)}>Cambiar</button>
                  : null}
              </div>
            );
          })}
        </div>
      )}
    </Seccion>
  );
}

/** El mes con mis turnos publicados, días libres y vacaciones. */
function Calendario({ e, hoy }: { e: Estado; hoy: string }) {
  const u = yo(e)!;
  const [mes, setMes] = useState(hoy.slice(0, 7));
  const [elegido, setElegido] = useState(hoy);
  const primero = `${mes}-01`;
  const inicio = lunesDe(primero);
  const [y, m] = mes.split('-').map(Number);
  const diasMes = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const semanas = Math.ceil((((diaSemana(primero) + 6) % 7) + diasMes) / 7);
  const dias = Array.from({ length: semanas * 7 }, (_, i) => sumarDias(inicio, i));
  const nombreMes = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const mover = (n: number) => { const d = new Date(Date.UTC(y, m - 1 + n, 1)); setMes(d.toISOString().slice(0, 7)); };
  const t = turnoDe(e, u.id, elegido);
  const aus = ausenciaEn(e, u.id, elegido);
  const companeros = personasDe(e, elegido, turnosPublicados(e, elegido)).filter((p) => p.usuarioId !== u.id);

  return (
    <Seccion titulo="Mi mes" extra={nombreMes}>
      <div className="fila-h entre">
        <button type="button" className="sup-accion" onClick={() => mover(-1)}>← Anterior</button>
        <button type="button" className="sup-accion" onClick={() => mover(1)}>Siguiente →</button>
      </div>
      <div className="calendario" role="grid" aria-label={`Turnos de ${nombreMes}`}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i} className="cal-cab">{d}</span>)}
        {dias.map((f) => {
          const tt = turnoDe(e, u.id, f);
          const a = ausenciaEn(e, u.id, f);
          const fuera = f.slice(0, 7) !== mes;
          return (
            <button key={f} type="button" className="cal-dia" data-turno={tt ? 'si' : undefined} data-hoy={f === hoy ? 'si' : undefined}
              data-fuera={fuera ? 'si' : undefined} aria-pressed={f === elegido} onClick={() => setElegido(f)}
              aria-label={`${diaYNum(f)}: ${tt ? tt.nombre : a?.estado === 'aprobada' ? 'libre' : 'sin turno'}`}>
              <span className="cal-num">{numDia(f)}</span>
              <span className="cal-turno">{tt ? tt.corto : a?.estado === 'aprobada' ? (a.tipo === 'vacaciones' ? 'VAC' : 'LIB') : ''}</span>
            </button>
          );
        })}
      </div>
      <div className="bloque cambia" key={elegido}>
        <span className="etq">{diaYNum(elegido)}</span>
        {t ? (
          <>
            <span className="num-m">{t.nombre} · {t.inicio}–{t.fin}</span>
            <span className="cuerpo">{companeros.length ? `Con ${companeros.map((p) => `${primerNombre(e, p.usuarioId)} (${reloj(p.ini)}–${reloj(p.fin)})`).join(', ')}.` : 'Solo tú en barra.'}</span>
          </>
        ) : (
          <span className="cuerpo">{aus?.estado === 'aprobada' ? (aus.tipo === 'vacaciones' ? 'Vacaciones.' : 'Día libre.') : 'Sin turno publicado ese día.'}</span>
        )}
      </div>
    </Seccion>
  );
}

/* ═══ SEMANA DEL EQUIPO ═══════════════════════════════════ */

type Pincel = 'editar' | 'descanso' | string;

export function HorariosSemana({ inicio }: { inicio?: string }) {
  const e = useEstado();
  const hoy = jornadaDe();
  const lunes = inicio ?? lunesDe(hoy);
  const edita = puede(e, 'encargado', 'admin');
  const sem = e.semanas.find((s) => s.id === lunes);
  const turnos: Turnos = sem?.turnos ?? {};
  const dias = diasDe(lunes);
  const equipo = e.usuarios.filter((u) => u.activo);
  const [pincel, setPincel] = useState<Pincel>('editar');
  const [celda, setCelda] = useState<{ usuarioId: string; fecha: string } | null>(null);
  const [dia, setDia] = useState(dias.includes(hoy) ? hoy : dias[0]);
  const [confirmar, setConfirmar] = useState<'publicar' | 'copiar' | null>(null);
  const visible = edita || sem?.estado === 'publicada';
  const alertas = useMemo(() => alertasDe(e, lunes), [e, lunes]);
  const previa = e.semanas.find((s) => s.id === sumarDias(lunes, -7));
  const vacia = !Object.keys(turnos).length;

  const tipo = (id?: string) => (id ? e.turnosTipo.find((t) => t.id === id) : undefined);
  const alertaEn = (usuarioId: string, fecha: string) => alertas.filter((a) => a.usuarioId === usuarioId && a.fecha === fecha);
  const alertaDe = (usuarioId: string) => alertas.filter((a) => a.usuarioId === usuarioId && !a.fecha);

  const tocar = (usuarioId: string, fecha: string) => {
    if (pincel === 'editar') { setCelda({ usuarioId, fecha }); return; }
    const nuevo = pincel === 'descanso' ? null : pincel;
    asignarTurno(lunes, usuarioId, fecha, turnos[`${usuarioId}|${fecha}`] === nuevo ? null : nuevo);
    vibrar(8);
  };

  const publicar = () => {
    publicarSemana(lunes);
    vibrar([30, 60, 30]);
    celebrar('Horario publicado.', 'El equipo ya lo ve en su teléfono y le llegó el aviso.');
  };

  const u = celda && usuario(e, celda.usuarioId);
  const nLey = alertas.filter((a) => a.nivel === 'ley').length;

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
          <Vacio>Esta semana todavía no se publica.</Vacio>
        ) : (
          <>
            {edita && (
              <Seccion titulo="Pincel" extra={pincel === 'editar' ? 'Toca una celda para ver opciones' : 'Toca celdas para pintar'}>
                <div className="chips" role="group" aria-label="Pincel">
                  <button type="button" className="chip" aria-pressed={pincel === 'editar'} onClick={() => setPincel('editar')}>Editar</button>
                  {e.turnosTipo.map((t) => (
                    <button key={t.id} type="button" className="chip" aria-pressed={pincel === t.id} onClick={() => setPincel(t.id)}>{t.corto} · {t.inicio}</button>
                  ))}
                  <button type="button" className="chip" aria-pressed={pincel === 'descanso'} onClick={() => setPincel('descanso')}>Descanso</button>
                </div>
              </Seccion>
            )}

            <div className="semana" role="grid" aria-label="Turnos de la semana">
              <div className="cab" />
              {dias.map((f) => <div key={f} className="cab" data-hoy={f === hoy ? 'si' : undefined}>{diaCorto(f)}<br />{numDia(f)}</div>)}
              {equipo.map((p) => {
                const lista = turnosDe(e, lunes, turnos, p.id);
                const horas = horasDe(lista);
                return (
                  <FilaSemana key={p.id} e={e} usuarioId={p.id} dias={dias} hoy={hoy} tipo={tipo} turnos={turnos}
                    horas={horas} alertaFila={alertaDe(p.id).length > 0} alertaEn={alertaEn}
                    onCelda={edita ? (fecha) => tocar(p.id, fecha) : undefined} />
                );
              })}
              <div className="pie">En barra</div>
              {dias.map((f) => {
                const n = personasDe(e, f, turnos).length;
                const hueco = alertas.some((a) => a.nivel === 'cobertura' && a.fecha === f);
                return <div key={f} className="pie" data-alerta={hueco ? 'si' : undefined}>{n}{hueco ? '*' : ''}</div>;
              })}
            </div>
            <p className="cuerpo">
              {e.turnosTipo.map((t) => `${t.corto} ${t.inicio}–${t.fin}`).join(' · ')}. Con asterisco, algo por revisar; en trama, días que la persona no puede.
            </p>

            <Seccion titulo="El día, hora por hora">
              <div className="chips" role="group" aria-label="Día">
                {dias.map((f) => (
                  <button key={f} type="button" className="chip" aria-pressed={dia === f} onClick={() => setDia(f)}>{diaCorto(f)} {numDia(f)}</button>
                ))}
              </div>
              <LineaDia e={e} fecha={dia} turnos={turnos} />
            </Seccion>

            {edita && <Revision alertas={alertas} />}

            {edita && (
              <Seccion titulo="Herramientas">
                <div className="chips">
                  <button type="button" className="chip" disabled={!previa || !Object.keys(previa.turnos).length}
                    onClick={() => { if (vacia) { copiarSemana(lunes); avisar('Se copió la semana anterior.'); } else setConfirmar('copiar'); }}>
                    Copiar semana anterior
                  </button>
                  <button type="button" className="chip" disabled={vacia} onClick={() => { limpiarSemana(lunes); avisar('Semana en blanco.'); }}>Limpiar semana</button>
                </div>
              </Seccion>
            )}

            {edita && sem?.estado !== 'publicada' && !vacia && (
              <div className="pie-accion">
                <button type="button" className="boton grande lleno" onClick={() => (nLey ? setConfirmar('publicar') : publicar())}>
                  {nLey ? `Publicar · ${nLey} alerta${nLey === 1 ? '' : 's'} de ley` : 'Publicar semana'}
                </button>
              </div>
            )}
            {edita && sem?.estado === 'publicada' && (
              <p className="cuerpo">
                Publicada {sem.publicadaEn ? `${cuando(jornadaDe(sem.publicadaEn)).toLowerCase()} a las ${hora(sem.publicadaEn)}` : ''}. Si cambias un turno, vuelve a borrador; al publicarla otra vez el equipo recibe el aviso del cambio.
              </p>
            )}
          </>
        )}
      </main>

      <Hoja abierta={!!celda} alCerrar={() => setCelda(null)} titulo={u && celda ? `${u.nombre.split(' ')[0]} · ${diaYNum(celda.fecha)}` : 'Turno'}>
        {celda && <DetalleCelda e={e} usuarioId={celda.usuarioId} fecha={celda.fecha} alertas={alertaEn(celda.usuarioId, celda.fecha)} />}
        <div className="pila-s">
          {e.turnosTipo.map((t) => (
            <button key={t.id} type="button" className="chip" aria-pressed={celda ? turnos[`${celda.usuarioId}|${celda.fecha}`] === t.id : false}
              onClick={() => { asignarTurno(lunes, celda!.usuarioId, celda!.fecha, t.id); setCelda(null); vibrar(10); }}>
              {t.nombre} · {t.inicio}–{t.fin}
            </button>
          ))}
          <button type="button" className="chip" onClick={() => { asignarTurno(lunes, celda!.usuarioId, celda!.fecha, null); setCelda(null); vibrar(10); }}>Descanso</button>
        </div>
      </Hoja>

      <Hoja abierta={confirmar === 'publicar'} alCerrar={() => setConfirmar(null)} titulo="Publicar con alertas">
        <p className="cuerpo">Hay {nLey} alerta{nLey === 1 ? '' : 's'} que tocan la ley o un día libre aprobado. Si publicas así, el equipo ve este horario tal cual.</p>
        <ul className="pasos">{alertas.filter((a) => a.nivel === 'ley').map((a) => <li key={a.texto}>{a.texto}</li>)}</ul>
        <button type="button" className="boton grande" onClick={() => setConfirmar(null)}>Revisar primero</button>
        <button type="button" className="boton grande lleno" onClick={() => { setConfirmar(null); publicar(); }}>Publicar de todos modos</button>
      </Hoja>

      <Hoja abierta={confirmar === 'copiar'} alCerrar={() => setConfirmar(null)} titulo="Copiar semana anterior">
        <p className="cuerpo">Esta semana ya tiene turnos. Copiar la anterior los reemplaza todos.</p>
        <button type="button" className="boton grande lleno" onClick={() => { copiarSemana(lunes); setConfirmar(null); avisar('Se copió la semana anterior.'); }}>Reemplazar con la anterior</button>
      </Hoja>
    </>
  );
}

function FilaSemana({ e, usuarioId, dias, hoy, tipo, turnos, horas, alertaFila, alertaEn, onCelda }: {
  e: Estado; usuarioId: string; dias: string[]; hoy: string; horas: number; turnos: Turnos; alertaFila: boolean;
  tipo: (id?: string) => TurnoTipo | undefined; alertaEn: (u: string, f: string) => Alerta[]; onCelda?: (fecha: string) => void;
}) {
  const u = usuario(e, usuarioId)!;
  return (
    <>
      <div className="nombre" data-alerta={alertaFila ? 'si' : undefined}>
        <span>{u.nombre.split(' ')[0]}</span>
        <span className="italica">{horas.toFixed(0)} h{alertaFila ? '*' : ''}</span>
      </div>
      {dias.map((f) => {
        const t = tipo(turnos[`${usuarioId}|${f}`]);
        const puede = e.disponibilidad[usuarioId]?.[diaSemana(f)] ?? FRANJAS.map((x) => x.id);
        const aus = ausenciaEn(e, usuarioId, f);
        const libre = aus?.estado === 'aprobada';
        const alerta = alertaEn(usuarioId, f).length > 0;
        const contenido = t ? `${t.corto}${alerta ? '*' : ''}` : libre ? (aus!.tipo === 'vacaciones' ? 'VAC' : 'LIB') : '';
        const props = {
          className: 'celda',
          'data-turno': t ? t.id : undefined,
          'data-hoy': f === hoy ? 'si' : undefined,
          'data-no-puede': !t && (puede.length === 0 || libre) ? 'si' : undefined,
        };
        const etiqueta = `${u.nombre}, ${nombreDia(f)}: ${t ? t.nombre : libre ? 'libre' : 'descanso'}${alerta ? ', con alerta' : ''}`;
        return onCelda ? (
          <button key={f} type="button" {...props} onClick={() => onCelda(f)} aria-label={etiqueta}>{contenido}</button>
        ) : (
          <div key={f} {...props} aria-label={etiqueta}>{contenido}</div>
        );
      })}
    </>
  );
}

/** Disponibilidad, ausencias y alertas de una persona en un día. */
function DetalleCelda({ e, usuarioId, fecha, alertas }: { e: Estado; usuarioId: string; fecha: string; alertas: Alerta[] }) {
  const puede = e.disponibilidad[usuarioId]?.[diaSemana(fecha)] ?? FRANJAS.map((x) => x.id);
  const aus = ausenciaEn(e, usuarioId, fecha);
  return (
    <div className="pila-s">
      <span className="cuerpo">
        Puede: {puede.length ? FRANJAS.filter((f) => puede.includes(f.id)).map((f) => f.nombre.toLowerCase()).join(', ') : 'nada ese día'}.
        {aus && ` ${aus.tipo === 'vacaciones' ? 'Vacaciones' : 'Día libre'} ${aus.estado === 'aprobada' ? 'aprobado' : 'pedido'}.`}
      </span>
      {alertas.map((a) => <p key={a.texto} className="cuerpo">· {a.texto}</p>)}
    </div>
  );
}

/** Las alertas de la semana, de lo más serio a lo menos. */
function Revision({ alertas }: { alertas: Alerta[] }) {
  const grupos: [Alerta['nivel'], string][] = [['ley', 'Ley y días libres'], ['cobertura', 'Cobertura'], ['aviso', 'Avisos']];
  if (!alertas.length) {
    return (
      <Seccion titulo="Antes de publicar">
        <Vacio>Sin alertas: descansos, horas, disponibilidad y cobertura en orden.</Vacio>
      </Seccion>
    );
  }
  return (
    <Seccion titulo="Antes de publicar" extra={`${alertas.length} por revisar`}>
      {grupos.map(([nivel, titulo]) => {
        const lista = alertas.filter((a) => a.nivel === nivel);
        if (!lista.length) return null;
        return (
          <section key={nivel} className={`bloque${nivel === 'ley' ? ' inv' : ''}`}>
            <span className="etq">{titulo} · {lista.length}</span>
            {lista.map((a) => <p key={a.texto} className="cuerpo">{a.texto}</p>)}
          </section>
        );
      })}
      <p className="cuerpo">
        Reglas: un día de descanso por cada seis de trabajo y máximo {REGLAS.horasMax} h a la semana (LFT); {REGLAS.descansoMin} h entre turnos; al menos {REGLAS.minEnBarra} persona en barra en el horario del local.
      </p>
    </Seccion>
  );
}

/* ═══ DISPONIBILIDAD Y DÍAS LIBRES ════════════════════════ */

export function HorariosDisponibilidad() {
  const e = useEstado();
  const u = yo(e)!;
  const hoy = jornadaDe();
  const d = e.disponibilidad[u.id] ?? Array.from({ length: 7 }, () => FRANJAS.map((f) => f.id));
  const orden = [1, 2, 3, 4, 5, 6, 0];
  const mias = e.ausencias.filter((a) => a.usuarioId === u.id && a.hasta >= sumarDias(hoy, -30));
  const [pedir, setPedir] = useState(false);

  return (
    <>
      <Sup titulo="Mi disponibilidad" sub="La ve el encargado al armar la semana" volver="horarios" />
      <main className="pant pila">
        <Seccion titulo="Cuándo puedo" extra="Toca para cambiar">
          <div className="franjas" role="grid" aria-label="Disponibilidad por franjas">
            <span />
            {FRANJAS.map((f) => <span key={f.id} className="etq franja-cab">{f.nombre}</span>)}
            {orden.map((i) => (
              <FilaFranjas key={i} dia={i} franjas={d[i]} onAlternar={(f) => { alternarFranja(u.id, i, f); vibrar(8); }} />
            ))}
          </div>
          <p className="cuerpo">Mañana 6–12, tarde 12–18, noche 18–cierre. Un turno que toca una franja marcada como "no" sale con alerta al armar la semana.</p>
        </Seccion>

        <Seccion titulo="Días libres y vacaciones">
          {mias.length ? (
            <div className="lista">
              {mias.map((a) => (
                <div key={a.id} className="fila">
                  <span className="fila-texto">
                    <span>{a.tipo === 'vacaciones' ? 'Vacaciones' : 'Día libre'} · {a.desde === a.hasta ? fechaCorta(a.desde) : `${fechaCorta(a.desde)} – ${fechaCorta(a.hasta)}`}</span>
                    <span className="fila-sub">{a.motivo}{a.resolvio ? ` · ${primerNombre(e, a.resolvio)}` : ''}</span>
                  </span>
                  <EstadoAusencia a={a} />
                </div>
              ))}
            </div>
          ) : (
            <p className="cuerpo">No has pedido días libres.</p>
          )}
          <button type="button" className="boton grande" onClick={() => setPedir(true)}>Pedir días libres</button>
        </Seccion>
      </main>

      <PedirDias abierta={pedir} alCerrar={() => setPedir(false)} hoy={hoy} />
    </>
  );
}

function FilaFranjas({ dia, franjas, onAlternar }: { dia: number; franjas: Franja[]; onAlternar: (f: Franja) => void }) {
  return (
    <>
      <span className="franja-dia">{DIAS_SEMANA[dia]}</span>
      {FRANJAS.map((f) => {
        const si = franjas.includes(f.id);
        return (
          <button key={f.id} type="button" className="chip franja" aria-pressed={si} onClick={() => onAlternar(f.id)}
            aria-label={`${DIAS_SEMANA[dia]} en la ${f.nombre.toLowerCase()}: ${si ? 'puedo' : 'no puedo'}`}>
            {si ? 'Sí' : 'No'}
          </button>
        );
      })}
    </>
  );
}

const EstadoAusencia = ({ a }: { a: Ausencia }) =>
  a.estado === 'aprobada' ? <Etq fuerte>Aprobado</Etq> : a.estado === 'rechazada' ? <Etq tenue>No aprobado</Etq> : <Etq>Pendiente</Etq>;

function PedirDias({ abierta, alCerrar, hoy }: { abierta: boolean; alCerrar: () => void; hoy: string }) {
  const [desde, setDesde] = useState(sumarDias(hoy, 7));
  const [hasta, setHasta] = useState(sumarDias(hoy, 7));
  const [tipo, setTipo] = useState<Ausencia['tipo']>('dia-libre');
  const [motivo, setMotivo] = useState('');
  const valido = !!desde && !!hasta && desde >= hoy && motivo.trim().length > 1;
  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} titulo="Pedir días libres">
      <div className="chips">
        <button type="button" className="chip" aria-pressed={tipo === 'dia-libre'} onClick={() => setTipo('dia-libre')}>Día libre</button>
        <button type="button" className="chip" aria-pressed={tipo === 'vacaciones'} onClick={() => setTipo('vacaciones')}>Vacaciones</button>
      </div>
      <div className="rejilla-2">
        <label className="campo"><span className="etq">Desde</span><input type="date" value={desde} min={hoy} onChange={(ev) => { setDesde(ev.target.value); if (ev.target.value > hasta) setHasta(ev.target.value); }} /></label>
        <label className="campo"><span className="etq">Hasta</span><input type="date" value={hasta} min={desde} onChange={(ev) => setHasta(ev.target.value)} /></label>
      </div>
      <label className="campo"><span className="etq">Motivo</span><input value={motivo} placeholder="Ej. viaje, trámite, examen" onChange={(ev) => setMotivo(ev.target.value)} /></label>
      <button type="button" className="boton grande lleno" disabled={!valido}
        onClick={() => { pedirAusencia(desde, hasta, tipo, motivo.trim()); alCerrar(); setMotivo(''); vibrar(12); avisar('Solicitud enviada al encargado.'); }}>
        {valido ? 'Enviar al encargado' : desde < hoy ? 'Elige una fecha de hoy en adelante' : 'Escribe el motivo'}
      </button>
    </Hoja>
  );
}

/* ═══ SOLICITUDES: CAMBIOS Y DÍAS LIBRES ══════════════════ */

export function HorariosCambios() {
  const e = useEstado();
  const u = yo(e)!;
  const hoy = jornadaDe();
  const edita = puede(e, 'encargado', 'admin');
  const cambios = e.cambios.filter((c) => c.fecha >= sumarDias(hoy, -7));
  const ausencias = e.ausencias.filter((a) => (edita || a.usuarioId === u.id) && a.hasta >= sumarDias(hoy, -7));

  return (
    <>
      <Sup titulo="Solicitudes" sub="Cambios de turno y días libres" volver="horarios" />
      <main className="pant pila">
        <Seccion titulo="Cambios de turno" extra={`${cambios.length}`}>
          {cambios.length === 0 && <Vacio>No hay cambios en curso.</Vacio>}
          {cambios.map((c) => <TarjetaCambio key={c.id} e={e} c={c} />)}
        </Seccion>

        <Seccion titulo="Días libres y vacaciones" extra={`${ausencias.length}`}>
          {ausencias.length === 0 && <Vacio>No hay solicitudes de días libres.</Vacio>}
          {ausencias.map((a) => {
            const choques = e.semanas.flatMap((s) => Object.entries(s.turnos)
              .filter(([k]) => { const [uid, f] = k.split('|'); return uid === a.usuarioId && f >= a.desde && f <= a.hasta; })
              .map(([k]) => k.split('|')[1]));
            return (
              <section key={a.id} className={`bloque${a.estado === 'pendiente' && edita ? ' inv' : ''}`}>
                <div className="fila-h entre">
                  <span className="fila-h" style={{ gap: 8 }}><Avatar texto={usuario(e, a.usuarioId)?.iniciales ?? ''} /><span>{a.usuarioId === u.id ? 'Tu solicitud' : usuario(e, a.usuarioId)?.nombre}</span></span>
                  <EstadoAusencia a={a} />
                </div>
                <span className="subtitulo">{a.tipo === 'vacaciones' ? 'Vacaciones' : 'Día libre'} · {a.desde === a.hasta ? diaYNum(a.desde) : `${fechaCorta(a.desde)} – ${fechaCorta(a.hasta)}`}</span>
                <span className="cuerpo">“{a.motivo}”{choques.length ? ` · ya tiene turno el ${choques.map(fechaCorta).join(', ')}` : ''}</span>
                {a.estado === 'pendiente' && edita && (
                  <div className="rejilla-2">
                    <button type="button" className="boton" onClick={() => { responderAusencia(a.id, 'rechazar'); avisar('Solicitud no aprobada.'); }}>No aprobar</button>
                    <button type="button" className="boton lleno" onClick={() => { responderAusencia(a.id, 'aprobar'); vibrar([30, 60, 30]); avisar(choques.length ? 'Aprobado. Ajusta sus turnos: salen con alerta.' : 'Aprobado.'); }}>Aprobar</button>
                  </div>
                )}
              </section>
            );
          })}
        </Seccion>
      </main>
    </>
  );
}

function TarjetaCambio({ e, c }: { e: Estado; c: Estado['cambios'][number] }) {
  const u = yo(e)!;
  const edita = puede(e, 'encargado', 'admin');
  const t = e.turnosTipo.find((x) => x.id === c.turnoId);
  const mio = c.de === u.id;
  const yaTrabajo = !!turnoDe(e, u.id, c.fecha);
  // Antes de aprobar: cómo quedaría la semana de quien lo toma.
  const proyeccion = useMemo(() => {
    if (c.estado !== 'aceptado' || !edita || !c.acepta) return [];
    const lunes = lunesDe(c.fecha);
    const sem = e.semanas.find((s) => s.id === lunes);
    if (!sem) return [];
    const simulado = { ...sem.turnos };
    delete simulado[`${c.de}|${c.fecha}`];
    simulado[`${c.acepta}|${c.fecha}`] = c.turnoId;
    const antes = new Set(alertasDe(e, lunes).map((a) => a.texto));
    return alertasDe(e, lunes, simulado).filter((a) => a.usuarioId === c.acepta && !antes.has(a.texto));
  }, [e, c, edita]);

  return (
    <section className={`bloque${c.estado === 'aceptado' && edita ? ' inv' : ''}`}>
      <div className="fila-h entre">
        <span className="fila-h" style={{ gap: 8 }}><Avatar texto={usuario(e, c.de)?.iniciales ?? ''} /><span>{mio ? 'Tu turno' : usuario(e, c.de)?.nombre}</span></span>
        <Etq {...(c.estado === 'aprobado' ? { fuerte: true } : c.estado === 'rechazado' ? { tenue: true } : {})}>
          {{ abierto: 'Buscando', aceptado: 'Por aprobar', aprobado: 'Aprobado', rechazado: 'Rechazado' }[c.estado]}
        </Etq>
      </div>
      <span className="subtitulo">{diaYNum(c.fecha)} · {t?.nombre} {t?.inicio}–{t?.fin}</span>
      <span className="cuerpo">“{c.motivo}”{c.acepta ? ` · lo toma ${usuario(e, c.acepta)?.nombre}` : ''}</span>
      {proyeccion.length > 0 && (
        <div className="pila-s">
          <span className="etq">Si lo apruebas</span>
          {proyeccion.map((a) => <p key={a.texto} className="cuerpo">{a.texto}</p>)}
        </div>
      )}
      {c.estado === 'abierto' && !mio && (
        yaTrabajo
          ? <span className="cuerpo">Ese día ya trabajas.</span>
          : <button type="button" className="boton lleno" onClick={() => { responderCambio(c.id, 'aceptar'); vibrar(12); avisar('Aceptado. Falta que el encargado lo apruebe.'); }}>Yo lo tomo</button>
      )}
      {c.estado === 'aceptado' && edita && (
        <div className="rejilla-2">
          <button type="button" className="boton" onClick={() => { responderCambio(c.id, 'rechazar'); avisar('Cambio rechazado.'); }}>Rechazar</button>
          <button type="button" className="boton lleno" onClick={() => { responderCambio(c.id, 'aprobar'); vibrar([30, 60, 30]); avisar('Aprobado: el horario ya cambió y les llegó el aviso.'); }}>Aprobar</button>
        </div>
      )}
    </section>
  );
}
