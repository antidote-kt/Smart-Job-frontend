<template>
  <div class="interview-room">
    <div class="room-header">
      <div class="session-info">
        <h2>{{ session?.title || `面试 #${sessionId}` }}</h2>
        <div class="session-details">
          <el-tag :type="getStatusType(session?.status)" size="large">
            {{ getStatusText(session?.status) }}
          </el-tag>
          <span class="separator">|</span>
          <span>已回答: {{ session?.answeredQuestions || 0 }} 题</span>
          <span class="separator">|</span>
          <span>平均分: {{ (currentAverageScore || 0).toFixed(1) }} 分</span>
        </div>
      </div>
      <div class="room-actions">
        <el-button @click="goBack" :icon="ArrowLeft">
          返回
        </el-button>
        <el-button @click="toggleFullscreen" :icon="isFullscreen ? 'OfficeBuilding' : 'FullScreen'">
          {{ isFullscreen ? '退出全屏' : '全屏模式' }}
        </el-button>
        <el-button type="danger" @click="handleEndInterview">
          结束面试
        </el-button>
      </div>
    </div>

    <div class="room-content" :class="{ 'fullscreen': isFullscreen }">
      <!-- 全屏模式下的浮动退出按钮 -->
      <div v-if="isFullscreen" class="fullscreen-exit-btn">
        <el-button 
          @click="toggleFullscreen" 
          type="primary" 
          :icon="CloseBold" 
          circle 
          size="large"
          title="退出全屏"
        />
      </div>
      
      <!-- Progress Bar -->
      <div class="progress-section">
        <el-card shadow="never" class="progress-card">
          <div class="progress-header">
            <span class="progress-label">面试进度</span>
            <span class="progress-text">{{ questionCount }}/{{ targetQuestions }} 题</span>
          </div>
          <el-progress
            :percentage="progressPercentage"
            :stroke-width="8"
            :show-text="false"
            color="#409eff"
          />
        </el-card>
      </div>

      <el-row :gutter="20" class="main-row">
        <!-- Question and Answer Section -->
        <el-col :span="16">
          <!-- Current Question - 固定显示 -->
          <el-card class="question-card" shadow="hover">
            <template #header>
              <div class="question-header">
                <el-icon><QuestionFilled /></el-icon>
                <span>面试问题</span>
                <el-tag size="small" type="info">第 {{ questionCount + 1 }} 题</el-tag>
                <el-icon v-if="isGenerating" class="streaming-icon"><Loading /></el-icon>
              </div>
            </template>
            <div class="question-content">
              <div v-if="isGenerating" class="streaming-question">
                <div class="question-text streaming">{{ displayQuestion }}<span class="cursor">|</span></div>
              </div>
              <div v-else-if="displayQuestion" class="question-text">{{ displayQuestion }}</div>
              <div v-else class="question-placeholder">
                <p>点击"获取问题"开始面试</p>
              </div>
            </div>
          </el-card>

          <!-- Answer Input -->
          <el-card class="answer-card" shadow="hover">
            <template #header>
              <div class="answer-header">
                <el-icon><EditPen /></el-icon>
                <span>您的回答</span>
                <div class="answer-actions">
                  <el-button
                    size="small"
                    @click="handleVoiceInput"
                    :type="isListening ? 'danger' : 'primary'"
                    :loading="isListening"
                    text
                  >
                    <el-icon><Microphone /></el-icon>
                    {{ isListening ? '停止录音' : '语音输入' }}
                  </el-button>
                </div>
              </div>
            </template>
            <div class="answer-input">
              <el-input
                v-model="currentAnswer"
                type="textarea"
                :rows="8"
                placeholder="请输入您的回答，或点击语音输入..."
                :disabled="isSubmitting"
                @input="onAnswerInput"
              />
              <div class="answer-footer">
                <div class="word-count">
                  {{ currentAnswer.length }} 字
                </div>
                <div class="submit-actions">
                  <el-button @click="generateNewQuestion" :loading="isGenerating">
                    获取问题
                  </el-button>
                  <el-button
                    type="primary"
                    @click="submitAnswer"
                    :loading="isSubmitting"
                    :disabled="!currentAnswer.trim()"
                  >
                    提交回答
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

        </el-col>

        <!-- Real-time Evaluation Panel -->
        <el-col :span="8">
          <div class="evaluation-panel">
            <!-- Real-time Score -->
            <el-card class="score-card" shadow="hover" v-if="latestEvaluation">
              <template #header>
                <div class="score-header">
                  <el-icon><TrendCharts /></el-icon>
                  <span>实时评分</span>
                </div>
              </template>
              <div class="score-content">
                <div class="overall-score">
                  <div class="score-number">{{ (latestEvaluation.overallScore || 0).toFixed(1) }}</div>
                  <div class="score-label">总分</div>
                </div>
                <div class="score-breakdown">
                  <div class="score-item">
                    <div class="score-item-header">
                      <span>专业性</span>
                      <span class="score-value">{{ (latestEvaluation.professionalScore || 0).toFixed(1) }}</span>
                    </div>
                    <el-progress
                      :percentage="latestEvaluation.professionalScore || 0"
                      :stroke-width="6"
                      :show-text="false"
                      color="#67c23a"
                    />
                  </div>
                  <div class="score-item">
                    <div class="score-item-header">
                      <span>逻辑性</span>
                      <span class="score-value">{{ (latestEvaluation.logicScore || 0).toFixed(1) }}</span>
                    </div>
                    <el-progress
                      :percentage="latestEvaluation.logicScore || 0"
                      :stroke-width="6"
                      :show-text="false"
                      color="#409eff"
                    />
                  </div>
                  <div class="score-item">
                    <div class="score-item-header">
                      <span>完整性</span>
                      <span class="score-value">{{ (latestEvaluation.completenessScore || 0).toFixed(1) }}</span>
                    </div>
                    <el-progress
                      :percentage="latestEvaluation.completenessScore || 0"
                      :stroke-width="6"
                      :show-text="false"
                      color="#e6a23c"
                    />
                  </div>
                  <div class="score-item">
                    <div class="score-item-header">
                      <span>综合评分</span>
                      <span class="score-value">{{ (latestEvaluation.overallScore || 0).toFixed(1) }}</span>
                    </div>
                    <el-progress
                      :percentage="latestEvaluation.overallScore || 0"
                      :stroke-width="6"
                      :show-text="false"
                      color="#f56c6c"
                    />
                  </div>
                </div>
              </div>
            </el-card>

            <!-- AI Feedback -->
            <el-card class="feedback-card" shadow="hover" v-if="latestEvaluation">
              <template #header>
                <div class="feedback-header">
                  <el-icon><ChatLineSquare /></el-icon>
                  <span>AI 评价反馈</span>
                </div>
              </template>
              <div class="feedback-content">
                <div class="feedback-text">
                  <p>{{ latestEvaluation.aiFeedback }}</p>
                </div>
              </div>
            </el-card>

            <!-- Session Stats -->
            <el-card class="stats-card" shadow="hover">
              <template #header>
                <div class="stats-header">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>本次统计</span>
                </div>
              </template>
              <div class="stats-content">
                <div class="stat-item">
                  <span class="stat-label">面试时长</span>
                  <span class="stat-value">{{ formatDuration(interviewDuration) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">平均答题时间</span>
                  <span class="stat-value">{{ averageAnswerTime }}s</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">当前评分趋势</span>
                  <span class="stat-value" :class="getTrendClass(scoreTrend)">
                    <el-icon><component :is="getTrendIcon(scoreTrend)" /></el-icon>
                    {{ getTrendText(scoreTrend) }}
                  </span>
                </div>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useInterviewStore } from '@/stores/modules/interview'
import type { AnswerEvaluation } from '@/api/interview'
import { getInterviewEvaluationsApi } from '@/api/interview'
import { ChatLineSquare, Check, DataAnalysis, DocumentAdd, Finished, CircleCheckFilled, Timer, ChatDotSquare, WarningFilled, ArrowLeft, CloseBold, Document, Star } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const interviewStore = useInterviewStore()

const sessionId = parseInt(route.params.id as string)
const session = computed(() => interviewStore.currentSession)
const currentQuestion = computed(() => interviewStore.currentQuestion)
const currentAnswer = ref('')
const latestEvaluation = ref<AnswerEvaluation | null>(null)

// 流式显示用的本地状态
const streamingQuestion = ref('')
const displayQuestion = computed(() => streamingQuestion.value || currentQuestion.value)

const isGenerating = ref(false)
const isSubmitting = ref(false)
const isListening = ref(false)
const isFullscreen = ref(false)


const questionCount = computed(() => session.value?.answeredQuestions || 0)
const targetQuestions = computed(() => session.value?.totalQuestions || 10)

// 实时计算当前平均分
const currentAverageScore = computed(() => {
  if (session.value?.overallScore && session.value.overallScore > 0) {
    return session.value.overallScore
  }
  
  // 如果没有总分，从已有的评估中计算
  if (latestEvaluation.value?.overallScore) {
    return latestEvaluation.value.overallScore
  }
  
  return 0
})
const interviewStartTime = ref<Date | null>(null)
const interviewDuration = ref(0)
const answerStartTime = ref<Date | null>(null)
const answerTimes = ref<number[]>([])

// 面试历史记录
const interviewHistory = ref<Array<{
  question: string
  answer: string
  evaluation?: AnswerEvaluation
}>>([])
const activeHistoryItems = ref<string | number>('')

const progressPercentage = computed(() => {
  return Math.min((questionCount.value / targetQuestions.value) * 100, 100)
})

const averageAnswerTime = computed(() => {
  if (answerTimes.value.length === 0) {
    // Fallback: calculate based on total duration and answered questions
    if (interviewDuration.value > 0 && questionCount.value > 0) {
      return Math.round(interviewDuration.value / questionCount.value)
    }
    return 0
  }
  const sum = answerTimes.value.reduce((a, b) => a + b, 0)
  return Math.round(sum / answerTimes.value.length)
})

const scoreTrend = computed(() => {
  // Simple trend calculation - could be enhanced
  const evaluations = [latestEvaluation.value].filter(Boolean)
  if (evaluations.length < 2) return 'stable'
  
  const recent = evaluations.slice(-2)
  if (recent.length < 2 || !recent[0] || !recent[1]) return 'stable'
  
  const diff = recent[1].score - recent[0].score
  
  if (diff > 5) return 'up'
  if (diff < -5) return 'down'
  return 'stable'
})

let durationTimer: NodeJS.Timeout | null = null

onMounted(async () => {
  await loadSession()
  startDurationTimer()
})

onUnmounted(() => {
  if (durationTimer) {
    clearInterval(durationTimer)
    durationTimer = null
  }
})

watch(currentQuestion, (newQuestion) => {
  if (newQuestion) {
    // 设置答题开始时间
    answerStartTime.value = new Date()
    console.log('设置答题开始时间:', answerStartTime.value)
  }
})

const loadSession = async () => {
  try {
    await interviewStore.loadSession(sessionId)
    
    if (!session.value) {
      ElMessage.error('面试会话不存在')
      router.push('/dashboard')
      return
    }

    console.log('面试会话状态:', session.value.status)
    console.log('面试会话开始时间:', session.value.startTime)

    if (session.value.status === 0) {  // STATUS_CREATED
      console.log('面试状态为CREATED，调用startSession')
      await interviewStore.startSession(sessionId)
      interviewStartTime.value = new Date()
      console.log('设置面试开始时间为:', interviewStartTime.value)
    } else if (session.value.startTime) {
      // 处理后端返回的时间格式 - 可能是数组格式 [年,月,日,时,分,秒]
      console.log('使用后端返回的开始时间:', session.value.startTime)
      
      let startTime: Date
      if (Array.isArray(session.value.startTime)) {
        // 数组格式: [年, 月-1, 日, 时, 分, 秒] (注意月份需要-1)
        const [year, month, day, hour, minute, second] = session.value.startTime
        startTime = new Date(year, month - 1, day, hour, minute, second)
      } else {
        // 字符串格式
        startTime = new Date(session.value.startTime)
      }
      
      interviewStartTime.value = startTime
      console.log('转换后的开始时间:', interviewStartTime.value)
    } else {
      // 如果没有开始时间，设置为当前时间
      console.log('没有开始时间，设置为当前时间')
      interviewStartTime.value = new Date()
      console.log('设置的开始时间:', interviewStartTime.value)
    }

    // 立即计算一次时长验证
    if (interviewStartTime.value && !isNaN(interviewStartTime.value.getTime())) {
      interviewDuration.value = Math.floor((Date.now() - interviewStartTime.value.getTime()) / 1000)
      console.log('初始计算面试时长:', interviewDuration.value, '秒，格式化:', formatDuration(interviewDuration.value))
    } else {
      console.warn('面试开始时间无效:', interviewStartTime.value)
    }

    // 加载面试历史记录
    await loadInterviewHistory()
    console.log('历史记录加载完成，记录数量:', interviewHistory.value.length)
  } catch (error) {
    console.error('加载面试会话失败:', error)
    ElMessage.error('加载面试会话失败')
    router.push('/dashboard')
  }
}

// 加载面试历史记录
const loadInterviewHistory = async () => {
  try {
    // 同时获取问题列表和评价列表
    const [questions, evaluations] = await Promise.all([
      interviewStore.getInterviewQuestions?.(sessionId) || [],
      getInterviewEvaluationsApi(sessionId)
    ])
    
    // 构建历史记录
    const history = []
    for (const question of questions) {
      if (question.userAnswer) {  // 只显示已回答的问题
        const historyItem: any = {
          question: question.questionText,
          answer: question.userAnswer
        }
        
        // 根据qaRecordId关联评价数据
        const evaluation = evaluations.find(e => e.qaRecordId === question.id)
        if (evaluation) {
          historyItem.evaluation = evaluation
        }
        
        history.push(historyItem)
      }
    }
    
    interviewHistory.value = history
  } catch (error) {
    console.warn('加载面试历史记录失败:', error)
  }
}

const startDurationTimer = () => {
  if (durationTimer) {
    clearInterval(durationTimer)
  }
  
  durationTimer = setInterval(() => {
    if (interviewStartTime.value) {
      const now = Date.now()
      const startTime = interviewStartTime.value.getTime()
      interviewDuration.value = Math.floor((now - startTime) / 1000)
      // 移除频繁的日志输出，避免控制台刷屏
      // console.log(`面试时长: ${interviewDuration.value}秒, 格式化: ${formatDuration(interviewDuration.value)}`)
    } else {
      console.warn('面试开始时间未设置')
    }
  }, 1000)
  
  console.log('计时器已启动')
}

const generateNewQuestion = async () => {
  try {
    isGenerating.value = true
    streamingQuestion.value = '' // 清空流式问题
    
    // 使用流式生成问题
    await interviewStore.getNextQuestionStream(
      sessionId,
      (chunk: string) => {
        // 实时显示生成的问题片段
        streamingQuestion.value += chunk
        console.log('接收到问题片段:', chunk)
      },
      (fullQuestion: string) => {
        // 问题生成完成
        streamingQuestion.value = fullQuestion
        console.log('问题生成完成:', fullQuestion)
        console.log('设置 isGenerating 为 false')
        isGenerating.value = false // 在完成回调中设置
      }
    )
  } catch (error) {
    console.error('流式生成失败，回退到同步方式:', error)
    // 清空流式状态，回退到原有的同步方式
    streamingQuestion.value = ''
    try {
      await interviewStore.getNextQuestion(sessionId)
    } catch (syncError) {
      ElMessage.error('生成问题失败')
    }
  } finally {
    // 确保在任何情况下都设置为false
    console.log('在 finally 中设置 isGenerating 为 false')
    isGenerating.value = false
  }
}

const submitAnswer = async () => {
  if (!currentAnswer.value.trim()) {
    ElMessage.warning('请输入回答内容')
    return
  }

  try {
    isSubmitting.value = true
    
    // Record answer time for local statistics
    if (answerStartTime.value) {
      const answerDuration = Math.floor((Date.now() - answerStartTime.value.getTime()) / 1000)
      answerTimes.value.push(answerDuration)
    }

    // 使用普通API提交答案
    const evaluation = await interviewStore.submitAnswer(
      sessionId,
      currentQuestion.value,
      currentAnswer.value
    )
    
    latestEvaluation.value = evaluation
    currentAnswer.value = ''
    
    ElMessage.success('回答已提交，评分完成！')
    
    // 刷新历史记录
    await loadInterviewHistory()
    
    // Auto-generate next question after a short delay
    setTimeout(() => {
      if (questionCount.value < targetQuestions.value) {
        generateNewQuestion()
      } else {
        showInterviewComplete()
      }
    }, 2000)
  } catch (error) {
    console.error('提交回答失败:', error)
    ElMessage.error('提交回答失败')
  } finally {
    isSubmitting.value = false
  }
}

const handleVoiceInput = () => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    ElMessage.warning('您的浏览器不支持语音识别功能')
    return
  }

  if (isListening.value) {
    // Stop listening
    isListening.value = false
    return
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  const recognition = new SpeechRecognition()
  
  recognition.lang = 'zh-CN'
  recognition.continuous = true
  recognition.interimResults = true

  recognition.onstart = () => {
    isListening.value = true
    ElMessage.info('开始语音识别，请说话...')
  }

  recognition.onresult = (event: any) => {
    let finalTranscript = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript
      }
    }
    if (finalTranscript) {
      currentAnswer.value += finalTranscript
    }
  }

  recognition.onerror = () => {
    ElMessage.error('语音识别出错，请重试')
    isListening.value = false
  }

  recognition.onend = () => {
    isListening.value = false
  }

  recognition.start()
}

const onAnswerInput = () => {
  // Could add typing analytics here
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const showInterviewComplete = async () => {
  try {
    await ElMessageBox.confirm(
      '恭喜您完成了本次面试！是否查看详细报告？',
      '面试完成',
      {
        confirmButtonText: '查看报告',
        cancelButtonText: '返回首页',
        type: 'success'
      }
    )
    router.push(`/interview/${sessionId}/report`)
  } catch {
    router.push('/dashboard')
  }
}

const goBack = () => {
  router.push('/dashboard')
}

const handleEndInterview = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要结束面试吗？结束后可以查看面试报告。',
      '确认结束',
      {
        confirmButtonText: '结束面试',
        cancelButtonText: '继续面试',
        type: 'warning'
      }
    )
    
    await interviewStore.endSession(sessionId)
    ElMessage.success('面试已结束')
    router.push(`/interview/${sessionId}/report`)
  } catch {
    // User cancelled
  }
}

const getStatusType = (status?: number) => {
  // 后端状态: 0-已创建, 1-进行中, 2-已完成, 3-已取消
  switch (status) {
    case 2: return 'success'  // STATUS_COMPLETED
    case 1: return 'warning'  // STATUS_IN_PROGRESS  
    case 3: return 'danger'   // STATUS_CANCELLED
    case 0: return 'info'     // STATUS_CREATED
    default: return 'info'
  }
}

const getStatusText = (status?: number) => {
  // 后端状态: 0-已创建, 1-进行中, 2-已完成, 3-已取消
  switch (status) {
    case 2: return '已完成'    // STATUS_COMPLETED
    case 1: return '进行中'    // STATUS_IN_PROGRESS
    case 3: return '已取消'    // STATUS_CANCELLED
    case 0: return '已创建'    // STATUS_CREATED
    default: return '准备中'   // 更友好的默认文本
  }
}

const formatDuration = (seconds: number) => {
  if (!seconds || isNaN(seconds) || seconds < 0) {
    return '0:00'
  }
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const getTrendClass = (trend: string) => {
  switch (trend) {
    case 'up': return 'trend-up'
    case 'down': return 'trend-down'
    default: return 'trend-stable'
  }
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return 'CaretTop'
    case 'down': return 'CaretBottom'
    default: return 'Minus'
  }
}

const getTrendText = (trend: string) => {
  switch (trend) {
    case 'up': return '上升'
    case 'down': return '下降'
    default: return '稳定'
  }
}

</script>

<style scoped>
.interview-room {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.room-header {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-info h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-weight: 600;
}

.session-details {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #909399;
  font-size: 14px;
}

.separator {
  color: #dcdfe6;
}

.room-actions {
  display: flex;
  gap: 12px;
}

.room-content {
  padding: 20px;
  transition: all 0.3s;
}

.room-content.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  background: #f5f7fa;
  overflow-y: auto;
}

.progress-section {
  margin-bottom: 20px;
}

.progress-card {
  background: white;
  border: 1px solid #e2e8f0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-weight: 600;
}

.progress-text {
  font-size: 14px;
  opacity: 0.9;
}

.main-row {
  min-height: calc(100vh - 200px);
}

.question-card {
  margin-bottom: 20px;
  min-height: 200px;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  font-weight: 600;
}

.question-content {
  padding: 20px 0;
}

.question-text {
  font-size: 16px;
  line-height: 1.8;
  color: #303133;
}

.answer-card {
  margin-bottom: 20px;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #67c23a;
  font-weight: 600;
}

.answer-actions {
  display: flex;
  gap: 8px;
}

.answer-input {
  padding: 20px 0;
}

.answer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.word-count {
  color: #909399;
  font-size: 14px;
}

.submit-actions {
  display: flex;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-content h3 {
  margin: 16px 0 8px 0;
  color: #606266;
}

.empty-content p {
  margin: 0 0 24px 0;
}

.evaluation-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 20px;
}

.score-card {
  background: white;
  border: 1px solid #e2e8f0;
}

.score-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.score-content {
  padding: 20px 0;
}

.overall-score {
  text-align: center;
  margin-bottom: 24px;
}

.score-number {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.score-breakdown {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.score-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.score-value {
  font-weight: 600;
}

.feedback-card {
  background: white;
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e6a23c;
  font-weight: 600;
}

.feedback-content {
  padding: 20px 0;
}

.feedback-section {
  margin-bottom: 20px;
}

.feedback-section:last-child {
  margin-bottom: 0;
}

.feedback-section h4 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.feedback-section p {
  margin: 0;
  line-height: 1.6;
  color: #303133;
  font-size: 14px;
}

.stats-card {
  background: white;
  border: 1px solid #e2e8f0;
}

/* 面试历史记录样式 */
.history-card {
  background: white;
  border: 1px solid #e2e8f0;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-weight: 600;
}

.history-content {
  padding: 20px 0;
}

.history-item {
  padding: 16px 0;
}

.history-item .question-section,
.history-item .answer-section,
.history-item .evaluation-section {
  margin-bottom: 16px;
}

.history-item .question-section:last-child,
.history-item .answer-section:last-child,
.history-item .evaluation-section:last-child {
  margin-bottom: 0;
}

.history-item h4 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.history-item p {
  margin: 0;
  line-height: 1.6;
  color: #303133;
  font-size: 14px;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
}

.mini-score {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.mini-score .score-item {
  padding: 4px 8px;
  background: #f0f9ff;
  border-radius: 4px;
  font-size: 12px;
  color: #0369a1;
}

.mini-score .score-item.total {
  background: #fef3c7;
  color: #92400e;
  font-weight: 600;
}

:deep(.el-collapse-item__header) {
  padding: 12px 0;
  font-weight: 500;
}

:deep(.el-collapse-item__content) {
  padding: 0;
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.stats-content {
  padding: 20px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.stat-value {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.trend-stable {
  color: #909399;
}

.loading-content {
  text-align: center;
  padding: 20px;
}

.loading-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 流式显示样式 */
.streaming-feedback {
  position: relative;
}

.feedback-text.streaming {
  animation: fadeIn 0.3s ease-in;
}

.streaming-question {
  position: relative;
}

.question-text.streaming {
  animation: typewriter 0.1s ease-in;
}

.question-loading {
  text-align: center;
  color: #909399;
  padding: 40px 20px;
}

.question-loading .loading-icon {
  font-size: 24px;
  margin-bottom: 12px;
}

.question-placeholder {
  text-align: center;
  color: #909399;
  padding: 40px 20px;
}

.cursor {
  animation: blink 1s infinite;
  color: #409eff;
  font-weight: bold;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes typewriter {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.streaming-icon {
  margin-left: 8px;
  animation: rotate 2s linear infinite;
  color: #409eff;
}

:deep(.el-card__header) {
  background: transparent;
  border-bottom: none;
}

:deep(.el-progress-bar__outer) {
  background-color: #e4e7ed;
}

:deep(.el-textarea__inner) {
  resize: none;
  font-size: 16px;
  line-height: 1.6;
}

/* 全屏浮动退出按钮 */
.fullscreen-exit-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2100;
  animation: float 3s ease-in-out infinite;
}

.fullscreen-exit-btn .el-button {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  backdrop-filter: blur(10px);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
}
</style>