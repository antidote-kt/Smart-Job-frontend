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
                查看当前评价
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

          <!-- 历史记录 -->
          <el-card v-if="answeredQuestions.length > 0" class="history-panel" shadow="hover">
            <template #header>
              <div class="panel-header">
                <el-icon><List /></el-icon>
                <span>答题记录</span>
              </div>
            </template>

            <div class="history-list">
              <div
                v-for="(item, index) in answeredQuestions"
                :key="item.id"
                class="history-item"
                @click="viewQuestionDetail(item)"
              >
                <div class="history-header">
                  <span class="question-number">第{{ index + 1 }}题</span>
                  <ScoreDisplay :score="item.score || 0" :precision="1" />
                </div>
                <div class="history-content">
                  <p class="question-preview">{{ item.questionText?.slice(0, 30) }}...</p>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 评价对话框 -->
    <el-dialog
      v-model="evaluationDialogVisible"
      title="答题评价"
      width="600px"
      destroy-on-close
    >
      <div v-if="currentEvaluation" class="evaluation-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="专业性">
            <ScoreDisplay :score="currentEvaluation.professionalScore" :precision="1" />
          </el-descriptions-item>
          <el-descriptions-item label="逻辑性">
            <ScoreDisplay :score="currentEvaluation.logicScore" :precision="1" />
          </el-descriptions-item>
          <el-descriptions-item label="完整性">
            <ScoreDisplay :score="currentEvaluation.completenessScore" :precision="1" />
          </el-descriptions-item>
          <el-descriptions-item label="综合得分">
            <ScoreDisplay :score="currentEvaluation.overallScore" :precision="1" />
          </el-descriptions-item>
        </el-descriptions>

        <div class="feedback-section">
          <h4>AI 反馈建议</h4>
          <p>{{ currentEvaluation.aiFeedback }}</p>
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
// API 类型定义和接口
import type { InterviewVO, InterviewQuestionVO, AnswerEvaluation } from '@/api/interview'
import { getInterviewQuestionsApi } from '@/api/interview'

// 路由实例
const router = useRouter()
const route = useRoute()
// 面试状态管理
const interviewStore = useInterviewStore()

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
    // 获取所有问题，只保留已回答的问题到历史记录
    const allQuestions = await getInterviewQuestionsApi(sessionId.value)
    answeredQuestions.value = allQuestions.filter(q => q.userAnswer && q.userAnswer.trim() !== '')
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
        // 问题生成完成
        if (currentQuestion.value) {
          currentQuestion.value.questionText = completeQuestion
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
      currentQuestion.value.id,
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
    
    // 检查是否还需要继续面试，如果没有达到目标题数，自动获取下一题
    if (questionCount.value < targetQuestions.value) {
      setTimeout(async () => {
        try {
          await getNextQuestion()
        } catch (error) {
          console.error('自动获取下一题失败:', error)
          ElMessage.warning('可以手动点击"换一题"继续面试')
        }
      }, 2500) // 延迟2.5秒，让用户有时间查看评价
    } else {
      ElMessage.success('恭喜！您已完成所有题目，正在自动结束面试...')
      // 自动结束面试
      setTimeout(async () => {
        try {
          isEndingInterview.value = true
          await interviewStore.endSession(sessionId.value)
          ElMessage.success('面试已结束，正在跳转到报告页面')
          router.push(`/interview/${sessionId.value}/report`)
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
 * 查看当前问题的评价结果
 * 显示评价弹窗
 */
const viewCurrentEvaluation = () => {
  if (currentEvaluation.value) {
    evaluationDialogVisible.value = true
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
    ElMessage.success('面试已结束')
    router.push(`/interview/${sessionId.value}/report`)
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
</style>