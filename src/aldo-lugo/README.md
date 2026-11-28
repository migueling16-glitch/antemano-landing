# ALDO chef LUGO · Mesa de Lumbre — demo de landing + cuestionario

Demo para el chef **Aldo Lugo** (Durango): la landing de su servicio de banquetes al fuego *Mesa de Lumbre* y el
cuestionario con las preguntas que necesitamos que conteste. Vive autocontenida como Arca Motors: todo en
`src/aldo-lugo/`, `public/aldo-lugo/` y `src/pages/aldolugo/`, sin tocar el resto de Antemano.

Contenido: `Chef Aldo Lugo/04_Docs/PROPUESTA_MAESTRA.md` v1.1 (manda), `ESPECIFICACION_TECNICA.md` (adaptada de
Astro 7.4 + Cloudflare a **Astro 4.16 estático en Vercel**), `PREGUNTAS_CHEF.md` (34 preguntas) y `seleccion_fotos.md`.

| Ruta | Qué es |
| --- | --- |
| `/aldolugo/` | Landing (10 secciones de la propuesta §5). Formulario de prospectos de 6 pasos que en el DEMO no envía nada |
| `/aldolugo/cuestionario/` | Cuestionario interactivo para el chef, con guardado automático |

`BASE = '/aldolugo'` (páginas) · `ASSETS = '/aldo-lugo'` (archivos públicos).

## Archivos

```
src/aldo-lugo/
├── config.ts            TODO el contenido de la landing y la oferta; pendientes en null; helpers
├── logos.ts             trazos del logotipo e isotipo (generado por brand-src/trace.mjs)
├── fotos.json           salida del pipeline de fotos ({} hasta que corra); clave "<id>-<recorte>"
├── AldoLayout.astro     <head>, tokens --al-*, estilos base y utilidades, franja DEMO, cabecera, pie, scripts
├── components/
│   ├── Foto.astro       <picture> AVIF/WebP + JPEG desde fotos.json; marcador gris si falta la foto
│   ├── Logo.astro       logotipo / isotipo inline (currentColor) vía el sprite del layout
│   ├── Dato.astro       un valor o el chip "… por confirmar" (rompe el build si DEMO = false)
│   └── Texto.astro      pinta un Texto de config (strings + huecos h())
└── brand-src/
    ├── trace.mjs        vectoriza los PNG del cliente con potrace → SVG, favicon, apple-touch, og provisional
    ├── originales/      PNG negros del cliente (01_Marca/Logo Aldo Lugo (original)/…/PNG)
    └── verificacion/    original vs SVG rasterizado, lado a lado
public/aldo-lugo/
├── brand/               aldo-logotipo.svg, aldo-isotipo.svg (currentColor), favicon.svg, favicon-48.png, apple-touch-icon.png
├── fotos/               exportes del pipeline (F080-1x1-640.avif …)
└── og.jpg               1200×630. Hoy es un provisional (logo hueso sobre carbón); el pipeline lo reemplaza con F019
src/pages/aldolugo/
├── index.astro          landing
└── cuestionario.astro   cuestionario
```

Regenerar el logo: `node src/aldo-lugo/brand-src/trace.mjs` (IoU contra el PNG: logotipo 0.969, isotipo 0.992;
el logotipo pesa ~11 KB y va una sola vez en el HTML, como `<symbol>`). No hay SVG exportado del `.ai`: cuando
llegue, reemplaza los trazos y conserva los nombres.

## Contrato compartido

### Layout

```astro
<AldoLayout title? description? variante="landing|cuestionario">
  …secciones…
  <Fragment slot="barra">…barra fija inferior (landing)…</Fragment>
  <Fragment slot="head">…</Fragment>
</AldoLayout>
```

- `DEMO = true` pone `noindex, nofollow`, la franja "Demo · contenido por confirmar con el chef" (con enlace al
  cuestionario en la landing) y los chips "por confirmar".
- Fuentes: Google Fonts sin bloquear el primer pintado (`media=print` → `all`): **Fraunces** 560 (opsz 144, SOFT 30,
  WONK 0) para display y **Barlow Condensed 600** para etiquetas; texto en `system-ui`.
- `[data-abrir-hoja]` (+ `data-preset='{"formato":"boda-al-fuego","ocasion":"boda"}'` opcional) abre el formulario;
  sin JS es un enlace a `#tu-fecha`. Lo implementa el componente del formulario.
- `[data-al-aviso="texto"]`: al tocarlo muestra el aviso (toast, `role=status`) y no navega. También `window.alAviso(texto)`.
  Úsalo en todo botón que en el demo no puede hacer su acción (p. ej. WhatsApp con `AVISO_WA_DEMO`): un toque nunca se ignora.
- `<html data-quieto>` = sin movimiento (prefers-reduced-motion o "Pausar movimiento" del pie). `data-inapp` = navegador de Instagram/Facebook.
  El evento `al:movimiento` (en `document`) avisa cuando cambia.
- La barra fija inferior pone su alto en `--al-barra-h` sobre `<html>` (el aviso y el pie lo respetan).

### Anclas de la landing (`SECCIONES`)

`inicio · manifiesto · lumbres · una-noche · experiencias · anfitrion · proceso · preguntas · tu-fecha · cierre`

### Foto

```astro
<Foto id="F080" recorte="1x1" alt="…" loading="eager" fetchpriority="high" sizes="100vw" clase="…" ajuste="cover" />
```
`recorte`: `9x16 | 4x5 | 16x9 | 1x1 | 3x2`. Lee `fotos.json`:
```json
{ "F080-9x16": { "id":"F080", "recorte":"9x16", "tratamiento":"brasa|carbon", "ancho":960, "alto":1707,
  "anchos":[480,768,960], "avif":["/aldo-lugo/fotos/F080-9x16-480.avif",…], "webp":[…],
  "jpg":"/aldo-lugo/fotos/F080-9x16-960.jpg", "lqip":"data:image/webp;base64,…", "alt":"…" } }
```
El ancho de cada archivo se lee del sufijo `-NNN.ext` (o de `anchos`). Sin entrada → marcador gris con el id.
`FOTOS_REQUERIDAS` (config.ts) lista cada `<id>-<recorte>` que usa la landing, con tratamiento, alt y retoque.

### Pendientes

- En `config.ts`, todo lo que la propuesta tiene entre corchetes es `null` o un hueco `h('zona', 12)` dentro de un `Texto`.
- `<Dato valor={…} etiqueta="precio" pregunta={5} formato="mxn" />` y `<Texto t={…} />` pintan el valor o el chip
  "precio por confirmar" (`.al-pendiente`, `title` con el número de pregunta). **Nunca corchetes crudos.**
- `pendiente(valor, {etiqueta, formato, pregunta})` y `textoPlano(texto)` para strings (meta, aria, mensajes).
- Con `DEMO = false`, un `<Dato>` pendiente rompe el build: lo que no se confirma no se publica.

### Exportaciones de `config.ts`

Rutas y switches: `DEMO, BASE, ASSETS, ORIGEN, ruta(), asset(), SECCIONES, NAV`.
Pendientes: `POR_CONFIRMAR, h(), esHueco(), esPendiente(), pendiente(), textoPlano(), mxn()`; tipos `Hueco, Segmento, Texto`.
Marca y datos: `SITIO, DATOS` (whatsapp, zona, ciudad base, razón social… todo null), `CREDITO_FOTOS, CREDITO_MEZCALEROS`.
Secciones: `HERO, MANIFIESTO, LUMBRES, UNA_NOCHE, EXPERIENCIAS, ANFITRION, PROCESO, FAQ (9), TU_FECHA, CIERRE`.
Oferta: `OFERTA` (4 formatos, incluyeSiempre, aparte), `OCASIONES, BANDAS, LUGAR` (estado, tipos, fuego, zonas, municipios,
requisitos, necesitamos), `formatoPorId(), desdePublico(), minimoPublico(), calificacionLinea2(), lineaPrecio(), formatoSugerido()`.
Formulario: `FORMULARIO` (6 pasos §7.1, mensajes, almacén), `GRACIAS, AFINA, CTA, MENSAJES_WA, AVISO_WA_DEMO, waHref()`,
`nuevoFolio(), normalizarWa(), fechaCorta(), mensajeWhatsApp()`. Fotos: `FotoRef, Recorte, FOTOS_REQUERIDAS`.

## Tokens y utilidades (AldoLayout.astro)

- Color: `--al-carbon #141414 · --al-hollin #1F1D1A · --al-carbon-3 · --al-hueso #EDE6D6 · --al-cal #E0D6C2 ·
  --al-ceniza #9A9183 · --al-tizne #5E5950 · --al-sello #E3120B · --al-sello-tinta #B0140F · --al-brasa #E8742A`.
  Rojo solo en la acción principal (`.al-btn--primario`) y sellos; brasa solo luz. Nada del verde/kraft de Canito.
- Tema por sección: `data-tema="noche|dia"` define `--al-bg, --al-fg, --al-fg-2, --al-sup, --al-linea, --al-foco, --al-enlace`.
- Tipo: `--al-f-display, --al-f-label, --al-f-text, --al-fs-h1/h2/h3/manifiesto/lead/body/label/small/input`.
- Espacio: `--al-sp-1…10, --al-margen, --al-sec-pad, --al-max, --al-tap (44), --al-btn-h (52), --al-btn-h-2 (48)`.
- Movimiento: `--al-ease-brasa, --al-ease-corte, --al-t-micro, --al-t-ui, --al-t-reveal`. Capas: `--al-z-*`.
- Clases: `.al-wrap .al-sec .al-medida .al-pila .al-filete .al-sr` · `.al-h1 .al-h2 .al-h3 .al-display .al-manifiesto
  .al-label .al-lead .al-small .al-muted .al-num .al-cita` · `.al-btn` + `--primario --secundario --fantasma --icono --bloque`
  · `.al-enlace(--flecha) .al-chip .al-pendiente .al-sello` · `.al-foto(--cover) .al-logo` · `.al-revela(--tenue)` + `--al-delay`.
- Movimiento: solo `transform`/`opacity` con IntersectionObserver; `.al-revela` nunca en el hero (lo visible al cargar se
  marca antes de activar `.al-anima`, así el primer pintado no oculta nada). Respeta `data-quieto`. Sin canvas de partículas.

## Reglas duras

- Marca monocroma; ningún material de Canito, solo "También fundó Tacos Canito →" en El anfitrión (`ANFITRION.canito`).
- Burning Man 2025 sí se nombra en "Y muchos fuegos más" (Aldo, 28-nov; propuesta privada). Mallmann: nivel 0, no se nombra.
- Horno de tierra (F289, F323, F358, F362) = maestros mezcaleros (`CREDITO_MEZCALEROS`), nunca cocina del chef.
- Nada de fotos de "Fotos a evitar" (`seleccion_fotos.md` §8). Nunca el teléfono del chef. Formulario del demo: no envía nada.

## Pendientes con el chef (número de pregunta de PREGUNTAS_CHEF.md)

P1 concepto · P2 mención de Canito ("fundó/cofundó") · P5 precios, "desde", mínimos y cortes de inversión · P6 qué incluye ·
P7 anticipo, cancelación, degustación · P8 brigada y m² por banda, visita al lugar · P9–P11 equipo, requisitos del lugar y
alternativa sin fuego · P12 ciudad base, zona y viáticos · P13 qué lumbres monta · P14 leña · P15 qué hizo en La Tapada ·
P16–P17 WhatsApp y tiempo de respuesta · P18 razón social, RFC, aviso de privacidad · P19 dominio y cuentas · P20–P22 créditos
y permisos · P23 manifiesto · P26–P27 clima, seguridad, alergias y niños · P30 bio · P32 aliados.
Otros: hex final del sello, retoques de marcas ajenas en F019, F151, F218, F255, F363, F006, y el OG con F019.
