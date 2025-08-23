<!--
  状态标签组件
  用于显示面试状态，根据不同状态显示相应的颜色和文本
-->
<template>
  <el-tag :type="tagType" :size="size">
    {{ tagText }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 组件属性接口定义
 */
interface Props {
  /** 状态值，可以是字符串或数字（可选，默认为'0'） */
  status?: string | number
  /** 标签大小 */
  size?: 'large' | 'default' | 'small'
}

// 定义组件属性，设置默认值
const props = withDefaults(defineProps<Props>(), {
  size: 'default'
})

// 将状态转换为字符串，处理undefined/null情况
const statusStr = String(props.status || '0')

/**
 * 根据状态值计算标签类型（颜色主题）
 * 支持字符串和数字两种格式的状态值
 */
const tagType = computed(() => {
  switch (statusStr) {
    case 'COMPLETED':
    case '2': return 'success'    // 绿色：已完成
    case 'IN_PROGRESS':
    case '1': return 'warning'    // 橙色：进行中
    case 'CREATED':
    case '0': return 'info'       // 蓝色：已创建
    default: return 'info'        // 蓝色：未知状态
  }
})

/**
 * 根据状态值计算显示文本
 * 将状态码转换为用户友好的中文描述
 */
const tagText = computed(() => {
  switch (statusStr) {
    case 'COMPLETED':
    case '2': return '已完成'
    case 'IN_PROGRESS':
    case '1': return '进行中'
    case 'CREATED':
    case '0': return '已创建'
    default: return '未知'
  }
})
</script>

<style scoped>
:deep(.el-tag) {
  border-radius: 8px;
  font-weight: 500;
  font-size: 12px;
}
</style>