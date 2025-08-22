import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例对象
const request = axios.create({
  baseURL: '/api',
  timeout: 600000
})

// 请求拦截器 - 添加token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers = config.headers || {}
      config.headers['authentication'] = token
    } else {
      // 清除无效token
      localStorage.removeItem('token')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    console.log('✅ API Success:', response.config.url, response.status)
    // 成功回调，直接返回data部分
    return response.data
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })
    
    // 失败回调
    // 如果是登录接口的401错误，不要重定向
    if (error.config?.url === '/auth/login' && error.response?.status === 401) {
      return Promise.reject(error)
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      ElMessage.error('登录已过期，请重新登录')
    } else if (error.response?.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else if (error.response?.data?.message) {
      // 如果后端返回了具体的错误消息，显示它
      ElMessage.error(error.response.data.message)
    } else if (error.message) {
      ElMessage.error(`请求失败: ${error.message}`)
    }
    
    return Promise.reject(error)
  }
)

export default request