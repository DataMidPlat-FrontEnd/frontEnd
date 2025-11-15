<template>
  <div class="performance-platform">
    <el-card class="page-header" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>平台业绩统计</span>
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

          <el-form-item>
            <el-button type="primary" :loading="loading" @click="fetchData">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格 + 分页 -->
      <el-card class="table-card" v-if="total > 0">
        <el-table :data="tableData" border stripe height="540">
          <el-table-column prop="platform" label="平台名称" min-width="220" />
          <el-table-column prop="tTime" label="仪器机时(h)" min-width="140" :formatter="fmtNum" />
          <el-table-column prop="eqUsage" label="仪器使用率(%)" min-width="140" :formatter="fmtPercent" />
          <el-table-column prop="rooms" label="房间使用数" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="roomUsage" label="房间使用率(%)" min-width="140" :formatter="fmtPercent" />
          <el-table-column prop="tProject" label="项目管理数" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="cages" label="笼位使用数" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="cageUsage" label="笼位使用率(%)" min-width="140" :formatter="fmtPercent" />
          <el-table-column prop="tCard" label="支撑科研项目数" min-width="160" :formatter="fmtInt" />
          <el-table-column prop="iCard" label="支撑内部科研项目数" min-width="180" :formatter="fmtInt" />
          <el-table-column prop="oCard" label="支撑外部科研项目数" min-width="180" :formatter="fmtInt" />
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
import { getPlatformStatistics } from '@/api/usage'
import { ElMessage } from 'element-plus'

const loading = ref(false)

/* 查询条件 */
const queryType = ref(0) // 0实时 1时段
const dateRange = ref([])
const platformIds = ref([]) // 多选平台 id

/* 分页 */
const page = ref(0) // 后端从 0 开始
const pageSize = ref(20)
const total = ref(0)
const tableData = ref([])

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
    const params = {
      platform: platformIds.value.length ? platformIds.value : [],
      type: queryType.value,
      page: page.value,
      pageSize: pageSize.value
    }
    
    // 确保platform字段存在，即使是空数组
    if (!params.platform) {
      params.platform = []
    }
    // 时段查询才传日期
    if (queryType.value === 1 && dateRange.value && dateRange.value.length === 2) {
      params.beginDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    console.log('发送请求参数:', JSON.stringify(params, null, 2))
    const res = await getPlatformStatistics(params)
    console.log('收到响应:', res)
    if (res.code === '00000' || res.code === 0) {
      // 响应数据直接是数组，没有total字段，需要手动计算
      const data = res.data || []
      total.value = data.length  // 暂时使用数据长度作为总数
      tableData.value = data.map(d => ({
        platform: d.platform,
        tTime: Number(d.tTime ?? 0),
        eqUsage: Number(d.eqUsage ?? 0),
        rooms: Number(d.rooms ?? 0),
        roomUsage: Number(d.roomUsage ?? 0),
        tProject: Number(d.tProject ?? 0),
        cages: Number(d.cages ?? 0),
        cageUsage: Number(d.cageUsage ?? 0),
        tCard: Number(d.tCard ?? 0),
        iCard: Number(d.iCard ?? 0),
        oCard: Number(d.oCard ?? 0)
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
  platformIds.value = []
  page.value = 0
  fetchData()
}

/* 格式化 */
const fmtNum = (_, __, cell) => cell.toFixed(2)
const fmtInt = (_, __, cell) => cell
const fmtPercent = (_, __, cell) => cell.toFixed(2)

const exportData = () => {
  ElMessage.info('导出功能待接入')
}

/* 监听条件变化后自动刷新 - 只监听查询类型变更 */
watch(queryType, () => {
  page.value = 0
  fetchData()
})

onMounted(() => {
  console.log('Platform.vue 组件挂载，准备加载数据...')
  fetchData()
})
</script>

<style lang="scss" scoped>
.performance-platform {
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