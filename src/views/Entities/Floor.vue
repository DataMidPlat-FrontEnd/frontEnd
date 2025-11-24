<template>
  <div class="floor-page">
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
          <el-button type="primary" size="small" @click="handleQuery">查询</el-button>
          <el-button size="small" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="data-card" v-loading="loading">
      <div class="card-header">
        <div class="header-left">
          <h3>楼层统计信息</h3>
        </div>
        <div class="header-right" v-if="tableData.length > 0">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索楼层数据"
            style="width: 200px; margin-right: 10px;"
            clearable
            @input="handleSearch"
          />
          <el-button type="primary" plain @click="handleExport" style="margin-right: 10px;">导出报表</el-button>
          <el-popover placement="bottom" :width="200" trigger="click">
            <template #reference>
              <el-button>列设置</el-button>
            </template>
            <div class="column-settings">
              <el-checkbox 
                v-for="column in allColumns" 
                :key="column.prop"
                v-model="column.visible"
                @change="handleColumnChange"
              >
                {{ column.label }}
              </el-checkbox>
            </div>
          </el-popover>
        </div>
      </div>
      
      <el-table
        :data="filteredTableData"
        border
        stripe
        style="width: 100%"
        height="calc(100vh - 320px)"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        v-if="tableData.length > 0"
      >
        <el-table-column 
          v-for="column in visibleColumns" 
          :key="column.prop"
          :prop="column.prop" 
          :label="column.label" 
          :min-width="column.minWidth || 120"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span v-if="column.formatter">{{ column.formatter(row[column.prop]) }}</span>
            <span v-else>{{ row[column.prop] }}</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无数据，请选择楼层并查询" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getFloorData } from '@/api/entities'
import { getDetailedList } from '@/api/dashboard'
import { exportToExcel } from '@/utils/export'

// 查询表单
const queryForm = reactive({
  floorId: ''
})

// 表格数据
const tableData = ref([])
const searchKeyword = ref('')
const filteredTableData = ref([])
const loading = ref(false)

// 计算选择的楼层名称
const selectedFloorName = computed(() => {
  if (!queryForm.floorId) return ''
  const floor = floorOptions.value.find(item => item.value === queryForm.floorId)
  return floor ? floor.label : '未知楼层'
})

// 格式化数字
const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '0'
  return Number(value).toLocaleString()
}

// 楼层选项 - 从接口动态获取
const floorOptions = ref([])

// 楼层选择变化处理
const handleFloorChange = () => {
  // 不自动查询，需要用户手动点击查询按钮
}

// 查询数据
const handleQuery = async () => {
  if (!queryForm.floorId) {
    ElMessage.warning('请选择楼层')
    return
  }

  loading.value = true
  try {
    const params = {
      id: queryForm.floorId
    }

    const response = await getFloorData(params)
    if (response.code === '00000') {
      // 转换数据为表格格式
      if (response.data) {
        tableData.value = [{
          name: response.data.name || selectedFloorName.value,
          usage: response.data.usage || '科研办公',
          area: response.data.area || '0',
          platformCount: response.data.platform ? response.data.platform.length : 0,
          platformNames: response.data.platform ? response.data.platform.map(p => p.name).join(', ') : ''
        }]
        filteredTableData.value = tableData.value
      }
      
      ElMessage.success('查询成功')
    } else {
      ElMessage.error(response.msg || '查询失败')
    }
  } catch (error) {
    console.error('查询楼层数据失败:', error)
    ElMessage.error('查询失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 重置查询条件
const handleReset = () => {
  queryForm.floorId = ''
  tableData.value = []
  filteredTableData.value = []
  searchKeyword.value = ''
}

// 搜索处理
const handleSearch = () => {
  if (!searchKeyword.value) {
    filteredTableData.value = tableData.value
    return
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  filteredTableData.value = tableData.value.filter(row => {
    return Object.values(row).some(value => 
      String(value).toLowerCase().includes(keyword)
    )
  })
}

// 列变化处理
const handleColumnChange = () => {
  visibleColumns.value = allColumns.value.filter(column => column.visible)
}

/**
 * 导出楼层统计数据为 Excel
 * 包含所有楼层统计信息
 */
const handleExport = () => {
  // 验证是否有数据
  if (!tableData.value || tableData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  try {
    // 1. 准备导出数据
    const exportDataList = tableData.value.map((item, index) => ({
      '序号': index + 1,
      '楼层名称': item.name || '未知楼层',
      '楼层用途': item.usage || '-',
      '面积(m²)': item.area || '0',
      '平台数量': item.platformCount || 0,
      '所属平台': item.platformNames || '-'
    }))

    // 2. 定义列配置
    const columns = [
      { prop: '序号', label: '序号', width: 10 },
      { prop: '楼层名称', label: '楼层名称', width: 25 },
      { prop: '楼层用途', label: '楼层用途', width: 20 },
      { prop: '面积(m²)', label: '面积(m²)', width: 15 },
      { prop: '平台数量', label: '平台数量', width: 15 },
      { prop: '所属平台', label: '所属平台', width: 40 }
    ]

    // 3. 生成文件名
    const filename = `楼层统计_${selectedFloorName.value || '全部'}`

    // 4. 调用导出函数
    exportToExcel(exportDataList, columns, filename)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  }
}

// 表格列配置
const allColumns = ref([
  { prop: 'name', label: '楼层名称', visible: true, minWidth: 150 },
  { prop: 'usage', label: '楼层用途', visible: true, minWidth: 120 },
  { prop: 'area', label: '面积(m²)', visible: true, minWidth: 100, formatter: formatNumber },
  { prop: 'platformCount', label: '平台数量', visible: true, minWidth: 100, formatter: formatNumber },
  { prop: 'platformNames', label: '所属平台', visible: true, minWidth: 200 }
])

// 计算可见列
const visibleColumns = ref([])

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
  // 初始化可见列
  visibleColumns.value = allColumns.value.filter(column => column.visible)
  
  // 从接口获取楼层选项
  fetchFloorOptions()
})
</script>

<style scoped>
.floor-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.query-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.query-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
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

.data-card {
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

/* 列设置样式 */
.column-settings {
  padding: 10px;
}

.column-settings .el-checkbox {
  display: block;
  margin-bottom: 8px;
  margin-right: 0;
}

.column-settings .el-checkbox:last-child {
  margin-bottom: 0;
}

/* 楼层标签样式 */
.el-tag {
  margin-left: 10px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .floor-page {
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
}
</style>