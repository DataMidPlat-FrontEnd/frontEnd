<template>
  <div class="roi-repair">
    <el-card class="page-header" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>维保投入产出分析</span>
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
          <el-table-column prop="platform" label="所属平台" min-width="200" />
          <el-table-column prop="worth" label="仪器价值(元)" min-width="140" :formatter="fmtMoney" />
          <el-table-column prop="year" label="使用年限(年)" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="maintenance" label="维保次数" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="mPrice" label="维保金额(元)" min-width="140" :formatter="fmtMoney" />
          <el-table-column prop="repair" label="维修次数" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="rPrice" label="维修金额(元)" min-width="140" :formatter="fmtMoney" />
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
import { getRepairStatistics } from '@/api/usage'
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

/* 仪器映射表 - 用于权限过滤 */
const equipmentMap = ref({
  byId: new Map(),      // ID -> { name, code }
  byName: new Map(),    // name -> ID
  byCode: new Map()     // code -> ID
})

/**
 * 从 detailedList 接口获取平台列表和仪器映射表
 * 该接口返回包含 groupList 数组和 instrumentInfoList 数组的数据
 */
const fetchPlatformOptions = async () => {
  try {
    const response = await getDetailedList()
    if (response.code === '00000' && response.data) {
      // 1. 加载平台选项
      if (response.data.groupList) {
        platformOptions.value = response.data.groupList.map(g => ({
          id: Number(g.id),
          name: g.name || g.groupName || `平台 ${g.id}`
        }))
        console.log('成功加载平台选项:', platformOptions.value.length, '个')
      }

      // 2. 构建仪器映射表（用于权限过滤）
      if (response.data.instrumentInfoList) {
        const byId = new Map()
        const byName = new Map()
        const byCode = new Map()

        response.data.instrumentInfoList.forEach(item => {
          const id = Number(item.id)
          const name = item.name || item.instrumentName
          const code = item.code

          // ID -> { name, code }
          byId.set(id, { name, code })

          // name -> ID
          if (name) {
            byName.set(name, id)
          }

          // code -> ID
          if (code) {
            byCode.set(code, id)
          }
        })

        equipmentMap.value = { byId, byName, byCode }
        console.log('成功构建仪器映射表:', byId.size, '个仪器')
      }
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
      const res = await getRepairStatistics(params)
      if (res.code === '00000' || res.code === 0) {
        const data = res.data || []

        // 数据映射：通过名称或编号查找仪器ID
        const mapped = data.map((d) => {
          // 尝试通过名称或编号查找仪器ID
          let equipmentId = null
          if (d.name && equipmentMap.value.byName.has(d.name)) {
            equipmentId = equipmentMap.value.byName.get(d.name)
          } else if (d.code && equipmentMap.value.byCode.has(d.code)) {
            equipmentId = equipmentMap.value.byCode.get(d.code)
          }

          return {
            name: d.name,
            code: d.code,
            platform: d.platform || '未知平台',
            worth: Number(d.worth ?? 0),
            year: Number(d.year ?? 0),
            maintenance: Number(d.maintenance ?? 0),
            mPrice: Number(d.mPrice ?? 0),
            repair: Number(d.repair ?? 0),
            rPrice: Number(d.rPrice ?? 0),
            tTime: Number(d.tTime ?? 0),
            tAmount: Number(d.tAmount ?? 0),
            tIncome: Number(d.tIncome ?? 0),
            equipmentId: equipmentId // 通过名称或编号匹配到的仪器ID
          }
        })

        // 前端权限过滤
        let filteredMapped = mapped
        if (!hasFullPermission) {
          const allowedEquipmentIds = userStore.equipmentIds || []
          filteredMapped = mapped.filter((item, index) => {
            if (item.equipmentId) {
              const isAllowed = allowedEquipmentIds.includes(Number(item.equipmentId))
              if (index < 5) {
                console.log(`数据${index}: ${item.name} (ID: ${item.equipmentId}) - ${isAllowed ? '✅ 允许' : '❌ 拒绝'}`)
              }
              return isAllowed
            } else {
              // 无法匹配到仪器ID，可能是数据不一致，为安全起见拒绝访问
              if (index < 5) {
                console.warn(`数据${index}: ${item.name} - ⚠️ 无法匹配仪器ID，拒绝访问`)
              }
              return false
            }
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
      '所属平台': item.platform || '未知平台',
      '仪器价值(元)': item.worth ? item.worth.toFixed(2) : '0.00',
      '使用年限(年)': item.year || 0,
      '维保次数': item.maintenance || 0,
      '维保金额(元)': item.mPrice ? item.mPrice.toFixed(2) : '0.00',
      '维修次数': item.repair || 0,
      '维修金额(元)': item.rPrice ? item.rPrice.toFixed(2) : '0.00',
      '共享时长(h)': item.tTime ? item.tTime.toFixed(2) : '0.00',
      '共享次数': item.tAmount || 0,
      '共享收入(元)': item.tIncome ? item.tIncome.toFixed(2) : '0.00'
    }))

    // 2. 定义列配置
    const columns = [
      { prop: '排名', label: '排名', width: 12 },
      { prop: '仪器名称', label: '仪器名称', width: 30 },
      { prop: '资产编号', label: '资产编号', width: 18 },
      { prop: '所属平台', label: '所属平台', width: 30 },
      { prop: '仪器价值(元)', label: '仪器价值(元)', width: 18 },
      { prop: '使用年限(年)', label: '使用年限(年)', width: 15 },
      { prop: '维保次数', label: '维保次数', width: 15 },
      { prop: '维保金额(元)', label: '维保金额(元)', width: 18 },
      { prop: '维修次数', label: '维修次数', width: 15 },
      { prop: '维修金额(元)', label: '维修金额(元)', width: 18 },
      { prop: '共享时长(h)', label: '共享时长(h)', width: 18 },
      { prop: '共享次数', label: '共享次数', width: 15 },
      { prop: '共享收入(元)', label: '共享收入(元)', width: 18 }
    ]

    // 3. 生成文件名
    let filename = '维保投入产出分析'
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
  console.log('Repair.vue 组件挂载，准备加载数据...')
  // 先加载平台选项
  fetchPlatformOptions()
  // 然后加载数据
  fetchData()
})
</script>

<style lang="scss" scoped>
.roi-repair {
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
