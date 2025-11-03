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
export function accountLogin(username, password) {
  // 按照接口文档要求：对"用户名*密码"进行 Base64 编码
  const credentials = `${username}*${password}`
  const encodedCredentials = base64Encode(credentials)

  return request({
    url: '/operateDock/accountLogin',
    method: 'post',
    data: {
      t: encodedCredentials
    }
  })
}

