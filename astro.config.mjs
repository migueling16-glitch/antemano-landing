import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// Ryo Café se mudó a su propio proyecto y dominio (ryocafe.com); las rutas
// viejas /ryocafe/* redirigen allá (vercel.json).
export default defineConfig({
  integrations: [tailwind()],
});
