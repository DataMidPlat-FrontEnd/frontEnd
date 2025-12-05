<template>
  <div class="user-operation">
    <el-card class="main-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>用户运营</span>
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
              <el-icon :size="24" color="#409EFF">
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
              <el-icon :size="24" color="#67C23A">
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
              <el-icon :size="24" color="#E6A23C">
                <CreditCard />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">经费卡数</div>
              <div class="stat-value">{{ fundingCardCount }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="newUser !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #ffe6e6;">
              <el-icon :size="24" color="#F56C6C">
                <User />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">今日新增用户</div>
              <div class="stat-value">{{ newUser }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="bookingUser !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e6f7ff;">
              <el-icon :size="32" color="#409EFF">
                <User />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">总预约用户数</div>
              <div class="stat-value">{{ bookingUser }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="internalUser !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e1f3d8;">
              <el-icon :size="24" color="#529b2e">
                <User />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">内部用户数</div>
              <div class="stat-value">{{ internalUser }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="externalUser !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #fff2e6;">
              <el-icon :size="24" color="#d48806">
                <User />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">外部用户数</div>
              <div class="stat-value">{{ externalUser }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="internalGroup !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #fff7e6;">
              <el-icon :size="24" color="#d46b08">
                <Collection />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">内部课题组数</div>
              <div class="stat-value">{{ internalGroup }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="externalGroup !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #fffbe6;">
              <el-icon :size="24" color="#d4b106">
                <Collection />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">外部课题组数</div>
              <div class="stat-value">{{ externalGroup }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="internalCard !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #f6e6ff;">
              <el-icon :size="24" color="#722ed1">
                <CreditCard />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">内部经费卡数</div>
              <div class="stat-value">{{ internalCard }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="externalCard !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e6ffe6;">
              <el-icon :size="24" color="#389e0d">
                <CreditCard />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">外部经费卡数</div>
              <div class="stat-value">{{ externalCard }}</div>
            </div>
          </div>
        </el-card>
        
        <!-- 日活分类统计 -->
        <el-card class="stat-card" v-if="totalDailyActive !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #fff2e6;">
              <el-icon :size="32" color="#d46b08">
                <User />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">总日活</div>
              <div class="stat-value">{{ totalDailyActive }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="bookingDailyActive !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e6f7ff;">
              <el-icon :size="24" color="#1890ff">
                <User />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">预约系统日活</div>
              <div class="stat-value">{{ bookingDailyActive }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="trainingDailyActive !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #ffe6e6;">
              <el-icon :size="24" color="#ff4d4f">
                <User />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">培训系统日活</div>
              <div class="stat-value">{{ trainingDailyActive }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card" v-if="monitoringDailyActive !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #f6ffed;">
              <el-icon :size="24" color="#52c41a">
                <User />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">环境监测系统日活</div>
              <div class="stat-value">{{ monitoringDailyActive }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 图表区域 - 用户类型分布、各类日活走势 -->
      <div class="chart-section" v-if="hasChartData">
        <el-card class="chart-card" v-if="userTypeDistribution.length > 0">
          <template #header>
            <span>用户类型分布</span>
          </template>
          <div ref="typeChart" class="chart-container"></div>
        </el-card>
        
        <el-card class="chart-card" v-if="dailyActiveTrend.length > 0">
          <template #header>
            <span>总日活走势</span>
          </template>
          <div ref="trendChart" class="chart-container"></div>
        </el-card>
        
        <el-card class="chart-card" v-if="bookingTrend.length > 0">
          <template #header>
            <span>预约系统日活走势</span>
          </template>
          <div ref="bookingChart" class="chart-container"></div>
        </el-card>
        
        <el-card class="chart-card" v-if="trainTrend.length > 0">
          <template #header>
            <span>培训系统日活走势</span>
          </template>
          <div ref="trainingChart" class="chart-container"></div>
        </el-card>
        
        <el-card class="chart-card" v-if="monitorTrend.length > 0">
          <template #header>
            <span>环境监测系统日活走势</span>
          </template>
          <div ref="monitoringChart" class="chart-container"></div>
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
const queryType = ref(0)
const startDate = ref('')
const endDate = ref('')

// 用户统计数据 - 严格按照接口提到的数据
const userCount = ref(null)
const researchGroupCount = ref(null)
const fundingCardCount = ref(null)
const newUser = ref(null) // 今日新增用户数
const bookingUser = ref(null) // 总预约用户数
const internalUser = ref(null) // 内部用户数
const externalUser = ref(null) // 外部用户数
const internalGroup = ref(null) // 内部课题组数
const externalGroup = ref(null) // 外部课题组数
const internalCard = ref(null) // 内部经费卡数
const externalCard = ref(null) // 外部经费卡数

// 图表数据
const userTypeDistribution = ref([])
const dailyActiveTrend = ref([])

// 其他趋势数据
const monitorTrend = ref([])
const bookingTrend = ref([])
const trainTrend = ref([])

// 日活分类数据
const totalDailyActive = ref(null) // 总日活
const bookingDailyActive = ref(null) // 预约系统日活
const trainingDailyActive = ref(null) // 培训系统日活
const monitoringDailyActive = ref(null) // 环境监测系统日活

const typeChart = ref(null)
const trendChart = ref(null)
const bookingChart = ref(null)
const trainingChart = ref(null)
const monitoringChart = ref(null)

// 是否有数据
const hasData = computed(() => {
  return userCount.value !== null || 
         researchGroupCount.value !== null || 
         fundingCardCount.value !== null ||
         newUser.value !== null ||
         bookingUser.value !== null ||
         internalUser.value !== null ||
         externalUser.value !== null ||
         internalGroup.value !== null ||
         externalGroup.value !== null ||
         internalCard.value !== null ||
         externalCard.value !== null ||
         totalDailyActive.value !== null ||
         bookingDailyActive.value !== null ||
         trainingDailyActive.value !== null ||
         monitoringDailyActive.value !== null
})

const hasChartData = computed(() => {
  return userTypeDistribution.value.length > 0 || 
         dailyActiveTrend.value.length > 0
})

// 获取数据
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
    const params = { type: queryType.value }
    if (queryType.value === 1) {
      params.beginDate = startDate.value
      params.endDate = endDate.value
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
        newUser.value = data?.new ?? null
        bookingUser.value = data?.bUser ?? null
        internalUser.value = data?.iUser ?? null
        externalUser.value = data?.oUser ?? null
        internalGroup.value = data?.iGroup ?? null
        externalGroup.value = data?.oGroup ?? null
        internalCard.value = data?.iCard ?? null
        externalCard.value = data?.oCard ?? null
        
        // 日活分类数据
        totalDailyActive.value = data?.totalDailyActive ?? null
        bookingDailyActive.value = data?.bookingDailyActive ?? null
        trainingDailyActive.value = data?.trainingDailyActive ?? null
        monitoringDailyActive.value = data?.monitoringDailyActive ?? null
        
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
  initBookingChart()
  initTrainingChart()
  initMonitoringChart()
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

const initBookingChart = () => {
  if (!bookingChart.value || bookingTrend.value.length === 0) return
  
  const chart = echarts.init(bookingChart.value)
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: bookingTrend.value.map(item => item.date || item.time || item.day || ''),
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      name: '预约系统日活',
      nameTextStyle: {
        color: '#666'
      },
      axisLabel: {
        color: '#666'
      }
    },
    series: [{
      data: bookingTrend.value.map(item => Number(item.amount ?? item.activeCount ?? item.dailyActive ?? item.count ?? 0) || 0),
      type: 'line',
      smooth: true,
      lineStyle: {
        color: '#1890ff',
        width: 2
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
          { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
        ])
      }
    }]
  }
  chart.setOption(option)
}

const initTrainingChart = () => {
  if (!trainingChart.value || trainTrend.value.length === 0) return
  
  const chart = echarts.init(trainingChart.value)
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: trainTrend.value.map(item => item.date || item.time || item.day || ''),
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      name: '培训系统日活',
      nameTextStyle: {
        color: '#666'
      },
      axisLabel: {
        color: '#666'
      }
    },
    series: [{
      data: trainTrend.value.map(item => Number(item.amount ?? item.activeCount ?? item.dailyActive ?? item.count ?? 0) || 0),
      type: 'line',
      smooth: true,
      lineStyle: {
        color: '#ff4d4f',
        width: 2
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255, 77, 79, 0.3)' },
          { offset: 1, color: 'rgba(255, 77, 79, 0.1)' }
        ])
      }
    }]
  }
  chart.setOption(option)
}

const initMonitoringChart = () => {
  if (!monitoringChart.value || monitorTrend.value.length === 0) return
  
  const chart = echarts.init(monitoringChart.value)
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: monitorTrend.value.map(item => item.date || item.time || item.day || ''),
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      name: '环境监测系统日活',
      nameTextStyle: {
        color: '#666'
      },
      axisLabel: {
        color: '#666'
      }
    },
    series: [{
      data: monitorTrend.value.map(item => Number(item.amount ?? item.activeCount ?? item.dailyActive ?? item.count ?? 0) || 0),
      type: 'line',
      smooth: true,
      lineStyle: {
        color: '#52c41a',
        width: 2
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
          { offset: 1, color: 'rgba(82, 196, 26, 0.1)' }
        ])
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
      name: '总日活用户数',
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
      '内部': internalUser.value || 0,
      '外部': externalUser.value || 0
    }, {
      '统计项目': '课题组数',
      '总计': researchGroupCount.value || 0,
      '内部': internalGroup.value || 0,
      '外部': externalGroup.value || 0
    }, {
      '统计项目': '经费卡数',
      '总计': fundingCardCount.value || 0,
      '内部': internalCard.value || 0,
      '外部': externalCard.value || 0
    }, {
      '统计项目': '新增用户',
      '总计': newUser.value || 0,
      '内部': '-',
      '外部': '-'
    }, {
      '统计项目': '预约用户',
      '总计': bookingUser.value || 0,
      '内部': '-',
      '外部': '-'
    }, {
      '统计项目': '总日活',
      '总计': totalDailyActive.value || 0,
      '内部': '-',
      '外部': '-'
    }, {
      '统计项目': '预约系统日活',
      '总计': bookingDailyActive.value || 0,
      '内部': '-',
      '外部': '-'
    }, {
      '统计项目': '培训系统日活',
      '总计': trainingDailyActive.value || 0,
      '内部': '-',
      '外部': '-'
    }, {
      '统计项目': '环境监测系统日活',
      '总计': monitoringDailyActive.value || 0,
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
    } else if (queryType.value === 1 && startDate.value && endDate.value) {
      filename += `_${startDate.value}至${endDate.value}`
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
  fetchData()
})

const handleQueryTypeChange = () => {
  if (queryType.value === 0) {
    fetchData()
  }
}
</script>

<style lang="scss" scoped>
.main-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
.user-operation {
  padding: 16px;
  background-color: #ffffff;
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
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.filter-form {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
  
  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
  }
  
  .stat-icon {
    padding: 12px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }
  
  .stat-info {
    flex: 1;
  }
  
  .stat-title {
    font-size: 14px;
    color: #000000;
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #000000;
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
