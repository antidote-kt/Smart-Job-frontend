/**
 * 面试管理 Store
 * 使用 Pinia 进行状态管理，管理面试会话、问题、回答等相关数据和操作
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  createInterviewApi,
  startInterviewApi,
  finishInterviewApi,
  getUserInterviewsApi,
  getInterviewDetailApi,
  submitAnswerApi,
  getPositionsApi,
  getNextQuestionStreamApi,
  getInterviewQuestionsApi,
  type InterviewVO, 
  type JobPosition, 
  type AnswerEvaluation,
} from '@/api/interview'

export const useInterviewStore = defineStore('interview', () => {
  // ==================== 状态定义 ====================
  
  /** 当前活跃的面试会话 */
  const currentSession = ref<InterviewVO | null>(null)
  
  /** 用户所有面试会话列表 */
  const sessions = ref<InterviewVO[]>([])
  
  /** 可选择的工作岗位列表 */
  const jobPositions = ref<JobPosition[]>([])
  
  /** 当前面试问题文本 */
  const currentQuestion = ref<string>('')
  
  /** 当前问题的数据库ID */
  const currentQuestionId = ref<number | null>(null)
  
  /** 当前用户回答的内容 */
  const currentAnswer = ref<string>('')
  
  /** 最新的回答评价结果 */
  const latestEvaluation = ref<AnswerEvaluation | null>(null)
  
  /** 全局加载状态 */
  const isLoading = ref<boolean>(false)

  // ==================== 基础数据加载 ====================

  /**
   * 加载可选择的工作岗位列表
   * 用于面试创建时的岗位选择
   */
  const loadJobPositions = async () => {
    try {
      jobPositions.value = await getPositionsApi()
    } catch (error) {
      console.error('Failed to load job positions:', error)
      throw error
    }
  }

  // ==================== 面试会话管理 ====================

  /**
   * 创建新的面试会话
   * @param jobRequirementId 工作岗位ID
   * @param sessionName 面试会话名称（可选）
   * @param company 公司名称（可选）
   * @returns 创建的面试会话对象
   */
  const createSession = async (jobRequirementId: number, sessionName?: string, company?: string) => {
    try {
      isLoading.value = true
      
      // 获取职位详情用于构建面试配置
      const positions = await getPositionsApi()
      const position = positions.find(p => p.id === jobRequirementId)
      
      if (!position) {
        throw new Error(`未找到ID为${jobRequirementId}的职位信息`)
      }
      
      // 构建创建面试的数据
      const createData = {
        title: sessionName || `${position.name}模拟面试`,
        position: position.name,
        company: company || '目标公司',
        interviewType: 1, // 默认技术面试
        difficultyLevel: position.level === '初级' ? 1 : position.level === '高级' ? 3 : 2,
        totalQuestions: 10 // 默认10道题
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

  /**
   * 开始面试会话
   * 将面试状态从"已创建"切换到"进行中"
   * @param sessionId 面试会话ID
   * @returns 更新后的面试会话对象
   */
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

  /**
   * 结束面试会话
   * 将面试状态切换到"已完成"，触发报告生成
   * @param sessionId 面试会话ID
   * @returns 更新后的面试会话对象
   */
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

  /**
   * 加载用户所有面试会话列表
   * 用于仪表盘和历史记录页面展示
   */
  const loadSessions = async () => {
    try {
      sessions.value = await getUserInterviewsApi()
    } catch (error) {
      
      // 检查是否是网络连接问题，提供更友好的错误信息
      if (error.message === 'Network Error' || error.code === 'NETWORK_ERROR') {
        throw new Error('网络连接失败，请检查网络连接或后端服务是否正常运行')
      }
      throw error
    }
  }

  /**
   * 加载特定面试会话的详细信息
   * @param sessionId 面试会话ID
   * @returns 面试会话详细信息
   */
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

  // ==================== 问答交互管理 ====================

  /**
   * 提交用户回答并获取AI评价
   * @param sessionId 面试会话ID  
   * @param questionText 问题文本（暂未使用）
   * @param answerText 用户回答内容
   * @returns AI评价结果
   */
  const submitAnswer = async (sessionId: number, questionText: string, answerText: string) => {
    try {
      isLoading.value = true
      
      // 验证问题ID是否存在
      if (!currentQuestionId.value) {
        throw new Error('问题ID未找到，请先获取问题')
      }

      // 提交回答到服务端
      const evaluation = await submitAnswerApi({
        questionId: currentQuestionId.value,
        userAnswer: answerText
      })
      
      // 刷新会话数据以获取最新状态
      await loadSession(sessionId)
      
      // 保存最新评价结果
      latestEvaluation.value = evaluation
      return evaluation
    } catch (error) {
      console.error('Failed to submit answer:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // ==================== 报告管理 ====================

  /**
   * 加载面试评估报告
   * @param sessionId 面试会话ID
   * @returns 面试报告对象
   */
  const loadReport = async (sessionId: number) => {
    try {
      isLoading.value = true
      // 报告数据嵌套在面试会话对象中
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

  // ==================== 辅助工具方法 ====================

  /**
   * 清除当前面试会话的所有临时数据
   * 用于退出面试或开始新面试时的状态重置
   */
  const clearCurrentSession = () => {
    currentSession.value = null
    currentQuestion.value = ''
    currentQuestionId.value = null
    currentAnswer.value = ''
    latestEvaluation.value = null
  }

  /**
   * 刷新当前问题的ID
   * 用于流式问题生成后获取服务端分配的问题ID
   * @param sessionId 面试会话ID
   */
  const refreshQuestionId = async (sessionId: number) => {
    try {
      // 获取最新的问题列表
      const questions = await getInterviewQuestionsApi(sessionId)
      
      if (questions.length > 0) {
        // 直接使用最新的问题ID（按时间或ID排序，取最后一个）
        const latestQuestion = questions.sort((a, b) => b.id - a.id)[0]
        currentQuestionId.value = latestQuestion.id
      }
    } catch (error) {
      console.warn('Failed to get question ID:', error)
    }
  }

  // ==================== 流式问题生成 ====================

  /**
   * 获取下一个面试问题（流式方式）
   * 支持实时显示问题生成过程，提供更好的用户体验
   * @param sessionId 面试会话ID
   * @param onChunk 接收问题片段的回调函数
   * @param onComplete 问题完成生成的回调函数
   */
  const getNextQuestionStream = async (
    sessionId: number, 
    onChunk: (chunk: string) => void, 
    onComplete: (fullQuestion: string) => void
  ) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // 发起流式请求
        const response = await getNextQuestionStreamApi(sessionId)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        if (!response.body) {
          throw new Error('No response body')
        }

        // 设置流式数据读取器
        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let fullQuestion = ''
        let buffer = '' // 缓存不完整的数据

        /**
         * 处理接收到的数据缓存
         * 解析 Server-Sent Events (SSE) 格式的数据流
         */
        const processBuffer = async () => {
          // 处理完整的 SSE 事件 (以 \n\n 分隔)
          const parts = buffer.split('\n\n')
          buffer = parts.pop() || '' // 保留最后一个可能不完整的部分
          
          for (const part of parts) {
            if (part.trim()) {
              const lines = part.split('\n')
              let eventType = ''
              let data = ''
              
              // 解析 SSE 格式数据
              for (const line of lines) {
                const trimmed = line.trim()
                if (trimmed.startsWith('event:')) {
                  eventType = trimmed.substring(6).trim()
                } else if (trimmed.startsWith('data:')) {
                  data = trimmed.substring(5).trim()
                }
              }
              // 处理消息事件
              if (eventType === 'message') {
                if (data === '[DONE]') {
                  // 问题生成完成信号
                  currentQuestion.value = fullQuestion
                  await refreshQuestionId(sessionId)
                  onComplete(fullQuestion)
                  resolve()
                  return true // 表示处理完成
                } else if (data && data !== '') {
                  // 问题内容片段
                  fullQuestion += data
                  onChunk(data)
                }
              }
            }
          }
          return false // 表示未完成
        }

        // 持续读取流式数据
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            // 处理剩余的缓存数据
            if (buffer.trim()) {
              const completed = await processBuffer()
              if (completed) break
            }
            break
          }
          
          // 解码新接收的数据块
          const chunk = decoder.decode(value, { stream: true })
          // 添加到缓存并处理
          buffer += chunk
          const completed = await processBuffer()
          if (completed) break
        }
        
        // 如果流正常结束但没有收到 [DONE] 信号
        if (fullQuestion.trim()) {
          currentQuestion.value = fullQuestion
          await refreshQuestionId(sessionId)
          onComplete(fullQuestion)
        } else {
          throw new Error('未接收到有效的问题内容')
        }
        
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  // ==================== Store 导出 ====================

  return {
    // 状态数据
    currentSession,
    sessions,
    jobPositions,
    currentQuestion,
    currentQuestionId,
    currentAnswer,
    latestEvaluation,
    isLoading,
    
    // 业务方法
    loadJobPositions,
    createSession,
    startSession,
    endSession,
    loadSessions,
    loadSession,
    submitAnswer,
    loadReport,
    clearCurrentSession,
    getNextQuestionStream
  }
})