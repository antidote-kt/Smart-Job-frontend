<template>
  <!-- 主仪表盘页面 - 显示用户面试统计信息和最近面试记录 -->
  <div class="dashboard">
    <div class="dashboard-content">
            <!-- 欢迎区域：包含欢迎文案和开始面试按钮 -->
            <el-card class="welcome-card" shadow="hover">
              <div class="welcome-content">
                <div class="welcome-text">
                  <h3>欢迎使用 JobSmart 智能面试系统</h3>
                  <p>通过AI模拟面试，提升您的求职竞争力</p>
                </div>
                <el-button type="primary" size="large" @click="$router.push('/interview/create')">
                  <el-icon><Plus /></el-icon>
                  开始新面试
                </el-button>
              </div>
            </el-card>

            <!-- 统计卡片组：显示面试次数、完成数和平均分数 -->
            <el-row :gutter="20" class="stats-row">
              <el-col :span="8">
                <!-- 总面试次数统计卡片 -->
                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon total">
                      <el-icon size="24"><Document /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-number">{{ totalSessions }}</div>
                      <div class="stat-label">总面试次数</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <!-- 已完成面试数量统计卡片 -->
                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon completed">
                      <el-icon size="24"><Check /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-number">{{ completedSessions }}</div>
                      <div class="stat-label">已完成面试</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <!-- 平均分数统计卡片 -->
                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon score">
                      <el-icon size="24"><TrendCharts /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-number">{{ averageScore.toFixed(1) }}</div>
                      <div class="stat-label">平均分数</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <!-- 最近面试记录表格 -->
            <el-card class="recent-sessions" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>最近的面试</span>
                  <el-button type="primary" text @click="$router.push('/history')">
                    查看全部
                  </el-button>
                </div>
              </template>

              <!-- 面试记录列表表格 -->
              <el-table :data="recentSessions" style="width: 100%" v-loading="isLoading">
                <!-- 面试名称列 -->
                <el-table-column prop="title" label="面试名称" width="200">
                  <template #default="{ row }">
                    <span>{{ formatSessionName(row.title, row.id) }}</span>
                  </template>
                </el-table-column>
                <!-- 岗位列 -->
                <el-table-column prop="position" label="岗位" width="150" />
                <!-- 面试状态列 -->
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <StatusTag :status="row.status" />
                  </template>
                </el-table-column>
                <!-- 总分列 -->
                <el-table-column prop="overallScore" label="总分" width="100">
                  <template #default="{ row }">
                    <ScoreDisplay :score="row.overallScore" suffix="分" :precision="0" />
                  </template>
                </el-table-column>
                <!-- 开始时间列 -->
                <el-table-column prop="startTime" label="开始时间" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.startTime) }}
                  </template>
                </el-table-column>
                <!-- 操作列：继续面试或查看报告按钮 -->
                <el-table-column label="操作" fixed="right" width="200">
                  <template #default="{ row }">
                    <div style="display: flex; gap: 8px; align-items: center;">
                      <el-button
                        v-if="isInProgress(row.status)"
                        type="primary"
                        text
                        @click="resumeInterview(row)"
                        style="padding: 6px 12px; font-size: 13px; line-height: 1.4;"
                      >
                        继续面试
                      </el-button>
                      <el-button
                        v-if="isCompleted(row.status)"
                        type="success"
                        text
                        @click="viewReport(row)"
                        style="padding: 6px 12px; font-size: 13px; line-height: 1.4;"
                      >
                        查看报告
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue 3 组合式 API 导入
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

// Store 状态管理
import { useAuthStore } from '@/stores/modules/auth'
import { useInterviewStore } from '@/stores/modules/interview'

// Element Plus 图标组件
import { Plus, Document, Check, TrendCharts } from '@element-plus/icons-vue'

// TypeScript 类型定义
import type { InterviewVO } from '@/api/interview'

// 自定义组件导入
import StatusTag from '@/components/StatusTag.vue'
import ScoreDisplay from '@/components/ScoreDisplay.vue'
import StatisticCard from '@/components/StatisticCard.vue'

// 组合式函数（Composables）导入
import { useStatistics } from '@/composables/useStatistics'
import { useInterviewStatus } from '@/composables/useInterviewStatus'

// 工具函数导入
import { formatDate, formatSessionName } from '@/utils/formatters'

// 路由和状态管理实例
const router = useRouter()
const authStore = useAuthStore()
const interviewStore = useInterviewStore()

// 面试状态判断函数：用于判断面试是否进行中或已完成
const { isInProgress, isCompleted } = useInterviewStatus()

// 统计数据计算：基于面试会话数据计算总数、完成数、平均分等
const { totalSessions, completedSessions, averageScore, recentSessions } = useStatistics(
  computed(() => interviewStore.sessions)
)

// 页面加载状态
const isLoading = ref(false)

// 组件挂载时加载仪表盘数据
onMounted(async () => {
  await loadDashboardData()
})

/**
 * 加载仪表盘数据
 * 从服务端获取用户的面试会话列表，用于统计和展示
 */
const loadDashboardData = async () => {
  try {
    isLoading.value = true
    // 从服务端加载所有面试会话数据
    await interviewStore.loadSessions()
  } catch (error) {
    // 数据加载失败时显示错误提示
    ElMessage.error('加载数据失败')
  } finally {
    // 无论成功失败都要关闭加载状态
    isLoading.value = false
  }
}

/**
 * 继续进行中的面试
 * @param session 面试会话对象
 */
const resumeInterview = (session: InterviewVO) => {
  router.push(`/interview/${session.id}`)
}

/**
 * 查看已完成面试的报告
 * @param session 面试会话对象
 */
const viewReport = (session: InterviewVO) => {
  router.push(`/interview/${session.id}/report`)
}
</script>

<style scoped>
.dashboard {
  background: #f5f7fa;
  min-height: 100vh;
}

.dashboard-content {
  padding: 20px;
  max-width: 100%;
  margin: 0;
}

.welcome-card {
  margin-bottom: 24px;
  border-radius: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.welcome-card :deep(.el-card__body) {
  padding: 24px;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-text h3 {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  color: #1e293b;
}

.welcome-text p {
  margin: 0;
  color: #64748b;
  font-size: 16px;
  line-height: 1.5;
}

.welcome-content .el-button {
  background: #409eff;
  border: 1px solid #409eff;
  color: white;
  font-weight: 500;
  padding: 12px 24px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.welcome-content .el-button:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.stats-row {
  margin-bottom: 32px;
}

.stat-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 0;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-icon.total {
  background: #409eff;
}

.stat-icon.completed {
  background: #67c23a;
}

.stat-icon.score {
  background: #e6a23c;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.recent-sessions {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.recent-sessions :deep(.el-card__header) {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  border-radius: 12px 12px 0 0;
}

.recent-sessions :deep(.el-card__header h3) {
  color: #1e293b;
  font-weight: 700;
  font-size: 18px;
  margin: 0;
}

.recent-sessions :deep(.el-table) {
  border: none;
  border-radius: 0 0 16px 16px;
}

.recent-sessions :deep(.el-table th) {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  border: none;
  font-size: 14px;
}

.recent-sessions :deep(.el-table td) {
  border-bottom: 1px solid #f1f5f9;
  color: #64748b;
  font-size: 14px;
}

.recent-sessions :deep(.el-table tr:hover > td) {
  background: #f8fafc;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-card__header) {
  padding: 20px 24px;
}

:deep(.el-table .el-button) {
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  line-height: 1.4;
  vertical-align: middle;
}

:deep(.el-tag) {
  border-radius: 8px;
  font-weight: 500;
  font-size: 12px;
}
</style>