import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' usa rutas relativas para que funcione igual en GitHub Pages
// (sirva desde la raíz o desde /nombre-del-repo/) sin tener que tocar nada.
export default defineConfig({
  plugins: [react()],
  base: '/panel-control-pwa/',
});
