/**
 * 简化的通知管理 Store
 */

import { defineStore } from 'pinia'
import { notificationService } from '@/services/notificationService'

export const useNotificationStore = defineStore('notification', () => {
  
  const startService = () => {
    notificationService.connect()
  }

  const stopService = () => {
    notificationService.disconnect()
  }

  return {
    startService,
    stopService
  }
})