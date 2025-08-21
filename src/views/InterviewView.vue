<template>
  <div class="interview-redirect">
    <el-card>
      <div class="redirect-content">
        <el-icon size="64"><Loading /></el-icon>
        <h3>正在跳转到面试页面...</h3>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // Redirect to interview create page
  router.replace('/interview/create')
})
</script>

<style scoped>
.interview-redirect {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}

.redirect-content {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.redirect-content h3 {
  margin: 16px 0 0 0;
  color: #606266;
}
</style>