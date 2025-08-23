<template>
  <!-- 创建面试页面 - 用户选择岗位和设置参数来开始新的模拟面试 -->
  <div class="interview-create">
    <PageHeader title="创建新面试" description="选择目标岗位，开始您的模拟面试之旅" />

    <!-- 创建面试表单卡片 -->
    <el-card class="create-card" shadow="hover">
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="120px"
        size="large"
      >
        <el-form-item label="面试名称" prop="sessionName">
          <el-input
            v-model="createForm.sessionName"
            placeholder="为这次面试起个名字（可选）"
            clearable
          />
        </el-form-item>

        <el-form-item label="目标公司" prop="company">
          <el-input
            v-model="createForm.company"
            placeholder="请填写目标公司名称（可选）"
            clearable
          />
        </el-form-item>

        <el-form-item label="岗位类别" prop="category">
          <el-select
            v-model="createForm.category"
            placeholder="请选择岗位类别"
            @change="onCategoryChange"
            style="width: 100%"
          >
            <el-option
              v-for="category in categories"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="具体岗位" prop="jobRequirementId" v-if="createForm.category">
          <el-select
            v-model="createForm.jobRequirementId"
            placeholder="请选择具体岗位"
            @change="onPositionChange"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="position in filteredPositions"
              :key="position.id"
              :label="`${position.name} (${position.level})`"
              :value="position.id"
            >
              <div class="position-option">
                <span class="position-name">{{ position.name }}</span>
                <el-tag size="small" :type="getLevelType(position.level)">
                  {{ position.level }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 岗位信息预览 -->
        <div v-if="selectedPosition" class="position-preview">
          <el-card class="preview-card" shadow="never">
            <template #header>
              <div class="preview-header">
                <span>{{ selectedPosition.name }}</span>
                <el-tag :type="getLevelType(selectedPosition.level)" size="large">
                  {{ selectedPosition.level }}
                </el-tag>
              </div>
            </template>

            <div v-if="selectedPosition.description" class="position-description">
              <h4>岗位描述</h4>
              <p>{{ selectedPosition.description }}</p>
            </div>

            <div v-if="selectedPosition.skills?.length > 0" class="position-skills">
              <h4>技能要求</h4>
              <div class="skills-tags">
                <el-tag
                  v-for="skill in selectedPosition.skills"
                  :key="skill"
                  type="info"
                  effect="plain"
                >
                  {{ skill }}
                </el-tag>
              </div>
            </div>
          </el-card>
        </div>

        <el-form-item>
          <div class="action-buttons">
            <el-button @click="$router.back()">取消</el-button>
            <el-button
              type="primary"
              :loading="isCreating"
              @click="handleCreateInterview"
            >
              创建面试
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 快速开始选项 -->
    <el-card class="quick-start-card" shadow="hover" v-if="!createForm.category">
      <template #header>
        <h4>快速开始</h4>
      </template>
      
      <div class="quick-options">
        <div 
          v-for="option in quickOptions" 
          :key="option.category"
          class="quick-option"
          @click="selectQuickOption(option)"
        >
          <div class="option-icon">
            <el-icon size="32">
              <component :is="option.icon" />
            </el-icon>
          </div>
          <div class="option-content">
            <h4>{{ option.title }}</h4>
            <p>{{ option.description }}</p>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// Vue 核心功能导入
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// Element Plus 组件和消息提示
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
// Element Plus 图标
import { Monitor, Brush, TrendCharts, Promotion } from '@element-plus/icons-vue'
// 状态管理
import { useInterviewStore } from '@/stores/modules/interview'
// 类型定义
import type { JobPosition } from '@/api/interview'

// 自定义组件导入
import PageHeader from '@/components/PageHeader.vue'

// ========== 路由和状态管理实例 ==========
/** 路由实例 */
const router = useRouter()
/** 面试状态管理 */
const interviewStore = useInterviewStore()

// ========== 表单引用 ==========
/** 创建面试表单实例引用 */
const createFormRef = ref<FormInstance>()

// ========== 响应式数据定义 ==========

// UI 状态控制
/** 是否正在创建面试 */
const isCreating = ref(false)

// 表单数据
/** 创建面试的表单数据 */
const createForm = reactive({
  /** 面试会话名称 */
  sessionName: '',
  /** 面试公司名称 */
  company: '',
  /** 职位分类 */
  category: '',
  /** 选中的职位ID */
  jobRequirementId: null as number | null
})

// ========== 表单验证规则 ==========

/** 创建面试表单验证规则 */
const createRules: FormRules = {
  jobRequirementId: [
    { required: true, message: '请选择岗位', trigger: 'change' }
  ]
}

// ========== 计算属性 ==========

/** 所有可用的职位分类 */
const categories = computed(() => {
  const uniqueCategories = [...new Set(interviewStore.jobPositions.map(p => p.category))]
  return uniqueCategories
})

/** 根据选中分类过滤后的职位列表 */
const filteredPositions = computed(() => {
  if (!createForm.category) return []
  return interviewStore.jobPositions.filter(p => p.category === createForm.category)
})

/** 当前选中的职位详情 */
const selectedPosition = computed(() => {
  if (!createForm.jobRequirementId) return null
  return interviewStore.jobPositions.find(p => p.id === createForm.jobRequirementId) || null
})

// ========== 快速选项配置 ==========

/** 快速开始选项配置 */
const quickOptions = [
  {
    category: '技术开发',
    title: '技术开发岗位',
    description: '前端、后端、全栈开发等技术岗位面试',
    icon: Monitor
  },
  {
    category: '产品设计',
    title: '产品设计岗位',
    description: 'UI/UX设计师、产品经理等设计岗位面试',
    icon: Brush
  },
  {
    category: '数据分析',
    title: '数据分析岗位',
    description: '数据分析师、算法工程师等数据岗位面试',
    icon: TrendCharts
  },
  {
    category: '市场运营',
    title: '市场运营岗位',
    description: '市场营销、运营专员等运营岗位面试',
    icon: Promotion
  }
]

// ========== 生命周期钩子 ==========
onMounted(async () => {
  await loadJobPositions()
})

// ========== 数据加载方法 ==========

/**
 * 加载职位列表数据
 * 从服务器获取所有可用的职位信息
 */
const loadJobPositions = async () => {
  try {
    await interviewStore.loadJobPositions()
  } catch (error) {
    ElMessage.error('加载岗位信息失败')
  }
}

// ========== 表单交互方法 ==========

/**
 * 职位分类变更处理
 * 清空已选择的职位
 */
const onCategoryChange = () => {
  createForm.jobRequirementId = null
}

/**
 * 职位选择变更处理
 * 自动填充面试会话名称
 */
const onPositionChange = () => {
  if (!createForm.sessionName && selectedPosition.value) {
    createForm.sessionName = `${selectedPosition.value.name}面试 - ${new Date().toLocaleDateString()}`
  }
}

/**
 * 选择快速开始选项
 * 设置对应的职位分类
 * @param option 快速选项配置
 */
const selectQuickOption = (option: any) => {
  createForm.category = option.category
}

// ========== 工具方法 ==========

/**
 * 根据职位级别获取标签颜色类型
 * @param level 职位级别
 * @returns Element Plus 标签类型
 */
const getLevelType = (level: string) => {
  const typeMap: Record<string, string> = {
    '初级': 'success',
    '中级': 'warning',
    '高级': 'danger'
  }
  return typeMap[level] || 'info'
}

// ========== 核心业务方法 ==========

/**
 * 处理创建面试操作
 * 验证表单并创建新的面试会话
 */
const handleCreateInterview = async () => {
  if (!createFormRef.value) return

  try {
    await createFormRef.value.validate()
    isCreating.value = true

    // 调用状态管理中的创建会话方法
    const session = await interviewStore.createSession(
      createForm.jobRequirementId!,
      createForm.sessionName || undefined,
      createForm.company || undefined
    )

    ElMessage.success('面试创建成功！')
    // 跳转到面试房间页面
    router.push(`/interview/${session.id}`)
  } catch (error: any) {
    if (!error.response?.data?.message) {
      ElMessage.error('创建面试失败，请稍后重试')
    }
  } finally {
    isCreating.value = false
  }
}
</script>

<style scoped>
.interview-create {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.create-card {
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.position-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.position-name {
  flex: 1;
}

.position-preview {
  margin: 24px 0;
}

.preview-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #374151;
}

.position-description,
.position-skills {
  margin-bottom: 16px;
}

.position-description h4,
.position-skills h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
}

.position-description p {
  margin: 0;
  color: #374151;
  line-height: 1.6;
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.quick-start-card {
  margin-top: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.quick-start-card h4 {
  margin: 0;
  color: #374151;
  font-weight: 600;
}

.quick-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.quick-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-option:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
  transform: translateY(-2px);
}

.option-icon {
  color: #409eff;
  flex-shrink: 0;
}

.option-content h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-weight: 600;
}

.option-content p {
  margin: 0;
  color: #909399;
  font-size: 14px;
  line-height: 1.4;
}
</style>