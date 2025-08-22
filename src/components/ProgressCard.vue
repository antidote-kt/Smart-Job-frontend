<!--
  进度卡片组件
  用于展示任务进度，包含进度条、统计信息和时间预估
-->
<template>
  <el-card shadow="never" class="progress-card">
    <!-- 进度头部：显示标签、进度数值和百分比 -->
    <div class="progress-header">
      <div class="progress-info">
        <!-- 进度标签 -->
        <span class="progress-label">{{ label }}</span>
        <!-- 进度数值显示 -->
        <span class="progress-text">{{ current }}/{{ total }} {{ unit }}</span>
      </div>
      <!-- 进度百分比 -->
      <div class="progress-percentage">{{ percentage }}%</div>
    </div>
    
    <!-- Element Plus 进度条组件 -->
    <el-progress
      :percentage="percentage"
      :stroke-width="strokeWidth"
      :color="progressColor"
      :show-text="false"
    />

    <!-- 进度统计信息（可选） -->
    <div v-if="showStats" class="progress-stats">
      <div class="stat-item">
        <span class="stat-label">剩余：</span>
        <span class="stat-value">{{ remaining }} {{ unit }}</span>
      </div>
      <div v-if="estimatedTime" class="stat-item">
        <span class="stat-label">预计剩余时间：</span>
        <span class="stat-value">{{ estimatedTime }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 组件属性接口定义
 */
interface Props {
  /** 当前进度数值 */
  current: number
  /** 总数值 */
  total: number
  /** 进度标签 */
  label?: string
  /** 数值单位 */
  unit?: string
  /** 进度条粗细 */
  strokeWidth?: number
  /** 是否显示统计信息 */
  showStats?: boolean
  /** 预估剩余时间 */
  estimatedTime?: string
}

// 定义组件属性，设置默认值
const props = withDefaults(defineProps<Props>(), {
  label: '进度',
  unit: '项',
  strokeWidth: 8,
  showStats: true
})

/**
 * 计算进度百分比
 */
const percentage = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.current / props.total) * 100)
})

/**
 * 计算剩余数量
 */
const remaining = computed(() => {
  return Math.max(0, props.total - props.current)
})

/**
 * 根据进度百分比计算进度条颜色
 * 不同进度区间显示不同颜色
 */
const progressColor = computed(() => {
  const percent = percentage.value
  if (percent >= 100) return '#67c23a' // 绿色：完成
  if (percent >= 80) return '#e6a23c'  // 橙色：接近完成
  if (percent >= 60) return '#409eff'  // 蓝色：进度良好
  if (percent >= 40) return '#909399'  // 灰色：进度一般
  return '#f56c6c'                     // 红色：进度较慢
})
</script>

<style scoped>
.progress-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fafbfc;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-label {
  font-weight: 600;
  color: #374151;
  font-size: 16px;
}

.progress-text {
  font-size: 14px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
}

.progress-percentage {
  font-size: 18px;
  font-weight: 700;
  color: #374151;
}

.progress-stats {
  display: flex;
  gap: 24px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
}

.stat-value {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}
</style>