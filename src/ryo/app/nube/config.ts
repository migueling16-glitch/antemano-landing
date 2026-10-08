/**
 * Dónde está la base del equipo real (Supabase).
 *
 * La URL y la llave publicable van en el código a propósito: Supabase las
 * diseñó para estar en la app (como la dirección de un sitio). Lo que
 * protege los datos son las reglas RLS de la base, no esconder la llave.
 * La llave secreta y la contraseña de la base NUNCA van aquí.
 *
 * Se pueden sobreescribir con PUBLIC_RYO_SUPABASE_URL y
 * PUBLIC_RYO_SUPABASE_KEY (por ejemplo, para apuntar a otro proyecto).
 * Vacías = la app es solo la demo, como antes.
 */
export const SUPABASE_URL: string = import.meta.env.PUBLIC_RYO_SUPABASE_URL ?? '';
export const SUPABASE_LLAVE: string = import.meta.env.PUBLIC_RYO_SUPABASE_KEY ?? '';

/** Hay equipo real conectado: la app ofrece "Iniciar sesión" de verdad y la demo aparte. */
export const hayNube = Boolean(SUPABASE_URL && SUPABASE_LLAVE);

/** A dónde regresan los enlaces de invitación y de "olvidé mi contraseña". */
export const URL_APP = typeof location === 'undefined' ? '' : `${location.origin}/ryocafe/app/`;
