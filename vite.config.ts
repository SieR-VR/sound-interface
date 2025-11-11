import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  base: "https://sier-vr.github.io/sound-intergace/",
});
