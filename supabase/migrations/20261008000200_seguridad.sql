-- ═══════════════════════════════════════════════════════════════════
-- Ryo Café · App de barra · 2. Seguridad
--
-- La llave publicable va en la app (es pública por diseño): lo que protege
-- los datos son estas reglas. RLS en todas las tablas:
--   · solo los miembros activos de una sucursal ven y escriben lo suyo
--   · lo de encargado/admin (validar, aprobar, publicar, editar el
--     catálogo) lo exige el servidor, no la app
--   · lo personal (motivo de una ausencia, capacitación, disponibilidad)
--     lo ven la persona y los encargados
-- Las reglas también aplican al chat de IA: consulta con los permisos de
-- quien pregunta.
-- ═══════════════════════════════════════════════════════════════════

/* ─── ¿Quién soy en esta sucursal? ───
 * security definer: leen personas sin pasar por su propio RLS (si no, las
 * reglas de personas se llamarían a sí mismas). */

create or replace function public.mi_persona(sucursal text)
returns text
language sql stable security definer
set search_path = ''
as $$
  select id from public.personas
  where auth_id = auth.uid() and sucursal_id = sucursal and activo
$$;
comment on function public.mi_persona(text) is 'id de persona de quien hace la consulta en esa sucursal (NULL si no es miembro activo).';

create or replace function public.es_miembro(sucursal text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.personas
    where auth_id = auth.uid() and sucursal_id = sucursal and activo
  )
$$;
comment on function public.es_miembro(text) is 'true si quien consulta es miembro activo de la sucursal.';

create or replace function public.rol_en(sucursal text)
returns text
language sql stable security definer
set search_path = ''
as $$
  select rol from public.personas
  where auth_id = auth.uid() and sucursal_id = sucursal and activo
$$;
comment on function public.rol_en(text) is 'Rol de quien consulta en la sucursal: admin, encargado o barista (NULL si no es miembro).';

create or replace function public.es_encargado(sucursal text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(public.rol_en(sucursal) in ('encargado', 'admin'), false)
$$;
comment on function public.es_encargado(text) is 'true si quien consulta es encargado o admin de la sucursal.';

create or replace function public.es_admin(sucursal text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(public.rol_en(sucursal) = 'admin', false)
$$;
comment on function public.es_admin(text) is 'true si quien consulta es admin de la sucursal.';

create or replace function public.mis_sucursales()
returns setof text
language sql stable security definer
set search_path = ''
as $$
  select sucursal_id from public.personas where auth_id = auth.uid() and activo
$$;
comment on function public.mis_sucursales() is 'Sucursales en las que quien consulta es miembro activo.';

/* ─── La invitación: la cuenta se vincula sola por correo ───
 * El admin da de alta a la persona (con su correo) y la invita. Cuando esa
 * persona crea su cuenta o acepta la invitación, queda vinculada. Una cuenta
 * sin persona no ve nada. */

create or replace function public.vincular_persona()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.personas
     set auth_id = new.id
   where auth_id is null and correo = lower(new.email);
  return new;
end;
$$;
comment on function public.vincular_persona() is 'Al crearse una cuenta en Auth, la liga a la persona con el mismo correo.';

create trigger vincular_persona
  after insert or update of email on auth.users
  for each row execute function public.vincular_persona();

/* ─── Reglas que la app no puede saltarse ─── */

create or replace function public.validar_transicion()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  yo text := public.mi_persona(new.sucursal_id);
  encargado boolean := public.es_encargado(new.sucursal_id);
begin
  -- Desde el servidor (sin sesión: funciones, migraciones) no se revisa.
  if auth.uid() is null then return new; end if;

  if tg_table_name = 'ejecuciones' then
    if (new.validada_en is distinct from old.validada_en or new.validada_por is distinct from old.validada_por) and not encargado then
      raise exception 'Solo un encargado puede validar un checklist.' using errcode = '42501';
    end if;

  elsif tg_table_name = 'cambios_turno' then
    if new.estado is distinct from old.estado then
      if new.estado in ('aprobado', 'rechazado') and not encargado then
        raise exception 'Solo un encargado aprueba o rechaza un cambio de turno.' using errcode = '42501';
      elsif new.estado = 'retirado' and yo is distinct from old.pedido_por and not encargado then
        raise exception 'Solo quien lo pidió puede retirar un cambio de turno.' using errcode = '42501';
      elsif new.estado in ('aceptado', 'declinado') and yo = old.pedido_por then
        raise exception 'No puedes aceptar tu propio cambio de turno.' using errcode = '42501';
      elsif new.estado = 'abierto' and old.estado = 'aceptado' and yo is distinct from old.aceptado_por and not encargado then
        raise exception 'Solo quien lo aceptó puede soltarlo.' using errcode = '42501';
      end if;
    end if;

  elsif tg_table_name = 'ausencias' then
    if new.estado is distinct from old.estado and new.estado in ('aprobada', 'rechazada') and not encargado then
      raise exception 'Solo un encargado aprueba días libres y vacaciones.' using errcode = '42501';
    end if;

  elsif tg_table_name = 'personas' then
    if (new.rol is distinct from old.rol or new.activo is distinct from old.activo or new.auth_id is distinct from old.auth_id)
       and not public.es_admin(new.sucursal_id) then
      raise exception 'Solo un admin cambia roles, altas y bajas del equipo.' using errcode = '42501';
    end if;
    if new.nivel is distinct from old.nivel and not encargado then
      raise exception 'Solo un encargado cambia el nivel de una persona.' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;
comment on function public.validar_transicion() is 'Reglas de negocio en el servidor: quién valida, aprueba, retira o cambia roles.';

create trigger validar_transicion before update on public.ejecuciones for each row execute function public.validar_transicion();
create trigger validar_transicion before update on public.cambios_turno for each row execute function public.validar_transicion();
create trigger validar_transicion before update on public.ausencias for each row execute function public.validar_transicion();
create trigger validar_transicion before update on public.personas for each row execute function public.validar_transicion();

/* ─── RLS ─── */

-- Operación: cualquier miembro lee y escribe; borrar, solo encargados.
do $$
declare t text;
begin
  foreach t in array array[
    'ejecuciones', 'marcas', 'fotos', 'equipos', 'botones', 'canastillas',
    'sesiones_calibracion', 'shots', 'recetas_del_dia', 'incidencias', 'incidencia_seguimiento'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "miembros leen" on public.%I for select to authenticated using (public.es_miembro(sucursal_id))', t);
    execute format('create policy "miembros agregan" on public.%I for insert to authenticated with check (public.es_miembro(sucursal_id))', t);
    execute format('create policy "miembros cambian" on public.%I for update to authenticated using (public.es_miembro(sucursal_id)) with check (public.es_miembro(sucursal_id))', t);
  end loop;
  -- Quitar una marca (desmarcar) es parte de operar.
  create policy "miembros quitan marcas" on public.marcas for delete to authenticated using (public.es_miembro(sucursal_id));
  foreach t in array array['ejecuciones', 'fotos', 'equipos', 'botones', 'canastillas', 'sesiones_calibracion', 'shots', 'recetas_del_dia', 'incidencias', 'incidencia_seguimiento'] loop
    execute format('create policy "encargados borran" on public.%I for delete to authenticated using (public.es_encargado(sucursal_id))', t);
  end loop;

  -- Catálogo: lo leen todos; lo editan encargados.
  foreach t in array array['plantillas', 'plantilla_items', 'cafes', 'turnos_tipo', 'bitacora'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "miembros leen" on public.%I for select to authenticated using (public.es_miembro(sucursal_id))', t);
    execute format('create policy "encargados editan" on public.%I for all to authenticated using (public.es_encargado(sucursal_id)) with check (public.es_encargado(sucursal_id))', t);
  end loop;
end $$;

alter table public.negocios enable row level security;
create policy "miembros leen su negocio" on public.negocios for select to authenticated
  using (exists (select 1 from public.sucursales s where s.negocio_id = negocios.id and public.es_miembro(s.id)));

alter table public.sucursales enable row level security;
create policy "miembros leen" on public.sucursales for select to authenticated using (public.es_miembro(id));
create policy "admin edita" on public.sucursales for update to authenticated using (public.es_admin(id)) with check (public.es_admin(id));

alter table public.personas enable row level security;
create policy "miembros leen al equipo" on public.personas for select to authenticated using (public.es_miembro(sucursal_id));
create policy "admin da de alta" on public.personas for insert to authenticated with check (public.es_admin(sucursal_id));
-- Encargados también: firmar una evaluación sube el nivel (la regla fina está en validar_transicion).
create policy "encargados editan" on public.personas for update to authenticated
  using (public.es_encargado(sucursal_id)) with check (public.es_encargado(sucursal_id));

-- Horarios: la semana en borrador solo la ve el encargado.
alter table public.semanas enable row level security;
create policy "miembros leen publicadas" on public.semanas for select to authenticated
  using (public.es_miembro(sucursal_id) and (estado = 'publicada' or public.es_encargado(sucursal_id)));
create policy "encargados editan" on public.semanas for all to authenticated
  using (public.es_encargado(sucursal_id)) with check (public.es_encargado(sucursal_id));

alter table public.asignaciones enable row level security;
create policy "miembros leen publicadas" on public.asignaciones for select to authenticated
  using (public.es_miembro(sucursal_id) and (public.es_encargado(sucursal_id) or exists (
    select 1 from public.semanas w where w.sucursal_id = asignaciones.sucursal_id and w.lunes = asignaciones.lunes and w.estado = 'publicada')));
create policy "encargados editan" on public.asignaciones for all to authenticated
  using (public.es_encargado(sucursal_id)) with check (public.es_encargado(sucursal_id));

-- Lo personal: la persona y los encargados.
do $$
declare t text;
begin
  foreach t in array array['disponibilidad', 'lecciones_completadas', 'repasos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "la persona y encargados leen" on public.%I for select to authenticated using (persona_id = public.mi_persona(sucursal_id) or public.es_encargado(sucursal_id))', t);
    execute format('create policy "la persona y encargados escriben" on public.%I for all to authenticated using (persona_id = public.mi_persona(sucursal_id) or public.es_encargado(sucursal_id)) with check (persona_id = public.mi_persona(sucursal_id) or public.es_encargado(sucursal_id))', t);
  end loop;
  foreach t in array array['evaluaciones', 'lecciones_asignadas'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "la persona y encargados leen" on public.%I for select to authenticated using (persona_id = public.mi_persona(sucursal_id) or public.es_encargado(sucursal_id))', t);
    execute format('create policy "encargados escriben" on public.%I for all to authenticated using (public.es_encargado(sucursal_id)) with check (public.es_encargado(sucursal_id))', t);
  end loop;
end $$;

alter table public.ausencias enable row level security;
create policy "la persona y encargados leen" on public.ausencias for select to authenticated
  using (persona_id = public.mi_persona(sucursal_id) or public.es_encargado(sucursal_id));
create policy "la persona pide" on public.ausencias for insert to authenticated
  with check (persona_id = public.mi_persona(sucursal_id) or public.es_encargado(sucursal_id));
create policy "la persona y encargados cambian" on public.ausencias for update to authenticated
  using (persona_id = public.mi_persona(sucursal_id) or public.es_encargado(sucursal_id))
  with check (persona_id = public.mi_persona(sucursal_id) or public.es_encargado(sucursal_id));
create policy "encargados borran" on public.ausencias for delete to authenticated using (public.es_encargado(sucursal_id));

-- Para cubrir turnos el equipo necesita saber quién falta, no por qué.
create view public.ausencias_equipo
with (security_barrier = true) as
  select id, sucursal_id, persona_id, desde, hasta, tipo, estado, pedida_en, resuelta_por
  from public.ausencias
  where public.es_miembro(sucursal_id) and estado <> 'rechazada';
comment on view public.ausencias_equipo is 'Ausencias del equipo sin el motivo: lo que necesita cualquiera para cubrir turnos. El motivo está en ausencias, solo para la persona y encargados.';

alter table public.cambios_turno enable row level security;
create policy "miembros leen" on public.cambios_turno for select to authenticated using (public.es_miembro(sucursal_id));
create policy "la persona pide" on public.cambios_turno for insert to authenticated
  with check (pedido_por = public.mi_persona(sucursal_id));
create policy "miembros responden" on public.cambios_turno for update to authenticated
  using (public.es_miembro(sucursal_id)) with check (public.es_miembro(sucursal_id));
create policy "encargados borran" on public.cambios_turno for delete to authenticated using (public.es_encargado(sucursal_id));

alter table public.notificaciones enable row level security;
create policy "cada quien lee lo suyo" on public.notificaciones for select to authenticated
  using (public.es_miembro(sucursal_id) and (
    para in (public.mi_persona(sucursal_id), 'todos')
    or (para = 'encargados' and public.es_encargado(sucursal_id))
    or de = public.mi_persona(sucursal_id)));
create policy "miembros avisan" on public.notificaciones for insert to authenticated with check (public.es_miembro(sucursal_id));
create policy "miembros marcan leído" on public.notificaciones for update to authenticated
  using (public.es_miembro(sucursal_id)) with check (public.es_miembro(sucursal_id));
create policy "encargados borran" on public.notificaciones for delete to authenticated using (public.es_encargado(sucursal_id));

/* ─── Permisos explícitos (Supabase los exige para la API desde oct-2026) ─── */

revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.ausencias_equipo to authenticated;
revoke all on function public.vincular_persona() from public, anon, authenticated;
grant execute on function
  public.jornada_de(timestamptz, text, time), public.mi_persona(text), public.es_miembro(text),
  public.rol_en(text), public.es_encargado(text), public.es_admin(text), public.mis_sucursales()
  to authenticated;
