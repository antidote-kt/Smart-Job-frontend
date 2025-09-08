
/**
 * 面试状态相关的组合式函数
 */
export const useInterviewStatus = () => {
  const getStatusType = (status: string | number) => {
    const statusStr = String(status)
    switch (statusStr) {
      case 'COMPLETED':
      case '2': return 'success'
      case 'IN_PROGRESS':
      case '1': return 'warning'
      case 'CREATED':
      case '0': return 'info'
      default: return 'info'
    }
  }

  const getStatusText = (status: string | number) => {
    const statusStr = String(status)
    switch (statusStr) {
      case 'COMPLETED':
      case '2': return '已完成'
      case 'IN_PROGRESS':
      case '1': return '进行中'
      case 'CREATED':
      case '0': return '已创建'
      default: return '未知'
    }
  }

  const isCompleted = (status: string | number) => {
    const statusStr = String(status)
    return statusStr === '2' || status === 'COMPLETED'
  }

  const isInProgress = (status: string | number) => {
    const statusStr = String(status)
    return statusStr === '1' || status === 'IN_PROGRESS'
  }

  return {
    getStatusType,
    getStatusText,
    isCompleted,
    isInProgress
  }
}