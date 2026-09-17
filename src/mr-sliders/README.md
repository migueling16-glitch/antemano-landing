# Mr. Sliders & Friends — página de aniversario

Página de un solo scroll para la fiesta del primer aniversario de Mr. Sliders
(30 de octubre de 2026, Barrio del Calvario, Durango). Countdown al evento y
countdown separado que revela la ubicación exacta una semana antes.

Ruta actual: `/mrsliders&friends` en la web de Antemano (antemanoc.com/mrsliders&friends) (Astro 4 + Vercel).

## Qué hay aquí

```
src/mr-sliders/
├── MrSlidersFriends.astro   página completa (HTML + CSS + JS, autocontenida)
├── config.ts                fechas, textos, links, ruta de assets  ← lo único que hay que editar
├── assets/
│   ├── mascot.svg           mascota (fill="currentColor": toma el color del CSS)
│   ├── wordmark.svg         "Mr. Sliders smash burgers"
│   ├── logo-full.svg        mascota + wordmark
│   └── burger.svg           ícono de hamburguesa del patrón de marca
└── README.md

src/pages/mrsliders&friends.astro   wrapper de 3 líneas que monta la página en la ruta
public/mr-sliders/
├── favicon.svg
└── og.png                   imagen para compartir en redes
```

Los SVG se extrajeron como vectores directamente del manual de marca (no son
trazados), usan `fill="currentColor"` y no tienen tamaño fijo: se escalan y
recoloran con CSS (`color:` en el contenedor).

## Editar contenido

Todo vive en `config.ts`:

| Campo         | Qué es                                                        |
| ------------- | ------------------------------------------------------------- |
| `fecha`       | Fecha y hora de la fiesta, con offset `-06:00` (Durango).     |
| `revelacion`  | Momento en que la tarjeta de ubicación se voltea y muestra la dirección. |
| `direccion`   | Dirección exacta. **Llenar antes del 23 de octubre.**         |
| `mapsUrl`     | Link de Google Maps al lugar exacto.                          |
| `instagram`   | Handle sin `@` (instagram.com/mrsliders).                     |
| `confirmados` | Número de la sección "Ya somos". **DEMO: está inflado (86).** |
| `cupo`        | Cupo total para la barra de "% apartado". **DEMO (150).**     |
| `promoPrimeros` | Promo: los primeros N boletos incluyen un slider gratis (100). Los que quedan se calculan con `confirmados`. |
| `ticketsUrl`  | Link de venta de boletos. Vacío = manda al DM de Instagram.   |
| `precio`      | Texto del precio junto al botón de compra. Vacío = oculto.    |
| `tagline`     | Frase corta del hero.                                         |

Pendientes marcados con `TODO` en el archivo: hora de inicio, dirección real, link de boletos, y reemplazar los números de demo (`confirmados`, `cupo`).

La revelación es puramente por fecha en el navegador del visitante: al llegar
`revelacion`, la tarjeta se voltea sola (sin redeploy). Como es un sitio
estático, la dirección ya viaja en el HTML aunque esté oculta; si eso importa,
hacer deploy con `direccion` vacía y volver a desplegar el 23 de octubre.

## Migrar a otro dominio / proyecto

**Opción A — otro proyecto Astro** (5 minutos):

1. Copiar `src/mr-sliders/` y `public/mr-sliders/` al nuevo repo.
2. Crear `src/pages/index.astro` (o la ruta que sea) con:
   ```astro
   ---
   import MrSlidersFriends from '../mr-sliders/MrSlidersFriends.astro';
   ---
   <MrSlidersFriends />
   ```
3. `npm i lenis` (única dependencia de runtime; las fuentes vienen de Google Fonts).
4. Si los assets públicos se mueven de carpeta, ajustar `ASSET_BASE` en `config.ts`.

**Opción B — HTML estático en cualquier hosting**:

```bash
npx astro build
```

Tomar `dist/mr-sliders/index.html` + `dist/_astro/*` + `dist/mr-sliders/*` y
subirlos tal cual (Netlify, Cloudflare Pages, cPanel, etc.). La página no
necesita backend.

## Diseño

- Paleta del manual: naranja `#F05A25` y negro (se usa `#0B0A09`, negro cálido),
  con un blanco cálido `#FFF4EB` para texto.
- Tipografía del manual: Yanone Kaffeesatz (variable 200–700, Google Fonts).
  DM Mono para etiquetas pequeñas.
- Intro: contador 000→365 días, la mascota cae y hace *smash* (ondas + shake),
  aparece "UN AÑO" y la cortina sube. Solo una vez por sesión; se omite con
  `prefers-reduced-motion`.
- Animaciones en vivo: aura naranja que respira y sigue el cursor, grano,
  mascota flotando con parallax, marquee cuya velocidad e inclinación siguen
  el scroll, dígitos tipo odómetro.
- Interacciones: cursor propio, botones magnéticos, clic = onda de *smash*,
  la tarjeta bloqueada "niega" al pasar el mouse, letras de "Friends" rebotan.
- Móvil: cada toque dispara lo que en desktop hace el hover; la mascota del hero
  sigue el giroscopio (iOS pide permiso al primer toque) y el scroll; el aura
  se desplaza sola.
- Secciones "Ya somos" (odómetro + multitud de mascotas) y "Boletos" (barra de
  cupo con porcentaje animado).
