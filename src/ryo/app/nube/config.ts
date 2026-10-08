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
 * Si las dos quedan vacías, la app es solo la demo, como antes.
 */
/** Proyecto ryo-cafe (organización Antemano, plan gratis, East US). */
export const SUPABASE_URL: string = import.meta.env.PUBLIC_RYO_SUPABASE_URL ?? 'https://xvltmaahedzzabicthqf.supabase.co';
/** Llave publicable: Supabase la marca como "segura para compartir públicamente" con RLS activo. */
export const SUPABASE_LLAVE: string = import.meta.env.PUBLIC_RYO_SUPABASE_KEY ?? 'sb_publishable_POgPQkUZ4TGUac8sNWTVTQ_n7xYDEpr';

/** Hay equipo real conectado: la app ofrece "Iniciar sesión" de verdad y la demo aparte. */
export const hayNube = Boolean(SUPABASE_URL && SUPABASE_LLAVE);

/** A dónde regresan los enlaces de invitación y de "olvidé mi contraseña". */
export const URL_APP = typeof location === 'undefined' ? '' : `${location.origin}/ryocafe/app/`;
