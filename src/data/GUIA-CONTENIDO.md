# Manual Vivo™ — Guía de contenido

El contenido del portal vive en un solo archivo:
**`src/data/content.ts`**

No necesitas tocar los componentes ni las páginas. Solo este archivo.

---

## Cómo agregar un módulo nuevo

1. Abre `src/data/content.ts`
2. Encuentra el array `MODULOS`
3. Agrega un objeto al final del array (antes del cierre `]`):

```typescript
{
  slug: 'nombre-del-modulo',          // URL: /spiral/modulo/nombre-del-modulo
  titulo: 'Nombre del módulo',
  estacion: 'masa-pizza',             // una de: masa-pizza | pasta-fresca | salsas-base | principios-postres | protocolos
  tipo: 'platillo',                   // una de: subreceta | platillo | protocolo
  duracion: '4 min',
  descripcion: 'Descripción breve.',
  usaRecetas: ['masa-48-horas'],      // slugs de subrecetas que este platillo necesita
  usadaEn: [],                        // slugs de platillos que usan esta subreceta (si aplica)
  ficha: {
    'Ingrediente A': '200 g',
    'Ingrediente B': '50 ml',
    'Rendimiento': '2 porciones',
  },
  criterio: {
    bien: 'Descripción de cómo se ve cuando está bien hecho.',
    mal:  'Descripción de cómo se ve cuando está mal hecho.',
  },
},
```

4. Guarda el archivo — el servidor local se actualiza solo (`npm run dev`).

---

## Cómo cambiar el video de un módulo

Cuando el video esté listo, agrega el campo `videoUrl` al módulo correspondiente:

```typescript
{
  slug: 'masa-48-horas',
  titulo: 'Masa de 48 horas',
  // ... resto de campos ...
  videoUrl: 'https://www.youtube.com/embed/XXXXXXXXXXX',  // ← agregar esta línea
},
```

El reproductor lo detecta automáticamente y cambia el placeholder por el video real.

Formatos soportados:
- YouTube embed: `https://www.youtube.com/embed/VIDEO_ID`
- Vimeo embed: `https://player.vimeo.com/video/VIDEO_ID`

---

## Cómo agregar una estación nueva

En el array `ESTACIONES` de `content.ts`:

```typescript
{
  slug: 'reposteria',
  titulo: 'Repostería',
  descripcion: 'Postres, masas dulces y terminaciones.',
},
```

---

## Cómo agregar una ruta de aprendizaje nueva

En el array `RUTAS` de `content.ts`:

```typescript
{
  slug: 'nombre-de-la-ruta',
  titulo: 'Cocinero de pastas',
  descripcion: 'Descripción de la ruta.',
  puesto: 'Cocinero · Estación Pasta fresca',
  modulos: [                    // slugs en orden de aprendizaje
    'pasta-fresca-base',
    'carbonara',
    'ravioles-ricotta',
  ],
},
```

---

## Rutas del portal

| Página               | URL                                      |
|----------------------|------------------------------------------|
| Inicio               | `/spiral/`                               |
| Estación             | `/spiral/estacion/[slug]`                |
| Módulo               | `/spiral/modulo/[slug]`                  |
| Ruta de aprendizaje  | `/spiral/ruta/[slug]`                    |
| Landing QR           | `/spiral/escanea/[slug]`                 |

---

Hecho con Manual Vivo™ × Antemano
