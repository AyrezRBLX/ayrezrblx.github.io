import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Repositório ayrezrblx.github.io publica na raiz, então base é '/'
export default defineConfig({ plugins: [react()], base: '/' })
