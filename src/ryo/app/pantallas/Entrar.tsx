/**
 * Iniciar sesión con correo y contraseña. Solo con invitación: si el correo
 * no está dado de alta, no hay cuenta que crear.
 *
 * En la maqueta no hay servidor: entra cualquier correo del equipo con una
 * contraseña de 4 caracteres o más, y los perfiles de prueba llenan los
 * datos de un toque.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useEstado, entrar, vibrar, type Rol } from '../estado';
import { Marca, Casilla, Hoja } from '../componentes';

const PERFILES: { id: string; rol: Rol; texto: string }[] = [
  { id: 'u-ana', rol: 'barista', texto: 'Barista 2' },
  { id: 'u-diego', rol: 'barista', texto: 'Barista 1' },
  { id: 'u-carla', rol: 'encargado', texto: 'Encargada' },
  { id: 'u-sofia', rol: 'admin', texto: 'Admin' },
];

const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Entrar() {
  const e = useEstado();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [entrando, setEntrando] = useState(false);
  const [olvido, setOlvido] = useState(false);

  const fallar = (texto: string) => { setError(texto); setIntento((n) => n + 1); vibrar([20, 40, 20]); };

  const enviar = (ev: FormEvent) => {
    ev.preventDefault();
    if (entrando) return;
    const c = correo.trim().toLowerCase();
    if (!c) return fallar('Escribe tu correo.');
    if (!CORREO_OK.test(c)) return fallar('Ese correo no se ve completo.');
    if (clave.length < 4) return fallar(clave ? 'La contraseña es muy corta.' : 'Escribe tu contraseña.');
    const u = e.usuarios.find((x) => x.correo.toLowerCase() === c);
    if (!u) return fallar('Ese correo no tiene invitación. Pídela a tu encargado.');
    if (!u.activo) return fallar('Esta cuenta está dada de baja.');
    setError(null);
    setEntrando(true);
    vibrar(15);
    // La barra del botón se llena mientras "entra".
    // Si llegó por un enlace directo (#/calibrar…), entra ahí; si no, a Inicio.
    setTimeout(() => { entrar(u.id, recordar); if (location.hash.length < 3) location.hash = '#/inicio'; }, 750);
  };

  const probar = (id: string) => {
    const u = e.usuarios.find((x) => x.id === id);
    if (!u) return;
    setCorreo(u.correo);
    setClave('ryocafe');
    setError(null);
    vibrar(8);
  };

  return (
    <main className="pant pila entrar">
      <div className="pila-s entrar-cabeza">
        <Marca tipo="logotipo" alto={104} etiqueta={e.sucursal.negocio} className="entrar-logo" />
        <h1 className="titulo">Inicia sesión</h1>
        <p className="cuerpo">Checklists, calibración, capacitación y horarios de la barra.</p>
      </div>

      <form className="pila" onSubmit={enviar} noValidate>
        <label className="campo">
          <span className="etq">Correo</span>
          <input
            type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
            value={correo} placeholder="Ej. nombre@ryocafe.mx"
            onChange={(ev) => { setCorreo(ev.target.value); setError(null); }}
          />
        </label>

        <label className="campo">
          <span className="etq">Contraseña</span>
          <span className="campo-clave">
            <input
              type={verClave ? 'text' : 'password'} autoComplete="current-password"
              value={clave} placeholder="Tu contraseña"
              onChange={(ev) => { setClave(ev.target.value); setError(null); }}
            />
            <button type="button" className="enlace" onClick={() => setVerClave(!verClave)} aria-pressed={verClave}>
              {verClave ? 'Ocultar' : 'Mostrar'}
            </button>
          </span>
        </label>

        <button type="button" className="fila recordar" aria-pressed={recordar} onClick={() => { setRecordar(!recordar); vibrar(8); }}>
          <Casilla hecha={recordar} />
          <span className="fila-texto">
            <span>Mantener la sesión en este teléfono</span>
            <span className="fila-sub">Si es un teléfono compartido, déjalo sin marcar.</span>
          </span>
        </button>

        {error && <p key={intento} className="bloque inv error sacude" role="alert">{error}</p>}

        <button type="submit" className={`boton grande lleno${entrando ? ' cargando' : ''}`}>
          <span>{entrando ? 'Entrando…' : 'Iniciar sesión'}</span>
        </button>
        <button type="button" className="enlace" onClick={() => setOlvido(true)}>¿Olvidaste tu contraseña?</button>
      </form>

      <section className="pila-s entrar-prueba" aria-label="Perfiles de prueba">
        <span className="etq">Maqueta · perfiles de prueba</span>
        <p className="cuerpo">Toca uno para llenar sus datos y luego inicia sesión.</p>
        <div className="chips">
          {PERFILES.map((p) => {
            const u = e.usuarios.find((x) => x.id === p.id)!;
            return (
              <button key={p.id} type="button" className="chip" aria-pressed={correo.trim().toLowerCase() === u.correo} onClick={() => probar(p.id)}>
                {u.nombre.split(' ')[0]} · {p.texto}
              </button>
            );
          })}
        </div>
      </section>

      <Marca tipo="tagline" alto={34} etiqueta="Soft living, deep siping." className="entrar-tagline" />

      <Olvido abierta={olvido} alCerrar={() => setOlvido(false)} correoInicial={correo} />
    </main>
  );
}

/** Recuperar la contraseña: en el sistema manda un enlace para crear una nueva. */
function Olvido({ abierta, alCerrar, correoInicial }: { abierta: boolean; alCerrar: () => void; correoInicial: string }) {
  const [correo, setCorreo] = useState(correoInicial);
  const [enviado, setEnviado] = useState(false);
  useEffect(() => { if (abierta) setCorreo(correoInicial); }, [abierta]); // eslint-disable-line react-hooks/exhaustive-deps
  const cerrar = () => { alCerrar(); setTimeout(() => setEnviado(false), 250); };
  return (
    <Hoja abierta={abierta} alCerrar={cerrar} titulo="Recuperar contraseña">
      {enviado ? (
        <>
          <p className="cuerpo">Te mandamos un enlace a {correo.trim()} para crear una contraseña nueva. Vence en 15 minutos.</p>
          <button type="button" className="boton grande lleno" onClick={cerrar}>Listo</button>
        </>
      ) : (
        <>
          <p className="cuerpo">Escribe el correo con el que te invitaron y te mandamos un enlace para crear una nueva.</p>
          <label className="campo">
            <span className="etq">Correo</span>
            <input type="email" inputMode="email" autoCapitalize="none" value={correo} placeholder="Ej. nombre@ryocafe.mx"
              onChange={(ev) => setCorreo(ev.target.value)} />
          </label>
          <button type="button" className="boton grande lleno" disabled={!CORREO_OK.test(correo.trim())} onClick={() => setEnviado(true)}>
            {CORREO_OK.test(correo.trim()) ? 'Mandarme el enlace' : 'Escribe tu correo'}
          </button>
        </>
      )}
    </Hoja>
  );
}
