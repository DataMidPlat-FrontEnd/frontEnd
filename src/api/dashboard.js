/**
 * 运营首页相关接口
 */
// 方法：getAlarmData
import request from '@/utils/request'

/**
 * 获取园区关键指标与统计数据（POST，接口字段对齐）
 * @param {Object} params - { id, type, beginDate, endDate, ...filters }
 *  - id: 园区ID（默认取环境变量 VITE_PARK_ID）
 *  - type: 0实时/1按时段（默认 0）
 *  - beginDate/endDate: type=1 时可选；传了则带上
 *  - 其他过滤参数：platform/room/eq（非超级管理员）
 */
export function getParkData(params = {}) {
  const {
    id = import.meta.env.VITE_PARK_ID,
    type = 0,
    beginDate,
    endDate,
    ...rest
  } = params

  const data = { id, type, ...rest }
  if (type === 1 && beginDate && endDate) {
    data.beginDate = beginDate
    data.endDate = endDate
  }

  return request({
    url: '/operateDock/parkData',
    method: 'post',
    data
  })
}

/**
 * 获取报警数据（POST, UTF-8 JSON）
 * @param {Object} params
 *  - type: 0实时 / 1按时段（必填）
 *  - beginDate/endDate: 当 type=1 时必填，格式 yyyy-MM-dd
 *  - 其余过滤：platform/room/eq（非全权限用户）
 */
export function getAlarmData(params = {}) {
  const { type, beginDate, endDate, ...rest } = params

  // 基本校验与构造
  const data = { type, ...rest }
  if (type === 1) {
    if (!beginDate || !endDate) {
      console.warn('alarmData: type=1 需传 beginDate/endDate')
    } else {
      data.beginDate = beginDate
      data.endDate = endDate
    }
  }

  return request({
    url: '/operateDock/alarmData',
    method: 'post',
    data
  })
}