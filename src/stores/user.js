/**
 * 用户状态管理
 * 管理用户登录状态、用户信息、权限等
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { accountLogin } from '@/api/login'
import { getUserInfo, setUserInfo, removeUserInfo, canLogin, hasFullDataPermission } from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  // 状态
  const userInfo = ref(getUserInfo() || null)

  // 计算属性
  const isLoggedIn = computed(() => !!userInfo.value)
  const userName = computed(() => userInfo.value?.name || '')
  const userRole = computed(() => userInfo.value?.role || '')
  const platformIds = computed(() => userInfo.value?.platform || [])
  const roomIds = computed(() => userInfo.value?.room || [])
  const equipmentIds = computed(() => userInfo.value?.eq || [])
  const bookingList = computed(() => userInfo.value?.bookingList || [])

  // 是否有全部数据权限
  const hasFullPermission = computed(() => {
    return userInfo.value ? hasFullDataPermission(userInfo.value.role) : false
  })

  /**
   * 登录方法
   * @param {String} username - 用户名
   * @param {String} password - 密码
   * @returns {Promise}
   */
  const login = async (username, password) => {
    try {
      const response = await accountLogin(username, password)

      // 检查用户角色是否允许登录
      if (!canLogin(response.data.role)) {
        throw new Error('您的角色无权限登录此系统')
      }

      // 保存用户信息到状态和本地存储
      userInfo.value = response.data
      setUserInfo(response.data)

      return response
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  /**
   * 退出登录
   */
  const logout = () => {
    userInfo.value = null
    removeUserInfo()
  }

  /**
   * 更新用户信息
   * @param {Object} info - 新的用户信息
   */
  const updateUserInfo = (info) => {
    userInfo.value = { ...userInfo.value, ...info }
    setUserInfo(userInfo.value)
  }

  return {
    // 状态
    userInfo,
    // 计算属性
    isLoggedIn,
    userName,
    userRole,
    platformIds,
    roomIds,
    equipmentIds,
    bookingList,
    hasFullPermission,
    // 方法
    login,
    logout,
    updateUserInfo
  }
})

