<template>
  <div class="dashboard-container">
    <div class="bg-animation">
      <div class="bg-gradient"></div>
      <div class="grid-lines">
        <div v-for="i in 20" :key="`h-${i}`" class="grid-line horizontal" :style="{ top: `${i * 5}%` }"></div>
        <div v-for="i in 20" :key="`v-${i}`" class="grid-line vertical" :style="{ left: `${i * 5}%` }"></div>
      </div>
      <div class="particles">
        <div v-for="i in 20" :key="`p-${i}`" class="particle" :style="getParticleStyle(i)"></div>
      </div>
    </div>

    <div class="main-content">
      <!-- 顶部导航栏 -->
      <div class="header">
        <div class="header-left">
          <div class="logo-icon">
            <el-icon :size="32"><DataAnalysis /></el-icon>
          </div>
          <div class="title-wrapper">
            <h1 class="title">运营首页</h1>
            <p class="subtitle">OPERATION DASHBOARD</p>
          </div>
        </div>
        <div class="header-right">
          <div class="user-info">
            <el-icon class="user-icon"><User /></el-icon>
            <div class="user-details">
              <span class="user-name">{{ userStore.userName }}</span>
              <span class="user-role">{{ userStore.userRole }}</span>
            </div>
          </div>
          <button class="entities-button" @click="handleGoEntities">
            <el-icon><Collection /></el-icon>
            <span>实体统计</span>
          </button>
          <button class="logout-button" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            <span>退出登录</span>
          </button>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content">
        <!-- KPI 指标区 -->
        <div class="kpi-grid">
          <div class="kpi-card" v-for="item in kpiItems" :key="item.key">
            <div class="kpi-title">{{ item.label }}</div>
            <div class="kpi-value">{{ item.value }}</div>
          </div>
        </div>

        <!-- 图表区：仅培训通过率饼图 -->
        <div class="chart-row">
          <div class="chart-box" ref="trainPassPieRef"></div>
        </div>

        <!-- 用户信息卡片 -->
        <div class="tech-card">
          <div class="card-header">
            <div class="header-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
            <h3>用户信息</h3>
            <div class="header-line"></div>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">姓名</span>
                <span class="value">{{ userStore.userName }}</span>
              </div>
              <div class="info-item">
                <span class="label">角色</span>
                <span class="value">{{ userStore.userRole }}</span>
              </div>
              <div class="info-item">
                <span class="label">所属平台ID</span>
                <span class="value">{{ userStore.platformIds.join(', ') || '无' }}</span>
              </div>
              <div class="info-item">
                <span class="label">管辖房间ID</span>
                <span class="value">{{ userStore.roomIds.join(', ') || '无' }}</span>
              </div>
              <div class="info-item full-width">
                <span class="label">管辖仪器ID</span>
                <span class="value">{{ userStore.equipmentIds.join(', ') || '无' }}</span>
              </div>
              <div class="info-item full-width">
                <span class="label">数据权限</span>
                <span class="value permission" :class="{ full: userStore.hasFullPermission }">
                  <el-icon><Lock /></el-icon>
                  {{ userStore.hasFullPermission ? '全部数据' : '受限数据' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 当天预约列表卡片 -->
        <div class="tech-card">
          <div class="card-header">
            <div class="header-icon">
              <el-icon><Calendar /></el-icon>
            </div>
            <h3>当天预约列表</h3>
            <div class="count-badge">{{ userStore.bookingList.length }}</div>
            <div class="header-line"></div>
          </div>
          <div class="card-body">
            <div v-if="userStore.bookingList.length === 0" class="empty-state">
              <el-icon class="empty-icon"><DocumentRemove /></el-icon>
              <p>暂无预约数据</p>
            </div>
            <div v-else class="table-wrapper">
              <table class="tech-table">
                <thead>
                  <tr>
                    <th>仪器名称</th>
                    <th>预约时间</th>
                    <th>预约人</th>
                    <th>房间</th>
                    <th>路线引导</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in userStore.bookingList" :key="index">
                    <td>{{ item.instrumentName }}</td>
                    <td>{{ item.bookingTime }}</td>
                    <td>{{ item.userName }}</td>
                    <td>{{ item.roomName }}</td>
                    <td class="location-cell">{{ item.location }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox, ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getParkData } from '@/api/dashboard'
import {
  DataAnalysis,
  User,
  SwitchButton,
  UserFilled,
  Lock,
  Calendar,
  DocumentRemove,
  Collection
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const parkData = ref(null)

const kpiItems = computed(() => {
  const d = parkData.value || {}
  return [
    { key: 'name', label: '园区名称', value: d.name ?? '-' },
    { key: 'usage', label: '园区用途', value: d.usage ?? '-' },
    { key: 'area', label: '园区面积(㎡)', value: d.area ?? '-' },
    { key: 'building', label: '楼栋数量', value: d.building ?? '-' },
    { key: 'ins', label: '仪器数量', value: d.ins ?? '-' },
    { key: 'insUse', label: '仪器使用次数', value: d.insUse ?? '-' },
    { key: 'tUser', label: '总用户数', value: d.tUser ?? '-' },
    { key: 'iUser', label: '内部用户数', value: d.iUser ?? '-' },
    { key: 'oUser', label: '外部用户数', value: d.oUser ?? '-' },
    { key: 'totalAssetValue', label: '资产总价值(万元)', value: d.totalAssetValue ?? '-' },
    { key: 'tIncome', label: '总收入(元)', value: d.tIncome ?? '-' },
    { key: 'iIncome', label: '内部收入(元)', value: d.iIncome ?? '-' },
    { key: 'oIncome', label: '外部收入(元)', value: d.oIncome ?? '-' },
    { key: 'tTime', label: '总机时数(小时)', value: d.tTime ?? '-' },
    { key: 'iTime', label: '内部机时数(小时)', value: d.iTime ?? '-' },
    { key: 'oTime', label: '外部机时数(小时)', value: d.oTime ?? '-' },
    { key: 'tGroup', label: '总课题组数', value: d.tGroup ?? '-' },
    { key: 'iGroup', label: '内部课题组数', value: d.iGroup ?? '-' },
    { key: 'oGroup', label: '外部课题组数', value: d.oGroup ?? '-' },
    { key: 'tCard', label: '总经费卡数', value: d.tCard ?? '-' },
    { key: 'iCard', label: '内部经费卡数', value: d.iCard ?? '-' },
    { key: 'oCard', label: '外部经费卡数', value: d.oCard ?? '-' },
    { key: 'train', label: '培训场数', value: d.train ?? '-' },
    { key: 'trainUser', label: '培训人数', value: d.trainUser ?? '-' },
    { key: 'trainInfo', label: '培训资料数', value: d.trainInfo ?? '-' },
    { key: 'trainPass', label: '培训通过率(%)', value: d.trainPass ?? '-' }
  ]
})

// 权限参数透传
const buildParams = () => {
  if (userStore.hasFullPermission) return {}
  return {
    platform: userStore.platformIds,
    room: userStore.roomIds,
    eq: userStore.equipmentIds
  }
}

// 背景粒子样式计算
const getParticleStyle = (i) => {
  const size = 2 + (i % 5)
  const duration = 10 + (i % 10)
  const top = (i * 7) % 100
  const left = (i * 13) % 100
  return {
    width: `${size}px`,
    height: `${size}px`,
    top: `${top}%`,
    left: `${left}%`,
    animationDuration: `${duration}s`
  }
}

// 饼图
const trainPassPieRef = ref(null)
let trainPassPieChart = null

const initCharts = () => {
  if (trainPassPieRef.value && !trainPassPieChart) {
    trainPassPieChart = echarts.init(trainPassPieRef.value)
  }
}

const updateChartsWithData = (d) => {
  const raw = d?.trainPass
  const pass = Math.max(0, Math.min(100, Number(raw) || 0))
  const fail = Number((100 - pass).toFixed(2))

  trainPassPieChart?.setOption({
    title: {
      text: '培训通过率',
      left: 'center',
      top: 10,
      textStyle: { color: '#00d4ff', fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: { color: '#cfe8ff' }
    },
    series: [
      {
        name: '培训通过率',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        label: { show: true, formatter: '{b}\n{c}%', color: '#ffffff' },
        labelLine: { show: true },
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 212, 255, 0.4)'
        },
        color: ['#00ff88', '#ff6b6b'],
        data: [
          { name: '通过', value: pass },
          { name: '未通过', value: fail }
        ]
      }
    ]
  })
}

const handleResize = () => {
  trainPassPieChart?.resize()
}

// 加载数据
const loadDashboard = async () => {
  loading.value = true
  try {
    const params = {
      id: import.meta.env.VITE_PARK_ID,
      type: 0,
      ...buildParams()
    }
    const { data } = await getParkData(params)
    parkData.value = data || {}
    initCharts()
    updateChartsWithData(parkData.value)
  } catch (e) {
    ElMessage.error(e?.message || '园区数据加载失败')
  } finally {
    loading.value = false
  }
}

// 跳转到实体统计
const handleGoEntities = () => {
  router.push('/entities')
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '操作确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    // 关键修复：先清理登录状态，再跳转登录页
    userStore.logout()
    ElMessage.success('已退出登录')
    router.replace('/login')
  } catch {
    // 取消时不做处理
  }
}

// 生命周期
onMounted(() => {
  loadDashboard()
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trainPassPieChart?.dispose()
})
</script>

<style lang="scss" scoped>
@keyframes logoGlow {
  0% { filter: drop-shadow(0 0 6px rgba(0, 212, 255, 0.6)); }
  50% { filter: drop-shadow(0 0 14px rgba(0, 212, 255, 0.9)); }
  100% { filter: drop-shadow(0 0 6px rgba(0, 212, 255, 0.6)); }
}

.dashboard-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  background: #0a0e27;
}

.bg-animation {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

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
}

.grid-line {
  position: absolute;
  background: linear-gradient(90deg, transparent, #00d4ff, transparent);
}

.grid-line.horizontal {
  width: 100%;
  height: 1px;
}

.grid-line.vertical {
  width: 1px;
  height: 100%;
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  background: #00d4ff;
  border-radius: 50%;
  opacity: 0.4;
  animation: particleFloat linear infinite;
  box-shadow: 0 0 8px #00d4ff;
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

.main-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  margin-bottom: 30px;
  background: rgba(15, 20, 40, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid rgba(0, 212, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-icon {
  color: #00d4ff;
  filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.6));
  animation: logoGlow 3s ease-in-out infinite;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  letter-spacing: 2px;
  text-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
}

.subtitle {
  font-size: 12px;
  color: #00d4ff;
  margin-top: 4px;
  letter-spacing: 2px;
  opacity: 0.8;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
}

.user-icon {
  font-size: 24px;
  color: #00d4ff;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.user-role {
  font-size: 12px;
  color: rgba(0, 212, 255, 0.8);
}

.entities-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.8), rgba(0, 160, 220, 0.8));
  border: 1px solid rgba(0, 212, 255, 0.5);
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 212, 255, 0.3);
}

.entities-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.5);
  background: linear-gradient(135deg, rgba(0, 212, 255, 1), rgba(0, 160, 220, 1));
}

.entities-button:active {
  transform: translateY(0);
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.8), rgba(211, 47, 47, 0.8));
  border: 1px solid rgba(244, 67, 54, 0.5);
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(244, 67, 54, 0.3);
}

.logout-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.5);
  background: linear-gradient(135deg, rgba(244, 67, 54, 1), rgba(211, 47, 47, 1));
}

.logout-button:active {
  transform: translateY(0);
}

.content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.kpi-card {
  padding: 16px;
  border-radius: 12px;
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 212, 255, 0.12);
}

.kpi-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 212, 255, 0.35);
  box-shadow: 0 6px 22px rgba(0, 212, 255, 0.25);
  background: rgba(0, 212, 255, 0.08);
}

.kpi-title {
  color: rgba(0, 212, 255, 0.7);
  font-size: 12px;
  margin-bottom: 8px;
}

.kpi-value {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.chart-box {
  height: 360px;
  border-radius: 12px;
  background: rgba(15, 20, 40, 0.85);
  border: 1px solid rgba(0, 212, 255, 0.2);
  transition: all 0.3s ease;
  box-shadow: inset 0 0 20px rgba(0, 212, 255, 0.12), 0 6px 18px rgba(0, 0, 0, 0.3);
}

.chart-box:hover {
  border-color: rgba(0, 212, 255, 0.35);
  box-shadow: inset 0 0 28px rgba(0, 212, 255, 0.18), 0 10px 28px rgba(0, 0, 0, 0.35);
}

.tech-card {
  background: rgba(15, 20, 40, 0.85);
  border-radius: 12px;
  border: 1px solid rgba(0, 212, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: all 0.3s ease;
}

.tech-card:hover {
  border-color: rgba(0, 212, 255, 0.4);
  box-shadow: 0 10px 30px rgba(0, 212, 255, 0.22);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 30px;
  background: rgba(0, 212, 255, 0.05);
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
}

.card-header .header-icon {
  font-size: 24px;
  color: #00d4ff;
  filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.6));
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  letter-spacing: 1px;
}

.count-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #00d4ff, #00a8cc);
  border-radius: 12px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 212, 255, 0.3);
}

.header-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, rgba(0, 212, 255, 0.5), transparent);
  margin-left: auto;
}

.card-body {
  padding: 30px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(0, 212, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.15);
  border-radius: 8px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.label {
  font-size: 12px;
  color: rgba(0, 212, 255, 0.7);
  letter-spacing: 0.5px;
}

.value {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.permission {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f4a460;
}

.permission.full {
  color: #00ff88;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #cfe8ff;
}

.empty-icon {
  font-size: 48px;
  color: #00d4ff;
}

.table-wrapper {
  overflow-x: auto;
}

.tech-table {
  width: 100%;
  border-collapse: collapse;
  color: #cfe8ff;
}

.tech-table th,
.tech-table td {
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  padding: 12px;
  text-align: left;
}

.tech-table th {
  color: #00d4ff;
  font-weight: 600;
}

.location-cell {
  max-width: 320px;
  word-break: break-all;
}

/* 加强背景元素可视化 */
.bg-animation .grid-lines { opacity: 0.12; }
.bg-animation .particle { opacity: 0.5; box-shadow: 0 0 10px #00d4ff; }
</style>
