/**
 * Función "invitar" (Supabase Edge Function, Deno).
 *
 * El admin da de alta a una persona desde la app (fila en personas) y la
 * app llama a esta función para mandarle el correo de invitación. Es lo
 * único que usa la llave secreta, y vive aquí, en el servidor: nunca en el
 * teléfono.
 *
 * Revisa con la sesión de quien llama (sus permisos, RLS) que:
 *   · la persona exista y quien llama la pueda ver (misma sucursal)
 *   · quien llama sea admin de esa sucursal
 * y solo entonces manda la invitación. Al aceptarla, la cuenta se liga sola
 * a la persona por correo (trigger vincular_persona).
 *
 * Publicar: Supabase → Edge Functions → Deploy new function → "invitar",
 * pegar este archivo. Las variables SUPABASE_URL y las llaves las pone
 * Supabase solas.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const responder = (cuerpo: unknown, estado = 200) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return responder({ error: 'Solo POST.' }, 405);

  // Supabase pone las llaves solo. Las nuevas vienen como JSON {"default": "sb_…"};
  // las de antes (anon, service_role) siguen como respaldo.
  const deJson = (nombre: string): string | undefined => {
    try { const o = JSON.parse(Deno.env.get(nombre) ?? ''); return o.default ?? Object.values(o)[0]; } catch { return undefined; }
  };
  const url = Deno.env.get('SUPABASE_URL')!;
  const publica = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? deJson('SUPABASE_PUBLISHABLE_KEYS') ?? Deno.env.get('SUPABASE_ANON_KEY');
  const secreta = Deno.env.get('SUPABASE_SECRET_KEY') ?? deJson('SUPABASE_SECRET_KEYS') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!publica || !secreta) return responder({ error: 'La función no encuentra las llaves del proyecto.' }, 500);
  const sesion = req.headers.get('Authorization');
  if (!sesion) return responder({ error: 'Falta la sesión.' }, 401);

  let correo = '';
  let redirectTo: string | undefined;
  try {
    const cuerpo = await req.json();
    correo = String(cuerpo.correo ?? '').trim().toLowerCase();
    redirectTo = typeof cuerpo.redirectTo === 'string' ? cuerpo.redirectTo : undefined;
  } catch {
    return responder({ error: 'Cuerpo inválido.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return responder({ error: 'Correo inválido.' }, 400);

  // Con los permisos de quien llama.
  const comoQuienLlama = createClient(url, publica, { global: { headers: { Authorization: sesion } } });
  const { data: persona, error: errPersona } = await comoQuienLlama
    .from('personas').select('id, sucursal_id, auth_id, activo').eq('correo', correo).maybeSingle();
  if (errPersona) return responder({ error: errPersona.message }, 400);
  if (!persona) return responder({ error: 'Esa persona no está dada de alta en tu sucursal.' }, 404);
  if (!persona.activo) return responder({ error: 'Esa persona está dada de baja.' }, 409);
  if (persona.auth_id) return responder({ error: 'Esa persona ya tiene cuenta.' }, 409);

  const { data: esAdmin, error: errRol } = await comoQuienLlama.rpc('es_admin', { sucursal: persona.sucursal_id });
  if (errRol) return responder({ error: errRol.message }, 400);
  if (!esAdmin) return responder({ error: 'Solo un admin puede invitar.' }, 403);

  // Ahora sí, con la llave secreta.
  const admin = createClient(url, secreta, { auth: { persistSession: false } });
  const { error } = await admin.auth.admin.inviteUserByEmail(correo, { redirectTo });
  if (error) return responder({ error: error.message }, 400);
  return responder({ ok: true });
});
