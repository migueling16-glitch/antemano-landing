/**
 * Administración: usuarios por invitación, plantillas, cafés, la máquina y
 * la sucursal. Solo admin (y el encargado para plantillas y cafés).
 */
import { useState } from 'react';
import {
  useEstado, yo, puede, invitar, cambiarRol, alternarActivo, alternarPlantilla, agregarCafe, cambiarPid, renombrarBoton, programarPulsos, cambiarGPorPulso, pulsosDe, guardarCanastilla, HOLGURA_CANASTILLA,
  asignarBoton, maquinaDe, nombreBoton, programadoDe, avisar, vibrar, CONTINUO, type Rol,
} from '../estado';
import { Sup, Seccion, Hoja, Avatar, Stepper, Estado as Etq } from '../componentes';
import { jornadaDe, sumarDias, cuando, hora } from '../lib/tiempo';

const ROLES: Rol[] = ['barista', 'encargado', 'admin'];

export function AdminInicio() {
  const e = useEstado();
  const m = maquinaDe(e);
  const esAdmin = puede(e, 'admin');
  return (
    <>
      <Sup titulo="Administración" sub={`${e.sucursal.negocio} · ${e.sucursal.nombre}`} volver="mas" />
      <main className="pant pila">
        <div className="lista">
          {esAdmin && (
            <a className="fila" href="#/admin/usuarios">
              <span className="fila-texto"><span>Equipo</span><span className="fila-sub">{e.usuarios.filter((u) => u.activo).length} activos · invitar, roles, bajas</span></span>
            </a>
          )}
          <a className="fila" href="#/admin/plantillas">
            <span className="fila-texto"><span>Plantillas de checklist</span><span className="fila-sub">{e.plantillas.filter((p) => p.activa).length} activas</span></span>
          </a>
          <a className="fila" href="#/admin/cafes">
            <span className="fila-texto"><span>Cafés</span><span className="fila-sub">{e.cafes.filter((c) => c.activo).length} en barra · receta objetivo y botón</span></span>
          </a>
          {m && (
            <a className="fila" href="#/admin/maquina">
              <span className="fila-texto"><span>Máquina</span><span className="fila-sub">{m.modelo} · {m.detalle} · PID {m.pid.toFixed(1)} °C</span></span>
            </a>
          )}
          {esAdmin && (
            <a className="fila" href="#/admin/sucursal">
              <span className="fila-texto"><span>Sucursal</span><span className="fila-sub">{e.sucursal.nombre} · {e.sucursal.apertura}–{e.sucursal.cierre}</span></span>
            </a>
          )}
        </div>
      </main>
    </>
  );
}

/* ═══ USUARIOS ════════════════════════════════════════════ */

export function AdminUsuarios() {
  const e = useEstado();
  const [invitando, setInvitando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState<Rol>('barista');
  const [editar, setEditar] = useState<string | null>(null);
  const u = e.usuarios.find((x) => x.id === editar);
  const valido = nombre.trim().length > 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());

  return (
    <>
      <Sup titulo="Equipo" volver="admin" accion={{ texto: 'Invitar', hacer: () => setInvitando(true) }} />
      <main className="pant pila">
        <p className="cuerpo">Nadie se registra solo: se entra por invitación al correo. Dar de baja corta el acceso al momento y conserva su historial.</p>
        <div className="lista">
          {e.usuarios.map((x) => (
            <button key={x.id} type="button" className="fila ir" onClick={() => setEditar(x.id)} style={{ opacity: x.activo ? 1 : 0.55 }}>
              <Avatar texto={x.iniciales} lleno={x.id === e.usuarioId} />
              <span className="fila-texto">
                <span>{x.nombre}</span>
                <span className="fila-sub">{x.rol} · {x.correo}</span>
              </span>
              {!x.activo ? <Etq tenue>Baja</Etq> : x.invitado ? <Etq tenue>Invitado</Etq> : null}
            </button>
          ))}
        </div>
      </main>

      <Hoja abierta={invitando} alCerrar={() => setInvitando(false)} titulo="Invitar al equipo">
        <label className="campo"><span className="etq">Nombre</span><input value={nombre} onChange={(ev) => setNombre(ev.target.value)} placeholder="Nombre y apellido" /></label>
        <label className="campo"><span className="etq">Correo</span><input type="email" inputMode="email" value={correo} onChange={(ev) => setCorreo(ev.target.value)} placeholder="nombre@correo.com" /></label>
        <span className="etq">Rol</span>
        <div className="chips">{ROLES.map((r) => <button key={r} type="button" className="chip" aria-pressed={rol === r} onClick={() => setRol(r)}>{r}</button>)}</div>
        <button type="button" className="boton grande lleno" disabled={!valido}
          onClick={() => { invitar(nombre, correo, rol); setInvitando(false); setNombre(''); setCorreo(''); vibrar(12); avisar('Invitación enviada (en la maqueta no sale ningún correo).'); }}>
          {valido ? 'Mandar invitación' : 'Nombre y correo'}
        </button>
      </Hoja>

      <Hoja abierta={!!u} alCerrar={() => setEditar(null)} titulo={u?.nombre ?? ''}>
        {u && (
          <>
            <span className="etq">Rol</span>
            <div className="chips">
              {ROLES.map((r) => (
                <button key={r} type="button" className="chip" aria-pressed={u.rol === r} disabled={u.id === e.usuarioId}
                  onClick={() => { cambiarRol(u.id, r); vibrar(10); }}>{r}</button>
              ))}
            </div>
            {u.id === e.usuarioId ? (
              <p className="cuerpo">No puedes cambiar tu propio rol ni darte de baja.</p>
            ) : (
              <button type="button" className="boton grande" onClick={() => { alternarActivo(u.id); avisar(u.activo ? `${u.nombre} ya no puede entrar.` : `${u.nombre} puede volver a entrar.`); }}>
                {u.activo ? 'Dar de baja' : 'Reactivar'}
              </button>
            )}
          </>
        )}
      </Hoja>
    </>
  );
}

/* ═══ PLANTILLAS ══════════════════════════════════════════ */

export function AdminPlantillas() {
  const e = useEstado();
  return (
    <>
      <Sup titulo="Plantillas" volver="admin" />
      <main className="pant pila">
        <p className="cuerpo">Apertura y cierre son las listas de la barra; la limpieza profunda viene del checklist en papel. En el sistema se editan ítem por ítem; en la maqueta solo se activan o pausan.</p>
        {e.plantillas.map((p) => {
          const tipos = p.items.reduce<Record<string, number>>((a, i) => ({ ...a, [i.tipo]: (a[i.tipo] ?? 0) + 1 }), {});
          return (
            <section key={p.id} className="bloque">
              <div className="fila-h entre">
                <span className="subtitulo">{p.nombre}</span>
                {p.activa ? <Etq fuerte>Activa</Etq> : <Etq tenue>Pausada</Etq>}
              </div>
              <span className="cuerpo">
                {p.frecuencia === 'diaria' ? 'Diaria' : 'Semanal'} · límite {p.horaLimite} · {p.items.length} ítems ({Object.entries(tipos).map(([k, v]) => `${v} ${k}`).join(', ')}) · {p.items.filter((i) => i.critica).length} críticos
              </span>
              <button type="button" className="boton" onClick={() => { alternarPlantilla(p.id); vibrar(10); }}>{p.activa ? 'Pausar' : 'Activar'}</button>
            </section>
          );
        })}
      </main>
    </>
  );
}

/* ═══ CAFÉS ═══════════════════════════════════════════════ */

export function AdminCafes() {
  const e = useEstado();
  const m = maquinaDe(e);
  const [nuevo, setNuevo] = useState(false);
  const [f, setF] = useState({ nombre: '', origen: '', proceso: 'Lavado', tostador: 'Tostado en casa', dosis: 18, rendimiento: 36, tiempo: 28, boton: CONTINUO });
  const [cafeBoton, setCafeBoton] = useState<string | null>(null);
  const c = e.cafes.find((x) => x.id === cafeBoton);

  return (
    <>
      <Sup titulo="Cafés" volver="admin" accion={{ texto: 'Agregar', hacer: () => setNuevo(true) }} />
      <main className="pant pila">
        <div className="lista">
          {e.cafes.map((x) => (
            <button key={x.id} type="button" className="fila ir" onClick={() => setCafeBoton(x.id)}>
              <span className="fila-texto">
                <span>{x.nombre}</span>
                <span className="fila-sub">{x.objetivo.dosis} → {x.objetivo.rendimiento} g · {x.objetivo.tiempo} s · botón {nombreBoton(m, x.boton)}</span>
              </span>
            </button>
          ))}
        </div>
      </main>

      <Hoja abierta={!!c} alCerrar={() => setCafeBoton(null)} titulo={c ? `Botón para ${c.nombre.split(' · ')[0]}` : ''}>
        {c && m && (
          <>
            <p className="cuerpo">Con qué botón de la Linea se sirve. Dos cafés con distinto rendimiento no deberían compartir botón.</p>
            <div className="pila-s">
              {[...m.botones.map((b) => b.id), CONTINUO].map((id) => {
                const otros = e.cafes.filter((x) => x.id !== c.id && x.activo && x.boton === id && id !== CONTINUO);
                return (
                  <button key={id} type="button" className="chip" aria-pressed={c.boton === id} onClick={() => { asignarBoton(c.id, id); vibrar(10); }}>
                    {nombreBoton(m, id)}{otros.length ? ` · ya lo usa ${otros.map((x) => x.nombre.split(' · ')[0]).join(', ')}` : ''}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Hoja>

      <Hoja abierta={nuevo} alCerrar={() => setNuevo(false)} titulo="Nuevo café">
        <label className="campo"><span className="etq">Nombre</span><input value={f.nombre} onChange={(ev) => setF({ ...f, nombre: ev.target.value })} placeholder="Ej. Veracruz · Coatepec" /></label>
        <label className="campo"><span className="etq">Origen</span><input value={f.origen} onChange={(ev) => setF({ ...f, origen: ev.target.value })} placeholder="Región, país" /></label>
        <div className="chips">{['Lavado', 'Natural', 'Honey'].map((p) => <button key={p} type="button" className="chip" aria-pressed={f.proceso === p} onClick={() => setF({ ...f, proceso: p })}>{p}</button>)}</div>
        <Stepper etiqueta="Dosis" valor={f.dosis} paso={0.5} min={14} max={22} unidad=" g" onCambio={(v) => setF({ ...f, dosis: v })} />
        <Stepper etiqueta="Rendimiento" valor={f.rendimiento} paso={1} min={20} max={60} dec={0} unidad=" g" onCambio={(v) => setF({ ...f, rendimiento: v })} />
        <Stepper etiqueta="Tiempo" valor={f.tiempo} paso={1} min={18} max={40} dec={0} unidad=" s" onCambio={(v) => setF({ ...f, tiempo: v })} />
        <button type="button" className="boton grande lleno" disabled={!f.nombre.trim()}
          onClick={() => {
            agregarCafe({
              nombre: f.nombre.trim(), origen: f.origen.trim() || '—', proceso: f.proceso, tostador: f.tostador,
              tueste: sumarDias(jornadaDe(), -5), activo: true, notas: 'Recién agregado: perfílalo antes de servirlo.', boton: f.boton,
              objetivo: { dosis: f.dosis, rendimiento: f.rendimiento, tiempo: f.tiempo, tolTiempo: 2, tolRatio: 0.05 },
            });
            setNuevo(false); setF({ ...f, nombre: '', origen: '' }); vibrar(12); avisar('Café agregado. Se sirve con continuo hasta que le asignes botón.');
          }}>
          {f.nombre.trim() ? 'Agregar café' : 'Escribe el nombre'}
        </button>
      </Hoja>
    </>
  );
}

/* ═══ MÁQUINA ═════════════════════════════════════════════ */

export function AdminMaquina() {
  const e = useEstado();
  const m = maquinaDe(e);
  const [pid, setPid] = useState(m?.pid ?? 93.5);
  const [renombrar, setRenombrar] = useState<{ id: string; nombre: string; pulsos: number } | null>(null);
  const [can, setCan] = useState<{ id: string | null; nombre: string; gramos: number } | null>(null);
  if (!m) return <><Sup titulo="Máquina" volver="admin" /><main className="pant"><p className="cuerpo">Sin máquina registrada.</p></main></>;

  return (
    <>
      <Sup titulo="Máquina" sub={`${m.modelo} · ${m.detalle}`} volver="admin" />
      <main className="pant pila">
        <Seccion titulo="Temperatura" extra="PID caldera de café">
          <p className="cuerpo">
            El PID fija la temperatura de la caldera de café para todos los cafés a la vez. Cambiarlo pide recalibrar.
          </p>
          <Stepper etiqueta="PID" valor={pid} paso={0.5} min={88} max={98} unidad=" °C" onCambio={setPid} />
          <button type="button" className={`boton grande${pid !== m.pid ? ' lleno' : ''}`} disabled={pid === m.pid}
            onClick={() => { cambiarPid(pid); vibrar([30, 60, 30]); avisar(`PID en ${pid.toFixed(1)} °C. Toca recalibrar.`); }}>
            {pid === m.pid ? `En ${m.pid.toFixed(1)} °C` : `Guardar ${pid.toFixed(1)} °C`}
          </button>
        </Seccion>

        <Seccion titulo="Flujómetro" extra="Volumétrica">
          <p className="cuerpo">
            Cada botón corta al llegar a sus pulsos: giros del flujómetro con el agua que entra al grupo. Es agua, no bebida; por eso el peso se comprueba en la báscula. La app calcula cuántos gramos en taza mueve un pulso con los shots de calibración; aquí se puede corregir a mano.
          </p>
          <Stepper etiqueta="Gramos en taza por pulso" valor={m.gPorPulso} paso={0.05} min={0.15} max={1.5} dec={2} unidad=" g" onCambio={cambiarGPorPulso}
            nota="Para medirlo: sube 10 pulsos un botón, sin mover molienda ni dosis, y divide entre 10 lo que subió el peso." />
        </Seccion>

        <Seccion titulo="Canastillas" extra={`${m.canastillas.length} en barra`}>
          <p className="cuerpo">
            La capacidad de cada canastilla. La dosis debe quedar a {HOLGURA_CANASTILLA} g de esa capacidad: la app avisa al calibrar si no cabe. Toca una para corregirla.
          </p>
          <div className="lista">
            {m.canastillas.map((x) => (
              <button key={x.id} type="button" className="fila ir" onClick={() => setCan({ id: x.id, nombre: x.nombre, gramos: x.gramos })}>
                <span className="fila-texto"><span>{x.nombre}</span><span className="fila-sub">Dosis de {x.gramos - HOLGURA_CANASTILLA} a {x.gramos + HOLGURA_CANASTILLA} g</span></span>
                <span className="fila-der">{x.gramos} g</span>
              </button>
            ))}
          </div>
          <button type="button" className="boton grande" onClick={() => setCan({ id: null, nombre: '', gramos: 18 })}>Agregar canastilla</button>
        </Seccion>

        <Seccion titulo="Botones" extra="4 dosis y continuo">
          <p className="cuerpo">Los pulsos de cada botón y lo que entregó en la báscula la última vez. Toca uno para cambiar su nombre o sus pulsos.</p>
          <div className="lista">
            {m.botones.map((b) => {
              const cafes = e.cafes.filter((x) => x.activo && x.boton === b.id);
              const p = programadoDe(m, b.id);
              return (
                <button key={b.id} type="button" className="fila ir" onClick={() => setRenombrar({ id: b.id, nombre: b.nombre, pulsos: pulsosDe(m, b.id) ?? 120 })}>
                  <span className="avatar" style={{ borderRadius: 0 }}>{b.id.slice(1)}</span>
                  <span className="fila-texto">
                    <span>{b.nombre}</span>
                    <span className="fila-sub">
                      {pulsosDe(m, b.id) ? `${pulsosDe(m, b.id)} pulsos · ` : 'Sin pulsos · '}{p ? `${p.gramos.toFixed(1)} g ${cuando(jornadaDe(p.en)).toLowerCase()} ${hora(p.en)}` : 'sin medir'}
                      {cafes.length ? ` · ${cafes.map((x) => x.nombre.split(' · ')[0]).join(', ')}` : ''}
                    </span>
                  </span>
                </button>
              );
            })}
            <div className="fila">
              <span className="avatar" style={{ borderRadius: 0 }}>C</span>
              <span className="fila-texto"><span>Continuo</span><span className="fila-sub">Corta el barista · {e.cafes.filter((x) => x.activo && x.boton === CONTINUO).map((x) => x.nombre.split(' · ')[0]).join(', ') || 'ningún café'}</span></span>
            </div>
          </div>
        </Seccion>
      </main>

      <Hoja abierta={!!can} alCerrar={() => setCan(null)} titulo="Canastilla">
        {can && (
          <>
            <label className="campo"><span className="etq">Nombre</span>
              <input value={can.nombre} placeholder="Ej. Doble" onChange={(ev) => setCan({ ...can, nombre: ev.target.value })} />
            </label>
            <Stepper etiqueta="Capacidad" valor={can.gramos} paso={1} min={5} max={25} dec={0} unidad=" g" onCambio={(v) => setCan({ ...can, gramos: v })}
              nota="La que trae grabada o la que indica el fabricante." />
            <button type="button" className="boton grande lleno" disabled={!can.nombre.trim()}
              onClick={() => { guardarCanastilla(can.id, can.nombre, can.gramos); setCan(null); avisar('Canastilla guardada.'); }}>
              {can.nombre.trim() ? 'Guardar' : 'Escribe el nombre'}
            </button>
          </>
        )}
      </Hoja>

      <Hoja abierta={!!renombrar} alCerrar={() => setRenombrar(null)} titulo="Botón">
        {renombrar && (
          <>
            <label className="campo"><span className="etq">Botón {renombrar.id.slice(1)}</span>
              <input value={renombrar.nombre} onChange={(ev) => setRenombrar({ ...renombrar, nombre: ev.target.value })} />
            </label>
            <Stepper etiqueta="Pulsos programados" valor={renombrar.pulsos} paso={1} min={20} max={400} dec={0}
              onCambio={(v) => setRenombrar({ ...renombrar, pulsos: v })} nota="Pon aquí lo mismo que tiene la máquina." />
            <button type="button" className="boton grande lleno" disabled={!renombrar.nombre.trim()}
              onClick={() => { renombrarBoton(renombrar.id, renombrar.nombre); programarPulsos(renombrar.id, renombrar.pulsos); setRenombrar(null); avisar('Botón guardado.'); }}>Guardar</button>
          </>
        )}
      </Hoja>
    </>
  );
}

/* ═══ SUCURSAL ════════════════════════════════════════════ */

export function AdminSucursal() {
  const e = useEstado();
  const u = yo(e);
  return (
    <>
      <Sup titulo="Sucursal" volver="admin" />
      <main className="pant pila">
        <div className="lista">
          {[
            ['Negocio', e.sucursal.negocio],
            ['Sucursal', e.sucursal.nombre],
            ['Horario', `${e.sucursal.apertura}–${e.sucursal.cierre}`],
            ['Zona horaria', 'Durango, UTC−6 · la jornada corta a las 5:00'],
            ['Tu rol', u?.rol ?? ''],
          ].map(([k, v]) => (
            <div key={k} className="par">
              <span className="etq">{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
        <p className="cuerpo">El modelo ya separa negocio y sucursal: una segunda barra se agrega aquí sin tocar lo demás.</p>
      </main>
    </>
  );
}
