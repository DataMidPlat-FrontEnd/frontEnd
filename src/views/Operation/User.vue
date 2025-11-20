<template>
  <div class="user-operation">
    <el-card class="page-header" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>用户运营</span>
          <el-button type="primary" plain @click="exportData">导出报表</el-button>
        </div>
      </template>
      
      <!-- 查询条件 -->
      <div class="filter-section">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="查询类型">
            <el-select v-model="queryType" style="width: 120px">
              <el-option :value="0" label="实时" />
              <el-option :value="1" label="按时段" />
            </el-select>
          </el-form-item>
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
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="fetchData">
              查询
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 统计卡片区域 - 只展示接口提到的数据 -->
      <div class="stats-grid">
        <el-card class="stat-card" v-if="userCount !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e6f2ff;">
              <el-icon :size="32" color="#409EFF">
                <User />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">用户数</div>
              <div class="stat-value">{{ userCount }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="researchGroupCount !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #f0f9e6;">
              <el-icon :size="32" color="#67C23A">
                <Collection />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">课题组数</div>
              <div class="stat-value">{{ researchGroupCount }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="fundingCardCount !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #fdf6e6;">
              <el-icon :size="32" color="#E6A23C">
                <CreditCard />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">经费卡数</div>
              <div class="stat-value">{{ fundingCardCount }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 图表区域 - 用户类型分布、日活走势 -->
      <div class="chart-section" v-if="hasChartData">
        <el-card class="chart-card" v-if="userTypeDistribution.length > 0">
          <template #header>
            <span>用户类型分布</span>
          </template>
          <div ref="typeChart" class="chart-container"></div>
        </el-card>
        
        <el-card class="chart-card" v-if="dailyActiveTrend.length > 0">
          <template #header>
            <span>日活走势</span>
          </template>
          <div ref="trendChart" class="chart-container"></div>
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
import { User, Collection, CreditCard } from '@element-plus/icons-vue'
import { getTotalUser } from '@/api/userOperation'
import { ElMessage } from 'element-plus'
import { exportMultiSheet } from '@/utils/export'

const loading = ref(false)
const queryType = ref(0) // 0:实时, 1:按时段
const dateRange = ref([])

// 用户统计数据 - 严格按照接口提到的数据
const userCount = ref(null)
const researchGroupCount = ref(null)
const fundingCardCount = ref(null)

// 图表数据
const userTypeDistribution = ref([])
const dailyActiveTrend = ref([])

// 其他趋势数据
const monitorTrend = ref([])
const bookingTrend = ref([])
const trainTrend = ref([])

// 其他统计数据
const bUser = ref(null)
const newUser = ref(null)
const iUser = ref(null)
const oUser = ref(null)
const iGroup = ref(null)
const oGroup = ref(null)
const iCard = ref(null)
const oCard = ref(null)

const typeChart = ref(null)
const trendChart = ref(null)

// 是否有数据
const hasData = computed(() => {
  return userCount.value !== null || 
         researchGroupCount.value !== null || 
         fundingCardCount.value !== null
})

const hasChartData = computed(() => {
  return userTypeDistribution.value.length > 0 || 
         dailyActiveTrend.value.length > 0
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      type: queryType.value
    }
    
    // 如果是按时段查询，添加日期参数
    if (queryType.value === 1 && dateRange.value && dateRange.value.length === 2) {
      params.beginDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    const res = await getTotalUser(params)
    
    if (res.code === '00000' || res.code === 0) {
      const data = res.data
      
      if (Array.isArray(data)) {
        const sample = data[0] || {}
        if ('typeName' in sample || 'userType' in sample || 'type' in sample) {
          userTypeDistribution.value = data
        } else if ('date' in sample || 'day' in sample || 'time' in sample) {
          dailyActiveTrend.value = data
        }
      } else {
        userCount.value = data?.tUser ?? null
        researchGroupCount.value = data?.tGroup ?? null
        fundingCardCount.value = data?.tCard ?? null
        
        // 其他统计数据
        bUser.value = data?.bUser ?? null
        newUser.value = data?.new ?? null
        iUser.value = data?.iUser ?? null
        oUser.value = data?.oUser ?? null
        iGroup.value = data?.iGroup ?? null
        oGroup.value = data?.oGroup ?? null
        iCard.value = data?.iCard ?? null
        oCard.value = data?.oCard ?? null
        
        // 图表数据
        userTypeDistribution.value = data?.userType ?? []
        dailyActiveTrend.value = data?.tTrend ?? []
        
        // 趋势数据
        monitorTrend.value = data?.monitorTrend ?? []
        bookingTrend.value = data?.bookingTrend ?? []
        trainTrend.value = data?.trainTrend ?? []
      }
      
      nextTick(() => {
        initCharts()
      })
      
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取用户数据错误:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 初始化图表
const initCharts = () => {
  initTypeChart()
  initTrendChart()
}

const initTypeChart = () => {
  if (!typeChart.value || userTypeDistribution.value.length === 0) return
  
  const chart = echarts.init(typeChart.value)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      name: '用户类型',
      type: 'pie',
      radius: '50%',
      data: userTypeDistribution.value.map(item => ({
        name: item.typeName || item.userType || item.type || item.name || '未知类型',
        value: Number(item.amount ?? item.count ?? item.userCount ?? item.value ?? 0) || 0
      })),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
  chart.setOption(option)
}

const initTrendChart = () => {
  if (!trendChart.value || dailyActiveTrend.value.length === 0) return
  
  const chart = echarts.init(trendChart.value)
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: dailyActiveTrend.value.map(item => item.date || item.time || item.day || ''),
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      name: '日活用户数',
      nameTextStyle: {
        color: '#666'
      },
      axisLabel: {
        color: '#666'
      }
    },
    series: [{
      data: dailyActiveTrend.value.map(item => Number(item.amount ?? item.activeCount ?? item.dailyActive ?? item.count ?? 0) || 0),
      type: 'line',
      smooth: true,
      lineStyle: {
        color: '#409EFF',
        width: 2
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
        ])
      }
    }]
  }
  chart.setOption(option)
}

// 导出数据
const exportData = () => {
  // 验证是否有数据
  if (!userCount.value && !researchGroupCount.value && !fundingCardCount.value) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  try {
    // 1. 准备用户统计汇总数据
    const summaryData = [{
      '统计项目': '用户数',
      '总计': userCount.value || 0,
      '内部': iUser.value || 0,
      '外部': oUser.value || 0
    }, {
      '统计项目': '课题组数',
      '总计': researchGroupCount.value || 0,
      '内部': iGroup.value || 0,
      '外部': oGroup.value || 0
    }, {
      '统计项目': '经费卡数',
      '总计': fundingCardCount.value || 0,
      '内部': iCard.value || 0,
      '外部': oCard.value || 0
    }, {
      '统计项目': '新增用户',
      '总计': newUser.value || 0,
      '内部': '-',
      '外部': '-'
    }, {
      '统计项目': '活跃用户',
      '总计': bUser.value || 0,
      '内部': '-',
      '外部': '-'
    }]

    // 2. 准备用户类型分布数据
    const userTypeData = userTypeDistribution.value.map(item => ({
      '用户类型': item.type || item.typeName || item.userType || '未知类型',
      '数量': item.amount || item.count || 0
    }))

    // 3. 准备日活走势数据
    const dailyTrendData = dailyActiveTrend.value.map(item => ({
      '日期': item.date || '-',
      '活跃用户数': item.amount || 0
    }))

    // 4. 准备监控趋势数据
    const monitorTrendData = monitorTrend.value.map(item => ({
      '日期': item.date || '-',
      '监控数': item.amount || 0
    }))

    // 5. 准备预约趋势数据
    const bookingTrendData = bookingTrend.value.map(item => ({
      '日期': item.date || '-',
      '预约数': item.amount || 0
    }))

    // 6. 准备培训趋势数据
    const trainTrendData = trainTrend.value.map(item => ({
      '日期': item.date || '-',
      '培训数': item.amount || 0
    }))

    // 7. 定义列配置
    const summaryColumns = [
      { prop: '统计项目', label: '统计项目', width: 15 },
      { prop: '总计', label: '总计', width: 12 },
      { prop: '内部', label: '内部', width: 12 },
      { prop: '外部', label: '外部', width: 12 }
    ]

    const userTypeColumns = [
      { prop: '用户类型', label: '用户类型', width: 20 },
      { prop: '数量', label: '数量', width: 12 }
    ]

    const trendColumns = [
      { prop: '日期', label: '日期', width: 15 },
      { prop: '数量', label: '数量', width: 12 }
    ]

    const dailyTrendColumns = [
      { prop: '日期', label: '日期', width: 15 },
      { prop: '活跃用户数', label: '活跃用户数', width: 15 }
    ]

    const monitorTrendColumns = [
      { prop: '日期', label: '日期', width: 15 },
      { prop: '监控数', label: '监控数', width: 12 }
    ]

    const bookingTrendColumns = [
      { prop: '日期', label: '日期', width: 15 },
      { prop: '预约数', label: '预约数', width: 12 }
    ]

    const trainTrendColumns = [
      { prop: '日期', label: '日期', width: 15 },
      { prop: '培训数', label: '培训数', width: 12 }
    ]

    // 8. 生成文件名
    let filename = '用户运营统计'
    if (queryType.value === 0) {
      filename += '_实时'
    } else if (queryType.value === 1 && dateRange.value && dateRange.value.length === 2) {
      filename += `_${dateRange.value[0]}至${dateRange.value[1]}`
    }

    // 9. 构建 Sheet 数组
    const sheets = [
      {
        name: '统计汇总',
        data: summaryData,
        columns: summaryColumns
      }
    ]

    // 只有有数据时才添加对应的 Sheet
    if (userTypeData.length > 0) {
      sheets.push({
        name: '用户类型分布',
        data: userTypeData,
        columns: userTypeColumns
      })
    }

    if (dailyTrendData.length > 0) {
      sheets.push({
        name: '日活走势',
        data: dailyTrendData,
        columns: dailyTrendColumns
      })
    }

    if (monitorTrendData.length > 0) {
      sheets.push({
        name: '监控趋势',
        data: monitorTrendData,
        columns: monitorTrendColumns
      })
    }

    if (bookingTrendData.length > 0) {
      sheets.push({
        name: '预约趋势',
        data: bookingTrendData,
        columns: bookingTrendColumns
      })
    }

    if (trainTrendData.length > 0) {
      sheets.push({
        name: '培训趋势',
        data: trainTrendData,
        columns: trainTrendColumns
      })
    }

    // 10. 调用多Sheet导出函数
    exportMultiSheet(sheets, filename)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  }
}

// 初始化
onMounted(() => {
  // 设置默认日期范围（最近30天）
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  
  dateRange.value = [
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  ]
  
  // 加载数据
  fetchData()
})
</script>

<style lang="scss" scoped>
.user-operation {
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
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.filter-form {
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
  }
  
  .stat-icon {
    padding: 16px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .stat-info {
    flex: 1;
  }
  
  .stat-title {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
  }
}

.chart-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.chart-card {
  .chart-container {
    height: 300px;
  }
}

.empty-section {
  padding: 60px 0;
  text-align: center;
}
</style>