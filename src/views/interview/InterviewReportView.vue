<template>
  <div class="interview-report">
    <div class="report-header">
      <div class="header-content">
        <div class="header-left">
          <h2>面试评估报告</h2>
          <div class="session-info">
            <span>{{ session?.title || `面试 #${sessionId}` }}</span>
            <el-divider direction="vertical" />
            <span>面试时间：{{ formatDate(session?.startTime || session?.createdAt) }}</span>
            <el-divider direction="vertical" />
            <span>用时：{{ formatDuration(sessionDuration) }}</span>
          </div>
        </div>
        <div class="header-actions">
          <el-button @click="exportReport">
            <el-icon><Download /></el-icon>
            导出报告
          </el-button>
          <el-button @click="shareReport">
            <el-icon><Share /></el-icon>
            分享
          </el-button>
        </div>
      </div>
    </div>

    <div class="report-content" v-loading="isLoading">
      <!-- Overall Score Section -->
      <el-row :gutter="20" class="overview-section">
        <el-col :span="8">
          <el-card class="score-overview" shadow="hover">
            <div class="overall-score">
              <div class="score-circle">
                <el-progress
                  type="circle"
                  :percentage="Math.round(report?.overallScore || 0)"
                  :width="120"
                  :stroke-width="8"
                  :color="getScoreColor(report?.overallScore || 0)"
                >
                  <template #default="{ percentage }">
                    <div class="score-text">
                      <div class="score-number">{{ report?.overallScore?.toFixed(1) || '0.0' }}</div>
                      <div class="score-label">总分</div>
                    </div>
                  </template>
                </el-progress>
              </div>
              <div class="score-description">
                <el-tag :type="getScoreType(report?.overallScore || 0)" size="large">
                  {{ getScoreGrade(report?.overallScore || 0) }}
                </el-tag>
                <p>{{ getScoreComment(report?.overallScore || 0) }}</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="16">
          <el-card class="score-breakdown" shadow="hover">
            <template #header>
              <h3>能力维度评估</h3>
            </template>
            <div class="dimension-scores">
              <div class="dimension-item">
                <div class="dimension-header">
                  <span class="dimension-name">专业技能</span>
                  <span class="dimension-score">{{ (report?.professionalScore || 0).toFixed(1) }}分</span>
                </div>
                <el-progress
                  :percentage="report?.professionalScore || 0"
                  :stroke-width="12"
                  :show-text="false"
                  color="#67c23a"
                />
                <p class="dimension-desc">技术知识的掌握程度和专业能力表现</p>
              </div>
              <div class="dimension-item">
                <div class="dimension-header">
                  <span class="dimension-name">逻辑思维</span>
                  <span class="dimension-score">{{ (report?.logicScore || 0).toFixed(1) }}分</span>
                </div>
                <el-progress
                  :percentage="report?.logicScore || 0"
                  :stroke-width="12"
                  :show-text="false"
                  color="#409eff"
                />
                <p class="dimension-desc">思路清晰度、逻辑性和表达能力</p>
              </div>
              <div class="dimension-item">
                <div class="dimension-header">
                  <span class="dimension-name">回答完整性</span>
                  <span class="dimension-score">{{ (report?.completenessScore || 0).toFixed(1) }}分</span>
                </div>
                <el-progress
                  :percentage="report?.completenessScore || 0"
                  :stroke-width="12"
                  :show-text="false"
                  color="#e6a23c"
                />
                <p class="dimension-desc">回答的全面性和要点覆盖程度</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Performance Analysis -->
      <el-row :gutter="20" class="analysis-section">
        <el-col :span="12">
          <el-card class="performance-card" shadow="hover">
            <template #header>
              <h3><el-icon><TrendCharts /></el-icon> 表现分析</h3>
            </template>
            <div class="performance-content">
              <div class="analysis-item" v-if="report?.strongPoints">
                <h4><el-icon><Check /></el-icon> 优势表现</h4>
                <p>{{ report.strongPoints }}</p>
              </div>
              <div class="analysis-item" v-if="report?.weakPoints">
                <h4><el-icon><WarningFilled /></el-icon> 待提升领域</h4>
                <p>{{ report.weakPoints }}</p>
              </div>
              <div class="analysis-item" v-if="performanceAnalysis">
                <h4><el-icon><DataAnalysis /></el-icon> 详细分析</h4>
                <div class="analysis-details">
                  <p>{{ performanceAnalysis }}</p>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="suggestions-card" shadow="hover">
            <template #header>
              <h3><el-icon><QuestionFilled /></el-icon> 改进建议</h3>
            </template>
            <div class="suggestions-content">
              <div class="suggestion-item" v-if="report?.improvementSuggestions">
                <h4>总体建议</h4>
                <p>{{ report.improvementSuggestions }}</p>
              </div>
              <div class="suggestion-item" v-if="skillAssessment">
                <h4>技能提升方向</h4>
                <div class="skill-content">
                  <p>{{ skillAssessment }}</p>
                </div>
              </div>
              <div class="suggestion-item">
                <h4>推荐学习资源</h4>
                <ul class="resource-list">
                  <li>根据您的表现，建议重点学习相关专业知识</li>
                  <li>练习逻辑思维和表达能力</li>
                  <li>多做模拟面试来提升综合能力</li>
                </ul>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Radar Chart -->
      <el-row class="chart-section">
        <el-col :span="24">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <h3><el-icon><PieChart /></el-icon> 能力雷达图</h3>
            </template>
            <div class="chart-container">
              <div class="radar-chart">
                <svg width="300" height="300" viewBox="0 0 300 300" class="radar-svg">
                  <!-- Background grid -->
                  <g class="grid">
                    <circle cx="150" cy="150" r="120" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                    <circle cx="150" cy="150" r="90" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                    <circle cx="150" cy="150" r="60" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                    <circle cx="150" cy="150" r="30" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                    <line x1="150" y1="30" x2="150" y2="270" stroke="#e0e0e0" stroke-width="1"/>
                    <line x1="30" y1="150" x2="270" y2="150" stroke="#e0e0e0" stroke-width="1"/>
                    <line x1="244" y1="66" x2="56" y2="234" stroke="#e0e0e0" stroke-width="1"/>
                    <line x1="244" y1="234" x2="56" y2="66" stroke="#e0e0e0" stroke-width="1"/>
                  </g>
                  
                  <!-- Data polygon -->
                  <polygon 
                    :points="getRadarPoints()"
                    fill="rgba(64, 158, 255, 0.3)" 
                    stroke="#409eff" 
                    stroke-width="2"
                  />
                  
                  <!-- Data points -->
                  <circle 
                    v-for="(point, index) in getRadarPointsArray()" 
                    :key="index"
                    :cx="point.x" 
                    :cy="point.y" 
                    r="4" 
                    :fill="getPointColor(index)"
                  />
                  
                  <!-- Labels -->
                  <text x="150" y="25" text-anchor="middle" class="radar-label">专业技能</text>
                  <text x="260" y="105" text-anchor="middle" class="radar-label">逻辑思维</text>
                  <text x="260" y="205" text-anchor="middle" class="radar-label">完整性</text>
                  <text x="150" y="285" text-anchor="middle" class="radar-label">综合能力</text>
                  <text x="40" y="205" text-anchor="middle" class="radar-label">表达能力</text>
                  <text x="40" y="105" text-anchor="middle" class="radar-label">响应速度</text>
                </svg>
              </div>
              
              <div class="chart-legend">
                <div class="legend-item">
                  <div class="legend-color professional"></div>
                  <span>专业技能: {{ (report?.professionalScore || 0).toFixed(1) }}分</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color logic"></div>
                  <span>逻辑思维: {{ (report?.logicScore || 0).toFixed(1) }}分</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color completeness"></div>
                  <span>完整性: {{ (report?.completenessScore || 0).toFixed(1) }}分</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Session Statistics -->
      <el-row :gutter="20" class="statistics-section">
        <el-col :span="8">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="32"><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ formatDuration(sessionDuration) }}</div>
                <div class="stat-label">面试时长</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="32"><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ session?.answeredQuestions || 0 }}</div>
                <div class="stat-label">回答题数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="32"><Timer /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ averageTime }}s</div>
                <div class="stat-label">平均答题时间</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useInterviewStore } from '@/stores/modules/interview'
import { QuestionFilled, ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const interviewStore = useInterviewStore()

const sessionId = parseInt(route.params.id as string)
const isLoading = ref(false)

const session = computed(() => interviewStore.currentSession)
const report = computed(() => interviewStore.currentSession?.report)

const sessionDuration = computed(() => {
  if (!session.value?.startTime) {
    return 0
  }
  
  try {
    const start = new Date(session.value.startTime)
    if (isNaN(start.getTime())) {
      return 0
    }
    
    // 如果面试已完成且有结束时间，使用结束时间
    if (session.value.status === 2 && session.value.endTime) {
      const end = new Date(session.value.endTime)
      if (!isNaN(end.getTime())) {
        return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
      }
    }
    
    // 如果没有结束时间，使用当前时间计算（适用于正在进行的面试）
    const now = new Date()
    return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000))
  } catch (error) {
    console.error('计算面试时长失败:', error)
    return 0
  }
})

const averageTime = computed(() => {
  if (!sessionDuration.value || !session.value?.answeredQuestions) return 0
  return Math.round(sessionDuration.value / session.value.answeredQuestions)
})

const performanceAnalysis = computed(() => {
  return report.value?.performanceAnalysis || '暂无分析内容'
})

const skillAssessment = computed(() => {
  return report.value?.skillAssessment || '暂无评估内容'
})

onMounted(async () => {
  await loadReport()
})

const loadReport = async () => {
  try {
    isLoading.value = true
    await interviewStore.loadSession(sessionId)
    
    // 报告已经包含在会话数据中，不需要单独获取
    if (!report.value) {
      ElMessage.error('面试报告尚未生成')
    }
  } catch (error) {
    ElMessage.error('加载面试报告失败')
    router.push('/dashboard')
  } finally {
    isLoading.value = false
  }
}

const getScoreColor = (score: number) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getScoreType = (score: number) => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

const getScoreGrade = (score: number) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  if (score >= 60) return '及格'
  return '待提升'
}

const getScoreComment = (score: number) => {
  if (score >= 90) return '表现非常出色，展现了扎实的专业基础'
  if (score >= 80) return '整体表现良好，有较强的专业能力'
  if (score >= 70) return '表现中等，基础知识掌握尚可'
  if (score >= 60) return '基本达标，但还有提升空间'
  return '需要进一步加强学习和练习'
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '未知时间'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '未知时间'
    }
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return '未知时间'
  }
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const exportReport = () => {
  ElMessage.info('导出功能开发中...')
}

const shareReport = () => {
  ElMessage.info('分享功能开发中...')
}

// Radar chart functions
const getRadarPoints = () => {
  const scores = [
    report.value?.professionalScore || 0,  // 专业技能
    report.value?.logicScore || 0,         // 逻辑思维
    report.value?.completenessScore || 0,  // 完整性
    (report.value?.overallScore || 0),     // 综合能力
    (report.value?.logicScore || 0),       // 表达能力 (使用逻辑分数)
    ((report.value?.professionalScore || 0) + (report.value?.logicScore || 0)) / 2  // 响应速度
  ]
  
  const points = []
  const centerX = 150
  const centerY = 150
  const maxRadius = 120
  
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 90) * Math.PI / 180  // Start from top, 60 degrees apart
    const radius = (scores[i] / 100) * maxRadius
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  
  return points.join(' ')
}

const getRadarPointsArray = () => {
  const scores = [
    report.value?.professionalScore || 0,
    report.value?.logicScore || 0,
    report.value?.completenessScore || 0,
    (report.value?.overallScore || 0),
    (report.value?.logicScore || 0),
    ((report.value?.professionalScore || 0) + (report.value?.logicScore || 0)) / 2
  ]
  
  const points = []
  const centerX = 150
  const centerY = 150
  const maxRadius = 120
  
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 90) * Math.PI / 180
    const radius = (scores[i] / 100) * maxRadius
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    points.push({ x, y })
  }
  
  return points
}

const getPointColor = (index: number) => {
  const colors = ['#67c23a', '#409eff', '#e6a23c', '#f56c6c', '#909399', '#e6a23c']
  return colors[index] || '#409eff'
}
</script>

<style scoped>
.interview-report {
  min-height: 100vh;
  background-color: #f0f2f5;
}

.report-header {
  background: white;
  padding: 24px;
  border-bottom: 1px solid #e4e7ed;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-weight: 600;
}

.session-info {
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.report-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.overview-section {
  margin-bottom: 24px;
}

.score-overview {
  height: 100%;
  text-align: center;
}

.overall-score {
  padding: 20px;
}

.score-circle {
  margin-bottom: 20px;
}

.score-text {
  text-align: center;
}

.score-number {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.score-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.score-description p {
  margin: 12px 0 0 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.score-breakdown {
  height: 100%;
}

.dimension-scores {
  padding: 20px 0;
}

.dimension-item {
  margin-bottom: 32px;
}

.dimension-item:last-child {
  margin-bottom: 0;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.dimension-name {
  font-weight: 600;
  color: #303133;
}

.dimension-score {
  font-weight: 600;
  color: #409eff;
}

.dimension-desc {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #909399;
  line-height: 1.4;
}

.analysis-section {
  margin-bottom: 24px;
}

.performance-card,
.suggestions-card {
  height: 100%;
}

.performance-content,
.suggestions-content {
  padding: 20px 0;
}

.analysis-item,
.suggestion-item {
  margin-bottom: 24px;
}

.analysis-item:last-child,
.suggestion-item:last-child {
  margin-bottom: 0;
}

.analysis-item h4,
.suggestion-item h4 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #606266;
}

.analysis-item p,
.suggestion-item p {
  margin: 0;
  line-height: 1.6;
  color: #303133;
}

.analysis-details p {
  margin-bottom: 8px;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.skill-tag {
  margin: 0;
}

.resource-list {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.resource-list li {
  margin-bottom: 4px;
  line-height: 1.5;
  color: #606266;
}

.chart-section {
  margin-bottom: 24px;
}

.chart-container {
  padding: 40px 20px;
  text-align: center;
}

.radar-chart {
  display: inline-block;
  margin-bottom: 20px;
}

.radar-svg {
  max-width: 100%;
  height: auto;
}

.radar-label {
  font-size: 12px;
  fill: #606266;
  font-weight: 500;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
}

.chart-placeholder p {
  margin: 16px 0 24px 0;
  font-size: 16px;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.professional {
  background: #67c23a;
}

.legend-color.logic {
  background: #409eff;
}

.legend-color.completeness {
  background: #e6a23c;
}

.statistics-section {
  margin-bottom: 24px;
}

.stat-card {
  height: 120px;
  display: flex;
  align-items: center;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.stat-icon {
  color: #409eff;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

:deep(.el-card__header) {
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 24px;
}

:deep(.el-card__header h3) {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-progress-bar__outer) {
  border-radius: 6px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 6px;
}
</style>