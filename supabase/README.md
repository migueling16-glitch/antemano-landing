# Ryo Café · Base de datos (Supabase)

La base de la app de barra (`/ryocafe/app`). Diseñada para tres lectores: la
app, una persona que analiza y **agentes de IA** que consultan, cruzan datos y
algún día ayudan a operar.

```
supabase/
├── migrations/          el esquema, en orden (se aplican tal cual en Supabase)
│   ├── …0100_operacion.sql          1. tablas que escribe la app
│   ├── …0200_seguridad.sql          2. quién ve y cambia qué (RLS) y reglas del servidor
│   ├── …0300_eventos.sql            3. historia de todo (auditoría y línea de tiempo)
│   ├── …0400_analitica.sql          4. capa semántica: vistas, métricas, glosario, herramientas de IA
│   ├── …0500_conocimiento_ia_externo.sql  5. texto buscable, chat de IA, datos de fuera
│   └── …0600_fotos_y_tiempo_real.sql      6. bucket de evidencias y cambios en vivo
├── semilla/ryo-durango.sql   la barra real para arrancar (la genera scripts/ryo-semilla-sql.mjs)
├── functions/invitar/        función del servidor que manda las invitaciones
└── pruebas/                  pruebas sin Supabase (PGlite: Postgres en WASM)
```

## Las seis capas

| Capa | Qué guarda | Quién la usa |
|---|---|---|
| **1. Operación** (`public`) | Personas, checklists y marcas, máquina, cafés, calibraciones y shots, horarios, incidencias, bitácora, capacitación | La app |
| **2. Eventos** (`public.eventos`) | Cada alta, cambio o baja: quién, qué, cuándo, jornada, antes y después. Solo se agrega | Auditoría, encargados, IA |
| **3. Semántica** (`analitica`) | 16 vistas legibles (nombres, no ids), 9 métricas definidas una sola vez, glosario | Panel, personas, IA |
| **4. Conocimiento** (`conocimiento`) | Todo el texto libre (bitácora, incidencias, notas, motivos) + recetas, lecciones y glosario; buscable por palabras (español) y listo para embeddings | IA |
| **5. IA** (`ia`) | Conversaciones, mensajes con tokens y costo, memoria por persona, hallazgos | Chat y reportes |
| **6. Externo** (`externo`) | Menú (50 productos), ventas del punto de venta, clima, insumos, compras, receta↔insumo y costo de receta | Análisis cruzado |

## Reglas de diseño (para que un agente no adivine)

- Nombres en español, **unidades en el nombre**: `dosis_g`, `tiempo_s`, `capacidad_g`, `precio_mxn`, `temp_c`.
- **Un comentario en cada tabla, vista y columna** (`public.describir_datos()` los junta).
- Valores cerrados con `CHECK` y su significado en el comentario.
- **Jornada** en todo: el día de negocio en hora de Durango (`America/Monterrey`), que corta a las 5:00. Un cierre a las 0:30 del sábado es jornada del viernes. `public.jornada_de(momento)`.
- Horas en `timestamptz` (UTC). "No se sabe" = `NULL`, nunca 0.
- Id de texto generados en el teléfono (funciona sin red; reintentar no duplica). Los checklists usan id fijo `ej-<plantilla>-<jornada>`: dos teléfonos sin red no los duplican.
- Las tareas de checklist no se borran: se retiran (`retirado`), para que la historia conserve su texto.
- El lote de café se identifica por `sesiones_calibracion.tueste` (= jornada − días de reposo).

## Seguridad

La llave publicable va en la app (es pública por diseño). Lo que protege los
datos es **RLS en todas las tablas** y **reglas en el servidor**:

- Solo los miembros activos de una sucursal ven y escriben lo suyo. Una cuenta sin persona no ve nada.
- Validar checklists, aprobar cambios de turno y ausencias, editar el catálogo: encargado o admin. Roles y altas/bajas: admin. Lo exige la base (`validar_transicion`), no la app.
- Lo personal (motivo de una ausencia, capacitación, disponibilidad) lo ven la persona y encargados. Para cubrir turnos, el equipo ve `ausencias_equipo`, sin motivo.
- La historia (`eventos`) la leen encargados; nadie la escribe más que el trigger.
- Las conversaciones con la IA son privadas de quien las tuvo.
- **Todo lo de IA corre con los permisos de quien pregunta**: un barista que pregunta por ausencias solo ve las suyas.
- La llave secreta solo vive en funciones del servidor (`functions/invitar`). Nunca en la app ni en el repo.

## Para agentes de IA: cómo consultar

1. **`public.describir_datos()`** → mapa de las vistas de `analitica` con cada columna y su significado, las métricas y el glosario. Llamarla primero.
2. **`public.metricas_periodo(sucursal, desde, hasta)`** → las 9 métricas del periodo y del periodo anterior de la misma duración (para comparar). No recalcular métricas a mano: `analitica.metricas` tiene la definición oficial.
3. **`public.consultar_analitica(consulta, limite)`** → un `SELECT`/`WITH` de solo lectura sobre las vistas, con los permisos de quien pregunta. Devuelve JSON (hasta 1000 filas).
4. **`public.buscar_conocimiento(texto, limite)`** → busca en notas, incidencias, recetas y lecciones por palabras en español (raíces y sin acentos: "técnicos" encuentra "técnico"). No conoce sinónimos ("refri" ≠ "refrigerador"): para eso, embeddings (`public.conocimiento_similar`).

Vistas más útiles para cruzar: `analitica.resumen_dia` (una fila por jornada),
`analitica.shots` y `analitica.calibraciones` (café, lote, reposo, barista,
molino, canastilla), `analitica.checklists` y `analitica.marcas` (lecturas
como la temperatura del refri), `analitica.turnos` y `analitica.cobertura_dia`,
`analitica.incidencias`, `externo.costo_receta`.

Ejemplos de preguntas cruzadas:

```sql
-- ¿Quién calibra en menos shots el blend, según los días de reposo del lote?
select barista, dias_reposo, round(avg(shots), 1) as shots
from analitica.calibraciones where es_casa and aprobada group by 1, 2 order by 2, 3;

-- ¿Cuándo se salió de rango el refri y quién estaba de turno?
select m.jornada, m.valor, m.unidad, m.marcada_por, string_agg(t.persona, ', ') as en_turno
from analitica.marcas m left join analitica.turnos t on t.fecha = m.jornada
where m.fuera_de_rango group by 1, 2, 3, 4 order by 1 desc;
```

Con el servidor MCP de Supabase, un agente de desarrollo (Claude Code) puede
consultar directo: **solo lectura y limitado al proyecto**
(`read_only=true&project_ref=…`). Nunca darle ese acceso a usuarios finales.

## Cómo se conecta la app

`src/ryo/app/nube/`: `config.ts` (URL y llave publicable), `tablas.ts`
(Estado ↔ filas, probado ida y vuelta) y `sync.ts` ("local primero": la app
sigue trabajando en el teléfono; cada cambio se sube en orden, sin red
espera en cola; Realtime trae lo de los demás; fotos a Storage). La demo
(datos de ejemplo, solo en el teléfono) sigue aparte y nunca toca la base.

## Pruebas

```bash
node supabase/pruebas/probar.mjs
```

Corre las 6 migraciones en PGlite con los datos de ejemplo de la app y revisa
(77 pruebas): ida y vuelta app↔tablas, que los datos entren, qué ve cada rol,
las reglas del servidor, la historia, que cada vista tenga datos, que las
métricas en SQL den lo mismo que el Panel de la app, y las herramientas de IA
(solo lectura, con permisos).

## Poner en marcha un proyecto nuevo

1. Correr las migraciones en orden (editor SQL de Supabase, o `supabase db push`).
2. `node scripts/ryo-semilla-sql.mjs` y correr `semilla/ryo-durango.sql`.
3. Dar de alta al primer admin (una fila en `personas` con su correo) e invitarlo desde Supabase → Authentication.
4. Authentication → URL Configuration: Site URL `https://antemano.com.mx/ryocafe/app/` y, para probar en local, `http://localhost:4321/ryocafe/app/` en Redirect URLs. Desactivar "Allow new users to sign up" (solo con invitación).
5. Publicar `functions/invitar`.
6. Poner la URL y la llave publicable en `src/ryo/app/nube/config.ts`.

## Plan gratis: los dos cuidados

- **Se pausa tras 7 días sin actividad.** Con uso diario no pasa; si la barra para, hace falta una consulta automática diaria (GitHub Action).
- **No trae respaldos.** Pendiente: `pg_dump` semanal desde GitHub Actions (necesita la contraseña de la base como secreto de GitHub; la pone el dueño).

## Pendiente

- Embeddings multilingües (el modelo integrado de Supabase, gte-small, solo entiende inglés) y la función que los calcula.
- El chat: una Edge Function con la API de Claude y las cuatro herramientas de arriba; registra tokens y costo en `ia.mensajes`.
- Integraciones: punto de venta → `externo.ventas`, clima → `externo.clima`, insumos de la entrevista de menú → `externo.insumos` y `externo.receta_insumos`.
- Cargar solo los últimos meses al teléfono cuando la historia crezca (hoy carga todo).
