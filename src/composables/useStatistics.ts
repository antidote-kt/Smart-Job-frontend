import { computed, type Ref } from 'vue'
import type { InterviewVO } from '@/api/interview'
import { useInterviewStatus } from './useInterviewStatus'

/**
 * 统计数据计算的组合式函数
 */
export const useStatistics = (sessions: Ref<InterviewVO[]>) => {
  const { isCompleted } = useInterviewStatus()

  const totalSessions = computed(() => sessions.value.length)

  const completedSessions = computed(() => 
    sessions.value.filter(s => isCompleted(s.status)).length
  )

  const averageScore = computed(() => {
    const completed = sessions.value.filter(s => 
      isCompleted(s.status) && s.overallScore > 0
    )
    
    if (completed.length === 0) return 0
    
    return completed.reduce((sum, s) => sum + s.overallScore, 0) / completed.length
  })

  const recentSessions = computed(() => sessions.value.slice(0, 5))

  return {
    totalSessions,
    completedSessions,
    averageScore,
    recentSessions
  }
}