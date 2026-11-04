# Arca Motors — demo de landing + catálogo

Propuesta para **Arca Motors** (seminuevos, Durango · [@arca.motors](https://www.instagram.com/arca.motors/)).
Vive autocontenida como Mr. Sliders: todo en `src/arca-motors/` y `public/arca-motors/`, sin tocar el resto de Antemano.

| Ruta | Qué es |
| --- | --- |
| `/arcamotors/` | Landing: hero, promesas, recién llegados, financiamiento con calculadora, cómo comprar, vende/consigna, recién vendidos, IG y visita |
| `/arcamotors/catalogo/` | Catálogo con chips de tipo, búsqueda, filtros (marca, precio, **mensualidad**, año, transmisión), orden, favoritos y URL compartible (`?tipo=suv&max=500000`) |
| `/arcamotors/auto/<slug>/` | Ficha (VDP): galería por tomas, precio + mensualidad, CTAs a WhatsApp con folio, ficha técnica, papeles, calculadora, similares. JSON-LD `Car` |

## Archivos

```
src/arca-motors/
├── config.ts          datos del negocio, planes de crédito, promesas, pasos, switches (DEMO, ACEPTA_A_CUENTA)
├── inventario.ts      unidades + helpers (slug, mensualidad, WhatsApp). Mismo modelo que tendrá la tabla del admin
├── ArcaLayout.astro   head, cabecera, pie, barra móvil, estilos globales, favoritos (localStorage)
├── components/        CarCard, CarVisual (foto o silueta de estudio), Calculadora, Icon
├── investigacion-seminuevos.md   síntesis de casos de éxito (Kavak, TREFA, Carvana, Autohero…) y modelo de datos
└── brand-src/         captura original del logo + scripts con los que se vectorizó (potrace)
public/arca-motors/
├── brand/             logos SVG/PNG (ver abajo)
└── og.png             imagen para compartir
```

## Logo

Vectorizado desde la foto de perfil de IG (no hay archivo original). Texto y silueta trazados con potrace a 6×, degradados reconstruidos.

- `arca-logo-{dark,light,mono}.svg/.png` — completo (auto + ARCA MOTORS + línea + tagline)
- `arca-wordmark-{dark,light,mono}.svg/.png` — sin auto
- `arca-wordmark-solo-{dark,light}.svg` — solo ARCA MOTORS (cabecera; el tagline no se lee a menos de ~200 px)
- `arca-car-{dark,light,mono}.svg` — solo la silueta
- `arca-icon.svg`, `arca-icon-512/1080.png`, `apple-touch-icon.png` — auto sobre círculo negro (perfil de redes)
- `arca-favicon.svg`, `favicon-48.png` — la "A" roja
- `arca-badge-original.png` — la captura limpia en círculo transparente, 1512 px

`*-mono.svg` usa `currentColor`: se recolorea con CSS. La tipografía del logo no es una fuente libre identificada; el texto quedó como trazos.

## Editar contenido

- Unidades: `inventario.ts`. Son los 21 posts de auto más recientes de @arca.motors (oct-2025 a sep-2026):
  datos del caption, **enganche y mensualidad leídos de su flyer**, fotos del carrusel (sin el flyer).
- Fotos: `public/arca-motors/autos/<folio>/NN-800.webp` y `NN-1280.webp`; `nFotos` dice cuántas hay. Con `nFotos: 0` se muestra la silueta de estudio.
- Arca no publica precio de contado. Si lo dan, va en `precio` y la ficha muestra la calculadora con ese precio.
- `estatus`: `disponible` | `apartado` | `vendido`. Los vendidos se quedan publicados ("Recién vendidos") con su URL.
- `DEMO = true` pone la franja de demo, `noindex` y "(de ejemplo)" junto a la tasa supuesta.

## Pendientes con el cliente (TODO en config.ts)

1. **Qué sigue en el lote.** El estatus es supuesto por fecha del post: desde mayo 2026 = disponible (12), antes = vendido (9). La Tacoma está como "Apartado" solo para mostrar el estado.
2. Precio de contado de cada unidad, y km de las que no lo dicen (Frontier, X5, RAM, Tahoe).
3. Tasa, comisión y requisitos del crédito directo (la calculadora usa 18% anual de ejemplo). La financiera sí es pública: CreditoGo / Caja Hipódromo desde 15%, hasta 60 meses, tasa desde 15.90%.
4. Dirección del lote, horario y link de Google Maps.
5. ¿Reciben autos a cuenta? (`ACEPTA_A_CUENTA`), cómo funciona el apartado y si hay garantía.
6. Reseñas de Google reales (no se inventaron testimonios).
7. Dominio. Ojo: en Seminuevos.com hay otra agencia "ARCA"; revisarlo antes de elegir dominio.

## Siguiente fase: admin

El modelo de `Vehiculo` ya sigue la propuesta de `investigacion-seminuevos.md` §5–6: alta desde el celular, fotos guiadas por toma,
cambio de estatus con un toque, leads por folio desde WhatsApp, costos y días en inventario.
