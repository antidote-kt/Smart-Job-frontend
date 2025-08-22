<!-- 
  页面头部组件
  用于显示页面标题、描述和右侧操作按钮区域
-->
<template>
  <div class="page-header">
    <div class="header-content">
      <!-- 左侧标题区域 -->
      <div class="header-left">
        <!-- 页面主标题 -->
        <h2>{{ title }}</h2>
        <!-- 页面描述（可选） -->
        <p v-if="description">{{ description }}</p>
      </div>
      <!-- 右侧操作按钮区域（使用插槽） -->
      <div class="header-actions" v-if="$slots.actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件属性接口定义
 */
interface Props {
  /** 页面标题 */
  title: string
  /** 页面描述（可选） */
  description?: string
}

// 定义组件属性
defineProps<Props>()
</script>

<style scoped>
/* 页面头部容器样式 */
.page-header {
  margin-bottom: 24px;
}

/* 头部内容布局 */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

/* 左侧标题区域 */
.header-left {
  flex: 1;
}

/* 主标题样式 */
.header-left h2 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-weight: 700;
  font-size: 28px;
}

/* 描述文本样式 */
.header-left p {
  margin: 0;
  color: #64748b;
  font-size: 16px;
}

/* 右侧操作按钮区域样式 */
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>