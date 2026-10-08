-- ═══════════════════════════════════════════════════════════════════
-- Ryo Café · App de barra · 6. Fotos de evidencia y cambios en vivo
-- ═══════════════════════════════════════════════════════════════════

/* ─── Bucket privado de evidencias ───
 * Ruta: "<sucursal_id>/<foto_id>.jpg". Solo los miembros de esa sucursal
 * suben y ven; borrar, solo encargados. Las fotos llegan ya comprimidas
 * desde el teléfono (lib/fotos.ts). */

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 2097152, array['image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "miembros ven evidencias" on storage.objects for select to authenticated
  using (bucket_id = 'evidencias' and public.es_miembro((storage.foldername(name))[1]));
create policy "miembros suben evidencias" on storage.objects for insert to authenticated
  with check (bucket_id = 'evidencias' and public.es_miembro((storage.foldername(name))[1]));
create policy "encargados borran evidencias" on storage.objects for delete to authenticated
  using (bucket_id = 'evidencias' and public.es_encargado((storage.foldername(name))[1]));

/* ─── Cambios en vivo ───
 * Lo que cambia un teléfono le llega a los demás de la sucursal (Realtime
 * respeta las reglas RLS de cada tabla). */

alter publication supabase_realtime add table
  public.personas, public.plantillas, public.plantilla_items, public.ejecuciones, public.marcas, public.fotos,
  public.equipos, public.botones, public.canastillas, public.cafes, public.sesiones_calibracion, public.shots,
  public.recetas_del_dia, public.turnos_tipo, public.semanas, public.asignaciones, public.disponibilidad,
  public.cambios_turno, public.ausencias, public.incidencias, public.incidencia_seguimiento, public.bitacora,
  public.notificaciones, public.lecciones_completadas, public.repasos, public.evaluaciones, public.lecciones_asignadas;
