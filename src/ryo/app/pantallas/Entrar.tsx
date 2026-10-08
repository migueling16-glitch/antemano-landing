/**
 * Iniciar sesión con correo y contraseña. Solo con invitación: si el correo
 * no está dado de alta, no hay cuenta que crear.
 *
 * Con el equipo real conectado (nube/config.ts), entrar es con Supabase y
 * la demo queda aparte, a un toque, con sus datos de ejemplo solo en este
 * teléfono. Sin conexión configurada, la app es la maqueta: entra cualquier
 * correo del equipo con una contraseña de 4 caracteres o más.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useEstado, entrar, vibrar, avisar, type Rol } from '../estado';
import { Marca, Casilla, Hoja } from '../componentes';
import { hayNube } from '../nube/config';
import { entrarNube, entrarDemo, recuperarClave, crearClave } from '../nube/sync';
import { crearSemilla } from '../semilla';

const PERFILES: { id: string; rol: Rol; texto: string }[] = [
  { id: 'u-ana', rol: 'barista', texto: 'Barista 2' },
  { id: 'u-diego', rol: 'barista', texto: 'Barista 1' },
  { id: 'u-carla', rol: 'encargado', texto: 'Encargada' },
  { id: 'u-sofia', rol: 'admin', texto: 'Admin' },
];

const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Entrar() {
  const actual = useEstado();
  // Los perfiles de la demo salen siempre de los datos de ejemplo, aunque el teléfono tenga los del equipo real.
  const e = hayNube ? demoDatos : actual;
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
    if (hayNube) {
      setError(null);
      setEntrando(true);
      vibrar(15);
      entrarNube(c, clave, recordar).then((err) => {
        setEntrando(false);
        if (err) return fallar(err);
        if (location.hash.length < 3) location.hash = '#/inicio';
      });
      return;
    }
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

      {hayNube ? (
        <section className="pila-s entrar-prueba" aria-label="Demo">
          <span className="etq">¿Solo quieres verla? Entra a la demo</span>
          <p className="cuerpo">Datos de ejemplo, solo en este teléfono. Nada de lo que hagas ahí llega al equipo real.</p>
          <div className="chips">
            {PERFILES.map((p) => {
              const u = e.usuarios.find((x) => x.id === p.id)!;
              return (
                <button key={p.id} type="button" className="chip" onClick={() => { vibrar(10); entrarDemo(p.id); if (location.hash.length < 3) location.hash = '#/inicio'; }}>
                  {u.nombre.split(' ')[0]} · {p.texto}
                </button>
              );
            })}
          </div>
        </section>
      ) : (
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
      )}

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
  const [mandando, setMandando] = useState(false);
  const cerrar = () => { alCerrar(); setTimeout(() => setEnviado(false), 250); };
  const mandar = async () => {
    if (!hayNube) { setEnviado(true); return; }
    setMandando(true);
    const err = await recuperarClave(correo);
    setMandando(false);
    if (err) avisar(`No se pudo mandar el enlace: ${err}`); else setEnviado(true);
  };
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
          <button type="button" className="boton grande lleno" disabled={!CORREO_OK.test(correo.trim()) || mandando} onClick={mandar}>
            {mandando ? 'Mandando…' : CORREO_OK.test(correo.trim()) ? 'Mandarme el enlace' : 'Escribe tu correo'}
          </button>
        </>
      )}
    </Hoja>
  );
}

/** Los perfiles de la demo (nombres y correos de ejemplo). */
const demoDatos = crearSemilla();

/**
 * Al abrir el enlace de la invitación (o el de "olvidé mi contraseña"):
 * crear la contraseña con la que va a entrar desde ahora.
 */
export function NuevaClave({ tipo }: { tipo: 'invitacion' | 'recuperacion' }) {
  const [clave, setClave] = useState('');
  const [otra, setOtra] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async (ev: FormEvent) => {
    ev.preventDefault();
    if (clave.length < 6) return setError('Usa al menos 6 caracteres.');
    if (clave !== otra) return setError('Las dos contraseñas no coinciden.');
    setError(null);
    setGuardando(true);
    const err = await crearClave(clave);
    setGuardando(false);
    if (err) return setError(err);
    vibrar(15);
    avisar(tipo === 'invitacion' ? 'Listo: ya eres parte de la barra.' : 'Contraseña cambiada.');
    location.hash = '#/inicio';
  };

  return (
    <main className="pant pila entrar">
      <div className="pila-s entrar-cabeza">
        <Marca tipo="logotipo" alto={104} etiqueta="Ryo Café" className="entrar-logo" />
        <h1 className="titulo">{tipo === 'invitacion' ? 'Bienvenido a la barra' : 'Nueva contraseña'}</h1>
        <p className="cuerpo">
          {tipo === 'invitacion'
            ? 'Crea la contraseña con la que vas a entrar desde ahora. Tu correo ya quedó confirmado.'
            : 'Escribe tu nueva contraseña dos veces.'}
        </p>
      </div>
      <form className="pila" onSubmit={guardar} noValidate>
        <label className="campo">
          <span className="etq">Contraseña</span>
          <span className="campo-clave">
            <input type={ver ? 'text' : 'password'} autoComplete="new-password" value={clave} placeholder="Mínimo 6 caracteres"
              onChange={(ev) => { setClave(ev.target.value); setError(null); }} />
            <button type="button" className="enlace" onClick={() => setVer(!ver)} aria-pressed={ver}>{ver ? 'Ocultar' : 'Mostrar'}</button>
          </span>
        </label>
        <label className="campo">
          <span className="etq">Otra vez</span>
          <input type={ver ? 'text' : 'password'} autoComplete="new-password" value={otra} placeholder="La misma contraseña"
            onChange={(ev) => { setOtra(ev.target.value); setError(null); }} />
        </label>
        {error && <p className="bloque inv error sacude" role="alert">{error}</p>}
        <button type="submit" className={`boton grande lleno${guardando ? ' cargando' : ''}`}>
          <span>{guardando ? 'Guardando…' : 'Guardar y entrar'}</span>
        </button>
      </form>
    </main>
  );
}
