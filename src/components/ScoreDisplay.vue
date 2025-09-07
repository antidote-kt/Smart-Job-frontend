<!--
  分数显示组件
  用于格式化显示数值分数，支持后缀和精度控制
-->
<template>
  <div class="score-display">
    <!-- 分数数值 -->
    <span class="score-value">{{ displayScore }}</span>
    <!-- 分数后缀（如：分、%等）（可选） -->
    <span v-if="suffix" class="score-suffix">{{ suffix }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 组件属性接口定义
 */
interface Props {
  /** 分数数值（可选，默认为0） */
  score?: number
  /** 分数后缀文本，如"分"、"%"等（可选） */
  suffix?: string
  /** 小数精度，控制显示的小数位数（可选，默认为1） */
  precision?: number
}

// 定义组件属性，设置默认值
const props = withDefaults(defineProps<Props>(), {
  score: 0,
  precision: 1
})

/**
 * 计算显示的分数格式
 * 当分数为 null/undefined 时显示"-"，否则按指定精度格式化数值（包括0分）
 */
const displayScore = computed(() => {
  if (props.score === null || props.score === undefined) return '-'
  return props.score.toFixed(props.precision)
})
</script>

<style scoped>
.score-display {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
}

.score-value {
  font-weight: 600;
}

.score-suffix {
  font-size: 0.9em;
  color: #64748b;
}
</style>