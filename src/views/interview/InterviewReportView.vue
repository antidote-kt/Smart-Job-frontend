<template>
  <!-- 面试评估报告页面 - 显示面试结果和详细分析 -->
  <div class="interview-report">
    <!-- 页面头部：标题和返回按钮 -->
    <PageHeader title="面试评估报告">
      <template #actions>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </template>
    </PageHeader>

    <!-- 主要内容区域：加载状态覆盖 -->
    <div class="report-content" v-loading="isLoading">
      <!-- 面试基本信息卡片 -->
      <el-card class="session-info-card" shadow="hover">
        <!-- 面试会话基本信息 -->
        <div class="session-details">
          <div class="detail-item">
            <span class="label">面试名称：</span>
            <span class="value">{{ formatSessionName(session?.title, sessionId) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">开始时间：</span>
            <span class="value">{{ formatDate(session?.startTime) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">结束时间：</span>
            <span class="value">{{ formatDate(session?.endTime) }}</span>
          </div>
        </div>
      </el-card>

      <!-- 总体评分概览：三个统计卡片 -->
      <el-row :gutter="20" class="overview-section">
        <!-- 总体得分 -->
        <el-col :span="8">
          <StatisticCard
            :value="(report?.overallScore || 0).toFixed(1)"
            label="总体得分"
            :icon="TrendCharts"
            icon-class="score"
          />
        </el-col>
        <!-- 回答题目数量 -->
        <el-col :span="8">
          <StatisticCard
            :value="questionCount"
            label="回答题数"
            :icon="QuestionFilled"
            icon-class="total"
          />
        </el-col>
        <!-- 平均回答长度 -->
        <el-col :span="8">
          <StatisticCard
            :value="averageAnswerLength"
            label="平均回答字数"
            :icon="EditPen"
            icon-class="completed"
          />
        </el-col>
      </el-row>

      <!-- 详细评分卡片：专业性、逻辑性、完整性 -->
      <el-card class="detailed-scores" shadow="hover">
        <template #header>
          <h3>详细评分</h3>
        </template>
        
        <el-row :gutter="20">
          <!-- 专业性评分 -->
          <el-col :span="8">
            <div class="score-item">
              <div class="score-label">专业性</div>
              <div class="score-value">
                <ScoreDisplay :score="report?.professionalScore || 0" :precision="1" />
              </div>
              <el-progress 
                :percentage="report?.professionalScore || 0" 
                :show-text="false"
                :stroke-width="6"
              />
            </div>
          </el-col>
          <!-- 逻辑性评分 -->
          <el-col :span="8">
            <div class="score-item">
              <div class="score-label">逻辑性</div>
              <div class="score-value">
                <ScoreDisplay :score="report?.logicScore || 0" :precision="1" />
              </div>
              <el-progress 
                :percentage="report?.logicScore || 0" 
                :show-text="false"
                :stroke-width="6"
              />
            </div>
          </el-col>
          <!-- 完整性评分 -->
          <el-col :span="8">
            <div class="score-item">
              <div class="score-label">完整性</div>
              <div class="score-value">
                <ScoreDisplay :score="report?.completenessScore || 0" :precision="1" />
              </div>
              <el-progress 
                :percentage="report?.completenessScore || 0" 
                :show-text="false"
                :stroke-width="6"
              />
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 详细分析卡片：五个维度的文本分析 -->
      <div v-if="report" class="analysis-section">
        <!-- 表现分析 -->
        <el-card v-if="report.performanceAnalysis" class="analysis-card" shadow="hover">
          <template #header>
            <h3>表现分析</h3>
          </template>
          <div class="analysis-content">
            <p>{{ report.performanceAnalysis }}</p>
          </div>
        </el-card>

        <!-- 技能评估 -->
        <el-card v-if="report.skillAssessment" class="analysis-card" shadow="hover">
          <template #header>
            <h3>技能评估</h3>
          </template>
          <div class="analysis-content">
            <p>{{ report.skillAssessment }}</p>
          </div>
        </el-card>

        <!-- 优势亮点 -->
        <el-card v-if="report.strongPoints" class="analysis-card" shadow="hover">
          <template #header>
            <h3>优势亮点</h3>
          </template>
          <div class="analysis-content">
            <p>{{ report.strongPoints }}</p>
          </div>
        </el-card>

        <!-- 待改进点 -->
        <el-card v-if="report.weakPoints" class="analysis-card" shadow="hover">
          <template #header>
            <h3>待改进点</h3>
          </template>
          <div class="analysis-content">
            <p>{{ report.weakPoints }}</p>
          </div>
        </el-card>

        <!-- 改进建议 -->
        <el-card v-if="report.improvementSuggestions" class="analysis-card" shadow="hover">
          <template #header>
            <h3>改进建议</h3>
          </template>
          <div class="analysis-content">
            <p>{{ report.improvementSuggestions }}</p>
          </div>
        </el-card>
      </div>

      <!-- 问答详情卡片：每道题的问题、回答和评价 -->
      <el-card class="qa-details" shadow="hover">
        <template #header>
          <h3>问答详情</h3>
        </template>

        <!-- 无数据状态 -->
        <div v-if="qaRecords.length === 0" class="no-data">
          <el-empty description="暂无问答记录" />
        </div>

        <!-- 问答记录折叠面板 -->
        <el-collapse v-else v-model="activeCollapse">
          <el-collapse-item
            v-for="(record, index) in qaRecords"
            :key="record.question.id"
            :title="`第 ${index + 1} 题：${record.question.questionText.slice(0, 50)}...`"
            :name="index.toString()"
          >
            <!-- 单个问答项内容 -->
            <div class="qa-item">
              <!-- 问题内容区域 -->
              <div class="question-section">
                <h4>问题</h4>
                <p class="question-text">{{ record.question.questionText }}</p>
              </div>

              <!-- 用户回答区域 -->
              <div class="answer-section">
                <h4>我的回答</h4>
                <p class="answer-text">{{ record.question.userAnswer }}</p>
              </div>

              <!-- AI评价区域 -->
              <div v-if="record.evaluation" class="evaluation-section">
                <h4>AI 评价</h4>
                <!-- 评分详情 -->
                <el-row :gutter="16" class="eval-scores">
                  <!-- 专业性得分 -->
                  <el-col :span="6">
                    <div class="eval-item">
                      <span class="eval-label">专业性</span>
                      <ScoreDisplay :score="record.evaluation.professionalScore" :precision="1" />
                    </div>
                  </el-col>
                  <!-- 逻辑性得分 -->
                  <el-col :span="6">
                    <div class="eval-item">
                      <span class="eval-label">逻辑性</span>
                      <ScoreDisplay :score="record.evaluation.logicScore" :precision="1" />
                    </div>
                  </el-col>
                  <!-- 完整性得分 -->
                  <el-col :span="6">
                    <div class="eval-item">
                      <span class="eval-label">完整性</span>
                      <ScoreDisplay :score="record.evaluation.completenessScore" :precision="1" />
                    </div>
                  </el-col>
                  <!-- 综合得分 -->
                  <el-col :span="6">
                    <div class="eval-item">
                      <span class="eval-label">综合得分</span>
                      <ScoreDisplay :score="record.evaluation.overallScore" :precision="1" />
                    </div>
                  </el-col>
                </el-row>

                <!-- AI反馈建议 -->
                <div class="feedback-section">
                  <h5>反馈建议</h5>
                  <p class="feedback-text">{{ record.evaluation.aiFeedback }}</p>
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-card>

      <!-- 总体评价卡片：AI生成的整体反馈 -->
      <el-card v-if="report?.summary" class="summary-card" shadow="hover">
        <template #header>
          <h3>总体评价</h3>
        </template>
        <div class="summary-content">
          <p>{{ report.summary }}</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue 核心功能导入
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
// Element Plus 消息提示
import { ElMessage } from 'element-plus'
// Element Plus 图标
import { 
  ArrowLeft, TrendCharts, 
  QuestionFilled, EditPen 
} from '@element-plus/icons-vue'

// 自定义组件导入
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import ScoreDisplay from '@/components/ScoreDisplay.vue'
import StatisticCard from '@/components/StatisticCard.vue'

// 状态管理和工具函数
import { useInterviewStore } from '@/stores/modules/interview'
import { formatDate, formatSessionName } from '@/utils/formatters'
// API 类型定义和接口
import type { InterviewVO, InterviewQuestionVO, AnswerEvaluation } from '@/api/interview'
import { getInterviewQuestionsApi, getInterviewEvaluationsApi, getInterviewDetailApi } from '@/api/interview'

// ========== 路由和状态管理实例 ==========
/** 路由实例 */
const router = useRouter()
/** 当前路由信息 */
const route = useRoute()
/** 面试状态管理 */
const interviewStore = useInterviewStore()

// ========== 路由参数 ==========
/** 从路由参数获取面试会话ID */
const sessionId = computed(() => Number(route.params.id))

// ========== 响应式数据定义 ==========

// UI 状态控制
/** 是否正在加载报告数据 */
const isLoading = ref(false)
/** 当前面试会话信息 */
const session = ref<InterviewVO | null>(null)
/** 面试报告数据 */
const report = ref<any>(null)
/** 展开的折叠面板项目 */
const activeCollapse = ref<string[]>([])

/** 问答记录列表（问题和评价的组合） */
const qaRecords = ref<Array<{
  question: InterviewQuestionVO
  evaluation?: AnswerEvaluation
}>>([])

// ========== 计算属性 ==========

/** 回答问题总数 */
const questionCount = computed(() => qaRecords.value.length)

/** 平均回答字数统计 */
const averageAnswerLength = computed(() => {
  const answers = qaRecords.value
    .map(r => r.question.userAnswer?.length || 0)
    .filter(length => length > 0)
  
  if (answers.length === 0) return 0
  return Math.round(answers.reduce((sum, length) => sum + length, 0) / answers.length)
})

// ========== 生命周期钩子 ==========
onMounted(async () => {
  await loadReportData()
})

// ========== 数据加载方法 ==========

/**
 * 加载面试报告数据
 * 获取面试基本信息、问答记录、评价数据和总体报告
 */
const loadReportData = async () => {
  try {
    isLoading.value = true
    
    // 直接调用API加载面试基本信息，确保获取最新数据
    session.value = await getInterviewDetailApi(sessionId.value)
    

    
    // 并行加载问答记录和评价数据
    const [questions, evaluations] = await Promise.all([
      getInterviewQuestionsApi(sessionId.value),
      getInterviewEvaluationsApi(sessionId.value)
    ])
    
    // 组合问答和评价数据，只保留已回答的问题
    qaRecords.value = questions
      .filter(q => q.userAnswer)
      .map(question => {
        const evaluation = evaluations.find(e => e.qaRecordId === question.id)
        return { question, evaluation }
      })
    
    // 获取面试报告（仅对已完成的面试）
    if (session.value?.status === 2) { // 已完成的面试
      try {
        report.value = await interviewStore.loadReport(sessionId.value)
      } catch (error) {
        // 如果没有报告，则根据评价数据计算总体得分
        if (evaluations.length > 0) {
          report.value = {
            overallScore: evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length,
            professionalScore: evaluations.reduce((sum, e) => sum + e.professionalScore, 0) / evaluations.length,
            logicScore: evaluations.reduce((sum, e) => sum + e.logicScore, 0) / evaluations.length,
            completenessScore: evaluations.reduce((sum, e) => sum + e.completenessScore, 0) / evaluations.length
          }
        }
      }
    }
    
  } catch (error) {
    console.error('加载报告数据失败:', error)
    ElMessage.error('加载报告数据失败')
  } finally {
    isLoading.value = false
  }
}

// ========== 界面操作方法 ==========

/**
 * 返回上一页
 */
const goBack = () => {
  router.back()
}
</script>

<style scoped>
.interview-report {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.session-info-card {
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.session-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: #64748b;
}

.value {
  color: #374151;
  font-weight: 600;
}

.overview-section {
  margin-bottom: 24px;
}

.detailed-scores {
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.detailed-scores h3 {
  margin: 0;
  color: #374151;
  font-weight: 600;
}

.score-item {
  text-align: center;
  padding: 16px;
}

.score-label {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
}

.score-value {
  font-size: 24px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 12px;
}

.qa-details {
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.qa-details h3 {
  margin: 0;
  color: #374151;
  font-weight: 600;
}

.no-data {
  padding: 40px;
  text-align: center;
}

.qa-item {
  padding: 16px 0;
}

.question-section,
.answer-section,
.evaluation-section {
  margin-bottom: 20px;
}

.question-section h4,
.answer-section h4,
.evaluation-section h4 {
  margin: 0 0 8px 0;
  color: #374151;
  font-weight: 600;
  font-size: 16px;
}

.question-text,
.answer-text {
  margin: 0;
  line-height: 1.6;
  color: #374151;
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.answer-text {
  border-left-color: #67c23a;
}

.eval-scores {
  margin-bottom: 16px;
}

.eval-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.eval-label {
  font-size: 14px;
  color: #64748b;
}

.feedback-section h5 {
  margin: 0 0 8px 0;
  color: #374151;
  font-weight: 600;
  font-size: 14px;
}

.feedback-text {
  margin: 0;
  line-height: 1.6;
  color: #374151;
  background: #fff7ed;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}

.summary-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.summary-card h3 {
  margin: 0;
  color: #374151;
  font-weight: 600;
}

.summary-content p {
  margin: 0;
  line-height: 1.6;
  color: #374151;
  font-size: 16px;
}

/* 分析内容区域 */
.analysis-section {
  margin-bottom: 24px;
}

.analysis-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.analysis-card:last-child {
  margin-bottom: 0;
}

.analysis-card :deep(.el-card__header) {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  border-radius: 12px 12px 0 0;
  padding: 16px 20px;
}

.analysis-card :deep(.el-card__header h3) {
  color: #1e293b;
  font-weight: 600;
  font-size: 16px;
  margin: 0;
}

.analysis-content {
  padding: 4px 0;
}

.analysis-content p {
  margin: 0;
  line-height: 1.8;
  color: #374151;
  font-size: 15px;
  text-align: justify;
}
</style>