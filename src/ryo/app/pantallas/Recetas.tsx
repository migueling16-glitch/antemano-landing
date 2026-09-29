/**
 * Recetas estándar: se consultan con una mano y a medio servicio. Búsqueda,
 * categorías y la ficha con gramos, pasos y el estándar de calidad.
 */
import { useState } from 'react';
import { RECETAS, receta as buscarReceta, type Receta } from '../contenido';
import { useEstado, maquinaDe, nombreBoton, cafe as buscarCafe } from '../estado';
import { Sup, Seccion } from '../componentes';
import { jornadaDe } from '../lib/tiempo';

const CATEGORIAS = ['Todas', ...new Set(RECETAS.map((r) => r.categoria))];

export function RecetasLista() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Todas');
  const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const lista = RECETAS.filter((r) => (cat === 'Todas' || r.categoria === cat) && norm(r.nombre).includes(norm(q.trim())));

  return (
    <>
      <Sup titulo="Recetas" sub={`${RECETAS.length} estándar de la barra`} />
      <main className="pant pila">
        <label className="buscador">
          <span className="sr">Buscar receta</span>
          <input type="search" value={q} placeholder="Buscar: latte, matcha…" onChange={(ev) => setQ(ev.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Categoría">
          {CATEGORIAS.map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        {lista.length ? (
          <div className="lista">
            {lista.map((r) => (
              <a key={r.id} className="fila" href={`#/recetas/${r.id}`}>
                <span className="fila-texto">
                  <span>{r.nombre}</span>
                  <span className="fila-sub">{r.vaso} · {r.tiempo}</span>
                </span>
                <span className="fila-der">{r.categoria}</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="cuerpo">Sin recetas con “{q}”.</p>
        )}
      </main>
    </>
  );
}

export function RecetaFicha({ id }: { id: string }) {
  const r = buscarReceta(id);
  if (!r) return <><Sup titulo="Receta" volver="recetas" /><main className="pant"><p className="cuerpo">No encontrada.</p></main></>;
  return <Ficha r={r} />;
}

function Ficha({ r }: { r: Receta }) {
  const e = useEstado();
  const rd = e.recetasDelDia[jornadaDe()];
  const usaEspresso = r.categoria !== 'Matcha y té' && r.categoria !== 'Métodos' && r.id !== 'cold-brew';

  return (
    <>
      <Sup titulo={r.nombre} sub={`${r.categoria} · ${r.vaso}`} volver="recetas" />
      <main className="pant pila">
        <div className="rejilla-2">
          <div className="bloque"><span className="etq">Temperatura</span><span className="subtitulo">{r.temperatura}</span></div>
          <div className="bloque"><span className="etq">Tiempo</span><span className="subtitulo">{r.tiempo}</span></div>
        </div>

        {usaEspresso && rd && (
          <section className="bloque inv">
            <span className="etq">Espresso con la receta del día</span>
            <span className="num-m">{rd.dosis.toFixed(1)} → {rd.rendimiento.toFixed(1)} g · {rd.tiempo.toFixed(0)} s</span>
            <span className="cuerpo">{buscarCafe(e, rd.cafeId)?.nombre.split(' · ')[0]} · molienda {rd.molienda} · botón {nombreBoton(maquinaDe(e), rd.botonId)}</span>
          </section>
        )}

        <Seccion titulo="Gramos">
          <div className="lista">
            {r.gramos.map(([k, v]) => (
              <div key={k} className="fila" style={{ minHeight: 44 }}>
                <span className="etq" style={{ flex: 1 }}>{k}</span>
                <span className="num-m" style={{ fontSize: '1.05rem' }}>{v}</span>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Pasos">
          <ol className="pasos">{r.pasos.map((p) => <li key={p}>{p}</li>)}</ol>
        </Seccion>

        <Seccion titulo="Estándar">
          <p className="cuerpo">{r.estandar}</p>
        </Seccion>
      </main>
    </>
  );
}
