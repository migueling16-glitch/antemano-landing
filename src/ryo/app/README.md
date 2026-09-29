# Ryo Café · app de barra (maqueta)

Maqueta navegable del sistema de gestión de la barra, pensada para usarse en
el celular personal de cada barista. No tiene backend: todo vive en el
teléfono (`localStorage` con la clave `ryo-app:v5` y las fotos en IndexedDB).

- Ruta: `/ryocafe/app` (página en `src/pages/ryocafe/app.astro`, noindex).
- SPA de React con rutas en el hash (`#/calibrar/nueva`), así funciona detrás
  de una sola página estática.
- PWA instalable: `public/ryo/app/manifest.webmanifest` e íconos. Sin service
  worker todavía.

## Estructura

| Archivo | Qué tiene |
| --- | --- |
| `App.tsx` | Rutas, barra inferior, tema, modo enfoque, aviso sin red |
| `estado.ts` | Tipos, almacén y todas las acciones (lo que luego será la API) |
| `semilla.ts` | Datos de ejemplo relativos a hoy; `VERSION` descarta lo guardado viejo |
| `contenido.ts` | Recetas, lecciones, rúbricas y ruta de ingreso |
| `componentes.tsx` | Piezas del design system que no existían: stepper, brújula, gauge, gráficas, hoja |
| `lib/calibracion.ts` | Matemática y criterio de calibración (`sugerir`) |
| `lib/fotos.ts` | Compresión a 1600 px, sello y guardado de evidencias |
| `lib/repaso.ts` | Repaso espaciado 1 · 3 · 7 · 14 · 30 días |
| `lib/tiempo.ts` | Hora de Durango y jornada que corta a las 5:00 |
| `pantallas/` | Una pantalla por módulo |

## La máquina

Calibración hecha para la **La Marzocco Linea Classic AV de un grupo** de Ryo:

- Botón volumétrico: la máquina corta sola. La molienda mueve el tiempo; el
  peso se cambia reprogramando el botón (la app da los pasos y anota lo que
  entrega cada botón).
- Continuo: el barista corta en la báscula (cafés invitados).
- El tiempo lo marca la botonera: la app lo captura con un stepper, no lo
  cronometra.
- Un solo PID en la caldera de café: la temperatura es de la máquina, no del
  café. Se cambia en Administración → Máquina.

## Perfiles de ejemplo

Ana (barista 2), Diego (barista 1, en su ruta de ingreso), Carla (encargada)
y Sofía (admin). Se cambia en Más → Ver como otro perfil; Más → Reiniciar
vuelve a los datos de ejemplo.
