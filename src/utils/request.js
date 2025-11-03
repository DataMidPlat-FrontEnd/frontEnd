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
service.interceptors.request.use(
  config => {
    // 统一添加 securityCode 到请求头
    config.headers['securityCode'] = import.meta.env.VITE_SECURITY_CODE

    // 如果是 POST 请求且没有设置 Content-Type，默认使用 application/json
    if (config.method === 'post' && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }

    return config
  },
  error => {
    // 请求错误处理
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data

    // 打印响应数据用于调试
    console.log('API响应:', res)

    // 根据接口文档，正常响应的 code 为 "00000"
    if (res.code === '00000') {
      return res
    } else {
      // 业务错误处理
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

