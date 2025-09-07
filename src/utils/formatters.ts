/**
 * 格式化工具函数
 */

export const formatDate = (dateInput?: string | number[]) => {
  if (!dateInput) return '-'
  
  try {
    let date: Date
    
    // 处理数组格式的时间 [year, month, day, hour, minute, second]
    if (Array.isArray(dateInput)) {
      // JavaScript月份从0开始，所以需要减1
      date = new Date(
        dateInput[0], // year
        dateInput[1] - 1, // month (0-based)
        dateInput[2], // day
        dateInput[3] || 0, // hour
        dateInput[4] || 0, // minute
        dateInput[5] || 0  // second
      )
    } else {
      // 处理字符串格式
      date = new Date(dateInput)
    }
    
    if (isNaN(date.getTime())) return '-'
    
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '-'
  }
}

export const formatSessionName = (title?: string, id?: number): string => {
  return title || `面试 #${id}`
}