<template>
  <div class="dashboard">
    <div class="dashboard-content">
            <!-- Welcome Section -->
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

            <!-- Statistics Cards -->
            <el-row :gutter="20" class="stats-row">
              <el-col :span="8">
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

            <!-- Recent Sessions -->
            <el-card class="recent-sessions" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>最近的面试</span>
                  <el-button type="primary" text @click="$router.push('/history')">
                    查看全部
                  </el-button>
                </div>
              </template>

              <el-table :data="recentSessions" style="width: 100%" v-loading="isLoading">
                <el-table-column prop="sessionName" label="面试名称" width="200">
                  <template #default="{ row }">
                    <span>{{ formatSessionName(row.sessionName, row.id) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="position" label="岗位" width="150" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <StatusTag :status="row.status" />
                  </template>
                </el-table-column>
                <el-table-column prop="overallScore" label="总分" width="100">
                  <template #default="{ row }">
                    <ScoreDisplay :score="row.overallScore" suffix="分" :precision="0" />
                  </template>
                </el-table-column>
                <el-table-column prop="startTime" label="开始时间" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.startTime) }}
                  </template>
                </el-table-column>
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/modules/auth'
import { useInterviewStore } from '@/stores/modules/interview'
import { Plus, Document, Check, TrendCharts } from '@element-plus/icons-vue'
import type { InterviewVO } from '@/api/interview'

import StatusTag from '@/components/StatusTag.vue'
import ScoreDisplay from '@/components/ScoreDisplay.vue'
import StatisticCard from '@/components/StatisticCard.vue'
import { useStatistics } from '@/composables/useStatistics'
import { useInterviewStatus } from '@/composables/useInterviewStatus'
import { formatDate, formatSessionName } from '@/utils/formatters'

const router = useRouter()
const authStore = useAuthStore()
const interviewStore = useInterviewStore()
const { isInProgress, isCompleted } = useInterviewStatus()
const { totalSessions, completedSessions, averageScore, recentSessions } = useStatistics(
  computed(() => interviewStore.sessions)
)

const isLoading = ref(false)

onMounted(async () => {
  await loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    isLoading.value = true
    await interviewStore.loadSessions()
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    isLoading.value = false
  }
}

const resumeInterview = (session: InterviewVO) => {
  router.push(`/interview/${session.id}`)
}

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