<template>
  <div class="alarm-page">
    <el-card class="query-card">
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="查询方式">
          <el-radio-group v-model="queryForm.queryType" @change="handleQueryTypeChange">
            <el-radio-button :label="0">实时</el-radio-button>
            <el-radio-button :label="1">按时段</el-radio-button>
          </el-radio-group>
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
          <el-button type="success" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <div class="table-header">
        <h3>劣迹用户报警统计</h3>
        <el-tag type="danger">报警类型: 劣迹用户报警</el-tag>
      </div>
      
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
        height="calc(100vh - 320px)"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column prop="name" label="报警名称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="location" label="位置" min-width="160" show-overflow-tooltip />
        <el-table-column prop="id" label="报警ID" min-width="120" />
        <el-table-column prop="time" label="时间" min-width="180" />
        <el-table-column prop="type" label="报警类型" min-width="140">
          <template #default="{ row }">
            <el-tag type="danger">
              <span v-if="row.type === 1">温度超标报警</span>
              <span v-else-if="row.type === 2">湿度超标报警</span>
              <span v-else-if="row.type === 3">水浸报警</span>
              <span v-else-if="row.type === 4">忘记关机报警</span>
              <span v-else-if="row.type === 5">仪器盗用报警</span>
              <span v-else-if="row.type === 6">维保到期报警</span>
              <span v-else-if="row.type === 7">劣迹用户报警</span>
              <span v-else-if="row.type === 8">劣迹行为报警</span>
              <span v-else-if="row.type === 9">违规行为报警</span>
              <span v-else>-</span>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="详情" min-width="300" show-overflow-tooltip />
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; text-align: right;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAlarmData } from '@/api/usage'
import { exportToExcel } from '@/utils/export'

// 查询表单
const queryForm = reactive({
  queryType: 0,
  startDate: '',
  endDate: '',
  
  
  alarmType: '劣迹用户报警' // 固定报警类型
})

// 表格数据
const tableData = ref([])
const allData = ref([]) // 存储所有查询到的数据
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 查询类型变化处理
const handleQueryTypeChange = () => {
  // 只在切换到实时模式时自动查询，时段模式需要手动查询
  if (queryForm.queryType === 0) {
    handleQuery()
  }
}

const handleQuery = async () => {
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
      type: queryForm.queryType,
      pageNum: 1,
      pageSize: 1000
    }
    if (queryForm.queryType === 1) {
      params.beginDate = queryForm.startDate
      params.endDate = queryForm.endDate
    }

    const response = await getAlarmData(params)
    if (response.code === '00000') {
      const responseData = response.data || []
      const filteredData = responseData.filter(item => item.type === 7)
      
      // 存储所有数据用于导出
      allData.value = filteredData
      
      // 手动分页
      total.value = filteredData.length
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      tableData.value = filteredData.slice(start, end)
      
      ElMessage.success('查询成功')
    } else {
      ElMessage.error(response.msg || '查询失败')
    }
  } catch (error) {
    console.error('查询报警数据失败:', error)
    ElMessage.error('查询失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 重置查询条件
const handleReset = () => {
  queryForm.queryType = 0
  queryForm.startDate = ''
  queryForm.endDate = ''
  
  currentPage.value = 1
  pageSize.value = 10
}

// 导出数据
const handleExport = () => {
  // 验证是否有数据
  if (!allData.value || allData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  try {
    // 1. 准备导出数据（导出所有数据，不仅仅是当前页）
    const exportData = allData.value.map(item => ({
      '报警名称': item.name || '-',
      '位置': item.location || '-',
      '报警ID': item.id || '-',
      '时间': item.time || '-',
      '报警类型': '劣迹用户报警',
      '详情': item.value || '-'
    }))

    // 2. 定义列配置
    const columns = [
      { prop: '报警名称', label: '报警名称', width: 25 },
      { prop: '位置', label: '位置', width: 20 },
      { prop: '报警ID', label: '报警ID', width: 15 },
      { prop: '时间', label: '时间', width: 20 },
      { prop: '报警类型', label: '报警类型', width: 15 },
      { prop: '详情', label: '详情', width: 30 }
    ]

    // 3. 生成文件名
    let filename = '劣迹用户报警统计'
    if (queryForm.queryType === 0) {
      filename += '_实时'
    } else if (queryForm.queryType === 1 && queryForm.startDate && queryForm.endDate) {
      filename += `_${queryForm.startDate}至${queryForm.endDate}`
    }

    // 4. 调用导出函数
    exportToExcel(exportData, columns, filename)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  }
}

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  handleQuery()
}

// 当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  handleQuery()
}

// 组件挂载时查询数据
onMounted(() => {
  handleQuery()
})
</script>

<style scoped>
.alarm-page {
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

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.table-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

:deep(.el-table) {
  border-radius: 4px;
}

:deep(.el-table__header-wrapper) {
  border-radius: 4px 4px 0 0;
}

:deep(.el-pagination) {
  padding: 20px 0 0 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .alarm-page {
    padding: 10px;
  }
  
  .query-form {
    flex-direction: column;
  }
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>