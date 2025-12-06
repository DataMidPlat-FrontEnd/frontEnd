<template>
  <div class="usage-equipment">
    <el-card class="page-header" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>仪器使用统计</span>
          <el-button type="primary" plain @click="exportData">导出报表</el-button>
        </div>
      </template>

      <!-- 查询条件 -->
      <div class="filter-section">
        <el-form :inline="true" class="filter-form">
          <!-- 查询类型 -->
          <el-form-item label="查询方式">
            <el-radio-group v-model="queryType" @change="handleQueryTypeChange">
              <el-radio-button :label="0">实时</el-radio-button>
              <el-radio-button :label="1">按时段</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <!-- 日期范围（按时段才显示） -->
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

          <!-- 关键字 -->
          <el-form-item label="关键字">
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
          <el-table-column prop="name" label="仪器名称" min-width="240" />
          <el-table-column prop="code" label="资产编号" min-width="140" />
          <el-table-column prop="platform" label="所属平台" min-width="160" />
          <el-table-column prop="location" label="位置" min-width="220" />
          <el-table-column prop="usage" label="使用率(%)" min-width="120" :formatter="fmtPercent" />
          <el-table-column prop="tTime" label="总机时(h)" min-width="120" :formatter="fmtNum" />
          <el-table-column prop="iTime" label="内部机时(h)" min-width="120" :formatter="fmtNum" />
          <el-table-column prop="oTime" label="外部机时(h)" min-width="120" :formatter="fmtNum" />
          <el-table-column prop="sample" label="样品数" min-width="100" :formatter="fmtInt" />
          <el-table-column prop="materials" label="耗材数" min-width="100" :formatter="fmtInt" />
          <el-table-column prop="tAmount" label="总次数" min-width="100" :formatter="fmtInt" />
          <el-table-column prop="iAmount" label="内部次数" min-width="100" :formatter="fmtInt" />
          <el-table-column prop="oAmount" label="外部次数" min-width="100" :formatter="fmtInt" />
          <el-table-column prop="tUser" label="总人数" min-width="100" :formatter="fmtInt" />
          <el-table-column prop="iUser" label="内部人数" min-width="100" :formatter="fmtInt" />
          <el-table-column prop="oUser" label="外部人数" min-width="100" :formatter="fmtInt" />
          <el-table-column prop="tGroup" label="总课题组" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="iGroup" label="内部课题组" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="oGroup" label="外部课题组" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="tCard" label="总经费卡" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="iCard" label="内部经费卡" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="oCard" label="外部经费卡" min-width="120" :formatter="fmtInt" />
          <el-table-column prop="tIncome" label="总收入(元)" min-width="140" :formatter="fmtMoney" />
          <el-table-column prop="iIncome" label="内部收入(元)" min-width="140" :formatter="fmtMoney" />
          <el-table-column prop="oIncome" label="外部收入(元)" min-width="140" :formatter="fmtMoney" />
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
import { getEquipmentUsage } from '@/api/usage'
import { getDetailedList } from '@/api/dashboard'
import { ElMessage } from 'element-plus'
import { exportToExcel } from '@/utils/export'
import { useUserStore } from '@/stores/user'
import { hasFullDataPermission } from '@/utils/auth'

const loading = ref(false)

/* 用户信息和权限控制 */
const userStore = useUserStore()
const equipmentMap = ref({
  byId: new Map(),
  byName: new Map(),
  byCode: new Map()
})

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

/* 加载仪器映射表 */
const fetchEquipmentMap = async () => {
  try {
    const response = await getDetailedList()
    if (response.code === '00000' && response.data && response.data.instrumentInfoList) {
      const byId = new Map()
      const byName = new Map()
      const byCode = new Map()

      response.data.instrumentInfoList.forEach(item => {
        const id = Number(item.id)
        const name = item.name || item.instrumentName
        const code = item.code

        byId.set(id, { name, code })
        if (name) byName.set(name, id)
        if (code) byCode.set(code, id)
      })

      equipmentMap.value = { byId, byName, byCode }
      console.log('✅ 仪器映射表加载成功:', byId.size, '个仪器')
    }
  } catch (error) {
    console.error('❌ 加载仪器映射表失败:', error)
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
      if (queryType.value === 1) {
        if (!startDate.value || !endDate.value) {
          ElMessage.warning('请选择开始日期和结束日期')
          break
        }
        if (startDate.value > endDate.value) {
          ElMessage.warning('开始日期不能大于结束日期')
          break
        }
        params.beginDate = startDate.value
        params.endDate = endDate.value
      }
      const res = await getEquipmentUsage(params)
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
            location: d.location,
            platform: d.platform,
            usage: Number(d.usage ?? 0),
            tTime: Number(d.tTime ?? 0),
            iTime: Number(d.iTime ?? 0),
            oTime: Number(d.oTime ?? 0),
            sample: Number(d.sample ?? 0),
            materials: Number(d.materials ?? 0),
            tAmount: Number(d.tAmount ?? 0),
            iAmount: Number(d.iAmount ?? 0),
            oAmount: Number(d.oAmount ?? 0),
            tUser: Number(d.tUser ?? 0),
            iUser: Number(d.iUser ?? 0),
            oUser: Number(d.oUser ?? 0),
            tGroup: Number(d.tGroup ?? 0),
            iGroup: Number(d.iGroup ?? 0),
            oGroup: Number(d.oGroup ?? 0),
            tCard: Number(d.tCard ?? 0),
            iCard: Number(d.iCard ?? 0),
            oCard: Number(d.oCard ?? 0),
            tIncome: Number(d.tIncome ?? 0),
            iIncome: Number(d.iIncome ?? 0),
            oIncome: Number(d.oIncome ?? 0),
            equipmentId: equipmentId // 通过名称或编号匹配到的仪器ID
          }
        })

        // 前端权限过滤
        let filteredMapped = mapped
        const hasFullPermission = hasFullDataPermission(userStore.userRole)
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
const fmtPercent = (_, __, cell) => cell.toFixed(2)
const fmtMoney = (_, __, cell) => cell.toFixed(2)

const exportData = () => {
  // 验证是否有数据
  if (!allData.value || allData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  try {
    // 定义导出列配置
    const columns = [
      { prop: 'name', label: '仪器名称', width: 30 },
      { prop: 'code', label: '资产编号', width: 18 },
      { prop: 'platform', label: '所属平台', width: 25 },
      { prop: 'location', label: '位置', width: 25 },
      { prop: 'usage', label: '使用率(%)', width: 15 },
      { prop: 'tTime', label: '总机时(h)', width: 15 },
      { prop: 'iTime', label: '内部机时(h)', width: 18 },
      { prop: 'oTime', label: '外部机时(h)', width: 18 },
      { prop: 'sample', label: '样品数', width: 12 },
      { prop: 'materials', label: '耗材数', width: 12 },
      { prop: 'tAmount', label: '总次数', width: 12 },
      { prop: 'iAmount', label: '内部次数', width: 15 },
      { prop: 'oAmount', label: '外部次数', width: 15 },
      { prop: 'tUser', label: '总人数', width: 12 },
      { prop: 'iUser', label: '内部人数', width: 15 },
      { prop: 'oUser', label: '外部人数', width: 15 },
      { prop: 'tGroup', label: '总课题组', width: 15 },
      { prop: 'iGroup', label: '内部课题组', width: 18 },
      { prop: 'oGroup', label: '外部课题组', width: 18 },
      { prop: 'tCard', label: '总经费卡', width: 15 },
      { prop: 'iCard', label: '内部经费卡', width: 18 },
      { prop: 'oCard', label: '外部经费卡', width: 18 },
      { prop: 'tIncome', label: '总收入(元)', width: 15 },
      { prop: 'iIncome', label: '内部收入(元)', width: 18 },
      { prop: 'oIncome', label: '外部收入(元)', width: 18 }
    ]

    // 生成文件名（包含查询条件）
    let filename = '仪器使用统计'
    if (queryType.value === 0) {
      filename += '_实时'
    } else if (queryType.value === 1 && startDate.value && endDate.value) {
      filename += `_${startDate.value}至${endDate.value}`
    }

    // 导出数据（导出所有数据，不仅仅是当前页）
    exportToExcel(allData.value, columns, filename)
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

/**
 * 从 detailedList 接口获取平台列表
 * 该接口返回包含 groupList 数组的数据
 */
const fetchPlatformOptions = async () => {
  try {
    const response = await getDetailedList()
    if (response.code === '00000' && response.data && response.data.groupList) {
      // 将接口返回的 groupList 数组转换为下拉框选项格式
      // { name: "平台名称", id: "平台ID" } -> { name: "平台名称", id: 平台ID }
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

onMounted(async () => {
  console.log('Equipment.vue 组件挂载，准备加载数据...')
  // 先加载平台选项
  await fetchPlatformOptions()
  // 再加载仪器映射表
  await fetchEquipmentMap()
  // 最后加载数据
  fetchData()
})
</script>

<style lang="scss" scoped>
.usage-equipment { padding: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 600; }
.filter-section { margin-bottom: 16px; padding: 16px; background-color: #f5f7fa; border-radius: 8px; }
.filter-form { margin: 0; align-items: center; display: flex; flex-wrap: wrap; }
.table-card { margin-top: 0; }
.pagination { margin-top: 12px; text-align: right; }
.empty-section { padding: 60px 0; text-align: center; }
</style>
const handleQueryTypeChange = () => {
  if (queryType.value === 0) {
    fetchData()
  }
}
