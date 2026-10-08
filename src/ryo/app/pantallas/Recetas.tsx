/**
 * Recetas del menú de Ryo: se consultan con una mano y a medio servicio.
 *
 * La lista tiene las mismas secciones que el menú del cliente (Café, Matcha,
 * Sin café, Bar): el barista busca donde el cliente vio la bebida. Cada fila
 * trae el vaso en corte (src/ryo/vaso.ts), el mismo dibujo del menú público,
 * así barra y cliente hablan del mismo vaso. La ficha abre con "Cómo se
 * arma": el dibujo grande con sus capas numeradas en el orden en que se
 * sirven; luego gramos, pasos y el estándar. Las que también van en frío
 * cambian de versión (y de dibujo) con un toque.
 */
import { useState } from 'react';
import { RECETAS, receta as buscarReceta, type Receta, type Tutorial } from '../contenido';
import { useEstado, maquinaDe, nombreBoton, cafe as buscarCafe, recetaCasa } from '../estado';
import { Sup, Seccion, Vacio, Estado as Etq, BarraProg, Pestanas } from '../componentes';
import { vibrar } from '../estado';
import { jornadaDe } from '../lib/tiempo';
import { GUIA } from '../../menuGuia';
import { svgVaso, leyendaDe, spriteVasos, CSS_VASO, type Vaso } from '../../vaso';

const PENDIENTE = /^por (confirmar|definir)$/;

/** Las secciones del menú del cliente y qué grupos de recetas caen en cada una. */
const SECCIONES = [
  { id: 'cafe', texto: 'Café', grupos: ['Clásicos', 'Especiales'] },
  { id: 'matcha', texto: 'Matcha', grupos: ['Matcha'] },
  { id: 'sin-cafe', texto: 'Sin café', grupos: ['Sin café', 'Mocktails'] },
  { id: 'bar', texto: 'Bar', grupos: ['Cócteles'] },
] as const;
type SeccionId = (typeof SECCIONES)[number]['id'];

/** Las tramas y estilos de los vasos: una vez por pantalla. */
function BaseVasos() {
  return (
    <>
      <style>{CSS_VASO}</style>
      <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: spriteVasos() }} />
    </>
  );
}

const vasoDe = (r: Receta, frio = false): Vaso | undefined => {
  const g = GUIA[r.id];
  return frio && g?.frio ? g.frio : g?.vaso;
};

export function RecetasLista() {
  const [q, setQ] = useState('');
  const [sec, setSec] = useState<SeccionId>('cafe');
  const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const buscando = q.trim().length > 0;
  const enSeccion = SECCIONES.find((s) => s.id === sec)!.grupos as readonly string[];
  // Buscando, se busca en todo el menú; si no, solo en la sección elegida.
  const lista = RECETAS.filter((r) => (buscando ? norm(r.nombre).includes(norm(q.trim())) : enSeccion.includes(r.categoria)));
  const grupos = [...new Set(lista.map((r) => r.categoria))];

  return (
    <>
      <BaseVasos />
      <Sup titulo="Recetas" sub={`El menú de Ryo · ${RECETAS.length} bebidas`} />
      <main className="pant pila">
        <label className="buscador">
          <span className="sr">Buscar receta</span>
          <input type="search" value={q} placeholder="Buscar en todo el menú: latte, matcha…" onChange={(ev) => setQ(ev.target.value)} />
        </label>
        {!buscando && (
          <Pestanas etiqueta="Sección del menú" activa={sec} onCambio={setSec}
            opciones={SECCIONES.map((s) => ({ id: s.id, texto: s.texto, leyenda: `${RECETAS.filter((r) => (s.grupos as readonly string[]).includes(r.categoria)).length} bebidas` }))} />
        )}
        {lista.length ? (
          grupos.map((g) => (
            <Seccion key={g} titulo={g} extra={`${lista.filter((r) => r.categoria === g).length}`}>
              <div className="lista">
                {lista.filter((r) => r.categoria === g).map((r) => {
                  const vaso = vasoDe(r);
                  return (
                    <a key={r.id} className="fila receta-fila" href={`#/recetas/${r.id}`}>
                      {vaso && <span className="receta-vaso" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgVaso(vaso) }} />}
                      <span className="fila-texto">
                        <span>{r.nombre}</span>
                        <span className="fila-sub">{PENDIENTE.test(r.vaso) ? 'Vaso por confirmar' : r.vaso}{r.frio ? ' · también en frío' : ''}</span>
                        {r.porConfirmar ? <Etq tenue>Por confirmar</Etq> : r.tutorial ? <Etq fuerte>Tutorial</Etq> : null}
                      </span>
                    </a>
                  );
                })}
              </div>
            </Seccion>
          ))
        ) : (
          <Vacio>Sin recetas con “{q}”.</Vacio>
        )}
      </main>
    </>
  );
}

export function RecetaFicha({ id }: { id: string }) {
  const r = buscarReceta(id);
  if (!r) return <><Sup titulo="Receta" volver="recetas" /><main className="pant"><p className="cuerpo">No encontrada.</p></main></>;
  return <Ficha key={r.id} r={r} />;
}

/**
 * El vaso grande y sus capas, de arriba hacia abajo como se ven, numeradas
 * en el orden en que se sirven: el 1 va primero, hasta abajo.
 */
function ComoSeArma({ vaso }: { vaso: Vaso }) {
  const capas = leyendaDe(vaso);
  return (
    <section className="vaso-ficha" aria-label="Cómo se arma">
      <div className="vaso-ficha-dibujo vaso-llenar" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgVaso(vaso, { recorte: true, numerar: true }) }} />
      <div className="pila-s">
        <span className="etq">Cómo se arma</span>
        <ul className="vaso-ficha-capas">
          {capas.map((c) => (
            <li key={c.nombre}>
              <span className="vaso-ficha-n" aria-hidden="true">{c.n ?? c.marca}</span>
              <span>{c.n ? <span className="sr">Paso {c.n}: </span> : null}{c.nombre}</span>
            </li>
          ))}
        </ul>
        {capas.some((c) => c.n) && <span className="meta">El 1 va primero, hasta abajo.</span>}
      </div>
    </section>
  );
}

function Ficha({ r }: { r: Receta }) {
  const e = useEstado();
  const rd = recetaCasa(e, jornadaDe());
  const [frio, setFrio] = useState(false);
  const usaEspresso = r.id === 'espresso' || r.gramos.some(([k]) => k === 'Espresso');
  const version = frio && r.frio
    ? { vaso: r.frio.vaso, temperatura: 'Frío, con hielo', gramos: r.frio.gramos ?? r.gramos, pasos: r.frio.pasos }
    : { vaso: r.vaso, temperatura: r.temperatura, gramos: r.gramos, pasos: r.pasos };

  const vaso = vasoDe(r, frio);

  return (
    <>
      <BaseVasos />
      <Sup titulo={r.nombre} sub={`${r.categoria} · ${version.vaso}`} volver="recetas" />
      <main className="pant pila">
        {r.frio && (
          <div className="chips" role="group" aria-label="Versión">
            <button type="button" className="chip" aria-pressed={!frio} onClick={() => setFrio(false)}>Caliente</button>
            <button type="button" className="chip" aria-pressed={frio} onClick={() => setFrio(true)}>Frío</button>
          </div>
        )}

        {vaso && <ComoSeArma key={frio ? 'vaso-frio' : 'vaso-caliente'} vaso={vaso} />}

        {r.menu && (
          <Seccion consulta titulo="En el menú">
            <p className="cuerpo">{r.menu}</p>
          </Seccion>
        )}

        {r.porConfirmar && (
          <section className="bloque">
            <Etq tenue>Por confirmar</Etq>
            <p className="cuerpo">Receta de la casa: las cantidades marcadas se definen en barra y se registran aquí antes de servirla.</p>
          </section>
        )}

        <div className="rejilla-2" key={frio ? 'frio' : 'caliente'}>
          <div className="bloque cambia"><span className="etq">Temperatura</span><span className="subtitulo">{version.temperatura}</span></div>
          <div className="bloque cambia"><span className="etq">Tiempo</span><span className="subtitulo">{r.tiempo}</span></div>
        </div>

        {usaEspresso && rd && (
          <section className="bloque inv">
            <span className="etq">Espresso con la receta del día</span>
            <span className="num-m">{rd.dosis.toFixed(1)} → {rd.rendimiento.toFixed(1)} g · {rd.tiempo.toFixed(0)} s</span>
            <span className="cuerpo">{buscarCafe(e, rd.cafeId)?.nombre.split(' · ')[0]} · molienda {rd.molienda} · botón {nombreBoton(maquinaDe(e), rd.botonId)}</span>
          </section>
        )}

        {r.tutorial && <Guia key={frio ? 'frio' : 'caliente'} t={r.tutorial} nombre={r.nombre} frio={frio} />}

        <Seccion consulta titulo="Cantidades">
          <div className="lista cambia" key={frio ? 'frio' : 'caliente'}>
            {version.gramos.map(([k, v]) => (
              <div key={k} className="par">
                <span className="etq">{k}</span>
                <span className={PENDIENTE.test(v) ? 'cuerpo' : ''}>{v}</span>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion titulo={r.tutorial ? 'Pasos, en corto' : 'Pasos'}>
          <ol className="pasos cambia" key={frio ? 'frio' : 'caliente'}>{version.pasos.map((p) => <li key={p}>{p}</li>)}</ol>
        </Seccion>

        <Seccion consulta titulo="Estándar">
          <p className="cuerpo">{r.estandar}</p>
        </Seccion>

        {r.tutorial && <Apoyo t={r.tutorial} />}
      </main>
    </>
  );
}

/* ═══ TUTORIAL GUIADO ═════════════════════════════════════ */

/**
 * Un paso a la vez, con letra grande: qué hacer, por qué, y cómo saber que
 * quedó. Pensado para seguirlo en barra con las manos ocupadas: un botón
 * grande para avanzar y la lista completa a un toque.
 */
function Guia({ t, nombre, frio = false }: { t: Tutorial; nombre: string; frio?: boolean }) {
  const [i, setI] = useState<number | null>(null);
  const [todos, setTodos] = useState(false);
  // En frío cambia el final (hielo y leche fría en lugar de vaporizador).
  const pasos = frio && t.frio ? [...t.pasos.slice(0, t.frio.desde), ...t.frio.pasos] : t.pasos;
  const total = pasos.length;
  const ir = (n: number | null) => { setI(n); vibrar(8); document.getElementById('guia')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  if (i === null) {
    return (
      <section id="guia" className="bloque inv" aria-label="Tutorial">
        <span className="etq">Tutorial · {total} pasos</span>
        <span className="subtitulo">Cómo preparar {nombre.toLowerCase()}{frio ? ' frío' : ''}</span>
        <p className="cuerpo">{t.intro}</p>
        <div className="lista">
          {t.utensilios.map(([k, v]) => (
            <div key={k} className="par"><span className="etq">{k}</span><span>{v}</span></div>
          ))}
        </div>
        <button type="button" className="boton grande lleno" onClick={() => ir(0)}>Empezar paso a paso</button>
      </section>
    );
  }

  const fin = i >= total;
  const p = pasos[Math.min(i, total - 1)];
  return (
    <Seccion titulo={fin ? 'Listo' : `Paso ${i + 1} de ${total}`} extra={<button type="button" className="enlace" onClick={() => ir(null)}>Salir</button>}>
      <span id="guia" className="guia-ancla" />
      <BarraProg valor={Math.min(i, total) / total} />
      {fin ? (
        <div className="pila cambia" key="fin">
          <span className="subtitulo">Antes de entregarlo, revisa:</span>
          <ol className="pasos">{t.bien.map((x) => <li key={x}>{x}</li>)}</ol>
          <div className="rejilla-2">
            <button type="button" className="boton" onClick={() => ir(total - 1)}>Anterior</button>
            <button type="button" className="boton lleno" onClick={() => ir(null)}>Terminar</button>
          </div>
        </div>
      ) : (
        <div className="pila cambia" key={i}>
          <span className="guia-titulo">{p.titulo}</span>
          <p className="guia-que">{p.que}</p>
          <div className="pila-s">
            <span className="etq">Por qué</span>
            <p className="cuerpo">{p.porque}</p>
          </div>
          <div className="bloque inv guia-senal">
            <span className="etq">Quedó bien si</span>
            <p className="recta">{p.senal}</p>
          </div>
          <div className="rejilla-2">
            <button type="button" className="boton" disabled={i === 0} onClick={() => ir(i - 1)}>Anterior</button>
            <button type="button" className="boton lleno" onClick={() => ir(i + 1)}>{i === total - 1 ? 'Revisar' : 'Siguiente'}</button>
          </div>
          <button type="button" className="enlace" onClick={() => setTodos(!todos)}>{todos ? 'Ocultar todos los pasos' : 'Ver todos los pasos'}</button>
          {todos && (
            <div className="lista">
              {pasos.map((x, n) => (
                <button key={x.titulo} type="button" className="fila" aria-pressed={n === i} onClick={() => ir(n)}>
                  <span className={`avatar${n < i ? ' lleno' : ''}`} style={{ borderRadius: 0 }}>{n + 1}</span>
                  <span className="fila-texto"><span className={n === i ? 'negrita' : ''}>{x.titulo}</span></span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Seccion>
  );
}

/** Lo que acompaña al tutorial: cómo se ve bien hecho, qué hacer si falla y el cuidado. */
function Apoyo({ t }: { t: Tutorial }) {
  return (
    <>
      <Seccion titulo="Bien hecho se ve así">
        <ol className="pasos">{t.bien.map((x) => <li key={x}>{x}</li>)}</ol>
      </Seccion>
      <Seccion titulo="Si algo sale mal">
        <div className="lista">
          {t.fallas.map(([k, v]) => (
            <div key={k} className="fila" style={{ alignItems: 'flex-start' }}>
              <span className="fila-texto"><span className="negrita">{k}</span><span className="fila-sub">{v}</span></span>
            </div>
          ))}
        </div>
      </Seccion>
      <Seccion titulo="Cuidado del matcha y del chasen">
        <ol className="pasos">{t.cuidado.map((x) => <li key={x}>{x}</li>)}</ol>
      </Seccion>
    </>
  );
}
