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
      const wsUrl = `${import.meta.env.VITE_WS_BASE_URL}/ws/notifications?token=${token}`
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket连接成功')
      }
      
      this.ws.onmessage = (event) => {
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
          
          // 刷新面试列表数据
          const interviewStore = useInterviewStore()
          interviewStore.loadSessions().catch(console.error)
          
          this.disconnect()
        }
      }
      
      this.ws.onclose = () => {
        this.ws = null
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket连接错误:', error)
      }
      
    } catch (error) {
      console.error('WebSocket连接失败:', error)
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