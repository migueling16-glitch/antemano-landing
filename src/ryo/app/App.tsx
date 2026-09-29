/**
 * La app de barra de Ryo (maqueta). SPA con rutas en el hash para que viva
 * detrás de una sola página estática (/ryocafe/app) sin configurar el
 * servidor.
 */
import { useEffect, useState, type ReactNode } from 'react';
import './app.css';
import { useEstado, yo, puede, salir, subirPendientes, avisar, type Estado } from './estado';
import { Aviso, useRuta, Sup } from './componentes';
import { TEMA_AUTO } from '../config';
import { dgo } from './lib/tiempo';
import { Entrar } from './pantallas/Entrar';
import { Inicio } from './pantallas/Inicio';
import { ChecklistsInicio, ChecklistsHistorial, ChecklistEjecucion } from './pantallas/Checklists';
import { CalibrarInicio, CalibrarNueva, CalibrarSesion, CalibrarCafe } from './pantallas/Calibrar';
import { RecetasLista, RecetaFicha } from './pantallas/Recetas';
import { AprenderInicio, AprenderLeccion, AprenderRepaso, AprenderIngreso, AprenderEquipo, AprenderEvaluar } from './pantallas/Capacitacion';
import { HorariosInicio, HorariosSemana, HorariosDisponibilidad, HorariosCambios } from './pantallas/Horarios';
import { AdminInicio, AdminUsuarios, AdminPlantillas, AdminCafes, AdminMaquina, AdminSucursal } from './pantallas/Admin';
import { Mas, Privacidad } from './pantallas/Mas';

const PESTANAS = [
  ['inicio', 'Inicio'],
  ['checklists', 'Checklists'],
  ['calibrar', 'Calibrar'],
  ['recetas', 'Recetas'],
  ['mas', 'Más'],
] as const;

/** A qué pestaña pertenece cada sección. */
const PESTANA_DE: Record<string, string> = { aprender: 'mas', horarios: 'mas', admin: 'mas' };

function temaDe(e: Estado, seccion: string): 'champagne' | 'cafe' {
  if (seccion === 'calibrar') return 'cafe';
  if (e.tema !== 'auto') return e.tema;
  const h = dgo().getHours();
  return h >= TEMA_AUTO.amanece && h < TEMA_AUTO.anochece ? 'champagne' : 'cafe';
}

function SinPermiso() {
  return <><Sup titulo="Sin permiso" volver="inicio" /><main className="pant"><p className="cuerpo">Esta sección es para el encargado o el admin.</p></main></>;
}

function pantalla(e: Estado, [s, a, b]: string[]): ReactNode {
  switch (s) {
    case 'inicio': return <Inicio />;
    case 'checklists':
      if (a === 'historial') return <ChecklistsHistorial />;
      if (a === 'ej' && b) return <ChecklistEjecucion id={b} />;
      return <ChecklistsInicio />;
    case 'calibrar':
      if (a === 'nueva') return <CalibrarNueva />;
      if (a === 'sesion' && b) return <CalibrarSesion id={b} />;
      if (a === 'cafe' && b) return <CalibrarCafe id={b} />;
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
      return <HorariosInicio />;
    case 'admin': {
      if (!puede(e, 'encargado', 'admin')) return <SinPermiso />;
      const soloAdmin = a === 'usuarios' || a === 'sucursal';
      if (soloAdmin && !puede(e, 'admin')) return <SinPermiso />;
      if (a === 'usuarios') return <AdminUsuarios />;
      if (a === 'plantillas') return <AdminPlantillas />;
      if (a === 'cafes') return <AdminCafes />;
      if (a === 'maquina') return <AdminMaquina />;
      if (a === 'sucursal') return <AdminSucursal />;
      return <AdminInicio />;
    }
    case 'mas':
      return a === 'privacidad' ? <Privacidad /> : <Mas />;
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
  const pestana = PESTANA_DE[seccion] ?? seccion;

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'cafe' ? '#302413' : '#f8f3d1');
  }, [tema]);

  // Alguien dado de baja pierde el acceso al momento.
  useEffect(() => { if (u && !u.activo) salir(); }, [u]);

  if (!u) return <div className="app" data-enfoque="si"><div className="vista"><Entrar /></div><Aviso /></div>;

  return (
    <div className="app" data-enfoque={enfoque ? 'si' : 'no'}>
      {!enLinea && <div className="red" role="status">Sin red · lo que hagas se guarda en el teléfono y se sube al volver</div>}
      <div className="vista" key={ruta.join('/')}>{pantalla(e, ruta)}</div>
      {!enfoque && (
        <nav className="nav" aria-label="Secciones">
          {PESTANAS.map(([id, nombre]) => (
            <a key={id} href={`#/${id}`} aria-current={pestana === id ? 'page' : undefined}>{nombre}</a>
          ))}
        </nav>
      )}
      <Aviso />
    </div>
  );
}
