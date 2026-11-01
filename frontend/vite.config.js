import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 本地智能体（垚垚）默认跑在 8010，通过 /agent 前缀代理，
// 让前端同源请求，避免跨域与 CORS 配置改动。
const agentProxy = {
  '/agent': {
    target: process.env.VITE_AGENT_TARGET || 'http://127.0.0.1:8010',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/agent/, ''),
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      ...agentProxy,
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      ...agentProxy,
    },
  },
})
