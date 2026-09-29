/**
 * Más: lo que no cabe en la barra inferior, la cuenta y el aviso de privacidad.
 */
import { useState } from 'react';
import { useEstado, yo, puede, entrar, salir, cambiarTema, reiniciarDemo, avisar, type Estado } from '../estado';
import { Sup, Seccion, Avatar, Hoja, ir } from '../componentes';
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

  return (
    <>
      <Sup titulo="Más" />
      <main className="pant pila">
        <section className="fila" style={{ borderTop: '1px solid var(--line)' }}>
          <Avatar texto={u.iniciales} lleno />
          <span className="fila-texto">
            <span>{u.nombre}</span>
            <span className="fila-sub">{u.rol} · Barista {u.nivel} · {u.correo}</span>
          </span>
        </section>

        <div className="lista">
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
            <div key={k} className="fila" style={{ alignItems: 'flex-start' }}>
              <span className="etq" style={{ width: 96, flex: 'none', paddingTop: 3 }}>{k}</span>
              <span className="cuerpo">{v}</span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
