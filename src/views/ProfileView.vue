<template>
  <div class="profile-view">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-title">
            <h2>个人设置</h2>
            <p>管理您的账户信息</p>
          </div>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
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
                  <el-input
                    v-model="profileForm.username"
                    disabled
                    placeholder="用户名"
                  />
                </el-form-item>
              </el-col>
              
              <el-col :span="12">
                <el-form-item label="邮箱" prop="email">
                  <el-input
                    v-model="profileForm.email"
                    :disabled="!isEditingProfile"
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
                    :disabled="!isEditingProfile"
                    placeholder="显示昵称"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item>
              <div class="form-actions">
                <el-button v-if="!isEditingProfile" @click="isEditingProfile = true">
                  编辑信息
                </el-button>
                <template v-else>
                  <el-button @click="cancelEditProfile">取消</el-button>
                  <el-button
                    type="primary"
                    :loading="isSavingProfile"
                    @click="saveProfile"
                  >
                    保存更改
                  </el-button>
                </template>
              </div>
            </el-form-item>
          </el-form>
        </el-card>

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
                :loading="isSavingPassword"
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
import { ArrowLeft } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/modules/auth'
import { useInterviewStore } from '@/stores/modules/interview'

const authStore = useAuthStore()
const interviewStore = useInterviewStore()

const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

const isEditingProfile = ref(false)
const isSavingProfile = ref(false)
const isSavingPassword = ref(false)

const profileForm = reactive({
  username: '',
  email: '',
  nickname: ''
})

const originalProfileForm = reactive({ ...profileForm })

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const userStats = reactive({
  totalInterviews: 0,
  completedInterviews: 0,
  averageScore: 0,
  streak: 0,
  monthlyProgress: 0
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

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
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
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

onMounted(async () => {
  await loadUserData()
  await loadUserStats()
})

const loadUserData = async () => {
  try {
    if (authStore.user) {
      profileForm.username = authStore.user.username
      profileForm.email = authStore.user.email
      profileForm.nickname = authStore.user.nickname || ''
      
      Object.assign(originalProfileForm, profileForm)
    }
  } catch (error) {
    ElMessage.error('加载用户数据失败')
  }
}

const loadUserStats = async () => {
  try {
    await interviewStore.loadSessions()
    const sessions = interviewStore.sessions
    
    userStats.totalInterviews = sessions.length
    userStats.completedInterviews = sessions.filter(s => s.status === 'COMPLETED').length
    
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED' && s.overallScore > 0)
    if (completedSessions.length > 0) {
      userStats.averageScore = completedSessions.reduce((sum, s) => sum + s.overallScore, 0) / completedSessions.length
    }
    
    userStats.streak = calculateStreak(sessions)
    userStats.monthlyProgress = calculateMonthlyProgress(sessions)
  } catch (error) {
    console.error('Failed to load user stats:', error)
  }
}

const calculateStreak = (sessions: any[]) => {
  const today = new Date()
  const recentSessions = sessions.filter(s => {
    const sessionDate = new Date(s.createdAt)
    const diffDays = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && s.status === 'COMPLETED'
  })
  return recentSessions.length
}

const calculateMonthlyProgress = (sessions: any[]) => {
  const thisMonth = new Date().getMonth()
  const thisYear = new Date().getFullYear()
  const monthSessions = sessions.filter(s => {
    const sessionDate = new Date(s.createdAt)
    return sessionDate.getMonth() === thisMonth && sessionDate.getFullYear() === thisYear
  })
  return Math.min((monthSessions.length / 10) * 100, 100)
}

const getUserLevel = () => {
  if (userStats.totalInterviews >= 50) return '面试专家'
  if (userStats.totalInterviews >= 20) return '面试高手'
  if (userStats.totalInterviews >= 10) return '面试达人'
  if (userStats.totalInterviews >= 5) return '面试新手'
  return '' // 不显示任何标签
}

const saveProfile = async () => {
  if (!profileFormRef.value) return

  try {
    await profileFormRef.value.validate()
    isSavingProfile.value = true

    await authStore.updateProfile({
      email: profileForm.email,
      nickname: profileForm.nickname
    })

    Object.assign(originalProfileForm, profileForm)
    isEditingProfile.value = false
    ElMessage.success('个人信息保存成功')
  } catch (error) {
    ElMessage.error('保存个人信息失败')
  } finally {
    isSavingProfile.value = false
  }
}

const cancelEditProfile = () => {
  Object.assign(profileForm, originalProfileForm)
  isEditingProfile.value = false
}

const changePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    isSavingPassword.value = true

    await authStore.changePassword(passwordForm.currentPassword, passwordForm.newPassword)

    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    
    ElMessage.success('密码修改成功')
  } catch (error) {
    ElMessage.error('密码修改失败')
  } finally {
    isSavingPassword.value = false
  }
}
</script>

<style scoped>
.profile-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

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

.header-title h2 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-weight: 700;
  font-size: 28px;
}

.header-title p {
  margin: 0;
  color: #64748b;
  font-size: 16px;
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

.field-help {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.user-info-card {
  margin-bottom: 20px;
}

.user-section {
  text-align: left;
  padding: 8px 0;
}

.user-info {
  margin-top: 0;
}

.user-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-weight: 600;
}

.user-info p {
  margin: 0 0 8px 0;
  color: #909399;
  font-size: 14px;
}

.stats-card {
  margin-bottom: 20px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-icon.total {
  background: #409eff;
}

.stat-icon.completed {
  background: #67c23a;
}

.stat-icon.score {
  background: #e6a23c;
}

.stat-icon.streak {
  background: #f56c6c;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 2px;
}

.progress-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.progress-item {
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

</style>