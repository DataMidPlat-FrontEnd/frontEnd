<template>
  <div class="building-page">
    <el-card class="query-card">
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="查询方式">
          <el-radio-group v-model="queryForm.queryType" @change="handleQueryTypeChange">
            <el-radio-button :label="0">实时</el-radio-button>
            <el-radio-button :label="1">按时段</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="建筑选择">
          <el-select v-model="queryForm.buildingId" placeholder="请选择建筑" clearable @change="handleBuildingChange">
            <el-option label="A栋" value="1" />
            <el-option label="B栋" value="2" />
            <el-option label="C栋" value="3" />
            <el-option label="D栋" value="4" />
            <el-option label="电镜中心" value="5" />
            <el-option label="标五" value="6" />
            <el-option label="鹰仕达1号楼" value="7" />
            <el-option label="鹰仕达2号楼（含裙楼）" value="8" />
          </el-select>
          <el-tag v-if="selectedBuildingName" type="primary" style="margin-left: 10px;">
            {{ selectedBuildingName }}
          </el-tag>
        </el-form-item>
        <el-form-item label="开始日期" v-if="queryForm.queryType === 1">
          <el-date-picker
            v-model="queryForm.startDate"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="结束日期" v-if="queryForm.queryType === 1">
          <el-date-picker
            v-model="queryForm.endDate"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="data-card" v-loading="loading">
      <div class="card-header">
        <div class="header-left">
          <h3>建筑统计信息</h3>
          <el-tag type="info" v-if="selectedBuildingName">{{ selectedBuildingName }}</el-tag>
        </div>
        <div class="header-right" v-if="tableData.length > 0">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索建筑数据"
            style="width: 200px; margin-right: 10px;"
            clearable
            @input="handleSearch"
          />
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

      <el-empty v-else description="暂无数据，请选择建筑并查询" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getBuildingData } from '@/api/entities'

// 查询表单
const queryForm = reactive({
  queryType: 0,
  buildingId: '',
  startDate: '',
  endDate: ''
})

// 建筑信息
const buildingInfo = ref({
  name: '',
  usage: '',
  platform: ''
})

// 统计数据
const buildingData = ref(null)
const loading = ref(false)

// 表格数据
const tableData = ref([])
const searchKeyword = ref('')
const filteredTableData = ref([])

// 计算选择的建筑名称
const selectedBuildingName = computed(() => {
  if (!queryForm.buildingId) return ''
  const building = buildingOptions.value.find(item => item.value === queryForm.buildingId)
  return building ? building.label : ''
})

// 格式化数字
const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '0'
  return Number(value).toLocaleString()
}

// 格式化百分比
const formatRate = (value) => {
  if (value === null || value === undefined || value === '') return '0%'
  // 培训通过率已经是百分比值，直接格式化
  return Number(value).toFixed(2) + '%'
}

// 表格列配置
const allColumns = ref([
  { prop: 'name', label: '建筑名称', visible: true, minWidth: 120 },
  { prop: 'usage', label: '建筑用途', visible: true, minWidth: 100 },
  { prop: 'platform', label: '所属平台', visible: true, minWidth: 150 },
  { prop: 'floor', label: '楼层数', visible: true, minWidth: 80, formatter: formatNumber },
  { prop: 'tUser', label: '用户数', visible: true, minWidth: 90, formatter: formatNumber },
  { prop: 'trainUser', label: '培训人数', visible: true, minWidth: 100, formatter: formatNumber },
  { prop: 'iGroup', label: '内部课题组', visible: true, minWidth: 110, formatter: formatNumber },
  { prop: 'oGroup', label: '外部课题组', visible: true, minWidth: 110, formatter: formatNumber },
  { prop: 'insUse', label: '仪器使用次数', visible: true, minWidth: 120, formatter: formatNumber },
  { prop: 'tIncome', label: '总收入(万元)', visible: true, minWidth: 110 },
  { prop: 'iIncome', label: '内部收入(万元)', visible: true, minWidth: 120 },
  { prop: 'oIncome', label: '外部收入(万元)', visible: true, minWidth: 120 },
  { prop: 'trainPass', label: '培训通过率(%)', visible: true, minWidth: 120, formatter: formatRate }
])

// 计算可见列
const visibleColumns = ref([])

// 建筑选项
const buildingOptions = ref([
  { label: 'A栋', value: '1' },
  { label: 'B栋', value: '2' },
  { label: 'C栋', value: '3' },
  { label: 'D栋', value: '4' },
  { label: '电镜中心', value: '5' },
  { label: '标五', value: '6' },
  { label: '鹰仕达1号楼', value: '7' },
  { label: '鹰仕达2号楼（含裙楼）', value: '8' }
])

// 查询类型变化处理
const handleQueryTypeChange = () => {
  // 不自动查询，需要用户手动点击查询按钮
}

// 建筑选择变化处理
const handleBuildingChange = () => {
  // 不自动查询，需要用户手动点击查询按钮
}

// 查询数据
const handleQuery = async () => {
  if (!queryForm.buildingId) {
    ElMessage.warning('请选择建筑')
    return
  }

  if (queryForm.queryType === 1) {
    if (!queryForm.startDate || !queryForm.endDate) {
      ElMessage.warning('请选择开始日期和结束日期')
      return
    }
    if (queryForm.startDate > queryForm.endDate) {
      ElMessage.warning('开始日期不能大于结束日期')
      return
    }
  }

  loading.value = true
  try {
    const params = {
      id: queryForm.buildingId,
      type: queryForm.queryType
    }
    
    if (queryForm.queryType === 1) {
      params.beginDate = queryForm.startDate
      params.endDate = queryForm.endDate
    }

    const response = await getBuildingData(params)
    if (response.code === '00000') {
      buildingData.value = response.data
      // 根据建筑ID设置建筑名称
      const building = buildingOptions.value.find(item => item.value === queryForm.buildingId)
      buildingInfo.value.name = building ? building.label : '未知建筑'
      
      // 转换数据为表格格式
      if (response.data) {
        tableData.value = [{
          name: buildingInfo.value.name,
          usage: response.data.usage || '科研办公', 
          platform: response.data.platform || '公共技术服务中心',
          floor: response.data.floor || '0',
          building: response.data.building || 0,
          tUser: response.data.tUser || 0,
          trainUser: response.data.trainUser || 0,
          iGroup: response.data.iGroup || 0,
          oGroup: response.data.oGroup || 0,
          insUse: response.data.insUse || 0,
          tIncome: response.data.tIncome || '0.00',
          iIncome: response.data.iIncome || '0.00',
          oIncome: response.data.oIncome || '0.00',
          trainPass: response.data.trainPass || 0
        }]
        filteredTableData.value = tableData.value
      }
      
      ElMessage.success('查询成功')
    } else {
      ElMessage.error(response.msg || '查询失败')
    }
  } catch (error) {
    console.error('查询建筑数据失败:', error)
    ElMessage.error('查询失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 重置查询条件
const handleReset = () => {
  queryForm.queryType = 0
  queryForm.buildingId = ''
  queryForm.startDate = ''
  queryForm.endDate = ''
  buildingData.value = null
  buildingInfo.value.name = ''
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

// 组件挂载时初始化
onMounted(() => {
  // 初始化可见列
  visibleColumns.value = allColumns.value.filter(column => column.visible)
  
  // 不自动选择建筑，需要用户手动选择
})
</script>

<style scoped>
.building-page {
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

.building-stats {
  padding: 20px 0;
}

.stat-row {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.08);
}

.stat-item {
  padding: 20px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.info-card {
  margin-top: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.08);
}

.info-list {
  padding: 0 20px;
}

.info-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.info-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .building-page {
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

/* 建筑标签样式 */
.el-tag {
  margin-left: 10px;
  font-weight: 500;
}
</style>