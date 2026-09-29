/**
 * Capacitación: niveles, lecciones cortas con práctica de recuperación,
 * repaso espaciado diario y la evaluación práctica que firma el encargado.
 */
import { useState } from 'react';
import {
  useEstado, yo, usuario, progresoDe, puede, completarLeccion, responderRepaso, firmarEvaluacion, reasignar,
  avisar, celebrar, vibrar, type Estado, type Usuario,
} from '../estado';
import {
  NIVELES, MODULOS, LECCIONES, RUBRICAS, ONBOARDING, leccion as buscarLeccion, leccionesDe, preguntaPorId, receta,
  type Leccion, type Bloque,
} from '../contenido';
import { Sup, Seccion, BarraProg, Casilla, Avatar, Hoja, Marca, Estado as Etq, ir } from '../componentes';
import { tocaHoy, INTERVALOS } from '../lib/repaso';
import { jornadaDe, diasEntre, cuando, fechaCorta } from '../lib/tiempo';

const hechasDe = (e: Estado, u: Usuario, moduloId: string) =>
  leccionesDe(moduloId).filter((l) => progresoDe(e, u.id).lecciones[l.id]).length;

/* ═══ INICIO DE APRENDER ══════════════════════════════════ */

export function AprenderInicio() {
  const e = useEstado();
  const u = yo(e)!;
  const hoy = jornadaDe();
  const prog = progresoDe(e, u.id);
  const repaso = Object.values(prog.repaso).filter((x) => tocaHoy(x, hoy)).length;
  const enIngreso = diasEntre(u.ingreso, hoy) < 35;
  const nivel = NIVELES.find((n) => n.nivel === u.nivel)!;
  const deMiNivel = MODULOS.filter((m) => m.nivel === u.nivel);
  const totalNivel = deMiNivel.reduce((a, m) => a + leccionesDe(m.id).length, 0);
  const hechasNivel = deMiNivel.reduce((a, m) => a + hechasDe(e, u, m.id), 0);

  return (
    <>
      <Sup titulo="Aprender" sub={`${nivel.nombre} · ${nivel.meta}`} volver="mas" />
      <main className="pant pila">
        <section className="bloque inv">
          <span className="etq">Repaso de hoy</span>
          {repaso ? (
            <>
              <span className="num-l">{repaso}</span>
              <span className="cuerpo">pregunta{repaso === 1 ? '' : 's'} para no olvidar lo que ya aprendiste. Dos minutos.</span>
              <a className="boton grande lleno" href="#/aprender/repaso">Empezar repaso</a>
            </>
          ) : (
            <span className="cuerpo">Al día. Las preguntas regresan en {INTERVALOS.join(', ')} días según qué tan bien las recuerdes.</span>
          )}
        </section>

        {prog.asignadas.length > 0 && (
          <Seccion titulo="Asignadas por el encargado">
            <div className="lista">
              {prog.asignadas.map((a) => (
                <a key={a.leccionId} className="fila" href={`#/aprender/leccion/${a.leccionId}`}>
                  <span className="fila-texto">
                    <span>{buscarLeccion(a.leccionId)?.titulo}</span>
                    <span className="fila-sub">{a.motivo} · {usuario(e, a.por)?.iniciales}</span>
                  </span>
                </a>
              ))}
            </div>
          </Seccion>
        )}

        {enIngreso && (
          <a className="bloque bloque-toque" href="#/aprender/ingreso">
            <span className="fila-h entre"><span className="etq">Tu ruta de ingreso</span><Etq>Semana {Math.min(4, Math.floor(diasEntre(u.ingreso, hoy) / 7) + 1)}</Etq></span>
            <span className="cuerpo">Cuatro semanas: barra, espresso, leche y tu evaluación de Barista 1.</span>
          </a>
        )}

        <Seccion titulo={nivel.nombre} extra={`${hechasNivel}/${totalNivel}`}>
          <BarraProg valor={totalNivel ? hechasNivel / totalNivel : 0} />
        </Seccion>

        {NIVELES.map((n) => (
          <Seccion key={n.nivel} titulo={n.nombre} extra={n.nivel < u.nivel ? 'Aprobado' : n.nivel === u.nivel ? 'Actual' : 'Después'}>
            <div className="lista">
              {MODULOS.filter((m) => m.nivel === n.nivel).map((m) => {
                const ls = leccionesDe(m.id);
                return ls.map((l) => {
                  const hecha = !!prog.lecciones[l.id];
                  return (
                    <a key={l.id} className="fila" href={`#/aprender/leccion/${l.id}`}>
                      <Casilla hecha={hecha} />
                      <span className="fila-texto">
                        <span>{l.titulo}</span>
                        <span className="fila-sub">{m.titulo} · {l.minutos} min</span>
                      </span>
                    </a>
                  );
                });
              })}
            </div>
          </Seccion>
        ))}

        {puede(e, 'encargado', 'admin') && <a className="boton grande" href="#/aprender/equipo">Equipo y evaluaciones</a>}
      </main>
    </>
  );
}

/* ═══ LECCIÓN ═════════════════════════════════════════════ */

function VerBloque({ b }: { b: Bloque }) {
  if (b.tipo === 'texto') return <p className="cuerpo" style={{ fontSize: '0.95rem' }}>{b.texto}</p>;
  if (b.tipo === 'clave') return <p className="bloque inv recta">{b.texto}</p>;
  if (b.tipo === 'ficha') {
    return (
      <div className="lista">
        {b.filas.map(([k, v]) => (
          <div key={k} className="par">
            <span className="etq">{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
    );
  }
  if (b.tipo === 'receta') {
    const r = receta(b.recetaId);
    return r ? <a className="fila" href={`#/recetas/${r.id}`}><span className="fila-texto"><span>Receta: {r.nombre}</span><span className="fila-sub">{r.gramos.map(([k, v]) => `${k} ${v}`).join(' · ')}</span></span></a> : null;
  }
  return (
    <div className="bloque" style={{ aspectRatio: '16 / 9', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <span className="etq">Video · {b.duracion}</span>
      <span className="cuerpo">{b.titulo}</span>
      <span className="cuerpo">En la maqueta no hay video; en el sistema se sube desde Administración.</span>
    </div>
  );
}

export function AprenderLeccion({ id }: { id: string }) {
  const l = buscarLeccion(id);
  if (!l) return <><Sup titulo="Lección" volver="aprender" /><main className="pant"><p className="cuerpo">No encontrada.</p></main></>;
  return <VerLeccion key={l.id} l={l} />;
}

function VerLeccion({ l }: { l: Leccion }) {
  const e = useEstado();
  const u = yo(e)!;
  const hecha = progresoDe(e, u.id).lecciones[l.id];
  const [vistas, setVistas] = useState<boolean[]>(l.preguntas.map(() => false));
  const [aciertos, setAciertos] = useState<(boolean | undefined)[]>(l.preguntas.map(() => undefined));
  const listas = aciertos.every((a) => a !== undefined);
  const siguiente = LECCIONES[LECCIONES.indexOf(l) + 1];

  return (
    <>
      <Sup titulo={l.titulo} sub={`${MODULOS.find((m) => m.id === l.moduloId)?.titulo} · ${l.minutos} min`} volver="aprender" />
      <main className="pant pila">
        {l.bloques.map((b, i) => <VerBloque key={i} b={b} />)}

        <Seccion titulo="Sin ver: ¿lo recuerdas?" extra={`${aciertos.filter((a) => a !== undefined).length}/${l.preguntas.length}`}>
          <p className="cuerpo">Contesta de memoria antes de ver la respuesta. Recordar es lo que fija lo aprendido.</p>
          {l.preguntas.map((q, i) => (
            <div key={q.id} className={`tarjeta${vistas[i] ? ' inv' : ''}`} style={{ minHeight: 0 }}>
              <span className="subtitulo">{q.pregunta}</span>
              {vistas[i] ? (
                <>
                  <span className="cuerpo">{q.respuesta}</span>
                  <div className="rejilla-2">
                    {[false, true].map((ok) => (
                      <button key={String(ok)} type="button" className="chip" aria-pressed={aciertos[i] === ok}
                        onClick={() => { setAciertos((a) => a.map((x, j) => (j === i ? ok : x))); vibrar(8); }}>
                        {ok ? 'La sabía' : 'No la sabía'}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <button type="button" className="boton" onClick={() => setVistas((v) => v.map((x, j) => (j === i ? true : x)))}>Ver respuesta</button>
              )}
            </div>
          ))}
        </Seccion>

        <div className="pie-accion">
          <button type="button" className={`boton grande${listas ? ' lleno' : ''}`}
            onClick={() => {
              if (!listas) {
                const i = aciertos.findIndex((a) => a === undefined);
                avisar(`Falta contestar la pregunta ${i + 1}.`);
                return;
              }
              completarLeccion(l.id, l.preguntas.map((q) => q.id), aciertos as boolean[]);
              vibrar([20, 40, 20]);
              avisar('Lección terminada. Sus preguntas regresan mañana en tu repaso.');
              ir(siguiente ? `aprender/leccion/${siguiente.id}` : 'aprender');
            }}>
            {!listas ? 'Contesta las preguntas para terminar' : hecha ? 'Terminar otra vez' : 'Terminar lección'}
          </button>
        </div>
      </main>
    </>
  );
}

/* ═══ REPASO ESPACIADO ════════════════════════════════════ */

export function AprenderRepaso() {
  const e = useEstado();
  const u = yo(e)!;
  const hoy = jornadaDe();
  const prog = progresoDe(e, u.id);
  // La fila se fija al entrar: contestar reprograma la pregunta y la saca de hoy.
  const [fila] = useState(() => Object.entries(prog.repaso).filter(([, x]) => tocaHoy(x, hoy)).map(([id]) => id));
  const [i, setI] = useState(0);
  const [lado, setLado] = useState<'pregunta' | 'respuesta'>('pregunta');
  const [bien, setBien] = useState(0);
  const q = preguntaPorId(fila[i] ?? '');

  if (!q) {
    return (
      <>
        <Sup titulo="Repaso" volver="aprender" />
        <main className="pant pila">
          <section className="bloque inv repaso-fin">
            <Marca tipo="isotipo" alto={64} revela />
            <span className="etq">Listo por hoy</span>
            <span className="num-l">{bien}/{fila.length}</span>
            <span className="cuerpo">{fila.length ? 'Lo que recordaste regresa en más días; lo que no, mañana.' : 'No tienes preguntas pendientes hoy.'}</span>
          </section>
          <a className="boton grande" href="#/inicio">Volver al inicio</a>
        </main>
      </>
    );
  }

  const responder = (acierto: boolean) => {
    responderRepaso(q.id, acierto);
    if (acierto) setBien((b) => b + 1);
    vibrar(acierto ? 12 : [20, 40, 20]);
    setLado('pregunta');
    setI((x) => x + 1);
  };

  return (
    <>
      <Sup titulo="Repaso" sub={`${i + 1} de ${fila.length} · ${q.leccion.titulo}`} volver="aprender" />
      <main className="pant pila">
        <BarraProg valor={i / fila.length} />
        <button key={`${i}-${lado}`} type="button" className={`tarjeta${lado === 'respuesta' || i > 0 ? ' gira' : ''}`} data-lado={lado} onClick={() => setLado('respuesta')} aria-live="polite" style={{ textAlign: 'left' }}>
          <span className="etq">{lado === 'pregunta' ? 'Pregunta' : 'Respuesta'}</span>
          <span className="subtitulo">{lado === 'pregunta' ? q.pregunta : q.respuesta}</span>
          <span className="cuerpo">{lado === 'pregunta' ? 'Contéstala en voz baja y toca para ver la respuesta.' : q.pregunta}</span>
        </button>
        {lado === 'respuesta' && (
          <div className="rejilla-2">
            <button type="button" className="boton grande" onClick={() => responder(false)}>No me acordé</button>
            <button type="button" className="boton grande lleno" onClick={() => responder(true)}>Me acordé</button>
          </div>
        )}
      </main>
    </>
  );
}

/* ═══ RUTA DE INGRESO ═════════════════════════════════════ */

export function AprenderIngreso() {
  const e = useEstado();
  const u = yo(e)!;
  const prog = progresoDe(e, u.id);
  const semana = Math.min(4, Math.floor(diasEntre(u.ingreso, jornadaDe()) / 7) + 1);

  return (
    <>
      <Sup titulo="Ruta de ingreso" sub={`Entraste el ${fechaCorta(u.ingreso)}`} volver="aprender" />
      <main className="pant pila">
        {ONBOARDING.map((s) => (
          <section key={s.semana} className={`bloque${s.semana === semana ? ' inv' : ''}`}>
            <div className="fila-h entre">
              <span className="etq">Semana {s.semana}</span>
              {s.semana < semana ? <Etq>Pasada</Etq> : s.semana === semana ? <Etq>Esta semana</Etq> : null}
            </div>
            <span className="subtitulo">{s.titulo}</span>
            {s.lecciones.map((id) => {
              const l = buscarLeccion(id)!;
              return (
                <a key={id} className="fila-h" href={`#/aprender/leccion/${id}`} style={{ gap: 10, textDecoration: 'none', minHeight: 36 }}>
                  <Casilla hecha={!!prog.lecciones[id]} /> <span className="cuerpo">{l.titulo}</span>
                </a>
              );
            })}
            <span className="cuerpo">Práctica: {s.practica}</span>
          </section>
        ))}
      </main>
    </>
  );
}

/* ═══ EQUIPO Y EVALUACIÓN (encargado) ═════════════════════ */

export function AprenderEquipo() {
  const e = useEstado();
  const hoy = jornadaDe();
  return (
    <>
      <Sup titulo="Equipo" sub="Niveles y evaluaciones" volver="aprender" />
      <main className="pant pila">
        <div className="lista">
          {e.usuarios.filter((u) => u.activo && u.rol === 'barista').map((u) => {
            const p = progresoDe(e, u.id);
            const atrasadas = Object.values(p.repaso).filter((x) => x.proxima < hoy).length;
            return (
              <a key={u.id} className="fila" href={`#/aprender/evaluar/${u.id}`}>
                <Avatar texto={u.iniciales} />
                <span className="fila-texto">
                  <span>{u.nombre}</span>
                  <span className="fila-sub">
                    Barista {u.nivel} · {Object.keys(p.lecciones).length} lecciones{atrasadas ? ` · ${atrasadas} repasos atrasados` : ''}
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      </main>
    </>
  );
}

export function AprenderEvaluar({ id }: { id: string }) {
  const e = useEstado();
  const u = usuario(e, id);
  const [criterios, setCriterios] = useState<boolean[]>(() => (u ? RUBRICAS[u.nivel].map(() => false) : []));
  const [asignar, setAsignar] = useState(false);
  const [leccionId, setLeccionId] = useState(LECCIONES[0].id);
  const [motivo, setMotivo] = useState('');
  if (!u) return <><Sup titulo="Evaluación" volver="aprender/equipo" /><main className="pant"><p className="cuerpo">No encontrado.</p></main></>;
  const p = progresoDe(e, u.id);
  const previa = p.evaluaciones[u.nivel];
  const rubrica = RUBRICAS[u.nivel];
  const todo = criterios.every(Boolean);

  return (
    <>
      <Sup titulo={u.nombre} sub={`Barista ${u.nivel} · ingresó ${cuando(u.ingreso).toLowerCase()}`} volver="aprender/equipo" />
      <main className="pant pila">
        <Seccion titulo={`Evaluación práctica · Barista ${u.nivel}`} extra={`${criterios.filter(Boolean).length}/${rubrica.length}`}>
          <p className="cuerpo">Se evalúa en barra, frente al encargado. Marca solo lo que viste.</p>
          <div className="lista">
            {rubrica.map((c, i) => (
              <button key={c} type="button" className="fila" aria-pressed={criterios[i]}
                onClick={() => { setCriterios((x) => x.map((v, j) => (j === i ? !v : v))); vibrar(10); }}>
                <Casilla hecha={criterios[i]} />
                <span className="fila-texto italica">{c}</span>
              </button>
            ))}
          </div>
          {previa && <p className="cuerpo">Última firma: {usuario(e, previa.por)?.nombre}, {fechaCorta(jornadaDe(previa.en))}, {previa.criterios.filter(Boolean).length} de {previa.criterios.length}.</p>}
          <button type="button" className={`boton grande${todo ? ' lleno' : ''}`}
            onClick={() => {
              firmarEvaluacion(u.id, u.nivel, criterios);
              vibrar([30, 60, 30]);
              if (todo && u.nivel < 3) celebrar(`Barista ${u.nivel + 1}.`, `${u.nombre.split(' ')[0]} sube de nivel. Firmado por ti.`);
              else avisar('Evaluación firmada. Queda en su historial.');
            }}>
            {todo ? (u.nivel < 3 ? `Firmar y subir a Barista ${u.nivel + 1}` : 'Firmar') : 'Firmar como parcial'}
          </button>
        </Seccion>

        <Seccion titulo="Reentrenamiento">
          <p className="cuerpo">Si algo falla en barra, asígnale la lección: le aparece en su inicio hasta que la termine.</p>
          <button type="button" className="boton grande" onClick={() => setAsignar(true)}>Asignar lección</button>
        </Seccion>
      </main>

      <Hoja abierta={asignar} alCerrar={() => setAsignar(false)} titulo={`Asignar a ${u.nombre.split(' ')[0]}`}>
        <label className="campo">
          <span className="etq">Lección</span>
          <select value={leccionId} onChange={(ev) => setLeccionId(ev.target.value)}>
            {LECCIONES.map((l) => <option key={l.id} value={l.id}>{l.titulo}</option>)}
          </select>
        </label>
        <label className="campo">
          <span className="etq">Por qué</span>
          <input value={motivo} placeholder="Ej. shots ácidos en la mañana" onChange={(ev) => setMotivo(ev.target.value)} />
        </label>
        <button type="button" className="boton grande lleno" disabled={!motivo.trim()}
          onClick={() => { reasignar(u.id, leccionId, motivo.trim()); setAsignar(false); setMotivo(''); avisar('Lección asignada.'); }}>
          {motivo.trim() ? 'Asignar' : 'Escribe el motivo'}
        </button>
      </Hoja>
    </>
  );
}
