<template>
  <div class="profile-view">
    <PageHeader title="个人设置" description="管理您的账户信息" />

    <el-row :gutter="20">
      <el-col :span="24">
        <!-- Profile Info -->
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/modules/auth'

import PageHeader from '@/components/PageHeader.vue'

const authStore = useAuthStore()

const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

const isEditing = ref(false)
const isSaving = ref(false)
const isChangingPassword = ref(false)

const profileForm = reactive({
  username: '',
  email: '',
  nickname: ''
})

const originalForm = reactive({ ...profileForm })

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const profileRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  nickname: [
    { max: 50, message: '昵称长度不能超过 50 个字符', trigger: 'blur' }
  ]
}

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

onMounted(async () => {
  await loadUserData()
})

const loadUserData = async () => {
  try {
    if (authStore.user) {
      profileForm.username = authStore.user.username
      profileForm.email = authStore.user.email
      profileForm.nickname = authStore.user.nickname || ''
      
      Object.assign(originalForm, profileForm)
    }
  } catch (error) {
    ElMessage.error('加载用户数据失败')
  }
}

const startEdit = () => {
  isEditing.value = true
}

const cancelEdit = () => {
  Object.assign(profileForm, originalForm)
  isEditing.value = false
}

const saveProfile = async () => {
  if (!profileFormRef.value) return

  try {
    await profileFormRef.value.validate()
    isSaving.value = true

    await authStore.updateProfile({
      email: profileForm.email,
      nickname: profileForm.nickname
    })

    Object.assign(originalForm, profileForm)
    isEditing.value = false
    ElMessage.success('个人信息保存成功')
  } catch (error) {
    ElMessage.error('保存个人信息失败')
  } finally {
    isSaving.value = false
  }
}

const changePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    isChangingPassword.value = true

    await authStore.changePassword(passwordForm.currentPassword, passwordForm.newPassword)

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