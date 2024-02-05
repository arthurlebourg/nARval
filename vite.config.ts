import { resolve } from 'path'
import { defineConfig } from 'vite'

const  __dirname = resolve();

const root = resolve(__dirname, 'src')
const outDir = resolve(__dirname, 'dist')

// https://vitejs.dev/config/
export default defineConfig({
  root,
  plugins: [],
  build: {
    sourcemap: true,
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        debug_ai: resolve(root, 'debug_ai/index.html'),
      }
    }
  }
})
