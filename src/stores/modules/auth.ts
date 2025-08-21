import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  loginApi, 
  registerApi, 
  logoutApi, 
  getProfileApi, 
  updateProfileApi, 
  changePasswordApi,
  type User, 
  type LoginRequest, 
  type RegisterRequest 
} from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isAuthenticated = ref<boolean>(!!token.value)

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await loginApi(credentials)
      token.value = response.token
      isAuthenticated.value = true
      
      localStorage.setItem('token', response.token)
      
      // 获取用户信息
      try {
        const userInfo = await getProfileApi()
        user.value = userInfo
        localStorage.setItem('user', JSON.stringify(userInfo))
      } catch (error) {
        console.error('Failed to load user profile:', error)
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      await registerApi(userData)
      return { success: true }
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      token.value = null
      user.value = null
      isAuthenticated.value = false
      
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  const loadUserFromStorage = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
      isAuthenticated.value = true
    }
  }

  const updateProfile = async (userData: Partial<User>) => {
    try {
      await updateProfileApi(userData)
      // 重新获取用户信息
      if (isAuthenticated.value) {
        const updatedUser = await getProfileApi()
        user.value = updatedUser
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
    } catch (error) {
      throw error
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await changePasswordApi(currentPassword, newPassword)
    } catch (error) {
      throw error
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    loadUserFromStorage,
    updateProfile,
    changePassword
  }
})