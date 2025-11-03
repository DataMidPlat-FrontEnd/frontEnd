/**
 * 权限控制工具
 * 处理用户信息的存储和获取
 */

const TOKEN_KEY = 'user_token'
const USER_INFO_KEY = 'user_info'

/**
 * 获取用户信息
 * @returns {Object|null} 用户信息对象
 */
export function getUserInfo() {
  const userInfoStr = localStorage.getItem(USER_INFO_KEY)
  if (userInfoStr) {
    try {
      return JSON.parse(userInfoStr)
    } catch (e) {
      console.error('解析用户信息失败:', e)
      return null
    }
  }
  return null
}

/**
 * 设置用户信息
 * @param {Object} userInfo - 用户信息对象
 */
export function setUserInfo(userInfo) {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
}

/**
 * 移除用户信息
 */
export function removeUserInfo() {
  localStorage.removeItem(USER_INFO_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * 检查用户是否有全部数据权限
 * 超级管理员、科研平台总体管理员、行政管理部门可以查看所有数据
 * @param {String} role - 用户角色
 * @returns {Boolean}
 */
export function hasFullDataPermission(role) {
  const fullPermissionRoles = ['超级管理员', '科研平台总体管理员', '行政管理部门']
  return fullPermissionRoles.includes(role)
}

/**
 * 检查用户是否可以登录系统
 * @param {String} role - 用户角色
 * @returns {Boolean}
 */
export function canLogin(role) {
  const allowedRoles = [
    '超级管理员',
    '科研平台总体管理员',
    '平台主管',
    '技术管理员',
    '平台负责人',
    '平台助理',
    '行政管理部门'
  ]
  return allowedRoles.includes(role)
}

/**
 * Base64 编码
 * @param {String} str - 要编码的字符串
 * @returns {String} Base64 编码后的字符串
 */
export function base64Encode(str) {
  return btoa(unescape(encodeURIComponent(str)))
}

/**
 * Base64 解码
 * @param {String} str - Base64 编码的字符串
 * @returns {String} 解码后的字符串
 */
export function base64Decode(str) {
  return decodeURIComponent(escape(atob(str)))
}

