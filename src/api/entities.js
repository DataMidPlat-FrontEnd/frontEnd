import request from '@/utils/request'

// 建筑信息（POST：/operateDock/buildingData）
export function getBuildingData(params) {
  return request({
    url: '/operateDock/buildingData',
    method: 'post',
    data: params
  })
}

// 楼层基本信息（POST：/operateDock/floorData）
export function getFloorData(payload) {
  return request({
    url: '/operateDock/floorData',
    method: 'post',
    data: payload
  })
}

// 新增：房间详情（POST：/operateDock/roomData）
export function getRoomData(params) {
  return request({
    url: '/operateDock/roomData',
    method: 'post',
    data: params
  })
}

// 新增：按楼层获取房间列表（POST：/operateDock/getRoomDataByFloor）
export function getRoomDataByFloor(params) {
  return request({
    url: '/operateDock/getRoomDataByFloor',
    method: 'post',
    data: params
  })
}

// 新增：仪器基本信息和业务数据（POST：/operateDock/eqData）
export function getEqData(params) {
  return request({
    url: '/operateDock/eqData',
    method: 'post',
    data: params
  })
}

// 新增：仪器使用信息（POST：/operateDock/bookingData）
export function getBookingData(params) {
  return request({
    url: '/operateDock/bookingData',
    method: 'post',
    data: params
  })
}