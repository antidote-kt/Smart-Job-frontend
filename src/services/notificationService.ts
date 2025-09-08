/**
 * 优化的 WebSocket 通知服务 - 按需连接
 * 只在有进行中的面试时连接，收到通知后自动断开
 */

import { ElNotification } from 'element-plus'
import router from '@/router'
import { useInterviewStore } from '@/stores/modules/interview'

interface ReportNotification {
  type: 'REPORT_GENERATED'
  sessionId: number
  message: string
}

class NotificationService {
  private ws: WebSocket | null = null

  connect() {
    const token = localStorage.getItem('token')
    if (!token) return

    // 如果已经连接，不重复连接
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL
      if (!wsBaseUrl) return
      
      const wsUrl = `${wsBaseUrl}/ws/notifications?token=${token}`
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        // WebSocket连接成功
      }
      
      this.ws.onmessage = (event) => {
        try {
          const notification: ReportNotification = JSON.parse(event.data)
          
          if (notification.type === 'REPORT_GENERATED') {
            // 显示通知
            ElNotification({
              title: '报告生成完成',
              message: notification.message + '\n💡 点击此通知可直接查看报告',
              type: 'success',
              duration: 10000,
              onClick: () => router.push(`/interview/${notification.sessionId}/report`)
            })
            
            // 刷新面试列表数据 - 仅在特定页面更新
            const interviewStore = useInterviewStore()
            // 只在仪表板或历史页面时才刷新，避免不必要的API调用
            if (router.currentRoute.value.path === '/dashboard' || 
                router.currentRoute.value.path === '/history') {
              interviewStore.loadSessions().catch(() => {})
            }
            
            this.disconnect()
          }
        } catch (error) {
          // 静默处理解析错误
        }
      }
      
      this.ws.onclose = () => {
        this.ws = null
      }
      
      this.ws.onerror = () => {
        // 静默处理连接错误
      }
      
    } catch (error) {
      // 静默处理连接失败
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  get isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

export const notificationService = new NotificationService()