/**
 * 使用统计相关接口
 */
import request from '@/utils/request'

/**
 * 仪器使用统计
 * 接口：/operateDock/eqStatistics
 * 说明：服务端按园区 id 返回列表，平台筛选与关键字搜索在前端处理
 */
export function getEquipmentUsage(params = {}) {
  return request({
    url: '/operateDock/eqStatistics',
    method: 'post',
    data: params
  })
}

/**
 * 用户使用统计
 * 接口：/operateDock/userStatistics
 * 说明：获取用户使用统计信息，支持课题组关键字搜索和排序
 */
export function getUserStatistics(params = {}) {
  return request({
    url: '/operateDock/userStatistics',
    method: 'post',
    data: params
  })
}

/**
 * 课题组使用统计
 * 接口：/operateDock/piStatistics
 * 说明：获取课题组使用统计信息，支持课题组关键字搜索和排序
 */
export function getPiStatistics(params = {}) {
  return request({
    url: '/operateDock/piStatistics',
    method: 'post',
    data: params
  })
}

/**
 * 管理员业绩统计
 * 接口：/operateDock/mgrStatistics
 * 说明：获取管理员业绩统计信息，支持平台筛选和关键字搜索
 */
export function getManagerStatistics(params = {}) {
  return request({
    url: '/operateDock/mgrStatistics',
    method: 'post',
    data: params,
    timeout: 60000 // 单独设置60秒超时时间，适应40秒响应
  })
}

/**
 * 平台业绩统计
 * 接口：/operateDock/platformStatistics
 * 说明：获取平台业绩统计信息，支持平台筛选和时段查询
 */
export function getPlatformStatistics(params = {}) {
  return request({
    url: '/operateDock/platformStatistics',
    method: 'post',
    data: params,
    timeout: 60000 // 单独设置60秒超时时间，适应40秒响应
  })
}