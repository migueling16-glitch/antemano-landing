import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  // React solo se usa en la maqueta de la app de Ryo (src/ryo/app). Las demás
  // páginas no cargan nada de React: Astro solo manda JS donde hay una isla.
  integrations: [tailwind(), react()],
});
