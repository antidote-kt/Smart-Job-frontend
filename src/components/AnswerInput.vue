<!-- 
  面试答案输入组件
  用于面试过程中输入和提交用户回答，支持语音输入功能
-->
<template>
  <el-card class="answer-input-card" shadow="hover">
    <!-- 组件头部：标题和操作按钮 -->
    <template #header>
      <div class="answer-header">
        <!-- 标题区域 -->
        <div class="answer-title">
          <el-icon><EditPen /></el-icon>
          <span>我的回答</span>
        </div>
        <!-- 操作按钮区域 -->
        <div class="answer-actions">
          <!-- 语音输入按钮 -->
          <el-button
            v-if="enableVoiceInput"
            :type="isRecording ? 'danger' : 'primary'"
            :icon="isRecording ? 'VideoPause' : 'Microphone'"
            @click="toggleRecording"
            circle
          />
          <!-- 提交回答按钮 -->
          <el-button
            v-if="showSubmit"
            type="success"
            :loading="submitting"
            @click="handleSubmit"
          >
            提交回答
          </el-button>
        </div>
      </div>
    </template>

    <div class="answer-content">
      <!-- 文本输入区域 -->
      <el-input
        v-model="localAnswer"
        type="textarea"
        :rows="8"
        :placeholder="placeholder"
        :maxlength="maxLength"
        show-word-limit
        @input="handleInput"
      />

      <!-- 语音输入状态显示 -->
      <div v-if="enableVoiceInput" class="voice-status">
        <!-- 录音中状态 -->
        <div v-if="isRecording" class="recording-indicator">
          <el-icon class="recording-icon"><Microphone /></el-icon>
          <span>正在录音... {{ recordingTime }}s</span>
        </div>
        <!-- 语音转换中状态 -->
        <div v-else-if="transcribing" class="transcribing-indicator">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>正在转换语音...</span>
        </div>
      </div>

      <!-- 答案统计信息 -->
      <div v-if="wordCount > 0" class="answer-stats">
        <div class="stat-item">
          <span class="stat-label">字数：</span>
          <span class="stat-value">{{ wordCount }}</span>
        </div>
        <div v-if="estimatedTime > 0" class="stat-item">
          <span class="stat-label">预计阅读时间：</span>
          <span class="stat-value">{{ estimatedTime }}秒</span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { EditPen, Microphone, Loading } from '@element-plus/icons-vue'

/**
 * 组件属性接口定义
 */
interface Props {
  /** 双向绑定的答案内容 */
  modelValue: string
  /** 输入框占位符文本 */
  placeholder?: string
  /** 最大字符长度限制 */
  maxLength?: number
  /** 是否启用语音输入功能 */
  enableVoiceInput?: boolean
  /** 是否显示提交按钮 */
  showSubmit?: boolean
  /** 是否正在提交中（用于按钮加载状态） */
  submitting?: boolean
}

/**
 * 组件事件接口定义
 */
interface Emits {
  /** 更新双向绑定值的事件 */
  (e: 'update:modelValue', value: string): void
  /** 提交回答的事件 */
  (e: 'submit'): void
  /** 开始语音录制的事件 */
  (e: 'voice-start'): void
  /** 停止语音录制的事件 */
  (e: 'voice-stop'): void
}

// 定义组件属性，设置默认值
const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入您的回答...',
  maxLength: 2000,
  enableVoiceInput: false,
  showSubmit: true,
  submitting: false
})

// 定义组件事件发射器
const emit = defineEmits<Emits>()

// 响应式数据定义
/** 本地答案内容，用于双向绑定 */
const localAnswer = ref(props.modelValue)
/** 是否正在录音 */
const isRecording = ref(false)
/** 是否正在进行语音转文字 */
const transcribing = ref(false)
/** 录音时长（秒） */
const recordingTime = ref(0)
/** 录音计时器 */
const recordingTimer = ref<NodeJS.Timeout>()

/**
 * 计算属性：统计答案字数（不包括空格）
 */
const wordCount = computed(() => {
  return localAnswer.value.replace(/\s/g, '').length
})

/**
 * 计算属性：估算阅读时间
 * 按平均阅读速度 200 字/分钟计算
 */
const estimatedTime = computed(() => {
  return Math.ceil(wordCount.value / 200 * 60)
})

/**
 * 监听父组件传入的modelValue变化，同步到本地状态
 */
watch(() => props.modelValue, (newVal) => {
  localAnswer.value = newVal
})

/**
 * 处理输入事件，向父组件发射更新事件
 * @param value 输入的文本内容
 */
const handleInput = (value: string) => {
  emit('update:modelValue', value)
}

/**
 * 切换录音状态
 * 根据当前录音状态决定开始或停止录音
 */
const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

/**
 * 开始录音
 * 设置录音状态，启动计时器，发射开始录音事件
 */
const startRecording = () => {
  isRecording.value = true
  recordingTime.value = 0
  
  // 启动录音计时器，每秒更新一次录音时长
  recordingTimer.value = setInterval(() => {
    recordingTime.value++
  }, 1000)
  
  emit('voice-start')
}

/**
 * 停止录音
 * 清除计时器，设置转换状态，发射停止录音事件
 */
const stopRecording = () => {
  isRecording.value = false
  transcribing.value = true
  
  // 清除录音计时器
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
  }
  
  emit('voice-stop')
  
  // 模拟语音转文字的处理时间
  setTimeout(() => {
    transcribing.value = false
  }, 2000)
}

/**
 * 处理提交回答事件
 * 向父组件发射提交事件
 */
const handleSubmit = () => {
  emit('submit')
}
</script>

<style scoped>
.answer-input-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.answer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #67c23a;
  font-size: 16px;
}

.answer-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.answer-content {
  padding: 8px 0;
}

.voice-status {
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
}

.recording-indicator,
.transcribing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  font-weight: 500;
}

.recording-icon {
  color: #f56c6c;
  animation: pulse 1s infinite;
}

.loading-icon {
  animation: rotate 2s linear infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.answer-stats {
  display: flex;
  gap: 24px;
  margin-top: 12px;
  padding: 8px 0;
  border-top: 1px solid #f1f5f9;
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