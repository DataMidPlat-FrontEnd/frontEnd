<template>
  <div class="performance-admin">
    <el-card class="page-header" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>管理员业绩统计</span>
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

          <!-- 平台多选 -->
          <el-form-item label="所属平台">
            <el-select
              v-model="platformIds"
              multiple
              clearable
              placeholder="全部平台"
              style="width: 240px"
            >
              <el-option
                v-for="p in platformOptions"
                :key="p.id"
                :label="p.name"
                :value="p.id"
              />
            </el-select>
          </el-form-item>

          <!-- 管理员关键字 -->
          <el-form-item label="管理员">
            <el-input
              v-model="keyword"
              placeholder="请输入管理员名称"
              clearable
              style="width: 220px"
              @keyup.enter="fetchData"
            />
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
          <el-table-column prop="name" label="管理员名称" min-width="180" />
          <el-table-column prop="platform" label="所属平台" min-width="200" />
          <el-table-column prop="tIncome" label="服务收入(万元)" min-width="140" :formatter="fmtMoney" />
          <el-table-column prop="userApprove" label="用户审批次数" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="eqApprove" label="仪器申请审批次数" min-width="140" :formatter="fmtInt" />
          <el-table-column prop="fundsApprove" label="经费审批次数" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="bookingApprove" label="预约审批次数" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="appealApprove" label="申诉审批次数" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="settlement" label="发起结算次数" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="techService" label="技术服务次数" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="eqMaintain" label="仪器维护次数" min-width="120" :formatter="fmtInt" />
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
import { ref, computed, onMounted, watch } from 'vue'
import { getManagerStatistics } from '@/api/usage'
import { getDetailedList } from '@/api/dashboard'
import { ElMessage } from 'element-plus'
import { exportToExcel } from '@/utils/export'

const loading = ref(false)

/* 查询条件 */
const queryType = ref(0) // 0实时 1时段
const dateRange = ref([])
const platformIds = ref([]) // 多选平台 id
const keyword = ref('')

/* 分页 */
const page = ref(0)
const pageSize = ref(20)
const backendPageSize = 300
const total = ref(0)
const tableData = ref([])
const allData = ref([])

/* 平台下拉选项 - 从接口动态获取 */
const platformOptions = ref([])

/**
 * 从 detailedList 接口获取平台列表
 * 该接口返回包含 groupList 数组的数据
 */
const fetchPlatformOptions = async () => {
  try {
    const response = await getDetailedList()
    if (response.code === '00000' && response.data && response.data.groupList) {
      // 将接口返回的 groupList 数组转换为下拉框选项格式
      // { name: "平台名称", id: "平台ID" } -> { id: 平台ID, name: "平台名称" }
      platformOptions.value = response.data.groupList.map(g => ({
        id: Number(g.id), // 转换为数字类型
        name: g.name || g.groupName || `平台 ${g.id}`
      }))
      console.log('成功加载平台选项:', platformOptions.value.length, '个')
    } else {
      console.warn('获取平台列表失败或数据格式错误')
    }
  } catch (error) {
    console.error('获取平台列表失败:', error)
    ElMessage.error('获取平台列表失败')
  }
}

/* 请求数据 */
const fetchData = async () => {
  loading.value = true
  try {
    const aggregated = []
    let pageNo = 1
    while (true) {
      const params = {
        platform: platformIds.value.length ? platformIds.value : [],
        keyword: keyword.value.trim(),
        type: queryType.value,
        page: pageNo,
        pageSize: backendPageSize
      }
      if (!params.platform) {
        params.platform = []
      }
      if (queryType.value === 1 && dateRange.value && dateRange.value.length === 2) {
        params.beginDate = dateRange.value[0]
        params.endDate = dateRange.value[1]
      }
      const res = await getManagerStatistics(params)
      if (res.code === '00000' || res.code === 0) {
        const data = res.data || []
        const mapped = data.map(d => ({
          name: d.name,
          platform: d.platform,
          tIncome: Number(d.tIncome ?? 0),
          userApprove: Number(d.userApprove ?? 0),
          eqApprove: Number(d.eqApprove ?? 0),
          fundsApprove: Number(d.fundsApprove ?? 0),
          bookingApprove: Number(d.bookingApprove ?? 0),
          appealApprove: Number(d.appealApprove ?? 0),
          settlement: Number(d.settlement ?? 0),
          techService: Number(d.techService ?? 0),
          eqMaintain: Number(d.eqMaintain ?? 0)
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
  platformIds.value = []
  keyword.value = ''
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
      '管理员名称': item.name || '未知管理员',
      '所属平台': item.platform || '-',
      '服务收入(万元)': item.tIncome || 0,
      '用户审批次数': item.userApprove || 0,
      '仪器申请审批次数': item.eqApprove || 0,
      '经费审批次数': item.fundsApprove || 0,
      '预约审批次数': item.bookingApprove || 0,
      '申诉审批次数': item.appealApprove || 0,
      '发起结算次数': item.settlement || 0,
      '技术服务次数': item.techService || 0,
      '仪器维护次数': item.eqMaintain || 0
    }))

    // 2. 定义列配置
    const columns = [
      { prop: '排名', label: '排名', width: 12 },
      { prop: '管理员名称', label: '管理员名称', width: 18 },
      { prop: '所属平台', label: '所属平台', width: 25 },
      { prop: '服务收入(万元)', label: '服务收入(万元)', width: 18 },
      { prop: '用户审批次数', label: '用户审批次数', width: 18 },
      { prop: '仪器申请审批次数', label: '仪器申请审批次数', width: 20 },
      { prop: '经费审批次数', label: '经费审批次数', width: 18 },
      { prop: '预约审批次数', label: '预约审批次数', width: 18 },
      { prop: '申诉审批次数', label: '申诉审批次数', width: 18 },
      { prop: '发起结算次数', label: '发起结算次数', width: 18 },
      { prop: '技术服务次数', label: '技术服务次数', width: 18 },
      { prop: '仪器维护次数', label: '仪器维护次数', width: 18 }
    ]

    // 3. 生成文件名
    let filename = '管理员业绩统计'
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
  console.log('Admin.vue 组件挂载，准备加载数据...')
  // 先加载平台选项
  fetchPlatformOptions()
  // 然后加载数据
  fetchData()
})
</script>

<style lang="scss" scoped>
.performance-admin {
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

.filter-section {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.table-card {
  margin-top: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.empty-section {
  padding: 40px 0;
  text-align: center;
}
</style>