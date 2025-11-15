/**
 * 平台运营相关接口
 */
import request from '@/utils/request'

/**
 * 获取运营总览展板上关于平台板块的统计信息
 * @param {Object} params - { type, beginDate, endDate }
 *  - type: 0表示实时，1表示按时段查询（必填）
 *  - beginDate: 开始日期，格式yyyy-MM-dd，type为1时可不传
 *  - endDate: 结束日期，格式yyyy-MM-dd，type为1时可不传
 */
export function getTotalPlatform(params = {}) {
  const { type, beginDate, endDate } = params
  
  const data = { type }
  if (type === 1 && beginDate && endDate) {
    data.beginDate = beginDate
    data.endDate = endDate
  }
  
  return request({
    url: '/operateDock/totalPlatform',
    method: 'post',
    data
  })
}