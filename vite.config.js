/**
 * Vite 配置文件
 * 配置了 Vue 插件和开发服务器代理
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  // 路径别名配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },

  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
    // 配置代理解决跨域问题
    proxy: {
      '/grmh-eqmgrb': {
        target: 'http://47.106.233.89:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/grmh-eqmgrb/, '/grmh-eqmgrb')
      }
    }
  }
})

