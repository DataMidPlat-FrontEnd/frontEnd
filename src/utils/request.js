/**
 * Axios 请求封装
 * 统一处理请求拦截、响应拦截、错误处理
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // API 基础路径
  timeout: 30000 // 请求超时时间 30秒
})

// 请求拦截器
// 方法：service.interceptors.request.use
service.interceptors.request.use(
  config => {
    const security = import.meta.env.VITE_SECURITY_CODE
    if (security) {
      config.headers['securityCode'] = security
    } else {
      console.warn('未配置 VITE_SECURITY_CODE，部分接口可能校验失败')
    }

    const method = String(config.method || 'get').toLowerCase()
    const url = String(config.url || '')
    const isOperateDock = url.startsWith('/operateDock/')
    const isLogin = url.endsWith('/operateDock/accountLogin')

    // 默认 POST 没声明时使用 application/json（去掉 charset，避免 415）
    if (method === 'post' && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }

    // 登录接口不注入 id；其他运营接口注入 id
    const parkIdEnv = import.meta.env.VITE_PARK_ID
    const shouldInjectParkId = isOperateDock && !isLogin
    if (shouldInjectParkId && parkIdEnv) {
      const id = parkIdEnv
      if (method === 'get') {
        config.params = { id, ...(config.params || {}) }
      } else {
        const ct = String(config.headers['Content-Type'] || '').toLowerCase()
        if (ct.includes('application/x-www-form-urlencoded') && config.data instanceof URLSearchParams) {
          config.data.set('id', id)
        } else {
          config.data = { id, ...(config.data || {}) }
        }
      }
    }

    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
// 方法：service.interceptors.response.use
service.interceptors.response.use(
  response => {
    const res = response.data
    console.log('API响应:', res)

    // 成功码兼容 "00000" 或数值 0
    if (res.code === '00000' || res.code === 0) {
      return res
    } else {
      console.error('业务错误:', res)
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
  },
  error => {
    // HTTP 错误处理
    console.error('响应错误:', error)

    let message = '网络请求失败'
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求地址不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        case 504:
          message = '网关超时'
          break
        default:
          message = `连接错误${error.response.status}`
      }
    } else if (error.message.includes('timeout')) {
      message = '请求超时'
    } else if (error.message.includes('Network Error')) {
      message = '网络连接异常'
    }

    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service

