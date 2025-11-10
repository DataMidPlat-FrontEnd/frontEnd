/**
 * 登录相关接口
 */
import request from '@/utils/request'
import { base64Encode } from '@/utils/auth'

/**
 * 账号密码登录
 * @param {String} username - 用户名
 * @param {String} password - 密码
 * @returns {Promise} 返回登录结果
 */
/**
 * 账号密码登录（application/json）
 * 参数：t = Base64(用户名*密码)
 */
export function accountLogin(username, password) {
  const credentials = `${username}*${password}`
  const encodedCredentials = base64Encode(credentials)

  return request({
    url: '/operateDock/accountLogin',
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    data: {
      t: encodedCredentials
    }
  })
}

