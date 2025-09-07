<template>
  <div class="interview-room">
    <!-- Room Header -->
    <div class="room-header">
      <div class="session-info">
        <h2>{{ session?.title || `${session?.company || '面试公司'} - ${session?.position || '面试岗位'} 面试` }}</h2>
        <div class="session-details">
          <span>已回答: {{ session?.answeredQuestions || 0 }} 题</span>
          <span class="separator">|</span>
          <span>平均分: <ScoreDisplay :score="currentAverageScore" :precision="1" /></span>
        </div>
      </div>
      <div class="room-actions">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
        <el-button type="danger" @click="handleEndInterview" :loading="isEndingInterview">
          {{ isEndingInterview ? '正在生成报告...' : '结束面试' }}
        </el-button>
      </div>
    </div>

    <div class="room-content">
      <!-- 进度条 -->
      <div class="progress-section">
        <ProgressCard
          :current="questionCount"
          :total="targetQuestions"
          label="面试进度"
          unit="题"
        />
      </div>

      <el-row :gutter="20" class="main-row">
        <!-- 问题和回答区域 -->
        <el-col :span="16">
          <!-- 当前问题 -->
          <QuestionCard
            v-if="currentQuestion"
            :question-number="questionCount + 1"
            :question-text="displayQuestion"
            :category="currentQuestion.category"
            :difficulty="currentQuestion.difficulty"
            :hints="currentQuestion.hints"
            :keywords="currentQuestion.keywords"
          />
          
          <!-- 问题占位符 -->
          <el-card v-else class="question-placeholder" shadow="hover">
            <div class="placeholder-content">
              <el-icon size="48" class="placeholder-icon"><QuestionFilled /></el-icon>
              <h3>准备开始面试</h3>
              <p>点击"获取问题"开始您的面试之旅</p>
            </div>
          </el-card>

          <!-- 回答输入 -->
          <AnswerInput
            v-model="currentAnswer"
            :enable-voice-input="true"
            :submitting="isSubmitting"
            @submit="submitAnswer"
            @voice-start="() => {}"
            @voice-stop="() => {}"
          />
        </el-col>

        <!-- 侧边栏 -->
        <el-col :span="8">
          <!-- 控制面板 -->
          <el-card class="control-panel" shadow="hover">
            <template #header>
              <div class="panel-header">
                <el-icon><Operation /></el-icon>
                <span>控制面板</span>
              </div>
            </template>

            <div class="control-buttons">
              <el-button
                v-if="!currentQuestion"
                type="primary"
                :loading="isGenerating"
                @click="getNextQuestion"
                block
                class="control-btn"
              >
                {{ isGenerating ? '生成问题中...' : '获取问题' }}
              </el-button>

              <el-button
                v-else
                type="primary"
                :loading="isGenerating"
                @click="getNextQuestion"
                block
                class="control-btn"
              >
                {{ isGenerating ? '换题中...' : '换一题' }}
              </el-button>

              <el-button
                v-if="questionCount > 0"
                @click="viewCurrentEvaluation"
                block
                class="control-btn"
                type="default"
              >
                查看已回答问题的评价
              </el-button>
            </div>
          </el-card>

          <!-- 统计信息 -->
          <el-card class="stats-panel" shadow="hover">
            <template #header>
              <div class="panel-header">
                <el-icon><TrendCharts /></el-icon>
                <span>实时统计</span>
              </div>
            </template>

            <div class="stats-list">
              <div class="stat-item">
                <span class="stat-label">当前题目：</span>
                <span class="stat-value">{{ questionCount + 1 }}/{{ targetQuestions }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已用时间：</span>
                <span class="stat-value">{{ formatDuration(elapsedTime) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均分数：</span>
                <span class="stat-value">
                  <ScoreDisplay :score="currentAverageScore" :precision="1" />
                </span>
              </div>
              <div class="stat-item">
                <span class="stat-label">回答字数：</span>
                <span class="stat-value">{{ answerWordCount }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 评价对话框 -->
    <el-dialog
      v-model="evaluationDialogVisible"
      title="已回答问题的评价"
      width="80%"
      destroy-on-close
    >
      <div class="evaluations-content" v-loading="isLoadingEvaluations">
        <div v-if="qaRecords.length > 0" class="qa-list">
          <!-- 可折叠的问答评价列表 -->
          <el-collapse v-model="activeQuestions">
            <el-collapse-item
              v-for="(record, index) in qaRecords"
              :key="record.question.id"
              :title="`问题 ${index + 1}: ${record.question.questionText.slice(0, 50)}...`"
              :name="index.toString()"
            >
              <div class="qa-content">
                <!-- 问题内容 -->
                <div class="question-section">
                  <h4>问题</h4>
                  <p>{{ record.question.questionText }}</p>
                </div>
                <!-- 用户回答 -->
                <div class="answer-section">
                  <h4>回答</h4>
                  <p>{{ record.question.userAnswer }}</p>
                </div>
                <!-- AI评分 -->
                <div class="evaluation-section">
                  <h4>评分</h4>
                  <div v-if="record.evaluation">
                    <el-descriptions :column="2" border>
                      <el-descriptions-item label="专业性">
                        <ScoreDisplay :score="record.evaluation.professionalScore" :precision="1" />
                      </el-descriptions-item>
                      <el-descriptions-item label="逻辑性">
                        <ScoreDisplay :score="record.evaluation.logicScore" :precision="1" />
                      </el-descriptions-item>
                      <el-descriptions-item label="完整性">
                        <ScoreDisplay :score="record.evaluation.completenessScore" :precision="1" />
                      </el-descriptions-item>
                      <el-descriptions-item label="综合得分">
                        <ScoreDisplay :score="record.evaluation.overallScore" :precision="1" />
                      </el-descriptions-item>
                    </el-descriptions>
                    <!-- AI反馈 -->
                    <div class="feedback-section">
                      <h4>AI 反馈建议</h4>
                      <p>{{ record.evaluation.aiFeedback }}</p>
                    </div>
                  </div>
                  <div v-else class="no-evaluation">
                    <p style="color: #f56c6c;">暂无评价数据 (调试信息: questionId={{ record.question.id }})</p>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
        
        <div v-else class="empty-state">
          <el-empty description="暂无已回答问题的评价" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// Vue 相关导入
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
// Element Plus 组件和消息提示
import { ElMessage, ElMessageBox } from 'element-plus'
// Element Plus 图标
import { 
  ArrowLeft, QuestionFilled, Operation,
  TrendCharts, List
} from '@element-plus/icons-vue'

// 自定义组件导入
import QuestionCard from '@/components/QuestionCard.vue'
import AnswerInput from '@/components/AnswerInput.vue'
import ProgressCard from '@/components/ProgressCard.vue'
import ScoreDisplay from '@/components/ScoreDisplay.vue'

// 状态管理和工具函数
import { useInterviewStore } from '@/stores/modules/interview'
import { useNotificationStore } from '@/stores/modules/notification'
// API 类型定义和接口
import type { InterviewVO, InterviewQuestionVO, AnswerEvaluation } from '@/api/interview'
import { getInterviewQuestionsApi, getInterviewEvaluationsApi } from '@/api/interview'

// 路由实例
const router = useRouter()
const route = useRoute()
// 面试状态管理
const interviewStore = useInterviewStore()
const notificationStore = useNotificationStore()

// 从路由参数获取会话ID
const sessionId = computed(() => Number(route.params.id))

// ========== 响应式数据定义 ==========

// 基础状态
/** 当前面试会话信息 */
const session = ref<InterviewVO | null>(null)
/** 当前显示的问题 */
const currentQuestion = ref<InterviewQuestionVO | null>(null)
/** 当前回答内容 */
const currentAnswer = ref('')
/** 当前问题的评价结果 */
const currentEvaluation = ref<AnswerEvaluation | null>(null)
/** 已回答的问题列表 */
const answeredQuestions = ref<InterviewQuestionVO[]>([])
/** 所有问题的评价列表 */
const allEvaluations = ref<AnswerEvaluation[]>([])

// UI 状态控制
/** 是否正在生成问题 */
const isGenerating = ref(false)
/** 是否正在提交回答 */
const isSubmitting = ref(false)
/** 是否正在语音输入（保留用于扩展） */
const isListening = ref(false)
/** 是否正在结束面试 */
const isEndingInterview = ref(false)
/** 评价弹窗是否显示 */
const evaluationDialogVisible = ref(false)
/** 是否正在加载评价数据 */
const isLoadingEvaluations = ref(false)
/** 展开的问题索引数组 */
const activeQuestions = ref<string[]>([])

/** 问答记录列表（问题和评价的组合） */
const qaRecords = ref<Array<{
  question: InterviewQuestionVO
  evaluation?: AnswerEvaluation
}>>([])

// 面试配置
/** 目标问题数量 */
const targetQuestions = ref(10)
/** 已用时间（秒） */
const elapsedTime = ref(0)
/** 计时器引用 */
const timerInterval = ref<number>()

// ========== 计算属性 ==========

/** 已回答问题数量 */
const questionCount = computed(() => answeredQuestions.value.length)
/** 是否已输入回答 */
const hasAnswered = computed(() => currentAnswer.value.trim().length > 0)
/** 当前回答字数统计 */
const answerWordCount = computed(() => currentAnswer.value.replace(/\s/g, '').length)

/** 当前平均分数计算 */
const currentAverageScore = computed(() => {
  const validScores = answeredQuestions.value
    .map(q => q.score)
    .filter(score => score !== undefined && score > 0)
  
  if (validScores.length === 0) return 0
  return validScores.reduce((sum, score) => sum + score!, 0) / validScores.length
})

/** 显示的问题文本 */
const displayQuestion = computed(() => {
  return currentQuestion.value?.questionText || ''
})

// ========== 生命周期钩子 ==========
onMounted(async () => {
  await loadSession()
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})

// ========== 基础工具方法 ==========

/**
 * 加载面试会话信息
 * 获取面试详情和历史回答记录
 */
const loadSession = async () => {
  try {
    session.value = await interviewStore.loadSession(sessionId.value)
    
    // 如果是进行中的面试，启动WebSocket连接
    if (session.value?.status === 1) {
      notificationStore.startService()
    }
    
    // 获取所有问题
    const allQuestions = await getInterviewQuestionsApi(sessionId.value)
    
    // 分类问题：已回答的和未回答的
    const answeredQs = allQuestions.filter(q => q.userAnswer && q.userAnswer.trim() !== '')
    const unansweredQs = allQuestions.filter(q => !q.userAnswer || q.userAnswer.trim() === '')
    
    // 设置已回答的问题到历史记录
    answeredQuestions.value = answeredQs
    
    // 如果有未回答的问题，恢复最新的一个作为当前问题
    if (unansweredQs.length > 0) {
      // 按ID排序，获取最新的未回答问题
      const latestUnanswered = unansweredQs.sort((a, b) => b.id - a.id)[0]
      currentQuestion.value = latestUnanswered
      currentAnswer.value = '' // 确保答案输入框为空
      
      // 同步更新 store 中的当前问题状态
      interviewStore.currentQuestion = latestUnanswered.questionText
      interviewStore.currentQuestionId = latestUnanswered.id
      
      ElMessage.success('已恢复未完成的问题，请继续回答')
    }
    
  } catch (error) {
    ElMessage.error('加载面试信息失败')
    router.back()
  }
}

/**
 * 启动面试计时器
 * 每秒更新一次已用时间
 */
const startTimer = () => {
  timerInterval.value = setInterval(() => {
    elapsedTime.value++
  }, 1000)
}

/**
 * 停止面试计时器
 * 清理定时器资源
 */
const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
}

/**
 * 格式化时间显示
 * @param seconds 秒数
 * @returns 格式化后的时间字符串（HH:mm:ss 或 mm:ss）
 */
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// ========== 面试核心操作方法 ==========

/**
 * 获取下一个面试问题
 * 支持流式显示问题生成过程
 */
const getNextQuestion = async () => {
  // 防止重复点击
  if (isGenerating.value) {
    ElMessage.warning('正在生成问题，请稍候...')
    return
  }
  
  try {
    // 检查面试状态，如果是已创建状态（0），则先开始面试
    if (session.value?.status === 0) {
      ElMessage.info('正在开始面试...')
      const startedSession = await interviewStore.startSession(sessionId.value)
      // 更新本地状态
      session.value = startedSession
      
      // 面试开始时立即连接 WebSocket，等待报告生成通知
      notificationStore.startService()
    }
    
    // 检查面试状态是否正确
    if (session.value?.status !== 1) {
      ElMessage.error('面试状态异常，无法获取问题')
      return
    }
    
    isGenerating.value = true
    
    // 清除当前问题（避免显示上一题内容）
    currentQuestion.value = null
    
    // 使用流式接口获取问题
    let fullQuestion = ''
    
    await interviewStore.getNextQuestionStream(
      sessionId.value,
      (chunk: string) => {
        // 实时显示问题片段
        fullQuestion += chunk
        if (currentQuestion.value) {
          currentQuestion.value.questionText = fullQuestion
        } else {
          currentQuestion.value = {
            id: 0,
            questionText: fullQuestion,
            userAnswer: '',
            answerTime: ''
          }
        }
      },
      (completeQuestion: string) => {
        // 问题生成完成，同步 store 中的问题ID
        if (currentQuestion.value) {
          currentQuestion.value.questionText = completeQuestion
          // 同步 store 中的问题ID到页面问题对象
          currentQuestion.value.id = interviewStore.currentQuestionId || 0
        }
      }
    )
    
    currentAnswer.value = ''
    currentEvaluation.value = null
  } catch (error) {
    console.error('获取问题失败:', error)
    ElMessage.error('获取问题失败')
    // 发生错误时清除当前问题
    currentQuestion.value = null
  } finally {
    isGenerating.value = false
  }
}

/**
 * 提交用户回答
 * 获取AI评价并自动处理后续流程
 */
const submitAnswer = async () => {
  if (!currentQuestion.value || !currentAnswer.value.trim()) return

  try {
    isSubmitting.value = true
    
    const evaluation = await interviewStore.submitAnswer(
      sessionId.value,
      currentQuestion.value.questionText,  // 传递问题文本而不是ID
      currentAnswer.value
    )
    
    currentEvaluation.value = evaluation
    
    // 更新问题记录
    const updatedQuestion = {
      ...currentQuestion.value,
      userAnswer: currentAnswer.value,
      score: evaluation.overallScore
    }
    
    answeredQuestions.value.push(updatedQuestion)
    
    // 清空答题框
    currentAnswer.value = ''
    
    ElMessage.success('回答提交成功')
    
    // 自动显示评价
    setTimeout(() => {
      viewCurrentEvaluation()
    }, 1000)
    
    // 同时请求生成下一个问题（如果还没有达到目标题数）
    // 与显示评价并行进行，提升用户体验
    if (questionCount.value < targetQuestions.value) {
      // 立即开始生成下一个问题，不阻塞当前流程
      getNextQuestion().catch(error => {
        console.error('自动获取下一题失败:', error)
        ElMessage.warning('可以手动点击"换一题"继续面试')
      })
    } else {
      ElMessage.success('恭喜！您已完成所有题目，正在自动结束面试...')
      // 自动结束面试
      setTimeout(async () => {
        try {
          isEndingInterview.value = true
          await interviewStore.endSession(sessionId.value)
          ElMessage.success('面试已结束，报告正在生成中，完成后将通知您')
          router.push('/dashboard')
        } catch (error) {
          ElMessage.error('自动结束面试失败，请手动点击"结束面试"按钮')
        } finally {
          isEndingInterview.value = false
        }
      }, 3000) // 延迟3秒后自动结束面试
    }
    
  } catch (error) {
    ElMessage.error('提交回答失败')
  } finally {
    isSubmitting.value = false
  }
}

// ========== 界面交互方法 ==========

/**
 * 查看所有已回答问题的评价结果
 * 显示评价列表弹窗
 */
const viewCurrentEvaluation = async () => {
  try {
    if (answeredQuestions.value.length === 0) {
      ElMessage.warning('暂无已回答问题的评价，请先完成一道题目')
      return
    }
    
    isLoadingEvaluations.value = true
    
    // 获取所有评价数据
    const evaluations = await getInterviewEvaluationsApi(sessionId.value)
    
    // 组装问答记录，只包含已回答的问题
    qaRecords.value = answeredQuestions.value
      .filter(question => question.userAnswer)
      .map(question => {
        const evaluation = evaluations.find(e => e.qaRecordId === question.id)
        return { question, evaluation }
      })
    
    // 显示弹窗
    evaluationDialogVisible.value = true
    
  } catch (error) {
    console.error('获取评价数据失败:', error)
    ElMessage.error('获取评价数据失败')
  } finally {
    isLoadingEvaluations.value = false
  }
}

/**
 * 查看历史问题详情
 * @param question 问题对象
 */
const viewQuestionDetail = (question: InterviewQuestionVO) => {
  // 显示问题详情
  ElMessageBox.alert(
    `问题: ${question.questionText}\n\n回答: ${question.userAnswer}`,
    `第${answeredQuestions.value.indexOf(question) + 1}题详情`,
    { type: 'info' }
  )
}

/**
 * 返回上一页
 */
const goBack = () => {
  router.back()
}

/**
 * 处理结束面试操作
 * 确认后结束面试并跳转到报告页面
 */
const handleEndInterview = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要结束面试吗？结束后将生成面试报告。',
      '结束面试',
      {
        confirmButtonText: '结束面试',
        cancelButtonText: '继续面试',
        type: 'warning'
      }
    )

    isEndingInterview.value = true
    await interviewStore.endSession(sessionId.value)
    ElMessage.success('面试已结束，报告正在生成中，完成后将通知您')
    
    // 跳转到主页面，等待通知
    router.push('/dashboard')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('结束面试失败')
    }
  } finally {
    isEndingInterview.value = false
  }
}
</script>

<style scoped>
.interview-room {
  min-height: 100vh;
  background: #f5f7fa;
}

.room-header {
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.session-info h2 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-weight: 700;
}

.session-details {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #64748b;
}

.separator {
  color: #cbd5e1;
}

.room-actions {
  display: flex;
  gap: 12px;
}

.room-content {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.progress-section {
  margin-bottom: 24px;
}

.main-row {
  align-items: flex-start;
}

.question-placeholder {
  margin-bottom: 24px;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  text-align: center;
  color: #64748b;
}

.placeholder-icon {
  color: #cbd5e1;
  margin-bottom: 16px;
}

.placeholder-content h3 {
  margin: 0 0 8px 0;
  color: #374151;
}

.placeholder-content p {
  margin: 0;
  font-size: 14px;
}

.control-panel,
.stats-panel,
.history-panel {
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-btn {
  height: 40px;
  font-size: 14px;
  font-weight: 500;
}

.stats-list,
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
}

.stat-value {
  font-weight: 600;
  color: #374151;
}

.history-item {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  border-color: #409eff;
  background: #f8fafc;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.question-number {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.question-preview {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
}

.evaluation-content {
  padding: 8px 0;
}

.feedback-section {
  margin-top: 20px;
}

.feedback-section h4 {
  margin: 0 0 12px 0;
  color: #374151;
  font-weight: 600;
}

.feedback-section p {
  margin: 0;
  line-height: 1.6;
  color: #374151;
  background: #fff7ed;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #f59e0b;
}

/* 评价弹窗样式 */
.evaluations-content {
  max-height: 70vh;
  overflow-y: auto;
}

.qa-content {
  padding: 16px 0;
}

.question-section,
.answer-section,
.evaluation-section {
  margin-bottom: 16px;
}

.question-section h4,
.answer-section h4,
.evaluation-section h4 {
  margin: 0 0 8px 0;
  color: #374151;
  font-weight: 600;
  font-size: 14px;
}

.question-section p,
.answer-section p {
  margin: 0;
  line-height: 1.6;
  color: #374151;
  background: #f8fafc;
  padding: 12px;
  border-radius: 6px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}
</style>