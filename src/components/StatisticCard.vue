<!--
  统计卡片组件
  用于展示统计数据，包含图标、数值和标签
-->
<template>
  <el-card class="statistic-card">
    <div class="stat-content">
      <!-- 统计图标区域 -->
      <div class="stat-icon" :class="iconClass">
        <el-icon :size="iconSize">
          <component :is="icon" />
        </el-icon>
      </div>
      <!-- 统计信息区域 -->
      <div class="stat-info">
        <!-- 统计数值 -->
        <div class="stat-number">{{ value }}</div>
        <!-- 统计标签描述 -->
        <div class="stat-label">{{ label }}</div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
/**
 * 组件属性接口定义
 */
interface Props {
  /** 统计数值 */
  value: string | number
  /** 统计标签描述 */
  label: string
  /** 显示的图标组件 */
  icon: any
  /** 图标样式类名（用于设置颜色主题） */
  iconClass?: string
  /** 图标大小 */
  iconSize?: number
}

// 定义组件属性，设置默认值
const props = withDefaults(defineProps<Props>(), {
  iconSize: 24
})
</script>

<style scoped>
.statistic-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.statistic-card:hover {
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
</style>