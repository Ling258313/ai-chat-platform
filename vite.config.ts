import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    watch: {
      // 这几条都是为了躲开 chokidar 的 EBUSY 崩溃：
      // Windows 上如果监听了一个正被写入/改名的文件，chokidar 会 emit 'error'，
      // 而 Vite 没有兜住这个 error，整个 dev server 会直接退出。
      //
      //   **/server/**     BFF 目录：里面同时跑着 node --watch，还有 .env 落盘
      //   **/*.tmpdir/**   编辑器保存文件时的原子写临时目录（就是崩过的那个）
      //   **/*.tmp         其它临时文件
      ignored: ['**/server/**', '**/*.tmpdir/**', '**/*.tmp'],
    },
    proxy: {
      // 把 /api 转发给本地的 Node BFF(server/ 目录)。
      // 走这一层之后,大模型的 API Key 只存在于服务端环境变量里,
      // 浏览器不再持有密钥,产物里也不会内联任何密钥。
      // 启动方式:cd server && npm run dev
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
