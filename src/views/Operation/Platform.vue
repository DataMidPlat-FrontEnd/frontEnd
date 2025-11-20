<template>
  <div class="platform-operation">
    <el-card class="page-header" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>平台运营</span>
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
      <div class="stats-grid" v-if="platformTotal !== null">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e6f2ff;">
              <el-icon :size="32" color="#409EFF">
                <View />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">平台总数</div>
              <div class="stat-value">{{ platformTotal }}</div>
            </div>
          </div>
>
        </el-card>
      </div>

      <!-- 平台使用排名 -->
      <div class="ranking-section" v-if="platformRanking.length > 0">
        <el-card>
          <template #header>
            <span>平台使用排名</span>
          </template>
          <div class="ranking-list">
            <div 
              v-for="(item, index) in platformRankingPaged" 
              :key="item.platformId || item.id || index"
              class="ranking-item"
            >
              <div class="rank-number" :class="getRankClass(((platformRankingPage - 1) * platformRankingPageSize) + index)">
                {{ ((platformRankingPage - 1) * platformRankingPageSize) + index + 1 }}
              </div>
              <div class="platform-info">
                <div class="platform-name">{{ item.platformName || item.name || '未知平台' }}</div>
                <div class="platform-usage">使用量: {{ item.usageCount || item.amount || item.count || 0 }}</div>
              </div>
              <div class="usage-bar">
                <el-progress 
                  :percentage="getUsagePercentage(item, index)" 
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
              :total="platformRanking.length"
              :page-size="platformRankingPageSize"
              :current-page="platformRankingPage"
              @current-change="(p) => platformRankingPage = p"
            />
          </div>
        </el-card>
      </div>

      <!-- 暂无数据 -->
      <div v-if="platformTotal === null && platformRanking.length === 0 && !loading" class="empty-section">
        <el-empty description="暂无数据" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { View } from '@element-plus/icons-vue'
import { getTotalPlatform } from '@/api/operation'
import { ElMessage } from 'element-plus'
import { exportToExcel } from '@/utils/export'

const loading = ref(false)
const queryType = ref(0) // 0:实时, 1:按时段
const dateRange = ref([])

// 平台总数
const platformTotal = ref(null)

// 平台使用排名
const platformRanking = ref([])
const platformRankingPage = ref(1)
const platformRankingPageSize = ref(10)
const platformRankingPaged = computed(() => {
  const start = (platformRankingPage.value - 1) * platformRankingPageSize.value
  return platformRanking.value.slice(start, start + platformRankingPageSize.value)
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
    
    const res = await getTotalPlatform(params)
    
    if (res.code === '00000' || res.code === 0) {
      const data = res.data
      
      if (Array.isArray(data)) {
        platformTotal.value = data.length
        platformRanking.value = data
      } else {
        platformTotal.value = (data && (data.totalPlatformCount || data.totalCount || data.platformTotal)) ?? null
        platformRanking.value = (data && (data.platformRankingList || data.platformRanking || data.rankingList)) || []
      }
      
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取平台数据错误:', error)
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

// 获取使用量百分比（用于进度条）
const getUsagePercentage = (item, index) => {
  const usage = item.usageCount || item.amount || item.count || 0
  const maxUsage = platformRanking.value.reduce((max, item) => {
    const current = item.usageCount || item.amount || item.count || 0
    return current > max ? current : max
  }, 0)
  
  return maxUsage > 0 ? Math.round((usage / maxUsage) * 100) : 0
}

// 获取进度条颜色
const getProgressColor = (index) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#909399', '#C0C4CC']
  return colors[index] || colors[colors.length - 1]
}

// 导出数据
const exportData = () => {
  // 验证是否有数据
  if (!platformRanking.value || platformRanking.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  try {
    // 准备导出数据：添加排名序号
    const exportDataWithRank = platformRanking.value.map((item, index) => ({
      '排名': index + 1,
      '平台名称': item.name || item.platformName || '未知平台',
      '使用量': item.amount || item.usageCount || item.count || 0,
      '平台ID': item.id || '-'
    }))

    // 定义列配置
    const columns = [
      { prop: '排名', label: '排名', width: 12 },
      { prop: '平台名称', label: '平台名称', width: 25 },
      { prop: '使用量', label: '使用量', width: 15 },
      { prop: '平台ID', label: '平台ID', width: 12 }
    ]

    // 生成文件名
    let filename = '平台运营统计'
    if (queryType.value === 0) {
      // 实时查询
      filename += '_实时'
    } else if (queryType.value === 1 && dateRange.value && dateRange.value.length === 2) {
      // 时段查询
      filename += `_${dateRange.value[0]}至${dateRange.value[1]}`
    }

    // 调用导出函数
    exportToExcel(exportDataWithRank, columns, filename)
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
.platform-operation {
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
    font-size: 32px;
    font-weight: 600;
    color: #303133;
  }
}

.ranking-section {
  margin-top: 20px;
}

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

.platform-info {
  flex: 1;
  
  .platform-name {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 4px;
  }
  
  .platform-usage {
    font-size: 14px;
    color: #909399;
  }
}

.usage-bar {
  width: 200px;
}

.empty-section {
  padding: 60px 0;
  text-align: center;
}
</style>