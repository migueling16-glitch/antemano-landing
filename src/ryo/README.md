# Ryo Café — página para el bio de Instagram

Página de un solo scroll pensada para el link del bio: la acción principal es
**cómo llegar**, y debajo viven el menú, los horarios y las redes. Construida
sobre el design system de Ryo Café (dos colores, JetBrains Mono, bloques planos).

Ruta actual: `/ryocafe` en la web de Antemano (antemano.com.mx/ryocafe) · Astro 4 + Vercel.

## Qué hay aquí

```
src/ryo/
├── RyoCafe.astro       página completa (HTML + CSS + JS, autocontenida)
├── config.ts           contenido, horarios, menú, accesos  ← lo único que hay que editar
├── assets/             marcas en SVG con fill="currentColor" (toman el color del tema)
│   ├── logotipo.svg      manuscrito "Ryo Café" — marca principal
│   ├── isotipo.svg       la taza con la figura dentro — formatos pequeños
│   ├── tagline.svg       SOFT LIVING, DEEP SIPING.
│   └── auxiliar.svg      R Y O / C A F É en mono
└── README.md

src/pages/ryocafe.astro wrapper de 3 líneas que monta la página en la ruta

public/ryo/
├── favicon.svg         isotipo sobre champagne
├── og.png              imagen para compartir (se rehace con scripts/ryo-og.py)
└── marcas/             los 8 masters de dos tintas, tal como vienen del manual

scripts/ryo-og.py         regenera public/ryo/og.png
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
| `MENU`                 | Grupos y platillos. **Hoy es una muestra.**                            |
| `MENU_ES_DEMO`         | `true` muestra el aviso de "menú de muestra". Poner en `false` al publicar el real. |
| `MENU_MOSTRAR_PRECIOS` | `false` oculta todos los precios sin tocar los datos.                  |
| `TEMA_AUTO`            | Horas entre las que la página abre en tema claro.                      |

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
- **Intro.** Al cargar, el isotipo se dibuja solo de un trazo grueso, el café
  hace un par de ondas —contenidas dentro de la boca de la taza, medida sobre
  el vector: elipse de 71% del ancho y 20% del alto, centrada en 43.4% / 38%—
  y la marca vuela al isotipo de la barra, arriba a la izquierda, mientras el
  fondo se disuelve. Son unos 2.5 s.

  Lo que se ve dibujarse **es el vector original del manual**, no una imitación.
  El truco: `scripts/ryo-centerline.py` saca el eje central de cada trazo
  (adelgazamiento Zhang-Suen sobre el dibujo rasterizado) y lo guarda en
  `isotipo-trazo.svg`. La página lo usa como `<mask>` sobre el isotipo real,
  con un trazo más gordo que el del dibujo: al avanzar la máscara, va
  destapando el arte y se lee como una sola línea gruesa. Al terminar se quita
  la máscara, porque cubre el 99.7% del dibujo y ese resto quedaría escondido.

  Los trazos van como `<path>` separados a propósito: SVG reinicia el patrón de
  `stroke-dasharray` en cada subtrazo, así que meterlos todos en un solo `path`
  con varios `M` no permite destaparlos en orden. Cada uno dura según su
  longitud real (`getTotalLength()`), que es lo que da velocidad de pluma
  constante y hace que se lea como una mano dibujando. El script los ordena
  por cercanía pura, para que la pluma siga desde donde quedó en vez de saltar
  y dejar piezas sueltas.

  El `COLCHON` de 2 unidades en el patrón de guiones no es un capricho: sin él
  el desfase inicial cae justo en la frontera entre guión y hueco, y con
  `stroke-linecap: round` eso pinta un punto del grosor del trazo. El dibujo no
  arrancaría en blanco.

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
