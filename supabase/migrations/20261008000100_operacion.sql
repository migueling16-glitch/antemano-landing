-- ═══════════════════════════════════════════════════════════════════
-- Ryo Café · App de barra · 1. Operación
--
-- Las tablas que escribe la app. Pensadas para que las lea una persona o
-- un agente de IA sin adivinar:
--   · nombres en español y unidades en el nombre (dosis_g, tiempo_s, temp_c)
--   · un comentario en cada tabla y columna (es lo primero que lee un agente)
--   · valores cerrados con CHECK y su significado en el comentario
--   · cada registro lleva sucursal_id y, cuando aplica, su jornada: el día de
--     negocio en hora de Durango, que corta a las 5:00 (el cierre de las
--     0:30 cuenta como el día anterior)
--   · horas en timestamptz (UTC); "no se sabe" es NULL, nunca 0
--   · los id son texto: los genera el teléfono (así funciona sin red y un
--     reintento no duplica)
-- ═══════════════════════════════════════════════════════════════════

create schema if not exists extensions;

/* ─── Utilidades ─── */

create or replace function public.jornada_de(
  momento timestamptz,
  zona text default 'America/Monterrey',
  corte time default '05:00'
) returns date
language sql stable
set search_path = ''
as $$
  select ((momento at time zone zona) - corte)::date
$$;
comment on function public.jornada_de(timestamptz, text, time) is
  'Día de negocio de un momento: la fecha en la zona de la sucursal restando la hora de corte (5:00). Un cierre a las 0:30 del sábado es jornada del viernes.';

create or replace function public.tocar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  new.actualizado_por := auth.uid();
  return new;
end;
$$;
comment on function public.tocar() is 'Marca cuándo y quién cambió una fila (actualizado_en, actualizado_por).';

/* ─── Negocio y sucursal ─── */

create table public.negocios (
  id text primary key,
  nombre text not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid()
);
comment on table public.negocios is 'El negocio (marca). Arriba de las sucursales: la puerta abierta para varios negocios sin construir el multi-cliente todavía.';

create table public.sucursales (
  id text primary key,
  negocio_id text not null references public.negocios (id),
  nombre text not null,
  zona_horaria text not null default 'America/Monterrey',
  corte_jornada time not null default '05:00',
  apertura time,
  cierre time,
  inicio_operacion date not null default current_date,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid()
);
comment on table public.sucursales is 'Cada barra. Casi todo en la base cuelga de una sucursal y solo lo ven sus miembros.';
comment on column public.sucursales.zona_horaria is 'Zona IANA. Durango: America/Monterrey (UTC−6, sin horario de verano).';
comment on column public.sucursales.corte_jornada is 'Hora a la que cambia el día de negocio. Antes de esta hora, un momento cuenta como del día anterior.';
comment on column public.sucursales.apertura is 'Hora a la que abre al público (hora local).';
comment on column public.sucursales.cierre is 'Hora a la que cierra al público (hora local). Si es menor que apertura, cierra después de medianoche.';
comment on column public.sucursales.inicio_operacion is 'Primer día con datos reales: desde aquí se cuentan los checklists que tocaban.';

/* ─── Personas ─── */

create table public.personas (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  auth_id uuid unique references auth.users (id) on delete set null,
  nombre text not null,
  iniciales text not null,
  correo text not null check (correo = lower(correo)),
  rol text not null check (rol in ('admin', 'encargado', 'barista')),
  nivel smallint not null default 1 check (nivel between 1 and 3),
  activo boolean not null default true,
  ingreso date not null default current_date,
  invitado boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  unique (sucursal_id, correo)
);
comment on table public.personas is 'El equipo de la sucursal. Solo entra quien tiene una fila aquí: la cuenta de acceso (auth_id) se vincula sola por correo al aceptar la invitación.';
comment on column public.personas.auth_id is 'Cuenta de Supabase Auth. NULL mientras no acepta la invitación.';
comment on column public.personas.rol is 'admin: todo, incluido el equipo · encargado: valida, aprueba, arma horarios · barista: opera la barra.';
comment on column public.personas.nivel is 'Nivel de barista: 1 opera con la receta de la casa · 2 calibra solo · 3 perfila cafés y enseña.';
comment on column public.personas.activo is 'false = dado de baja: pierde el acceso al momento, pero su historia se queda.';
comment on column public.personas.ingreso is 'Fecha de ingreso: define su ruta de capacitación.';
comment on column public.personas.invitado is 'true = invitado y todavía sin entrar por primera vez.';

/* ─── Checklists ─── */

create table public.plantillas (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  orden smallint not null default 0,
  nombre text not null,
  descripcion text not null default '',
  frecuencia text not null check (frecuencia in ('diaria', 'semanal')),
  dia_semana smallint check (dia_semana between 0 and 6),
  hora_limite time not null,
  activa boolean not null default true,
  vigente_desde date not null default current_date,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  check (frecuencia = 'diaria' or dia_semana is not null)
);
comment on table public.plantillas is 'Los checklists de la barra (apertura, cierre, limpieza profunda): qué se revisa y para cuándo.';
comment on column public.plantillas.dia_semana is 'Solo semanales: 0 = domingo … 6 = sábado.';
comment on column public.plantillas.hora_limite is 'Hora local. Completado después = tarde. Si es antes del corte de jornada (5:00), es de la madrugada siguiente.';
comment on column public.plantillas.vigente_desde is 'Desde qué jornada cuenta para cumplimiento.';

create table public.plantilla_items (
  plantilla_id text not null references public.plantillas (id) on delete cascade,
  id text not null,
  sucursal_id text not null references public.sucursales (id),
  orden smallint not null default 0,
  seccion text not null,
  texto text not null,
  tipo text not null check (tipo in ('check', 'numero', 'foto', 'nota', 'calibracion')),
  critica boolean not null default false,
  minimo numeric,
  maximo numeric,
  unidad text,
  paso numeric,
  inicial numeric,
  foto text check (foto in ('opcional', 'obligatoria')),
  retirado boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  primary key (plantilla_id, id)
);
comment on table public.plantilla_items is 'Cada tarea de un checklist. No se borran: se retiran (retirado = true) para que la historia conserve su texto.';
comment on column public.plantilla_items.tipo is 'check: se palomea · numero: lectura con rango (minimo–maximo, en unidad) · foto: evidencia · nota: texto libre · calibracion: liga a la calibración del día.';
comment on column public.plantilla_items.critica is 'Seguridad, inocuidad o dinero: en el papel va en letra recta.';
comment on column public.plantilla_items.foto is 'Botón de evidencia en la tarea: opcional u obligatoria. NULL = sin foto.';

create table public.ejecuciones (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  plantilla_id text not null references public.plantillas (id),
  jornada date not null,
  iniciada_por text not null references public.personas (id),
  iniciada_en timestamptz not null,
  completada_por text references public.personas (id),
  completada_en timestamptz,
  validada_por text references public.personas (id),
  validada_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid()
);
comment on table public.ejecuciones is 'Un checklist hecho en una jornada. El id es "ej-<plantilla>-<jornada>": si dos teléfonos lo empiezan sin red, al sincronizar es el mismo.';
comment on column public.ejecuciones.validada_por is 'Encargado o admin que lo revisó. Solo ellos pueden validar.';

create table public.marcas (
  ejecucion_id text not null references public.ejecuciones (id) on delete cascade,
  item_id text not null,
  sucursal_id text not null references public.sucursales (id),
  marcada_por text not null references public.personas (id),
  marcada_en timestamptz not null,
  valor numeric,
  texto text,
  foto_id text,
  fuera_de_rango boolean not null default false,
  acciones text[],
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  primary key (ejecucion_id, item_id)
);
comment on table public.marcas is 'Cada tarea palomeada, cada lectura y cada nota de un checklist. La tarea es plantilla_items (plantilla de la ejecución + item_id).';
comment on column public.marcas.valor is 'Lectura numérica (tareas tipo numero), en la unidad de la tarea.';
comment on column public.marcas.texto is 'Nota escrita (tareas tipo nota).';
comment on column public.marcas.fuera_de_rango is 'La lectura quedó fuera de minimo–maximo. Abre una incidencia sola.';
comment on column public.marcas.acciones is 'Lo que se hizo al ver la lectura fuera de rango.';

create table public.fotos (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  tomada_por text not null references public.personas (id),
  tomada_en timestamptz not null,
  bytes integer not null,
  bytes_original integer not null,
  estado text not null default 'pendiente' check (estado in ('subida', 'pendiente')),
  ruta text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid()
);
comment on table public.fotos is 'Evidencias. El archivo vive en Storage (bucket evidencias, ruta "<sucursal>/<id>.jpg"); aquí, quién, cuándo y cuánto pesa.';
comment on column public.fotos.estado is 'pendiente: sigue en el teléfono (sin red) · subida: ya está en Storage.';

/* ─── Equipo y café ─── */

create table public.equipos (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  orden smallint not null default 0,
  nombre text not null,
  tipo text not null check (tipo in ('molino', 'maquina')),
  paso_molienda numeric,
  uso text check (uso in ('espresso', 'filtrados')),
  modelo text,
  detalle text,
  pid_c numeric,
  g_por_pulso numeric,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid()
);
comment on table public.equipos is 'Molinos y máquina de espresso. En Ryo: La Marzocco Linea Classic AV de 1 grupo, volumétrica (corta por pulsos del flujómetro).';
comment on column public.equipos.paso_molienda is 'Molinos: cuánto se mueve el número de molienda en un paso.';
comment on column public.equipos.uso is 'Molinos: espresso o filtrados (los de filtrados no aparecen al calibrar).';
comment on column public.equipos.pid_c is 'Máquina: temperatura de la caldera de café en °C (una sola para todos los cafés).';
comment on column public.equipos.g_por_pulso is 'Máquina: gramos en taza que mueve un pulso. Se aprende de los shots.';

create table public.botones (
  equipo_id text not null references public.equipos (id) on delete cascade,
  id text not null,
  sucursal_id text not null references public.sucursales (id),
  orden smallint not null default 0,
  nombre text not null,
  pulsos integer,
  programado_g numeric,
  programado_en timestamptz,
  programado_por text references public.personas (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  primary key (equipo_id, id)
);
comment on table public.botones is 'Los botones volumétricos de la máquina. Cada uno corta al llegar a sus pulsos.';
comment on column public.botones.pulsos is 'Pulsos programados: giros del flujómetro (agua que entra al grupo, no bebida en taza).';
comment on column public.botones.programado_g is 'Gramos en taza que entregó la última vez que se midió en báscula.';

create table public.canastillas (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  equipo_id text references public.equipos (id) on delete cascade,
  orden smallint not null default 0,
  nombre text not null,
  capacidad_g numeric not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid()
);
comment on table public.canastillas is 'Canastillas del portafiltro. La dosis debe quedar a ±1 g de su capacidad.';

create table public.cafes (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  orden smallint not null default 0,
  nombre text not null,
  origen text not null default '',
  proceso text not null default '',
  tostador text not null default '',
  tueste date,
  activo boolean not null default true,
  notas text not null default '',
  es_casa boolean not null default false,
  boton_id text,
  canastilla_id text references public.canastillas (id),
  objetivo_dosis_g numeric not null,
  objetivo_rendimiento_g numeric not null,
  objetivo_tiempo_s numeric not null,
  tolerancia_tiempo_s numeric not null,
  tolerancia_ratio numeric not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid()
);
comment on table public.cafes is 'Cafés para espresso. En Ryo: blend de la casa y descafeinado.';
comment on column public.cafes.tueste is 'Fecha de tueste del lote en uso. El lote de cada calibración queda en sesiones_calibracion.tueste.';
comment on column public.cafes.es_casa is 'El espresso de la casa: el que llevan las bebidas del menú.';
comment on column public.cafes.boton_id is 'Botón de la máquina con el que se sirve (id en botones), o "continuo".';
comment on column public.cafes.tolerancia_tiempo_s is '± segundos aceptados alrededor de objetivo_tiempo_s.';
comment on column public.cafes.tolerancia_ratio is '± fracción aceptada del ratio objetivo (0.05 = 5 %).';

/* ─── Calibración ─── */

create table public.sesiones_calibracion (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  cafe_id text not null references public.cafes (id),
  molino_id text not null references public.equipos (id),
  boton_id text not null,
  canastilla_id text references public.canastillas (id),
  calibrada_por text not null references public.personas (id),
  jornada date not null,
  dias_reposo integer not null,
  tueste date generated always as (jornada - dias_reposo) stored,
  inicio timestamptz not null,
  fin timestamptz,
  shot_aprobado_id text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid()
);
comment on table public.sesiones_calibracion is 'Una calibración de espresso: los shots hasta llegar a la receta del día de un café.';
comment on column public.sesiones_calibracion.dias_reposo is 'Días desde el tueste del lote. El reposo mueve la molienda: es la variable más útil para cruzar.';
comment on column public.sesiones_calibracion.tueste is 'Fecha de tueste del lote calibrado (jornada − dias_reposo). Identifica el lote.';
comment on column public.sesiones_calibracion.boton_id is 'Botón usado (id en botones) o "continuo".';

create table public.shots (
  id text primary key,
  sesion_id text not null references public.sesiones_calibracion (id) on delete cascade,
  sucursal_id text not null references public.sucursales (id),
  numero integer not null,
  dosis_g numeric not null,
  rendimiento_g numeric not null,
  ratio numeric generated always as (round(rendimiento_g / nullif(dosis_g, 0), 3)) stored,
  tiempo_s numeric not null,
  molienda numeric not null,
  pulsos integer,
  previsto_tiempo_s numeric,
  previsto_rendimiento_g numeric,
  sabor_acidez numeric check (sabor_acidez between -1 and 1),
  sabor_intensidad numeric check (sabor_intensidad between -1 and 1),
  aprobado boolean not null default false,
  hecho_en timestamptz not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid()
);
comment on table public.shots is 'Cada shot de una calibración, con lo que se midió y cómo supo.';
comment on column public.shots.ratio is 'rendimiento_g / dosis_g (1:2 = 2.0).';
comment on column public.shots.pulsos is 'Pulsos que tenía el botón en ese shot. NULL con botón continuo.';
comment on column public.shots.previsto_tiempo_s is 'Lo que el modelo de calibración esperaba; comparar con tiempo_s mide qué tan bien predice.';
comment on column public.shots.sabor_acidez is 'Brújula de sabor, eje x: −1 ácido/subextraído … +1 amargo/sobreextraído. 0 = balanceado.';
comment on column public.shots.sabor_intensidad is 'Brújula de sabor, eje y: −1 débil … +1 intenso.';
comment on column public.shots.aprobado is 'Es el shot que quedó como receta del día.';

create table public.recetas_del_dia (
  sucursal_id text not null references public.sucursales (id),
  jornada date not null,
  cafe_id text not null references public.cafes (id),
  sesion_id text not null references public.sesiones_calibracion (id) on delete cascade,
  shot_id text not null,
  aprobada_por text not null references public.personas (id),
  aprobada_en timestamptz not null,
  boton_id text not null,
  canastilla_id text,
  dosis_g numeric not null,
  rendimiento_g numeric not null,
  tiempo_s numeric not null,
  molienda numeric not null,
  pulsos integer,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  primary key (sucursal_id, jornada, cafe_id)
);
comment on table public.recetas_del_dia is 'La receta de espresso aprobada de cada café en cada jornada: la que sigue toda la barra ese día.';

/* ─── Horarios ─── */

create table public.turnos_tipo (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  orden smallint not null default 0,
  nombre text not null,
  corto text not null,
  inicio time not null,
  fin time not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid()
);
comment on table public.turnos_tipo is 'Los turnos de la barra (apertura, intermedio, cierre…). Si fin < inicio, termina después de medianoche.';

create table public.semanas (
  sucursal_id text not null references public.sucursales (id),
  lunes date not null check (extract(isodow from lunes) = 1),
  estado text not null default 'borrador' check (estado in ('borrador', 'publicada')),
  publicada_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  primary key (sucursal_id, lunes)
);
comment on table public.semanas is 'La semana de horarios. borrador: solo la ve el encargado · publicada: la ve el equipo.';

create table public.asignaciones (
  sucursal_id text not null references public.sucursales (id),
  persona_id text not null references public.personas (id),
  fecha date not null,
  lunes date not null,
  turno_tipo_id text not null references public.turnos_tipo (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  primary key (sucursal_id, persona_id, fecha),
  foreign key (sucursal_id, lunes) references public.semanas (sucursal_id, lunes) on delete cascade
);
comment on table public.asignaciones is 'Quién trabaja qué turno qué día. Una persona, un turno por día.';
comment on column public.asignaciones.lunes is 'Semana a la que pertenece (su lunes).';

create table public.disponibilidad (
  sucursal_id text not null references public.sucursales (id),
  persona_id text not null references public.personas (id),
  dia_semana smallint not null check (dia_semana between 0 and 6),
  franjas text[] not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  primary key (persona_id, dia_semana),
  check (franjas <@ array['manana', 'tarde', 'noche'])
);
comment on table public.disponibilidad is 'En qué franjas SÍ puede trabajar cada persona cada día (0 = domingo). Sin fila = puede en todas; arreglo vacío = ese día no puede.';
comment on column public.disponibilidad.franjas is 'Subconjunto de manana, tarde y noche.';

create table public.cambios_turno (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  pedido_por text not null references public.personas (id),
  fecha date not null,
  turno_tipo_id text not null references public.turnos_tipo (id),
  motivo text not null default '',
  para text references public.personas (id),
  a_cambio_fecha date,
  a_cambio_turno_tipo_id text references public.turnos_tipo (id),
  aceptado_por text references public.personas (id),
  estado text not null default 'abierto'
    check (estado in ('abierto', 'aceptado', 'aprobado', 'rechazado', 'declinado', 'retirado')),
  pedido_en timestamptz not null,
  aceptado_en timestamptz,
  resuelto_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid()
);
comment on table public.cambios_turno is 'Pedir que alguien cubra un turno o intercambiarlo. Camino: abierto → aceptado → aprobado (por el encargado).';
comment on column public.cambios_turno.para is 'A quién se le pidió. NULL = lo ve todo el equipo y lo toma el primero que acepte.';
comment on column public.cambios_turno.a_cambio_fecha is 'Si es intercambio: el turno de "para" con el que se queda quien pidió.';
comment on column public.cambios_turno.estado is 'abierto · aceptado (alguien lo toma) · aprobado/rechazado (encargado) · declinado (la persona a la que se le pidió no puede) · retirado (quien pidió se echó para atrás).';

create table public.ausencias (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  persona_id text not null references public.personas (id),
  desde date not null,
  hasta date not null,
  tipo text not null check (tipo in ('dia-libre', 'vacaciones')),
  motivo text not null default '',
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  pedida_en timestamptz not null,
  resuelta_por text references public.personas (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  check (hasta >= desde)
);
comment on table public.ausencias is 'Días libres y vacaciones. Las pide la persona y las aprueba el encargado. El motivo solo lo ven la persona y encargados.';

/* ─── Incidencias, bitácora y avisos ─── */

create table public.incidencias (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  titulo text not null,
  detalle text,
  origen text not null check (origen in ('lectura', 'reporte')),
  categoria text not null check (categoria in ('equipo', 'inocuidad', 'producto', 'limpieza', 'personal', 'otro')),
  prioridad text not null check (prioridad in ('alta', 'normal')),
  ejecucion_id text references public.ejecuciones (id) on delete set null,
  item_id text,
  abierta_por text not null references public.personas (id),
  abierta_en timestamptz not null,
  responsable text references public.personas (id),
  vence date,
  cerrada_por text references public.personas (id),
  cerrada_en timestamptz,
  cierre text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  check (cerrada_en is null or cierre is not null)
);
comment on table public.incidencias is 'Algo que hay que resolver: una lectura fuera de rango (se abre sola) o un reporte. No se cierra sin decir qué se hizo.';
comment on column public.incidencias.origen is 'lectura: la abrió una lectura fuera de rango de un checklist (ejecucion_id + item_id) · reporte: la abrió una persona.';
comment on column public.incidencias.cierre is 'Qué se hizo para resolverla. Obligatorio al cerrar.';

create table public.incidencia_seguimiento (
  incidencia_id text not null references public.incidencias (id) on delete cascade,
  numero integer not null,
  sucursal_id text not null references public.sucursales (id),
  escrito_por text not null references public.personas (id),
  escrito_en timestamptz not null,
  texto text not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  primary key (incidencia_id, numero)
);
comment on table public.incidencia_seguimiento is 'Comentarios de seguimiento de una incidencia, en orden.';

create table public.bitacora (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  jornada date not null,
  categoria text not null check (categoria in ('turno', 'equipo', 'personal', 'producto', 'clientes', 'otro')),
  texto text not null,
  escrita_por text not null references public.personas (id),
  escrita_en timestamptz not null,
  fijada boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid()
);
comment on table public.bitacora is 'Notas del encargado por jornada para pasarse el turno. fijada = sigue visible los días siguientes.';

create table public.notificaciones (
  id text primary key,
  sucursal_id text not null references public.sucursales (id),
  para text not null,
  de text references public.personas (id),
  texto text not null,
  ruta text,
  enviada_en timestamptz not null,
  leida_por text[] not null default '{}',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid()
);
comment on table public.notificaciones is 'Avisos de la bandeja de Inicio.';
comment on column public.notificaciones.para is 'id de una persona, "todos" o "encargados" (encargado y admin). Quien lo generó no lo recibe.';
comment on column public.notificaciones.ruta is 'Pantalla de la app a la que lleva (ej. "#/horarios/cambios").';

/* ─── Capacitación ─── */

create table public.lecciones_completadas (
  persona_id text not null references public.personas (id),
  leccion_id text not null,
  sucursal_id text not null references public.sucursales (id),
  completada_en timestamptz not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  primary key (persona_id, leccion_id)
);
comment on table public.lecciones_completadas is 'Lecciones de capacitación que cada persona terminó. El contenido de las lecciones vive en la app (contenido.ts).';

create table public.repasos (
  persona_id text not null references public.personas (id),
  pregunta_id text not null,
  sucursal_id text not null references public.sucursales (id),
  intervalo smallint not null check (intervalo between 0 and 4),
  proxima date not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  primary key (persona_id, pregunta_id)
);
comment on table public.repasos is 'Repetición espaciada: cuándo le toca a cada persona repasar cada pregunta.';
comment on column public.repasos.intervalo is 'Escalón de repaso: 0 = mañana, 1 = 3 días, 2 = 7, 3 = 14, 4 = 30. Un error regresa a 0.';
comment on column public.repasos.proxima is 'Jornada en que toca. Vencida si es anterior a hoy.';

create table public.evaluaciones (
  persona_id text not null references public.personas (id),
  nivel smallint not null check (nivel between 1 and 3),
  sucursal_id text not null references public.sucursales (id),
  firmada_por text not null references public.personas (id),
  firmada_en timestamptz not null,
  criterios boolean[] not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  primary key (persona_id, nivel)
);
comment on table public.evaluaciones is 'Evaluación práctica de nivel, firmada por un encargado. criterios = cada punto de la rúbrica, cumplido o no.';

create table public.lecciones_asignadas (
  persona_id text not null references public.personas (id),
  numero integer not null,
  sucursal_id text not null references public.sucursales (id),
  leccion_id text not null,
  asignada_por text not null references public.personas (id),
  asignada_en timestamptz not null,
  motivo text not null default '',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  primary key (persona_id, numero)
);
comment on table public.lecciones_asignadas is 'Lecciones que un encargado volvió a asignar (reentrenamiento), con el motivo.';

/* ─── Índices: por sucursal y jornada, que es como se consulta casi todo ─── */

create index on public.personas (sucursal_id);
create index on public.plantillas (sucursal_id);
create index on public.plantilla_items (sucursal_id);
create index on public.ejecuciones (sucursal_id, jornada);
create index on public.ejecuciones (plantilla_id);
create index on public.marcas (sucursal_id);
create index on public.fotos (sucursal_id);
create index on public.equipos (sucursal_id);
create index on public.botones (sucursal_id);
create index on public.canastillas (sucursal_id);
create index on public.cafes (sucursal_id);
create index on public.sesiones_calibracion (sucursal_id, jornada);
create index on public.sesiones_calibracion (cafe_id);
create index on public.shots (sesion_id);
create index on public.shots (sucursal_id);
create index on public.turnos_tipo (sucursal_id);
create index on public.asignaciones (sucursal_id, fecha);
create index on public.disponibilidad (sucursal_id);
create index on public.cambios_turno (sucursal_id, fecha);
create index on public.ausencias (sucursal_id, persona_id);
create index on public.incidencias (sucursal_id, abierta_en);
create index on public.incidencia_seguimiento (sucursal_id);
create index on public.bitacora (sucursal_id, jornada);
create index on public.notificaciones (sucursal_id, enviada_en);
create index on public.lecciones_completadas (sucursal_id);
create index on public.repasos (sucursal_id);
create index on public.evaluaciones (sucursal_id);
create index on public.lecciones_asignadas (sucursal_id);

/* ─── actualizado_en / actualizado_por en cada cambio ─── */

do $$
declare t text;
begin
  foreach t in array array[
    'negocios', 'sucursales', 'personas', 'plantillas', 'plantilla_items', 'ejecuciones', 'marcas', 'fotos',
    'equipos', 'botones', 'canastillas', 'cafes', 'sesiones_calibracion', 'shots', 'recetas_del_dia',
    'turnos_tipo', 'semanas', 'asignaciones', 'disponibilidad', 'cambios_turno', 'ausencias',
    'incidencias', 'incidencia_seguimiento', 'bitacora', 'notificaciones',
    'lecciones_completadas', 'repasos', 'evaluaciones', 'lecciones_asignadas'
  ] loop
    execute format('create trigger tocar before update on public.%I for each row execute function public.tocar()', t);
    execute format('comment on column public.%I.actualizado_por is %L', t, 'Cuenta (auth.uid) que hizo el último cambio.');
  end loop;
end $$;
