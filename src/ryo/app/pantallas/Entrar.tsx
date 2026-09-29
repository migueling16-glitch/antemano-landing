/**
 * Entrar con enlace mágico al correo. Solo con invitación: si el correo no
 * está dado de alta, no hay cuenta que crear.
 *
 * En la maqueta el enlace no se envía: "Abrir el enlace" simula tocarlo en el
 * correo, y luego se elige con qué perfil de ejemplo ver la app.
 */
import { useState } from 'react';
import { useEstado, entrar, type Rol } from '../estado';
import { Marca } from '../componentes';

const PERFILES: { id: string; rol: Rol; texto: string }[] = [
  { id: 'u-ana', rol: 'barista', texto: 'Barista 2 · calibra, hace checklists y repasa' },
  { id: 'u-diego', rol: 'barista', texto: 'Barista 1 · lleva 9 días, está en su ruta de ingreso' },
  { id: 'u-carla', rol: 'encargado', texto: 'Encargada · valida, arma horarios, firma evaluaciones' },
  { id: 'u-sofia', rol: 'admin', texto: 'Admin · usuarios, plantillas, cafés y la máquina' },
];

export function Entrar() {
  const e = useEstado();
  const [paso, setPaso] = useState<'correo' | 'enviado' | 'perfil'>('correo');
  const [correo, setCorreo] = useState('');
  const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());

  return (
    <main className="pant pila entrar">
      <div className="pila-s entrar-cabeza">
        <Marca tipo="logotipo" alto={112} etiqueta={e.sucursal.negocio} className="entrar-logo" />
        <h1 className="etq">Barra · uso interno</h1>
        <p className="cuerpo">Checklists, calibración, capacitación y horarios del equipo.</p>
      </div>

      {paso === 'correo' && (
        <form className="pila" onSubmit={(ev) => { ev.preventDefault(); if (valido) setPaso('enviado'); }}>
          <label className="campo">
            <span className="etq">Tu correo</span>
            <input type="email" inputMode="email" autoComplete="email" value={correo} placeholder="nombre@ryocafe.mx"
              onChange={(ev) => setCorreo(ev.target.value)} />
          </label>
          <button type="submit" className="boton grande lleno" disabled={!valido}>{valido ? 'Mandarme el enlace' : 'Escribe tu correo'}</button>
          <p className="cuerpo">Sin contraseña: te llega un enlace para entrar. Solo funciona si el encargado ya te invitó.</p>
          <button type="button" className="enlace" style={{ alignSelf: 'flex-start' }} onClick={() => setPaso('perfil')}>Ver la maqueta sin correo</button>
        </form>
      )}

      {paso === 'enviado' && (
        <section className="bloque inv">
          <span className="etq">Revisa tu correo</span>
          <p className="cuerpo">Te mandamos un enlace a {correo.trim()}. Ábrelo en este teléfono; vence en 15 minutos.</p>
          <button type="button" className="boton grande lleno" onClick={() => setPaso('perfil')}>Abrir el enlace (maqueta)</button>
          <button type="button" className="enlace" style={{ alignSelf: 'flex-start' }} onClick={() => setPaso('correo')}>Usar otro correo</button>
        </section>
      )}

      {paso === 'perfil' && (
        <section className="pila-s" aria-label="Perfiles de ejemplo">
          <span className="etq">Ver la maqueta como</span>
          {PERFILES.map((p) => {
            const u = e.usuarios.find((x) => x.id === p.id)!;
            return (
              <button key={p.id} type="button" className="bloque bloque-toque" onClick={() => { entrar(p.id); location.hash = '#/inicio'; }}>
                <span className="fila-h entre">
                  <span className="subtitulo">{u.nombre}</span>
                  <span className="estado">{p.rol}</span>
                </span>
                <span className="cuerpo">{p.texto}</span>
              </button>
            );
          })}
        </section>
      )}

      <Marca tipo="tagline" alto={34} etiqueta="Soft living, deep siping." className="entrar-tagline" />
    </main>
  );
}
