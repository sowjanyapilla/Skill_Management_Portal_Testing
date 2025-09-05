// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   optimizeDeps: {
//     exclude: ['lucide-react'],
//   },
// });



import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/", // or "./" if not hosted at root (e.g. GitHub Pages)
  build: {
    outDir: "dist",       // folder where build files go
    sourcemap: false,     // set to true only if you need debugging in prod
    minify: "esbuild",    // fast minification (default)
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
})