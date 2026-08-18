import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://gateciviltracker.com',
  integrations: [sitemap({
    filter: (page) => !page.includes('/about-us') && !page.includes('/contact-us') && !page.includes('/privacy/') && !page.includes('/terms-and-conditions')
  })],
  vite: {
    plugins: [tailwindcss()]
  }
});
