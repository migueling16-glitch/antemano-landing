-- ═══════════════════════════════════════════════════════════════════
-- Ryo Café · App de barra · 5. Conocimiento, IA y datos externos
--
-- conocimiento: todo el texto libre de la operación (bitácora,
--   incidencias, seguimiento, notas de checklist, motivos) en un solo
--   lugar, buscable por palabras desde hoy (español) y por significado
--   cuando se conecte un modelo de embeddings multilingüe (1024 dim.).
-- ia: conversaciones del chat, memoria por persona, hallazgos y el uso
--   (tokens y costo) de cada llamada.
-- externo: lo que viene de fuera para cruzar: menú y ventas del punto de
--   venta, clima, insumos y compras. Lo llenan integraciones del servidor.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists vector with schema extensions;

/* ═══ CONOCIMIENTO ═══ */

create schema if not exists conocimiento;
comment on schema conocimiento is 'Texto libre de la operación, buscable por palabras (español) y por significado (embeddings).';

create table conocimiento.documentos (
  id text primary key,
  sucursal_id text references public.sucursales (id),
  fuente text not null check (fuente in ('bitacora', 'incidencia', 'seguimiento', 'nota_checklist', 'cambio_turno', 'ausencia', 'leccion', 'receta', 'glosario', 'manual')),
  fuente_id text not null,
  titulo text not null default '',
  texto text not null,
  jornada date,
  visibilidad text not null default 'equipo' check (visibilidad in ('equipo', 'encargados')),
  busqueda tsvector generated always as (to_tsvector('spanish'::regconfig, coalesce(titulo, '') || ' ' || texto)) stored,
  embedding extensions.vector(1024),
  embedding_modelo text,
  embedding_en timestamptz,
  actualizado_en timestamptz not null default now(),
  unique (fuente, fuente_id)
);
comment on table conocimiento.documentos is 'Un documento por cada texto libre de la operación (y del contenido de capacitación). Se llena solo con triggers.';
comment on column conocimiento.documentos.fuente is 'De dónde salió: bitacora, incidencia, seguimiento, nota_checklist, cambio_turno, ausencia, leccion, receta, glosario, manual.';
comment on column conocimiento.documentos.sucursal_id is 'NULL = contenido general (lecciones, recetas, glosario), visible para cualquier miembro.';
comment on column conocimiento.documentos.visibilidad is 'equipo: cualquier miembro · encargados: solo encargado y admin.';
comment on column conocimiento.documentos.embedding is 'Vector de significado (1024 dimensiones, modelo multilingüe). NULL = pendiente de calcular.';

create index on conocimiento.documentos using gin (busqueda);
create index on conocimiento.documentos using hnsw (embedding extensions.vector_cosine_ops);
create index on conocimiento.documentos (sucursal_id, jornada);

create or replace function conocimiento.guardar(
  p_fuente text, p_fuente_id text, p_sucursal text, p_titulo text, p_texto text, p_jornada date, p_visibilidad text
) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_texto is null or btrim(p_texto) = '' then
    delete from conocimiento.documentos where fuente = p_fuente and fuente_id = p_fuente_id;
    return;
  end if;
  insert into conocimiento.documentos as d (id, sucursal_id, fuente, fuente_id, titulo, texto, jornada, visibilidad)
  values (p_fuente || ':' || p_fuente_id, p_sucursal, p_fuente, p_fuente_id, coalesce(p_titulo, ''), p_texto, p_jornada, p_visibilidad)
  on conflict (fuente, fuente_id) do update set
    titulo = excluded.titulo,
    texto = excluded.texto,
    jornada = excluded.jornada,
    visibilidad = excluded.visibilidad,
    -- Si cambió el texto, el vector viejo ya no sirve.
    embedding = case when d.texto is distinct from excluded.texto then null else d.embedding end,
    embedding_modelo = case when d.texto is distinct from excluded.texto then null else d.embedding_modelo end,
    actualizado_en = now();
end;
$$;

create or replace function conocimiento.desde_operacion()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  f record := coalesce(new, old);
  zona text;
  corte time;
  item text;
begin
  select zona_horaria, corte_jornada into zona, corte from public.sucursales where id = f.sucursal_id;

  if tg_table_name = 'bitacora' then
    if tg_op = 'DELETE' then delete from conocimiento.documentos where fuente = 'bitacora' and fuente_id = old.id; return old; end if;
    perform conocimiento.guardar('bitacora', new.id, new.sucursal_id, 'Bitácora · ' || new.categoria, new.texto, new.jornada, 'equipo');

  elsif tg_table_name = 'incidencias' then
    if tg_op = 'DELETE' then delete from conocimiento.documentos where fuente = 'incidencia' and fuente_id = old.id; return old; end if;
    perform conocimiento.guardar('incidencia', new.id, new.sucursal_id, new.titulo,
      concat_ws(E'\n', new.titulo, new.detalle, case when new.cierre is not null then 'Cierre: ' || new.cierre end),
      public.jornada_de(new.abierta_en, zona, corte), 'equipo');

  elsif tg_table_name = 'incidencia_seguimiento' then
    if tg_op = 'DELETE' then delete from conocimiento.documentos where fuente = 'seguimiento' and fuente_id = old.incidencia_id || '/' || old.numero; return old; end if;
    perform conocimiento.guardar('seguimiento', new.incidencia_id || '/' || new.numero, new.sucursal_id,
      (select 'Seguimiento · ' || titulo from public.incidencias where id = new.incidencia_id), new.texto,
      public.jornada_de(new.escrito_en, zona, corte), 'equipo');

  elsif tg_table_name = 'marcas' then
    if tg_op = 'DELETE' then delete from conocimiento.documentos where fuente = 'nota_checklist' and fuente_id = old.ejecucion_id || '/' || old.item_id; return old; end if;
    select i.texto into item from public.ejecuciones e join public.plantilla_items i on i.plantilla_id = e.plantilla_id and i.id = new.item_id where e.id = new.ejecucion_id;
    perform conocimiento.guardar('nota_checklist', new.ejecucion_id || '/' || new.item_id, new.sucursal_id, coalesce(item, 'Nota de checklist'),
      concat_ws(E'\n', new.texto, array_to_string(new.acciones, '; ')),
      (select jornada from public.ejecuciones where id = new.ejecucion_id), 'equipo');

  elsif tg_table_name = 'cambios_turno' then
    if tg_op = 'DELETE' then delete from conocimiento.documentos where fuente = 'cambio_turno' and fuente_id = old.id; return old; end if;
    perform conocimiento.guardar('cambio_turno', new.id, new.sucursal_id, 'Cambio de turno', new.motivo, new.fecha, 'equipo');

  elsif tg_table_name = 'ausencias' then
    if tg_op = 'DELETE' then delete from conocimiento.documentos where fuente = 'ausencia' and fuente_id = old.id; return old; end if;
    perform conocimiento.guardar('ausencia', new.id, new.sucursal_id, 'Ausencia · ' || new.tipo, new.motivo, new.desde, 'encargados');
  end if;

  return new;
end;
$$;
comment on function conocimiento.desde_operacion() is 'Copia el texto libre de la operación a conocimiento.documentos.';

create trigger conocimiento after insert or update or delete on public.bitacora for each row execute function conocimiento.desde_operacion();
create trigger conocimiento after insert or update or delete on public.incidencias for each row execute function conocimiento.desde_operacion();
create trigger conocimiento after insert or update or delete on public.incidencia_seguimiento for each row execute function conocimiento.desde_operacion();
create trigger conocimiento after insert or update of texto, acciones or delete on public.marcas for each row execute function conocimiento.desde_operacion();
create trigger conocimiento after insert or update of motivo or delete on public.cambios_turno for each row execute function conocimiento.desde_operacion();
create trigger conocimiento after insert or update of motivo or delete on public.ausencias for each row execute function conocimiento.desde_operacion();

alter table conocimiento.documentos enable row level security;
create policy "miembros leen lo que les toca" on conocimiento.documentos for select to authenticated
  using (
    (sucursal_id is null and exists (select public.mis_sucursales()))
    or (public.es_miembro(sucursal_id) and (visibilidad = 'equipo' or public.es_encargado(sucursal_id)))
  );

create or replace function public.buscar_conocimiento(consulta text, limite integer default 10)
returns jsonb
language sql stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(r order by r.relevancia desc), '[]'::jsonb)
  from (
    select
      d.fuente, d.titulo, d.jornada,
      ts_headline('spanish'::regconfig, d.texto, q, 'MaxFragments=2, MaxWords=30, MinWords=8') as fragmento,
      round(ts_rank(d.busqueda, q)::numeric, 4) as relevancia,
      d.fuente_id
    from conocimiento.documentos d, websearch_to_tsquery('spanish'::regconfig, consulta) as q
    where d.busqueda @@ q
    order by ts_rank(d.busqueda, q) desc
    limit least(greatest(limite, 1), 50)
  ) as r
$$;
comment on function public.buscar_conocimiento(text, integer) is 'Busca por palabras (en español, con raíces: "molino" encuentra "molinos") en notas, incidencias y demás texto libre. Respeta permisos.';

create or replace function public.conocimiento_similar(vector_consulta extensions.vector(1024), limite integer default 10)
returns jsonb
language sql stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(r), '[]'::jsonb)
  from (
    select d.fuente, d.titulo, d.texto, d.jornada, d.fuente_id,
      round((1 - (d.embedding operator(extensions.<=>) vector_consulta))::numeric, 4) as similitud
    from conocimiento.documentos d
    where d.embedding is not null
    order by d.embedding operator(extensions.<=>) vector_consulta
    limit least(greatest(limite, 1), 50)
  ) as r
$$;
comment on function public.conocimiento_similar(extensions.vector, integer) is 'Busca por significado con un vector de consulta (mismo modelo que los documentos). Respeta permisos.';

grant usage on schema conocimiento to authenticated;
grant select on conocimiento.documentos to authenticated;
grant usage on schema extensions to authenticated;
grant execute on function public.buscar_conocimiento(text, integer), public.conocimiento_similar(extensions.vector, integer) to authenticated;
revoke execute on function public.buscar_conocimiento(text, integer), public.conocimiento_similar(extensions.vector, integer) from anon, public;
revoke all on function conocimiento.guardar(text, text, text, text, text, date, text), conocimiento.desde_operacion() from public, anon, authenticated;

/* ═══ IA ═══ */

create schema if not exists ia;
comment on schema ia is 'El chat y los agentes: conversaciones, memoria por persona, hallazgos y uso (tokens y costo).';

create table ia.conversaciones (
  id uuid primary key default gen_random_uuid(),
  sucursal_id text not null references public.sucursales (id),
  persona_id text not null references public.personas (id),
  titulo text not null default '',
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);
comment on table ia.conversaciones is 'Conversaciones del chat de análisis. Privadas: solo las ve quien las tuvo.';

create table ia.mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references ia.conversaciones (id) on delete cascade,
  rol text not null check (rol in ('usuario', 'asistente', 'herramienta')),
  contenido text not null,
  herramientas jsonb,
  modelo text,
  tokens_entrada integer,
  tokens_salida integer,
  costo_usd numeric(10, 6),
  calificacion smallint check (calificacion in (-1, 1)),
  enviado_en timestamptz not null default now()
);
comment on table ia.mensajes is 'Cada mensaje del chat. herramientas = qué consultó la IA para responder (para auditar y mejorar).';
comment on column ia.mensajes.calificacion is '1 = sirvió · −1 = no sirvió (lo marca quien preguntó).';

create table ia.memoria (
  persona_id text not null references public.personas (id),
  clave text not null,
  valor text not null,
  actualizada_en timestamptz not null default now(),
  primary key (persona_id, clave)
);
comment on table ia.memoria is 'Lo que el chat recuerda de cada persona (preferencias, contexto) para personalizar respuestas. La persona lo puede ver y borrar.';

create table ia.hallazgos (
  id uuid primary key default gen_random_uuid(),
  sucursal_id text not null references public.sucursales (id),
  tipo text not null check (tipo in ('reporte_semanal', 'alerta', 'sugerencia')),
  titulo text not null,
  cuerpo text not null,
  evidencia jsonb,
  visibilidad text not null default 'encargados' check (visibilidad in ('equipo', 'encargados')),
  creado_en timestamptz not null default now(),
  leido_por text[] not null default '{}'
);
comment on table ia.hallazgos is 'Lo que encuentra la IA por su cuenta (reporte semanal, alertas, sugerencias), con la evidencia (consultas y cifras) que lo respalda.';

create view ia.uso with (security_invoker = true) as
select c.sucursal_id, c.persona_id, (m.enviado_en at time zone 'America/Monterrey')::date as dia,
  count(*) filter (where m.rol = 'usuario') as preguntas,
  sum(m.tokens_entrada) as tokens_entrada, sum(m.tokens_salida) as tokens_salida,
  sum(m.costo_usd) as costo_usd,
  count(*) filter (where m.calificacion = 1) as utiles,
  count(*) filter (where m.calificacion = -1) as no_utiles
from ia.mensajes m
join ia.conversaciones c on c.id = m.conversacion_id
group by 1, 2, 3;
comment on view ia.uso is 'Uso del chat por persona y día: preguntas, tokens, costo y calificaciones.';

alter table ia.conversaciones enable row level security;
create policy "cada quien sus conversaciones" on ia.conversaciones for all to authenticated
  using (persona_id = public.mi_persona(sucursal_id)) with check (persona_id = public.mi_persona(sucursal_id));
alter table ia.mensajes enable row level security;
create policy "cada quien sus mensajes" on ia.mensajes for all to authenticated
  using (exists (select 1 from ia.conversaciones c where c.id = conversacion_id and c.persona_id = public.mi_persona(c.sucursal_id)))
  with check (exists (select 1 from ia.conversaciones c where c.id = conversacion_id and c.persona_id = public.mi_persona(c.sucursal_id)));
alter table ia.memoria enable row level security;
create policy "cada quien su memoria" on ia.memoria for all to authenticated
  using (exists (select 1 from public.personas p where p.id = persona_id and p.auth_id = auth.uid()))
  with check (exists (select 1 from public.personas p where p.id = persona_id and p.auth_id = auth.uid()));
alter table ia.hallazgos enable row level security;
create policy "miembros leen lo que les toca" on ia.hallazgos for select to authenticated
  using (public.es_miembro(sucursal_id) and (visibilidad = 'equipo' or public.es_encargado(sucursal_id)));
create policy "miembros marcan leído" on ia.hallazgos for update to authenticated
  using (public.es_miembro(sucursal_id)) with check (public.es_miembro(sucursal_id));

grant usage on schema ia to authenticated;
grant select, insert, update, delete on ia.conversaciones, ia.mensajes, ia.memoria to authenticated;
grant select, update on ia.hallazgos to authenticated;
grant select on ia.uso to authenticated;

/* ═══ EXTERNO ═══ */

create schema if not exists externo;
comment on schema externo is 'Datos de fuera para cruzar con la operación: menú y ventas del punto de venta, clima, insumos y compras.';

create table externo.productos (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  nombre text not null,
  seccion text not null check (seccion in ('cafe', 'matcha', 'sin-cafe', 'bar', 'cocina')),
  grupo text not null,
  precio_mxn numeric,
  variantes jsonb,
  descripcion text,
  activo boolean not null default true,
  actualizado_en timestamptz not null default now()
);
comment on table externo.productos is 'El menú (del PDF oficial): una fila por producto. Es la dimensión para cruzar ventas, recetas e insumos.';
comment on column externo.productos.id is 'slug del nombre (ej. "ryo-latte"), el mismo id de la receta en la app.';
comment on column externo.productos.precio_mxn is 'Precio en pesos. NULL = el menú todavía no lo tiene (cócteles y mocktails).';
comment on column externo.productos.variantes is 'Lista de {etiqueta, precio_mxn}: ej. frío 80, con salmón 219.';

create table externo.ventas (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  fuente text not null,
  ticket text,
  vendida_en timestamptz not null,
  jornada date not null,
  producto_id text references externo.productos (id),
  producto_en_fuente text not null,
  cantidad numeric not null default 1,
  precio_unitario_mxn numeric,
  total_mxn numeric,
  metodo_pago text,
  atendio text,
  importado_en timestamptz not null default now()
);
comment on table externo.ventas is 'Partidas de venta importadas del punto de venta (una fila por producto vendido). Las escribe la integración del servidor.';
comment on column externo.ventas.producto_en_fuente is 'Nombre tal como viene del punto de venta; producto_id es su equivalente en el menú.';
create index on externo.ventas (sucursal_id, jornada);
create index on externo.ventas (producto_id);

create table externo.clima (
  sucursal_id text not null references public.sucursales (id),
  hora timestamptz not null,
  temp_c numeric,
  sensacion_c numeric,
  humedad_pct numeric,
  lluvia_mm numeric,
  fuente text not null,
  primary key (sucursal_id, hora)
);
comment on table externo.clima is 'Clima por hora en la sucursal (de una API de clima), para cruzar con ventas y operación.';

create table externo.insumos (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  nombre text not null,
  marca text,
  presentacion text,
  unidad_base text not null check (unidad_base in ('g', 'ml', 'pieza')),
  contenido numeric,
  proveedor text,
  costo_mxn numeric,
  almacenamiento text,
  vida_util_abierto text,
  hecho_en_casa boolean not null default false,
  confirmado boolean not null default false,
  actualizado_en timestamptz not null default now()
);
comment on table externo.insumos is 'Insumos con marca y presentación (de la entrevista de menú). contenido = cuánto trae la presentación en unidad_base.';
comment on column externo.insumos.confirmado is 'false = supuesto o pendiente; true = lo confirmó Ryo.';

create table externo.compras (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  insumo_id text not null references externo.insumos (id),
  comprada_en date not null,
  cantidad numeric not null,
  costo_total_mxn numeric not null,
  proveedor text,
  actualizado_en timestamptz not null default now()
);
comment on table externo.compras is 'Compras de insumos: cantidad de presentaciones y costo total.';

create table externo.receta_insumos (
  producto_id text not null references externo.productos (id),
  insumo_id text not null references externo.insumos (id),
  sucursal_id text not null references public.sucursales (id),
  cantidad numeric not null,
  version text not null default 'caliente',
  actualizado_en timestamptz not null default now(),
  primary key (producto_id, insumo_id, version)
);
comment on table externo.receta_insumos is 'Cuánto de cada insumo lleva cada producto (en la unidad_base del insumo). Con costo_mxn ÷ contenido da el costo de receta.';
comment on column externo.receta_insumos.version is 'caliente o frio (las que se sirven de las dos formas).';

create view externo.costo_receta with (security_invoker = true) as
select
  p.sucursal_id, p.id as producto_id, p.nombre as producto, r.version, p.precio_mxn,
  round(sum(r.cantidad * i.costo_mxn / nullif(i.contenido, 0)), 2) as costo_mxn,
  round(p.precio_mxn - sum(r.cantidad * i.costo_mxn / nullif(i.contenido, 0)), 2) as margen_mxn,
  bool_and(i.confirmado) as todo_confirmado
from externo.productos p
join externo.receta_insumos r on r.producto_id = p.id
join externo.insumos i on i.id = r.insumo_id
group by p.sucursal_id, p.id, p.nombre, r.version, p.precio_mxn;
comment on view externo.costo_receta is 'Costo de insumos y margen de cada producto. todo_confirmado = false si algún insumo es supuesto.';

alter table externo.productos enable row level security;
create policy "miembros leen el menú" on externo.productos for select to authenticated using (public.es_miembro(sucursal_id));
create policy "encargados editan el menú" on externo.productos for all to authenticated
  using (public.es_encargado(sucursal_id)) with check (public.es_encargado(sucursal_id));
do $$
declare t text;
begin
  foreach t in array array['ventas', 'clima'] loop
    execute format('alter table externo.%I enable row level security', t);
    execute format('create policy "encargados leen" on externo.%I for select to authenticated using (public.es_encargado(sucursal_id))', t);
  end loop;
  foreach t in array array['insumos', 'compras', 'receta_insumos'] loop
    execute format('alter table externo.%I enable row level security', t);
    execute format('create policy "encargados leen y editan" on externo.%I for all to authenticated using (public.es_encargado(sucursal_id)) with check (public.es_encargado(sucursal_id))', t);
  end loop;
end $$;

grant usage on schema externo to authenticated;
grant select on all tables in schema externo to authenticated;
grant insert, update, delete on externo.productos, externo.insumos, externo.compras, externo.receta_insumos to authenticated;
