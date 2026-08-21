import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Strona jest statyczna (szybka), a dwa endpointy w src/pages/api/
// mają `export const prerender = false` — one działają jako
// funkcje serverless na Vercelu (Node).
export default defineConfig({
  site: 'https://xoxobeautylab.pl',
  output: 'static',
  adapter: vercel(),
});
