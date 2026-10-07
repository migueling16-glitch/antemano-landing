/**
 * Más: lo que no cabe en la barra inferior, la cuenta y el aviso de privacidad.
 */
import { useState } from 'react';
import { useEstado, yo, puede, entrar, salir, cambiarTema, cambiarLetra, reiniciarDemo, avisar, avisosDe, type Estado } from '../estado';
import { Sup, Seccion, Avatar, Hoja, Marca, ir, reiniciarPistas } from '../componentes';
import { GLOSARIO } from '../contenido';
import { progresoDe } from '../estado';
import { tocaHoy } from '../lib/repaso';
import { jornadaDe } from '../lib/tiempo';

const TEMAS: [Estado['tema'], string][] = [['auto', 'Automático'], ['champagne', 'Champagne'], ['cafe', 'Café']];

export function Mas() {
  const e = useEstado();
  const u = yo(e)!;
  const [verComo, setVerComo] = useState(false);
  const [reiniciar, setReiniciar] = useState(false);
  const repaso = Object.values(progresoDe(e, u.id).repaso).filter((x) => tocaHoy(x, jornadaDe())).length;
  const sinLeer = avisosDe(e, u.id).filter((n) => !n.leidaPor.includes(u.id)).length;

  return (
    <>
      <Sup titulo="Más" />
      <main className="pant pila">
        <section className="bloque inv fila-h" style={{ gap: 14 }} aria-label="Tu cuenta">
          <Avatar texto={u.iniciales} />
          <span className="fila-texto">
            <span className="subtitulo">{u.nombre}</span>
            <span className="fila-sub">{u.rol === 'barista' ? 'Barista' : u.rol === 'encargado' ? 'Encargada' : 'Admin'} · nivel Barista {u.nivel} · {u.correo}</span>
          </span>
        </section>

        <Seccion titulo="Ir a">
        <div className="lista">
          <a className="fila" href="#/avisos">
            <span className="fila-texto"><span>Avisos</span><span className="fila-sub">{sinLeer ? `${sinLeer} sin leer` : 'Todo leído'}</span></span>
          </a>
          <a className="fila" href="#/aprender">
            <span className="fila-texto"><span>Aprender</span><span className="fila-sub">Lecciones, repaso{repaso ? ` (${repaso} hoy)` : ''} y evaluaciones</span></span>
          </a>
          <a className="fila" href="#/horarios">
            <span className="fila-texto"><span>Horarios</span><span className="fila-sub">Mis turnos, semana, disponibilidad y cambios</span></span>
          </a>
          {puede(e, 'encargado', 'admin') && (
            <a className="fila" href="#/admin">
              <span className="fila-texto"><span>Administración</span><span className="fila-sub">Equipo, plantillas, cafés y la máquina</span></span>
            </a>
          )}
        </div>
        </Seccion>

        <Seccion titulo="Tamaño de letra" extra="Solo en este teléfono">
          <div className="rejilla-3">
            {([['normal', 'Normal'], ['grande', 'Grande'], ['muy-grande', 'Muy grande']] as const).map(([t, n]) => (
              <button key={t} type="button" className="chip" aria-pressed={(e.letra ?? 'normal') === t} onClick={() => cambiarLetra(t)}>{n}</button>
            ))}
          </div>
          <p className="cuerpo">Toda la app crece, botones incluidos. Úsalo si te cuesta leer.</p>
        </Seccion>

        <Seccion titulo="Ayuda">
          <div className="lista">
            <a className="fila" href="#/glosario">
              <span className="fila-texto"><span>Palabras de la barra</span><span className="fila-sub">Qué es ratio, pulsos, canastilla, validar…</span></span>
            </a>
            <button type="button" className="fila ir" onClick={() => { reiniciarPistas(); avisar('Las pistas de primera vez vuelven a salir en cada pantalla.'); }}>
              <span className="fila-texto"><span>Volver a ver las pistas</span><span className="fila-sub">La ayuda corta que sale la primera vez en cada pantalla</span></span>
            </button>
          </div>
        </Seccion>

        <Seccion titulo="Tema">
          <div className="chips">
            {TEMAS.map(([t, nombre]) => (
              <button key={t} type="button" className="chip" aria-pressed={e.tema === t} onClick={() => cambiarTema(t)}>{nombre}</button>
            ))}
          </div>
          <p className="cuerpo">Automático: champagne de día y café de noche, con la hora de Durango. Calibrar siempre va en café.</p>
        </Seccion>

        <Seccion titulo="Maqueta">
          <div className="lista">
            <button type="button" className="fila ir" onClick={() => setVerComo(true)}>
              <span className="fila-texto"><span>Ver como otro perfil</span><span className="fila-sub">Barista, encargada o admin</span></span>
            </button>
            <button type="button" className="fila ir" onClick={() => setReiniciar(true)}>
              <span className="fila-texto"><span>Reiniciar datos de ejemplo</span><span className="fila-sub">Borra lo que hiciste en este teléfono</span></span>
            </button>
            <a className="fila" href="#/mas/privacidad">
              <span className="fila-texto"><span>Aviso de privacidad</span><span className="fila-sub">Qué datos guarda el sistema y para qué</span></span>
            </a>
          </div>
        </Seccion>

        <button type="button" className="boton grande" onClick={() => { salir(); ir('inicio'); }}>Salir</button>

        <footer className="colofon">
          <Marca tipo="auxiliar" alto={96} etiqueta="Ryo Café" />
          <Marca tipo="tagline" alto={30} etiqueta="Soft living, deep siping." />
          <p className="etq">Barra · maqueta</p>
        </footer>
      </main>

      <Hoja abierta={verComo} alCerrar={() => setVerComo(false)} titulo="Ver como">
        <div className="pila-s">
          {e.usuarios.filter((x) => x.activo).map((x) => (
            <button key={x.id} type="button" className="chip" aria-pressed={x.id === u.id}
              onClick={() => { entrar(x.id); setVerComo(false); ir('inicio'); avisar(`Ahora ves la app como ${x.nombre}.`); }}>
              {x.nombre} · {x.rol}
            </button>
          ))}
        </div>
      </Hoja>

      <Hoja abierta={reiniciar} alCerrar={() => setReiniciar(false)} titulo="Reiniciar maqueta">
        <p className="cuerpo">Vuelve a los datos de ejemplo de hoy. Se borran los shots, marcas y fotos que hiciste en este teléfono.</p>
        <button type="button" className="boton grande lleno" onClick={() => { reiniciarDemo(); setReiniciar(false); ir('inicio'); avisar('Datos de ejemplo restaurados.'); }}>Reiniciar</button>
      </Hoja>
    </>
  );
}

/** Todas las palabras de la barra, en orden alfabético. */
export function Glosario() {
  const lista = Object.values(GLOSARIO).sort((a, b) => a.palabra.localeCompare(b.palabra, 'es'));
  return (
    <>
      <Sup titulo="Palabras de la barra" sub="Para quien llega nuevo" volver="atras" />
      <main className="pant pila">
        <div className="lista">
          {lista.map((g) => (
            <div key={g.palabra} className="fila" style={{ alignItems: 'flex-start' }}>
              <span className="fila-texto">
                <span className="negrita">{g.palabra}</span>
                <span className="cuerpo">{g.que}</span>
                {g.ejemplo && <span className="meta ejemplo">Ejemplo: {g.ejemplo}</span>}
              </span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

export function Privacidad() {
  return (
    <>
      <Sup titulo="Aviso de privacidad" sub="Borrador para revisión legal" volver="mas" />
      <main className="pant pila">
        <p className="cuerpo">
          Resumen del aviso que exige la Ley Federal de Protección de Datos Personales en Posesión de los Particulares. El texto final lo revisa un abogado antes de usar el sistema con el equipo.
        </p>
        <div className="lista">
          {[
            ['Responsable', 'Ryo Café, Durango, México'],
            ['Datos', 'Nombre, correo, rol, turnos, firmas en checklists, fotos de evidencia y progreso de capacitación'],
            ['Para qué', 'Operar la barra: registrar tareas, calibraciones, horarios y capacitación'],
            ['Fotos', 'Solo del área de trabajo; se guardan comprimidas y se borran a los 90 días'],
            ['No se usa para', 'Publicidad ni se comparte con terceros'],
            ['Derechos ARCO', 'Acceso, rectificación, cancelación y oposición por correo al administrador'],
          ].map(([k, v]) => (
            <div key={k} className="par">
              <span className="etq">{k}</span>
              <span className="cuerpo">{v}</span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
