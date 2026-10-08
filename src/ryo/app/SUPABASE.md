# App de barra + Supabase

**Estado (8-oct-2026):** base construida y probada; falta conectarla al
proyecto de Supabase (`ryo-cafe`, organización Antemano, plan gratis, East US).

La documentación completa (capas, seguridad, cómo consultar para agentes de
IA, pruebas, puesta en marcha) está en [`supabase/README.md`](../../../supabase/README.md).

## Lo que se decidió

- **Demo y equipo real separados.** "Ver la demo" sigue con datos de ejemplo
  solo en el teléfono y nunca toca la base. "Iniciar sesión" es el equipo real
  en Supabase, solo con invitación. Mientras `nube/config.ts` no tenga la URL
  y la llave, la app es la demo de siempre.
- **Base pensada para IA**: tablas con nombres y unidades explícitas y un
  comentario en cada columna, historia de eventos, capa semántica
  (`analitica`) con métricas definidas una vez, conocimiento buscable y
  herramientas de consulta con los permisos de quien pregunta.
- **Local primero**: la app sigue trabajando en el teléfono (instantánea, sin
  red); `nube/sync.ts` sube cada cambio en orden, guarda en cola sin red y
  trae en vivo lo de los demás.
- **Reglas en el servidor**: quién valida, aprueba, cambia roles o ve motivos
  lo decide la base (RLS y `validar_transicion`), no la app.

## Para conectarlo

1. Crear el proyecto (la contraseña de la base la genera y guarda el dueño).
2. Migraciones, semilla, primer admin, URLs de Auth, función `invitar` y
   `nube/config.ts`: pasos en `supabase/README.md`.
