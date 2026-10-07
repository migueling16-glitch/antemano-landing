/**
 * La app de barra de Ryo (maqueta). SPA con rutas en el hash para que viva
 * detrás de una sola página estática (/ryocafe/app) sin configurar el
 * servidor.
 */
import { Component, useEffect, useState, type ReactNode } from 'react';
import './app.css';
import { useEstado, yo, puede, salir, subirPendientes, avisar, reiniciarDemo, TALLA_LETRA, type Estado } from './estado';
import { Aviso, Ritual, useRuta, Sup, LeyendasFlotantes } from './componentes';
import { Guia } from './pantallas/Guia';
import { TEMA_AUTO } from '../config';
import { dgo } from './lib/tiempo';
import { Entrar } from './pantallas/Entrar';
import { Inicio, Avisos, pendientesPorPestana } from './pantallas/Inicio';
import { ChecklistsInicio, ChecklistsHistorial, ChecklistEjecucion } from './pantallas/Checklists';
import { CalibrarInicio, CalibrarNueva, CalibrarSesion, CalibrarCafe } from './pantallas/Calibrar';
import { RecetasLista, RecetaFicha } from './pantallas/Recetas';
import { AprenderInicio, AprenderLeccion, AprenderRepaso, AprenderIngreso, AprenderEquipo, AprenderEvaluar } from './pantallas/Capacitacion';
import { HorariosInicio, HorariosSemana, HorariosDisponibilidad, HorariosCambios, HorariosCambiar } from './pantallas/Horarios';
import { AdminInicio, AdminUsuarios, AdminPlantillas, AdminPlantilla, AdminCafes, AdminMaquina, AdminSucursal } from './pantallas/Admin';
import { Mas, Privacidad, Glosario } from './pantallas/Mas';
import { PanelInicio, PanelIndicador, PanelPersona } from './pantallas/Panel';
import { PanelIncidencias, PanelIncidencia, PanelBitacora, PanelReporte } from './pantallas/Herramientas';

/** [id, nombre, para qué sirve (sale al mantener presionado o con el mouse)] */
const PESTANAS = [
  ['inicio', 'Inicio', 'Lo que te toca hoy'],
  ['checklists', 'Checklists', 'Apertura, cierre y limpieza, tarea por tarea'],
  ['calibrar', 'Calibrar', 'La receta del día de cada café'],
  ['recetas', 'Recetas', 'Cómo se prepara cada bebida del menú'],
  ['mas', 'Más', 'Horarios, aprender, avisos y ajustes'],
] as const;

/** El encargado y el admin tienen Panel en lugar de Más (Más queda dentro). */
const PESTANAS_ENCARGADO = [...PESTANAS.slice(0, 4), ['panel', 'Panel', 'Decidir, ver los datos y al equipo']] as const;

/** A qué pestaña pertenece cada sección. */
const PESTANA_DE: Record<string, string> = { aprender: 'mas', horarios: 'mas', admin: 'mas', avisos: 'inicio' };
const PESTANA_DE_ENCARGADO: Record<string, string> = { aprender: 'panel', horarios: 'panel', admin: 'panel', mas: 'panel', avisos: 'inicio' };

function temaDe(e: Estado, seccion: string): 'champagne' | 'cafe' {
  if (seccion === 'calibrar') return 'cafe';
  if (e.tema !== 'auto') return e.tema;
  const h = dgo().getHours();
  return h >= TEMA_AUTO.amanece && h < TEMA_AUTO.anochece ? 'champagne' : 'cafe';
}

/**
 * Si una pantalla falla, no se cae toda la app: se ve un aviso con salida a
 * Inicio o a reiniciar los datos de ejemplo. La llave es la ruta, así que al
 * navegar a otra pantalla se vuelve a intentar.
 */
class Resguardo extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error('[ryo] pantalla con error', error); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="pant pila">
        <section className="bloque inv">
          <span className="etq">Algo falló en esta pantalla</span>
          <p className="cuerpo">No se perdió nada de lo guardado. Vuelve al inicio; si se repite, reinicia los datos de ejemplo.</p>
        </section>
        <a className="boton grande lleno" href="#/inicio">Volver al inicio</a>
        <button type="button" className="boton grande" onClick={() => { reiniciarDemo(); location.hash = '#/inicio'; }}>Reiniciar datos de ejemplo</button>
      </main>
    );
  }
}

function SinPermiso() {
  return <><Sup titulo="Sin permiso" volver="inicio" /><main className="pant"><p className="cuerpo">Esta sección es para el encargado o el admin.</p></main></>;
}

function pantalla(e: Estado, [s, a, b]: string[]): ReactNode {
  switch (s) {
    case 'inicio': return <Inicio />;
    case 'avisos': return <Avisos />;
    case 'checklists':
      if (a === 'historial') return <ChecklistsHistorial />;
      if (a === 'ej' && b) return <ChecklistEjecucion id={b} />;
      return <ChecklistsInicio />;
    case 'calibrar':
      if (a === 'nueva') return <CalibrarNueva key={b ?? 'nueva'} cafeId={b} />;
      if (a === 'sesion' && b) return <CalibrarSesion id={b} />;
      if (a === 'cafe' && b) return <CalibrarCafe id={b} />;
      if (a === 'maquina' || a === 'sesiones') return <CalibrarInicio vista={a} />;
      return <CalibrarInicio />;
    case 'recetas':
      return a ? <RecetaFicha id={a} /> : <RecetasLista />;
    case 'aprender':
      if (a === 'leccion' && b) return <AprenderLeccion id={b} />;
      if (a === 'repaso') return <AprenderRepaso />;
      if (a === 'ingreso') return <AprenderIngreso />;
      if (a === 'equipo') return puede(e, 'encargado', 'admin') ? <AprenderEquipo /> : <SinPermiso />;
      if (a === 'evaluar' && b) return puede(e, 'encargado', 'admin') ? <AprenderEvaluar id={b} /> : <SinPermiso />;
      return <AprenderInicio />;
    case 'horarios':
      if (a === 'semana') return <HorariosSemana key={b ?? 'hoy'} inicio={b} />;
      if (a === 'disponibilidad') return <HorariosDisponibilidad />;
      if (a === 'cambios') return <HorariosCambios />;
      if (a === 'cambiar' && b) return <HorariosCambiar key={b} fecha={b} />;
      return <HorariosInicio />;
    case 'admin': {
      if (!puede(e, 'encargado', 'admin')) return <SinPermiso />;
      const soloAdmin = a === 'usuarios' || a === 'sucursal';
      if (soloAdmin && !puede(e, 'admin')) return <SinPermiso />;
      if (a === 'usuarios') return <AdminUsuarios />;
      if (a === 'plantillas') return <AdminPlantillas />;
      if (a === 'plantilla' && b) return <AdminPlantilla key={b} id={b} />;
      if (a === 'cafes') return <AdminCafes />;
      if (a === 'maquina') return <AdminMaquina />;
      if (a === 'sucursal') return <AdminSucursal />;
      return <AdminInicio />;
    }
    case 'mas':
      return a === 'privacidad' ? <Privacidad /> : <Mas />;
    case 'glosario':
      return <Glosario />;
    case 'guia':
      return <Guia />;
    case 'panel': {
      // La responsable de una incidencia (aunque sea barista) puede verla y cerrarla.
      if (a === 'incidencia' && b) return <PanelIncidencia key={b} id={b} />;
      if (!puede(e, 'encargado', 'admin')) return <SinPermiso />;
      if (a === 'indicador' && b) return <PanelIndicador key={b} id={b} />;
      if (a === 'persona' && b) return <PanelPersona key={b} id={b} />;
      if (a === 'incidencias') return <PanelIncidencias />;
      if (a === 'bitacora') return <PanelBitacora />;
      if (a === 'reporte') return <PanelReporte />;
      if (a === 'datos' || a === 'equipo' || a === 'herramientas') return <PanelInicio vista={a} />;
      return <PanelInicio />;
    }
    default:
      return <Inicio />;
  }
}

function useEnLinea() {
  const [enLinea, setEnLinea] = useState(() => navigator.onLine);
  useEffect(() => {
    const arriba = () => {
      setEnLinea(true);
      const n = subirPendientes();
      if (n) avisar(`Conexión de vuelta: se subi${n === 1 ? 'ó 1 foto' : `eron ${n} fotos`}.`);
    };
    const abajo = () => setEnLinea(false);
    addEventListener('online', arriba);
    addEventListener('offline', abajo);
    return () => { removeEventListener('online', arriba); removeEventListener('offline', abajo); };
  }, []);
  return enLinea;
}

export default function App() {
  const e = useEstado();
  const ruta = useRuta();
  const enLinea = useEnLinea();
  const u = yo(e);
  const seccion = ruta[0];
  const tema = temaDe(e, u ? seccion : '');
  const enfoque = u && ((seccion === 'calibrar' && ruta[1] === 'sesion') || (seccion === 'aprender' && ruta[1] === 'repaso'));
  const encargado = !!u && puede(e, 'encargado', 'admin');
  const pestana = (encargado ? PESTANA_DE_ENCARGADO : PESTANA_DE)[seccion] ?? seccion;
  const espera: Record<string, number> = u ? pendientesPorPestana(e, u) : {};

  useEffect(() => { document.documentElement.style.fontSize = TALLA_LETRA[e.letra ?? 'normal']; }, [e.letra]);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'cafe' ? '#302413' : '#f8f3d1');
  }, [tema]);

  // Alguien dado de baja pierde el acceso al momento.
  useEffect(() => { if (u && !u.activo) salir(); }, [u]);

  if (!u) return <div className="app" data-enfoque="si"><div className="vista"><Entrar /></div><Aviso /><LeyendasFlotantes /></div>;

  return (
    <div className="app" data-enfoque={enfoque ? 'si' : 'no'}>
      {!enLinea && <div className="red" role="status">Sin red · lo que hagas se guarda en el teléfono y se sube al volver</div>}
      <div className="vista" key={ruta.join('/')}><Resguardo>{pantalla(e, ruta)}</Resguardo></div>
      {!enfoque && (
        <nav className="nav" aria-label="Secciones">
          {(encargado ? PESTANAS_ENCARGADO : PESTANAS).map(([id, nombre, para]) => (
            <a key={id} href={`#/${id}`} aria-current={pestana === id ? 'page' : undefined}
              data-leyenda={`${para}${espera[id] ? ` · ${espera[id]} pendiente${espera[id] === 1 ? '' : 's'}` : ''}`}
              aria-label={espera[id] ? `${nombre}, ${espera[id]} pendiente${espera[id] === 1 ? '' : 's'}` : undefined}>
              {nombre}{espera[id] ? <span className="nav-n" aria-hidden="true">{espera[id] > 9 ? '9+' : espera[id]}</span> : null}
            </a>
          ))}
        </nav>
      )}
      <Aviso />
      <Ritual />
      <LeyendasFlotantes />
    </div>
  );
}
