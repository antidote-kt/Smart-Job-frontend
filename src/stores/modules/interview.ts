import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  createInterviewApi,
  startInterviewApi,
  finishInterviewApi,
  getUserInterviewsApi,
  getInterviewDetailApi,
  getNextQuestionApi,
  submitAnswerApi,
  getPositionsApi,
  getNextQuestionStreamApi,
  getInterviewQuestionsApi,
  getInterviewEvaluationsApi,
  type InterviewVO, 
  type JobPosition, 
  type AnswerEvaluation,
  type InterviewReport,
  type AnswerSubmitDTO
} from '@/api/interview'

export const useInterviewStore = defineStore('interview', () => {
  const currentSession = ref<InterviewVO | null>(null)
  const sessions = ref<InterviewVO[]>([])
  const jobPositions = ref<JobPosition[]>([])
  const currentQuestion = ref<string>('')
  const currentQuestionId = ref<number | null>(null)
  const currentAnswer = ref<string>('')
  const latestEvaluation = ref<AnswerEvaluation | null>(null)
  const isLoading = ref<boolean>(false)

  const loadJobPositions = async () => {
    try {
      jobPositions.value = await getPositionsApi()
    } catch (error) {
      console.error('Failed to load job positions:', error)
      throw error
    }
  }

  const createSession = async (jobRequirementId: number, sessionName?: string, company?: string) => {
    try {
      isLoading.value = true
      // 先获取职位详情
      const positions = await getPositionsApi()
      const position = positions.find(p => p.id === jobRequirementId)
      
      if (!position) {
        throw new Error(`未找到ID为${jobRequirementId}的职位信息`)
      }
      
      const createData = {
        title: sessionName || `${position.name}模拟面试`,
        position: position.name,
        company: company || '目标公司',
        interviewType: 1, // 默认技术面试
        difficultyLevel: position.level === '初级' ? 1 : position.level === '高级' ? 3 : 2,
        totalQuestions: 10
      }
      
      const session = await createInterviewApi(createData)
      currentSession.value = session
      return session
    } catch (error) {
      console.error('Failed to create session:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const startSession = async (sessionId: number) => {
    try {
      isLoading.value = true
      const session = await startInterviewApi(sessionId)
      currentSession.value = session
      return session
    } catch (error) {
      console.error('Failed to start session:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const endSession = async (sessionId: number) => {
    try {
      isLoading.value = true
      const session = await finishInterviewApi(sessionId)
      currentSession.value = session
      return session
    } catch (error) {
      console.error('Failed to end session:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const loadSessions = async () => {
    try {
      sessions.value = await getUserInterviewsApi()
    } catch (error) {
      console.error('Failed to load sessions:', error)
      throw error
    }
  }

  const loadSession = async (sessionId: number) => {
    try {
      isLoading.value = true
      const session = await getInterviewDetailApi(sessionId)
      currentSession.value = session
      return session
    } catch (error) {
      console.error('Failed to load session:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const getNextQuestion = async (sessionId: number) => {
    try {
      isLoading.value = true
      const response = await getNextQuestionApi(sessionId)
      currentQuestion.value = response.question
      currentQuestionId.value = response.questionId || null
      currentAnswer.value = ''
      latestEvaluation.value = null
      return response
    } catch (error) {
      console.error('Failed to get next question:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const submitAnswer = async (sessionId: number, questionText: string, answerText: string) => {
    try {
      isLoading.value = true
      
      if (!currentQuestionId.value) {
        throw new Error('问题ID未找到，请先获取问题')
      }

      const evaluation = await submitAnswerApi({
        questionId: currentQuestionId.value,
        userAnswer: answerText
      })
      
      // 刷新会话数据
      await loadSession(sessionId)
      
      latestEvaluation.value = evaluation
      return evaluation
    } catch (error) {
      console.error('Failed to submit answer:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }


  const loadReport = async (sessionId: number) => {
    try {
      isLoading.value = true
      // 报告已嵌套在InterviewVO中，直接加载会话即可
      const session = await getInterviewDetailApi(sessionId)
      currentSession.value = session
      return session.report
    } catch (error) {
      console.error('Failed to load report:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const clearCurrentSession = () => {
    currentSession.value = null
    currentQuestion.value = ''
    currentQuestionId.value = null
    currentAnswer.value = ''
    latestEvaluation.value = null
  }

  // 添加获取questionId的辅助方法
  const refreshQuestionId = async (sessionId: number) => {
    try {
      // 获取最新的问题列表，取最后一个问题的ID
      const questions = await getInterviewQuestionsApi(sessionId)
      if (questions.length > 0) {
        currentQuestionId.value = questions[questions.length - 1].id
        console.log('获取到最新问题ID:', currentQuestionId.value)
      }
    } catch (error) {
      console.warn('Failed to get question ID:', error)
    }
  }

  // 流式方法
  const getNextQuestionStream = async (sessionId: number, onChunk: (chunk: string) => void, onComplete: (fullQuestion: string) => void) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const response = await getNextQuestionStreamApi(sessionId)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let fullQuestion = ''
        let buffer = ''

        const processBuffer = async () => {
          // 处理完整的 SSE 事件 (以 \n\n 分隔)
          const parts = buffer.split('\n\n')
          buffer = parts.pop() || '' // 保留最后一个可能不完整的部分
          
          for (const part of parts) {
            if (part.trim()) {
              const lines = part.split('\n')
              let eventType = ''
              let data = ''
              
              for (const line of lines) {
                const trimmed = line.trim()
                if (trimmed.startsWith('event:')) {
                  eventType = trimmed.substring(6).trim()
                } else if (trimmed.startsWith('data:')) {
                  data = trimmed.substring(5).trim()
                }
              }
              
              console.log('Processing SSE event:', { eventType, data: JSON.stringify(data) })
              
              if (eventType === 'message') {
                if (data === '[DONE]') {
                  console.log('✅ Received [DONE] signal, finalizing...')
                  currentQuestion.value = fullQuestion
                  await refreshQuestionId(sessionId)
                  onComplete(fullQuestion)
                  resolve()
                  return true // 表示处理完成
                } else if (data && data !== '') {
                  fullQuestion += data
                  onChunk(data)
                  console.log('📝 Added chunk:', JSON.stringify(data))
                  console.log('📋 Full question so far:', JSON.stringify(fullQuestion))
                }
              }
            }
          }
          return false // 表示未完成
        }

        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('🔚 Stream reader ended')
            // 处理剩余的buffer
            if (buffer.trim()) {
              console.log('Processing remaining buffer:', JSON.stringify(buffer))
              const completed = await processBuffer()
              if (completed) break
            }
            break
          }
          
          const chunk = decoder.decode(value, { stream: true })
          console.log('📡 Raw chunk received:', JSON.stringify(chunk))
          
          buffer += chunk
          const completed = await processBuffer()
          if (completed) break
        }
        
        // 如果流正常结束但没有收到 [DONE]
        console.log('🏁 Stream processing complete. Final question:', JSON.stringify(fullQuestion))
        if (fullQuestion.trim()) {
          currentQuestion.value = fullQuestion
          await refreshQuestionId(sessionId)
          onComplete(fullQuestion)
        } else {
          console.warn('⚠️ No valid question content received')
          throw new Error('未接收到有效的问题内容')
        }
        
        resolve()
      } catch (error) {
        console.error('❌ Stream error:', error)
        reject(error)
      }
    })
  }


  return {
    currentSession,
    sessions,
    jobPositions,
    currentQuestion,
    currentQuestionId,
    currentAnswer,
    latestEvaluation,
    isLoading,
    loadJobPositions,
    createSession,
    startSession,
    endSession,
    loadSessions,
    loadSession,
    getNextQuestion,
    submitAnswer,
    loadReport,
    clearCurrentSession,
    getNextQuestionStream
  }
})