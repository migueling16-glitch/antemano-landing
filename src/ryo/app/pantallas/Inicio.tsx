/**
 * Inicio: lo que importa en este turno, en el orden en que se necesita.
 * Turno → receta del día → checklists → repaso. El encargado ve además lo
 * que espera su firma.
 */
import {
  useEstado, yo, usuario, plantillasDeHoy, ejecucionDe, fueraDeRango, progresoDe, puede, maquinaDe, nombreBoton,
  plantilla as buscarPlantilla, cafe as buscarCafe, type Estado,
} from '../estado';
import { Sup, Seccion, Estado as Etq, BarraProg, Vacio } from '../componentes';
import { resumen } from './Checklists';
import { tocaHoy } from '../lib/repaso';
import { jornadaDe, hora, fechaCorta, nombreDia, lunesDe, sumarDias, cuando, dgo } from '../lib/tiempo';

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

export function Inicio() {
  const e = useEstado();
  const u = yo(e)!;
  const hoy = jornadaDe();
  const m = maquinaDe(e);
  const rd = e.recetasDelDia[hoy];
  const cafeHoy = rd && buscarCafe(e, rd.cafeId);
  const turnoHoy = turnoDe(e, u.id, hoy);
  const proximo = !turnoHoy
    ? Array.from({ length: 13 }, (_, i) => sumarDias(hoy, i + 1)).map((f) => ({ f, t: turnoDe(e, u.id, f) })).find((x) => x.t)
    : undefined;
  const prog = progresoDe(e, u.id);
  const repaso = Object.values(prog.repaso).filter((x) => tocaHoy(x, hoy)).length;
  const esEncargado = puede(e, 'encargado', 'admin');

  return (
    <>
      <Sup marca titulo={`${saludo()}, ${u.nombre.split(' ')[0]}`} sub={`${nombreDia(hoy)} ${fechaCorta(hoy).split(' ').slice(1).join(' ')} · ${e.sucursal.nombre}`} />
      <main className="pant pila">
        <section className={`bloque${turnoHoy ? ' inv' : ''}`} aria-label="Turno">
          {turnoHoy ? (
            <>
              <span className="etq">Hoy trabajas</span>
              <span className="num-m">{turnoHoy.nombre} · {turnoHoy.inicio}–{turnoHoy.fin}</span>
            </>
          ) : (
            <>
              <span className="etq">Hoy descansas</span>
              <span className="cuerpo">{proximo ? `Tu próximo turno: ${cuando(proximo.f).toLowerCase()}, ${proximo.t!.nombre.toLowerCase()} ${proximo.t!.inicio}–${proximo.t!.fin}.` : 'Sin turnos publicados.'}</span>
            </>
          )}
          <a className="enlace" href="#/horarios">Ver horario</a>
        </section>

        <a className="bloque bloque-toque" href="#/calibrar" style={{ textDecoration: 'none' }} aria-label="Receta del día">
          <span className="fila-h entre">
            <span className="etq">Receta del día</span>
            {rd ? <Etq fuerte>{hora(rd.en)} · {usuario(e, rd.por)?.iniciales}</Etq> : <Etq>Sin calibrar</Etq>}
          </span>
          {rd && cafeHoy ? (
            <>
              <span className="num-m">{rd.dosis.toFixed(1)} → {rd.rendimiento.toFixed(1)} g · {rd.tiempo.toFixed(0)} s</span>
              <span className="cuerpo">{cafeHoy.nombre.split(' · ')[0]} · molienda {rd.molienda} · botón {nombreBoton(m, rd.botonId)}</span>
            </>
          ) : (
            <span className="cuerpo">Nadie ha calibrado hoy. Toca para calibrar antes del primer espresso.</span>
          )}
        </a>

        <Seccion titulo="Checklists de hoy">
          <div className="lista">
            {plantillasDeHoy(e, hoy).map((p) => {
              const ej = ejecucionDe(e, p.id, hoy);
              const r = resumen(p, ej);
              return (
                <a key={p.id} className="fila" href={ej ? `#/checklists/ej/${ej.id}` : '#/checklists'}>
                  <span className="fila-texto">
                    <span>{p.nombre}</span>
                    {!r.hecho && ej && <BarraProg valor={r.hechas / r.total} />}
                  </span>
                  {r.hecho ? <Etq fuerte>{r.texto}</Etq> : r.atrasada ? <Etq fuerte>Atrasado</Etq> : <Etq tenue>{r.texto}</Etq>}
                </a>
              );
            })}
          </div>
        </Seccion>

        {(repaso > 0 || prog.asignadas.length > 0) && (
          <Seccion titulo="Aprender">
            <div className="lista">
              {repaso > 0 && (
                <a className="fila" href="#/aprender/repaso">
                  <span className="fila-texto">
                    <span>Repaso de hoy</span>
                    <span className="fila-sub">{repaso} pregunta{repaso === 1 ? '' : 's'} · 2 minutos</span>
                  </span>
                </a>
              )}
              {prog.asignadas.map((a) => (
                <a key={a.leccionId} className="fila" href={`#/aprender/leccion/${a.leccionId}`}>
                  <span className="fila-texto">
                    <span>Lección asignada</span>
                    <span className="fila-sub">{a.motivo} · {usuario(e, a.por)?.iniciales}</span>
                  </span>
                </a>
              ))}
            </div>
          </Seccion>
        )}

        {esEncargado && <PorAtender e={e} />}
      </main>
    </>
  );
}

/** Lo que espera al encargado: firmas, lecturas fuera de rango y cambios. */
function PorAtender({ e }: { e: Estado }) {
  const hoy = jornadaDe();
  const sinValidar = e.ejecuciones.filter((x) => x.completadaEn && !x.validadaEn);
  const fuera = e.ejecuciones
    .filter((x) => x.jornada >= sumarDias(hoy, -1))
    .flatMap((x) => fueraDeRango(x).map((mk) => ({ ej: x, mk })));
  const cambios = e.cambios.filter((c) => c.estado === 'aceptado');
  const total = sinValidar.length + fuera.length + cambios.length;

  return (
    <Seccion titulo="Por atender" extra={total ? String(total) : 'Al día'}>
      {total === 0 && <Vacio>Todo en calma. Nada espera tu firma.</Vacio>}
      <div className="lista">
        {sinValidar.map((x) => (
          <a key={x.id} className="fila" href={`#/checklists/ej/${x.id}`}>
            <span className="fila-texto">
              <span>Validar {buscarPlantilla(e, x.plantillaId)?.nombre.toLowerCase()}</span>
              <span className="fila-sub">{cuando(x.jornada)} · {usuario(e, x.completadaPor)?.nombre} · {hora(x.completadaEn!)}</span>
            </span>
          </a>
        ))}
        {fuera.map(({ ej, mk }, i) => (
          <a key={`${ej.id}-${i}`} className="fila" href={`#/checklists/ej/${ej.id}`}>
            <span className="fila-texto">
              <span>Lectura fuera de rango: {mk.valor?.toFixed(1)} °C</span>
              <span className="fila-sub">{cuando(ej.jornada)} · {usuario(e, mk.por)?.iniciales} · {mk.acciones?.length ? mk.acciones.join(', ') : 'sin acción anotada'}</span>
            </span>
          </a>
        ))}
        {cambios.map((c) => (
          <a key={c.id} className="fila" href="#/horarios/cambios">
            <span className="fila-texto">
              <span>Aprobar cambio de turno</span>
              <span className="fila-sub">{usuario(e, c.de)?.iniciales} → {usuario(e, c.acepta)?.iniciales} · {nombreDia(c.fecha)} {fechaCorta(c.fecha).split(' ').slice(1).join(' ')}</span>
            </span>
          </a>
        ))}
      </div>
    </Seccion>
  );
}
