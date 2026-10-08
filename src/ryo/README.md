# Ryo Café — página para el bio de Instagram

Página de un solo scroll pensada para el link del bio: la acción principal es
**cómo llegar**, y debajo viven el menú, los horarios y las redes. Construida
sobre el design system de Ryo Café (dos colores, JetBrains Mono, bloques planos).

Ruta actual: `/ryocafe` en la web de Antemano (antemano.com.mx/ryocafe) · Astro 4 + Vercel.

## Qué hay aquí

```
src/ryo/
├── RyoCafe.astro       página completa (HTML + CSS + JS, autocontenida)
├── Menu.astro          el menú interactivo (pestañas, buscador, compartir); lo usan la landing y /ryocafe/menu
├── menuGuia.ts         lo que ayuda a elegir: firmas, "qué es", etiquetas y cómo va cada vaso
├── vaso.ts             el dibujo de cada bebida por dentro (lo usan el menú y la app)
├── config.ts           contenido, horarios, menú, accesos  ← lo único que hay que editar
├── pluma.ts            cómo se dibuja el isotipo (intro de la bio y apertura de la app)
├── assets/             marcas en SVG con fill="currentColor" (toman el color del tema)
│   ├── logotipo.svg      manuscrito "Ryo Café" — marca principal
│   ├── isotipo.svg       la taza con la figura dentro — formatos pequeños
│   ├── tagline.svg       SOFT LIVING, DEEP SIPING.
│   └── auxiliar.svg      R Y O / C A F É en mono
└── README.md

src/pages/ryocafe.astro wrapper de 3 líneas que monta la página en la ruta
src/pages/ryocafe/menu.astro  página ligera solo con el menú: es a donde apunta el QR

public/ryo/
├── qr/                 QR del menú (SVG, PNG) y tarjeta A6 para la barra (PDF, PNG)
├── favicon.svg         isotipo sobre champagne
├── og.png              imagen para compartir (se rehace con scripts/ryo-og.py)
└── marcas/             los 8 masters de dos tintas, tal como vienen del manual

scripts/ryo-og.py         regenera public/ryo/og.png
scripts/ryo-qr.py         regenera el QR y la tarjeta de barra (y verifica que se lean)
scripts/ryo-centerline.py regenera src/ryo/assets/isotipo-trazo.svg
```

Las marcas de `assets/` son los mismos vectores del manual, con la tinta
cambiada a `currentColor`: así un solo archivo sirve para los dos temas y el
color siempre sale de `--ink`, que solo puede ser champagne o café. El isotipo
sale cuatro veces, así que se define una vez como `<symbol id="ryo-iso">` y la
barra, el hero y el manifiesto lo llaman con `<use>`. La copia del intro sí va
inline aparte: para dibujarla trazo por trazo hay que llegar a cada `<path>`,
y dentro de un `<use>` no se puede. Los masters
originales de dos tintas siguen intactos en `public/ryo/marcas/` por si se
necesitan para impresión o para usarlos con `<img>`.

> Nota: el master `logotipo-001-cafe.svg` viene en `#2B2217`, un pelo distinto
> al `#302413` del manual. Las versiones `currentColor` usan el color exacto.

## Editar contenido

Todo vive en `config.ts`:

| Campo                  | Qué es                                                                 |
| ---------------------- | ---------------------------------------------------------------------- |
| `NEGOCIO.direccion`    | Dirección exacta. Confirmada por el cliente.                           |
| `NEGOCIO.mapsUrl`      | Link del pin real de Google Maps. Hoy es una búsqueda por dirección.   |
| `NEGOCIO.instagram`    | Handle sin `@`. Confirmado: `ryocafe_`.                                 |
| `NEGOCIO.whatsapp`     | Solo dígitos con lada país. Al llenarlo, poner `activo: true` en el acceso. |
| `NEGOCIO.slogan`       | Slogan del manual. Va tal cual, en inglés y mayúsculas.                |
| `HORARIO`              | Un renglón por día. `cierra: null` = cerrado. Alimenta el estado en vivo y la tabla. |
| `ACCESOS`              | Los destinos. `activo: false` los deja escritos pero apagados.         |
| `MANIFIESTO`           | Líneas del manifiesto; cada una se revela por separado.                |
| `MENU`                 | El menú oficial (PDF Ryo-Menu-Oficial-A5): Bebidas, Bar y Cocina, con precios y variantes. Cócteles y mocktails aún sin precio. |
| `MENU_TABS`            | Las 5 pestañas (Café, Matcha, Sin café, Bar, Cocina), la parte del PDF a la que pertenece cada una y cuáles van en fondo oscuro. Cada grupo de `MENU` dice en qué pestaña va (`tab`). |
| `MENU_URL`             | Dirección del menú que lleva el QR. Si cambia, hay que regenerar y reimprimir el QR. |
| `MENU_ES_DEMO`         | `true` muestra el aviso de "menú de muestra". Poner en `false` al publicar el real. |
| `MENU_MOSTRAR_PRECIOS` | `true` (precios del menú oficial). `false` oculta todos los precios sin tocar los datos. |
| `TEMA_AUTO`            | Horas entre las que la página abre en tema claro.                      |

Los tiempos del intro viven en `RyoCafe.astro` (`DIBUJO`, 1.43 s de trazo) y
la forma de dibujar en `pluma.ts`, que comparte con la apertura de la app.

Pendientes marcados con `TODO` en el archivo: link del pin real de Maps,
WhatsApp, horarios reales y el menú definitivo.

### Sobre los accesos

La investigación de páginas de bio coincide en una regla: **entre 3 y 7 destinos
y uno dominante**. Hoy hay tres visibles (Menú, Horarios, Instagram) más el
botón grande de Maps. Los demás están escritos en `config.ts` con
`activo: false`; se prenden cambiando ese valor y llenando el `href`. Si se
activan todos, conviene apagar alguno para no pasar de siete.

## Cómo funciona

- **Estado en vivo.** `estadoDe()` en `config.ts` calcula si el local está
  abierto usando la hora de pared de Durango (UTC-6 fijo, sin horario de
  verano). Se renderiza en el build y el navegador lo recalcula al cargar y
  cada minuto, así que el HTML estático nunca se ve desfasado. También marca
  el día de hoy en la tabla de horarios.
- **Tema Champagne ⇄ Café.** Son los dos temas del design system, que son las
  dos tintas del logotipo. Sin preferencia guardada, la página abre en claro
  entre las 7:00 y las 19:00 de Durango y en oscuro fuera de ese rango. El
  visitante lo puede cambiar y se recuerda en `localStorage`. El cambio usa
  View Transitions donde el navegador lo soporta.
- **Bloques invertidos.** La clase `.inv` intercambia `--surface` y `--ink`
  para las bandas oscuras (slogan, manifiesto, pie) en cualquiera de los dos
  temas.
- **Intro.** Al cargar se dibuja el isotipo **en un solo gesto**, en orden:
  la taza, el café, el mono y al final los ojos, sin pausas entre ellos para
  que no se sienta armado por partes. Entra el slogan y la marca vuela al
  isotipo de la barra, arriba a la izquierda, mientras el fondo se disuelve.
  Son unos 2.6 s (antes 3.8 s: se aceleró 1.5× el 29-sep). Sin ondas al final
  desde el 29-sep.

  El isotipo es un solo path compuesto (sus subtrazos son la silueta y los
  huecos, no las líneas sueltas), así que los elementos no se pueden separar
  por la estructura del archivo. `ryo-centerline.py` los separa por dónde cae
  cada trazo, con polígonos trazados a mano sobre el dibujo. Para revisar que
  la separación siga bien después de tocar algo:
  `python scripts/ryo-centerline.py --mapa mapa.png` pinta el esqueleto
  coloreado por grupo con las regiones encima.

  Lo que se ve dibujarse **es el vector original del manual**, no una imitación.
  El truco: `scripts/ryo-centerline.py` saca el eje central de cada trazo
  (adelgazamiento Zhang-Suen sobre el dibujo rasterizado) y lo guarda en
  `isotipo-trazo.svg`. La página lo usa como `<mask>` sobre el isotipo real,
  con un trazo más gordo que el del dibujo: al avanzar la máscara, va
  destapando el arte y se lee como una sola línea gruesa. La máscara cubre el
  **100%** del dibujo, así que al terminar se quita sin que nada aparezca de
  golpe.

  El esqueleto se corta en algunos cruces y puntas enroscadas; ahí antes
  quedaban franjas sin cubrir (piernas, una onda del café, la punta de una
  espiral) que se "conectaban" de golpe al final. El script las **remienda**:
  une puntas cercanas cuando el puente va sobre el dibujo (estirando el trazo
  del elemento que se dibuja después, para que el hueco se llene cuando la
  pluma llega ahí), y estira la punta más cercana a lo que aún quede sin
  cubrir, sin acercarse nunca a los ojos. Imprime el porcentaje cubierto al
  terminar; si baja de 100%, algo cambió en el dibujo.

  Los trazos van como `<path>` separados a propósito: SVG reinicia el patrón de
  `stroke-dasharray` en cada subtrazo, así que meterlos todos en un solo `path`
  con varios `M` no permite destaparlos en orden. `pluma.ts` los encadena:
  cada uno empieza justo cuando termina el anterior (nunca hay dos pedazos
  apareciendo a la vez) y todos siguen una sola curva de velocidad sobre el
  largo acumulado (`getTotalLength()`): arranca suave, fluye y aterriza suave.
  El script los ordena por cercanía pura, para que la pluma siga desde donde
  quedó en vez de saltar y dejar piezas sueltas.

  El `COLCHON` de 2 unidades en el patrón de guiones no es un capricho: sin él
  el desfase inicial cae justo en la frontera entre guión y hueco, y con
  `stroke-linecap: round` eso pinta un punto del grosor del trazo. El dibujo no
  arrancaría en blanco.

  Cada trazo de la máscara lleva **su propio grosor**, sacado del ancho real de
  esa línea en el dibujo (transformada de distancia sobre la tinta). Con un
  grosor único para todos, el contorno de la cabeza —que es gordo— destapaba
  los ojos al pasar cerca, y aparecía un punto antes de que los ojos se
  dibujaran. El margen (`MARGEN_MASCARA`, `MARGEN_FIJO`) está ajustado para que
  la cabeza no alcance los ojos, que están a unas 20 unidades de su eje; el
  remiendo cubre lo que ese margen deja fuera.

  Corre una sola vez por sesión, cualquier toque o tecla se la salta, y no
  corre nunca con `prefers-reduced-motion`. Nace con `hidden` y solo el JS la
  enciende: si el script falla, la página se ve entera de inmediato. Hay dos
  redes de seguridad más: un `setTimeout` que la quita pase lo que pase, y el
  CSS que la oculta con reduced-motion aunque el JS se equivoque.
  **Para volver a verla, agrega `?intro` a la URL.**
- **Barra inferior en móvil.** Aparece al salir del hero con la acción
  principal, porque casi todo el tráfico de un link de bio es de celular.
- **Datos estructurados.** La página emite JSON-LD de tipo `CafeOrCoffeeShop`
  con dirección y horarios, generado desde `config.ts`. Ayuda a que Google
  muestre el horario en la búsqueda local.

## El menú y el QR

`Menu.astro` es el recurso que se comparte con los clientes. Se muestra igual en
la landing (sección 03) y solo, en `/ryocafe/menu`, que es la dirección del QR de
la barra. El menú oficial (el PDF tal cual) se edita en `MENU` de `config.ts`; lo
que ayuda a elegir, en `menuGuia.ts`.

**Hecho para que se recuerde** (Made to Stick, Chip y Dan Heath: una idea se
queda si es Simple, Inesperada, Concreta, Creíble, Emocional y cuenta una Historia):

- **Concreto e inesperado — el vaso por dentro** (`vaso.ts`): cada bebida
  dibujada en corte, capa por capa, de abajo hacia arriba en el orden en que se
  sirve. Vapor = caliente, cubos = frío; sin ninguno, el menú no lo dice. Al
  abrir una bebida el vaso grande se llena y sus capas llevan número (1 =
  abajo). Dos tintas y tramas, nada más; el líquido siempre va café sobre
  champagne, así el espresso es oscuro en cualquier tema. Es el mismo dibujo de
  la app de barra, para que cliente y barista hablen del mismo vaso.
- **Simple — una firma por sección**: "si solo pides una cosa", en un bloque
  invertido arriba de cada pestaña. Y una línea de "qué es" en los 13 clásicos
  que el PDF deja sin descripción.
- **Creíble**: cifras arriba (36 bebidas · 14 platillos · 8 con algo hecho en
  casa) y solo datos que el menú ya dice o que Ryo confirmó.
- **Emocional e historia — "¿Qué se te antoja?"**: Primera vez (las cinco
  firmas, un recorrido), Algo frío, Sin cafeína, Hecho en casa. Filtran todo el
  menú a la vez, como el buscador.

Lo que es supuesto (orden de capas, recipiente, textos de "qué es") está
marcado así en `menuGuia.ts` y se valida con la entrevista de menú.

Decisiones de la primera versión que siguen:

- **Pestañas, no una lista larga.** Son 50 platillos en cuatro mundos distintos;
  Nielsen Norman Group recomienda pestañas cuando el contenido se divide en
  categorías excluyentes y las etiquetas son cortas. Cinco caben en una fila en
  un teléfono de 360 px sin desplazarse. La pestaña activa se rellena y va en
  negrita, así no depende solo del color.
- **Barra pegajosa** con `position: sticky` (no con JS), debajo de la barra del
  sitio: la altura se mide y se guarda en `--menu-top`.
- **Buscador** (50 platillos lo justifican). Busca en todas las pestañas a la
  vez; las pestañas sin coincidencias se marcan con un 0 y se atenúan. El nombre
  del grupo "Sin café" no cuenta como coincidencia al buscar "café".
- **Enlaces directos**: `#cafe`, `#matcha`, `#sin-cafe`, `#bar`, `#cocina`. Se
  actualiza con `history.replaceState` para no llenar el historial. Sin JS, las
  pestañas son enlaces `<a href="#id">` y se ven todas las secciones seguidas.
- **Deslizar** a los lados cambia de pestaña; flechas, Inicio y Fin también.
- **Del PDF oficial se queda** el isotipo y el rótulo de cada página, los
  nombres en mayúsculas, el precio solo con el número (sin `$` ni puntos guía;
  Cornell encontró que el símbolo de moneda hace gastar menos), variantes y
  descripciones en cursiva, Bar y Mocktails en fondo oscuro y el slogan al
  cierre. Las filas van alineadas a la izquierda con el precio en su columna:
  centradas, con un dibujo al lado, no se leían.
- **Página del QR ligera**: sin intro ni imágenes pesadas. El 53 % de las visitas
  móviles se va si tarda más de 3 s (Google/SOASTA), y quien escanea está de pie
  frente a la barra con prisa. Trae el estado Abierto/Cerrado en vivo, cómo
  llegar y el botón de compartir (hoja nativa del teléfono o copiar enlace).

### Regenerar el QR

```bash
pip install segno pymupdf zxing-cpp numpy
python scripts/ryo-qr.py
```

Lee `MENU_URL` de `config.ts`, genera `public/ryo/qr/` y **comprueba que se lea**
(PNG, SVG y la tarjeta, incluso reducida a 90 dpi) antes de terminar. Criterios:
QR estático versión 3, corrección M, zona de silencio de 4 módulos, café sobre
champagne (oscuro sobre claro). Imprimirlo a 6 cm o más para leerlo desde la
barra (regla de 10:1 entre distancia y tamaño), probar siempre la pieza ya
impresa con un teléfono viejo, y dejar el enlace escrito al pie por si la cámara
no lo lee. Al ser estático, depende de que `antemano.com.mx/ryocafe/menu` siga
vivo: si cambia el dominio, hay que dejar una redirección o reimprimir.

## Diseño

- Paleta del manual: champagne `#F8F3D1` y zinnwaldite brown `#302413`, nada
  más. Contraste 13.5:1 en los dos temas.
- JetBrains Mono con tracking `0.1em`: regular para títulos y etiquetas,
  itálica para cuerpos, como marca el sistema.
- Bloques rectos a sangre, radio 0, filetes de 1px, cero sombras y cero
  degradados. La jerarquía se hace con espacio, no con adornos.
- Grano de papel encima de todo (`--grano`, ponerlo en `0` para quitarlo).
- Composición numerada 01–04, como las secciones del brand book.
- El isotipo protagoniza el intro y aparece grande en el manifiesto; la portada
  la lleva el logotipo, sin competencia.
- Movimiento contenido: revelados de 1.1s con curva larga, marquee lento del
  slogan, parallax de 12px del logotipo con el mouse, botón magnético e
  inversión de color al pasar por los accesos. Todo se apaga con
  `prefers-reduced-motion`.
- Ninguna animación deforma la marca: se dibuja, se escala en proporción y se
  desplaza, pero nunca se estira, se rota ni cambia de color.

## Migrar a otro dominio / proyecto

**Opción A — otro proyecto Astro** (5 minutos):

1. Copiar `src/ryo/` y `public/ryo/` al nuevo repo.
2. Crear `src/pages/index.astro` (o la ruta que sea) con:
   ```astro
   ---
   import RyoCafe from '../ryo/RyoCafe.astro';
   ---
   <RyoCafe />
   ```
3. Actualizar `SITIO.url` en `config.ts` con el dominio nuevo.
4. No hay dependencias de runtime: las fuentes vienen de Google Fonts y las
   marcas van inline. Si los assets públicos cambian de carpeta, ajustar
   `ASSET_BASE` en `config.ts`.

**Opción B — HTML estático en cualquier hosting**:

```bash
npm run build
```

Subir `dist/ryocafe/index.html` + `dist/_astro/*` + `dist/ryo/*` tal cual (Netlify,
Cloudflare Pages, Vercel, cPanel). La página no necesita backend.

**Opción C — dominio propio de Ryo.** Igual que A, pero conviene mover la
página a la raíz (`src/pages/index.astro`) y dejar `SITIO.url` como el dominio
nuevo para que el canónico y la imagen de compartir apunten bien.
