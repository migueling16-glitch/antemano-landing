-- Generado por scripts/ryo-semilla-sql.mjs el 2026-10-08. No editar a mano: cambia la app y vuelve a generar.
-- Se puede correr varias veces: lo que ya existe no se toca.
begin;

-- Negocio y sucursal
insert into public.negocios (id, nombre) values ('ryo-cafe', 'Ryo Café') on conflict do nothing;
insert into public.sucursales (id, negocio_id, nombre, apertura, cierre) values ('dgo', 'ryo-cafe', 'Barra Durango', '08:00', '22:00') on conflict do nothing;

-- plantillas
insert into public.plantillas (id, sucursal_id, orden, nombre, descripcion, frecuencia, dia_semana, hora_limite, activa) values ('p-apertura', 'dgo', 0, 'Apertura', 'Agua, máquina, luces, salón, baños y producto.', 'diaria', null, '08:00', true) on conflict do nothing;
insert into public.plantillas (id, sucursal_id, orden, nombre, descripcion, frecuencia, dia_semana, hora_limite, activa) values ('p-cierre', 'dgo', 1, 'Cierre', 'Barra, máquina, tarja, loza, remojos y desconectar.', 'diaria', null, '23:30', true) on conflict do nothing;
insert into public.plantillas (id, sucursal_id, orden, nombre, descripcion, frecuencia, dia_semana, hora_limite, activa) values ('p-profunda', 'dgo', 2, 'Limpieza profunda', 'Semanal · lo que no va en el checklist diario', 'semanal', 6, '23:30', true) on conflict do nothing;

-- plantilla_items
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-apertura', 'p-apertura-0', 'dgo', 0, 'Al llegar', 'Checar agua', 'check', true, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-apertura', 'p-apertura-1', 'dgo', 1, 'Al llegar', 'Revisar limpieza', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-apertura', 'p-apertura-2', 'dgo', 2, 'Al llegar', 'Encender máquina', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-apertura', 'p-apertura-3', 'dgo', 3, 'Al llegar', 'Encender sonido', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-apertura', 'p-apertura-4', 'dgo', 4, 'Al llegar', 'Encender luces', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-apertura', 'p-apertura-5', 'dgo', 5, 'Al llegar', 'Revisar barra de endulzantes y agitadores', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-apertura', 'p-apertura-6', 'dgo', 6, 'Al llegar', 'Revisar área comedor', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-apertura', 'p-apertura-7', 'dgo', 7, 'Al llegar', 'Abrir y revisar baños', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-apertura', 'p-apertura-8', 'dgo', 8, 'Al llegar', 'Revisar vitrina de pan', 'check', false, null, null, null, null, null, 'opcional', false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-apertura', 'p-apertura-9', 'dgo', 9, 'Al llegar', 'Temperatura del refri', 'numero', true, 0, 7, '°C', 0.5, 3.5, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-apertura', 'p-apertura-10', 'dgo', 10, 'Al llegar', 'Revisar stock del refri', 'nota', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-cierre', 'p-cierre-0', 'dgo', 0, 'Al cerrar', 'Limpieza de barra general', 'check', false, null, null, null, null, null, 'obligatoria', false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-cierre', 'p-cierre-1', 'dgo', 1, 'Al cerrar', 'Limpieza de máquina', 'check', false, null, null, null, null, null, 'opcional', false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-cierre', 'p-cierre-2', 'dgo', 2, 'Al cerrar', 'Limpieza de tarja', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-cierre', 'p-cierre-3', 'dgo', 3, 'Al cerrar', 'Limpieza de enjuagador', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-cierre', 'p-cierre-4', 'dgo', 4, 'Al cerrar', 'Limpieza de loza', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-cierre', 'p-cierre-5', 'dgo', 5, 'Al cerrar', 'Remojar portafiltros', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-cierre', 'p-cierre-6', 'dgo', 6, 'Al cerrar', 'Remojar trapos', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-cierre', 'p-cierre-7', 'dgo', 7, 'Al cerrar', 'Desconectar máquina', 'check', true, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-profunda', 'p-profunda-0', 'dgo', 0, 'Semanal', 'Vaporizador en remojo con limpiador de leche', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-profunda', 'p-profunda-1', 'dgo', 1, 'Semanal', 'Limpieza de molinos con pastillas', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-profunda', 'p-profunda-2', 'dgo', 2, 'Semanal', 'Desinfectar la hielera', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-profunda', 'p-profunda-3', 'dgo', 3, 'Semanal', 'Desmontar y lavar bombas de jarabe', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-profunda', 'p-profunda-4', 'dgo', 4, 'Semanal', 'Limpieza profunda de refrigeradores', 'check', false, null, null, null, null, null, null, false) on conflict do nothing;
insert into public.plantilla_items (plantilla_id, id, sucursal_id, orden, seccion, texto, tipo, critica, minimo, maximo, unidad, paso, inicial, foto, retirado) values ('p-profunda', 'p-profunda-foto', 'dgo', 5, 'Semanal', 'Foto de los refrigeradores limpios', 'foto', false, null, null, null, null, null, 'obligatoria', false) on conflict do nothing;

-- equipos
insert into public.equipos (id, sucursal_id, orden, nombre, tipo, paso_molienda, uso, modelo, detalle, pid_c, g_por_pulso) values ('eq-molino', 'dgo', 0, 'Molino de espresso', 'molino', 0.5, 'espresso', null, null, null, null) on conflict do nothing;
insert into public.equipos (id, sucursal_id, orden, nombre, tipo, paso_molienda, uso, modelo, detalle, pid_c, g_por_pulso) values ('eq-molino-filtro', 'dgo', 1, 'Molino de filtrados', 'molino', 1, 'filtrados', null, null, null, null) on conflict do nothing;
insert into public.equipos (id, sucursal_id, orden, nombre, tipo, paso_molienda, uso, modelo, detalle, pid_c, g_por_pulso) values ('eq-maquina', 'dgo', 2, 'Linea Classic AV', 'maquina', null, null, 'La Marzocco Linea Classic AV', '1 grupo · botonera con timer', 93.5, 0.5) on conflict do nothing;

-- botones
insert into public.botones (equipo_id, id, sucursal_id, orden, nombre, pulsos, programado_g, programado_en, programado_por) values ('eq-maquina', 'b1', 'dgo', 0, 'Sencillo', 70, null, null, null) on conflict do nothing;
insert into public.botones (equipo_id, id, sucursal_id, orden, nombre, pulsos, programado_g, programado_en, programado_por) values ('eq-maquina', 'b2', 'dgo', 1, 'Doble casa', 120, null, null, null) on conflict do nothing;
insert into public.botones (equipo_id, id, sucursal_id, orden, nombre, pulsos, programado_g, programado_en, programado_por) values ('eq-maquina', 'b3', 'dgo', 2, 'Doble descaf', 120, null, null, null) on conflict do nothing;
insert into public.botones (equipo_id, id, sucursal_id, orden, nombre, pulsos, programado_g, programado_en, programado_por) values ('eq-maquina', 'b4', 'dgo', 3, 'Sin asignar', null, null, null, null) on conflict do nothing;

-- canastillas
insert into public.canastillas (id, sucursal_id, equipo_id, orden, nombre, capacidad_g) values ('can-7', 'dgo', 'eq-maquina', 0, 'Sencilla', 7) on conflict do nothing;
insert into public.canastillas (id, sucursal_id, equipo_id, orden, nombre, capacidad_g) values ('can-14', 'dgo', 'eq-maquina', 1, 'Doble chica', 14) on conflict do nothing;
insert into public.canastillas (id, sucursal_id, equipo_id, orden, nombre, capacidad_g) values ('can-18', 'dgo', 'eq-maquina', 2, 'Doble', 18) on conflict do nothing;
insert into public.canastillas (id, sucursal_id, equipo_id, orden, nombre, capacidad_g) values ('can-21', 'dgo', 'eq-maquina', 3, 'Triple', 21) on conflict do nothing;

-- cafes
insert into public.cafes (id, sucursal_id, orden, nombre, origen, proceso, tostador, tueste, activo, notas, es_casa, boton_id, canastilla_id, objetivo_dosis_g, objetivo_rendimiento_g, objetivo_tiempo_s, tolerancia_tiempo_s, tolerancia_ratio) values ('cafe-casa', 'dgo', 0, 'Blend de la casa', 'Por confirmar', 'Por confirmar', 'Por confirmar', null, true, 'Notas de cata por confirmar con el tostador.', true, 'b2', 'can-18', 18, 36, 28, 2, 0.05) on conflict do nothing;
insert into public.cafes (id, sucursal_id, orden, nombre, origen, proceso, tostador, tueste, activo, notas, es_casa, boton_id, canastilla_id, objetivo_dosis_g, objetivo_rendimiento_g, objetivo_tiempo_s, tolerancia_tiempo_s, tolerancia_ratio) values ('cafe-descaf', 'dgo', 1, 'Descafeinado', 'Por confirmar', 'Por confirmar', 'Por confirmar', null, true, 'Notas de cata por confirmar con el tostador.', false, 'b3', 'can-18', 18, 36, 28, 2, 0.05) on conflict do nothing;

-- turnos_tipo
insert into public.turnos_tipo (id, sucursal_id, orden, nombre, corto, inicio, fin) values ('t-ap', 'dgo', 0, 'Apertura', 'AP', '07:30', '15:30') on conflict do nothing;
insert into public.turnos_tipo (id, sucursal_id, orden, nombre, corto, inicio, fin) values ('t-in', 'dgo', 1, 'Intermedio', 'IN', '11:00', '19:00') on conflict do nothing;
insert into public.turnos_tipo (id, sucursal_id, orden, nombre, corto, inicio, fin) values ('t-ci', 'dgo', 2, 'Cierre', 'CI', '15:00', '23:30') on conflict do nothing;
insert into public.turnos_tipo (id, sucursal_id, orden, nombre, corto, inicio, fin) values ('t-cl', 'dgo', 3, 'Cierre largo', 'CL', '16:30', '01:00') on conflict do nothing;

-- Tueste: se pone al llegar el primer lote; mientras, la fecha de hoy y la nota.
update public.cafes set tueste = current_date, notas = 'Origen, proceso, tostador, notas y fecha de tueste por confirmar con el tostador.' where sucursal_id = 'dgo' and tueste is null;

-- Glosario de la barra
insert into analitica.glosario (palabra, que_es, ejemplo) values ('Molienda', 'Qué tan fino muele el molino. Número más bajo = más fino. Más fino frena el agua: el shot tarda más y sale más intenso.', 'De 6 a 5.5 es moler un paso más fino.') on conflict (palabra) do update set que_es = excluded.que_es, ejemplo = excluded.ejemplo;
insert into analitica.glosario (palabra, que_es, ejemplo) values ('Dosis', 'Cuántos gramos de café molido van en el portafiltro. Se pesa en la báscula.', '18 g en la canastilla de 18.') on conflict (palabra) do update set que_es = excluded.que_es, ejemplo = excluded.ejemplo;
insert into analitica.glosario (palabra, que_es, ejemplo) values ('Rendimiento', 'Cuántos gramos de bebida caen en la taza. Se pesa con la taza en la báscula.', '36 g de espresso.') on conflict (palabra) do update set que_es = excluded.que_es, ejemplo = excluded.ejemplo;
insert into analitica.glosario (palabra, que_es, ejemplo) values ('Ratio', 'Cuánta bebida sale por cada gramo de café: rendimiento ÷ dosis. Más corto concentra; más largo aligera.', '18 g → 36 g es 1:2.') on conflict (palabra) do update set que_es = excluded.que_es, ejemplo = excluded.ejemplo;
insert into analitica.glosario (palabra, que_es, ejemplo) values ('Pulsos', 'Lo que cuenta la máquina para saber cuánta agua pasar. Cada botón corta al llegar a sus pulsos. Cuenta agua que entra, no bebida que cae: por eso se pesa.', '120 pulsos ≈ 36 g en taza con nuestra receta.') on conflict (palabra) do update set que_es = excluded.que_es, ejemplo = excluded.ejemplo;
insert into analitica.glosario (palabra, que_es, ejemplo) values ('Canastilla', 'El filtro de metal dentro del portafiltro. Cada una tiene su capacidad en gramos y la dosis debe quedar a 1 g de ella.', 'En la de 18 g caben de 17 a 19 g.') on conflict (palabra) do update set que_es = excluded.que_es, ejemplo = excluded.ejemplo;
insert into analitica.glosario (palabra, que_es, ejemplo) values ('PID', 'El control de temperatura de la caldera de café. Es uno para todos los cafés y solo lo cambia el encargado.', '93.5 °C.') on conflict (palabra) do update set que_es = excluded.que_es, ejemplo = excluded.ejemplo;
insert into analitica.glosario (palabra, que_es, ejemplo) values ('Tiempo del shot', 'Los segundos que tarda en salir el espresso. Lo marca la pantalla de la máquina; aquí solo se anota.', '28 s, con margen de ± 2.') on conflict (palabra) do update set que_es = excluded.que_es, ejemplo = excluded.ejemplo;
insert into analitica.glosario (palabra, que_es, ejemplo) values ('Validar', 'Cuando el encargado revisa un checklist completado y confirma que está bien. Cierra el ciclo: quien lo hizo sabe que alguien lo vio.', null) on conflict (palabra) do update set que_es = excluded.que_es, ejemplo = excluded.ejemplo;
insert into analitica.glosario (palabra, que_es, ejemplo) values ('Tarea crítica', 'Una tarea de seguridad, inocuidad o dinero. El checklist no se puede completar sin ella.', null) on conflict (palabra) do update set que_es = excluded.que_es, ejemplo = excluded.ejemplo;
insert into analitica.glosario (palabra, que_es, ejemplo) values ('Incidencia', 'Un problema que hay que resolver: una lectura fuera de rango o algo que alguien reportó. Tiene responsable y no se cierra sin decir qué se hizo.', null) on conflict (palabra) do update set que_es = excluded.que_es, ejemplo = excluded.ejemplo;
insert into analitica.glosario (palabra, que_es, ejemplo) values ('Jornada', 'El día de trabajo. Corta a las 5:00, así un cierre después de medianoche cuenta en el día que empezó.', null) on conflict (palabra) do update set que_es = excluded.que_es, ejemplo = excluded.ejemplo;
insert into analitica.glosario (palabra, que_es, ejemplo) values ('Receta del día', 'La dosis, rendimiento, tiempo y molienda aprobados hoy al calibrar. Es la que usa todo el turno.', null) on conflict (palabra) do update set que_es = excluded.que_es, ejemplo = excluded.ejemplo;

-- Menú oficial (Ryo-Menu-Oficial-A5.pdf)
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('espresso', 'dgo', 'Espresso', 'cafe', 'Clásicos', 45, null, null) on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('cortado', 'dgo', 'Cortado', 'cafe', 'Clásicos', 55, null, null) on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('flat-white', 'dgo', 'Flat white', 'cafe', 'Clásicos', 60, '[{"etiqueta":"frío","precio_mxn":65}]'::jsonb, null) on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('cappuccino', 'dgo', 'Cappuccino', 'cafe', 'Clásicos', 65, null, null) on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('latte', 'dgo', 'Latte', 'cafe', 'Clásicos', 75, '[{"etiqueta":"frío","precio_mxn":80}]'::jsonb, null) on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('americano', 'dgo', 'Americano', 'cafe', 'Clásicos', 50, '[{"etiqueta":"frío o caliente","precio_mxn":null}]'::jsonb, null) on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('long-black', 'dgo', 'Long black', 'cafe', 'Clásicos', 45, null, null) on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('moka', 'dgo', 'Moka', 'cafe', 'Clásicos', 80, '[{"etiqueta":"frío","precio_mxn":85}]'::jsonb, null) on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('cold-brew', 'dgo', 'Cold brew', 'cafe', 'Clásicos', 75, null, null) on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('cold-brew-latte', 'dgo', 'Cold brew latte', 'cafe', 'Clásicos', 85, null, null) on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('cold-brew-tonic', 'dgo', 'Cold brew tonic', 'cafe', 'Clásicos', 85, null, null) on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('espresso-tonic', 'dgo', 'Espresso tonic', 'cafe', 'Clásicos', 85, null, null) on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('ryo-latte', 'dgo', 'Ryo latte', 'cafe', 'Especiales', 115, null, 'Leche de avena, espresso y foam de sésamo.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('miso-caramel-latte', 'dgo', 'Miso caramel latte', 'cafe', 'Especiales', 90, null, 'Espresso, caramelo de miso y leche de tu elección.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('shaken-espresso', 'dgo', 'Shaken espresso', 'cafe', 'Especiales', 60, null, 'Espresso agitado con mascabado y un toque de foam.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('maple-sea-salt-latte', 'dgo', 'Maple sea salt latte', 'cafe', 'Especiales', 90, null, 'Jarabe de maple, sal Maldon y leche de tu elección.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('coffee-cloud', 'dgo', 'Coffee cloud', 'cafe', 'Especiales', 130, null, 'Foam de café sobre agua de coco.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('matcha-latte', 'dgo', 'Matcha latte', 'matcha', 'Matcha', 110, '[{"etiqueta":"frío o caliente","precio_mxn":null}]'::jsonb, null) on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('ryo-matcha', 'dgo', 'Ryo matcha', 'matcha', 'Matcha', 140, null, 'Matcha latte con foam de sésamo.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('hojicha', 'dgo', 'Hojicha', 'matcha', 'Matcha', 90, null, 'Té verde tostado, frío.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('hojichai', 'dgo', 'Hojichai', 'matcha', 'Matcha', 110, null, 'Chai latte frío con hojicha.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('coconut-matcha', 'dgo', 'Coconut matcha', 'matcha', 'Matcha', 170, null, 'Matcha con base de agua de coco.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('chai-latte', 'dgo', 'Chai latte', 'sin-cafe', 'Sin café', 70, '[{"etiqueta":"frío","precio_mxn":75}]'::jsonb, 'Hecho en casa con especias naturales y leche de tu elección.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('golden-milk', 'dgo', 'Golden milk', 'sin-cafe', 'Sin café', 70, '[{"etiqueta":"frío","precio_mxn":75}]'::jsonb, 'Cúrcuma y especias orgánicas, con leche de tu elección.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('sesame-latte', 'dgo', 'Sesame latte', 'sin-cafe', 'Sin café', 75, null, 'Leche de avena con pasta de sésamo tostado.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('mandarina-cardamomo', 'dgo', 'Mandarina cardamomo', 'sin-cafe', 'Mocktails', null, null, 'Mandarina, cardamomo, limón y agua mineral.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('ginger-honey', 'dgo', 'Ginger honey', 'sin-cafe', 'Mocktails', null, null, 'Jengibre, miel, limón y agua mineral.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('iced-tea', 'dgo', 'Iced tea', 'sin-cafe', 'Mocktails', null, null, 'Extracción en frío de té negro con limón.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('manzanilla-limon', 'dgo', 'Manzanilla limón', 'sin-cafe', 'Mocktails', null, null, 'Extracción en frío de manzanilla con limón.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('matcha-martini', 'dgo', 'Matcha martini', 'bar', 'Cócteles', null, null, 'Vodka infusionado con matcha, agua de coco y jarabe natural.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('negroni-manzanilla', 'dgo', 'Negroni manzanilla', 'bar', 'Cócteles', null, null, 'Gin infusionado con manzanilla, vermut rosso y Campari.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('martini-de-mezcal', 'dgo', 'Martini de mezcal', 'bar', 'Cócteles', null, null, 'Mezcal Cuero Viejo, jarabe de sandía, jarabe de kiwi y limón.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('martini-lichi', 'dgo', 'Martini lichi', 'bar', 'Cócteles', null, null, 'Té de jazmín, almíbar de lichi y St-Germain.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('limoncello-spritz', 'dgo', 'Limoncello spritz', 'bar', 'Cócteles', null, null, 'Limoncello, espumoso, agua mineral y jarabe natural.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('espresso-de-olla-martini', 'dgo', 'Espresso de olla martini', 'bar', 'Cócteles', null, null, 'Tequila 1800 Añejo, espresso y jarabe de café de olla.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('dirty-martini', 'dgo', 'Dirty martini', 'bar', 'Cócteles', null, null, 'Gin o vodka, vermut seco, salmuera y aceitunas.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('matcha-pancake', 'dgo', 'Matcha pancake', 'cocina', 'Desayunos', 149, null, 'Con crema batida, maple y mantequilla.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('bowl-de-yogurt', 'dgo', 'Bowl de yogurt', 'cocina', 'Desayunos', 149, null, 'Yogurt griego artesanal, granola hecha en casa y fruta fresca de temporada.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('ensalada-green-goddess', 'dgo', 'Ensalada Green Goddess', 'cocina', 'Desayunos', 109, null, 'Arúgula, espinaca, col verde, pistache y parmesano con aderezo green goddess.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('papitas', 'dgo', 'Papitas', 'cocina', 'Desayunos', 90, null, 'Papa cambray con aioli de salsa macha.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('huevos-turcos', 'dgo', 'Huevos turcos', 'cocina', 'Desayunos', 175, null, 'Huevos pochados con jocoque, yogurt y eneldo, y un toque de mantequilla con paprika y chili flakes. Con nuestro pan de masa madre.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('huevos-tomate-shakshuka', 'dgo', 'Huevos tomate (shakshuka)', 'cocina', 'Desayunos', 189, null, 'Huevos sobre nuestra salsa de tomate, pimientos y especias, terminados con hierbas frescas, queso feta con ricotta y aceite de oliva con perejil y eneldo. Con nuestro pan de masa madre.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('omelette-ryo', 'dgo', 'Omelette Ryo', 'cocina', 'Desayunos', 130, null, 'Nuestro omelette, perfectamente cocinado, con whipped butter y nuestro pan de masa madre.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('breakfast-plate', 'dgo', 'Breakfast plate', 'cocina', 'Desayunos', 189, '[{"etiqueta":"con salmón","precio_mxn":219}]'::jsonb, 'Huevo revuelto, pechuga de pavo o salmón curado, aguacate, cebolla encurtida, pepinillos, tomate asado y crema de ricotta con feta.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('toast-de-salmon', 'dgo', 'Toast de salmón', 'cocina', 'Toasts', 179, null, 'Salmón curado en casa sobre pan de masa madre, queso crema con jocoque, pepinillos, alcaparras y eneldo.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('toast-de-miso-shiitake', 'dgo', 'Toast de miso shiitake', 'cocina', 'Toasts', 139, null, 'Shiitake fresco salteado con miso y cebolla, sobre pan de masa madre con queso feta y ricotta.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('breakfast-sandwich', 'dgo', 'Breakfast sandwich', 'cocina', 'Sándwiches', 159, null, 'Huevo revuelto con tocino, aguacate, queso cheddar y mayonesa de ajo confitado.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('sandwich-de-pastrami', 'dgo', 'Sándwich de pastrami', 'cocina', 'Sándwiches', 239, null, 'Pastrami con ensalada de col, queso cheddar y mayonesa de ajo confitado.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('sandwich-de-pavo', 'dgo', 'Sándwich de pavo', 'cocina', 'Sándwiches', 189, null, 'Pechuga de pavo hecha en casa, tocino, aguacate, queso, lechuga, tomate, mayonesa y Dijon.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;
insert into externo.productos (id, sucursal_id, nombre, seccion, grupo, precio_mxn, variantes, descripcion) values ('tuna-melt', 'dgo', 'Tuna melt', 'cocina', 'Sándwiches', 189, null, 'Atún con salsa tártara hecha en casa y queso cheddar.') on conflict (id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion;

-- Conocimiento general (lo puede consultar la IA): recetas, lecciones y glosario
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:espresso', null, 'receta', 'espresso', 'Espresso', 'Espresso (Clásicos)
Vaso: Taza de espresso. Temperatura: PID 93.5 °C. Tiempo: 26–30 s.
Cantidades: Dosis 18.0 g; Rendimiento 36.0 g; Ratio 1:2; Botón Doble casa.
Pasos: 1. Purga el grupo 2 segundos. 2. Muele 18.0 g y distribuye parejo. 3. Tampea nivelado, sin girar. 4. Engancha, báscula en cero y presiona Doble casa: la Linea corta sola. 5. Revisa la báscula (36 g) y el tiempo en la botonera (26–30 s). 6. Sirve de inmediato.
Estándar: Crema avellana y continua. Dulce, con acidez limpia. Si sale ácido o amargo, revisa la receta del día antes de servir.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:cortado', null, 'receta', 'cortado', 'Cortado', 'Cortado (Clásicos)
Vaso: Vaso 4.5 oz. Temperatura: Leche a 55–60 °C. Tiempo: 2 min.
Cantidades: Espresso 18 g → 36 g · Doble casa; Leche 60 ml.
Pasos: 1. Extrae el espresso en el vaso. 2. Texturiza poca leche, casi sin aire. 3. Vierte despacio, pegado a la superficie.
Estándar: Mitad espresso, mitad leche. Capa fina de espuma, menos de medio centímetro.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:flat-white', null, 'receta', 'flat-white', 'Flat white', 'Flat white (Clásicos)
Vaso: Taza 6 oz. Temperatura: Leche a 60–65 °C. Tiempo: 2 min.
Cantidades: Espresso 18 g → 36 g · Doble casa; Leche 110 ml.
Pasos: 1. Extrae el espresso en la taza. 2. Aire solo al inicio, 2 segundos. Luego integra. 3. Vierte alto al inicio y baja para dibujar. 4. Arte simple: corazón o tulipán.
Estándar: Microespuma brillante, sin burbujas visibles. Superficie plana, capa de espuma de 0.5 cm.
En frío: Vaso 12 oz con hielo. 1. Llena el vaso de hielo. 2. Sirve la leche fría. 3. Extrae el espresso y viértelo encima, despacio.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:cappuccino', null, 'receta', 'cappuccino', 'Cappuccino', 'Cappuccino (Clásicos)
Vaso: Taza 8 oz. Temperatura: Leche a 60–65 °C. Tiempo: 2 min.
Cantidades: Espresso 18 g → 36 g · Doble casa; Leche 120 ml.
Pasos: 1. Extrae el espresso en la taza. 2. Aire 4–5 segundos: más espuma que un latte. 3. Vierte y termina con la espuma.
Estándar: Espuma de 1.5 cm, sedosa. Canela solo si el cliente la pide.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:latte', null, 'receta', 'latte', 'Latte', 'Latte (Clásicos)
Vaso: Vaso 12 oz. Temperatura: Leche a 60–65 °C. Tiempo: 2 min.
Cantidades: Espresso 18 g → 36 g · Doble casa; Leche 150 ml.
Pasos: 1. Extrae el espresso en el vaso. 2. Texturiza 150 ml de leche, aire 2–3 segundos. 3. Vierte y dibuja al final.
Estándar: Espuma de 0.5–1 cm. La leche nunca pasa de 65 °C: se quema y pierde dulzor.
En frío: Vaso 12 oz con hielo. 1. Llena el vaso de hielo. 2. Sirve 150 ml de leche fría. 3. Extrae el espresso y viértelo encima para marcar la capa.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:americano', null, 'receta', 'americano', 'Americano', 'Americano (Clásicos)
Vaso: Vaso 12 oz. Temperatura: Agua a 85 °C. Tiempo: 1 min.
Cantidades: Espresso 18 g → 36 g · Doble casa; Agua caliente 150 ml.
Pasos: 1. Extrae el espresso en el vaso. 2. Completa con el agua caliente. 3. Sirve sin revolver.
Estándar: Largo y limpio. Si lo quieren más suave, se agrega agua; nunca se hace un shot más largo.
En frío: Vaso 12 oz con hielo. 1. Llena el vaso de hielo. 2. Sirve el agua fría. 3. Extrae el espresso y viértelo encima.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:long-black', null, 'receta', 'long-black', 'Long black', 'Long black (Clásicos)
Vaso: Taza 6 oz. Temperatura: Agua a 85 °C. Tiempo: 1 min.
Cantidades: Agua caliente 100 ml; Espresso 18 g → 36 g · Doble casa.
Pasos: 1. Sirve primero el agua caliente. 2. Extrae el espresso directo sobre el agua. 3. No revuelvas: la crema queda arriba.
Estándar: Más corto e intenso que el americano, con la crema intacta en la superficie. El agua va primero.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:moka', null, 'receta', 'moka', 'Moka', 'Moka (Clásicos)
Vaso: Vaso 12 oz. Temperatura: Leche a 60–65 °C. Tiempo: 2 min.
Cantidades: Espresso 18 g → 36 g · Doble casa; Chocolate 20 g; Leche 150 ml.
Pasos: 1. Pon el chocolate en el vaso. 2. Extrae el espresso encima y mezcla hasta integrar. 3. Texturiza la leche y vierte.
Estándar: Sin chocolate asentado en el fondo: se integra con el espresso antes de la leche.
En frío: Vaso 12 oz con hielo. 1. Integra el chocolate con el espresso en la jarra. 2. Llena el vaso de hielo y sirve la leche fría. 3. Vierte el espresso con chocolate encima.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:cold-brew', null, 'receta', 'cold-brew', 'Cold brew', 'Cold brew (Clásicos) · receta con cantidades por confirmar
Vaso: por confirmar. Temperatura: Frío, con hielo. Tiempo: por confirmar.
Cantidades: Cold brew por confirmar; Hielo al borde.
Pasos: 1. Llena el vaso de hielo. 2. Sirve el cold brew de la jarra. 3. Sirve de inmediato.
Estándar: Limpio y dulce, sin amargor ni sedimento. Proporción y tiempo de extracción del cold brew: por definir con la barra.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:cold-brew-latte', null, 'receta', 'cold-brew-latte', 'Cold brew latte', 'Cold brew latte (Clásicos) · receta con cantidades por confirmar
Vaso: por confirmar. Temperatura: Frío, con hielo. Tiempo: por confirmar.
Cantidades: Cold brew por confirmar; Leche fría por confirmar; Hielo al borde.
Pasos: 1. Llena el vaso de hielo. 2. Sirve la leche fría. 3. Vierte el cold brew encima, despacio.
Estándar: Dos capas marcadas al servir. Cantidades por definir con la barra.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:cold-brew-tonic', null, 'receta', 'cold-brew-tonic', 'Cold brew tonic', 'Cold brew tonic (Clásicos) · receta con cantidades por confirmar
Vaso: por confirmar. Temperatura: Frío, con hielo. Tiempo: por confirmar.
Cantidades: Agua tónica por confirmar; Cold brew por confirmar; Hielo al borde.
Pasos: 1. Llena el vaso de hielo. 2. Sirve la tónica, inclinando el vaso para conservar el gas. 3. Vierte el cold brew encima, despacio, para que quede en capas.
Estándar: Burbujeante y con capas. No se revuelve: se mezcla al tomarlo. Cantidades por definir con la barra.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:espresso-tonic', null, 'receta', 'espresso-tonic', 'Espresso tonic', 'Espresso tonic (Clásicos) · receta con cantidades por confirmar
Vaso: por confirmar. Temperatura: Frío, con hielo. Tiempo: por confirmar.
Cantidades: Espresso 18 g → 36 g · Doble casa; Agua tónica por confirmar; Hielo al borde.
Pasos: 1. Llena el vaso de hielo y sirve la tónica. 2. Extrae el espresso y viértelo encima, despacio. 3. Sirve de inmediato, antes de que se mezcle.
Estándar: El espresso queda arriba, en capa, sobre la tónica. Cantidad de tónica por definir con la barra.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:ryo-latte', null, 'receta', 'ryo-latte', 'Ryo latte', 'Ryo latte (Especiales) · receta con cantidades por confirmar
En el menú: Leche de avena, espresso y foam de sésamo.
Vaso: Vaso 12 oz. Temperatura: Leche a 60–65 °C. Tiempo: 3 min.
Cantidades: Espresso 18 g → 36 g · Doble casa; Leche de avena 150 ml; Foam de sésamo por confirmar.
Pasos: 1. Extrae el espresso en el vaso. 2. Texturiza la leche de avena y vierte. 3. Corona con el foam de sésamo.
Estándar: El foam va al final y se sirve de inmediato, antes de que baje. La bebida firma de Ryo: la receta del foam se define en barra.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:miso-caramel-latte', null, 'receta', 'miso-caramel-latte', 'Miso caramel latte', 'Miso caramel latte (Especiales) · receta con cantidades por confirmar
En el menú: Espresso, caramelo de miso y leche de tu elección.
Vaso: Vaso 12 oz. Temperatura: Leche a 60–65 °C. Tiempo: 3 min.
Cantidades: Espresso 18 g → 36 g · Doble casa; Caramelo de miso por confirmar; Leche de tu elección 150 ml.
Pasos: 1. Pon el caramelo de miso en el vaso. 2. Extrae el espresso encima e integra. 3. Texturiza la leche elegida y vierte.
Estándar: El caramelo se integra con el espresso antes de la leche: sin miso asentado en el fondo.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:shaken-espresso', null, 'receta', 'shaken-espresso', 'Shaken espresso', 'Shaken espresso (Especiales) · receta con cantidades por confirmar
En el menú: Espresso agitado con mascabado y un toque de foam.
Vaso: por confirmar. Temperatura: Frío, con hielo. Tiempo: 2 min.
Cantidades: Espresso 18 g → 36 g · Doble casa; Mascabado por confirmar; Hielo por confirmar; Foam por confirmar.
Pasos: 1. Extrae el espresso sobre el mascabado, en el shaker, y disuélvelo. 2. Agrega hielo y agita fuerte hasta que el shaker se sienta helado. 3. Cuela al vaso. 4. Termina con un toque de foam.
Estándar: Espumoso y frío, con el mascabado integrado. Cantidades por definir con la barra.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:maple-sea-salt-latte', null, 'receta', 'maple-sea-salt-latte', 'Maple sea salt latte', 'Maple sea salt latte (Especiales) · receta con cantidades por confirmar
En el menú: Jarabe de maple, sal Maldon y leche de tu elección.
Vaso: Vaso 12 oz. Temperatura: Leche a 60–65 °C. Tiempo: 2 min.
Cantidades: Espresso 18 g → 36 g · Doble casa; Jarabe de maple por confirmar; Sal Maldon por confirmar; Leche de tu elección 150 ml.
Pasos: 1. Integra el jarabe de maple con el espresso en el vaso. 2. Vierte la leche elegida, texturizada. 3. Termina con la sal Maldon.
Estándar: Dulce con un final salado: la sal se nota, no domina.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:coffee-cloud', null, 'receta', 'coffee-cloud', 'Coffee cloud', 'Coffee cloud (Especiales) · receta con cantidades por confirmar
En el menú: Foam de café sobre agua de coco.
Vaso: por confirmar. Temperatura: por confirmar. Tiempo: 3 min.
Cantidades: Agua de coco por confirmar; Foam de café por confirmar.
Pasos: 1. Sirve el agua de coco en el vaso. 2. Prepara el foam de café. 3. Corona el agua de coco con el foam, despacio.
Estándar: El foam flota entero sobre el agua de coco, como una nube. Receta del foam por definir con la barra.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:matcha-latte', null, 'receta', 'matcha-latte', 'Matcha latte', 'Matcha latte (Matcha)
En el menú: Frío o caliente.
Vaso: Vaso 12 oz. Temperatura: Agua a 75 °C. Tiempo: 2 min.
Cantidades: Matcha ceremonial 3 g; Agua 60 ml; Leche 120 ml.
Pasos: 1. Tamiza el matcha en el tazón. 2. Agrega el agua a 75 °C. 3. Bate en zigzag hasta que no queden grumos. 4. Texturiza 120 ml de leche y vierte el matcha encima.
Estándar: Sin grumos. El agua hirviendo amarga el matcha: nunca más de 80 °C.
En frío: Vaso 12 oz con hielo. 1. Tamiza el matcha en el tazón. 2. Agrega el agua a 75 °C y bate en zigzag hasta que no queden grumos. 3. Llena el vaso de hielo y sirve la leche fría. 4. Vierte el matcha batido encima.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:ryo-matcha', null, 'receta', 'ryo-matcha', 'Ryo matcha', 'Ryo matcha (Matcha) · receta con cantidades por confirmar
En el menú: Matcha latte con foam de sésamo.
Vaso: Vaso 12 oz. Temperatura: Agua a 75 °C. Tiempo: 3 min.
Cantidades: Matcha ceremonial 3 g; Agua 60 ml; Leche 120 ml; Foam de sésamo por confirmar.
Pasos: 1. Tamiza el matcha en el tazón. 2. Agrega el agua a 75 °C y bate en zigzag hasta que no queden grumos. 3. Texturiza 120 ml de leche y vierte el matcha encima. 4. Corona con el foam de sésamo.
Estándar: Es el matcha latte de la casa con foam de sésamo: el foam va al final y se sirve de inmediato. Receta del foam por definir con la barra.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:hojicha', null, 'receta', 'hojicha', 'Hojicha', 'Hojicha (Matcha) · receta con cantidades por confirmar
En el menú: Té verde tostado, frío.
Vaso: Vaso 12 oz con hielo. Temperatura: Frío, con hielo. Tiempo: 2 min.
Cantidades: Hojicha por confirmar; Agua por confirmar; Hielo al borde.
Pasos: 1. Tamiza la hojicha en el tazón. 2. Agrega el agua a 85 °C y bate hasta integrar. 3. Llena el vaso de hielo y vierte la hojicha encima.
Estándar: Tostado y suave, sin amargor. Aguanta agua más caliente que el matcha. El menú la describe solo como té, sin leche.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:hojichai', null, 'receta', 'hojichai', 'Hojichai', 'Hojichai (Matcha) · receta con cantidades por confirmar
En el menú: Chai latte frío con hojicha.
Vaso: Vaso 12 oz con hielo. Temperatura: Frío, con hielo. Tiempo: 3 min.
Cantidades: Chai de la casa por confirmar; Leche fría por confirmar; Hojicha por confirmar; Hielo al borde.
Pasos: 1. Prepara la hojicha: agua a 85 °C, bate hasta integrar. 2. Llena el vaso de hielo y sirve el chai latte frío. 3. Vierte la hojicha encima, despacio.
Estándar: Dos capas: el chai abajo y la hojicha arriba. Cantidades por definir con la barra.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:coconut-matcha', null, 'receta', 'coconut-matcha', 'Coconut matcha', 'Coconut matcha (Matcha) · receta con cantidades por confirmar
En el menú: Matcha con base de agua de coco.
Vaso: por confirmar. Temperatura: Agua a 75 °C. Tiempo: 2 min.
Cantidades: Matcha ceremonial 3 g; Agua 60 ml; Agua de coco por confirmar; Hielo por confirmar.
Pasos: 1. Tamiza el matcha en el tazón. 2. Agrega el agua a 75 °C y bate en zigzag hasta que no queden grumos. 3. Sirve el agua de coco en el vaso. 4. Vierte el matcha batido encima, despacio.
Estándar: Verde jade sobre el agua de coco, sin grumos. Servicio (con o sin hielo) y cantidad de agua de coco por definir con la barra.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:chai-latte', null, 'receta', 'chai-latte', 'Chai latte', 'Chai latte (Sin café) · receta con cantidades por confirmar
En el menú: Hecho en casa con especias naturales y leche de tu elección.
Vaso: Vaso 12 oz. Temperatura: Leche a 60–65 °C. Tiempo: 3 min.
Cantidades: Chai de la casa por confirmar; Leche de tu elección 150 ml.
Pasos: 1. Pon el chai de la casa en el vaso. 2. Texturiza la leche elegida. 3. Vierte la leche sobre el chai y mezcla suave.
Estándar: Especiado y dulce, sin que las especias queden asentadas en el fondo. Receta del chai de la casa por definir en barra.
En frío: Vaso 12 oz con hielo. 1. Llena el vaso de hielo. 2. Sirve el chai de la casa y la leche fría. 3. Mezcla suave antes de servir.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:golden-milk', null, 'receta', 'golden-milk', 'Golden milk', 'Golden milk (Sin café) · receta con cantidades por confirmar
En el menú: Cúrcuma y especias orgánicas, con leche de tu elección.
Vaso: Vaso 12 oz. Temperatura: Leche a 60–65 °C. Tiempo: 3 min.
Cantidades: Mezcla de cúrcuma y especias por confirmar; Leche de tu elección 150 ml.
Pasos: 1. Pon la mezcla de cúrcuma y especias en el vaso. 2. Texturiza la leche elegida. 3. Vierte la leche sobre la mezcla y mezcla suave.
Estándar: Color dorado parejo, sin grumos de especia. La cúrcuma mancha: limpia de inmediato lo que caiga.
En frío: Vaso 12 oz con hielo. 1. Integra la mezcla con un poco de la leche hasta que no queden grumos. 2. Llena el vaso de hielo y sirve el resto de la leche fría. 3. Vierte la mezcla encima y revuelve suave.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:sesame-latte', null, 'receta', 'sesame-latte', 'Sesame latte', 'Sesame latte (Sin café) · receta con cantidades por confirmar
En el menú: Leche de avena con pasta de sésamo tostado.
Vaso: Vaso 12 oz. Temperatura: Leche a 60–65 °C. Tiempo: 3 min.
Cantidades: Pasta de sésamo tostado por confirmar; Leche de avena 150 ml.
Pasos: 1. Integra la pasta de sésamo con un poco de leche tibia hasta que no queden grumos. 2. Texturiza la leche de avena. 3. Vierte sobre la pasta de sésamo.
Estándar: Cremoso y tostado, sin pasta asentada en el fondo. Cantidad de pasta por definir con la barra.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:mandarina-cardamomo', null, 'receta', 'mandarina-cardamomo', 'Mandarina cardamomo', 'Mandarina cardamomo (Mocktails) · receta con cantidades por confirmar
En el menú: Mandarina, cardamomo, limón y agua mineral.
Vaso: por confirmar. Temperatura: Frío, con hielo. Tiempo: por confirmar.
Cantidades: Mandarina por confirmar; Cardamomo por confirmar; Limón por confirmar; Agua mineral por confirmar.
Pasos: 1. Preparación por definir con la barra: los ingredientes son los del menú.
Estándar: Cítrico y fresco, con el cardamomo de fondo. Se registra aquí cuando se defina.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:ginger-honey', null, 'receta', 'ginger-honey', 'Ginger honey', 'Ginger honey (Mocktails) · receta con cantidades por confirmar
En el menú: Jengibre, miel, limón y agua mineral.
Vaso: por confirmar. Temperatura: Frío, con hielo. Tiempo: por confirmar.
Cantidades: Jengibre por confirmar; Miel por confirmar; Limón por confirmar; Agua mineral por confirmar.
Pasos: 1. Preparación por definir con la barra: los ingredientes son los del menú.
Estándar: Picante suave del jengibre, dulzor de la miel y acidez del limón en equilibrio. Se registra aquí cuando se defina.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:iced-tea', null, 'receta', 'iced-tea', 'Iced tea', 'Iced tea (Mocktails) · receta con cantidades por confirmar
En el menú: Extracción en frío de té negro con limón.
Vaso: por confirmar. Temperatura: Frío, con hielo. Tiempo: por confirmar.
Cantidades: Té negro (extracción en frío) por confirmar; Limón por confirmar; Hielo al borde.
Pasos: 1. Prepara la extracción en frío del té negro (proporción y tiempo por definir con la barra). 2. Sirve sobre hielo. 3. Termina con el limón.
Estándar: Limpio y sin astringencia: por eso se extrae en frío. Se registra aquí cuando se defina.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:manzanilla-limon', null, 'receta', 'manzanilla-limon', 'Manzanilla limón', 'Manzanilla limón (Mocktails) · receta con cantidades por confirmar
En el menú: Extracción en frío de manzanilla con limón.
Vaso: por confirmar. Temperatura: Frío, con hielo. Tiempo: por confirmar.
Cantidades: Manzanilla (extracción en frío) por confirmar; Limón por confirmar; Hielo al borde.
Pasos: 1. Prepara la extracción en frío de la manzanilla (proporción y tiempo por definir con la barra). 2. Sirve sobre hielo. 3. Termina con el limón.
Estándar: Floral y suave, sin amargor. Se registra aquí cuando se defina.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:matcha-martini', null, 'receta', 'matcha-martini', 'Matcha martini', 'Matcha martini (Cócteles) · receta con cantidades por confirmar
En el menú: Vodka infusionado con matcha, agua de coco y jarabe natural.
Vaso: por confirmar. Temperatura: Frío. Tiempo: por confirmar.
Cantidades: Vodka infusionado con matcha por confirmar; Agua de coco por confirmar; Jarabe natural por confirmar.
Pasos: 1. Receta y técnica por definir con la barra: los ingredientes son los del menú.
Estándar: Se registra aquí cuando se defina.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:negroni-manzanilla', null, 'receta', 'negroni-manzanilla', 'Negroni manzanilla', 'Negroni manzanilla (Cócteles) · receta con cantidades por confirmar
En el menú: Gin infusionado con manzanilla, vermut rosso y Campari.
Vaso: por confirmar. Temperatura: Frío. Tiempo: por confirmar.
Cantidades: Gin infusionado con manzanilla por confirmar; Vermut rosso por confirmar; Campari por confirmar.
Pasos: 1. Receta y técnica por definir con la barra: los ingredientes son los del menú.
Estándar: Se registra aquí cuando se defina.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:martini-de-mezcal', null, 'receta', 'martini-de-mezcal', 'Martini de mezcal', 'Martini de mezcal (Cócteles) · receta con cantidades por confirmar
En el menú: Mezcal Cuero Viejo, jarabe de sandía, jarabe de kiwi y limón.
Vaso: por confirmar. Temperatura: Frío. Tiempo: por confirmar.
Cantidades: Mezcal Cuero Viejo por confirmar; Jarabe de sandía por confirmar; Jarabe de kiwi por confirmar; Limón por confirmar.
Pasos: 1. Receta y técnica por definir con la barra: los ingredientes son los del menú.
Estándar: Se registra aquí cuando se defina.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:martini-lichi', null, 'receta', 'martini-lichi', 'Martini lichi', 'Martini lichi (Cócteles) · receta con cantidades por confirmar
En el menú: Té de jazmín, almíbar de lichi y St-Germain.
Vaso: por confirmar. Temperatura: Frío. Tiempo: por confirmar.
Cantidades: Té de jazmín por confirmar; Almíbar de lichi por confirmar; St-Germain por confirmar.
Pasos: 1. Receta y técnica por definir con la barra: los ingredientes son los del menú.
Estándar: Se registra aquí cuando se defina.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:limoncello-spritz', null, 'receta', 'limoncello-spritz', 'Limoncello spritz', 'Limoncello spritz (Cócteles) · receta con cantidades por confirmar
En el menú: Limoncello, espumoso, agua mineral y jarabe natural.
Vaso: por confirmar. Temperatura: Frío, con hielo. Tiempo: por confirmar.
Cantidades: Limoncello por confirmar; Espumoso por confirmar; Agua mineral por confirmar; Jarabe natural por confirmar.
Pasos: 1. Receta y técnica por definir con la barra: los ingredientes son los del menú.
Estándar: Se registra aquí cuando se defina.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:espresso-de-olla-martini', null, 'receta', 'espresso-de-olla-martini', 'Espresso de olla martini', 'Espresso de olla martini (Cócteles) · receta con cantidades por confirmar
En el menú: Tequila 1800 Añejo, espresso y jarabe de café de olla.
Vaso: por confirmar. Temperatura: Frío. Tiempo: por confirmar.
Cantidades: Tequila 1800 Añejo por confirmar; Espresso por confirmar; Jarabe de café de olla por confirmar.
Pasos: 1. Receta y técnica por definir con la barra: los ingredientes son los del menú. El espresso es el de la receta del día.
Estándar: Se registra aquí cuando se defina.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('receta:dirty-martini', null, 'receta', 'dirty-martini', 'Dirty martini', 'Dirty martini (Cócteles) · receta con cantidades por confirmar
En el menú: Gin o vodka, vermut seco, salmuera y aceitunas.
Vaso: por confirmar. Temperatura: Frío. Tiempo: por confirmar.
Cantidades: Gin o vodka por confirmar; Vermut seco por confirmar; Salmuera por confirmar; Aceitunas por confirmar.
Pasos: 1. Receta y técnica por definir con la barra: los ingredientes son los del menú.
Estándar: Se registra aquí cuando se defina.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('leccion:l-matcha-que', null, 'leccion', 'l-matcha-que', 'Qué es el matcha ceremonial', 'Qué es el matcha ceremonial
El matcha es hoja de té verde molida en piedra hasta volverse polvo. No se infusiona y se tira: te tomas la hoja entera. Por eso la calidad de la hoja se nota tanto.
El ceremonial es el grado más alto: hoja de la primera cosecha, cultivada a la sombra las últimas semanas. La sombra hace que la planta guarde más clorofila y aminoácidos: de ahí el verde intenso y el sabor dulce y umami.
Color: Verde jade, brillante; Aroma: Fresco, hierba dulce, nuez; Sabor: Dulce y umami, amargor ligero; Textura: Polvo finísimo, como talco
En Ryo usamos ceremonial de la más alta calidad. Se trata como el mejor café de la barra: se pesa, se mide el agua y se sirve recién hecho.
Sus enemigos son cuatro: aire, luz, calor y humedad. Un matcha oxidado se ve verde olivo, huele a heno y sabe amargo.
P: ¿Qué hace diferente al matcha ceremonial? R: Es de la primera cosecha, de hoja cultivada a la sombra y molida en piedra: verde intenso, dulce y umami.
P: ¿Cuáles son los cuatro enemigos del matcha? R: Aire, luz, calor y humedad.
P: ¿Cómo se ve un matcha oxidado? R: Verde olivo o amarillento, apagado. Ya no se sirve solo: se avisa al encargado.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('leccion:l-matcha-como', null, 'leccion', 'l-matcha-como', 'Preparar matcha: tamizar, agua y batido', 'Preparar matcha: tamizar, agua y batido
Son tres cosas las que deciden la taza: tamizar, la temperatura del agua y el batido. Si una falla, se nota.
Matcha: 3 g, tamizado; Agua: 60 ml a 75 °C; Batido: Zigzag, 15 a 20 s; Leche (latte): 120 ml a 55–60 °C
Nunca agua hirviendo: arriba de 80 °C el matcha se amarga y pierde lo dulce.
Primero una pasta con un chorrito de agua; luego el resto del agua. Se bate rápido en M o W, desde la muñeca, sin aplastar las puntas del chasen contra el fondo. Al final se pasan las puntas por la superficie y se saca por el centro.
(Receta: matcha-latte)
P: ¿A qué temperatura va el agua del matcha? R: A 75 °C. Nunca más de 80 °C.
P: ¿Por qué se tamiza el matcha? R: Porque se apelmaza por estática, y un grumo que entra al agua ya no se deshace batiendo.
P: ¿Cómo se mueve el chasen? R: En zigzag (M o W), rápido y desde la muñeca, 15 a 20 segundos, sin aplastar las puntas contra el fondo.
P: ¿Por qué se hace primero una pasta con poca agua? R: Para mojar todo el polvo parejo. Con toda el agua de golpe, el polvo flota y se hacen grumos.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('leccion:l-matcha-cuidado', null, 'leccion', 'l-matcha-cuidado', 'Cuidar el matcha y el chasen', 'Cuidar el matcha y el chasen
La lata se cierra en cuanto sacas el matcha. Se guarda en frío, lejos de la luz y de olores. Al sacarla del refri, espera a que tome temperatura antes de abrirla: si se abre fría, se condensa humedad adentro.
La cuchara entra seca. Una gota de agua en la lata echa a perder el resto.
El chasen se remoja antes de usarlo para que el bambú no se rompa. Después se enjuaga solo con agua tibia, sin jabón, y se seca al aire en su soporte.
P: ¿Cómo se lava el chasen? R: Solo con agua tibia, sin jabón, y se seca al aire en su soporte.
P: ¿Qué haces con la lata al sacarla del refri? R: Esperar a que tome temperatura antes de abrirla, para que no se condense humedad adentro.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('leccion:l-receta', null, 'leccion', 'l-receta', 'La receta: dosis, rendimiento, tiempo', 'La receta: dosis, rendimiento, tiempo
Un espresso se describe con tres números: cuánto café entra (dosis), cuánta bebida sale (rendimiento) y cuánto tarda (tiempo). Con esos tres, cualquier barista hace el mismo shot en cualquier turno.
Dosis: 18.0 g; Rendimiento: 36.0 g; Tiempo: 26–30 s; Temperatura: 93.5 °C, la fija el PID; Ratio: 1:2
Se pesa la bebida, no se mide en onzas: la crema ocupa volumen y engaña al ojo.
P: ¿Cuál es la receta base del espresso de la casa? R: 18 g de café → 36 g de bebida, en 26 a 30 segundos. Ratio 1:2.
P: ¿Por qué se pesa la bebida en lugar de medirla en volumen? R: Porque la crema ocupa volumen y cambia de un shot a otro. El peso no miente.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('leccion:l-ratio', null, 'leccion', 'l-ratio', 'Ratio: la proporción que define la taza', 'Ratio: la proporción que define la taza
El ratio es rendimiento ÷ dosis. 18 g → 36 g es 1:2. Un ratio más corto (1:1.5) concentra; uno más largo (1:2.5) abre la taza y la aligera.
La app calcula el ratio sola y marca la ventana de tolerancia: ±5 % del objetivo.
P: Sacas 40 g de bebida con 18 g de café. ¿Cuál es el ratio? R: 1:2.22 (40 ÷ 18).
P: ¿Qué le pasa a la taza si acortas el ratio? R: Sale más concentrada e intensa.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('leccion:l-leer', null, 'leccion', 'l-leer', 'Leer un shot: ácido o amargo', 'Leer un shot: ácido o amargo
Ácido, salado o delgado: subextraído, le faltó extracción. Amargo, seco o astringente: sobreextraído, se extrajo de más. El punto está en medio: dulce, con cuerpo y un final limpio.
Ácido → más fino. Amargo → más grueso. No muevas nada por tu cuenta además de lo que pide la app.
A veces la app pide dos cosas juntas, molienda y pulsos. No rompe la regla: moler más fino le quita peso a la taza, y los pulsos se lo devuelven. Es un solo ajuste, y la app dice qué tiempo y qué peso espera para que compruebes si acertó.
La brújula de sabor de la app tiene esos dos ejes: de ácido a amargo, y de débil a intenso. Toca dónde cae tu shot y te sugiere el siguiente ajuste.
P: El shot corre en 22 s y sabe ácido. ¿Qué ajustas primero? R: Molienda más fina.
P: ¿Qué significa que un shot sepa seco o astringente? R: Que está sobreextraído.
P: ¿Cuántas variables se cambian entre un shot y el siguiente? R: Solo lo que pide la app: una, o molienda y pulsos juntos cuando uno compensa al otro.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('leccion:l-texturizar', null, 'leccion', 'l-texturizar', 'Texturizar para flat white', 'Texturizar para flat white
Purga el vaporizador. Mete aire solo al inicio, 2 a 3 segundos, hasta que la leche gane un 10 % de volumen. Luego hunde un poco la punta y deja que el remolino integre la espuma.
Detén a 60–65 °C: es cuando ya no puedes sostener la jarra más de un segundo. Más caliente, la leche se quema y pierde dulzor.
(Receta: flat-white)
P: ¿A qué temperatura se detiene la leche? R: 60 a 65 °C.
P: ¿En qué momento se mete aire al texturizar? R: Solo al inicio, 2 a 3 segundos.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('leccion:l-vaporizador', null, 'leccion', 'l-vaporizador', 'Limpieza del vaporizador', 'Limpieza del vaporizador
Purga antes y después de cada uso. Limpia la punta de inmediato con el trapo exclusivo para leche: la leche seca tapa los orificios y contamina.
El trapo de la leche no se usa para nada más.
P: ¿Cuándo se purga el vaporizador? R: Antes y después de cada uso.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('leccion:l-criticas', null, 'leccion', 'l-criticas', 'Las tareas críticas del checklist', 'Las tareas críticas del checklist
En el checklist, las tareas en letra recta son críticas: tienen que ver con seguridad, inocuidad o dinero. No se saltan, y el turno no se cierra si falta una.
Cada tarea lleva iniciales y hora. Sin firma, la tarea cuenta como no hecha.
P: ¿Qué hace que una tarea sea crítica? R: Que tiene que ver con seguridad, inocuidad o dinero.
P: ¿Qué pasa con una tarea que no lleva firma? R: Cuenta como no hecha.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('leccion:l-temperaturas', null, 'leccion', 'l-temperaturas', 'Temperaturas de refrigeración', 'Temperaturas de refrigeración
La refrigeración va a máximo 7 °C (NOM-251, apartado 5.5.2) y el congelador debe mantener el producto congelado. Se revisa al checar el stock del refri en la apertura.
Si una lectura sale del límite: aislar el producto, anotar la acción y avisar al grupo.
P: ¿Cuál es la temperatura máxima de refrigeración? R: 7 °C (NOM-251).
P: Una lectura sale del límite. ¿Qué tres cosas haces? R: Aislar el producto, anotar la acción y avisar al grupo.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('leccion:l-calibrar', null, 'leccion', 'l-calibrar', 'Calibrar con método', 'Calibrar con método
Fija la dosis. Iguala el rendimiento a la receta: con botón, reprogramándolo; con continuo, cortando en la báscula. Con la receta igualada, mueve la molienda un paso y prueba. Anota cada shot: la gráfica de la sesión muestra si vas convergiendo hacia la zona objetivo.
Dosis fija → rendimiento → molienda. Si mueves dos cosas a la vez, no sabes cuál cambió el sabor.
P: ¿En qué orden se ajustan las variables al calibrar? R: Dosis fija, luego rendimiento, luego molienda.
P: ¿Por qué se cambia una sola variable a la vez? R: Para saber qué causó el cambio en el sabor.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('leccion:l-linea', null, 'leccion', 'l-linea', 'Calibrar en la Linea: botones volumétricos', 'Calibrar en la Linea: botones volumétricos
La Linea Classic AV es volumétrica: corta el shot sola. Dentro lleva un flujómetro, una ruedita con imanes que gira con el agua que entra al grupo. Cada giro es un pulso, y cada botón tiene programado un número de pulsos: al llegar, cierra.
Los pulsos cuentan el agua que entra, no la bebida que cae en la taza. Una parte del agua se queda en el café. Por eso, con los mismos pulsos, el peso cambia si cambias la molienda o la dosis: más fino o más café retienen más agua y cae un poco menos.
Botones: 4 dosis, en pulsos; Continuo: Cortas tú en la báscula; Tiempo: Lo marca la botonera; Temperatura: Un PID para todos los cafés
Molienda para el tiempo, pulsos para el peso. Si el tiempo ya está y el peso no, se cambian los pulsos del botón.
La canastilla manda en la dosis: cada una tiene su capacidad y la dosis debe quedar a 1 g de ella. De más, el café toca la regadera y el agua no se reparte; de menos, la pastilla queda aguada y el agua se abre camino. Si cambias de canastilla, se recalibra: otra dosis retiene otra cantidad de agua y los pulsos ya no dan el mismo peso.
La app te dice a cuántos pulsos pasar: sabe cuántos gramos mueve un pulso en nuestra máquina porque lo aprende de los shots. Después de cambiar pulsos, siempre se tira un shot y se pesa.
Si con los mismos pulsos el peso empieza a variar de un shot a otro sin que nadie mueva nada, avisa al encargado: puede ser la distribución o el flujómetro.
P: Con botón volumétrico, ¿con qué corriges el tiempo? R: Con la molienda.
P: El tiempo está en ventana pero el botón entrega 34 g en lugar de 36. ¿Qué haces? R: Subir los pulsos del botón (la app dice cuántos) y comprobar con un shot en la báscula.
P: ¿Qué cuenta un pulso? R: Un giro del flujómetro: agua que entra al grupo. No es bebida en taza, porque parte del agua se queda en el café.
P: ¿Cuánto se puede alejar la dosis de la capacidad de la canastilla? R: 1 g arriba o abajo. Fuera de eso se cambia la dosis o la canastilla, y se recalibra.
P: Mueles más fino sin tocar los pulsos. ¿Qué le pasa al peso en taza? R: Baja un poco: el café retiene más agua. Por eso siempre se pesa.
P: ¿Se puede poner una temperatura distinta para cada café? R: No: el PID de la caldera de café es uno para todos los cafés.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('leccion:l-reposo', null, 'leccion', 'l-reposo', 'Reposo del café', 'Reposo del café
Recién tostado, el café suelta CO₂ y corre irregular. Con los días se asienta, y normalmente hay que moler un poco más fino para mantener la receta.
En Calibrar, cada café muestra sus días de reposo y la tendencia de molienda contra reposo: es la memoria del equipo.
P: ¿Qué suele pasar con la molienda conforme el café reposa? R: Hay que moler un poco más fino.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('leccion:l-perfilar', null, 'leccion', 'l-perfilar', 'Perfilar un café nuevo', 'Perfilar un café nuevo
Arranca con la receta base y el reposo mínimo de 5 días. Explora el ratio de 1:1.8 a 1:2.4 con la misma molienda y quédate con el que muestre más dulzor. Esa es la receta objetivo que se registra en el catálogo.
P: ¿Qué rango de ratio exploras al perfilar un café nuevo? R: De 1:1.8 a 1:2.4.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('glosario:molienda', null, 'glosario', 'molienda', 'Molienda', 'Molienda: Qué tan fino muele el molino. Número más bajo = más fino. Más fino frena el agua: el shot tarda más y sale más intenso. Ejemplo: De 6 a 5.5 es moler un paso más fino.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('glosario:dosis', null, 'glosario', 'dosis', 'Dosis', 'Dosis: Cuántos gramos de café molido van en el portafiltro. Se pesa en la báscula. Ejemplo: 18 g en la canastilla de 18.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('glosario:rendimiento', null, 'glosario', 'rendimiento', 'Rendimiento', 'Rendimiento: Cuántos gramos de bebida caen en la taza. Se pesa con la taza en la báscula. Ejemplo: 36 g de espresso.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('glosario:ratio', null, 'glosario', 'ratio', 'Ratio', 'Ratio: Cuánta bebida sale por cada gramo de café: rendimiento ÷ dosis. Más corto concentra; más largo aligera. Ejemplo: 18 g → 36 g es 1:2.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('glosario:pulsos', null, 'glosario', 'pulsos', 'Pulsos', 'Pulsos: Lo que cuenta la máquina para saber cuánta agua pasar. Cada botón corta al llegar a sus pulsos. Cuenta agua que entra, no bebida que cae: por eso se pesa. Ejemplo: 120 pulsos ≈ 36 g en taza con nuestra receta.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('glosario:canastilla', null, 'glosario', 'canastilla', 'Canastilla', 'Canastilla: El filtro de metal dentro del portafiltro. Cada una tiene su capacidad en gramos y la dosis debe quedar a 1 g de ella. Ejemplo: En la de 18 g caben de 17 a 19 g.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('glosario:pid', null, 'glosario', 'pid', 'PID', 'PID: El control de temperatura de la caldera de café. Es uno para todos los cafés y solo lo cambia el encargado. Ejemplo: 93.5 °C.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('glosario:tiempo', null, 'glosario', 'tiempo', 'Tiempo del shot', 'Tiempo del shot: Los segundos que tarda en salir el espresso. Lo marca la pantalla de la máquina; aquí solo se anota. Ejemplo: 28 s, con margen de ± 2.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('glosario:validar', null, 'glosario', 'validar', 'Validar', 'Validar: Cuando el encargado revisa un checklist completado y confirma que está bien. Cierra el ciclo: quien lo hizo sabe que alguien lo vio.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('glosario:critica', null, 'glosario', 'critica', 'Tarea crítica', 'Tarea crítica: Una tarea de seguridad, inocuidad o dinero. El checklist no se puede completar sin ella.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('glosario:incidencia', null, 'glosario', 'incidencia', 'Incidencia', 'Incidencia: Un problema que hay que resolver: una lectura fuera de rango o algo que alguien reportó. Tiene responsable y no se cierra sin decir qué se hizo.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('glosario:jornada', null, 'glosario', 'jornada', 'Jornada', 'Jornada: El día de trabajo. Corta a las 5:00, así un cierre después de medianoche cuenta en el día que empezó.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;
insert into conocimiento.documentos (id, sucursal_id, fuente, fuente_id, titulo, texto, visibilidad) values ('glosario:receta', null, 'glosario', 'receta', 'Receta del día', 'Receta del día: La dosis, rendimiento, tiempo y molienda aprobados hoy al calibrar. Es la que usa todo el turno.', 'equipo') on conflict (fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null;

commit;
