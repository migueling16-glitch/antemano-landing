## 1. Casos de éxito

| Sitio | Qué hace bien | Qué copiar para Arca |
|---|---|---|
| [Kavak](https://www.kavak.com/mx/seminuevos) (MX) | Chips rápidos ("SUV", "Menos de $250k", "Menor de $5,000/mes"). El filtro de mensualidad va justo después del de precio. La tarjeta dice "$4,982/mes\*" y aclara los supuestos (72 meses, 50% de enganche, 17.5%). La [ficha](https://www.kavak.com/mx/usado/mazda-mazda_3-25_i_sport_auto-sedan-2021) tiene 21 fotos, diagrama de imperfecciones, Stock ID, devolución de 7 días o 300 km y CTA de toma a cuenta | Filtro y tarjeta con mensualidad y sus supuestos, diagrama de defectos, Stock ID, rutas `/seminuevos/[marca]/[modelo]` |
| [Autos TREFA](https://autostrefa.mx/) (MTY) | El "Kit TREFA" agrupa la protección bajo un nombre propio: 30 días o 500 km, REPUVE/SAT/CARFAX, garantía de motor y transmisión, recompra al 80/70%. Apartado reembolsable si el crédito no se aprueba. Google 4.9 con 240 reseñas | Un paquete con nombre ("Garantía Arca") y apartado reembolsable. Ojo: TREFA no tiene WhatsApp |
| [GPA Automotriz](https://gpautomotriz.com/) (Edomex) | WhatsApp en casi todas las secciones, con mensaje prellenado según el contexto. Toma a cuenta con "oferta en menos de 3 h, por escrito". Cifras concretas: "+1,500 vendidos", "desde 2011" | WhatsApp como CTA principal con texto según la sección y una promesa de tiempo que se pueda medir |
| [Veautos](https://veautos.mx/) (NL) | El hero ataca el dolor: "Crédito al 10% enganche". Etiqueta "(separado)" en las tarjetas | Estado "Apartado" visible. Ojo: su catálogo no tiene filtros |
| [San Ángel Motors](https://www.sanangelmotors.com/) (Puebla) | Foto real de la agencia, 3 tarjetas de promesa y toma a cuenta en 3 pasos | Franja de promesas. Contraejemplo: no tiene inventario navegable |
| [Carvana](https://www.carvana.com/certified-program) (EE. UU.) | 360° con defectos marcados, inspección de 150 puntos dentro de la ficha, "Purchase pending", filtro por mensualidad | Defectos marcados, estado de apartado, checklist de inspección |
| [AutoNation](https://www.autonationusa.com/buy-your-car-online.htm) | "Reserve Now" en cada auto y contacto en menos de 24 h | "Apartar / Agendar prueba" que abre WhatsApp |
| [Autohero](https://www.autohero.com/fr/policies/quality/) (UE) | Umbrales de daño publicados (rayón de más de 20 mm, golpe de más de 5 mm) y fotos de cada imperfección | Bloque "Detalles honestos" con una medida por cada marca |
| [Cinch](https://www.cinch.co.uk/car-inspection) (UK) | Puntos tocables sobre la foto que abren el acercamiento del defecto | Mapa de puntos sobre la foto lateral. En el admin se marca con un toque |
| Spoticar ([motorionline](https://www.motorionline.com/spoticar-fino-a-100-punti-di-controllo-per-i-suoi-veicoli/)) | Niveles de certificación con nombre (Premium/Advanced) como badge en la tarjeta | Sellos propios, por ejemplo "Arca Select" |
| [Romans Intl.](https://www.romansinternational.com/) / [Tom Hartley](https://www.tomhartley.com/) (UK) | Tarjetas mínimas, "Under offer" en lugar de retirar el auto, galería "Previously Sold", contador de inventario, número de fotos por auto | Tono premium, sección de vendidos y contador "N autos disponibles" |

## 2. Patrones imprescindibles, ordenados por impacto

**Landing**
1. **WhatsApp como CTA principal.** En el hero va "Ver catálogo" junto a "Escríbenos por WhatsApp". En móvil, una barra fija inferior con WhatsApp (verde) y Llamar. Es el canal donde ya están sus leads, y ni Kavak ni los portales lo ponen al frente.
2. **Franja de confianza bajo el hero.** Inspección de N puntos, REPUVE y factura en regla, garantía por escrito y toma a cuenta.
3. **Prueba social sin costo.** Reseñas de Google (calificación, número y 3 testimonios) y un carrusel de entregas tomado de su Instagram. Conviene usar miniaturas estáticas y no los embeds oficiales, que cargan mucho JavaScript.
4. **Contador de inventario** y un carrusel "Recién llegados".
5. **Página "Vende o cambia tu auto".** Formulario de 4 campos con fotos que termina en WhatsApp. Debe decir claramente "estimación preliminar sujeta a revisión" (lección de Aramis).

**Catálogo**
1. Precio de contado siempre visible. Debajo, "desde $X/mes\*" con sus supuestos en nota al pie.
2. Filtros: precio, **mensualidad**, año, km, marca, carrocería y transmisión. Chips rápidos estilo Kavak arriba. En móvil, los filtros en una barra fija.
3. La tarjeta lleva:
   - foto real a 3/4 frontal (4:3);
   - una etiqueta (Recién llegado / Único dueño / Apartado);
   - la línea "Año • km • versión • transmisión";
   - precio, mensualidad y número de fotos;
   - un botón de WhatsApp con el mensaje `Hola, me interesa el Jetta 2021 (ARC-0142) – $289,000`.
4. Estados visibles: Disponible, Apartado (cinta ámbar) y Vendido. El auto vendido pasa a "Recién vendidos" con su URL intacta.
5. Orden por "Recién llegado". Favoritos guardados en el navegador, sin cuenta. El comparador puede esperar a una fase posterior.

**Ficha del auto (VDP), en móvil y de arriba hacia abajo**
1. Galería deslizable de 20 a 40 fotos en orden fijo: 3/4 frontal, perfiles, 3/4 trasera, interior, tablero con km, cajuela, llantas, motor y defectos.
2. Título y la línea de specs.
3. Bloque de precio: contado, mensualidad, calculadora con enganche y plazo de 12 a 60 meses, y CTA "Apartar por $5,000 reembolsables". En la demo ese botón abre WhatsApp, sin pasarela de pago.
4. Checklist de documentos: factura (original o endosada), REPUVE, tenencias, número de dueños y servicios.
5. Mapa de imperfecciones con puntos y medida de cada una.
6. Reel de Instagram como video del recorrido. Se reproduce solo al tocarlo.
7. "La historia de este auto": un párrafo hecho con plantilla.
8. Condiciones escritas de la garantía y del apartado.
9. Autos similares, ubicación, horario y la barra fija de WhatsApp y Agendar prueba.

**Técnico**
- Sitio estático (Astro), imágenes AVIF/WebP responsivas, foto principal precargada y el resto con carga diferida.
- JSON-LD `AutoDealer` en el home y `Car`+`Offer` en cada ficha.
- Eventos de clic en WhatsApp, Llamar, Apartar y calculadora.

## 3. Datos duros

| Dato | Fuente |
|---|---|
| WhatsApp es la red más usada en México: 96% de los internautas | [AIMX 2024 vía DPL News](https://dplnews.com/dia-mundial-de-internet-mexico-supera-los-100-millones-de-internautas/) |
| El 72% de los adultos en línea escribe a un negocio por WhatsApp cada semana (dato de Meta) | [Expansión](https://expansion.mx/tecnologia/2023/04/26/whatsapp-business-entrevista-nikila-srinivasan) |
| 4 de cada 10 seminuevos revisados en México tienen fallas graves o problemas legales | [El Cronista / WeVerify](https://www.cronista.com/mexico/finanzas-economia/vas-a-comprar-auto-usado-4-de-cada-10-en-mexico-tienen-fallas-graves-o-problemas-legales-dice-weverify-autos/) |
| El comprador de usados visita 4.8 sitios, pasa 7:45 h investigando en línea y el 63% quiere un modelo mixto. Solo 7-8% compra todo en línea | [Cox 2025](https://www.coxautoinc.com/wp-content/uploads/2026/03/2025-Cox-Automotive-Car-Buyer-Journey-Study-Summary.pdf) |
| El 71% del tráfico a sitios de agencias es móvil (2024) | [DealerOn](https://dealeron.com/blog/2024-year-in-review) |
| Varias fotos reales en lugar de una de catálogo: +262% de clics a la ficha (otra fuente de Cox reporta +349% de vistas) | [Cox MaxDiff](https://www.coxautoinc.com/wp-content/uploads/2017/05/376385_VehicleImage_MaxDiff_StudyR4.pdf), [Cox](https://www.coxautoinc.com/insights/merchandising-new-cars-is-it-worth-it-2/) |
| Listados con precio: +27% de clics. El 85% abandonaría un sitio sin precios | [AutoSuccess](https://www.autosuccessonline.com/data-shows-buyers-wont-engage-listings-without-a-price/), [F&I Mag.](https://www.fi-magazine.com/news/car-dealers-risk-losing-customers-if-they-fail-to-post-prices-online-friedman-swiftcobalt-group-study) |
| Solo el 16% de las agencias responde en menos de 15 min y el 18% nunca responde. Responder en menos de 10 min triplica la probabilidad de visita | [Auto Remarketing](https://autoremarketing.com/trends/study-dealership-online-lead-response-time-often-falls-short) |
| Más del 70% dice que el video lo ayudó a conocer el auto | [Think with Google](https://thinkwithgoogle.com/marketing-strategies/video/auto-consideration-statistics) |
| Mejorar 0.1 s la velocidad móvil subió 21.6% el avance al formulario en sitios de leads | [web.dev](https://web.dev/case-studies/milliseconds-make-millions) |
| Agencias con 4.0 estrellas o más tuvieron un aumento de ventas 25% mayor que las de 2.0 o menos | [Auto Remarketing (DealerRater 2012)](https://www.autoremarketing.com/?p=18737) |
| Auto Trader UK: promedio de 22 fotos por anuncio. Los mejores vendedores suben 55 o más | [Auto Trader PDF](https://trade.autotrader.co.uk/trade-site/static/assets/best-practice-and-user-guides/best-practice/auto-trader-best-practice-guidelines.pdf) |
| Costo de un auto parado: unos USD 32 por día | [Auto Remarketing / NCM](https://www.autoremarketing.com/retail/better-inventory-management-turn-begins-recon) |

## 4. Errores a evitar

- **"Precio por DM".** Es el freno principal en Instagram y el sitio existe para quitarlo.
- **No tener inventario navegable, o tener video que no carga** (San Ángel). Tampoco catálogo sin filtros (Veautos).
- **Formulario como único contacto** (Autocosmos, TREFA). WhatsApp va primero y el formulario de 3 campos es solo el respaldo para fuera de horario.
- **Publicar autos sin fotos o con fotos de catálogo.** Un dealer reporta 0 leads en autos con "foto pendiente" (anécdota de foro).
- **Prometer más de lo que se puede cumplir.** Kavak acumuló quejas por garantías y devoluciones no cumplidas ([Expansión](https://expansion.mx/empresas/2022/11/24/kavak-quejas-reclamos-mexico)). CarMax tuvo que recortar su devolución de 30 a 10 días en 2024 ([Auto Remarketing](https://www.autoremarketing.com/?p=66744)). Para Arca conviene una devolución de 3 a 7 días con límite de km y condiciones escritas.
- **Vroom.** Cerró su e-commerce en 2024 por depender del *floorplan* (crédito para inventario) y de la logística nacional, y dejó clientes con depósitos sin contacto ([DC360](https://www.digitalcommerce360.com/2024/01/23/vroom-to-end-online-automotive-sales-to-focus-on-other-business/)). Si Arca cobra apartado, la política de reembolso va en la ficha y siempre debe haber un humano localizable por WhatsApp.
- **Cazoo.** Ganaba £403 por auto (1.6% de margen), gastaba unas £1,878 por auto en marketing y entró en administración en 2024 ([Car Dealer](https://cardealermagazine.co.uk/used-car-dealer-cazoo-posts-704m-loss-for-2022-as-troubled-firm-counts-cost-of-closures/282056)). Lo que se copia es su transparencia, no su escala. La ventaja de Arca es la relación personal.
- **Estimaciones de toma a cuenta que luego no se respetan** (Aramis): siempre "preliminar, sujeta a revisión".
- **Borrar los autos vendidos.** Se pierden su URL y la prueba social.
- **Embeds de Instagram pesados** en un sitio que se visita 71% desde móvil.

## 5. Modelo de datos mínimo del vehículo

Sirve hoy como JSON o colección de Astro y mañana como tabla en Supabase/Postgres.

- **Identificación:** `id`, `folio` (ARC-0001), `slug`, `vin` (único, puede quedar vacío), `placas`, `estado_placas`.
- **Ficha:** `marca`, `modelo`, `version`, `anio`, `km`, `transmision` (enum), `combustible` (enum), `carroceria` (enum), `color_ext` (nombre de fábrica), `color_int`, `motor`, `traccion`, `puertas`, `num_duenos`, `equipamiento[]`, `descripcion`, `historia` (texto editorial), `sello` (enum: Select/Classic), `etiquetas[]` (único dueño, poco km), `destacado`.
- **Precio:** `precio_contado`, `precio_anterior` (para "bajó de precio"), `acepta_credito` y `acepta_cambio`. La `mensualidad_estimada` se calcula con supuestos globales y no se guarda.
- **Estado:** `estatus` (adquirido → en_preparacion → publicado → apartado → vendido → entregado, con salidas `baja` y `consignacion_devuelta`), `fecha_ingreso`, `fecha_publicacion`, `fecha_venta`. "Recién llegado" y los días en inventario se calculan.
- **Medios:** `fotos[]` con `url`, `orden`, `es_portada` y `tipo_toma`; `video_url` (reel); `imperfecciones[]` con `foto_id`, `x`, `y`, `nota` y `medida_mm`.
- **Confianza:** `documentos[]` con `tipo` (factura, endoso, tenencia, tarjeta de circulación, verificación, REPUVE, liberación de gravamen), `estatus` (pendiente/ok/no aplica), `archivo_url` y `vigencia`; `garantia` (texto y plazo).
- **Internos, solo en el admin:** `costo_adquisicion`, `origen_adquisicion` (compra/toma/consignación/subasta), `precio_piso`, `ubicacion`, `created_by`, `updated_at`.
- **Tablas relacionadas para fases posteriores:** `reacondicionamiento`, `estatus_historial`, `leads`, `apartados`, `publicaciones` (canal, URL e ID externo).

## 6. Admin MVP por fase

**Fase 1: alta y publicación**
- Alta desde el celular en el lote, con decodificación opcional del VIN vía [NHTSA vPIC](https://vpic.nhtsa.dot.gov/api/) y captura manual de respaldo.
- Fotos guiadas por toma, con orden arrastrable y portada fija. Se guardan los originales y se generan versiones responsivas.
- Bloqueos para publicar: precio obligatorio y al menos 12 fotos.
- Cambio de estado con un toque (Disponible, Apartado, Vendido) que se refleja en el catálogo.
- Mapa de imperfecciones: tocar la foto y escribir la nota.

**Fase 2: operación**
- Costos de adquisición y de reacondicionamiento por concepto, con utilidad esperada y precio piso.
- Días en inventario contados desde la compra, con semáforo de alertas a los 30, 45 y 60 días.
- Bitácora de estados (quién y cuándo).
- Leads con canal de origen, auto (por folio en el mensaje de WhatsApp), etapa, vendedor, motivo de pérdida y **tiempo de respuesta**.
- Apartados con monto, fecha límite y cliente.

**Fase 3: documentos y canales**
- Expediente por auto. Regla: no se publica sin factura y REPUVE en "ok".
- Feed `/feed/meta.csv` para el catálogo de vehículos de Meta.
- Botón "Generar post de IG" con las fotos en orden y el copy (precio, km y CTA a WhatsApp).

**Fase 4: integraciones**
- API de Mercado Libre: publicación y leads. Los paquetes se contratan con un ejecutivo, no por API.
- Reportes de rotación, utilidad por unidad y tiempo de reacondicionamiento.
- Exportación a Seminuevos.com y Facebook Marketplace.

## Incertidumbres

- **Cifras de proveedores o antiguas.** Casi todas las de fotos, precio, video y reseñas lo son: sirven como dirección, no como dato exacto. Hay dos versiones de Cox 2025 (7% contra 8% compra todo en línea) y dos cifras de fotos (+262% contra +349%).
- **Tiempo de respuesta contradictorio.** Un estudio dice que responder en menos de 10 min triplica la probabilidad de visita. DealerSocket (20.7M de leads) dice que el mejor cierre está entre 15 y 60 min. Una meta de menos de 10 min sigue siendo prudente.
- **Cantidad de fotos debatida.** CarStory encontró que 9 fotos dieron más leads que 20. Pesa más la selección que el número.
- **Datos de mercado sin verificar.** Las cifras atribuidas a la AMDA (5.5 a 6M de transacciones de usados al año) son de segunda mano.
- **Mercado Libre bloqueó la consulta directa (403).** Su información sale de prensa y comunicados.
- **Garantías de las agencias sin verificar.** Los términos de TREFA, GPA y Veautos son los que ellas anuncian.
- **Marketplace orgánico de Facebook.** Las fuentes no coinciden sobre si hacen falta *inventory partners*. Hay que confirmarlo en Commerce Manager.
- **Google "Vehicle listing".** El resultado enriquecido solo existe en EE. UU. En México el JSON-LD ayuda a la comprensión del catálogo, no garantiza resultados enriquecidos.
- **Posible confusión de marca.** En Seminuevos.com hay una agencia llamada "ARCA" que parece ser otro negocio. Hay que revisarlo antes de definir dominio y SEO.
- **Baja de placas.** Si es obligatoria al vender cambia según el estado, así que debe ser un campo configurable.
- **Pendientes que Arca tiene que confirmar.** Antes de publicar el copy faltan: número real de puntos de inspección, garantía, monto del apartado, tasa de referencia para la mensualidad y reseñas reales.