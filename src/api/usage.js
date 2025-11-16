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

/**
 * 购置投入产出分析
 * 接口：/operateDock/buyStatistics
 * 说明：获取仪器购置投入产出分析数据，支持平台筛选和仪器关键字搜索
 */
export function getBuyStatistics(params = {}) {
  return request({
    url: '/operateDock/buyStatistics',
    method: 'post',
    data: params,
    timeout: 60000 // 单独设置60秒超时时间，适应40秒响应
  })
}

/**
 * 维保投入产出分析
 * 接口：/operateDock/repairStatistics
 * 说明：获取仪器维保投入产出分析数据，支持平台筛选和仪器关键字搜索
 */
export function getRepairStatistics(params = {}) {
  return request({
    url: '/operateDock/repairStatistics',
    method: 'post',
    data: params,
    timeout: 60000 // 单独设置60秒超时时间，适应40秒响应
  })
}

/**
 * 培训投入产出分析
 * 接口：/operateDock/trainStatistics
 * 说明：获取仪器培训投入产出分析数据，支持平台筛选和仪器关键字搜索
 */
export function getTrainStatistics(params = {}) {
  return request({
    url: '/operateDock/trainStatistics',
    method: 'post',
    data: params,
    timeout: 60000 // 单独设置60秒超时时间，适应40秒响应
  })
}

/**
 * 报警数据统计
 * 接口：/operateDock/alarmData
 * 说明：获取报警数据，支持按类型筛选和时段查询
 */
export function getAlarmData(params = {}) {
  return request({
    url: '/operateDock/alarmData',
    method: 'post',
    data: params,
    timeout: 60000 // 单独设置60秒超时时间，适应40秒响应
  })
}