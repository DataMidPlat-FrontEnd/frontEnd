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
        <el-table :data="tableData" border stripe height="540">
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

const loading = ref(false)

/* 查询条件 */
const queryType = ref(0) // 0实时 1时段
const dateRange = ref([])
const keyword = ref('')
const sortType = ref(0) // 0按次数 1按时长 2按收入

/* 分页 */
const page = ref(0) // 后端从 0 开始
const pageSize = ref(20)
const total = ref(0)
const tableData = ref([])

/* 请求数据 */
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      keyword: keyword.value.trim(),
      type: queryType.value,
      sort: sortType.value,
      page: page.value,
      pageSize: pageSize.value
    }
    
    // 时段查询才传日期
    if (queryType.value === 1 && dateRange.value && dateRange.value.length === 2) {
      params.beginDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    console.log('发送请求参数:', JSON.stringify(params, null, 2))
    const res = await getUserStatistics(params)
    console.log('收到响应:', res)
    if (res.code === '00000' || res.code === 0) {
      // 响应数据直接是数组，没有total字段，需要手动计算
      const data = res.data || []
      total.value = data.length  // 暂时使用数据长度作为总数
      tableData.value = data.map(d => ({
        name: d.name,
        pi: d.pi,
        tAmount: Number(d.tAmount ?? 0),
        tTime: Number(d.tTime ?? 0),
        tIncome: Number(d.tIncome ?? 0)
      }))
    } else {
      ElMessage.error(res.msg || '获取数据失败')
    }
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
  fetchData()
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

const exportData = () => {
  ElMessage.info('导出功能待接入')
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
.filter-form { margin: 0; }
.table-card { margin-top: 0; }
.pagination { margin-top: 12px; text-align: right; }
.empty-section { padding: 60px 0; text-align: center; }
</style>