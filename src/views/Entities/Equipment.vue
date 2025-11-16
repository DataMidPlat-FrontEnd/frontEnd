<template>
  <div class="equipment-page">
    <!-- 仪器基本信息查询 -->
    <el-card class="query-card">
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="查询方式">
          <el-radio-group v-model="queryForm.queryType" @change="handleQueryTypeChange">
            <el-radio-button :label="0">实时</el-radio-button>
            <el-radio-button :label="1">按时段</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="仪器ID">
          <el-input 
            v-model="queryForm.equipmentId" 
            placeholder="请输入仪器ID" 
            clearable 
            @change="handleEquipmentChange"
            style="width: 200px;"
          />
          <el-tag v-if="queryForm.equipmentId" type="primary" style="margin-left: 10px;">
            ID: {{ queryForm.equipmentId }}
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
          <el-button type="primary" @click="handleQuery">查询仪器信息</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 仪器基本信息 -->
    <el-card class="data-card" v-loading="basicLoading" v-if="basicData">
      <div class="card-header">
        <div class="header-left">
          <h3>仪器基本信息</h3>
        </div>
        <div class="header-right">
          <el-button type="primary" size="small" @click="showUsageDialog">
            查看使用信息
          </el-button>
        </div>
      </div>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="仪器编号">{{ basicData.code || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="仪器名称">{{ basicData.name || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="仪器型号">{{ basicData.instrVersion || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="制造商">{{ basicData.manufacturer || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="所属平台">{{ basicData.platform || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="安装位置">{{ basicData.room || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="仪器状态">{{ basicData.status || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="技术参数">{{ basicData.technical || '暂无' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 技术参数和备注 -->
      <div class="tech-section" v-if="basicData.technical || basicData.remark">
        <h4>技术参数与说明</h4>
        <el-card shadow="never">
          <div v-if="basicData.technical" class="tech-content">
            <strong>技术参数：</strong>
            <p>{{ basicData.technical }}</p>
          </div>
          <div v-if="basicData.remark" class="remark-content">
            <strong>备注说明：</strong>
            <p>{{ basicData.remark }}</p>
          </div>
        </el-card>
      </div>

      <!-- 培训计划 -->
      <div class="training-section" v-if="basicData.plan && basicData.plan.length > 0">
        <h4>培训计划 ({{ basicData.plan.length }} 个)</h4>
        <el-row :gutter="15">
          <el-col :span="12" v-for="plan in basicData.plan" :key="plan.time">
            <el-card shadow="hover" class="training-card">
              <div class="training-title">{{ plan.title }}</div>
              <div class="training-time">时间：{{ plan.time }}</div>
              <div class="training-actions">
                <el-button type="primary" size="small" @click="viewTraining(plan.url)">
                  查看详情
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 报警信息 -->
      <div class="alarm-section" v-if="basicData.alarm && basicData.alarm.length > 0">
        <h4>报警信息 ({{ basicData.alarm.length }} 条)</h4>
        <el-alert
          v-for="alarm in basicData.alarm"
          :key="alarm.id"
          :title="alarm.title || '报警信息'"
          :type="alarm.level || 'warning'"
          :description="alarm.description"
          style="margin-bottom: 10px;"
        />
      </div>

      <!-- 传感器信息 -->
      <div class="sensor-section" v-if="basicData.sensor && basicData.sensor.length > 0">
        <h4>传感器信息 ({{ basicData.sensor.length }} 个)</h4>
        <el-table :data="basicData.sensor" border style="width: 100%">
          <el-table-column prop="name" label="传感器名称" min-width="200" />
          <el-table-column prop="type" label="传感器类型" width="120" />
          <el-table-column prop="value" label="当前值" width="120" />
        </el-table>
      </div>

      <!-- 摄像头信息 -->
      <div class="camera-section" v-if="basicData.camera && basicData.camera.length > 0">
        <h4>摄像头信息 ({{ basicData.camera.length }} 个)</h4>
        <el-table :data="basicData.camera" border style="width: 100%">
          <el-table-column prop="name" label="摄像头名称" min-width="200" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewCamera(row)">
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 负责人信息 -->
      <div class="manager-section" v-if="basicData.mgr">
        <h4>负责人信息</h4>
        <el-tag 
          v-for="manager in basicData.mgr.split(';').filter(m => m.trim())" 
          :key="manager"
          type="info"
          style="margin-right: 10px; margin-bottom: 10px;"
        >
          {{ manager.replace('null', '').trim() }}
        </el-tag>
      </div>

      <!-- 使用统计 -->
      <div class="stats-section">
        <h4>使用统计</h4>
        <el-table 
          :data="basicStatsData" 
          border 
          style="width: 100%"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        >
          <el-table-column prop="category" label="统计项目" min-width="150" />
          <el-table-column prop="total" label="总计" min-width="100" align="right">
            <template #default="{ row }">
              <span v-if="row.total !== '-'">{{ formatNumber(row.total) }}{{ row.unit }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="internal" label="内部" min-width="100" align="right">
            <template #default="{ row }">
              <span v-if="row.internal !== '-'">{{ formatNumber(row.internal) }}{{ row.unit }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="external" label="外部" min-width="100" align="right">
            <template #default="{ row }">
              <span v-if="row.external !== '-'">{{ formatNumber(row.external) }}{{ row.unit }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="150" />
        </el-table>
      </div>
    </el-card>

    <!-- 仪器使用信息弹窗 -->
    <el-dialog
      v-model="usageDialogVisible"
      title="仪器使用信息"
      width="80%"
      top="5vh"
    >
      <div class="usage-content" v-loading="usageLoading">
        <!-- 使用信息查询条件 -->
        <el-card class="usage-query-card">
          <el-form :inline="true" :model="usageQueryForm" class="usage-query-form">
            <el-form-item label="查询方式">
              <el-radio-group v-model="usageQueryForm.queryType">
                <el-radio-button :label="0">实时</el-radio-button>
                <el-radio-button :label="1">按时段</el-radio-button>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="开始日期" v-if="usageQueryForm.queryType === 1">
              <el-date-picker
                v-model="usageQueryForm.startDate"
                type="date"
                placeholder="选择开始日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            
            <el-form-item label="结束日期" v-if="usageQueryForm.queryType === 1">
              <el-date-picker
                v-model="usageQueryForm.endDate"
                type="date"
                placeholder="选择结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" size="small" @click="queryUsageData">查询使用数据</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 使用记录表格 -->
        <el-card class="usage-table-card">
          <div class="card-header">
            <h4>使用记录</h4>
            <div class="header-right">
              <el-input
                v-model="usageSearchKeyword"
                placeholder="搜索使用记录"
                style="width: 200px; margin-right: 10px;"
                clearable
                @input="handleUsageSearch"
              />
              <el-popover placement="bottom" :width="200" trigger="click">
                <template #reference>
                  <el-button size="small">列设置</el-button>
                </template>
                <div class="column-settings">
                  <el-checkbox 
                    v-for="column in usageColumns" 
                    :key="column.prop"
                    v-model="column.visible"
                    @change="handleUsageColumnChange"
                  >
                    {{ column.label }}
                  </el-checkbox>
                </div>
              </el-popover>
            </div>
          </div>
          
          <el-table
            :data="filteredUsageData"
            border
            stripe
            style="width: 100%"
            :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
            v-if="usageData.length > 0"
          >
            <el-table-column 
              v-for="column in visibleUsageColumns" 
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

          <el-empty v-else description="暂无使用记录" />
        </el-card>

        <!-- 使用统计汇总 -->
        <el-card class="usage-chart-card" v-if="usageStats">
          <h4>使用统计汇总</h4>
          <el-table 
            :data="usageStatsData" 
            border 
            style="width: 100%"
            :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
          >
            <el-table-column prop="item" label="统计项目" min-width="150" />
            <el-table-column prop="value" label="数值" min-width="120" align="right">
              <template #default="{ row }">
                {{ row.value }}
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" min-width="80" align="center" />
            <el-table-column prop="description" label="说明" min-width="200" />
          </el-table>
        </el-card>
      </div>
    </el-dialog>

    <el-card v-if="!basicData" class="hint-card">
      <el-empty description="请选择仪器并查询基本信息" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getEqData, getBookingData } from '@/api/entities'

// 查询表单
const queryForm = reactive({
  queryType: 0,
  equipmentId: '',
  startDate: '',
  endDate: ''
})

// 仪器基本信息
const basicData = ref(null)
const basicLoading = ref(false)

// 使用信息弹窗
const usageDialogVisible = ref(false)
const usageData = ref([])
const filteredUsageData = ref([])
const usageLoading = ref(false)
const usageSearchKeyword = ref('')
const usageStats = ref(null)

// 使用信息查询表单
const usageQueryForm = reactive({
  queryType: 0,
  startDate: '',
  endDate: ''
})

// 仪器选项
const equipmentOptions = ref([
  { label: '仪器1', value: '1' },
  { label: '仪器2', value: '2' },
  { label: '仪器3', value: '3' },
  { label: '仪器4', value: '4' },
  { label: '仪器5', value: '5' }
])

// 计算选择的仪器名称
const selectedEquipmentName = computed(() => {
  if (!queryForm.equipmentId) return ''
  const equipment = equipmentOptions.value.find(item => item.value === queryForm.equipmentId)
  return equipment ? equipment.label : '未知仪器'
})

// 计算基本使用统计数据 - 重新设计，每种统计类型单独成行
const basicStatsData = computed(() => {
  if (!basicData.value) return []
  
  return [
    {
      category: '总用户数',
      total: basicData.value.tUser || 0,
      internal: basicData.value.iUser || 0,
      external: basicData.value.oUser || 0,
      unit: '人',
      remark: ''
    },
    {
      category: '培训用户数',
      total: basicData.value.trainUser || 0,
      internal: '-',
      external: '-',
      unit: '人',
      remark: ''
    },
    {
      category: '总使用时长',
      total: basicData.value.tTime || 0,
      internal: basicData.value.iTime || 0,
      external: basicData.value.oTime || 0,
      unit: '小时',
      remark: '使用率: ' + (basicData.value.usage || 0) + '%'
    },
    {
      category: '总卡次数',
      total: basicData.value.tCard || 0,
      internal: basicData.value.iCard || 0,
      external: basicData.value.oCard || 0,
      unit: '次',
      remark: ''
    },
    {
      category: '培训次数',
      total: basicData.value.train || 0,
      internal: '-',
      external: '-',
      unit: '次',
      remark: '培训通过率: ' + (basicData.value.trainPass || 0) + '%'
    },
    {
      category: '样品数量',
      total: basicData.value.sample || 0,
      internal: '-',
      external: '-',
      unit: '个',
      remark: ''
    },
    {
      category: '材料费用',
      total: basicData.value.materials || 0,
      internal: '-',
      external: '-',
      unit: '元',
      remark: ''
    },
    {
      category: '培训信息',
      total: basicData.value.trainInfo || 0,
      internal: '-',
      external: '-',
      unit: '',
      remark: ''
    }
  ]
})

// 计算使用统计数据
const usageStatsData = computed(() => {
  if (!usageStats.value) return []
  
  const stats = usageStats.value
  return [
    {
      item: '总记录数',
      value: formatNumber(stats.totalRecords) + ' 条',
      unit: '条',
      description: '总的使用记录数量'
    },
    {
      item: '总费用',
      value: formatCurrency(stats.totalCost) + ' 元',
      unit: '元',
      description: '所有使用记录的总费用'
    },
    {
      item: '测试费用',
      value: formatCurrency(stats.totalTestCost) + ' 元',
      unit: '元',
      description: '测试相关的总费用'
    },
    {
      item: '材料费用',
      value: formatCurrency(stats.totalMaterialsCost) + ' 元',
      unit: '元',
      description: '材料相关的总费用'
    },
    {
      item: '平均费用',
      value: stats.totalRecords > 0 ? formatCurrency(stats.totalCost / stats.totalRecords) + ' 元' : '0 元',
      unit: '元',
      description: '每条记录的平均费用'
    },
    {
      item: '平均测试费用',
      value: stats.totalRecords > 0 ? formatCurrency(stats.totalTestCost / stats.totalRecords) + ' 元' : '0 元',
      unit: '元',
      description: '每条记录的平均测试费用'
    }
  ]
})

// 查询类型变化处理
const handleQueryTypeChange = () => {
  // 不自动查询，需要用户手动点击查询按钮
}

// 仪器选择变化处理
const handleEquipmentChange = () => {
  // 不自动查询，需要用户手动点击查询按钮
}

// 查询仪器基本信息
const handleQuery = async () => {
  if (!queryForm.equipmentId) {
    ElMessage.warning('请选择仪器')
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

  basicLoading.value = true
  try {
    const params = {
      id: queryForm.equipmentId,
      type: queryForm.queryType
    }
    
    if (queryForm.queryType === 1) {
      params.beginDate = queryForm.startDate
      params.endDate = queryForm.endDate
    }

    const response = await getEqData(params)
    if (response.code === '00000') {
      basicData.value = response.data
      ElMessage.success('查询成功')
    } else {
      ElMessage.error(response.msg || '查询失败')
    }
  } catch (error) {
    console.error('查询仪器数据失败:', error)
    ElMessage.error('查询失败，请稍后重试')
  } finally {
    basicLoading.value = false
  }
}

// 重置查询条件
const handleReset = () => {
  queryForm.queryType = 0
  queryForm.equipmentId = ''
  queryForm.startDate = ''
  queryForm.endDate = ''
  basicData.value = null
  usageData.value = []
  filteredUsageData.value = []
  usageStats.value = null
}

// 显示使用信息弹窗
const showUsageDialog = () => {
  if (!queryForm.equipmentId) {
    ElMessage.warning('请先选择仪器')
    return
  }
  usageDialogVisible.value = true
  // 初始化使用信息查询条件
  usageQueryForm.queryType = queryForm.queryType
  usageQueryForm.startDate = queryForm.startDate
  usageQueryForm.endDate = queryForm.endDate
  // 查询使用数据
  queryUsageData()
}

// 查询使用数据
const queryUsageData = async () => {
  if (!queryForm.equipmentId) return

  usageLoading.value = true
  try {
    const params = {
      id: queryForm.equipmentId,
      type: usageQueryForm.queryType
    }
    
    if (usageQueryForm.queryType === 1) {
      params.beginDate = usageQueryForm.startDate
      params.endDate = usageQueryForm.endDate
    }

    const response = await getBookingData(params)
    if (response.code === '00000') {
      // 使用实际API返回的数据
      if (response.data && Array.isArray(response.data)) {
        usageData.value = response.data
        filteredUsageData.value = response.data
        
        // 计算统计数据
        const totalCost = response.data.reduce((sum, item) => sum + (item.cost || 0), 0)
        const totalTestCost = response.data.reduce((sum, item) => sum + (item.testCost || 0), 0)
        const totalMaterialsCost = response.data.reduce((sum, item) => sum + (item.materialsCost || 0), 0)
        
        usageStats.value = {
          totalRecords: response.data.length,
          totalCost: totalCost,
          totalTestCost: totalTestCost,
          totalMaterialsCost: totalMaterialsCost
        }
      } else {
        usageData.value = []
        filteredUsageData.value = []
        usageStats.value = null
      }
      
      ElMessage.success(`成功获取 ${response.data.length} 条使用记录`)
    } else {
      ElMessage.error(response.msg || '查询使用数据失败')
    }
  } catch (error) {
    console.error('查询使用数据失败:', error)
    ElMessage.error('查询使用数据失败，请稍后重试')
  } finally {
    usageLoading.value = false
  }
}

// 搜索使用记录
const handleUsageSearch = () => {
  if (!usageSearchKeyword.value) {
    filteredUsageData.value = usageData.value
    return
  }
  
  const keyword = usageSearchKeyword.value.toLowerCase()
  filteredUsageData.value = usageData.value.filter(record => {
    return Object.values(record).some(value => 
      String(value).toLowerCase().includes(keyword)
    )
  })
}

// 查看培训详情
const viewTraining = (url) => {
  if (url) {
    // 移除URL中的反引号
    const cleanUrl = url.replace(/`/g, '')
    window.open(cleanUrl, '_blank')
  } else {
    ElMessage.info('暂无培训详情链接')
  }
}

// 查看摄像头
const viewCamera = (camera) => {
  ElMessage.info(`查看摄像头: ${camera.name}`)
  // 这里可以添加实际的摄像头查看逻辑
}

// 格式化数字
const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '0'
  return Number(value).toLocaleString()
}

// 格式化货币
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '0'
  return Number(value).toLocaleString()
}

// 使用记录表格列配置
const usageColumns = ref([
  { prop: 'name', label: '用户姓名', visible: true, minWidth: 100 },
  { prop: 'bookingTime', label: '预约时间', visible: true, minWidth: 180 },
  { prop: 'beginTime', label: '开始时间', visible: true, minWidth: 150 },
  { prop: 'endTime', label: '结束时间', visible: true, minWidth: 150 },
  { prop: 'type', label: '使用类型', visible: true, minWidth: 100 },
  { prop: 'status', label: '状态', visible: true, minWidth: 80 },
  { prop: 'testCost', label: '测试费用(元)', visible: true, minWidth: 120, formatter: formatCurrency },
  { prop: 'materialsCost', label: '材料费用(元)', visible: true, minWidth: 120, formatter: formatCurrency },
  { prop: 'cost', label: '总费用(元)', visible: true, minWidth: 120, formatter: formatCurrency }
])

// 计算可见列
const visibleUsageColumns = ref([])

// 列变化处理
const handleUsageColumnChange = () => {
  visibleUsageColumns.value = usageColumns.value.filter(column => column.visible)
}

// 组件挂载时初始化
onMounted(() => {
  // 初始化可见列
  visibleUsageColumns.value = usageColumns.value.filter(column => column.visible)
  
  // 不自动选择仪器，需要用户手动选择
})
</script>

<style scoped>
.equipment-page {
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
  margin-bottom: 20px;
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

.stats-section {
  margin-top: 20px;
}

.stats-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.stat-card {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
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

.tech-section {
  margin-top: 20px;
}

.tech-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.tech-content, .remark-content {
  margin-bottom: 15px;
}

.tech-content strong, .remark-content strong {
  color: #606266;
  display: block;
  margin-bottom: 8px;
}

.tech-content p, .remark-content p {
  color: #303133;
  line-height: 1.6;
  margin: 0;
}

.training-section {
  margin-top: 20px;
}

.training-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.training-card {
  margin-bottom: 15px;
}

.training-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.training-time {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
}

.training-actions {
  text-align: right;
}

.alarm-section {
  margin-top: 20px;
}

.alarm-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.sensor-section, .camera-section {
  margin-top: 20px;
}

.sensor-section h4, .camera-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.manager-section {
  margin-top: 20px;
}

.manager-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.hint-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 使用信息弹窗样式 */
.usage-content {
  max-height: 70vh;
  overflow-y: auto;
}

.usage-query-card {
  margin-bottom: 20px;
}

.usage-query-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.usage-table-card {
  margin-bottom: 20px;
}

.usage-chart-card {
  margin-bottom: 0;
}

.chart-stat {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.chart-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.chart-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
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

/* 仪器标签样式 */
.el-tag {
  margin-left: 10px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .equipment-page {
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
  
  .usage-query-form {
    flex-direction: column;
  }
}
</style>