<!--
  面试问题展示卡片组件
  用于显示面试题目的详细信息，包含题目内容、分类、难度、提示和关键词等
-->
<template>
  <el-card class="question-card" shadow="hover">
    <!-- 问题头部：显示题目编号、分类和难度标签 -->
    <template #header>
      <div class="question-header">
        <!-- 问题编号区域 -->
        <div class="question-number">
          <el-icon><QuestionFilled /></el-icon>
          <span>问题 {{ questionNumber }}</span>
        </div>
        <!-- 题目元信息区域：分类和难度标签 -->
        <div class="question-meta">
          <el-tag v-if="category" size="small" type="primary">{{ category }}</el-tag>
          <el-tag v-if="difficulty" size="small" :type="getDifficultyType(difficulty)">
            {{ difficulty }}
          </el-tag>
        </div>
      </div>
    </template>

    <div class="question-content">
      <!-- 问题文本内容 -->
      <p class="question-text">{{ questionText }}</p>
      
      <!-- 问题提示区域：可折叠显示 -->
      <div v-if="hints && hints.length > 0" class="question-hints">
        <el-collapse>
          <el-collapse-item title="💡 提示" name="hints">
            <ul class="hints-list">
              <li v-for="hint in hints" :key="hint">{{ hint }}</li>
            </ul>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 问题关键词区域：以标签形式展示 -->
      <div v-if="keywords && keywords.length > 0" class="question-keywords">
        <div class="keywords-title">关键词：</div>
        <div class="keywords-tags">
          <el-tag
            v-for="keyword in keywords"
            :key="keyword"
            size="small"
            effect="plain"
          >
            {{ keyword }}
          </el-tag>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { QuestionFilled } from '@element-plus/icons-vue'

/**
 * 组件属性接口定义
 */
interface Props {
  /** 问题序号 */
  questionNumber: number
  /** 问题文本内容 */
  questionText: string
  /** 问题分类（可选） */
  category?: string
  /** 难度等级（可选） */
  difficulty?: string
  /** 答题提示列表（可选） */
  hints?: string[]
  /** 关键词列表（可选） */
  keywords?: string[]
}

defineProps<Props>()

/**
 * 根据难度等级获取对应的标签类型
 * @param difficulty 难度等级字符串
 * @returns Element Plus 标签类型
 */
const getDifficultyType = (difficulty: string) => {
  const typeMap: Record<string, string> = {
    '简单': 'success',
    '中等': 'warning', 
    '困难': 'danger',
    '初级': 'success',
    '中级': 'warning',
    '高级': 'danger'
  }
  return typeMap[difficulty] || 'info'
}
</script>

<style scoped>
.question-card {
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-number {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #409eff;
  font-size: 16px;
}

.question-meta {
  display: flex;
  gap: 8px;
}

.question-content {
  padding: 8px 0;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
  color: #374151;
  margin: 0 0 16px 0;
  font-weight: 500;
}

.question-hints {
  margin-bottom: 16px;
}

.hints-list {
  margin: 0;
  padding-left: 16px;
  color: #64748b;
}

.hints-list li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.question-keywords {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.keywords-title {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.keywords-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
</style>