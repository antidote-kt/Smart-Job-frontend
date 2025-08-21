<template>
  <div class="history-view">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-title">
            <h2>面试历史</h2>
            <p>回顾您的面试表现，追踪进步轨迹</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="$router.push('/interview/create')">
            <el-icon><Plus /></el-icon>
            创建新面试
          </el-button>
        </div>
      </div>
    </div>

    <!-- Filter and Statistics -->
    <el-row :gutter="20" class="filter-section">
      <el-col :span="16">
        <el-card shadow="never" class="filter-card">
          <div class="filter-controls">
            <el-select
              v-model="filters.status"
              placeholder="筛选状态"
              clearable
              style="width: 120px"
            >
              <el-option label="全部" value="" />
              <el-option label="已完成" :value="3" />
              <el-option label="进行中" :value="2" />
              <el-option label="未开始" :value="1" />
            </el-select>

            <el-select
              v-model="filters.category"
              placeholder="筛选分类"
              clearable
              style="width: 140px"
            >
              <el-option label="全部分类" value="" />
              <el-option
                v-for="category in categories"
                :key="category"
                :label="category"
                :value="category"
              />
            </el-select>

            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 220px"
            />

            <el-input
              v-model="filters.keyword"
              placeholder="搜索面试名称..."
              prefix-icon="Search"
              clearable
              style="width: 200px"
            />

            <el-button @click="resetFilters">重置</el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card shadow="never" class="stats-card">
          <div class="stats-summary">
            <div class="stat-item">
              <span class="stat-label">总计</span>
              <span class="stat-value">{{ totalSessions }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">已完成</span>
              <span class="stat-value completed">{{ completedSessions }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均分</span>
              <span class="stat-value score">{{ averageScore.toFixed(1) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Sessions List -->
    <el-card class="sessions-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>面试记录</span>
          <div class="header-controls">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="list">列表视图</el-radio-button>
              <el-radio-button label="card">卡片视图</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <!-- List View -->
      <div v-if="viewMode === 'list'">
        <el-table :data="filteredSessions" v-loading="isLoading" style="width: 100%">
          <el-table-column prop="sessionName" label="面试名称" width="250">
            <template #default="{ row }">
              <div class="session-name">
                <span>{{ row.sessionName || `面试 #${row.id}` }}</span>
                <el-tag v-if="row.isRecent" size="small" type="success">最新</el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="position" label="岗位" width="180">
            <template #default="{ row }">
              <div class="job-info">
                <div class="job-name">{{ row.position || '-' }}</div>
                <div class="job-category">{{ row.category || '-' }}</div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="answeredQuestions" label="问题数" width="100">
            <template #default="{ row }">
              <span>{{ row.answeredQuestions || 0 }} 题</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="overallScore" label="总分" width="100">
            <template #default="{ row }">
              <div v-if="row.overallScore > 0" class="score-display">
                <span class="score-number" :class="getScoreClass(row.overallScore)">
                  {{ (row.overallScore || 0).toFixed(1) }}
                </span>
              </div>
              <span v-else class="no-score">-</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="duration" label="用时" width="120">
            <template #default="{ row }">
              <span>{{ calculateDuration(row) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="startTime" label="开始时间" width="180">
            <template #default="{ row }">
              <div class="date-info">
                <div class="date">{{ formatDate(row.startTime) }}</div>
                <div class="time">{{ formatTime(row.startTime) }}</div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" fixed="right" width="200">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button
                  v-if="String(row.status) === '1' || row.status === 'IN_PROGRESS'"
                  type="primary"
                  size="small"
                  class="action-btn primary-btn"
                  @click="resumeInterview(row)"
                >
                  继续面试
                </el-button>
                <el-button
                  v-if="String(row.status) === '2' || row.status === 'COMPLETED'"
                  type="success"
                  size="small"
                  class="action-btn success-btn"
                  @click="viewReport(row)"
                >
                  查看报告
                </el-button>
                <el-button
                  v-if="row.answeredQuestions > 0"
                  type="info"
                  size="small"
                  class="action-btn info-btn"
                  @click="viewDetail(row)"
                >
                  查看详情
                </el-button>
                <el-dropdown @command="(command: string) => handleMoreActions(command, row)">
                  <el-button text class="more-btn">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="delete" class="delete-item">
                        <el-icon style="color: #ef4444;"><Close /></el-icon>删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Card View -->
      <div v-else class="card-view">
        <el-row :gutter="16" v-loading="isLoading">
          <el-col
            v-for="session in filteredSessions"
            :key="session.id"
            :span="8"
            class="session-col"
          >
            <el-card class="session-card" shadow="hover" @click="handleCardClick(session)">
              <div class="session-header">
                <div class="session-title">
                  <h4>{{ session.sessionName || `面试 #${session.id}` }}</h4>
                  <el-tag :type="getStatusType(session.status)" size="small">
                    {{ getStatusText(session.status) }}
                  </el-tag>
                </div>
                <div class="session-meta">
                  <span class="job-position">{{ session.position || '未知岗位' }}</span>
                  <span class="created-time">{{ formatDate(session.startTime) }}</span>
                </div>
              </div>

              <div class="session-stats" v-if="String(session.status) === '2' || session.status === 'COMPLETED'">
                <div class="stat-row">
                  <div class="stat-item">
                    <span class="label">总分</span>
                    <span class="value" :class="getScoreClass(session.overallScore)">
                      {{ (session.overallScore || 0).toFixed(1) }}
                    </span>
                  </div>
                  <div class="stat-item">
                    <span class="label">问题</span>
                    <span class="value">{{ session.answeredQuestions || 0 }}题</span>
                  </div>
                  <div class="stat-item">
                    <span class="label">用时</span>
                    <span class="value">{{ calculateDuration(session) }}</span>
                  </div>
                </div>
              </div>

              <div class="session-progress" v-else-if="String(session.status) === '1' || session.status === 'IN_PROGRESS'">
                <div class="progress-info">
                  <span>进度: {{ session.answeredQuestions || 0 }}/{{ session.totalQuestions || 10 }} 题</span>
                  <span>{{ Math.round(((session.answeredQuestions || 0) / (session.totalQuestions || 10)) * 100) }}%</span>
                </div>
                <el-progress
                  :percentage="Math.round(((session.answeredQuestions || 0) / (session.totalQuestions || 10)) * 100)"
                  :stroke-width="6"
                  :show-text="false"
                />
              </div>

              <div class="session-actions">
                <el-button
                  v-if="String(session.status) === '1' || session.status === 'IN_PROGRESS'"
                  type="primary"
                  size="small"
                  class="card-action-btn primary-btn"
                  @click.stop="resumeInterview(session)"
                >
                  继续面试
                </el-button>
                <el-button
                  v-if="String(session.status) === '2' || session.status === 'COMPLETED'"
                  type="success"
                  size="small"
                  class="card-action-btn success-btn"
                  @click.stop="viewReport(session)"
                >
                  查看报告
                </el-button>
                <el-button
                  v-if="session.answeredQuestions > 0"
                  type="info"
                  size="small"
                  class="card-action-btn info-btn"
                  @click.stop="viewDetail(session)"
                >
                  查看详情
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- Pagination -->
      <div class="pagination-wrapper" v-if="filteredSessions.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <!-- Empty State -->
      <div v-if="filteredSessions.length === 0 && !isLoading" class="empty-state">
        <el-empty description="暂无面试记录">
          <el-button type="primary" @click="$router.push('/interview/create')">
            创建第一个面试
          </el-button>
        </el-empty>
      </div>
    </el-card>

    <!-- Interview Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentSessionDetail ? (currentSessionDetail.title || `面试 #${currentSessionDetail.id}`) : '面试详情'"
      width="80%"
      :destroy-on-close="true"
      @close="closeDetailDialog"
    >
      <div v-loading="detailLoading" class="detail-content">
        <!-- Session Overview -->
        <el-card v-if="currentSessionDetail" class="session-overview" shadow="never">
          <div class="overview-header">
            <h3>面试概览</h3>
          </div>
          <div class="overview-content">
            <el-row :gutter="16">
              <el-col :span="6">
                <div class="overview-item">
                  <span class="label">面试名称</span>
                  <span class="value">{{ currentSessionDetail.title || `面试 #${currentSessionDetail.id}` }}</span>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="overview-item">
                  <span class="label">应聘岗位</span>
                  <span class="value">{{ currentSessionDetail.position || '-' }}</span>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="overview-item">
                  <span class="label">面试状态</span>
                  <el-tag :type="getStatusType(currentSessionDetail.status)">
                    {{ getStatusText(currentSessionDetail.status) }}
                  </el-tag>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="overview-item">
                  <span class="label">开始时间</span>
                  <span class="value">{{ formatDate(currentSessionDetail.startTime) }} {{ formatTime(currentSessionDetail.startTime) }}</span>
                </div>
              </el-col>
            </el-row>
            <el-row :gutter="16" style="margin-top: 16px;">
              <el-col :span="6">
                <div class="overview-item">
                  <span class="label">总分</span>
                  <span class="value" :class="getScoreClass(currentSessionDetail.overallScore)">
                    {{ currentSessionDetail.overallScore > 0 ? currentSessionDetail.overallScore.toFixed(1) : '-' }} 分
                  </span>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="overview-item">
                  <span class="label">回答问题数</span>
                  <span class="value">{{ currentSessionDetail.answeredQuestions || 0 }} 题</span>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="overview-item">
                  <span class="label">面试用时</span>
                  <span class="value">{{ calculateDuration(currentSessionDetail) }}</span>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="overview-item">
                  <span class="label">目标公司</span>
                  <span class="value">{{ currentSessionDetail.company || '-' }}</span>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- Q&A Records -->
        <el-card class="qa-records" shadow="never">
          <div class="qa-header">
            <h3>问答记录</h3>
            <span class="qa-count">共 {{ qaRecords.length }} 题</span>
          </div>
          
          <div v-if="qaRecords.length === 0" class="no-qa">
            <el-empty description="暂无问答记录" />
          </div>
          
          <div v-else class="qa-list">
            <div
              v-for="(record, index) in qaRecords"
              :key="record.question.id"
              class="qa-item"
            >
              <div class="qa-item-header">
                <div class="question-number">问题 {{ index + 1 }}</div>
                <div class="answer-time" v-if="record.question.answerTime">
                  回答时间: {{ formatDate(record.question.answerTime) }} {{ formatTime(record.question.answerTime) }}
                </div>
              </div>
              
              <!-- Question -->
              <div class="question-section">
                <div class="section-title">
                  <el-icon><QuestionFilled /></el-icon>
                  <span>面试问题</span>
                </div>
                <div class="question-content">
                  {{ record.question.questionText }}
                </div>
              </div>
              
              <!-- Answer -->
              <div class="answer-section">
                <div class="section-title">
                  <el-icon><EditPen /></el-icon>
                  <span>我的回答</span>
                </div>
                <div class="answer-content">
                  {{ record.question.userAnswer }}
                </div>
              </div>
              
              <!-- Evaluation -->
              <div v-if="record.evaluation" class="evaluation-section">
                <div class="section-title">
                  <el-icon><TrendCharts /></el-icon>
                  <span>AI 评价</span>
                </div>
                <div class="evaluation-content">
                  <!-- Scores -->
                  <div class="scores">
                    <div class="score-item">
                      <span class="score-label">专业性</span>
                      <span class="score-value">{{ record.evaluation.professionalScore.toFixed(1) }}</span>
                    </div>
                    <div class="score-item">
                      <span class="score-label">逻辑性</span>
                      <span class="score-value">{{ record.evaluation.logicScore.toFixed(1) }}</span>
                    </div>
                    <div class="score-item">
                      <span class="score-label">完整性</span>
                      <span class="score-value">{{ record.evaluation.completenessScore.toFixed(1) }}</span>
                    </div>
                    <div class="score-item overall">
                      <span class="score-label">综合评分</span>
                      <span class="score-value" :class="getScoreClass(record.evaluation.overallScore)">
                        {{ record.evaluation.overallScore.toFixed(1) }}
                      </span>
                    </div>
                  </div>
                  
                  <!-- AI Feedback -->
                  <div class="ai-feedback">
                    <div class="feedback-title">AI 反馈建议</div>
                    <div class="feedback-text">
                      {{ record.evaluation.aiFeedback }}
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else class="no-evaluation">
                <el-alert type="info" title="暂无评价" :closable="false" />
              </div>
            </div>
          </div>
        </el-card>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDetailDialog">关闭</el-button>
          <el-button 
            v-if="currentSessionDetail && (String(currentSessionDetail.status) === '2' || currentSessionDetail.status === 'COMPLETED')"
            type="success" 
            @click="viewReport(currentSessionDetail)"
          >
            查看完整报告
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus, ArrowDown, Close, MoreFilled, QuestionFilled, EditPen, TrendCharts } from '@element-plus/icons-vue'
import { useInterviewStore } from '@/stores/modules/interview'
import { getInterviewQuestionsApi, getInterviewEvaluationsApi } from '@/api/interview'
import type { InterviewVO, InterviewQuestionVO, AnswerEvaluation } from '@/api/interview'

const router = useRouter()
const interviewStore = useInterviewStore()

const isLoading = ref(false)
const viewMode = ref<'list' | 'card'>('list')
const currentPage = ref(1)
const pageSize = ref(20)

// Interview detail dialog states
const detailDialogVisible = ref(false)
const detailLoading = ref(false)
const currentSessionDetail = ref<InterviewVO | null>(null)
const interviewQuestions = ref<InterviewQuestionVO[]>([])
const interviewEvaluations = ref<AnswerEvaluation[]>([])

// Combined Q&A data for display
const qaRecords = ref<Array<{
  question: InterviewQuestionVO
  evaluation?: AnswerEvaluation
}>>([])

const filters = reactive({
  status: '',
  category: '',
  dateRange: null as [Date, Date] | null,
  keyword: ''
})

const sessions = computed(() => interviewStore.sessions)

const categories = computed(() => {
  const uniqueCategories = [...new Set(sessions.value.map(s => s.category).filter(Boolean))]
  return uniqueCategories
})

const filteredSessions = computed(() => {
  let result = [...sessions.value]

  // Status filter
  if (filters.status) {
    result = result.filter(s => s.status === filters.status)
  }

  // Category filter
  if (filters.category) {
    result = result.filter(s => s.category === filters.category)
  }

  // Date range filter
  if (filters.dateRange) {
    const [start, end] = filters.dateRange
    result = result.filter(s => {
      const sessionDate = new Date(s.startTime)
      return sessionDate >= start && sessionDate <= end
    })
  }

  // Keyword filter
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase()
    result = result.filter(s => 
      (s.sessionName?.toLowerCase().includes(keyword)) ||
      (s.jobPosition?.toLowerCase().includes(keyword))
    )
  }

  // Sort by start time (newest first)
  result.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  // Mark recent sessions (within last 24 hours)
  const now = Date.now()
  result.forEach(session => {
    if (session.startTime) {
      const sessionTime = new Date(session.startTime).getTime()
      session.isRecent = (now - sessionTime) < (24 * 60 * 60 * 1000)
    } else {
      session.isRecent = false
    }
  })

  return result
})

const totalCount = computed(() => filteredSessions.value.length)
const totalSessions = computed(() => sessions.value.length)
const completedSessions = computed(() => 
  sessions.value.filter(s => String(s.status) === '2' || s.status === 'COMPLETED').length
)
const averageScore = computed(() => {
  const completed = sessions.value.filter(s => (String(s.status) === '2' || s.status === 'COMPLETED') && s.overallScore > 0)
  if (completed.length === 0) return 0
  return completed.reduce((sum, s) => sum + s.overallScore, 0) / completed.length
})

onMounted(async () => {
  await loadSessions()
})

const loadSessions = async () => {
  try {
    isLoading.value = true
    await interviewStore.loadSessions()
  } catch (error) {
    ElMessage.error('加载面试记录失败')
  } finally {
    isLoading.value = false
  }
}

const resetFilters = () => {
  filters.status = ''
  filters.category = ''
  filters.dateRange = null
  filters.keyword = ''
}

const getStatusType = (status: number | string) => {
  // 后端状态: 1-进行中, 2-已完成, 3-已取消
  const statusStr = String(status)
  switch (statusStr) {
    case '2': 
    case 'COMPLETED': return 'success'
    case '1': 
    case 'IN_PROGRESS': return 'warning'
    case '3':
    case 'CANCELLED': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: number | string) => {
  // 后端状态: 1-进行中, 2-已完成, 3-已取消
  const statusStr = String(status)
  switch (statusStr) {
    case '2': 
    case 'COMPLETED': return '已完成'
    case '1': 
    case 'IN_PROGRESS': return '进行中'
    case '3':
    case 'CANCELLED': return '已取消'
    default: return '未知'
  }
}

const getScoreClass = (score: number) => {
  if (score >= 80) return 'score-excellent'
  if (score >= 70) return 'score-good'
  if (score >= 60) return 'score-average'
  return 'score-poor'
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '-'
    }
    return date.toLocaleDateString('zh-CN')
  } catch (error) {
    return '-'
  }
}

const formatTime = (dateString?: string) => {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '-'
    }
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } catch (error) {
    return '-'
  }
}

const formatDuration = (seconds?: number) => {
  if (!seconds) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const calculateDuration = (session: InterviewVO) => {
  // If there's a duration field, use it
  if (session.duration) {
    return formatDuration(session.duration)
  }
  
  // Otherwise, calculate from startTime and endTime
  if (session.startTime && session.endTime) {
    try {
      const start = new Date(session.startTime)
      const end = new Date(session.endTime)
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)
        return formatDuration(durationSeconds)
      }
    } catch (error) {
      // Fall through to return '-'
    }
  }
  
  // For ongoing interviews, calculate from start time to now
  if (session.status === 2 && session.startTime) {
    try {
      const start = new Date(session.startTime)
      const now = new Date()
      
      if (!isNaN(start.getTime())) {
        const durationSeconds = Math.floor((now.getTime() - start.getTime()) / 1000)
        return formatDuration(durationSeconds)
      }
    } catch (error) {
      // Fall through to return '-'
    }
  }
  
  return '-'
}

const resumeInterview = (session: InterviewVO) => {
  router.push(`/interview/${session.id}`)
}

const viewReport = (session: InterviewVO) => {
  router.push(`/interview/${session.id}/report`)
}

const handleCardClick = (session: InterviewVO) => {
  if (session.status === 3) {
    viewReport(session)
  } else if (session.status === 1 || session.status === 2) {
    resumeInterview(session)
  }
}

const duplicateSession = async (session: InterviewVO) => {
  try {
    const newSession = await interviewStore.createSession(
      session.jobRequirementId,
      `${session.sessionName || '面试'} - 副本`
    )
    ElMessage.success('面试设置已复制')
    router.push(`/interview/${newSession.id}`)
  } catch (error) {
    ElMessage.error('复制面试设置失败')
  }
}

const handleMoreActions = async (command: string, session: InterviewVO) => {
  switch (command) {
    case 'duplicate':
      await duplicateSession(session)
      break
    case 'export':
      // TODO: Implement export functionality
      ElMessage.info('导出功能正在开发中')
      break
    case 'delete':
      try {
        await ElMessageBox.confirm(
          '确定要删除这个面试记录吗？此操作不可撤销。',
          '确认删除',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        // TODO: Implement delete functionality
        ElMessage.success('删除成功')
        await loadSessions()
      } catch {
        // User cancelled
      }
      break
  }
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// View detail function
const viewDetail = async (session: InterviewVO) => {
  try {
    detailLoading.value = true
    currentSessionDetail.value = session
    detailDialogVisible.value = true
    
    // Load questions and evaluations
    const [questions, evaluations] = await Promise.all([
      getInterviewQuestionsApi(session.id),
      getInterviewEvaluationsApi(session.id)
    ])
    
    interviewQuestions.value = questions
    interviewEvaluations.value = evaluations
    
    // Combine questions with their evaluations
    qaRecords.value = questions
      .filter(question => question.userAnswer) // Only show answered questions
      .map(question => {
        const evaluation = evaluations.find(e => e.qaRecordId === question.id)
        return {
          question,
          evaluation
        }
      })
    
    console.log('加载面试详情成功:', {
      questions: questions.length,
      evaluations: evaluations.length,
      qaRecords: qaRecords.value.length
    })
    
  } catch (error) {
    console.error('加载面试详情失败:', error)
    ElMessage.error('加载面试详情失败')
  } finally {
    detailLoading.value = false
  }
}

const closeDetailDialog = () => {
  detailDialogVisible.value = false
  currentSessionDetail.value = null
  qaRecords.value = []
  interviewQuestions.value = []
  interviewEvaluations.value = []
}
</script>

<style scoped>
.history-view {
  max-width: 1200px;
  margin: 0;
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  flex: 1;
}

.header-title h2 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-weight: 700;
  font-size: 28px;
}

.header-title p {
  margin: 0;
  color: #64748b;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 4px;
}

.stats-card {
  background: #f8fafc;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stats-summary {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.stat-value.completed {
  color: #67c23a;
}

.stat-value.score {
  color: #e6a23c;
}

.sessions-card {
  margin-bottom: 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}


.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.job-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.job-name {
  font-weight: 500;
  color: #303133;
}

.job-category {
  font-size: 12px;
  color: #909399;
}

.score-display {
  display: flex;
  align-items: center;
}

.score-number {
  font-weight: 600;
  font-size: 16px;
}

.score-excellent {
  color: #67c23a;
}

.score-good {
  color: #e6a23c;
}

.score-average {
  color: #409eff;
}

.score-poor {
  color: #f56c6c;
}

.no-score {
  color: #c0c4cc;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date {
  font-weight: 500;
  color: #303133;
}

.time {
  font-size: 12px;
  color: #909399;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-view {
  margin: 20px 0;
}

.session-col {
  margin-bottom: 16px;
}

.session-card {
  cursor: pointer;
  transition: all 0.2s ease;
  height: 240px;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}


.session-header {
  margin-bottom: 16px;
}

.session-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.session-title h4 {
  margin: 0;
  color: #303133;
  font-weight: 600;
  flex: 1;
  margin-right: 8px;
}

.session-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #909399;
}

.job-position {
  font-weight: 500;
  color: #606266;
}

.session-stats {
  margin-bottom: 16px;
  flex: 1;
}

.stat-row {
  display: flex;
  justify-content: space-between;
}

.stat-row .stat-item {
  text-align: center;
  flex: 1;
}

.stat-row .label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-row .value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.session-progress {
  margin-bottom: 16px;
  flex: 1;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.session-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-card__header) {
  background: rgba(248, 250, 252, 0.5);
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 24px;
}

:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

:deep(.el-table th.el-table__cell) {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}

:deep(.el-table tr:hover > td) {
  background: #f8fafc;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #f1f5f9;
}

:deep(.el-pagination) {
  justify-content: center;
}

/* 按钮样式改进 */
.action-btn, .card-action-btn {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  padding: 6px 12px;
  min-width: 80px;
  line-height: 1.4;
  vertical-align: middle;
}

.primary-btn {
  background: #409eff;
  border: 1px solid #409eff;
}

.primary-btn:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.success-btn {
  background: #67c23a;
  border: 1px solid #67c23a;
}

.success-btn:hover {
  background: #85ce61;
  border-color: #85ce61;
}

.more-btn {
  color: #64748b;
  padding: 6px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
}

.more-btn:hover {
  background-color: #f1f5f9;
  color: #475569;
  border-color: #cbd5e1;
}

.delete-item {
  color: #ef4444;
}

.delete-item:hover {
  background-color: #fef2f2;
}

/* Detail Dialog Styles */
:deep(.el-dialog__body) {
  padding: 0 20px 20px 20px;
}

.detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.session-overview {
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
}

.overview-header h3 {
  margin: 0;
  color: #1e293b;
  font-weight: 600;
  font-size: 18px;
}

.overview-content {
  padding: 16px 0;
}

.overview-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.overview-item .label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.overview-item .value {
  font-size: 16px;
  color: #1e293b;
  font-weight: 600;
}

.qa-records {
  border: 1px solid #e2e8f0;
}

.qa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.qa-header h3 {
  margin: 0;
  color: #1e293b;
  font-weight: 600;
  font-size: 18px;
}

.qa-count {
  font-size: 14px;
  color: #64748b;
  background: #f8fafc;
  padding: 4px 12px;
  border-radius: 16px;
}

.no-qa {
  padding: 40px 20px;
}

.qa-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.qa-item {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
}

.qa-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.question-number {
  font-weight: 600;
  color: #1e293b;
  font-size: 16px;
}

.answer-time {
  font-size: 14px;
  color: #64748b;
}

.question-section,
.answer-section,
.evaluation-section {
  padding: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.question-section:last-child,
.answer-section:last-child,
.evaluation-section:last-child,
.no-evaluation:last-child {
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #1e293b;
}

.question-section .section-title {
  color: #409eff;
}

.answer-section .section-title {
  color: #67c23a;
}

.evaluation-section .section-title {
  color: #e6a23c;
}

.question-content,
.answer-content {
  line-height: 1.6;
  color: #374151;
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  font-size: 15px;
}

.answer-content {
  border-left-color: #67c23a;
}

.evaluation-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  text-align: center;
}

.score-item.overall {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
}

.score-label {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 4px;
}

.score-value {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.ai-feedback {
  background: #fff7ed;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}

.feedback-title {
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
  font-size: 14px;
}

.feedback-text {
  line-height: 1.6;
  color: #374151;
  font-size: 15px;
}

.no-evaluation {
  padding: 20px;
}

.info-btn {
  background: #909399;
  border: 1px solid #909399;
  color: white;
}

.info-btn:hover {
  background: #a6a9ad;
  border-color: #a6a9ad;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>