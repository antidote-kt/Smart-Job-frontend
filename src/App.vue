<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'
import { User, Odometer, Plus, Clock, Setting } from '@element-plus/icons-vue'

// 获取当前路由信息和用户认证状态管理
const route = useRoute()
const authStore = useAuthStore()

// 定义不需要显示侧栏的页面路径（登录、注册页面）
const noSidebarRoutes = ['/login', '/register']

// 计算属性：决定是否显示侧边栏
// 条件：用户已登录 && 不在无侧栏页面列表中
const showSidebar = computed(() => {
  return authStore.isAuthenticated && 
         !noSidebarRoutes.includes(route.path)
})

// 组件挂载时执行：从本地存储加载用户认证信息
onMounted(() => {
  authStore.loadUserFromStorage()
})
</script>

<template>
  <div id="app">
    <!-- 带侧栏的布局 -->
    <el-container v-if="authStore.isAuthenticated && showSidebar">
      <!-- Header -->
      <el-header class="modern-header">
        <div class="header-content">
          <div class="header-left">
            <div class="logo">
              <div class="logo-icon">🎯</div>
              <span class="logo-text">JobSmart</span>
            </div>
          </div>
          <div class="header-right">
            <div class="user-info">
              <el-avatar :size="32" style="margin-right: 8px">
                {{ authStore.user?.username?.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username">{{ authStore.user?.nickname || authStore.user?.username }}</span>
            </div>
            <el-dropdown trigger="click">
              <el-button text class="dropdown-btn">
                <el-icon><User /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="$router.push('/profile')">
                    <el-icon><User /></el-icon>个人设置
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="authStore.logout">
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      
      <el-container>
        <!-- Sidebar -->
        <el-aside width="260px" class="modern-sidebar">
          <el-menu
            :default-active="$route.path"
            router
            class="modern-menu"
            background-color="transparent"
            text-color="#64748b"
            active-text-color="#3b82f6"
          >
            <div class="menu-section">
              <div class="menu-section-title">工作区</div>
              <el-menu-item index="/dashboard" class="menu-item">
                <template #title>
                  <div class="menu-item-content">
                    <el-icon class="menu-icon"><Odometer /></el-icon>
                    <span class="menu-text">仪表盘</span>
                  </div>
                </template>
              </el-menu-item>
              <el-menu-item index="/interview/create" class="menu-item">
                <template #title>
                  <div class="menu-item-content">
                    <el-icon class="menu-icon"><Plus /></el-icon>
                    <span class="menu-text">新建面试</span>
                  </div>
                </template>
              </el-menu-item>
              <el-menu-item index="/history" class="menu-item">
                <template #title>
                  <div class="menu-item-content">
                    <el-icon class="menu-icon"><Clock /></el-icon>
                    <span class="menu-text">面试历史</span>
                  </div>
                </template>
              </el-menu-item>
            </div>
            
            <div class="menu-section">
              <div class="menu-section-title">管理</div>
              <el-menu-item index="/positions" class="menu-item">
                <template #title>
                  <div class="menu-item-content">
                    <el-icon class="menu-icon"><Setting /></el-icon>
                    <span class="menu-text">岗位管理</span>
                  </div>
                </template>
              </el-menu-item>
              <el-menu-item index="/profile" class="menu-item">
                <template #title>
                  <div class="menu-item-content">
                    <el-icon class="menu-icon"><User /></el-icon>
                    <span class="menu-text">个人设置</span>
                  </div>
                </template>
              </el-menu-item>
            </div>
          </el-menu>
        </el-aside>
        
        <!-- Main Content -->
        <el-main class="modern-main">
          <div class="main-container">
            <RouterView />
          </div>
        </el-main>
      </el-container>
    </el-container>
    
    <!-- 未登录时显示登录页面 -->
    <div v-else>
      <RouterView />
    </div>
  </div>
</template>

<style>
/* 现代化全局样式 */
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f8fafc;
  font-size: 14px;
  line-height: 1.5;
}

#app {
  min-height: 100vh;
  color: #1e293b;
}

/* 现代化顶栏 */
.modern-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
  line-height: 60px;
  padding: 0 24px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 101;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409eff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.user-info {
  display: flex;
  align-items: center;
}

.username {
  color: #475569;
  font-weight: 500;
  margin-right: 8px;
}

.dropdown-btn {
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  height: 36px;
  width: 36px;
}

.dropdown-btn:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
}

/* 现代化侧栏 */
.modern-sidebar {
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  position: fixed;
  top: 60px;
  left: 0;
  z-index: 100;
  min-height: calc(100vh - 60px);
  box-shadow: 1px 0 3px rgba(0, 0, 0, 0.1);
}

.modern-menu {
  border-right: none;
  height: 100%;
  padding: 24px 0;
}

.menu-section {
  margin-bottom: 32px;
}

.menu-section-title {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 20px 12px;
  padding-left: 12px;
}

.menu-item {
  margin: 4px 16px;
  border-radius: 12px;
  transition: all 0.2s ease;
  height: 44px;
  line-height: 44px;
}

.menu-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  width: 20px;
  height: 20px;
  font-size: 18px;
}

.menu-text {
  font-weight: 500;
}

.menu-item:hover {
  background: #f1f5f9;
}

.menu-item.is-active {
  background: #eff6ff;
  color: #3b82f6 !important;
  border-left: 3px solid #3b82f6;
}

/* 现代化主内容区 */
.modern-main {
  margin-left: 260px;
  margin-top: 60px;
  padding: 0;
  background: #f8fafc;
  min-height: calc(100vh - 60px);
}

.main-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 现代化卡片样式 */
.el-card {
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  overflow: hidden;
}

.el-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #cbd5e1;
}

.el-card__header {
  background: rgba(248, 250, 252, 0.5);
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 24px;
}

.el-card__body {
  padding: 24px;
}

/* 现代化按钮 */
.el-button {
  border-radius: 10px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
}

.el-button--primary {
  background: #409eff;
  border: 1px solid #409eff;
}

.el-button--primary:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.el-button--success {
  background: #67c23a;
  border: 1px solid #67c23a;
}

.el-button--warning {
  background: #e6a23c;
  border: 1px solid #e6a23c;
}

.el-button--danger {
  background: #f56c6c;
  border: 1px solid #f56c6c;
}

/* 现代化输入框 */
.el-input__wrapper {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  box-shadow: none;
}

.el-input__wrapper:hover {
  border-color: #cbd5e1;
}

.el-input__wrapper.is-focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 现代化进度条 */
.el-progress-bar__outer {
  border-radius: 10px;
  overflow: hidden;
  background: #e2e8f0;
}

.el-progress-bar__inner {
  border-radius: 10px;
  background: #409eff;
}

/* 现代化标签 */
.el-tag {
  border-radius: 8px;
  font-weight: 500;
  font-size: 12px;
  border: none;
  padding: 4px 12px;
}

.el-tag--primary {
  background: #eff6ff;
  color: #3b82f6;
}

.el-tag--success {
  background: #f0fdf4;
  color: #16a34a;
}

.el-tag--warning {
  background: #fffbeb;
  color: #d97706;
}

.el-tag--danger {
  background: #fef2f2;
  color: #dc2626;
}

.el-tag--info {
  background: #f1f5f9;
  color: #64748b;
}

/* 现代化表格 */
.el-table {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.el-table th.el-table__cell {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}

.el-table tr:hover > td {
  background: #f8fafc;
}

.el-table td.el-table__cell {
  border-bottom: 1px solid #f1f5f9;
}

/* 现代化滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 现代化消息框 */
.el-message-box {
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modern-sidebar {
    width: 200px;
  }
  
  .modern-main {
    margin-left: 200px;
  }
  
  .header-left .logo-text {
    display: none;
  }
  
  .main-container {
    padding: 16px;
  }
}

@media (max-width: 640px) {
  .modern-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .modern-main {
    margin-left: 0;
  }
  
  .user-info .username {
    display: none;
  }
}

/* 动画效果 */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active {
  animation: fadeInUp 0.3s ease-out;
}

.slide-enter-active {
  animation: slideInRight 0.3s ease-out;
}

/* 工具类 */
.text-gradient {
  color: #3b82f6;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.shadow-elegant {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.shadow-luxury {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>