<!--
  面试历史页面
  显示用户的面试记录列表，包含统计信息、筛选功能和详细查看功能
-->
<template>
  <div class="history-view">
    <!-- 页面头部：标题和创建新面试按钮 -->
    <PageHeader 
      title="面试历史" 
      description="回顾您的面试表现，追踪进步轨迹"
    >
      <template #actions>
        <el-button type="primary" @click="$router.push('/interview/create')">
          <el-icon><Plus /></el-icon>
          创建新面试
        </el-button>
      </template>
    </PageHeader>

    <!-- 统计数据卡片区域 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <StatisticCard
          :value="totalSessions"
          label="总面试次数"
          :icon="Document"
          icon-class="total"
        />
      </el-col>
      <el-col :span="8">
        <StatisticCard
          :value="completedSessions"
          label="已完成面试"
          :icon="Check"
          icon-class="completed"
        />
      </el-col>
      <el-col :span="8">
        <StatisticCard
          :value="averageScore.toFixed(1)"
          label="平均分数"
          :icon="TrendCharts"
          icon-class="score"
        />
      </el-col>
    </el-row>

    <!-- 筛选控件区域 -->
    <el-card shadow="never" class="filter-card">
      <div class="filter-controls">
        <!-- 状态筛选下拉框 -->
        <el-select v-model="filters.status" placeholder="筛选状态" clearable style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="已完成" :value="2" />
          <el-option label="进行中" :value="1" />
        </el-select>

        <!-- 关键词搜索输入框 -->
        <el-input
          v-model="filters.keyword"
          placeholder="搜索面试名称..."
          prefix-icon="Search"
          clearable
          style="width: 200px"
        />

        <!-- 重置筛选按钮 -->
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </el-card>

    <!-- 面试记录列表卡片 -->
    <el-card class="sessions-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>面试记录</span>
        </div>
      </template>

      <!-- 面试记录表格 -->
      <InterviewTable
        :sessions="filteredSessions"
        :loading="isLoading"
        @resume="resumeInterview"
        @view-report="viewReport"
        @view-detail="viewDetail"
      />

      <!-- 空状态显示 -->
      <div v-if="filteredSessions.length === 0 && !isLoading" class="empty-state">
        <el-empty description="暂无面试记录">
          <el-button type="primary" @click="$router.push('/interview/create')">
            创建第一个面试
          </el-button>
        </el-empty>
      </div>
    </el-card>

    <!-- 面试详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentSession?.title || `面试详情`"
      width="80%"
      :destroy-on-close="true"
    >
      <div class="detail-content" v-loading="detailLoading">
        <!-- 面试基本信息 -->
        <el-descriptions v-if="currentSession" :column="2" border>
          <el-descriptions-item label="面试名称">
            {{ formatSessionName(currentSession.sessionName, currentSession.id) }}
          </el-descriptions-item>
          <el-descriptions-item label="应聘岗位">
            {{ currentSession.position || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="面试状态">
            <StatusTag :status="currentSession.status" />
          </el-descriptions-item>
          <el-descriptions-item label="总分">
            <ScoreDisplay :score="currentSession.overallScore" suffix="分" />
          </el-descriptions-item>
          <el-descriptions-item label="回答问题">
            {{ currentSession.answeredQuestions || 0 }} 题
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ formatDate(currentSession.startTime) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 问答记录区域 -->
        <div class="qa-section" v-if="qaRecords.length > 0">
          <h3>问答记录</h3>
          <div class="qa-list">
            <!-- 可折叠的问答列表 -->
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
                  <!-- AI评分（如果有） -->
                  <div v-if="record.evaluation" class="evaluation-section">
                    <h4>评分</h4>
                    <el-row :gutter="16">
                      <el-col :span="6">
                        <el-statistic title="专业性" :value="record.evaluation.professionalScore" :precision="1" />
                      </el-col>
                      <el-col :span="6">
                        <el-statistic title="逻辑性" :value="record.evaluation.logicScore" :precision="1" />
                      </el-col>
                      <el-col :span="6">
                        <el-statistic title="完整性" :value="record.evaluation.completenessScore" :precision="1" />
                      </el-col>
                      <el-col :span="6">
                        <el-statistic title="综合得分" :value="record.evaluation.overallScore" :precision="1" />
                      </el-col>
                    </el-row>
                    <!-- AI反馈 -->
                    <div class="feedback">
                      <h4>AI 反馈</h4>
                      <p>{{ record.evaluation.aiFeedback }}</p>
                    </div>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </div>
      
      <!-- 弹窗底部按钮 -->
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDetailDialog">关闭</el-button>
          <el-button 
            v-if="currentSession && isCompleted(currentSession.status)"
            type="success" 
            @click="viewReport(currentSession)"
          >
            查看完整报告
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// Vue 核心功能导入
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// Element Plus 组件和消息提示
import { ElMessage } from 'element-plus'
// Element Plus 图标
import { Plus, Document, Check, TrendCharts } from '@element-plus/icons-vue'
// API 类型定义和接口
import type { InterviewVO, InterviewQuestionVO, AnswerEvaluation } from '@/api/interview'
import { getInterviewQuestionsApi, getInterviewEvaluationsApi } from '@/api/interview'

// 自定义组件导入
import PageHeader from '@/components/PageHeader.vue'
import StatisticCard from '@/components/StatisticCard.vue'
import InterviewTable from '@/components/InterviewTable.vue'
import StatusTag from '@/components/StatusTag.vue'
import ScoreDisplay from '@/components/ScoreDisplay.vue'

// 状态管理、组合式函数和工具函数
import { useInterviewStore } from '@/stores/modules/interview'
import { useStatistics } from '@/composables/useStatistics'
import { useInterviewStatus } from '@/composables/useInterviewStatus'
import { formatDate, formatSessionName } from '@/utils/formatters'

// ========== 路由和状态管理实例 ==========
/** 路由实例 */
const router = useRouter()
/** 面试状态管理 */
const interviewStore = useInterviewStore()
/** 面试状态判断工具 */
const { isCompleted } = useInterviewStatus()

// ========== 响应式数据定义 ==========

// UI 状态控制
/** 是否正在加载会话列表 */
const isLoading = ref(false)
/** 详情弹窗是否显示 */
const detailDialogVisible = ref(false)
/** 是否正在加载详情数据 */
const detailLoading = ref(false)
/** 当前选中的面试会话 */
const currentSession = ref<InterviewVO | null>(null)
/** 展开的问题索引数组 */
const activeQuestions = ref<string[]>([])

/** 问答记录列表（问题和评价的组合） */
const qaRecords = ref<Array<{
  question: InterviewQuestionVO
  evaluation?: AnswerEvaluation
}>>([])

// 筛选条件
/** 筛选条件配置 */
const filters = reactive({
  /** 面试状态筛选 */
  status: '',
  /** 关键词搜索 */
  keyword: ''
})

// ========== 计算属性 ==========

/** 统计数据计算 */
const { totalSessions, completedSessions, averageScore } = useStatistics(
  computed(() => interviewStore.sessions)
)

/** 过滤后的面试会话列表 */
const filteredSessions = computed(() => {
  let result = [...interviewStore.sessions]

  // 按状态筛选
  if (filters.status) {
    result = result.filter(s => String(s.status) === String(filters.status))
  }

  // 按关键词搜索
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase()
    result = result.filter(s => 
      (s.sessionName?.toLowerCase().includes(keyword)) ||
      (s.position?.toLowerCase().includes(keyword))
    )
  }

  // 按开始时间倒序排列
  return result.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
})

// ========== 生命周期钩子 ==========
onMounted(async () => {
  await loadSessions()
})

// ========== 数据加载方法 ==========

/**
 * 加载面试会话列表
 * 从服务器获取用户的所有面试记录
 */
const loadSessions = async () => {
  try {
    isLoading.value = true
    await interviewStore.loadSessions()
  } catch (error) {
    ElMessage.error(error.message || '加载面试记录失败，请检查网络连接')
  } finally {
    isLoading.value = false
  }
}

// ========== 筛选和搜索方法 ==========

/**
 * 重置所有筛选条件
 * 清空状态和关键词筛选
 */
const resetFilters = () => {
  filters.status = ''
  filters.keyword = ''
}

// ========== 导航操作方法 ==========

/**
 * 继续未完成的面试
 * @param session 面试会话对象
 */
const resumeInterview = (session: InterviewVO) => {
  router.push(`/interview/${session.id}`)
}

/**
 * 查看面试报告
 * @param session 面试会话对象
 */
const viewReport = (session: InterviewVO) => {
  router.push(`/interview/${session.id}/report`)
}

// ========== 详情弹窗操作方法 ==========

/**
 * 查看面试详细信息
 * 加载问答记录和评价数据
 * @param session 面试会话对象
 */
const viewDetail = async (session: InterviewVO) => {
  try {
    detailLoading.value = true
    currentSession.value = session
    detailDialogVisible.value = true
    
    // 并行加载问题和评价数据
    const [questions, evaluations] = await Promise.all([
      getInterviewQuestionsApi(session.id),
      getInterviewEvaluationsApi(session.id)
    ])
    
    // 组装问答记录，只包含已回答的问题
    qaRecords.value = questions
      .filter(question => question.userAnswer)
      .map(question => {
        const evaluation = evaluations.find(e => e.qaRecordId === question.id)
        return { question, evaluation }
      })
    
  } catch (error) {
    ElMessage.error('加载面试详情失败')
  } finally {
    detailLoading.value = false
  }
}

/**
 * 关闭详情弹窗
 * 清理相关状态数据
 */
const closeDetailDialog = () => {
  detailDialogVisible.value = false
  currentSession.value = null
  qaRecords.value = []
  activeQuestions.value = []
}
</script>

<style scoped>
.history-view {
  max-width: 1200px;
  margin: 0;
  padding: 20px;
}

.stats-row {
  margin-bottom: 24px;
}

.filter-card {
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 4px;
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.qa-section {
  margin-top: 24px;
}

.qa-section h3 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-weight: 600;
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

.feedback {
  margin-top: 16px;
}

.feedback h4 {
  margin: 0 0 8px 0;
  color: #374151;
  font-weight: 600;
  font-size: 14px;
}

.feedback p {
  margin: 0;
  line-height: 1.6;
  color: #374151;
  background: #fff7ed;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #f59e0b;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>