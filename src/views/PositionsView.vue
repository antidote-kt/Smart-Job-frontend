<template>
  <div class="positions-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-actions">
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">
            新增岗位
          </el-button>
        </div>
      </div>
    </div>

    <!-- 搜索和过滤 -->
    <el-card class="filter-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.name"
            placeholder="搜索岗位名称..."
            clearable
            :prefix-icon="Search"
            @input="handleSearch"
          />
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="searchForm.category"
            placeholder="选择分类"
            clearable
            @change="handleSearch"
          >
            <el-option
              v-for="category in categories"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="searchForm.level"
            placeholder="选择级别"
            clearable
            @change="handleSearch"
          >
            <el-option label="初级" value="初级" />
            <el-option label="中级" value="中级" />
            <el-option label="高级" value="高级" />
            <el-option label="专家" value="专家" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button @click="resetSearch">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 岗位列表 -->
    <el-card class="positions-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <el-icon><List /></el-icon>
            岗位列表
          </span>
          <el-tag type="info" size="small">共 {{ filteredPositions.length }} 个岗位</el-tag>
        </div>
      </template>

      <div v-loading="loading" class="positions-grid">
        <div
          v-for="position in paginatedPositions"
          :key="position.id"
          class="position-card"
        >
          <div class="position-header">
            <div class="position-info">
              <h3 class="position-name">{{ position.name }}</h3>
              <div class="position-meta">
                <el-tag :type="getCategoryType(position.category)" size="small">
                  {{ position.category }}
                </el-tag>
                <el-tag :type="getLevelType(position.level)" size="small">
                  {{ position.level }}
                </el-tag>
              </div>
            </div>
            <div class="position-actions">
              <el-dropdown trigger="click">
                <el-button text :icon="MoreFilled" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="viewPosition(position)">
                      <el-icon><View /></el-icon>查看详情
                    </el-dropdown-item>
                    <el-dropdown-item @click="editPosition(position)">
                      <el-icon><Edit /></el-icon>编辑
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="deletePosition(position)" style="color: #ef4444;">
                      <el-icon style="color: #ef4444;"><Close /></el-icon>删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <div class="position-content">
            <p class="position-description">{{ position.description || '暂无描述' }}</p>
            
            <div v-if="position.requirements?.length" class="position-requirements">
              <div class="section-title">职位要求</div>
              <ul>
                <li v-for="req in position.requirements.slice(0, 3)" :key="req">{{ req }}</li>
                <li v-if="position.requirements.length > 3">
                  <span class="more-text">+{{ position.requirements.length - 3 }} 项要求</span>
                </li>
              </ul>
            </div>

            <div v-if="position.skills?.length" class="position-skills">
              <div class="section-title">技能要求</div>
              <div class="skills-tags">
                <el-tag
                  v-for="skill in position.skills.slice(0, 4)"
                  :key="skill"
                  size="small"
                  effect="plain"
                >
                  {{ skill }}
                </el-tag>
                <el-tag v-if="position.skills.length > 4" size="small" type="info">
                  +{{ position.skills.length - 4 }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredPositions.length"
          :page-sizes="[12, 24, 48]"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑岗位' : '新增岗位'"
      width="800px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="positionForm"
        :rules="formRules"
        label-width="100px"
        size="large"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="岗位名称" prop="name">
              <el-input v-model="positionForm.name" placeholder="请输入岗位名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位分类" prop="category">
              <el-input v-model="positionForm.category" placeholder="请输入分类" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="岗位级别" prop="level">
              <el-select v-model="positionForm.level" placeholder="请选择级别" style="width: 100%">
                <el-option label="初级" value="初级" />
                <el-option label="中级" value="中级" />
                <el-option label="高级" value="高级" />
                <el-option label="专家" value="专家" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="岗位描述" prop="description">
          <el-input
            v-model="positionForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入岗位描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="职位要求" prop="requirements">
          <div class="dynamic-list">
            <div v-for="(requirement, index) in positionForm.requirements" :key="index" class="list-item">
              <el-input
                v-model="positionForm.requirements[index]"
                placeholder="请输入职位要求"
              />
              <el-button
                :icon="Close"
                @click="removeRequirement(index)"
                text
                class="remove-btn"
              />
            </div>
            <el-button :icon="Plus" @click="addRequirement" text>
              添加要求
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="技能要求" prop="skills">
          <div class="dynamic-list">
            <div v-for="(skill, index) in positionForm.skills" :key="index" class="list-item">
              <el-input
                v-model="positionForm.skills[index]"
                placeholder="请输入技能要求"
              />
              <el-button
                :icon="Close"
                @click="removeSkill(index)"
                text
                class="remove-btn"
              />
            </div>
            <el-button :icon="Plus" @click="addSkill" text>
              添加技能
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitForm">
            {{ isEditing ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="岗位详情" width="600px">
      <div v-if="selectedPosition" class="position-detail">
        <div class="detail-section">
          <h3>{{ selectedPosition.name }}</h3>
          <div class="detail-meta">
            <el-tag :type="getCategoryType(selectedPosition.category)">
              {{ selectedPosition.category }}
            </el-tag>
            <el-tag :type="getLevelType(selectedPosition.level)">
              {{ selectedPosition.level }}
            </el-tag>
          </div>
        </div>

        <div v-if="selectedPosition.description" class="detail-section">
          <h4>岗位描述</h4>
          <p>{{ selectedPosition.description }}</p>
        </div>

        <div v-if="selectedPosition.requirements?.length" class="detail-section">
          <h4>职位要求</h4>
          <ul>
            <li v-for="req in selectedPosition.requirements" :key="req">{{ req }}</li>
          </ul>
        </div>

        <div v-if="selectedPosition.skills?.length" class="detail-section">
          <h4>技能要求</h4>
          <div class="skills-tags">
            <el-tag
              v-for="skill in selectedPosition.skills"
              :key="skill"
              size="small"
              effect="plain"
            >
              {{ skill }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Plus, Search, List, MoreFilled, View, Edit, Delete, Close
} from '@element-plus/icons-vue'
import {
  getPositionsApi,
  createPositionApi,
  updatePositionApi,
  deletePositionApi,
  type JobPosition,
  type JobPositionCreateDTO,
  type JobPositionUpdateDTO
} from '@/api/interview'

// 响应式数据
const positions = ref<JobPosition[]>([])
const categories = ref<string[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const selectedPosition = ref<JobPosition | null>(null)

// 分页
const currentPage = ref(1)
const pageSize = ref(12)

// 搜索表单
const searchForm = reactive({
  name: '',
  category: '',
  level: ''
})

// 岗位表单
const positionForm = reactive<JobPositionCreateDTO>({
  name: '',
  category: '',
  level: '',
  description: '',
  requirements: [''],
  skills: ['']
})

const formRef = ref<FormInstance>()

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入岗位名称', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请输入岗位分类', trigger: 'blur' }
  ],
  level: [
    { required: true, message: '请选择岗位级别', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入岗位描述', trigger: 'blur' }
  ]
}

// 计算属性
const filteredPositions = computed(() => {
  return positions.value.filter(position => {
    const matchName = !searchForm.name || position.name.toLowerCase().includes(searchForm.name.toLowerCase())
    const matchCategory = !searchForm.category || position.category === searchForm.category
    const matchLevel = !searchForm.level || position.level === searchForm.level
    return matchName && matchCategory && matchLevel
  })
})

const paginatedPositions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredPositions.value.slice(start, end)
})

// 方法
const loadPositions = async () => {
  try {
    loading.value = true
    positions.value = await getPositionsApi()
    
    // 提取分类
    const uniqueCategories = [...new Set(positions.value.map(p => p.category))]
    categories.value = uniqueCategories
  } catch (error) {
    console.error('Failed to load positions:', error)
    ElMessage.error('加载岗位列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const resetSearch = () => {
  searchForm.name = ''
  searchForm.category = ''
  searchForm.level = ''
  currentPage.value = 1
}

const openCreateDialog = () => {
  isEditing.value = false
  resetForm()
  dialogVisible.value = true
}

const resetForm = () => {
  Object.assign(positionForm, {
    name: '',
    category: '',
    level: '',
    description: '',
    requirements: [''],
    skills: ['']
  })
  formRef.value?.clearValidate()
}

const addRequirement = () => {
  positionForm.requirements.push('')
}

const removeRequirement = (index: number) => {
  if (positionForm.requirements.length > 1) {
    positionForm.requirements.splice(index, 1)
  }
}

const addSkill = () => {
  positionForm.skills.push('')
}

const removeSkill = (index: number) => {
  if (positionForm.skills.length > 1) {
    positionForm.skills.splice(index, 1)
  }
}

const viewPosition = (position: JobPosition) => {
  selectedPosition.value = position
  detailVisible.value = true
}

const editPosition = (position: JobPosition) => {
  isEditing.value = true
  Object.assign(positionForm, {
    ...position,
    requirements: position.requirements?.length ? [...position.requirements] : [''],
    skills: position.skills?.length ? [...position.skills] : ['']
  })
  selectedPosition.value = position
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    // 过滤空值
    const formData = {
      ...positionForm,
      requirements: positionForm.requirements.filter(req => req.trim()),
      skills: positionForm.skills.filter(skill => skill.trim())
    }

    if (isEditing.value && selectedPosition.value) {
      await updatePositionApi(selectedPosition.value.id, formData as JobPositionUpdateDTO)
      ElMessage.success('岗位更新成功')
    } else {
      await createPositionApi(formData)
      ElMessage.success('岗位创建成功')
    }

    dialogVisible.value = false
    await loadPositions()
  } catch (error) {
    console.error('Submit failed:', error)
    ElMessage.error(isEditing.value ? '更新岗位失败' : '创建岗位失败')
  } finally {
    submitting.value = false
  }
}

const deletePosition = async (position: JobPosition) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除岗位"${position.name}"吗？此操作不可撤销。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deletePositionApi(position.id)
    ElMessage.success('岗位删除成功')
    await loadPositions()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
      ElMessage.error('删除岗位失败')
    }
  }
}

const getCategoryType = (category: string) => {
  const types = ['primary', 'success', 'warning', 'danger', 'info']
  const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return types[hash % types.length]
}

const getLevelType = (level: string) => {
  const typeMap: Record<string, string> = {
    '初级': 'success',
    '中级': 'primary',
    '高级': 'warning',
    '专家': 'danger'
  }
  return typeMap[level] || 'info'
}

// 生命周期
onMounted(() => {
  loadPositions()
})
</script>

<style scoped>
.positions-view {
  max-width: 100%;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 过滤卡片 */
.filter-card {
  margin-bottom: 24px;
}

/* 岗位卡片 */
.positions-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
}

/* 岗位网格 */
.positions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.position-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
  background: #ffffff;
}

.position-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.position-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.position-info {
  flex: 1;
}

.position-name {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.position-meta {
  display: flex;
  gap: 8px;
}

.position-actions {
  margin-left: 12px;
}

.position-content {
  color: #64748b;
}

.position-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.position-requirements,
.position-skills {
  margin-bottom: 16px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.position-requirements ul {
  margin: 0;
  padding-left: 16px;
  font-size: 13px;
}

.position-requirements li {
  margin-bottom: 4px;
}

.more-text {
  color: #9ca3af;
  font-style: italic;
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 表单相关 */
.dynamic-list {
  width: 100%;
}

.list-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  align-items: center;
}

.list-item .el-input {
  flex: 1;
}

.remove-btn {
  color: #ef4444;
  padding: 8px;
  min-width: 32px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background-color: #fef2f2;
  color: #dc2626;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 详情页面 */
.position-detail {
  padding: 8px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.detail-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.detail-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-section ul {
  margin: 0;
  padding-left: 16px;
  color: #64748b;
}

.detail-section li {
  margin-bottom: 6px;
}

/* 响应式 */
@media (max-width: 768px) {
  .positions-grid {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .page-title {
    font-size: 24px;
  }
}
</style>