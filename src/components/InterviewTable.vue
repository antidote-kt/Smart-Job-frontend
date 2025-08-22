<!-- 
  面试记录表格组件
  用于展示面试历史记录，包含面试状态、分数、操作按钮等信息
-->
<template>
  <!-- 面试记录表格，支持加载状态 -->
  <el-table :data="sessions" v-loading="loading" style="width: 100%">
    <!-- 面试名称列：显示面试名称和是否为最新面试 -->
    <el-table-column prop="title" label="面试名称" width="250">
      <template #default="{ row }">
        <!-- 显示面试标题，如果没有标题则使用默认格式 -->
        <span>{{ row.title || `面试 ${row.id}` }}</span>
        <!-- 24小时内的面试显示"最新"标签 -->
        <el-tag v-if="isRecent(row)" size="small" type="success" style="margin-left: 8px">最新</el-tag>
      </template>
    </el-table-column>
    
    <!-- 岗位信息列：显示职位名称和分类 -->
    <el-table-column prop="position" label="岗位" width="180">
      <template #default="{ row }">
        <div class="job-info">
          <!-- 职位名称 -->
          <div class="job-name">{{ row.position || '-' }}</div>
          <!-- 职位分类 -->
          <div class="job-category">{{ row.category || '-' }}</div>
        </div>
      </template>
    </el-table-column>
    
    <!-- 面试状态列：使用状态标签组件显示 -->
    <el-table-column prop="status" label="状态" width="100">
      <template #default="{ row }">
        <StatusTag :status="row.status" />
      </template>
    </el-table-column>
    
    <!-- 已回答问题数量列 -->
    <el-table-column prop="answeredQuestions" label="问题数" width="100">
      <template #default="{ row }">
        <span>{{ row.answeredQuestions || 0 }} 题</span>
      </template>
    </el-table-column>
    
    <!-- 总分列：使用分数显示组件 -->
    <el-table-column prop="overallScore" label="总分" width="100">
      <template #default="{ row }">
        <ScoreDisplay :score="row.overallScore" suffix="分" />
      </template>
    </el-table-column>
    
    <!-- 开始时间列：显示日期和具体时间 -->
    <el-table-column prop="startTime" label="开始时间" width="180">
      <template #default="{ row }">
        <div class="date-info">
          <!-- 日期部分 -->
          <div class="date">{{ formatDate(row.startTime) }}</div>
          <!-- 时间部分 -->
          <div class="time">{{ formatTime(row.startTime) }}</div>
        </div>
      </template>
    </el-table-column>
    
    <!-- 操作列：根据面试状态显示不同操作按钮 -->
    <el-table-column label="操作" fixed="right" width="200">
      <template #default="{ row }">
        <div class="action-buttons">
          <!-- 继续面试按钮：面试进行中时显示 -->
          <el-button
            v-if="isInProgress(row.status)"
            type="primary"
            size="small"
            @click="handleResume(row)"
          >
            继续面试
          </el-button>
          <!-- 查看报告按钮：面试完成时显示 -->
          <el-button
            v-if="isCompleted(row.status)"
            type="success"
            size="small"
            @click="handleViewReport(row)"
          >
            查看报告
          </el-button>
          <!-- 查看详情按钮：有回答记录时显示 -->
          <el-button
            v-if="row.answeredQuestions > 0"
            type="info"
            size="small"
            @click="handleViewDetail(row)"
          >
            查看详情
          </el-button>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
// 导入类型定义和组件
import type { InterviewVO } from '@/api/interview'
import StatusTag from '@/components/StatusTag.vue'
import ScoreDisplay from '@/components/ScoreDisplay.vue'
import { useInterviewStatus } from '@/composables/useInterviewStatus'
import { formatDate, formatSessionName } from '@/utils/formatters'

/**
 * 组件属性接口定义
 */
interface Props {
  /** 面试记录数据数组 */
  sessions: InterviewVO[]
  /** 是否处于加载状态 */
  loading?: boolean
}

/**
 * 组件事件接口定义
 */
interface Emits {
  /** 继续面试事件 */
  (e: 'resume', session: InterviewVO): void
  /** 查看报告事件 */
  (e: 'view-report', session: InterviewVO): void
  /** 查看详情事件 */
  (e: 'view-detail', session: InterviewVO): void
}

// 定义组件属性和事件
defineProps<Props>()
const emit = defineEmits<Emits>()

// 获取面试状态判断方法
const { isInProgress, isCompleted } = useInterviewStatus()

/**
 * 格式化时间字符串为本地时间格式
 * @param dateString 日期字符串
 * @returns 格式化后的时间字符串 (HH:MM)
 */
const formatTime = (dateString?: string) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? '-' : date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } catch {
    return '-'
  }
}

/**
 * 判断面试是否为最近24小时内的
 * @param session 面试记录对象
 * @returns 是否为最近面试
 */
const isRecent = (session: InterviewVO) => {
  if (!session.startTime) return false
  const now = Date.now()
  const sessionTime = new Date(session.startTime).getTime()
  // 24小时内算作最近
  return (now - sessionTime) < (24 * 60 * 60 * 1000)
}

// 事件处理方法
/** 处理继续面试事件 */
const handleResume = (session: InterviewVO) => emit('resume', session)
/** 处理查看报告事件 */
const handleViewReport = (session: InterviewVO) => emit('view-report', session)
/** 处理查看详情事件 */
const handleViewDetail = (session: InterviewVO) => emit('view-detail', session)
</script>

<style scoped>
/* 岗位信息容器样式 */
.job-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 岗位名称样式 */
.job-name {
  font-weight: 500;
  color: #303133;
}

/* 岗位分类样式 */
.job-category {
  font-size: 12px;
  color: #909399;
}

/* 日期信息容器样式 */
.date-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 日期样式 */
.date {
  font-weight: 500;
  color: #303133;
}

/* 时间样式 */
.time {
  font-size: 12px;
  color: #909399;
}

/* 操作按钮容器样式 */
.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>