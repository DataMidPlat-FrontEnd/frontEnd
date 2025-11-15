<template>
  <div class="entities-container">
    <!-- 背景动画层 -->
    <div class="bg-animation">
      <div class="bg-gradient"></div>
      <div class="grid-lines">
        <div v-for="i in 20" :key="`h-${i}`" class="grid-line horizontal" :style="{ top: `${i * 5}%` }"></div>
        <div v-for="i in 20" :key="`v-${i}`" class="grid-line vertical" :style="{ left: `${i * 5}%` }"></div>
      </div>
      <div class="particles">
        <div v-for="i in 30" :key="`p-${i}`" class="particle" :style="getParticleStyle(i)"></div>
      </div>
    </div>

    <!-- 详情卡片 -->
    <div class="entities-box">
      <div class="corner-decoration tl"></div>
      <div class="corner-decoration tr"></div>
      <div class="corner-decoration bl"></div>
      <div class="corner-decoration br"></div>

      <div class="box-header">
        <div class="logo-wrapper">
          <div class="logo-icon">
            <el-icon :size="48"><DataAnalysis /></el-icon>
          </div>
          <div class="logo-glow"></div>
        </div>
        <h1 class="title">仪器详情</h1>
        <p class="subtitle">EQUIPMENT DETAIL</p>
        <div class="title-divider"></div>
      </div>

      <div class="detail-content">
        <!-- 使用信息（仅 bookingData） -->
        <div class="section-card">
          <div class="section-header">
            <h3>仪器使用信息</h3>
            <div class="header-line"></div>
          </div>
          <div class="card-body">
            <div class="filter-bar" style="margin-bottom: 12px">
              <el-input v-model="id" placeholder="仪器ID" style="max-width: 220px" clearable />
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="max-width: 380px"
              />
              <el-button type="primary" :loading="loading" @click="loadBookingUsage">查询</el-button>
            </div>

            <div v-if="bookingList.length === 0" class="empty-state">
              <el-icon class="empty-icon"><DocumentRemove /></el-icon>
              <p>暂无预约/使用记录</p>
            </div>
            <div v-else class="table-wrapper">
              <table class="tech-table">
                <thead>
                  <tr>
                    <th>预约ID</th>
                    <th>预约人</th>
                    <th>预约时段</th>
                    <th>上机时间</th>
                    <th>下机时间</th>
                    <th>预约类型</th>
                    <th>订单状态</th>
                    <th>总费用(元)</th>
                    <th>测试费(元)</th>
                    <th>耗材费(元)</th>
                    <th>上机截图</th>
                    <th>下机截图</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="b in bookingList" :key="b.id">
                    <td>{{ b.id }}</td>
                    <td>{{ b.name }}</td>
                    <td>{{ b.bookingTime }}</td>
                    <td>{{ b.beginTime }}</td>
                    <td>{{ b.endTime }}</td>
                    <td>{{ b.type }}</td>
                    <td>{{ b.status }}</td>
                    <td>{{ b.cost }}</td>
                    <td>{{ b.testCost }}</td>
                    <td>{{ b.materialsCost }}</td>
                    <td><a v-if="b.beginImgUrl" :href="stripBackticks(b.beginImgUrl)" target="_blank">查看</a><span v-else>—</span></td>
                    <td><a v-if="b.endImgUrl" :href="stripBackticks(b.endImgUrl)" target="_blank">查看</a><span v-else>—</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="actions">
              <button class="back-button" @click="goBack">
                <el-icon><Back /></el-icon>
                <span>返回</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DocumentRemove, Back, DataAnalysis } from '@element-plus/icons-vue'
import { getBookingData } from '@/api/entities'

// 路由与参数
const route = useRoute()
const router = useRouter()
const id = ref(String(route.params.id || ''))

// 数据
const bookingList = ref([])
const dateRange = ref([])
const loading = ref(false)

// 科技风粒子
const getParticleStyle = (index) => {
  const size = Math.random() * 4 + 2
  const left = Math.random() * 100
  const animationDuration = Math.random() * 20 + 10
  const animationDelay = Math.random() * 5
  return { width: `${size}px`, height: `${size}px`, left: `${left}%`, animationDuration: `${animationDuration}s`, animationDelay: `${animationDelay}s` }
}
const goBack = () => router.back()

// URL 清理
const stripBackticks = (url) => String(url || '').replace(/`/g, '').trim()

// 修复：按文档传参 { id, type, beginDate, endDate }，默认 type=1（近30天）
const loadBookingUsage = async () => {
  const eqId = stripBackticks(id.value)
  if (!eqId) { bookingList.value = []; return }
  loading.value = true
  try {
    let beginDate, endDate
    if (Array.isArray(dateRange.value) && dateRange.value.length === 2) {
      beginDate = dateRange.value[0]
      endDate = dateRange.value[1]
    } else {
      const end = new Date()
      const begin = new Date(end.getTime() - 29 * 24 * 3600 * 1000)
      const fmt = (d) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
      beginDate = fmt(begin)
      endDate = fmt(end)
      dateRange.value = [beginDate, endDate]
    }

    const res = await getBookingData({
      id: eqId,
      type: 1,
      beginDate,
      endDate
    })
    bookingList.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    bookingList.value = []
    console.error('bookingData 加载失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBookingUsage()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
.entities-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: $bg-page;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
}

.bg-animation { display: none; }

@keyframes gradientShift {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}
@keyframes particleFloat {
  0% { transform: translateY(0); opacity: 0.3; }
  50% { transform: translateY(-20px); opacity: 0.6; }
  100% { transform: translateY(0); opacity: 0.3; }
}

.entities-box {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 100%;
  margin-top: 10px;
  border-radius: 16px;
  background: $bg-color;
  border: 1px solid $border-light;
  box-shadow: $box-shadow-light;
  overflow: hidden;
  padding-bottom: 24px;

  .corner-decoration {
    position: absolute;
    width: 18px; height: 18px;
    border: 2px solid #00d4ff; border-radius: 4px;
    box-shadow: 0 0 16px rgba(0, 212, 255, 0.5);
    &.tl { top: 10px; left: 10px; }
    &.tr { top: 10px; right: 10px; }
    &.bl { bottom: 10px; left: 10px; }
    &.br { bottom: 10px; right: 10px; }
  }

  .box-header { display: none; }

  .detail-content {
    padding: 0 24px 24px;
  }
}

.section-card {
  margin-top: 16px;
  background: $bg-color;
  border-radius: 12px;
  border: 1px solid $border-light;
  box-shadow: $box-shadow-light;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover { transform: translateY(-1px); }

  .section-header {
    display: flex; align-items: center; gap: 12px; padding: 16px 22px;
    background: $bg-color; border-bottom: 1px solid $border-light;
    h3 { font-size: 16px; font-weight: 600; color: $text-primary; margin: 0; letter-spacing: 0.5px; }
    .header-line { display: none; }
  }

  .card-body {
    padding: 22px;

    .filter-bar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: $text-regular; .empty-icon { font-size: 42px; color: $primary-color; } }

    .table-wrapper { overflow-x: auto; }
    .tech-table { width: 100%; border-collapse: collapse; color: $text-primary; th, td { border-bottom: 1px solid $border-light; padding: 12px; text-align: left; } th { color: $text-regular; font-weight: 600; } }
  }
}

.actions {
  display: flex; justify-content: flex-end; padding: 8px 24px 24px;

  .back-button {
    display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px;
    background: $primary-color;
    border: 1px solid transparent; border-radius: 8px; color: #ffffff;
    font-size: 13px; cursor: pointer; transition: all 0.2s ease; box-shadow: $box-shadow-base;
    &:hover { opacity: 0.9; }
    &:active { opacity: 1; }
  }
}

@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.1); opacity: 1; } }
@keyframes titleGlow { 0%, 100% { text-shadow: none; } 50% { text-shadow: none; } }

/* 隐藏深色背景动画元素 */
.bg-animation, .bg-gradient, .grid-lines, .particles { display: none; }
</style>