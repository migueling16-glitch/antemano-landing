# Ryo Café — checklist de apertura y cierre (demo)

El PDF de operación de barra (`RyoCafe_Checklist_Apertura_Cierre.pdf`,
septiembre 2026), vivo. Cada regla escrita en el documento se volvió algo que
la página hace cumplir, en vez de algo que alguien tiene que acordarse de hacer.

Ruta: `/ryocafe/checklist` (antemano.com.mx/ryocafe/checklist).
Sin backend: el progreso se guarda en el teléfono.

## Qué hay aquí

```
src/ryo/checklist/
├── Checklist.astro   página completa (HTML + CSS + JS, autocontenida)
├── datos.ts          las 64 tareas, límites y periódicas  ← lo único que hay que editar
└── README.md

src/pages/ryocafe/checklist.astro   wrapper de 3 líneas que monta la página
```

Reutiliza de la página de bio: `ahoraEnDurango()` de `src/ryo/config.ts`, el
isotipo de `src/ryo/assets/` y el favicon de `public/ryo/`.

## De regla escrita a regla que se cumple

| Lo que dice el PDF | Lo que hace la página |
| --- | --- |
| "Cada tarea lleva iniciales y hora. Sin firma, la tarea cuenta como no hecha." | Cada casilla estampa iniciales y hora solas. Si no hay iniciales, tocar una casilla abre la hoja "¿Quién hace el turno?" y, al firmar, esa misma casilla queda marcada. Solo pasa la primera vez: después cada toque marca al instante. |
| "Las tareas en letra recta son críticas. No se saltan." | Misma convención tipográfica (recta = crítica, itálica = normal) más la etiqueta CRÍTICA. No se puede finalizar el turno con críticas pendientes: la página las lista. |
| Bitácora de temperaturas, máximo 7 °C (NOM-251). "Si una lectura sale del límite: aislar, anotar la acción, avisar al grupo." | Las lecturas se capturan dentro de la tarea. Sin lecturas no se firma. Arriba de 7 °C aparece el protocolo y no se firma hasta anotar la acción tomada. Si después cambian las lecturas y ya no cumplen, la firma se cae. |
| Bitácora de calibración: "Extracción % = TDS % × bebida ÷ dosis. Referencia 18 a 22 %, TDS de 8 a 12 %." | La extracción se calcula sola y se compara con la referencia. Sin dosis, bebida, tiempo y TDS no se firma. (El ejemplo del PDF, 10 × 36 ÷ 18, da 20.0 % en referencia.) |
| "Leer la bitácora del cierre anterior: pendientes, faltantes y fallas." | La apertura muestra lo que dejó el cierre anterior guardado en el teléfono: faltantes, incidencias y tareas que quedaron sin hacer. |
| "Anotar faltantes para mañana." | Escribirlos firma la tarea, y pasan al reporte y a la apertura siguiente. |
| "Al cerrar, el reporte se manda al grupo de WhatsApp con foto de la barra." | El reporte se arma solo con tareas, críticas, temperaturas, faltantes y los datos del turno. "Mandar al grupo" abre el menú de compartir del teléfono (o WhatsApp); mandarlo firma la tarea. La foto se adjunta en WhatsApp. |

## Detalles que importan en barra

- **Tocar una casilla siempre responde.** La primera versión negaba el toque
  sin iniciales y brincaba arriba al campo; desde fuera se veía como "no pasa
  nada". Ahora sube la hoja de firma y completa el toque. Las tareas que
  necesitan datos (temperatura, calibración) llevan al campo que falta y lo
  enfocan, en vez de solo negarse.
- **Se siente el toque.** La casilla se hunde al presionar y rebota al
  marcarse; en Android además vibra 8 ms.
- **Las primeras tareas se ven sin hacer scroll.** La firma es una sola línea
  (fecha · responsable) y el encabezado del turno es compacto.

- **La jornada corta a las 5:00.** Un cierre que termina a las 0:30 sigue siendo
  del día anterior; si no, al recargar después de medianoche arrancaría un
  registro vacío a la mitad del cierre.
- **Turno inicial por la hora.** Antes de las 14:00 de Durango abre en apertura;
  después, en cierre. Se recuerda la pestaña elegida en la sesión.
- **Tema por la hora.** Champagne de día, café de noche — el cierre es de noche.
  Comparte la preferencia con la página de bio.
- **Campos de 16 px.** Por debajo de eso el celular hace zoom al enfocar, que en
  barra con las manos ocupadas es un estorbo. Los botones llevan
  `touch-action: manipulation` para que los toques rápidos no hagan zoom.
- **Temperaturas sin `inputmode="decimal"`.** El teclado decimal de iOS no trae
  signo menos, y el congelador se lee bajo cero.
- **Quitar una firma se puede deshacer** durante 5 s, y se recupera la hora
  original, no una nueva.
- **"Siguiente ↓"** en la barra de progreso lleva a la primera tarea pendiente
  (y la marca con un filete). Con todo hecho cambia a "Finalizar ↓", y con el
  turno cerrado a "Resumen ↓".
- **Tablet abierta toda la noche.** La página revisa la jornada al volver a
  primer plano y cada 5 minutos; si cambió, recarga para no grabar la apertura
  en el día anterior. La pestaña elegida se recuerda solo dentro de la misma
  jornada.
- **Turno finalizado = solo lectura.** Se puede reabrir.
- Dos colores y nada más: las alertas son bloques invertidos, no rojos.

## Guardado

`localStorage`, por jornada y turno:

- `ryo-checklist:v1:<AAAA-MM-DD>:<apertura|cierre>` — firmas, lecturas,
  calibración, faltantes, reporte y hora de finalizado.
- `ryo-checklist:persona` — nombre e iniciales, para no escribirlos cada turno.

**Solo vive en ese teléfono.** Si apertura y cierre los hacen personas en
teléfonos distintos, "leer el cierre anterior" no encuentra nada. Para el uso
real conviene un teléfono o tablet fija en la barra, o pasar a un backend (ver
abajo).

Si se reordenan o cambian las tareas en `datos.ts`, sube `VERSION_DATOS`: el
progreso guardado con el orden viejo se ignora en vez de marcar casillas
equivocadas.

## Seguridad — antes del uso real

El PDF dice "Documento interno". Esta demo vive en una URL pública:

- Lleva `noindex, nofollow` y no se enlaza desde la página de bio.
- **El aviso "Si se cierra solo" no publica días ni hora.** El PDF dice
  "viernes y sábado 0:30"; en una página pública eso le dice a cualquiera
  cuándo encontrar a una persona sola saliendo del local después de contar el
  efectivo. Las precauciones sí se quedan. Está explicado en `datos.ts`.
- Noindex **no es protección**: cualquiera con el link lo ve. Para uso real,
  ponerlo detrás de acceso de verdad — Vercel Deployment Protection o un
  middleware con contraseña. Un PIN en la propia página no sirve en un sitio
  estático: el contenido ya viaja en el HTML.

## Lo que falta para producción

- **Backend compartido** para que el historial no dependa de un teléfono y los
  socios revisen la semana desde cualquier lado (el PDF: "los socios revisan
  las hojas una vez por semana"). Con eso salen también las vistas semanales de
  las bitácoras de temperatura y calibración, que hoy se capturan por turno.
- Adjuntar la foto de la barra desde la página.
- Número del grupo de WhatsApp, si quieren que "Mandar al grupo" abra el chat
  directo en lugar del menú de compartir.
