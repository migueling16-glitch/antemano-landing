/**
 * Recetas del menú de Ryo: se consultan con una mano y a medio servicio.
 * Búsqueda, los tres grupos del menú y la ficha con gramos, pasos y el
 * estándar de calidad; las que también van en frío cambian de versión
 * con un toque.
 */
import { useState } from 'react';
import { RECETAS, receta as buscarReceta, type Receta } from '../contenido';
import { useEstado, maquinaDe, nombreBoton, cafe as buscarCafe, recetaCasa } from '../estado';
import { Sup, Seccion, Vacio, Estado as Etq } from '../componentes';
import { jornadaDe } from '../lib/tiempo';

const CATEGORIAS = ['Todas', ...new Set(RECETAS.map((r) => r.categoria))];
const PENDIENTE = /^por (confirmar|definir)$/;

export function RecetasLista() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Todas');
  const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const lista = RECETAS.filter((r) => (cat === 'Todas' || r.categoria === cat) && norm(r.nombre).includes(norm(q.trim())));
  const grupos = [...new Set(lista.map((r) => r.categoria))];

  return (
    <>
      <Sup titulo="Recetas" sub={`El menú de Ryo · ${RECETAS.length} bebidas`} />
      <main className="pant pila">
        <label className="buscador">
          <span className="sr">Buscar receta</span>
          <input type="search" value={q} placeholder="Buscar: latte, matcha…" onChange={(ev) => setQ(ev.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Grupo del menú">
          {CATEGORIAS.map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        {lista.length ? (
          grupos.map((g) => (
            <Seccion key={g} titulo={g} extra={`${lista.filter((r) => r.categoria === g).length}`}>
              <div className="lista">
                {lista.filter((r) => r.categoria === g).map((r) => (
                  <a key={r.id} className="fila" href={`#/recetas/${r.id}`}>
                    <span className="fila-texto">
                      <span>{r.nombre}</span>
                      <span className="fila-sub">{r.vaso}{r.frio ? ' · también en frío' : ''}</span>
                    </span>
                    {r.porConfirmar && <Etq tenue>Por confirmar</Etq>}
                  </a>
                ))}
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

function Ficha({ r }: { r: Receta }) {
  const e = useEstado();
  const rd = recetaCasa(e, jornadaDe());
  const [frio, setFrio] = useState(false);
  const usaEspresso = r.categoria !== 'Matchas';
  const version = frio && r.frio
    ? { vaso: r.frio.vaso, temperatura: 'Frío, con hielo', gramos: r.frio.gramos ?? r.gramos, pasos: r.frio.pasos }
    : { vaso: r.vaso, temperatura: r.temperatura, gramos: r.gramos, pasos: r.pasos };

  return (
    <>
      <Sup titulo={r.nombre} sub={`${r.categoria} · ${version.vaso}`} volver="recetas" />
      <main className="pant pila">
        {r.frio && (
          <div className="chips" role="group" aria-label="Versión">
            <button type="button" className="chip" aria-pressed={!frio} onClick={() => setFrio(false)}>Caliente</button>
            <button type="button" className="chip" aria-pressed={frio} onClick={() => setFrio(true)}>Frío</button>
          </div>
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

        <Seccion titulo="Cantidades">
          <div className="lista cambia" key={frio ? 'frio' : 'caliente'}>
            {version.gramos.map(([k, v]) => (
              <div key={k} className="par">
                <span className="etq">{k}</span>
                <span className={PENDIENTE.test(v) ? 'cuerpo' : ''}>{v}</span>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Pasos">
          <ol className="pasos cambia" key={frio ? 'frio' : 'caliente'}>{version.pasos.map((p) => <li key={p}>{p}</li>)}</ol>
        </Seccion>

        <Seccion titulo="Estándar">
          <p className="cuerpo">{r.estandar}</p>
        </Seccion>
      </main>
    </>
  );
}
