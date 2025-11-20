<template>
  <div class="training-operation">
    <el-card class="page-header" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>培训运营</span>
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
        <el-card class="stat-card" v-if="trainingCount !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e6f2ff;">
              <el-icon :size="32" color="#409EFF">
                <Reading />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">培训场数</div>
              <div class="stat-value">{{ trainingCount }}</div>
            </div>
          </div>
>
        </el-card>
        
        <el-card class="stat-card" v-if="trainingPeopleCount !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #f0f9e6;">
              <el-icon :size="32" color="#67C23A">
                <User />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">培训人数</div>
              <div class="stat-value">{{ trainingPeopleCount }}</div>
            </div>
          </div>
>
        </el-card>
        
        <el-card class="stat-card" v-if="trainingPassRate !== null">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #fdf6e6;">
              <el-icon :size="32" color="#E6A23C">
                <Trophy />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">培训通过率</div>
              <div class="stat-value">{{ trainingPassRate }}</div>
            </div>
          </div>
>
        </el-card>
      </div>

      <!-- 排名区域 - 平台培训量排名、仪器培训量排名 -->
      <div class="ranking-section" v-if="hasRankingData">
        <el-card class="ranking-card" v-if="platformTrainingRanking.length > 0">
          <template #header>
            <span>平台培训量排名</span>
          </template>
          <div class="ranking-list">
            <div 
              v-for="(item, index) in platformTrainingRankingPaged" 
              :key="item.id || item.platformId || index"
              class="ranking-item"
            >
              <div class="rank-number" :class="getRankClass(((platformRankingPage - 1) * platformRankingPageSize) + index)">
                {{ ((platformRankingPage - 1) * platformRankingPageSize) + index + 1 }}
              </div>
              <div class="training-info">
                <div class="training-name">{{ item.platformName || item.name || '未知平台' }}</div>
                <div class="training-count">培训量: {{ item.trainingCount || item.amount || item.count || 0 }}</div>
              </div>
              <div class="usage-bar">
                <el-progress 
                  :percentage="getUsagePercentage(item, platformTrainingRanking)" 
                  :color="getProgressColor(((platformRankingPage - 1) * platformRankingPageSize) + index)"
                  :show-text="false"
                />
              </div>
            </div>
          </div>
          <div class="pagination">
            <el-pagination
              background
              layout="prev, pager, next"
              :total="platformTrainingRanking.length"
              :page-size="platformRankingPageSize"
              :current-page="platformRankingPage"
              @current-change="(p) => platformRankingPage = p"
            />
          </div>
>
        </el-card>
        
        <el-card class="ranking-card" v-if="equipmentTrainingRanking.length > 0">
          <template #header>
            <span>仪器培训量排名</span>
          </template>
          <div class="ranking-list">
            <div 
              v-for="(item, index) in equipmentTrainingRankingPaged" 
              :key="item.id || item.equipmentId || index"
              class="ranking-item"
            >
              <div class="rank-number" :class="getRankClass(((equipmentRankingPage - 1) * equipmentRankingPageSize) + index)">
                {{ ((equipmentRankingPage - 1) * equipmentRankingPageSize) + index + 1 }}
              </div>
              <div class="training-info">
                <div class="training-name">{{ item.equipmentName || item.name || '未知仪器' }}</div>
                <div class="training-count">培训量: {{ item.trainingCount || item.count || 0 }}</div>
              </div>
              <div class="usage-bar">
                <el-progress 
                  :percentage="getUsagePercentage(item, equipmentTrainingRanking)" 
                  :color="getProgressColor(((equipmentRankingPage - 1) * equipmentRankingPageSize) + index)"
                  :show-text="false"
                />
              </div>
            </div>
          </div>
          <div class="pagination">
            <el-pagination
              background
              layout="prev, pager, next"
              :total="equipmentTrainingRanking.length"
              :page-size="equipmentRankingPageSize"
              :current-page="equipmentRankingPage"
              @current-change="(p) => equipmentRankingPage = p"
            />
          </div>
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
import { ref, onMounted, computed } from 'vue'
import { Reading, User, Trophy } from '@element-plus/icons-vue'
import { getTotalTraining } from '@/api/trainingOperation'
import { ElMessage } from 'element-plus'
import { exportMultiSheet } from '@/utils/export'

const loading = ref(false)
const queryType = ref(0) // 0:实时, 1:按时段
const dateRange = ref([])

// 培训统计数据 - 严格按照接口提到的数据
const trainingCount = ref(null)
const trainingPeopleCount = ref(null)
const trainingPassRate = ref(null)

// 排名数据
const platformTrainingRanking = ref([])
const platformRankingPage = ref(1)
const platformRankingPageSize = ref(8)
const platformTrainingRankingPaged = computed(() => {
  const start = (platformRankingPage.value - 1) * platformRankingPageSize.value
  return platformTrainingRanking.value.slice(start, start + platformRankingPageSize.value)
})

const equipmentTrainingRanking = ref([])
const equipmentRankingPage = ref(1)
const equipmentRankingPageSize = ref(8)
const equipmentTrainingRankingPaged = computed(() => {
  const start = (equipmentRankingPage.value - 1) * equipmentRankingPageSize.value
  return equipmentTrainingRanking.value.slice(start, start + equipmentRankingPageSize.value)
})

// 是否有数据
const hasData = computed(() => {
  return trainingCount.value !== null || 
         trainingPeopleCount.value !== null || 
         trainingPassRate.value !== null
})

const hasRankingData = computed(() => {
  return platformTrainingRanking.value.length > 0 || 
         equipmentTrainingRanking.value.length > 0
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
    
    const res = await getTotalTraining(params)
    
    if (res.code === '00000' || res.code === 0) {
      const data = res.data
      
      if (Array.isArray(data)) {
        const sample = data[0] || {}
        if ('equipmentName' in sample || 'equipmentId' in sample) {
          equipmentTrainingRanking.value = data
        } else {
          platformTrainingRanking.value = data
        }
      } else {
        trainingCount.value = data?.train ?? null
        trainingPeopleCount.value = data?.trainUser ?? null
        trainingPassRate.value = data?.trainPass ?? null
        
        platformTrainingRanking.value = data?.platformRanking ?? []
        equipmentTrainingRanking.value = data?.eqRanking ?? []
      }
      
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取培训数据错误:', error)
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
  const count = Number(item.trainingCount ?? item.amount ?? item.count ?? 0) || 0
  const maxCount = rankingList.reduce((max, it) => {
    const current = Number(it.trainingCount ?? it.amount ?? it.count ?? 0) || 0
    return current > max ? current : max
  }, 0)
  
  return maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
}

// 获取进度条颜色
const getProgressColor = (index) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#909399', '#C0C4CC']
  return colors[index] || colors[colors.length - 1]
}

// 导出数据
const exportData = () => {
  if (!trainingCount.value && !trainingPeopleCount.value && !trainingPassRate.value) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  try {
    // 1. 统计汇总数据
    const summaryData = [
      { '统计项目': '培训场数', '数值': trainingCount.value || 0 },
      { '统计项目': '培训人数', '数值': trainingPeopleCount.value || 0 },
      { '统计项目': '培训通过率(%)', '数值': trainingPassRate.value || 0 }
    ]

    // 2. 仪器培训排名数据
    const equipmentData = equipmentTrainingRanking.value.map((item, index) => ({
      '排名': index + 1,
      '仪器名称': item.name || '未知仪器',
      '培训量': item.amount || 0,
      '培训人数': item.users || 0
    }))

    // 3. 列配置
    const summaryColumns = [
      { prop: '统计项目', label: '统计项目', width: 20 },
      { prop: '数值', label: '数值', width: 15 }
    ]

    const equipmentColumns = [
      { prop: '排名', label: '排名', width: 12 },
      { prop: '仪器名称', label: '仪器名称', width: 40 },
      { prop: '培训量', label: '培训量', width: 15 },
      { prop: '培训人数', label: '培训人数', width: 15 }
    ]

    // 4. 生成文件名
    let filename = '培训运营统计'
    if (queryType.value === 0) {
      filename += '_实时'
    } else if (queryType.value === 1 && dateRange.value?.length === 2) {
      filename += `_${dateRange.value[0]}至${dateRange.value[1]}`
    }

    // 5. 构建Sheet数组
    const sheets = [
      {
        name: '统计汇总',
        data: summaryData,
        columns: summaryColumns
      }
    ]

    if (equipmentData.length > 0) {
      sheets.push({
        name: '仪器培训排名',
        data: equipmentData,
        columns: equipmentColumns
      })
    }

    // 6. 导出
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
.training-operation {
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

.ranking-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.ranking-card {
  .ranking-list {
    padding: 16px 0;
  }
  
  .ranking-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background-color: #f5f7fa;
      border-radius: 8px;
    }
  }
  
  .rank-number {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    color: #fff;
    
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
  
  .training-info {
    flex: 1;
    
    .training-name {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 4px;
    }
    
    .training-count {
      font-size: 14px;
      color: #909399;
    }
  }
  
  .usage-bar {
    width: 200px;
  }
}

.empty-section {
  padding: 60px 0;
  text-align: center;
}
</style>