<template>
  <div class="roi-train">
    <el-card class="page-header" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>培训投入产出分析</span>
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

          <!-- 仪器关键字 -->
          <el-form-item label="仪器关键字">
            <el-input
              v-model="keyword"
              placeholder="请输入仪器名称或编号"
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
          <el-table-column prop="name" label="仪器名称" min-width="180" />
          <el-table-column prop="code" label="资产编号" min-width="140" />
          <el-table-column prop="location" label="仪器位置" min-width="200" />
          <el-table-column prop="platform" label="所属平台" min-width="200" />
          <el-table-column prop="online" label="线上培训量" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="offline" label="线下培训量" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="tTime" label="共享时长(h)" min-width="140" :formatter="fmtNum" />
          <el-table-column prop="tAmount" label="共享次数" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="tIncome" label="共享收入(元)" min-width="140" :formatter="fmtMoney" />
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
import { getTrainStatistics } from '@/api/usage'
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

/* 平台下拉选项（使用真实平台ID） */
const platformOptions = ref([
  { id: 8, name: '公共技术服务中心-影像成像子平台' },
  { id: 10, name: '公共技术服务中心-蛋白与代谢组学子平台' },
  { id: 11, name: '公共技术服务中心-细胞技术子平台' },
  { id: 13, name: '公共技术服务中心-药物筛选子平台' },
  { id: 14, name: '生物岛实验室' },
  { id: 16, name: '生物安全二级实验室' },
  { id: 17, name: '实验动物中心' },
  { id: 19, name: '公共技术服务中心-微纳流控子平台' },
  { id: 20, name: '国家生物信息中心粤港澳大湾区节点平台' },
  { id: 21, name: '检测评价中心' },
  { id: 22, name: '生物资源库' },
  { id: 23, name: '公共技术服务中心-中心办公室' }
])

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
      const res = await getTrainStatistics(params)
      if (res.code === '00000' || res.code === 0) {
        const data = res.data || []
        const mapped = data.map(d => ({
          name: d.name,
          code: d.code,
          location: d.location || '未知位置',
          platform: d.platform || '未知平台',
          online: Number(d.online ?? 0),
          offline: Number(d.offline ?? 0),
          tTime: Number(d.tTime ?? 0),
          tAmount: Number(d.tAmount ?? 0),
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
      '仪器名称': item.name || '未知仪器',
      '资产编号': item.code || '-',
      '仪器位置': item.location || '未知位置',
      '所属平台': item.platform || '未知平台',
      '线上培训量': item.online || 0,
      '线下培训量': item.offline || 0,
      '共享时长(h)': item.tTime ? item.tTime.toFixed(2) : '0.00',
      '共享次数': item.tAmount || 0,
      '共享收入(元)': item.tIncome ? item.tIncome.toFixed(2) : '0.00'
    }))

    // 2. 定义列配置
    const columns = [
      { prop: '排名', label: '排名', width: 12 },
      { prop: '仪器名称', label: '仪器名称', width: 30 },
      { prop: '资产编号', label: '资产编号', width: 18 },
      { prop: '仪器位置', label: '仪器位置', width: 30 },
      { prop: '所属平台', label: '所属平台', width: 30 },
      { prop: '线上培训量', label: '线上培训量', width: 15 },
      { prop: '线下培训量', label: '线下培训量', width: 15 },
      { prop: '共享时长(h)', label: '共享时长(h)', width: 18 },
      { prop: '共享次数', label: '共享次数', width: 15 },
      { prop: '共享收入(元)', label: '共享收入(元)', width: 18 }
    ]

    // 3. 生成文件名
    let filename = '培训投入产出分析'
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
  console.log('Train.vue 组件挂载，准备加载数据...')
  fetchData()
})
</script>

<style lang="scss" scoped>
.roi-train {
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