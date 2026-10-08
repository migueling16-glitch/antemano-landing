-- ═══════════════════════════════════════════════════════════════════
-- Ryo Café · App de barra · 3. Eventos
--
-- La historia de todo lo que pasa: quién hizo qué, cuándo y en qué
-- jornada. Solo se agrega (nadie la edita ni la borra desde la app).
-- Sirve de auditoría ("¿quién midió el refri el martes?") y de línea de
-- tiempo para la IA ("¿qué pasó ayer en la barra?").
-- ═══════════════════════════════════════════════════════════════════

create table public.eventos (
  id bigint generated always as identity primary key,
  sucursal_id text not null references public.sucursales (id),
  ocurrido_en timestamptz not null default now(),
  jornada date not null,
  tabla text not null,
  registro text not null,
  accion text not null check (accion in ('alta', 'cambio', 'baja')),
  actor_auth uuid,
  actor_persona text,
  datos jsonb not null,
  cambios jsonb
);
comment on table public.eventos is 'Historia de la operación: cada alta, cambio o baja en las tablas de la app. Solo se agrega. La leen encargados y admin.';
comment on column public.eventos.jornada is 'Día de negocio en que pasó (hora de Durango, corte 5:00).';
comment on column public.eventos.tabla is 'Tabla donde pasó (ej. marcas, shots, cambios_turno).';
comment on column public.eventos.registro is 'Llave del registro (las columnas de su llave primaria unidas con "/").';
comment on column public.eventos.accion is 'alta = se creó · cambio = se editó · baja = se borró.';
comment on column public.eventos.actor_persona is 'Persona que lo hizo (NULL si lo hizo el sistema).';
comment on column public.eventos.datos is 'La fila como quedó (o como era, si fue baja).';
comment on column public.eventos.cambios is 'Solo en cambios: {columna: {antes, despues}} de lo que cambió.';

create index on public.eventos (sucursal_id, jornada);
create index on public.eventos (sucursal_id, tabla, registro);

create or replace function public.registrar_evento()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  fila jsonb := to_jsonb(coalesce(new, old));
  antes jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  despues jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  sucursal text := fila ->> 'sucursal_id';
  zona text;
  corte time;
  llave text;
  dif jsonb;
  col text;
begin
  select zona_horaria, corte_jornada into zona, corte from public.sucursales where id = sucursal;
  select string_agg(fila ->> c, '/' order by ord) into llave
    from unnest(tg_argv) with ordinality as k(c, ord);

  if tg_op = 'UPDATE' then
    dif := '{}'::jsonb;
    for col in select jsonb_object_keys(despues) loop
      if col not in ('actualizado_en', 'actualizado_por') and despues -> col is distinct from antes -> col then
        dif := dif || jsonb_build_object(col, jsonb_build_object('antes', antes -> col, 'despues', despues -> col));
      end if;
    end loop;
    if dif = '{}'::jsonb then return new; end if;
  end if;

  insert into public.eventos (sucursal_id, jornada, tabla, registro, accion, actor_auth, actor_persona, datos, cambios)
  values (
    sucursal,
    public.jornada_de(now(), coalesce(zona, 'America/Monterrey'), coalesce(corte, '05:00')),
    tg_table_name,
    llave,
    case tg_op when 'INSERT' then 'alta' when 'UPDATE' then 'cambio' else 'baja' end,
    auth.uid(),
    (select id from public.personas where auth_id = auth.uid() and sucursal_id = sucursal),
    coalesce(despues, antes) - 'actualizado_por',
    dif
  );
  return coalesce(new, old);
end;
$$;
comment on function public.registrar_evento() is 'Escribe en eventos cada alta, cambio o baja. Recibe como argumentos las columnas de la llave primaria.';

do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('personas', 'id'), ('plantillas', 'id'), ('plantilla_items', 'plantilla_id,id'),
      ('ejecuciones', 'id'), ('marcas', 'ejecucion_id,item_id'), ('fotos', 'id'),
      ('equipos', 'id'), ('botones', 'equipo_id,id'), ('canastillas', 'id'), ('cafes', 'id'),
      ('sesiones_calibracion', 'id'), ('shots', 'id'), ('recetas_del_dia', 'jornada,cafe_id'),
      ('turnos_tipo', 'id'), ('semanas', 'lunes'), ('asignaciones', 'persona_id,fecha'),
      ('disponibilidad', 'persona_id,dia_semana'), ('cambios_turno', 'id'), ('ausencias', 'id'),
      ('incidencias', 'id'), ('incidencia_seguimiento', 'incidencia_id,numero'), ('bitacora', 'id'),
      ('lecciones_completadas', 'persona_id,leccion_id'), ('repasos', 'persona_id,pregunta_id'),
      ('evaluaciones', 'persona_id,nivel'), ('lecciones_asignadas', 'persona_id,numero')
    ) as v(tabla, llave)
  loop
    execute format(
      'create trigger registrar_evento after insert or update or delete on public.%I for each row execute function public.registrar_evento(%s)',
      t.tabla, (select string_agg(quote_literal(c), ', ') from unnest(string_to_array(t.llave, ',')) c)
    );
  end loop;
end $$;

alter table public.eventos enable row level security;
create policy "encargados leen la historia" on public.eventos for select to authenticated
  using (public.es_encargado(sucursal_id));
-- Nadie escribe directo: solo el trigger.
revoke all on public.eventos from anon, authenticated;
grant select on public.eventos to authenticated;
revoke all on function public.registrar_evento() from public, anon, authenticated;
