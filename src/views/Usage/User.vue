<template>
  <div class="usage-user">
    <el-card class="page-header" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>用户使用统计</span>
          <el-button type="primary" plain @click="exportData">导出报表</el-button>
        </div>
      </template>

      <!-- 查询条件 -->
      <div class="filter-section">
        <el-form :inline="true" class="filter-form">
          <!-- 查询类型 -->
          <el-form-item label="查询类型">
            <el-select v-model="queryType" style="width: 120px">
              <el-option :value="0" label="实时" />
              <el-option :value="1" label="按时段" />
            </el-select>
          </el-form-item>

          <!-- 日期范围（按时段才显示） -->
          <el-form-item label="时间范围" v-if="queryType === 1">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 240px"
            />
          </el-form-item>

          <!-- 课题组关键字 -->
          <el-form-item label="课题组">
            <el-input
              v-model="keyword"
              placeholder="请输入课题组关键字"
              clearable
              style="width: 220px"
              @keyup.enter="fetchData"
            />
          </el-form-item>

          <!-- 排序方式 -->
          <el-form-item label="排序方式">
            <el-select v-model="sortType" style="width: 120px">
              <el-option :value="0" label="按次数排序" />
              <el-option :value="1" label="按时长排序" />
              <el-option :value="2" label="按收入排序" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="loading" @click="fetchData">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格 + 分页 -->
      <el-card class="table-card" v-if="total > 0">
        <el-table :data="tableData" border stripe height="calc(100vh - 320px)">
          <el-table-column prop="name" label="用户名称" min-width="180" />
          <el-table-column prop="pi" label="所属课题组" min-width="200" />
          <el-table-column prop="tAmount" label="使用次数" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="tTime" label="使用时长(h)" min-width="120" :formatter="fmtNum" />
          <el-table-column prop="tIncome" label="贡献收入(元)" min-width="140" :formatter="fmtMoney" />
        </el-table>

        <!-- 后端分页 -->
        <div class="pagination">
          <el-pagination
            background
            layout="prev, pager, next"
            :total="total"
            :page-size="pageSize"
            :current-page="page + 1"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>

      <div v-else class="empty-section">
        <el-empty description="暂无数据" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getUserStatistics } from '@/api/usage'
import { ElMessage } from 'element-plus'
import { exportToExcel } from '@/utils/export'

const loading = ref(false)

/* 查询条件 */
const queryType = ref(0) // 0实时 1时段
const dateRange = ref([])
const keyword = ref('')
const sortType = ref(0) // 0按次数 1按时长 2按收入

/* 分页 */
const page = ref(0)
const pageSize = ref(20)
const backendPageSize = 300
const total = ref(0)
const tableData = ref([])
const allData = ref([])

/* 请求数据 */
const fetchData = async () => {
  loading.value = true
  try {
    const aggregated = []
    let pageNo = 1
    while (true) {
      const params = {
        keyword: keyword.value.trim(),
        type: queryType.value,
        sort: sortType.value,
        page: pageNo,
        pageSize: backendPageSize
      }
      if (queryType.value === 1 && dateRange.value && dateRange.value.length === 2) {
        params.beginDate = dateRange.value[0]
        params.endDate = dateRange.value[1]
      }
      const res = await getUserStatistics(params)
      if (res.code === '00000' || res.code === 0) {
        const data = res.data || []
        const mapped = data.map(d => ({
          name: d.name,
          pi: d.pi,
          tAmount: Number(d.tAmount ?? 0),
          tTime: Number(d.tTime ?? 0),
          tIncome: Number(d.tIncome ?? 0)
        }))
        aggregated.push(...mapped)
        if (data.length < backendPageSize) break
        pageNo += 1
      } else {
        ElMessage.error(res.msg || '获取数据失败')
        break
      }
    }
    allData.value = aggregated
    total.value = aggregated.length
    tableData.value = aggregated.slice(page.value * pageSize.value, (page.value + 1) * pageSize.value)
  } catch (e) {
    console.error('获取数据失败:', e)
    ElMessage.error('获取数据失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

/* 事件 */
const handlePageChange = (p) => {
  page.value = p - 1
  tableData.value = allData.value.slice(page.value * pageSize.value, (page.value + 1) * pageSize.value)
}

const resetFilter = () => {
  queryType.value = 0
  dateRange.value = []
  keyword.value = ''
  sortType.value = 0
  page.value = 0
  fetchData()
}

/* 格式化 */
const fmtNum = (_, __, cell) => cell.toFixed(2)
const fmtInt = (_, __, cell) => cell
const fmtMoney = (_, __, cell) => cell.toFixed(2)

/* 导出数据 */
const exportData = () => {
  // 验证是否有数据
  if (!allData.value || allData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  try {
    // 1. 准备导出数据（导出所有数据，不仅仅是当前页）
    const exportDataList = allData.value.map((item, index) => ({
      '排名': index + 1,
      '用户名称': item.name || '未知用户',
      '所属课题组': item.pi || '未知课题组',
      '使用次数': item.tAmount || 0,
      '使用时长(h)': item.tTime ? item.tTime.toFixed(2) : '0.00',
      '贡献收入(元)': item.tIncome ? item.tIncome.toFixed(2) : '0.00'
    }))

    // 2. 定义列配置
    const columns = [
      { prop: '排名', label: '排名', width: 12 },
      { prop: '用户名称', label: '用户名称', width: 20 },
      { prop: '所属课题组', label: '所属课题组', width: 25 },
      { prop: '使用次数', label: '使用次数', width: 15 },
      { prop: '使用时长(h)', label: '使用时长(h)', width: 18 },
      { prop: '贡献收入(元)', label: '贡献收入(元)', width: 18 }
    ]

    // 3. 生成文件名
    let filename = '用户使用统计'
    if (queryType.value === 0) {
      filename += '_实时'
    } else if (queryType.value === 1 && dateRange.value && dateRange.value.length === 2) {
      filename += `_${dateRange.value[0]}至${dateRange.value[1]}`
    }

    // 4. 调用导出函数
    exportToExcel(exportDataList, columns, filename)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  }
}

/* 监听查询类型变化 - 只在实时模式下自动查询 */
watch(queryType, (newVal) => {
  page.value = 0
  // 只有当切换到实时模式时才自动查询，切换到时段模式需要用户手动选择日期后查询
  if (newVal === 0) {
    fetchData()
  }
})

onMounted(() => {
  console.log('User.vue 组件挂载，准备加载数据...')
  fetchData()
})
</script>

<style lang="scss" scoped>
.usage-user { padding: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 600; }
.filter-section { margin-bottom: 16px; padding: 16px; background-color: #f5f7fa; border-radius: 8px; }
.filter-form { margin: 0; align-items: center; display: flex; flex-wrap: wrap; }
.table-card { margin-top: 0; }
.pagination { margin-top: 12px; text-align: right; }
.empty-section { padding: 60px 0; text-align: center; }
</style>