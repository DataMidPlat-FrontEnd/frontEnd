<template>
  <div class="equipment-operation">
    <el-card class="page-header" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>仪器运营</span>
          <el-button type="primary" plain @click="exportData">导出报表</el-button>
        </div>
      </template>
      
      <!-- 查询条件 -->
      <div class="filter-section">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="查询方式">
            <el-radio-group v-model="queryType" @change="handleQueryTypeChange">
              <el-radio-button :label="0">实时</el-radio-button>
              <el-radio-button :label="1">按时段</el-radio-button>
            </el-radio-group>
          </el-form-item>
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
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="fetchData">查询</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 统计卡片区域 - 优化布局和尺寸 -->
      <div class="stats-grid">
        <el-card class="stat-card" v-if="equipmentTotal !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e6f2ff;">
              <el-icon :size="24" color="#409EFF">
                <Monitor />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">仪器总数</div>
              <div class="stat-value">{{ formatNumber(equipmentTotal) }} <span class="stat-unit">台</span></div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="machineHours !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #f0f9e6;">
              <el-icon :size="24" color="#67C23A">
                <Clock />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">总机时</div>
              <div class="stat-value">{{ formatNumber(machineHours) }} <span class="stat-unit">小时</span></div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="internalMachineHours !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e1f3d8;">
              <el-icon :size="24" color="#529b2e">
                <Clock />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">内部机时</div>
              <div class="stat-value">{{ formatNumber(internalMachineHours) }} <span class="stat-unit">小时</span></div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="externalMachineHours !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #fff2e6;">
              <el-icon :size="24" color="#d48806">
                <Clock />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">外部机时</div>
              <div class="stat-value">{{ formatNumber(externalMachineHours) }} <span class="stat-unit">小时</span></div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="usageCount !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #fdf6e6;">
              <el-icon :size="24" color="#E6A23C">
                <TrendCharts />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">总使用量</div>
              <div class="stat-value">{{ formatNumber(usageCount) }} <span class="stat-unit">次</span></div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="internalUsageCount !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #fff7e6;">
              <el-icon :size="24" color="#d46b08">
                <TrendCharts />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">内部使用量</div>
              <div class="stat-value">{{ formatNumber(internalUsageCount) }} <span class="stat-unit">次</span></div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="externalUsageCount !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #fffbe6;">
              <el-icon :size="24" color="#d4b106">
                <TrendCharts />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">外部使用量</div>
              <div class="stat-value">{{ formatNumber(externalUsageCount) }} <span class="stat-unit">次</span></div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="income !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #ffe6e6;">
              <el-icon :size="24" color="#F56C6C">
                <Money />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">总收入</div>
              <div class="stat-value">{{ formatCurrency(income) }} <span class="stat-unit">元</span></div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="internalIncome !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #ffe6f0;">
              <el-icon :size="24" color="#c45656">
                <Money />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">内部收入</div>
              <div class="stat-value">{{ formatCurrency(internalIncome) }} <span class="stat-unit">元</span></div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="externalIncome !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #fff0e6;">
              <el-icon :size="24" color="#d4a106">
                <Money />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">外部收入</div>
              <div class="stat-value">{{ formatCurrency(externalIncome) }} <span class="stat-unit">元</span></div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="usageRate !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e6f7ff;">
              <el-icon :size="24" color="#409EFF">
                <PieChart />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">使用率</div>
              <div class="stat-value">{{ formatPercent(usageRate) }} <span class="stat-unit">%</span></div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="sampleCount !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #f6e6ff;">
              <el-icon :size="24" color="#722ed1">
                <TrendCharts />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">使用样品数</div>
              <div class="stat-value">{{ formatNumber(sampleCount) }} <span class="stat-unit">个</span></div>
            </div>
          </div>
          </el-card>
        
        <el-card class="stat-card" v-if="materialCount !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e6ffe6;">
              <el-icon :size="24" color="#389e0d">
                <TrendCharts />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">使用耗材数</div>
              <div class="stat-value">{{ formatNumber(materialCount) }} <span class="stat-unit">个</span></div>
            </div>
          </div>
          </el-card>
      </div>

      <!-- 图表区域 - 使用排名、时间分布、使用趋势 -->
      <div class="chart-section" v-if="hasChartData">
        <el-card class="chart-card" v-if="equipmentRanking.length > 0">
          <template #header>
            <div class="chart-header">
              <el-icon :size="16" color="#409EFF">
                <TrendCharts />
              </el-icon>
              <span>仪器使用排名</span>
            </div>
          </template>
          <div class="ranking-list">
            <div 
              v-for="(item, index) in equipmentRankingPaged" 
              :key="item.id || item.equipmentId || index"
              class="ranking-item"
            >
              <div class="rank-number" :class="getRankClass(((equipmentRankingPage - 1) * equipmentRankingPageSize) + index)">
                {{ ((equipmentRankingPage - 1) * equipmentRankingPageSize) + index + 1 }}
              </div>
              <div class="equipment-info">
                <div class="equipment-name">{{ item.equipmentName || item.name || '未知仪器' }}</div>
                <div class="equipment-usage">使用量: {{ item.usageCount || item.amount || item.count || 0 }}</div>
              </div>
              <div class="usage-bar">
                <el-progress 
                  :percentage="getUsagePercentage(item, equipmentRanking)" 
                  :color="getProgressColor(((equipmentRankingPage - 1) * equipmentRankingPageSize) + index)"
                  :show-text="false"
                />
              </div>
            </div>
          </div>
          <div class="pagination">
            <el-pagination
              small
              background
              layout="prev, pager, next"
              :total="equipmentRanking.length"
              :page-size="equipmentRankingPageSize"
              :current-page="equipmentRankingPage"
              @current-change="(p) => equipmentRankingPage = p"
            />
          </div>
        </el-card>
        
        <el-card class="chart-card" v-if="timeDistributionData.length > 0">
          <template #header>
            <div class="chart-header">
              <el-icon :size="16" color="#67C23A">
                <Clock />
              </el-icon>
              <span>时间分布</span>
            </div>
          </template>
          <div ref="timeChart" class="chart-container time-chart"></div>
        </el-card>
      </div>
      
      <div class="chart-section-bottom" v-if="usageTrendData.length > 0">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <el-icon :size="16" color="#E6A23C">
                <TrendCharts />
              </el-icon>
              <span>使用趋势</span>
            </div>
          </template>
          <div ref="trendChart" class="chart-container trend-chart"></div>
        </el-card>
      </div>

      <!-- 暂无数据 -->
      <div v-if="!hasData && !loading" class="empty-section">
        <el-empty description="暂无数据" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Monitor, Clock, TrendCharts, Money, PieChart } from '@element-plus/icons-vue'
import { getTotalEquipment } from '@/api/equipmentOperation'
import { getDetailedList } from '@/api/dashboard'
import { ElMessage } from 'element-plus'
import { exportToExcel, exportMultiSheet } from '@/utils/export'
import { useUserStore } from '@/stores/user'
import { hasFullDataPermission } from '@/utils/auth'

const loading = ref(false)
const queryType = ref(0) // 0:实时, 1:按时段
const startDate = ref('')
const endDate = ref('')

// 用户信息和权限控制
const userStore = useUserStore()
const equipmentMap = ref({
  byId: new Map(),
  byName: new Map(),
  byCode: new Map()
})

// 仪器统计数据 - 严格按照接口提到的数据
const equipmentTotal = ref(null)
const machineHours = ref(null)
const internalMachineHours = ref(null) // 内部机时
const externalMachineHours = ref(null) // 外部机时
const usageCount = ref(null)
const internalUsageCount = ref(null) // 内部使用量
const externalUsageCount = ref(null) // 外部使用量
const sampleCount = ref(null) // 使用样品数
const materialCount = ref(null) // 使用耗材数
const income = ref(null)
const internalIncome = ref(null) // 内部收入
const externalIncome = ref(null) // 外部收入
const usageRate = ref(null)

// 图表数据
const equipmentRanking = ref([])
const equipmentRankingPage = ref(1)
const equipmentRankingPageSize = ref(8)
const equipmentRankingPaged = computed(() => {
  const start = (equipmentRankingPage.value - 1) * equipmentRankingPageSize.value
  return equipmentRanking.value.slice(start, start + equipmentRankingPageSize.value)
})
const timeDistributionData = ref([])
const usageTrendData = ref([])

const timeChart = ref(null)
const trendChart = ref(null)

// 是否有数据
const hasData = computed(() => {
  return equipmentTotal.value !== null || 
         machineHours.value !== null || 
         internalMachineHours.value !== null || 
         externalMachineHours.value !== null || 
         usageCount.value !== null || 
         internalUsageCount.value !== null || 
         externalUsageCount.value !== null || 
         sampleCount.value !== null || 
         materialCount.value !== null || 
         income.value !== null || 
         internalIncome.value !== null || 
         externalIncome.value !== null || 
         usageRate.value !== null
})

const hasChartData = computed(() => {
  return equipmentRanking.value.length > 0 || 
         timeDistributionData.value.length > 0 || 
         usageTrendData.value.length > 0
})

// 加载仪器映射表
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

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      type: queryType.value
    }
    
    // 如果是按时段查询，添加日期参数
    if (queryType.value === 1) {
      if (!startDate.value || !endDate.value) {
        ElMessage.warning('请选择开始日期和结束日期')
        return
      }
      if (startDate.value > endDate.value) {
        ElMessage.warning('开始日期不能大于结束日期')
        return
      }
      params.beginDate = startDate.value
      params.endDate = endDate.value
    }
    
    const res = await getTotalEquipment(params)
    
    if (res.code === '00000' || res.code === 0) {
      const data = res.data
      
      if (Array.isArray(data)) {
        assignArrayPayload(data)
      } else {
        const d = data || {}
        // 严格对齐接口示例字段
        equipmentTotal.value = d.num ?? null
        machineHours.value = d.tTime ?? null
        internalMachineHours.value = d.iTime ?? null
        externalMachineHours.value = d.oTime ?? null
        usageCount.value = d.tAmount ?? null
        internalUsageCount.value = d.iAmount ?? null
        externalUsageCount.value = d.oAmount ?? null
        sampleCount.value = d.sample ?? null
        materialCount.value = d.materials ?? null
        income.value = d.tIncome ?? null
        internalIncome.value = d.iIncome ?? null
        externalIncome.value = d.oIncome ?? null
        usageRate.value = d.usage ?? null
        
        // 图表与排名 - 添加权限过滤
        const hasFullPermission = hasFullDataPermission(userStore.userRole)
        let filteredRanking = d.eqRanking ?? []

        if (!hasFullPermission) {
          const allowedEquipmentIds = userStore.equipmentIds || []
          filteredRanking = filteredRanking.filter((item, index) => {
            // 通过名称或编号查找仪器ID
            let equipmentId = null
            if (item.name && equipmentMap.value.byName.has(item.name)) {
              equipmentId = equipmentMap.value.byName.get(item.name)
            } else if (item.code && equipmentMap.value.byCode.has(item.code)) {
              equipmentId = equipmentMap.value.byCode.get(item.code)
            }

            // 检查权限
            if (equipmentId) {
              const isAllowed = allowedEquipmentIds.includes(Number(equipmentId))
              if (index < 5) {
                console.log(`排名数据${index}: ${item.name} (ID: ${equipmentId}) - ${isAllowed ? '✅ 允许' : '❌ 拒绝'}`)
              }
              return isAllowed
            }
            return false
          })
        }

        equipmentRanking.value = filteredRanking
        timeDistributionData.value = d.distribution ?? []
        usageTrendData.value = d.trend ?? []
      }
      
      nextTick(() => {
        initCharts()
      })
      
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取仪器数据错误:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 获取排名样式类
const getRankClass = (index) => {
  if (index === 0) return 'rank-first'
  if (index === 1) return 'rank-second'
  if (index === 2) return 'rank-third'
  return 'rank-other'
}

// 获取使用量百分比
const getUsagePercentage = (item, rankingList) => {
  const usage = Number(item.usageCount ?? item.amount ?? item.count ?? 0) || 0
  const maxUsage = rankingList.reduce((max, it) => {
    const current = Number(it.usageCount ?? it.amount ?? it.count ?? 0) || 0
    return current > max ? current : max
  }, 0)
  
  return maxUsage > 0 ? Math.round((usage / maxUsage) * 100) : 0
}

// 获取进度条颜色
const getProgressColor = (index) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#909399', '#C0C4CC']
  return colors[index] || colors[colors.length - 1]
}

// 数值原样展示
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return String(num)
}

// 货币原样展示
const formatCurrency = (num) => {
  if (num === null || num === undefined) return '0'
  return String(num)
}

// 百分比原样展示
const formatPercent = (num) => {
  if (num === null || num === undefined) return '0'
  return String(num)
}

const assignArrayPayload = (arr) => {
  const sample = arr[0] || {}
  if ('equipmentName' in sample || 'equipmentId' in sample) {
    equipmentRanking.value = arr
  } else if ('hour' in sample || 'time' in sample || 'period' in sample) {
    timeDistributionData.value = arr
  } else if ('date' in sample || 'day' in sample) {
    usageTrendData.value = arr
  } else {
    equipmentRanking.value = arr
  }
}

// 初始化图表
const initCharts = () => {
  initTimeChart()
  initTrendChart()
}

const initTimeChart = () => {
  if (!timeChart.value || timeDistributionData.value.length === 0) return
  
  const chart = echarts.init(timeChart.value)
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: timeDistributionData.value.map(item => item.period || ''),
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      name: '使用量',
      nameTextStyle: {
        color: '#666'
      },
      axisLabel: {
        color: '#666'
      }
    },
    series: [{
      data: timeDistributionData.value.map(item => Number(item.amount ?? 0) || 0),
      type: 'bar',
      itemStyle: {
        color: '#409EFF'
      }
    }]
  }
  chart.setOption(option)
}

const initTrendChart = () => {
  if (!trendChart.value || usageTrendData.value.length === 0) return
  
  const chart = echarts.init(trendChart.value)
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        realtime: true,
        start: 0,
        end: 100,
        height: 24
      },
      {
        type: 'inside',
        realtime: true
      }
    ],
    xAxis: {
      type: 'category',
      data: usageTrendData.value.map(item => item.date || ''),
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      name: '使用趋势',
      nameTextStyle: {
        color: '#666'
      },
      axisLabel: {
        color: '#666'
      }
    },
    series: [{
      data: usageTrendData.value.map(item => Number(item.amount ?? 0) || 0),
      type: 'line',
      smooth: true,
      lineStyle: {
        color: '#67C23A',
        width: 2
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
          { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
        ])
      }
    }]
  }
  chart.setOption(option)
}

// 导出数据
const exportData = () => {
  // 验证是否有数据
  if (!hasData.value) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  try {
    // 1. 准备统计数据汇总
    const summaryData = []
    if (equipmentTotal.value !== null) summaryData.push({ '项目': '仪器总数', '数值': equipmentTotal.value })
    if (machineHours.value !== null) summaryData.push({ '项目': '总机时', '数值': machineHours.value })
    if (internalMachineHours.value !== null) summaryData.push({ '项目': '内部机时', '数值': internalMachineHours.value })
    if (externalMachineHours.value !== null) summaryData.push({ '项目': '外部机时', '数值': externalMachineHours.value })
    if (usageCount.value !== null) summaryData.push({ '项目': '总使用量', '数值': usageCount.value })
    if (internalUsageCount.value !== null) summaryData.push({ '项目': '内部使用量', '数值': internalUsageCount.value })
    if (externalUsageCount.value !== null) summaryData.push({ '项目': '外部使用量', '数值': externalUsageCount.value })
    if (sampleCount.value !== null) summaryData.push({ '项目': '使用样品数', '数值': sampleCount.value })
    if (materialCount.value !== null) summaryData.push({ '项目': '使用耗材数', '数值': materialCount.value })
    if (income.value !== null) summaryData.push({ '项目': '总收入', '数值': income.value })
    if (internalIncome.value !== null) summaryData.push({ '项目': '内部收入', '数值': internalIncome.value })
    if (externalIncome.value !== null) summaryData.push({ '项目': '外部收入', '数值': externalIncome.value })
    if (usageRate.value !== null) summaryData.push({ '项目': '使用率', '数值': usageRate.value + '%' })

    // 2. 准备仪器排名数据：添加排名序号
    const exportDataWithRank = equipmentRanking.value.map((item, index) => ({
      '排名': index + 1,
      '仪器名称': item.name || item.equipmentName || '未知仪器',
      '使用量': item.amount || item.usageCount || item.count || 0,
      '仪器ID': item.id || '-'
    }))

    // 3. 准备使用趋势数据
    const trendData = usageTrendData.value.map(item => ({
      '日期': item.date || '-',
      '使用量': item.amount || 0
    }))

    // 4. 定义列配置
    const summaryColumns = [
      { prop: '项目', label: '项目', width: 25 },
      { prop: '数值', label: '数值', width: 15 }
    ]

    const rankingColumns = [
      { prop: '排名', label: '排名', width: 12 },
      { prop: '仪器名称', label: '仪器名称', width: 35 },
      { prop: '使用量', label: '使用量', width: 15 },
      { prop: '仪器ID', label: '仪器ID', width: 12 }
    ]

    const trendColumns = [
      { prop: '日期', label: '日期', width: 15 },
      { prop: '使用量', label: '使用量', width: 15 }
    ]

    // 5. 生成文件名
    let filename = '仪器运营统计'
    if (queryType.value === 0) {
      // 实时查询
      filename += '_实时'
    } else if (queryType.value === 1 && startDate.value && endDate.value) {
      filename += `_${startDate.value}至${endDate.value}`
    }

    // 6. 准备导出的sheets
    const sheets = []
    
    if (summaryData.length > 0) {
      sheets.push({
        name: '统计汇总',
        data: summaryData,
        columns: summaryColumns
      })
    }
    
    if (exportDataWithRank.length > 0) {
      sheets.push({
        name: '仪器排名',
        data: exportDataWithRank,
        columns: rankingColumns
      })
    }
    
    if (trendData.length > 0) {
      sheets.push({
        name: '使用趋势',
        data: trendData,
        columns: trendColumns
      })
    }

    // 7. 调用多Sheet导出函数
    exportMultiSheet(sheets, filename)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  }
}

// 初始化
onMounted(async () => {
  // 先加载仪器映射表，再加载数据
  await fetchEquipmentMap()
  fetchData()
})
</script>

<style lang="scss" scoped>
.equipment-operation {
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #000000;
}

.filter-section {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-form {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);
  }
  
  .stat-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
  }
  
  .stat-icon {
    padding: 12px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .stat-info {
    flex: 1;
    min-width: 0;
  }
  
  .stat-title {
    font-size: 13px;
    color: #000000;
    margin-bottom: 6px;
    font-weight: 500;
  }
  
  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: #000000;
    line-height: 1.2;
    word-break: break-all;
  }
  
  .stat-unit {
    font-size: 12px;
    color: #666666;
    font-weight: 400;
    margin-left: 2px;
  }
}

.chart-section {
  display: grid;
  grid-template-columns: repeat(2, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.chart-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  
  .chart-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 500;
    color: #000000;
  }
  
  .chart-container {
    height: 320px;
    padding: 16px;
  }
  
  .time-chart {
    height: 460px;
  }
  
  .wide-chart {
    grid-column: 1 / -1;
  }
}

.chart-section-bottom {
  margin-top: 20px;
}

.chart-section-bottom .chart-card .trend-chart {
  height: 520px;
}

.ranking-list {
  padding: 8px 0;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f5f7fa;
    border-radius: 8px;
    transform: translateX(4px);
  }
}

.rank-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  color: #fff;
  flex-shrink: 0;
  
  &.rank-first {
    background-color: #f56c6c;
  }
  
  &.rank-second {
    background-color: #e6a23c;
  }
  
  &.rank-third {
    background-color: #67c23a;
  }
  
  &.rank-other {
    background-color: #909399;
  }
}

.equipment-info {
  flex: 1;
  min-width: 0;
  
  .equipment-name {
    font-size: 14px;
    font-weight: 500;
    color: #000000;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .equipment-usage {
    font-size: 12px;
    color: #666666;
  }
}

.usage-bar {
  width: 120px;
  flex-shrink: 0;
}

.empty-section {
  padding: 40px 0;
  text-align: center;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

// 添加页面整体样式优化
.equipment-operation {
  padding: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  min-height: calc(100vh - 40px);
}
</style>
const handleQueryTypeChange = () => {
  if (queryType.value === 0) {
    fetchData()
  }
}
