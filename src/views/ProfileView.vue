<template>
  <!-- 个人资料管理页面 -->
  <div class="profile-view">
    <PageHeader title="个人设置" description="管理您的账户信息" />

    <el-row :gutter="20">
      <el-col :span="24">
        <!-- 个人信息表单卡片 -->
        <el-card class="profile-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><User /></el-icon>
              <span>个人信息</span>
            </div>
          </template>

          <el-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="120px"
            size="large"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="用户名" prop="username">
                  <el-input v-model="profileForm.username" disabled />
                </el-form-item>
              </el-col>
              
              <el-col :span="12">
                <el-form-item label="邮箱" prop="email">
                  <el-input
                    v-model="profileForm.email"
                    :disabled="!isEditing"
                    placeholder="邮箱地址"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="昵称" prop="nickname">
                  <el-input
                    v-model="profileForm.nickname"
                    :disabled="!isEditing"
                    placeholder="显示昵称"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item>
              <div class="form-actions">
                <el-button v-if="!isEditing" @click="startEdit">编辑信息</el-button>
                <template v-else>
                  <el-button @click="cancelEdit">取消</el-button>
                  <el-button type="primary" :loading="isSaving" @click="saveProfile">
                    保存更改
                  </el-button>
                </template>
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- Password Change -->
        <el-card class="password-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Lock /></el-icon>
              <span>修改密码</span>
            </div>
          </template>

          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="120px"
            size="large"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="当前密码" prop="currentPassword">
                  <el-input
                    v-model="passwordForm.currentPassword"
                    type="password"
                    placeholder="请输入当前密码"
                    show-password
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="新密码" prop="newPassword">
                  <el-input
                    v-model="passwordForm.newPassword"
                    type="password"
                    placeholder="请输入新密码"
                    show-password
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    show-password
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item>
              <el-button
                type="primary"
                :loading="isChangingPassword"
                @click="changePassword"
              >
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
// Vue 核心功能导入
import { ref, reactive, onMounted } from 'vue'
// Element Plus 组件和消息提示
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
// Element Plus 图标
import { User, Lock } from '@element-plus/icons-vue'
// 状态管理
import { useAuthStore } from '@/stores/modules/auth'

// 自定义组件导入
import PageHeader from '@/components/PageHeader.vue'

// ========== 状态管理实例 ==========
/** 身份验证状态管理 */
const authStore = useAuthStore()

// ========== 表单引用 ==========
/** 个人信息表单实例引用 */
const profileFormRef = ref<FormInstance>()
/** 密码修改表单实例引用 */
const passwordFormRef = ref<FormInstance>()

// ========== 响应式数据定义 ==========

// UI 状态控制
/** 是否处于编辑模式 */
const isEditing = ref(false)
/** 是否正在保存个人信息 */
const isSaving = ref(false)
/** 是否正在修改密码 */
const isChangingPassword = ref(false)

// 表单数据
/** 个人信息表单数据 */
const profileForm = reactive({
  /** 用户名（只读） */
  username: '',
  /** 邮箱地址 */
  email: '',
  /** 昵称 */
  nickname: ''
})

/** 原始表单数据（用于取消编辑时恢复） */
const originalForm = reactive({ ...profileForm })

/** 密码修改表单数据 */
const passwordForm = reactive({
  /** 当前密码 */
  currentPassword: '',
  /** 新密码 */
  newPassword: '',
  /** 确认新密码 */
  confirmPassword: ''
})

// ========== 表单验证规则 ==========

/** 个人信息表单验证规则 */
const profileRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  nickname: [
    { max: 50, message: '昵称长度不能超过 50 个字符', trigger: 'blur' }
  ]
}

/** 密码修改表单验证规则 */
const passwordRules: FormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度在 6 到 50 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
}

// ========== 生命周期钩子 ==========
onMounted(async () => {
  await loadUserData()
})

// ========== 数据加载方法 ==========

/**
 * 加载用户数据
 * 从状态管理中获取用户信息并填充到表单
 */
const loadUserData = async () => {
  try {
    if (authStore.user) {
      profileForm.username = authStore.user.username
      profileForm.email = authStore.user.email
      profileForm.nickname = authStore.user.nickname || ''
      
      // 保存原始数据用于取消编辑时恢复
      Object.assign(originalForm, profileForm)
    }
  } catch (error) {
    ElMessage.error('加载用户数据失败')
  }
}

// ========== 编辑操作方法 ==========

/**
 * 开始编辑个人信息
 * 进入编辑模式
 */
const startEdit = () => {
  isEditing.value = true
}

/**
 * 取消编辑操作
 * 恢复原始数据并退出编辑模式
 */
const cancelEdit = () => {
  Object.assign(profileForm, originalForm)
  isEditing.value = false
}

/**
 * 保存个人信息
 * 验证表单并调用API更新用户信息
 */
const saveProfile = async () => {
  if (!profileFormRef.value) return

  try {
    await profileFormRef.value.validate()
    isSaving.value = true

    // 调用状态管理中的更新方法
    await authStore.updateProfile({
      email: profileForm.email,
      nickname: profileForm.nickname
    })

    // 保存成功后更新原始数据并退出编辑模式
    Object.assign(originalForm, profileForm)
    isEditing.value = false
    ElMessage.success('个人信息保存成功')
  } catch (error) {
    ElMessage.error('保存个人信息失败')
  } finally {
    isSaving.value = false
  }
}

/**
 * 修改密码
 * 验证表单并调用API修改用户密码
 */
const changePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    isChangingPassword.value = true

    // 调用状态管理中的修改密码方法
    await authStore.changePassword(passwordForm.currentPassword, passwordForm.newPassword)

    // 修改成功后清空表单
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    
    ElMessage.success('密码修改成功')
  } catch (error) {
    ElMessage.error('密码修改失败')
  } finally {
    isChangingPassword.value = false
  }
}
</script>

<style scoped>
.profile-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.profile-card,
.password-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 12px;
}
</style>