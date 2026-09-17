/**
 * Mr. Sliders & Friends — configuración del evento.
 * Todo lo editable vive aquí. Ver README.md en esta carpeta para migrar a otro dominio.
 */

export const EVENT = {
  /** Nombre del evento */
  nombre: 'Mr. Sliders & Friends',
  /** Motivo */
  motivo: 'Primer aniversario',
  /**
   * Fecha y hora de la fiesta. Durango usa hora del centro sin horario de verano (UTC-6).
   * TODO: confirmar hora de inicio con el cliente (por ahora 20:00).
   */
  fecha: '2026-10-30T20:00:00-06:00',
  /** Momento en que se revela la ubicación exacta (una semana antes, misma hora) */
  revelacion: '2026-10-23T20:00:00-06:00',
  /** Lo que sí se puede decir desde ahora */
  zona: 'Barrio del Calvario',
  ciudad: 'Durango, Dgo.',
  /**
   * Ubicación exacta. Se muestra SOLO después de `revelacion`.
   * TODO: llenar con la dirección real antes del 23 de octubre.
   */
  direccion: 'Dirección por confirmar',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Barrio+del+Calvario+Durango',
  /** Instagram oficial: instagram.com/mrsliders */
  instagram: 'mrsliders',
  /**
   * Confirmados. Se muestra en la sección "Ya somos".
   * DEMO: número inflado para la presentación. Poner el real antes de publicarlo al público.
   */
  confirmados: 214,
  /**
   * Boletos. Si `ticketsUrl` está vacío, los botones mandan al DM de Instagram.
   * TODO: poner el link real de venta (Boletia, Eventbrite, WhatsApp, etc.).
   */
  ticketsUrl: '',
  /** Precio a mostrar (texto libre). Vacío = no se muestra. */
  precio: '',
  /** Cupo total. DEMO: se usa para la barra "% del cupo apartado". */
  cupo: 300,
  /** Texto corto del hero */
  tagline: 'Un año de smash. Una noche para celebrarlo.',
} as const;

/** Etiquetas del countdown (español) */
export const LABELS = { d: 'Días', h: 'Horas', m: 'Min', s: 'Seg' } as const;

/** Ruta base donde viven los assets estáticos (public/mr-sliders). Cambiar si se mueve la carpeta. */
export const ASSET_BASE = '/mr-sliders';

/** Enlace "Agregar a calendario" (Google Calendar, sin backend) */
export function googleCalendarUrl() {
  const start = new Date(EVENT.fecha);
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${EVENT.nombre} — ${EVENT.motivo}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `${EVENT.tagline} · ${EVENT.zona}, ${EVENT.ciudad}. La ubicación exacta se revela una semana antes.`,
    location: `${EVENT.zona}, ${EVENT.ciudad}`,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
