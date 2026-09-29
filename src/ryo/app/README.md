# Ryo Café · app de barra (maqueta)

Maqueta navegable del sistema de gestión de la barra, pensada para usarse en
el celular personal de cada barista. No tiene backend: todo vive en el
teléfono (`localStorage` con la clave `ryo-app:v7` y las fotos en IndexedDB).

- Ruta: `/ryocafe/app` (página en `src/pages/ryocafe/app.astro`, noindex).
- SPA de React con rutas en el hash (`#/calibrar/nueva`), así funciona detrás
  de una sola página estática.
- PWA instalable: `public/ryo/app/manifest.webmanifest` e íconos. Sin service
  worker todavía.
- Apertura: la misma intro dibujada de la bio (el isotipo trazo a trazo, un
  elemento a la vez), en `app.astro`, con la pluma de
  `src/ryo/assets/isotipo-trazo.svg`. Una vez por sesión; `?apertura` la repite.

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

## Calibrar

- **Una receta del día por café.** El inicio de Calibrar es un tablero: cada
  café dice si ya tiene receta, si alguien lo está calibrando o si falta, y
  con qué molienda arrancar. Las bebidas del menú usan la del café de la casa
  (`casa: true`).
- **Punto de partida:** con cuatro calibraciones o más, la tendencia de
  molienda contra días de reposo; si no, lo último que funcionó.
- **Capturar el shot:** los steppers también se arrastran de lado a lado (un
  paso cada 14 px) y responden a las flechas. Debajo de cada uno se lee qué
  cambió contra el shot anterior y si es el ajuste sugerido; si se mueven
  molienda y dosis a la vez, la app lo señala. El shot aparece en la gráfica
  de la sesión y se mueve con los números.
- **Probar:** la brújula guarda el rastro de los shots anteriores y tiene
  atajos (ácido, amargo, débil, intenso, balanceado) que mueven un eje.
- **Corregir y deshacer:** un shot sin probar se puede corregir; terminar una
  sesión se deshace desde el aviso o con "Reabrir la sesión".
- **Al aprobar:** "Qué sigue" lleva al siguiente café sin receta.

## Inicio de sesión y perfiles de ejemplo

La app abre en **Inicia sesión** (correo y contraseña). En la maqueta entra
cualquier correo del equipo con una contraseña de 4 caracteres o más; los
perfiles de prueba llenan los datos de un toque. Sin "Mantener la sesión en
este teléfono", volver a abrir la app pide iniciar sesión (recargar no).

Perfiles: Ana (barista 2), Diego (barista 1, en su ruta de ingreso), Carla
(encargada) y Sofía (admin). Se cambia en Más → Ver como otro perfil;
Más → Reiniciar vuelve a los datos de ejemplo.
