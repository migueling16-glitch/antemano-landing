/**
 * Guía rápida: cómo se lee la app, con ejemplos de verdad (las mismas
 * piezas que se usan en todas las pantallas). Es la referencia a la que
 * llevan la pista de Inicio y Más → Ayuda; no es un tutorial que se
 * interpone al entrar.
 */
import { useState } from 'react';
import { Sup, Seccion, Estado as Etq, Casilla, Avatar, Leyenda, Termino, Pestanas, reiniciarPistas } from '../componentes';
import { avisar } from '../estado';

/** Un ejemplo a la izquierda y qué significa a la derecha. */
const Fila = ({ ejemplo, children }: { ejemplo: React.ReactNode; children: React.ReactNode }) => (
  <div className="guia-fila">
    <div className="guia-ejemplo" aria-hidden="true">{ejemplo}</div>
    <p className="cuerpo">{children}</p>
  </div>
);

export function Guia() {
  const [vista, setVista] = useState<'a' | 'b'>('a');
  return (
    <>
      <Sup titulo="Cómo se usa la app" sub="Todo sigue las mismas reglas: apréndelas una vez" volver="atras" />
      <main className="pant pila">
        <Seccion titulo="Qué se toca">
          <Fila ejemplo={<span className="boton lleno">Guardar</span>}>Lo principal de la pantalla. Va abajo, al alcance del pulgar.</Fila>
          <Fila ejemplo={<span className="boton">Otra opción</span>}>Con recuadro: otra cosa que puedes hacer.</Fila>
          <Fila ejemplo={<span className="enlace" style={{ alignSelf: 'center' }}>Ver todo →</span>}>Subrayado: algo menos importante. Si lleva →, te lleva a otra pantalla.</Fila>
          <Fila ejemplo={<span className="fila guia-mini-fila"><span className="fila-texto"><span className="negrita">Horarios</span></span><span aria-hidden="true">→</span></span>}>
            Una fila con → abre otra pantalla. Se toca toda, no solo la flecha.
          </Fila>
          <Fila ejemplo={<span className="chips"><span className="chip" aria-pressed="true">Hoy</span><span className="chip">Ayer</span></span>}>
            Para elegir o filtrar: el que está lleno es el elegido.
          </Fila>
          <Fila ejemplo={<Pestanas etiqueta="Ejemplo" activa={vista} onCambio={setVista} opciones={[{ id: 'a', texto: 'Hoy' }, { id: 'b', texto: 'Datos' }]} />}>
            Pestañas de arriba: cambian de vista sin salir de la pantalla. Pruébalas.
          </Fila>
        </Seccion>

        <Seccion consulta titulo="Qué dice cada marca">
          <Fila ejemplo={<Etq fuerte>Hecho</Etq>}>Lleno con ✓: ya está.</Fila>
          <Fila ejemplo={<Etq>En curso</Etq>}>Vacío: alguien lo está haciendo.</Fila>
          <Fila ejemplo={<Etq tenue>Pendiente</Etq>}>Punteado: todavía no empieza.</Fila>
          <Fila ejemplo={<Etq alerta>Atrasado</Etq>}>Invertido con !: hay un problema. Atiéndelo primero.</Fila>
          <Fila ejemplo={<span className="fila-h" style={{ gap: 10 }}><Casilla hecha={false} /><Casilla hecha /></span>}>Tareas: tócala al hacerla y se llena con tu nombre y la hora.</Fila>
          <Fila ejemplo={<span>Agua<span className="etiqueta-critica">Crítica</span></span>}>Obligatoria: el checklist no se completa sin ella.</Fila>
          <Fila ejemplo={<span className="guia-pestana">Calibrar<span className="nav-n">1</span></span>}>Número en las pestañas de abajo: cuántas cosas te esperan ahí.</Fila>
        </Seccion>

        <Seccion titulo="Cómo se acomoda cada pantalla">
          <Fila ejemplo={<span className="bloque inv guia-mini">Ahora</span>}>Arriba e invertido: lo que toca ahora, con su botón.</Fila>
          <Fila ejemplo={<span className="guia-mini guia-mini-ficha"><span className="guia-mini-tab">Tareas</span></span>}>Recuadro con pestaña: donde registras o eliges.</Fila>
          <Fila ejemplo={<span className="guia-mini guia-mini-consulta"><span className="guia-mini-tab">Datos</span></span>}>Fondo tenue: solo para leer.</Fila>
        </Seccion>

        <Seccion titulo="Si tienes dudas">
          <Fila ejemplo={<Leyenda etiqueta="Ejemplo de ayuda">Así se ve la ayuda: tócala otra vez o toca fuera para cerrarla.</Leyenda>}>
            El círculo con ? es ayuda: tócalo para ver cómo se lee algo. Pruébalo.
          </Fila>
          <Fila ejemplo={<Termino id="pulsos" className="ayuda">¿Qué es?</Termino>}>Junto a una palabra de la barra: qué significa, con un ejemplo.</Fila>
          <Fila ejemplo={<Avatar texto="AR" nombre="Ana Ruiz" />}>
            Mantén presionado un símbolo, una abreviatura o unas iniciales para ver qué es (con mouse, deja el puntero encima). Prueba con «AR».
          </Fila>
          <Fila ejemplo={<span className="pista guia-mini-pista"><span className="etq">Primera vez</span></span>}>La primera vez en cada pantalla sale una pista corta. Con «Entendido» ya no vuelve.</Fila>
          <div className="lista">
            <a className="fila" href="#/glosario"><span className="fila-texto"><span>Palabras de la barra</span><span className="fila-sub">Ratio, pulsos, canastilla, validar…</span></span></a>
            <button type="button" className="fila ir" onClick={() => { reiniciarPistas(); avisar('Las pistas vuelven a salir en cada pantalla.'); }}>
              <span className="fila-texto"><span>Volver a ver las pistas</span><span className="fila-sub">Si quieres repasar desde el principio</span></span>
            </button>
          </div>
        </Seccion>

        <Seccion consulta titulo="Si te equivocas">
          <p className="cuerpo">Casi todo se deshace: busca «Deshacer» en el aviso que sale abajo.</p>
          <p className="cuerpo">Nada importante se borra sin preguntarte, y lo que escribes se guarda en el momento.</p>
          <p className="cuerpo">Si una pantalla falla, la app te regresa al inicio sin perder lo guardado.</p>
        </Seccion>
      </main>
    </>
  );
}
