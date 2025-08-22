<template>
  <div class="interview-report">
    <PageHeader title="面试评估报告">
      <template #actions>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </template>
    </PageHeader>

    <div class="report-content" v-loading="isLoading">
      <!-- 基本信息 -->
      <el-card class="session-info-card" shadow="hover">
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

      <!-- 总体评分 -->
      <el-row :gutter="20" class="overview-section">
        <el-col :span="8">
          <StatisticCard
            :value="(report?.overallScore || 0).toFixed(1)"
            label="总体得分"
            :icon="TrendCharts"
            icon-class="score"
          />
        </el-col>
        <el-col :span="8">
          <StatisticCard
            :value="questionCount"
            label="回答题数"
            :icon="QuestionFilled"
            icon-class="total"
          />
        </el-col>
        <el-col :span="8">
          <StatisticCard
            :value="averageAnswerLength"
            label="平均回答字数"
            :icon="EditPen"
            icon-class="completed"
          />
        </el-col>
      </el-row>

      <!-- 详细评分 -->
      <el-card class="detailed-scores" shadow="hover">
        <template #header>
          <h3>详细评分</h3>
        </template>
        
        <el-row :gutter="20">
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

      <!-- 问答详情 -->
      <el-card class="qa-details" shadow="hover">
        <template #header>
          <h3>问答详情</h3>
        </template>

        <div v-if="qaRecords.length === 0" class="no-data">
          <el-empty description="暂无问答记录" />
        </div>

        <el-collapse v-else v-model="activeCollapse">
          <el-collapse-item
            v-for="(record, index) in qaRecords"
            :key="record.question.id"
            :title="`第 ${index + 1} 题：${record.question.questionText.slice(0, 50)}...`"
            :name="index.toString()"
          >
            <div class="qa-item">
              <!-- 问题 -->
              <div class="question-section">
                <h4>问题</h4>
                <p class="question-text">{{ record.question.questionText }}</p>
              </div>

              <!-- 回答 -->
              <div class="answer-section">
                <h4>我的回答</h4>
                <p class="answer-text">{{ record.question.userAnswer }}</p>
              </div>

              <!-- 评价 -->
              <div v-if="record.evaluation" class="evaluation-section">
                <h4>AI 评价</h4>
                <el-row :gutter="16" class="eval-scores">
                  <el-col :span="6">
                    <div class="eval-item">
                      <span class="eval-label">专业性</span>
                      <ScoreDisplay :score="record.evaluation.professionalScore" :precision="1" />
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="eval-item">
                      <span class="eval-label">逻辑性</span>
                      <ScoreDisplay :score="record.evaluation.logicScore" :precision="1" />
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="eval-item">
                      <span class="eval-label">完整性</span>
                      <ScoreDisplay :score="record.evaluation.completenessScore" :precision="1" />
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="eval-item">
                      <span class="eval-label">综合得分</span>
                      <ScoreDisplay :score="record.evaluation.overallScore" :precision="1" />
                    </div>
                  </el-col>
                </el-row>

                <div class="feedback-section">
                  <h5>反馈建议</h5>
                  <p class="feedback-text">{{ record.evaluation.aiFeedback }}</p>
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-card>

      <!-- 总体反馈 -->
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, TrendCharts, 
  QuestionFilled, EditPen 
} from '@element-plus/icons-vue'

import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import ScoreDisplay from '@/components/ScoreDisplay.vue'
import StatisticCard from '@/components/StatisticCard.vue'

import { useInterviewStore } from '@/stores/modules/interview'
import { formatDate, formatSessionName } from '@/utils/formatters'
import type { InterviewVO, InterviewQuestionVO, AnswerEvaluation } from '@/api/interview'
import { getInterviewQuestionsApi, getInterviewEvaluationsApi, getInterviewDetailApi } from '@/api/interview'

const router = useRouter()
const route = useRoute()
const interviewStore = useInterviewStore()

const sessionId = computed(() => Number(route.params.id))

const isLoading = ref(false)
const session = ref<InterviewVO | null>(null)
const report = ref<any>(null)
const qaRecords = ref<Array<{
  question: InterviewQuestionVO
  evaluation?: AnswerEvaluation
}>>([])
const activeCollapse = ref<string[]>([])

const questionCount = computed(() => qaRecords.value.length)

const averageAnswerLength = computed(() => {
  const answers = qaRecords.value
    .map(r => r.question.userAnswer?.length || 0)
    .filter(length => length > 0)
  
  if (answers.length === 0) return 0
  return Math.round(answers.reduce((sum, length) => sum + length, 0) / answers.length)
})

onMounted(async () => {
  await loadReportData()
})

const loadReportData = async () => {
  try {
    isLoading.value = true
    
    // 直接调用API加载面试基本信息，确保获取最新数据
    session.value = await getInterviewDetailApi(sessionId.value)
    
    console.log('面试数据:', session.value) // 调试日志
    console.log('面试状态:', session.value?.status)
    console.log('开始时间:', session.value?.startTime)
    console.log('结束时间:', session.value?.endTime)
    
    // 加载问答记录和评价
    const [questions, evaluations] = await Promise.all([
      getInterviewQuestionsApi(sessionId.value),
      getInterviewEvaluationsApi(sessionId.value)
    ])
    
    // 组合问答和评价数据
    qaRecords.value = questions
      .filter(q => q.userAnswer)
      .map(question => {
        const evaluation = evaluations.find(e => e.qaRecordId === question.id)
        return { question, evaluation }
      })
    
    // 获取面试报告
    if (session.value?.status === 2) { // 已完成的面试
      try {
        report.value = await interviewStore.loadReport(sessionId.value)
      } catch (error) {
        // 如果没有报告，则根据评价计算总体报告
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
</style>