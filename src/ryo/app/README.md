# Ryo Café · app de barra (maqueta)

Maqueta navegable del sistema de gestión de la barra, pensada para usarse en
el celular personal de cada barista. No tiene backend: todo vive en el
teléfono (`localStorage` con la clave `ryo-app:v12` y las fotos en IndexedDB).

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
| `componentes.tsx` | Piezas del design system que no existían: stepper, brújula, gráficas, hoja, estados |
| `lib/calibracion.ts` | Matemática y criterio de calibración (`sugerir`) |
| `lib/fotos.ts` | Compresión a 1600 px, sello y guardado de evidencias |
| `lib/repaso.ts` | Repaso espaciado 1 · 3 · 7 · 14 · 30 días |
| `lib/tiempo.ts` | Hora de Durango y jornada que corta a las 5:00 |
| `pantallas/` | Una pantalla por módulo |

## Cómo se lee la app (y de dónde sale)

Reglas para que nadie tenga que adivinar, cada una con su fuente:

- **Solo los botones son cajas.** Un estado es cuadrito + palabra (lleno
  listo, vacío en curso, punteado pendiente; un problema va invertido con
  "!"). Lo que lleva a otra pantalla termina en →. Con señales débiles de
  "esto se toca", la gente tarda 22 % más y mira 25 % más de puntos
  ([NN/g, eyetracking con 71 personas](https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/)).
- **Secciones = fichas** con su pestaña invertida: región común con límite
  claro, pocos tamaños de letra ([NN/g, jerarquía visual](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)).
- **Negrita (700) contra regular (400).** Extensión de la marca, que solo
  trae regular e itálica: va en títulos, pestañas, lo principal de cada
  fila, cifras, botones y alertas. Mayúsculas solo en palabras sueltas
  (etiquetas, botones), nunca en frases.
- **Inicio dice qué hacer ahora.** "Ahora" es lo siguiente por hacer con un
  solo botón; "Lo que toca hoy" son casillas que se llenan. Hacer la acción
  fácil y avisar en el momento pesa más que motivar (modelo de Fogg,
  B = MAP); la barra que se llena usa el gradiente de meta (Nunes y Drèze,
  2006: 34 % contra 19 % terminó la tarjeta que ya traía avance).
- **Sin rachas ni ranking.** Quitar las rachas de GitHub cambió cómo
  trabajaba la gente, incluso en fines de semana (Moldon et al., ICSE
  2021); en un trabajo por turnos, una racha castiga el día de descanso.
  "Tu semana" enseña lo que cada quien lleva y solo lo ve esa persona.
- **Cambios de turno sin sorpresas:** antes de pedir, se ve cómo le queda a
  cada compañero (horas, descanso, disponibilidad) y cómo quedaría el día.

## Reglas para que se entienda sin explicación

Del segundo pase de UX (investigación en NN/g, WCAG 2.2, Hoober, estudios
de legibilidad):

- **Letra:**
  - Una escala fija: `--t-meta`, `--t-sec`, `--t-base`, `--t-sub`,
    `--t-tit`, más `--t-num` y `--t-cifra` para números. Antes había 35
    tallas distintas.
  - Todo va en rem, así que **Más → Tamaño de letra** (Normal, Grande, Muy
    grande) agranda la app completa.
  - Sin itálica en textos: la itálica es 10–50 % menos legible en párrafos,
    y queda solo para ejemplos.
  - Mayúsculas solo en palabras sueltas. El tracking de la marca (0.1em)
    va solo en mayúsculas; el texto corrido usa 0.02em.
- **Tono:** lo secundario va en la misma tinta al 70 % (`--suave`, contraste
  de 5:1 o más) y el placeholder más tenue, con "Ej.", para que no parezca un
  dato ya escrito.
- **Tres tipos de sección, distinguibles de un vistazo:**
  - protagonista invertida: lo que toca ahora;
  - ficha con recuadro: donde se registra o se elige;
  - **consulta**, con fondo tenue y sin recuadro: solo para leer
    (`<Seccion consulta>`).
- **Cómo dividir una pantalla:**
  - **pestañas internas** (`Pestanas`) para vistas hermanas del mismo tema:
    Panel (Hoy · Datos · Equipo · Más), Calibrar (Cafés · Máquina ·
    Sesiones), Checklists (Hoy · Historial) y Horarios (Semana · Mes · Hoy
    en barra). Se quedan pegadas arriba y la vista vive en la ruta;
  - **chips** para filtrar;
  - **botones** para hacer;
  - **filas con →** para ir a otra pantalla.

  Un nivel extra como máximo (divulgación progresiva).
- **Botones:**
  - Uno principal por pantalla: lleno, abajo, al alcance del pulgar.
  - Los secundarios con recuadro; los terciarios como enlace.
  - Nada que cierre o borre en las esquinas de arriba (el 49 % usa el
    teléfono con una mano). Por eso "Terminar sin receta" bajó.
  - Áreas táctiles de 44–48 px.
- **Símbolos:**
  - ✓ hecho, ! problema, → ir, siempre junto a su palabra;
  - pendientes como número en las pestañas.
- **Ayuda en el momento, no tutorial:**
  - una **pista** corta la primera vez en cada pantalla (`Pista`; se pueden
    volver a ver desde Más);
  - las palabras de la barra con **"¿Qué es?"** a un toque (`Termino`,
    glosario en `contenido.ts`).
- **Inicio sabe si estás en turno:**
  - en turno, "Ahora" es lo siguiente de la barra;
  - fuera de turno, solo lo tuyo (repaso, incidencias, cambios), y lo de la
    barra se ve como información;
  - la lista no repite lo que ya está en "Ahora".

## Panel del encargado y del admin

Para encargado y admin, la quinta pestaña es **Panel** en lugar de Más (Más
queda dentro). Está ordenado por gestión por excepción:

- **Por decidir:** solo lo que espera una decisión, con el botón ahí mismo.
  Los checklists completos y sin lecturas fuera de rango se validan **en
  lote** con un toque, y se puede deshacer. Cambios de turno sin alertas y
  días libres se aprueban desde la bandeja (como Deputy desde el celular).
- **Hoy en vivo:** checklists, recetas del día, quién está en barra, huecos,
  incidencias y la nota fijada de la bitácora.
- **Indicadores** (`lib/indicadores.ts`): 7 días contra los 7 anteriores,
  como hace Toast:
  - checklists a tiempo;
  - horas para validar;
  - incidencias nuevas;
  - shots por receta;
  - horas sin nadie en barra;
  - repasos al día.

  Cada uno lleva su mini gráfica de barras (sparkline, Tufte) y un detalle
  de 14 días. Sin pasteles ni velocímetros (NN/g: largo y posición se leen
  más rápido).
- **Equipo:** una fila por persona con lo que hay que mirar (atrasos,
  repasos vencidos, alertas de horario) y su ficha completa.
- **Incidencias:** una lectura fuera de rango abre una sola; cualquiera
  puede reportar un problema desde Checklists. Cada una tiene responsable,
  fecha, seguimiento y un cierre con nota (como las acciones de
  SafetyCulture y Crunchtime). A quien se le asigna le aparece en su Inicio.
- **Bitácora:** notas por día y categoría, fijables y con búsqueda (como el
  log book de 7shifts).
- **Reporte de la semana:** texto listo para compartir o copiar.
- **Editor de plantillas** (Administración): datos, frecuencia, hora límite
  y tareas. Las tareas se agregan, se editan en una hoja (tipo, rango, foto,
  crítica), se ordenan con ↑ ↓ y se borran con deshacer.

## La máquina

Calibración hecha para la **La Marzocco Linea Classic AV de un grupo** de Ryo:

- Volumétrica, programada en **pulsos**: el flujómetro gira con el agua que
  entra al grupo y el botón corta al llegar a sus pulsos. Cuenta agua, no
  bebida: con los mismos pulsos el peso cambia si cambian molienda o dosis.
  La molienda mueve el tiempo; el peso se corrige con pulsos. La app guarda
  los pulsos de cada botón y de cada shot, aprende cuántos gramos en taza
  mueve un pulso (dos shots seguidos con igual molienda y dosis y distintos
  pulsos) y dice "de 120 a 124 pulsos". Se corrige en Administración →
  Máquina.
- **El modelo** (`lib/calibracion.ts`): tiempo y peso dependen a la vez de
  molienda y pulsos. La app aprende de los shots de cada café cuánto mueve
  cada perilla (s y g por punto de molienda, g y s por pulso), pone la meta
  en la receta movida por el sabor, y resuelve las dos ecuaciones juntas:
  puede pedir molienda y pulsos en un mismo shot, dice qué tiempo y peso
  espera, y en el shot siguiente compara lo esperado con lo que salió.
- **Canastillas** con su capacidad: la dosis debe quedar a 1 g. La sesión
  guarda con cuál se calibró y avisa si la dosis no cabe.
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
