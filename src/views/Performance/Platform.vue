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
          <!-- 查询方式 -->
          <el-form-item label="查询方式">
            <el-radio-group v-model="queryType" @change="handleQueryTypeChange">
              <el-radio-button :label="0">实时</el-radio-button>
              <el-radio-button :label="1">按时段</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <!-- 开始/结束日期（按时段才显示） -->
          <el-form-item label="开始日期" v-if="queryType === 1">
            <el-date-picker
              v-model="startDate"
              type="date"
              placeholder="选择开始日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="结束日期" v-if="queryType === 1">
            <el-date-picker
              v-model="endDate"
              type="date"
              placeholder="选择结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
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
        <el-table :data="tableData" border stripe height="calc(100vh - 320px)">
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
import { getDetailedList } from '@/api/dashboard'
import { ElMessage } from 'element-plus'
import { exportToExcel } from '@/utils/export'

const loading = ref(false)

/* 查询条件 */
const queryType = ref(0) // 0实时 1时段
const startDate = ref('')
const endDate = ref('')
const platformIds = ref([]) // 多选平台 id

/* 分页 */
const page = ref(0) // 后端从 0 开始
const pageSize = ref(20)
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
    if (queryType.value === 1) {
      if (!startDate.value || !endDate.value) {
        ElMessage.warning('请选择开始日期和结束日期')
        return
      }
      if (startDate.value > endDate.value) {
        ElMessage.warning('开始日期不能大于结束日期')
        return
      }
    }
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
    if (queryType.value === 1) {
      params.beginDate = startDate.value
      params.endDate = endDate.value
    }

    console.log('发送请求参数:', JSON.stringify(params, null, 2))
    const res = await getPlatformStatistics(params)
    console.log('收到响应:', res)
    if (res.code === '00000' || res.code === 0) {
      const data = res.data || []
      const mapped = data.map(d => ({
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
      allData.value = mapped
      total.value = mapped.length
      tableData.value = mapped.slice(page.value * pageSize.value, (page.value + 1) * pageSize.value)
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
  tableData.value = allData.value.slice(page.value * pageSize.value, (page.value + 1) * pageSize.value)
}

const resetFilter = () => {
  queryType.value = 0
  startDate.value = ''
  endDate.value = ''
  platformIds.value = []
  page.value = 0
  fetchData()
}

/* 格式化 */
const fmtNum = (_, __, cell) => cell.toFixed(2)
const fmtInt = (_, __, cell) => cell
const fmtPercent = (_, __, cell) => cell.toFixed(2)

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
      '平台名称': item.platform || '未知平台',
      '仪器机时(h)': item.tTime ? item.tTime.toFixed(2) : '0.00',
      '仪器使用率(%)': item.eqUsage ? item.eqUsage.toFixed(2) : '0.00',
      '房间使用数': item.rooms || 0,
      '房间使用率(%)': item.roomUsage ? item.roomUsage.toFixed(2) : '0.00',
      '项目管理数': item.tProject || 0,
      '笼位使用数': item.cages || 0,
      '笼位使用率(%)': item.cageUsage ? item.cageUsage.toFixed(2) : '0.00',
      '支撑科研项目数': item.tCard || 0,
      '支撑内部科研项目数': item.iCard || 0,
      '支撑外部科研项目数': item.oCard || 0
    }))

    // 2. 定义列配置
    const columns = [
      { prop: '排名', label: '排名', width: 12 },
      { prop: '平台名称', label: '平台名称', width: 25 },
      { prop: '仪器机时(h)', label: '仪器机时(h)', width: 18 },
      { prop: '仪器使用率(%)', label: '仪器使用率(%)', width: 18 },
      { prop: '房间使用数', label: '房间使用数', width: 15 },
      { prop: '房间使用率(%)', label: '房间使用率(%)', width: 18 },
      { prop: '项目管理数', label: '项目管理数', width: 15 },
      { prop: '笼位使用数', label: '笼位使用数', width: 15 },
      { prop: '笼位使用率(%)', label: '笼位使用率(%)', width: 18 },
      { prop: '支撑科研项目数', label: '支撑科研项目数', width: 20 },
      { prop: '支撑内部科研项目数', label: '支撑内部科研项目数', width: 22 },
      { prop: '支撑外部科研项目数', label: '支撑外部科研项目数', width: 22 }
    ]

    // 3. 生成文件名
    let filename = '平台业绩统计'
    if (queryType.value === 0) {
      filename += '_实时'
    } else if (queryType.value === 1 && startDate.value && endDate.value) {
      filename += `_${startDate.value}至${endDate.value}`
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

const handleQueryTypeChange = () => {
  if (queryType.value === 0) {
    page.value = 0
    fetchData()
  }
}

onMounted(() => {
  console.log('Platform.vue 组件挂载，准备加载数据...')
  // 先加载平台选项
  fetchPlatformOptions()
  // 然后加载数据
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
