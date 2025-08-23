<template>
  <!-- 用户登录页面 -->
  <div class="login-container">
    <!-- 登录表单卡片 -->
    <el-card class="login-card">
      <template #header>
        <!-- 卡片头部：应用名称和副标题 -->
        <div class="card-header">
          <h2>登录 JobSmart</h2>
          <p>智能求职助手</p>
        </div>
      </template>

      <!-- 登录表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-width="0"
        size="large"
      >
        <!-- 用户名/邮箱输入框 -->
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名或邮箱"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <!-- 登录按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="isLoading"
            @click="handleLogin"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>

        <!-- 页面底部：注册链接 -->
        <div class="login-footer">
          <span>还没有账户？</span>
          <router-link to="/register" class="link">立即注册</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// Vue 3 组合式 API 导入
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

// Element Plus 组件和类型导入
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

// 用户认证状态管理
import { useAuthStore } from '@/stores/modules/auth'

// 路由实例和状态管理
const router = useRouter()
const authStore = useAuthStore()

// 表单引用，用于访问表单实例进行验证
const loginFormRef = ref<FormInstance>()

// 登录加载状态
const isLoading = ref(false)

// 登录表单数据，使用 reactive 创建响应式对象
const loginForm = reactive({
  username: '',  // 用户名或邮箱
  password: ''   // 用户密码
})

// 表单验证规则配置
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度在 6 到 50 个字符', trigger: 'blur' }
  ]
}

/**
 * 处理用户登录逻辑
 * 1. 验证表单数据
 * 2. 调用认证接口
 * 3. 处理登录结果和错误
 * 4. 成功后跳转到仪表盘
 */
const handleLogin = async () => {
  // 检查表单引用是否存在
  if (!loginFormRef.value) return

  try {
    // 验证表单数据，如果验证失败会抛出异常
    await loginFormRef.value.validate()
    
    // 开始登录，显示加载状态
    isLoading.value = true

    // 调用认证store进行登录
    await authStore.login({
      username: loginForm.username,
      password: loginForm.password
    })

    // 登录成功提示
    ElMessage.success('登录成功！')
    
    // 跳转到主仪表盘页面
    router.push('/dashboard')
    
  } catch (error: any) {
    // 根据错误状态码显示不同的错误信息
    if (error.response?.status === 401) {
      // 401 表示用户名或密码错误
      ElMessage.error('用户名或密码错误')
    } else {
      // 其他错误（网络错误、服务器错误等）
      ElMessage.error('登录失败，请重试')
    }
  } finally {
    // 无论成功失败都要关闭加载状态
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  width: 400px;
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.card-header {
  text-align: center;
  margin-bottom: 20px;
}

.card-header h2 {
  color: #303133;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.card-header p {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #909399;
}

.link {
  color: #409eff;
  text-decoration: none;
  margin-left: 4px;
}

.link:hover {
  text-decoration: underline;
}

:deep(.el-card__body) {
  padding: 30px;
}
</style>