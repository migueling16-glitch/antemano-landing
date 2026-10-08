-- ═══════════════════════════════════════════════════════════════════
-- Ryo Café · App de barra · 4. Capa semántica (analitica)
--
-- Lo que lee quien analiza: el Panel, una persona en una hoja de cálculo
-- o un agente de IA. Vistas ya unidas, con nombres en vez de ids, unidades
-- en el nombre, una fila por cosa y la jornada en todo. Las métricas se
-- definen UNA vez (analitica.metricas) y el Panel y la IA usan la misma.
--
-- Todas las vistas son security_invoker: quien consulta solo ve lo que sus
-- permisos le dejan ver (un barista no ve el motivo de la ausencia de otro).
-- ═══════════════════════════════════════════════════════════════════

create schema if not exists analitica;
comment on schema analitica is 'Capa semántica para análisis e IA: vistas legibles, métricas definidas una vez y glosario de Ryo. Empezar por public.describir_datos().';

/* ─── Calendario: una fila por jornada ─── */

create view analitica.dias with (security_invoker = true) as
select
  s.id as sucursal_id,
  d::date as jornada,
  extract(dow from d)::int as dia_semana,
  (array['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'])[extract(dow from d)::int + 1] as dia_nombre,
  d::date - (extract(isodow from d)::int - 1) as semana_lunes,
  extract(dow from d) in (0, 6) as fin_de_semana,
  d::date = public.jornada_de(now(), s.zona_horaria, s.corte_jornada) as es_hoy
from public.sucursales s
cross join lateral generate_series(
  s.inicio_operacion::timestamp,
  public.jornada_de(now(), s.zona_horaria, s.corte_jornada)::timestamp,
  interval '1 day'
) as d;
comment on view analitica.dias is 'Calendario: una fila por jornada desde que la sucursal opera hasta hoy. El eje para cruzar todo lo demás.';
comment on column analitica.dias.dia_semana is '0 = domingo … 6 = sábado.';
comment on column analitica.dias.semana_lunes is 'Lunes de la semana de horarios a la que pertenece.';

/* ─── Personas ─── */

create view analitica.personas with (security_invoker = true) as
select
  p.sucursal_id, p.id as persona_id, p.nombre, p.rol, p.nivel, p.activo, p.ingreso,
  current_date - p.ingreso as dias_en_ryo
from public.personas p;
comment on view analitica.personas is 'El equipo: rol (admin, encargado, barista), nivel de barista (1–3), antigüedad.';

/* ─── Checklists ─── */

create view analitica.checklists with (security_invoker = true) as
with tocaban as (
  select
    d.sucursal_id, d.jornada, d.dia_semana, d.es_hoy,
    p.id as plantilla_id, p.nombre as plantilla, p.frecuencia,
    ((d.jornada + p.hora_limite)
      + case when p.hora_limite < s.corte_jornada then interval '1 day' else interval '0' end
    ) at time zone s.zona_horaria as limite
  from analitica.dias d
  join public.sucursales s on s.id = d.sucursal_id
  join public.plantillas p
    on p.sucursal_id = d.sucursal_id and p.activa and d.jornada >= p.vigente_desde
   and (p.frecuencia = 'diaria' or p.dia_semana = d.dia_semana)
)
select
  t.sucursal_id, t.jornada, t.dia_semana, t.plantilla_id, t.plantilla, t.frecuencia,
  e.id as ejecucion_id,
  t.limite,
  e.completada_en,
  pc.nombre as completada_por,
  e.validada_en,
  pv.nombre as validada_por,
  case
    when e.completada_en is not null then case when e.completada_en <= t.limite then 'a_tiempo' else 'tarde' end
    when not t.es_hoy or now() > t.limite then 'no_se_hizo'
    else 'pendiente'
  end as estado,
  case when e.completada_en > t.limite then round(extract(epoch from e.completada_en - t.limite) / 60) end as minutos_tarde,
  round((extract(epoch from e.validada_en - e.completada_en) / 3600)::numeric, 2) as horas_para_validar,
  (select count(*) from public.marcas m where m.ejecucion_id = e.id) as tareas_marcadas,
  (select count(*) from public.marcas m where m.ejecucion_id = e.id and m.fuera_de_rango) as lecturas_fuera_de_rango
from tocaban t
left join public.ejecuciones e on e.plantilla_id = t.plantilla_id and e.jornada = t.jornada
left join public.personas pc on pc.id = e.completada_por
left join public.personas pv on pv.id = e.validada_por;
comment on view analitica.checklists is 'Cada checklist que tocaba cada jornada y cómo terminó. Base de la métrica "checklists a tiempo".';
comment on column analitica.checklists.estado is 'a_tiempo: completado antes del límite · tarde: completado después · no_se_hizo: pasó el límite sin completarse · pendiente: hoy y todavía en tiempo.';
comment on column analitica.checklists.limite is 'Momento límite (hora límite de la plantilla en esa jornada).';
comment on column analitica.checklists.horas_para_validar is 'Horas entre que se completó y que un encargado lo validó.';

create view analitica.marcas with (security_invoker = true) as
select
  e.sucursal_id, e.jornada, p.nombre as plantilla, i.seccion, i.texto as tarea, i.tipo, i.critica,
  m.valor, i.unidad, i.minimo, i.maximo, m.fuera_de_rango, m.texto as nota, m.acciones,
  m.foto_id is not null as con_foto,
  per.nombre as marcada_por, m.marcada_en,
  (m.marcada_en at time zone s.zona_horaria) as hora_local,
  e.id as ejecucion_id, m.item_id
from public.marcas m
join public.ejecuciones e on e.id = m.ejecucion_id
join public.plantillas p on p.id = e.plantilla_id
left join public.plantilla_items i on i.plantilla_id = e.plantilla_id and i.id = m.item_id
join public.personas per on per.id = m.marcada_por
join public.sucursales s on s.id = e.sucursal_id;
comment on view analitica.marcas is 'Cada tarea marcada y cada lectura de checklist, con su texto, rango y quién la hizo. Las lecturas numéricas (tipo numero) traen valor y unidad: ej. temperatura del refri en °C.';
comment on column analitica.marcas.hora_local is 'Hora de Durango en que se marcó.';

/* ─── Calibración ─── */

create view analitica.shots with (security_invoker = true) as
select
  s.sucursal_id, s.jornada, c.nombre as cafe, c.es_casa, s.tueste, s.dias_reposo,
  p.nombre as barista, mo.nombre as molino, coalesce(b.nombre, s.boton_id) as boton,
  ca.nombre as canastilla, ca.capacidad_g,
  sh.numero, sh.dosis_g, sh.rendimiento_g, sh.ratio, sh.tiempo_s, sh.molienda, sh.pulsos,
  sh.sabor_acidez, sh.sabor_intensidad, sh.aprobado,
  sh.tiempo_s - sh.previsto_tiempo_s as error_prediccion_tiempo_s,
  sh.rendimiento_g - sh.previsto_rendimiento_g as error_prediccion_rendimiento_g,
  abs(sh.tiempo_s - c.objetivo_tiempo_s) <= c.tolerancia_tiempo_s
    and abs(sh.ratio - c.objetivo_rendimiento_g / c.objetivo_dosis_g)
        <= c.tolerancia_ratio * (c.objetivo_rendimiento_g / c.objetivo_dosis_g) as en_ventana,
  sh.hecho_en,
  (sh.hecho_en at time zone su.zona_horaria) as hora_local,
  s.id as sesion_id, sh.id as shot_id
from public.shots sh
join public.sesiones_calibracion s on s.id = sh.sesion_id
join public.cafes c on c.id = s.cafe_id
join public.personas p on p.id = s.calibrada_por
join public.equipos mo on mo.id = s.molino_id
left join public.botones b on b.id = s.boton_id and b.sucursal_id = s.sucursal_id
left join public.canastillas ca on ca.id = s.canastilla_id
join public.sucursales su on su.id = s.sucursal_id;
comment on view analitica.shots is 'Cada shot de calibración con su contexto: café, lote (tueste y días de reposo), barista, molino, botón, canastilla, lo medido y cómo supo.';
comment on column analitica.shots.en_ventana is 'Tiempo y ratio dentro de las tolerancias del objetivo del café.';
comment on column analitica.shots.sabor_acidez is '−1 ácido/subextraído … +1 amargo/sobreextraído.';
comment on column analitica.shots.sabor_intensidad is '−1 débil … +1 intenso.';
comment on column analitica.shots.error_prediccion_tiempo_s is 'Tiempo real menos el que predijo el modelo de calibración.';

create view analitica.calibraciones with (security_invoker = true) as
select
  s.sucursal_id, s.jornada, c.nombre as cafe, c.es_casa, s.tueste, s.dias_reposo, p.nombre as barista,
  count(sh.id) as shots,
  max(sh.numero) filter (where sh.aprobado) as shots_hasta_aprobar,
  s.shot_aprobado_id is not null as aprobada,
  round(extract(epoch from s.fin - s.inicio) / 60) as minutos,
  max(sh.dosis_g) filter (where sh.aprobado) as receta_dosis_g,
  max(sh.rendimiento_g) filter (where sh.aprobado) as receta_rendimiento_g,
  max(sh.tiempo_s) filter (where sh.aprobado) as receta_tiempo_s,
  max(sh.molienda) filter (where sh.aprobado) as receta_molienda,
  max(sh.pulsos) filter (where sh.aprobado) as receta_pulsos,
  s.id as sesion_id
from public.sesiones_calibracion s
join public.cafes c on c.id = s.cafe_id
join public.personas p on p.id = s.calibrada_por
left join public.shots sh on sh.sesion_id = s.id
group by s.id, c.nombre, c.es_casa, p.nombre;
comment on view analitica.calibraciones is 'Una fila por sesión de calibración: cuántos shots costó, cuánto tardó y la receta que quedó.';

create view analitica.recetas_del_dia with (security_invoker = true) as
select
  r.sucursal_id, r.jornada, c.nombre as cafe, c.es_casa,
  r.dosis_g, r.rendimiento_g, round(r.rendimiento_g / nullif(r.dosis_g, 0), 3) as ratio,
  r.tiempo_s, r.molienda, r.pulsos, coalesce(b.nombre, r.boton_id) as boton, ca.nombre as canastilla,
  p.nombre as aprobada_por, r.aprobada_en
from public.recetas_del_dia r
join public.cafes c on c.id = r.cafe_id
join public.personas p on p.id = r.aprobada_por
left join public.botones b on b.id = r.boton_id and b.sucursal_id = r.sucursal_id
left join public.canastillas ca on ca.id = r.canastilla_id;
comment on view analitica.recetas_del_dia is 'La receta de espresso aprobada de cada café, día por día.';

/* ─── Horarios ─── */

create view analitica.turnos with (security_invoker = true) as
select
  a.sucursal_id, a.fecha, extract(dow from a.fecha)::int as dia_semana,
  per.nombre as persona, per.rol, tt.nombre as turno, tt.inicio, tt.fin,
  round((extract(epoch from (tt.fin - tt.inicio)) / 3600 + case when tt.fin <= tt.inicio then 24 else 0 end)::numeric, 2) as horas,
  w.estado = 'publicada' as publicada,
  a.persona_id
from public.asignaciones a
join public.turnos_tipo tt on tt.id = a.turno_tipo_id
join public.personas per on per.id = a.persona_id
join public.semanas w on w.sucursal_id = a.sucursal_id and w.lunes = a.lunes;
comment on view analitica.turnos is 'Quién trabajó (o trabajará) qué turno cada día y cuántas horas.';

create view analitica.cobertura with (security_invoker = true) as
with franjas as (
  select d.sucursal_id, d.jornada, f as desde
  from analitica.dias d
  join public.sucursales s on s.id = d.sucursal_id
  cross join lateral generate_series(
    d.jornada + s.apertura,
    d.jornada + s.cierre + case when s.cierre <= s.apertura then interval '1 day' else interval '0' end - interval '15 minutes',
    interval '15 minutes'
  ) as f
  where s.apertura is not null and s.cierre is not null
),
turnos as (
  select
    a.sucursal_id,
    a.fecha + tt.inicio as ini,
    a.fecha + tt.fin + case when tt.fin <= tt.inicio then interval '1 day' else interval '0' end as fin
  from public.asignaciones a
  join public.turnos_tipo tt on tt.id = a.turno_tipo_id
  join public.semanas w on w.sucursal_id = a.sucursal_id and w.lunes = a.lunes and w.estado = 'publicada'
)
select f.sucursal_id, f.jornada, f.desde as franja_desde, count(t.ini) as personas
from franjas f
left join turnos t on t.sucursal_id = f.sucursal_id and t.ini <= f.desde and t.fin > f.desde
group by f.sucursal_id, f.jornada, f.desde;
comment on view analitica.cobertura is 'Cuántas personas hay en barra en cada franja de 15 minutos del horario del local (semanas publicadas).';

create view analitica.cobertura_dia with (security_invoker = true) as
select
  c.sucursal_id, c.jornada,
  count(*) * 0.25 as horas_abierto,
  count(*) filter (where c.personas = 0) * 0.25 as horas_sin_nadie,
  count(*) filter (where c.personas = 1) * 0.25 as horas_con_una_persona,
  exists (
    select 1 from public.semanas w
    where w.sucursal_id = c.sucursal_id and w.estado = 'publicada'
      and w.lunes = c.jornada - (extract(isodow from c.jornada)::int - 1)
  ) as semana_publicada
from analitica.cobertura c
group by c.sucursal_id, c.jornada;
comment on view analitica.cobertura_dia is 'Por jornada: horas abiertas, horas sin nadie en barra y horas con una sola persona.';

create view analitica.cambios_turno with (security_invoker = true) as
select
  c.sucursal_id, c.fecha, tt.nombre as turno, pp.nombre as pedido_por, pa.nombre as para, pc.nombre as aceptado_por,
  c.estado, c.motivo, c.a_cambio_fecha is not null as es_intercambio,
  c.pedido_en, c.resuelto_en,
  round((extract(epoch from c.resuelto_en - c.pedido_en) / 3600)::numeric, 1) as horas_para_resolver
from public.cambios_turno c
join public.turnos_tipo tt on tt.id = c.turno_tipo_id
join public.personas pp on pp.id = c.pedido_por
left join public.personas pa on pa.id = c.para
left join public.personas pc on pc.id = c.aceptado_por;
comment on view analitica.cambios_turno is 'Pedidos de cubrir o intercambiar turno y cómo terminaron.';

create view analitica.ausencias with (security_invoker = true) as
select
  a.sucursal_id, p.nombre as persona, a.desde, a.hasta, a.hasta - a.desde + 1 as dias,
  a.tipo, a.estado, a.motivo, pr.nombre as resuelta_por, a.pedida_en
from public.ausencias a
join public.personas p on p.id = a.persona_id
left join public.personas pr on pr.id = a.resuelta_por;
comment on view analitica.ausencias is 'Días libres y vacaciones. Un barista solo ve las suyas; encargados ven todas.';

/* ─── Incidencias y bitácora ─── */

create view analitica.incidencias with (security_invoker = true) as
select
  i.sucursal_id,
  public.jornada_de(i.abierta_en, s.zona_horaria, s.corte_jornada) as jornada,
  i.titulo, i.detalle, i.categoria, i.prioridad, i.origen,
  pa.nombre as abierta_por, pr.nombre as responsable, i.abierta_en, i.vence,
  i.cerrada_en, pc.nombre as cerrada_por, i.cierre,
  i.cerrada_en is null as abierta,
  i.cerrada_en is null and i.vence < public.jornada_de(now(), s.zona_horaria, s.corte_jornada) as vencida,
  round((extract(epoch from i.cerrada_en - i.abierta_en) / 3600)::numeric, 1) as horas_para_cerrar,
  (select count(*) from public.incidencia_seguimiento f where f.incidencia_id = i.id) as seguimientos,
  i.id as incidencia_id
from public.incidencias i
join public.sucursales s on s.id = i.sucursal_id
join public.personas pa on pa.id = i.abierta_por
left join public.personas pr on pr.id = i.responsable
left join public.personas pc on pc.id = i.cerrada_por;
comment on view analitica.incidencias is 'Incidencias con su jornada, responsable, si siguen abiertas o vencidas y cuánto tardaron en cerrarse.';

create view analitica.bitacora with (security_invoker = true) as
select b.sucursal_id, b.jornada, b.categoria, b.texto, p.nombre as escrita_por, b.escrita_en, b.fijada
from public.bitacora b
join public.personas p on p.id = b.escrita_por;
comment on view analitica.bitacora is 'Notas del encargado por jornada (turno, equipo, personal, producto, clientes).';

/* ─── Capacitación ─── */

create view analitica.capacitacion with (security_invoker = true) as
select
  p.sucursal_id, p.nombre as persona, p.rol, p.nivel, p.ingreso,
  (select count(*) from public.lecciones_completadas l where l.persona_id = p.id) as lecciones_completadas,
  (select max(completada_en) from public.lecciones_completadas l where l.persona_id = p.id) as ultima_leccion_en,
  (select count(*) from public.repasos r where r.persona_id = p.id) as preguntas_en_repaso,
  (select count(*) from public.repasos r where r.persona_id = p.id and r.proxima < current_date) as repasos_vencidos,
  (select max(nivel) from public.evaluaciones v where v.persona_id = p.id) as nivel_evaluado,
  (select count(*) from public.lecciones_asignadas a where a.persona_id = p.id) as lecciones_reasignadas,
  p.id as persona_id
from public.personas p
where p.activo;
comment on view analitica.capacitacion is 'Avance de capacitación por persona. Cada quien ve el suyo; encargados ven el de todos.';

/* ─── Una fila por día: el tablero para cruzar ─── */

create view analitica.resumen_dia with (security_invoker = true) as
select
  d.sucursal_id, d.jornada, d.dia_nombre, d.fin_de_semana,
  (select count(*) from analitica.checklists c where c.sucursal_id = d.sucursal_id and c.jornada = d.jornada) as checklists_tocaban,
  (select count(*) from analitica.checklists c where c.sucursal_id = d.sucursal_id and c.jornada = d.jornada and c.estado = 'a_tiempo') as checklists_a_tiempo,
  (select count(*) from analitica.checklists c where c.sucursal_id = d.sucursal_id and c.jornada = d.jornada and c.estado = 'no_se_hizo') as checklists_no_hechos,
  (select count(*) from public.marcas m join public.ejecuciones e on e.id = m.ejecucion_id
    where e.sucursal_id = d.sucursal_id and e.jornada = d.jornada and m.fuera_de_rango) as lecturas_fuera_de_rango,
  (select count(*) from analitica.incidencias i where i.sucursal_id = d.sucursal_id and i.jornada = d.jornada) as incidencias_nuevas,
  (select count(*) from public.sesiones_calibracion s where s.sucursal_id = d.sucursal_id and s.jornada = d.jornada) as calibraciones,
  (select count(*) from public.shots sh join public.sesiones_calibracion s on s.id = sh.sesion_id
    where s.sucursal_id = d.sucursal_id and s.jornada = d.jornada) as shots,
  (select count(distinct t.persona_id) from analitica.turnos t where t.sucursal_id = d.sucursal_id and t.fecha = d.jornada and t.publicada) as personas_en_turno,
  (select sum(t.horas) from analitica.turnos t where t.sucursal_id = d.sucursal_id and t.fecha = d.jornada and t.publicada) as horas_programadas,
  (select c.horas_sin_nadie from analitica.cobertura_dia c where c.sucursal_id = d.sucursal_id and c.jornada = d.jornada) as horas_sin_nadie,
  (select count(*) from public.bitacora b where b.sucursal_id = d.sucursal_id and b.jornada = d.jornada) as notas_bitacora
from analitica.dias d;
comment on view analitica.resumen_dia is 'Una fila por jornada con lo esencial de la operación. Es la tabla para cruzar días contra cualquier otra cosa (ventas, clima, personas).';

/* ─── Glosario de Ryo ─── */

create table analitica.glosario (
  palabra text primary key,
  que_es text not null,
  ejemplo text
);
comment on table analitica.glosario is 'Qué significa cada palabra de la barra (molienda, dosis, canastilla, pulsos…). El mismo glosario "¿Qué es?" de la app.';

/* ─── Métricas: definidas una sola vez ─── */

create table analitica.metricas (
  id text primary key,
  nombre text not null,
  que_mide text not null,
  unidad text not null,
  mejor text not null check (mejor in ('arriba', 'abajo')),
  umbral numeric not null default 0,
  como_se_calcula text not null,
  sql text not null
);
comment on table analitica.metricas is 'Cada indicador con una sola definición: el Panel y la IA usan esta. sql recibe $1 sucursal, $2 desde y $3 hasta (jornadas, inclusivas).';
comment on column analitica.metricas.mejor is 'arriba si más es mejor; abajo si menos es mejor.';
comment on column analitica.metricas.umbral is 'Diferencia por debajo de la cual se considera "sin cambio".';

insert into analitica.metricas (id, nombre, que_mide, unidad, mejor, umbral, como_se_calcula, sql) values
('checklists-a-tiempo', 'Checklists a tiempo', 'De los checklists que tocaban, cuántos se completaron antes de su hora límite.', '%', 'arriba', 3,
 'a_tiempo ÷ (todos menos los pendientes de hoy) en analitica.checklists.',
 $q$select round(100.0 * count(*) filter (where estado = 'a_tiempo') / nullif(count(*) filter (where estado <> 'pendiente'), 0), 1) from analitica.checklists where sucursal_id = $1 and jornada between $2 and $3$q$),
('horas-para-validar', 'Horas para validar', 'Cuánto tarda un checklist completado en ser validado por un encargado.', 'h', 'abajo', 0.5,
 'Promedio de horas_para_validar en analitica.checklists.',
 $q$select round(avg(horas_para_validar), 2) from analitica.checklists where sucursal_id = $1 and jornada between $2 and $3$q$),
('incidencias-nuevas', 'Incidencias nuevas', 'Lecturas fuera de rango y reportes que se abrieron.', 'incidencias', 'abajo', 1,
 'Cuenta de analitica.incidencias por jornada de apertura.',
 $q$select count(*) from analitica.incidencias where sucursal_id = $1 and jornada between $2 and $3$q$),
('shots-por-receta', 'Shots por receta', 'Cuántos shots cuesta llegar a la receta aprobada.', 'shots', 'abajo', 0.3,
 'Promedio de shots en analitica.calibraciones aprobadas.',
 $q$select round(avg(shots), 1) from analitica.calibraciones where sucursal_id = $1 and jornada between $2 and $3 and aprobada$q$),
('horas-sin-nadie', 'Horas sin nadie en barra', 'Horas del horario del local sin nadie programado (semanas publicadas).', 'h', 'abajo', 0.5,
 'Suma de horas_sin_nadie en analitica.cobertura_dia.',
 $q$select coalesce(sum(horas_sin_nadie), 0) from analitica.cobertura_dia where sucursal_id = $1 and jornada between $2 and $3 and semana_publicada$q$),
('repasos-al-dia', 'Repasos al día', 'Preguntas de capacitación de los baristas activos que no están vencidas al final del periodo.', '%', 'arriba', 3,
 'Repasos con proxima ≥ hasta ÷ todos los repasos de baristas activos.',
 $q$select round(100.0 * count(*) filter (where r.proxima >= $3) / nullif(count(*), 0), 1) from public.repasos r join public.personas p on p.id = r.persona_id where r.sucursal_id = $1 and p.activo and p.rol = 'barista' and $2 <= $3$q$),
('lecturas-fuera-de-rango', 'Lecturas fuera de rango', 'Lecturas de checklist (temperaturas, etc.) que quedaron fuera de su rango.', 'lecturas', 'abajo', 1,
 'Cuenta de analitica.marcas con fuera_de_rango.',
 $q$select count(*) from analitica.marcas where sucursal_id = $1 and jornada between $2 and $3 and fuera_de_rango$q$),
('minutos-de-calibracion', 'Minutos de calibración', 'Cuánto tarda una calibración de principio a fin.', 'min', 'abajo', 2,
 'Promedio de minutos en analitica.calibraciones aprobadas.',
 $q$select round(avg(minutos), 1) from analitica.calibraciones where sucursal_id = $1 and jornada between $2 and $3 and aprobada$q$),
('shots-en-ventana', 'Shots en ventana', 'Shots de calibración que cayeron dentro del tiempo y ratio objetivo del café.', '%', 'arriba', 5,
 'en_ventana ÷ todos en analitica.shots.',
 $q$select round(100.0 * count(*) filter (where en_ventana) / nullif(count(*), 0), 1) from analitica.shots where sucursal_id = $1 and jornada between $2 and $3$q$);

create or replace function analitica.metrica(metrica_id text, sucursal text, desde date, hasta date)
returns numeric
language plpgsql stable
set search_path = ''
as $$
declare
  consulta text;
  valor numeric;
begin
  select m.sql into consulta from analitica.metricas m where m.id = metrica_id;
  if consulta is null then raise exception 'No existe la métrica %', metrica_id; end if;
  execute consulta into valor using sucursal, desde, hasta;
  return valor;
end;
$$;
comment on function analitica.metrica(text, text, date, date) is 'Valor de una métrica para una sucursal entre dos jornadas (inclusivas).';

/* ─── Lo que llama la app o la IA (en public para que la API lo vea) ─── */

create or replace function public.metricas_periodo(sucursal text, desde date, hasta date)
returns jsonb
language sql stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id, 'nombre', m.nombre, 'que_mide', m.que_mide, 'unidad', m.unidad, 'mejor', m.mejor, 'umbral', m.umbral,
    'valor', analitica.metrica(m.id, sucursal, desde, hasta),
    'periodo_anterior', analitica.metrica(m.id, sucursal, desde - (hasta - desde + 1), desde - 1)
  ) order by m.id), '[]'::jsonb)
  from analitica.metricas m
$$;
comment on function public.metricas_periodo(text, date, date) is 'Todas las métricas de un periodo y del periodo anterior de la misma duración, para comparar.';

create or replace function public.describir_datos()
returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object(
    'como_leer', 'Consulta las vistas de analitica (ya unidas y con nombres). Fechas de negocio = jornada (hora de Durango, corte 5:00). Unidades en el nombre de la columna. Métricas: usa public.metricas_periodo o analitica.metrica en vez de recalcularlas.',
    'vistas', (
      select jsonb_agg(jsonb_build_object(
        'nombre', 'analitica.' || c.relname,
        'que_es', obj_description(c.oid, 'pg_class'),
        'columnas', (
          select jsonb_agg(jsonb_build_object(
            'columna', a.attname,
            'tipo', format_type(a.atttypid, a.atttypmod),
            'que_es', col_description(c.oid, a.attnum)
          ) order by a.attnum)
          from pg_catalog.pg_attribute a
          where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
        )
      ) order by c.relname)
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'analitica' and c.relkind = 'v'
    ),
    'metricas', (select jsonb_agg(jsonb_build_object('id', id, 'nombre', nombre, 'que_mide', que_mide, 'unidad', unidad, 'mejor', mejor) order by id) from analitica.metricas),
    'glosario', (select jsonb_agg(jsonb_build_object('palabra', palabra, 'que_es', que_es) order by palabra) from analitica.glosario)
  )
$$;
comment on function public.describir_datos() is 'Mapa de los datos para un agente: vistas de analitica con sus columnas y comentarios, métricas y glosario. Es la primera herramienta que debe llamar.';

create or replace function public.consultar_analitica(consulta text, limite integer default 200)
returns jsonb
language plpgsql stable
set search_path = analitica, public
as $$
declare
  resultado jsonb;
begin
  if consulta !~* '^\s*(select|with)\s' then
    raise exception 'Solo consultas de lectura (SELECT o WITH).';
  end if;
  if consulta ~ ';\s*\S' then
    raise exception 'Una sola consulta, sin punto y coma en medio.';
  end if;
  -- stable: Postgres no deja que una función stable modifique datos. Las
  -- reglas RLS aplican con los permisos de quien pregunta.
  execute format(
    'select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from (%s) as q limit %s) as t',
    regexp_replace(consulta, ';\s*$', ''), least(greatest(limite, 1), 1000)
  ) into resultado;
  return resultado;
end;
$$;
comment on function public.consultar_analitica(text, integer) is 'Ejecuta una consulta SELECT de solo lectura (pensada para las vistas de analitica) con los permisos de quien pregunta y devuelve hasta "limite" filas en JSON. Para el chat de IA.';

/* ─── Permisos ─── */

grant usage on schema analitica to authenticated;
grant select on all tables in schema analitica to authenticated;
grant execute on function analitica.metrica(text, text, date, date) to authenticated;
grant execute on function public.metricas_periodo(text, date, date), public.describir_datos(), public.consultar_analitica(text, integer) to authenticated;
revoke execute on function public.metricas_periodo(text, date, date), public.describir_datos(), public.consultar_analitica(text, integer) from anon, public;
alter table analitica.glosario enable row level security;
create policy "todos leen" on analitica.glosario for select to authenticated using (true);
alter table analitica.metricas enable row level security;
create policy "todos leen" on analitica.metricas for select to authenticated using (true);
