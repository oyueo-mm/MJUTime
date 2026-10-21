import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/MJUTime/',
  plugins: [react(), tailwindcss()],
  test: { include: ['src/**/*.test.ts'] },
  build: { rollupOptions: { output: { manualChunks: { three: ['three'], scene: ['@react-three/fiber', '@react-three/drei'] } } } },
})
