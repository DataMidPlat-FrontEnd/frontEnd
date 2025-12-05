<template>
  <div class="room-page">
    <el-card class="query-card">
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="楼层选择">
          <el-select v-model="queryForm.floorId" placeholder="请选择楼层" clearable @change="handleFloorChange">
            <el-option
              v-for="floor in floorOptions"
              :key="floor.value"
              :label="floor.label"
              :value="floor.value"
            />
          </el-select>
          <el-tag v-if="selectedFloorName" type="primary" style="margin-left: 10px;">
            {{ selectedFloorName }}
          </el-tag>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询房间列表</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 房间列表 -->
    <el-card class="room-list-card" v-loading="listLoading" v-if="roomList.length > 0">
      <div class="card-header">
        <div class="header-left">
          <h3>房间列表</h3>
          <el-tag type="info">共 {{ roomList.length }} 个房间</el-tag>
        </div>
        <div class="header-right">
          <el-input
            v-model="listSearchKeyword"
            placeholder="搜索房间"
            style="width: 200px; margin-right: 10px;"
            clearable
            @input="handleListSearch"
          />
          <el-button type="primary" plain @click="handleExport">导出报表</el-button>
        </div>
      </div>
      
      <div class="room-grid">
        <div 
          v-for="room in filteredRoomList" 
          :key="room.id"
          class="room-card"
          :class="{ 'selected': selectedRoom && selectedRoom.id === room.id }"
          @click="selectRoom(room)"
        >
          <div class="room-header">
            <h4>{{ room.name }}</h4>
            <el-tag size="small" type="info">{{ room.usage }}</el-tag>
          </div>
          <div class="room-info">
            <div class="info-item">
              <span class="label">面积：</span>
              <span class="value">{{ room.area }} m²</span>
            </div>
            <div class="info-item">
              <span class="label">平台：</span>
              <span class="value">{{ room.platform ? room.platform.length : 0 }} 个</span>
            </div>
          </div>
          <div class="room-platforms" v-if="room.platform && room.platform.length > 0">
            <el-tag 
              v-for="platform in room.platform" 
              :key="platform.id"
              size="mini"
              type="success"
              style="margin-right: 5px; margin-bottom: 5px;"
            >
              {{ platform.name }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 房间详情 -->
    <el-card class="room-detail-card" v-loading="detailLoading" v-if="selectedRoom">
      <div class="detail-header">
        <h3>房间详情 - {{ selectedRoom.name }}</h3>
        <el-button type="primary" size="small" @click="getRoomDetail(selectedRoom.id)">
          <el-icon><Refresh /></el-icon>
          刷新详情
        </el-button>
      </div>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="房间名称">{{ roomDetail.name }}</el-descriptions-item>
        <el-descriptions-item label="房间用途">{{ roomDetail.usage }}</el-descriptions-item>
        <el-descriptions-item label="房间面积">{{ roomDetail.area }} m²</el-descriptions-item>
        <el-descriptions-item label="平台数量">{{ roomDetail.platform ? roomDetail.platform.length : 0 }} 个</el-descriptions-item>
      </el-descriptions>

      <!-- 所属平台 -->
      <div class="section" v-if="roomDetail.platform && roomDetail.platform.length > 0">
        <h4>所属平台</h4>
        <el-tag 
          v-for="platform in roomDetail.platform" 
          :key="platform.id"
          type="success"
          style="margin-right: 10px; margin-bottom: 10px;"
        >
          {{ platform.name }}
        </el-tag>
      </div>

      <!-- 传感器信息 -->
      <div class="section" v-if="roomDetail.sensor && roomDetail.sensor.length > 0">
        <h4>传感器信息 ({{ roomDetail.sensor.length }} 个)</h4>
        <el-table :data="roomDetail.sensor" border style="width: 100%">
          <el-table-column prop="name" label="传感器名称" min-width="200" />
          <el-table-column prop="type" label="传感器类型" width="120" />
          <el-table-column prop="value" label="当前值" width="120" />
        </el-table>
      </div>

      <!-- 摄像头信息 -->
      <div class="section" v-if="roomDetail.camera && roomDetail.camera.length > 0">
        <h4>摄像头信息 ({{ roomDetail.camera.length }} 个)</h4>
        <el-table :data="roomDetail.camera" border style="width: 100%">
          <el-table-column prop="name" label="摄像头名称" min-width="200" />
        </el-table>
      </div>

      <!-- 报警信息 -->
      <div class="section" v-if="roomDetail.alarm && roomDetail.alarm.length > 0">
        <h4>报警信息 ({{ roomDetail.alarm.length }} 条)</h4>
        <el-alert
          v-for="alarm in roomDetail.alarm"
          :key="alarm.id"
          :title="alarm.title || '报警信息'"
          :type="alarm.level || 'warning'"
          :description="alarm.description"
          style="margin-bottom: 10px;"
        />
      </div>

      <div v-if="!roomDetail.sensor && !roomDetail.camera && !roomDetail.alarm" class="no-data">
        <el-empty description="暂无传感器、摄像头和报警信息" />
      </div>
    </el-card>

    <el-card v-if="!selectedRoom && roomList.length > 0" class="hint-card">
      <el-empty description="请点击左侧房间卡片查看详细信息" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRoomDataByFloor, getRoomData } from '@/api/entities'
import { getDetailedList } from '@/api/dashboard'
import { useUserStore } from '@/stores/user'
import { hasFullDataPermission } from '@/utils/auth'
import { exportToExcel } from '@/utils/export'

// 获取用户信息
const userStore = useUserStore()

// 查询表单
const queryForm = reactive({
  floorId: ''
})

// 楼层选项 - 从接口动态获取
const floorOptions = ref([])

// 房间列表
const roomList = ref([])
const filteredRoomList = ref([])
const listSearchKeyword = ref('')
const listLoading = ref(false)

// 选中房间详情
const selectedRoom = ref(null)
const roomDetail = ref({})
const detailLoading = ref(false)

// 计算选择的楼层名称
const selectedFloorName = computed(() => {
  if (!queryForm.floorId) return ''
  const floor = floorOptions.value.find(item => item.value === queryForm.floorId)
  return floor ? floor.label : '未知楼层'
})

// 楼层选择变化处理
const handleFloorChange = () => {
  // 清空之前的数据
  roomList.value = []
  filteredRoomList.value = []
  selectedRoom.value = null
  roomDetail.value = {}
}

/**
 * 根据用户权限过滤房间列表
 * 全权限用户可以查看所有房间，其他用户只能查看分配给他们的房间
 */
const filterRoomsByUserPermission = (rooms) => {
  // 检查用户是否有全部数据权限
  const hasFullPermission = hasFullDataPermission(userStore.userRole)

  if (hasFullPermission) {
    // 全权限用户：返回所有房间
    return rooms
  } else {
    // 其他用户：只返回分配给他们的房间
    const allowedRoomIds = userStore.roomIds || []
    // 将房间ID转换为数字进行比较,因为userStore.roomIds中存储的是数字类型
    return rooms.filter(room => {
      const roomId = Number(room.id)
      return allowedRoomIds.includes(roomId)
    })
  }
}

// 查询房间列表
const handleQuery = async () => {
  if (!queryForm.floorId) {
    ElMessage.warning('请选择楼层')
    return
  }

  listLoading.value = true
  try {
    const params = {
      id: queryForm.floorId
    }

    const response = await getRoomDataByFloor(params)
    if (response.code === '00000') {
      if (response.data && response.data.roomList) {
        // 根据用户权限过滤房间列表
        const filteredRooms = filterRoomsByUserPermission(response.data.roomList)

        roomList.value = filteredRooms
        filteredRoomList.value = filteredRooms

        if (filteredRooms.length === 0) {
          ElMessage.info('该楼层暂无您有权限访问的房间数据')
        } else {
          ElMessage.success(`成功获取 ${filteredRooms.length} 个房间信息`)
        }
      } else {
        roomList.value = []
        filteredRoomList.value = []
        ElMessage.info('该楼层暂无房间数据')
      }
    } else {
      ElMessage.error(response.msg || '查询失败')
    }
  } catch (error) {
    console.error('查询楼层房间数据失败:', error)
    ElMessage.error('查询失败，请稍后重试')
  } finally {
    listLoading.value = false
  }
}

// 重置查询条件
const handleReset = () => {
  queryForm.floorId = ''
  roomList.value = []
  filteredRoomList.value = []
  selectedRoom.value = null
  roomDetail.value = {}
  listSearchKeyword.value = ''
}

/**
 * 导出房间统计数据为 Excel
 * 包含所有房间统计信息
 */
const handleExport = () => {
  // 验证是否有数据
  if (!roomList.value || roomList.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  try {
    // 1. 准备导出数据
    const exportDataList = roomList.value.map((item, index) => ({
      '序号': index + 1,
      '房间名称': item.name || '未知房间',
      '房间用途': item.usage || '-',
      '面积(m²)': item.area || '0',
      '所属平台': (item.platform && item.platform.map(p => p.name).join(', ')) || '-',
      '传感器数': (item.sensor && item.sensor.length) || 0,
      '摄像头数': (item.camera && item.camera.length) || 0,
      '报警数': (item.alarm && item.alarm.length) || 0
    }))

    // 2. 定义列配置
    const columns = [
      { prop: '序号', label: '序号', width: 10 },
      { prop: '房间名称', label: '房间名称', width: 25 },
      { prop: '房间用途', label: '房间用途', width: 20 },
      { prop: '面积(m²)', label: '面积(m²)', width: 15 },
      { prop: '所属平台', label: '所属平台', width: 40 },
      { prop: '传感器数', label: '传感器数', width: 12 },
      { prop: '摄像头数', label: '摄像头数', width: 12 },
      { prop: '报警数', label: '报警数', width: 12 }
    ]

    // 3. 生成文件名
    const filename = `房间统计_${selectedFloorName.value || '全部'}`

    // 4. 调用导出函数
    exportToExcel(exportDataList, columns, filename)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  }
}

// 搜索房间列表
const handleListSearch = () => {
  if (!listSearchKeyword.value) {
    filteredRoomList.value = roomList.value
    return
  }
  
  const keyword = listSearchKeyword.value.toLowerCase()
  filteredRoomList.value = roomList.value.filter(room => {
    return room.name.toLowerCase().includes(keyword) || 
           room.usage.toLowerCase().includes(keyword) ||
           (room.platform && room.platform.some(p => p.name.toLowerCase().includes(keyword)))
  })
}

// 选择房间
const selectRoom = async (room) => {
  selectedRoom.value = room
  await getRoomDetail(room.id)
}

// 获取房间详情
const getRoomDetail = async (roomId) => {
  if (!roomId) return
  
  detailLoading.value = true
  try {
    const params = {
      id: roomId
    }

    const response = await getRoomData(params)
    if (response.code === '00000') {
      roomDetail.value = response.data || {}
      ElMessage.success('获取房间详情成功')
    } else {
      ElMessage.error(response.msg || '获取房间详情失败')
    }
  } catch (error) {
    console.error('获取房间详情失败:', error)
    ElMessage.error('获取房间详情失败，请稍后重试')
  } finally {
    detailLoading.value = false
  }
}


/**
 * 从 detailedList 接口获取楼层列表
 * 该接口返回包含 floor 数组的数据
 */
const fetchFloorOptions = async () => {
  try {
    const response = await getDetailedList()
    if (response.code === '00000' && response.data && response.data.floor) {
      // 将接口返回的 floor 数组转换为下拉框选项格式
      // { name: "楼层名称", id: "楼层ID" } -> { label: "楼层名称", value: "楼层ID" }
      floorOptions.value = response.data.floor.map(f => ({
        label: f.name || `楼层 ${f.id}`,
        value: String(f.id)
      }))
    } else {
      console.warn('获取楼层列表失败或数据格式错误')
    }
  } catch (error) {
    console.error('获取楼层列表失败:', error)
    ElMessage.error('获取楼层列表失败')
  }
}

// 组件挂载时初始化
onMounted(() => {
  // 从接口获取楼层选项
  fetchFloorOptions()
})
</script>

<style scoped>
.room-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.query-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.query-card :deep(.el-card__body) {
  padding: 16px;
}

.query-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  padding: 8px 0;
}

.query-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.query-form :deep(.el-form-item__content) {
  display: flex;
  align-items: center;
  gap: 8px;
}

.query-form .el-tag {
  display: inline-flex;
  align-items: center;
  height: 32px;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.query-form :deep(.el-select) {
  width: 240px;
}

.room-list-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.room-detail-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.hint-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.room-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 15px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.room-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.room-card.selected {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.room-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.room-info {
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 14px;
}

.info-item .label {
  color: #909399;
}

.info-item .value {
  color: #303133;
  font-weight: 500;
}

.room-platforms {
  margin-top: 10px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.detail-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.section {
  margin-top: 20px;
}

.section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.no-data {
  text-align: center;
  padding: 40px 0;
}

/* 楼层标签样式 */
.el-tag {
  margin-left: 10px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .room-page {
    padding: 10px;
  }
  
  .query-form {
    flex-direction: column;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .room-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
