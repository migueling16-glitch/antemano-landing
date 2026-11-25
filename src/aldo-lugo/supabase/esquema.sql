-- =====================================================================================
-- Cuestionario del chef (ALDO chef LUGO · Mesa de Lumbre) — esquema para Supabase.
-- Proyecto: "antemano-clientes" (nuevo). Aplicar UNA vez en SQL Editor (o como migración).
-- Lo usa src/aldo-lugo/almacen.ts por PostgREST:
--   POST /rest/v1/rpc/aldo_cuestionario_guardar  { p_token, p_respuestas, p_enviado }
--   POST /rest/v1/rpc/aldo_cuestionario_leer     { p_token }
--
-- Seguridad:
--   * Las tablas tienen RLS y NINGUNA política: con la llave publicable (rol anon) nadie lee ni escribe
--     las tablas directo. Solo existen dos puertas: las dos funciones de abajo.
--   * El token del enlace (?k=…) nunca se guarda: solo su SHA-256. Quien no tiene el token no puede leer
--     ni escribir nada, y las funciones nunca crean filas (los tokens se pre-registran a mano).
--   * Las funciones son SECURITY DEFINER con search_path vacío (todo va calificado: public., extensions.).
-- =====================================================================================

create extension if not exists pgcrypto with schema extensions;

-- -------------------------------------------------------------------------------------
-- Tablas
-- -------------------------------------------------------------------------------------

create table if not exists public.aldo_cuestionario (
  token_hash  text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  cliente     text,
  respuestas  jsonb not null default '{}'::jsonb check (jsonb_typeof(respuestas) = 'object'),
  version     int not null default 0,
  actualizado timestamptz,
  enviado_en  timestamptz,
  creado      timestamptz default now()
);
comment on table public.aldo_cuestionario is
  'Respuestas del cuestionario del chef, una fila por enlace (token pre-registrado). Solo por RPC.';
comment on column public.aldo_cuestionario.respuestas is
  '{ "<campo>": { "v": valor, "d": {opción: detalle}, "t": ms de la edición }, "P5.nose": {...}, "_texto": texto legible del último envío }';

create table if not exists public.aldo_cuestionario_envios (
  id          bigserial primary key,
  token_hash  text not null references public.aldo_cuestionario (token_hash) on delete cascade,
  respuestas  jsonb not null,
  enviado_en  timestamptz not null default now()
);
comment on table public.aldo_cuestionario_envios is 'Historial: una copia cada vez que el chef toca «Enviar respuestas a Antemano».';
create index if not exists aldo_cuestionario_envios_token_idx on public.aldo_cuestionario_envios (token_hash, enviado_en desc);

alter table public.aldo_cuestionario enable row level security;
alter table public.aldo_cuestionario_envios enable row level security;
-- (Sin políticas a propósito.)

-- -------------------------------------------------------------------------------------
-- Fusión campo por campo: gana la entrada con "t" mayor; en empate, la nueva.
-- Así dos teléfonos (o un guardado sin red que llega tarde) no se pisan.
-- -------------------------------------------------------------------------------------

create or replace function public.aldo_cuestionario_fusionar(p_viejo jsonb, p_nuevo jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    jsonb_object_agg(
      coalesce(n.key, o.key),
      case
        when n.key is null then o.value
        when o.key is null then n.value
        -- CASE anidado: el ::numeric solo se evalúa si las dos "t" son números.
        when jsonb_typeof(o.value -> 't') = 'number' and jsonb_typeof(n.value -> 't') = 'number' then
          case when (o.value ->> 't')::numeric > (n.value ->> 't')::numeric then o.value else n.value end
        else n.value
      end
    ),
    '{}'::jsonb
  )
  from jsonb_each(coalesce(p_viejo, '{}'::jsonb)) as o
  full join jsonb_each(coalesce(p_nuevo, '{}'::jsonb)) as n on n.key = o.key;
$$;

-- -------------------------------------------------------------------------------------
-- Guardar: solo actualiza una fila YA registrada. Sin fila → no devuelve nada (el cliente lo trata como
-- "enlace no reconocido" y sigue solo en el teléfono). Nunca inserta en aldo_cuestionario.
-- -------------------------------------------------------------------------------------

create or replace function public.aldo_cuestionario_guardar(p_token text, p_respuestas jsonb, p_enviado boolean default false)
returns table (version int, actualizado timestamptz, enviado_en timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_hash   text;
  v_viejo  jsonb;
  v_nuevo  jsonb;
  v_ver    int;
  v_act    timestamptz;
  v_env    timestamptz;
begin
  if p_token is null or length(p_token) < 20 or length(p_token) > 128 then
    return;
  end if;
  if p_respuestas is null or jsonb_typeof(p_respuestas) <> 'object' then
    raise exception 'respuestas inválidas' using errcode = '22023';
  end if;
  if octet_length(p_respuestas::text) > 200000 then
    raise exception 'respuestas demasiado grandes (máx. 200 KB)' using errcode = '22001';
  end if;

  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');

  select c.respuestas into v_viejo
    from public.aldo_cuestionario c
   where c.token_hash = v_hash
     for update;
  if not found then
    return;
  end if;

  v_nuevo := public.aldo_cuestionario_fusionar(v_viejo, p_respuestas);
  if octet_length(v_nuevo::text) > 200000 then
    raise exception 'respuestas demasiado grandes (máx. 200 KB)' using errcode = '22001';
  end if;

  update public.aldo_cuestionario c
     set respuestas  = v_nuevo,
         version     = c.version + 1,
         actualizado = now(),
         enviado_en  = case when coalesce(p_enviado, false) then now() else c.enviado_en end
   where c.token_hash = v_hash
  returning c.version, c.actualizado, c.enviado_en into v_ver, v_act, v_env;

  if coalesce(p_enviado, false) then
    -- Un envío repetido en el mismo minuto actualiza la copia en vez de duplicarla.
    update public.aldo_cuestionario_envios e
       set respuestas = v_nuevo, enviado_en = now()
     where e.id = (
       select e2.id from public.aldo_cuestionario_envios e2
        where e2.token_hash = v_hash and e2.enviado_en > now() - interval '1 minute'
        order by e2.enviado_en desc
        limit 1
     );
    if not found then
      insert into public.aldo_cuestionario_envios (token_hash, respuestas) values (v_hash, v_nuevo);
    end if;
  end if;

  return query select v_ver, v_act, v_env;
end;
$$;

-- -------------------------------------------------------------------------------------
-- Leer: respuestas, versión y fechas del token. Token desconocido → ninguna fila.
-- -------------------------------------------------------------------------------------

create or replace function public.aldo_cuestionario_leer(p_token text)
returns table (respuestas jsonb, version int, actualizado timestamptz, enviado_en timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.respuestas, c.version, c.actualizado, c.enviado_en
    from public.aldo_cuestionario c
   where p_token is not null
     and length(p_token) between 20 and 128
     and c.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;

-- -------------------------------------------------------------------------------------
-- Permisos: anon solo puede EJECUTAR las dos funciones. Nada más.
-- (Supabase da permisos por omisión a anon/authenticated sobre lo nuevo en public: se quitan aquí.)
-- -------------------------------------------------------------------------------------

revoke all on table public.aldo_cuestionario, public.aldo_cuestionario_envios from public, anon, authenticated;
revoke all on sequence public.aldo_cuestionario_envios_id_seq from public, anon, authenticated;
revoke all on function public.aldo_cuestionario_fusionar(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.aldo_cuestionario_guardar(text, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.aldo_cuestionario_leer(text) from public, anon, authenticated;

grant execute on function public.aldo_cuestionario_guardar(text, jsonb, boolean) to anon;
grant execute on function public.aldo_cuestionario_leer(text) to anon;

-- Que PostgREST vea las funciones nuevas ya.
notify pgrst, 'reload schema';


-- =====================================================================================
-- OPERACIÓN (no se ejecuta al aplicar el esquema: copia y corre el bloque que necesites)
-- =====================================================================================

-- 1) Registrar un enlace para el chef (genera el token, guarda SOLO su hash y te devuelve el enlace).
--    Guarda el enlace: es la única copia del token. Si se pierde, registra otro.
--
-- with t as (select encode(extensions.gen_random_bytes(24), 'hex') as token),
--      i as (
--        insert into public.aldo_cuestionario (token_hash, cliente)
--        select encode(extensions.digest(t.token, 'sha256'), 'hex'), 'Aldo Lugo' from t
--        returning token_hash
--      )
-- select 'https://antemano.com.mx/aldolugo/cuestionario/?k=' || t.token as enlace from t, i;
--
--    Variante a mano (si ya tienes un token de 20 a 128 caracteres A–Z, a–z, 0–9, _ o -):
-- insert into public.aldo_cuestionario (token_hash, cliente)
-- values (encode(extensions.digest('PEGA_AQUI_EL_TOKEN', 'sha256'), 'hex'), 'Aldo Lugo');

-- 2) Ver cómo va (desde el panel: SQL Editor, como postgres; el rol anon no puede hacer esto).
--
-- select cliente, version, actualizado, enviado_en,
--        (select count(*) from jsonb_object_keys(respuestas)) as campos
--   from public.aldo_cuestionario
--  order by actualizado desc nulls last;

-- 3) Leer las respuestas, una fila por campo, en el orden de las preguntas.
--
-- select c.cliente,
--        r.key                                                     as campo,
--        r.value -> 'v'                                            as valor,
--        r.value -> 'd'                                            as detalle,
--        to_timestamp((r.value ->> 't')::numeric / 1000)           as editado
--   from public.aldo_cuestionario c
--  cross join lateral jsonb_each(c.respuestas) r
--  where r.key <> '_texto'
--  order by c.cliente, coalesce((regexp_match(r.key, '^[pP](\d+)'))[1]::int, 999), r.key;

-- 4) El texto legible del último envío (el mismo que el chef puede copiar a WhatsApp).
--
-- select cliente, enviado_en, respuestas -> '_texto' ->> 'v' as texto
--   from public.aldo_cuestionario
--  where enviado_en is not null;

-- 5) Historial de envíos.
--
-- select e.id, c.cliente, e.enviado_en, jsonb_pretty(e.respuestas)
--   from public.aldo_cuestionario_envios e
--   join public.aldo_cuestionario c using (token_hash)
--  order by e.enviado_en desc;

-- 6) Dar de baja un enlace (el teléfono del chef sigue guardando local, pero ya no sube nada).
--
-- delete from public.aldo_cuestionario where cliente = 'Aldo Lugo';
