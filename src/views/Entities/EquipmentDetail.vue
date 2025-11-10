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
/* 复用 Entities 科技风格样式（同主页面） */
.entities-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: #0a0e27;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
}

.bg-animation {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;

  .bg-gradient {
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 25%, #2a1f3f 50%, #1a1f3a 75%, #0a0e27 100%);
    animation: gradientShift 15s ease infinite;
  }
  .grid-lines {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0.08;
    .grid-line {
      position: absolute;
      background: linear-gradient(90deg, transparent, #00d4ff, transparent);
      &.horizontal { width: 100%; height: 1px; }
      &.vertical { width: 1px; height: 100%; }
    }
  }
  .particles {
    position: absolute;
    width: 100%;
    height: 100%;
    .particle {
      position: absolute;
      background: #00d4ff;
      border-radius: 50%;
      opacity: 0.4;
      animation: particleFloat linear infinite;
      box-shadow: 0 0 8px #00d4ff;
    }
  }
}

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
  width: 1100px;
  max-width: 95%;
  margin-top: 10px;
  border-radius: 16px;
  background: rgba(15, 20, 40, 0.75);
  border: 1px solid rgba(0, 212, 255, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(18px);
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

  .box-header {
    padding: 28px 36px 12px;
    text-align: center;

    .logo-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;

      .logo-icon {
        color: #00d4ff;
        filter: drop-shadow(0 0 12px rgba(0, 212, 255, 0.7));
      }
      .logo-glow {
        position: absolute;
        width: 90px; height: 90px;
        background: radial-gradient(circle, rgba(0, 212, 255, 0.25), transparent 70%);
        border-radius: 50%;
        animation: pulse 3s ease-in-out infinite;
      }
    }

    .title {
      font-size: 28px; font-weight: 700; color: #ffffff;
      margin: 6px 0; letter-spacing: 2px;
      text-shadow: 0 0 18px rgba(0, 212, 255, 0.5);
      animation: titleGlow 3s ease-in-out infinite;
    }

    .subtitle {
      font-size: 12px; font-weight: 300; color: #00d4ff;
      letter-spacing: 3px; opacity: 0.8; margin-bottom: 14px;
    }

    .title-divider {
      width: 60px; height: 3px; margin: 0 auto;
      background: linear-gradient(90deg, transparent, #00d4ff, transparent);
      border-radius: 2px;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    }
  }

  .detail-content {
    padding: 0 24px 24px;
  }
}

.section-card {
  margin-top: 16px;
  background: rgba(15, 20, 40, 0.85);
  border-radius: 12px;
  border: 1px solid rgba(0, 212, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 212, 255, 0.4);
    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.22);
    transform: translateY(-2px);
  }

  .section-header {
    display: flex; align-items: center; gap: 12px; padding: 16px 22px;
    background: rgba(0, 212, 255, 0.05); border-bottom: 1px solid rgba(0, 212, 255, 0.2);
    h3 { font-size: 16px; font-weight: 600; color: #ffffff; margin: 0; letter-spacing: 1px; }
    .header-line { flex: 1; height: 2px; background: linear-gradient(90deg, rgba(0, 212, 255, 0.5), transparent); margin-left: auto; }
  }

  .card-body {
    padding: 22px;

    .filter-bar {
      display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px;
      :deep(.el-input__wrapper),
      :deep(.el-date-editor) {
        background-color: rgba(255,255,255,0.06);
        border-color: rgba(0, 212, 255, 0.4);
        color: #ffffff;
      }
      :deep(.el-input__inner),
      :deep(.el-range-input) {
        color: #ffffff;
      }
      :deep(.el-input__inner::placeholder),
      :deep(.el-range-input::placeholder) {
        color: #b8dfff;
        opacity: 0.9;
      }
    }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; color: #cfe8ff;
      .empty-icon { font-size: 42px; color: #00d4ff; }
    }

    .table-wrapper { overflow-x: auto; }
    .tech-table {
      width: 100%;
      border-collapse: collapse;
      color: #cfe8ff;
      th, td { border-bottom: 1px solid rgba(0, 212, 255, 0.2); padding: 12px; text-align: left; }
      th { color: #00d4ff; font-weight: 600; }
    }
  }
}

.actions {
  display: flex; justify-content: flex-end; padding: 8px 24px 24px;

  .back-button {
    display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.85), rgba(0, 160, 220, 0.85));
    border: 1px solid rgba(0, 212, 255, 0.5); border-radius: 8px; color: #ffffff;
    font-size: 13px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 12px rgba(0, 212, 255, 0.25);
    &:hover { transform: translateY(-2px); box-shadow: 0 4px 18px rgba(0, 212, 255, 0.5); }
    &:active { transform: translateY(0); }
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 1; }
}
@keyframes titleGlow {
  0%, 100% { text-shadow: 0 0 18px rgba(0, 212, 255, 0.5); }
  50% { text-shadow: 0 0 24px rgba(0, 212, 255, 0.8); }
}
</style>