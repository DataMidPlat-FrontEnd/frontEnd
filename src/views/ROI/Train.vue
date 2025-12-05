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

          <!-- 仪器关键字 -->
          <el-form-item label="仪器关键字">
            <el-input
              v-model="keyword"
              placeholder="仪器名称"
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
import { getDetailedList } from '@/api/dashboard'
import { ElMessage } from 'element-plus'
import { exportToExcel } from '@/utils/export'
import { useUserStore } from '@/stores/user'
import { hasFullDataPermission } from '@/utils/auth'

const loading = ref(false)

// 获取用户信息
const userStore = useUserStore()

/* 查询条件 */
const queryType = ref(0) // 0实时 1时段
const startDate = ref('')
const endDate = ref('')
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

    // 检查用户权限
    const hasFullPermission = hasFullDataPermission(userStore.userRole)

    // 如果是受限用户，检查是否有仪器权限
    if (!hasFullPermission) {
      const allowedEquipmentIds = userStore.equipmentIds || []
      if (allowedEquipmentIds.length === 0) {
        ElMessage.warning('您没有分配任何仪器权限，无法查看数据')
        allData.value = []
        total.value = 0
        tableData.value = []
        loading.value = false
        return
      }
    }

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

      // 如果是受限用户，添加仪器权限过滤
      if (!hasFullPermission) {
        params.eq = userStore.equipmentIds || []
      }

      if (!params.platform) {
        params.platform = []
      }
      if (queryType.value === 1) {
        params.beginDate = startDate.value
        params.endDate = endDate.value
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
          tIncome: Number(d.tIncome ?? 0),
          equipmentId: d.id || d.equipmentId // 保存仪器ID用于权限过滤
        }))

        // 前端再次过滤数据（双重保险）
        let filteredMapped = mapped
        if (!hasFullPermission) {
          const allowedEquipmentIds = userStore.equipmentIds || []
          filteredMapped = mapped.filter(item => {
            // 如果有equipmentId，使用ID匹配
            if (item.equipmentId) {
              return allowedEquipmentIds.includes(Number(item.equipmentId))
            }
            // 否则返回true（依赖后端过滤）
            return true
          })
        }

        aggregated.push(...filteredMapped)
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
  startDate.value = ''
  endDate.value = ''
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
  console.log('Train.vue 组件挂载，准备加载数据...')
  // 先加载平台选项
  fetchPlatformOptions()
  // 然后加载数据
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
