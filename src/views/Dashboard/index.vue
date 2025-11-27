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
        <div class="header"></div>

      <!-- 内容区域 -->
      <div class="content">
        <!-- KPI 指标区 -->
        <div class="kpi-grid">
          <div class="kpi-card" v-for="item in kpiItems" :key="item.key">
            <!-- 图标区域 -->
            <div class="kpi-icon-wrapper" :style="{ backgroundColor: item.bgColor }">
              <el-icon :size="24" :color="item.iconColor">
                <component :is="getIconComponent(item.icon)" />
              </el-icon>
            </div>
            <!-- 内容区域 -->
            <div class="kpi-content">
              <div class="kpi-title">{{ item.label }}</div>
              <div class="kpi-value">{{ item.value }}</div>
            </div>
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
            <!-- 基本信息行 -->
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
                <span class="label">所属平台</span>
                <span class="value">{{ displayPlatformNames.length > 0 ? displayPlatformNames.join(', ') : '无' }}</span>
              </div>
              <div class="info-item">
                <span class="label">数据权限</span>
                <span class="value permission" :class="{ full: userStore.hasFullPermission }">
                  <el-icon><Lock /></el-icon>
                  {{ userStore.hasFullPermission ? '全部数据' : '受限数据' }}
                </span>
              </div>
            </div>

            <!-- 管辖资源区域 - 分开展示 -->
            <div class="resources-section" v-if="displayRoomNames.length > 0 || displayEquipmentNames.length > 0">
              <div class="resource-group">
                <div class="resource-header">
                  <el-icon color="#409EFF"><Collection /></el-icon>
                  <span>管辖房间</span>
                </div>
                <div class="resource-tags">
                  <el-tag
                    v-for="(room, index) in displayRoomNames"
                    :key="`room-${index}`"
                    type="info"
                    effect="light"
                  >
                    {{ room }}
                  </el-tag>
                  <span v-if="displayRoomNames.length === 0" class="empty-text">无</span>
                </div>
              </div>

              <div class="resource-group">
                <div class="resource-header">
                  <el-icon color="#67C23A"><Monitor /></el-icon>
                  <span>管辖仪器</span>
                </div>
                <div class="resource-tags">
                  <el-tag
                    v-for="(equipment, index) in displayEquipmentNames"
                    :key="`equipment-${index}`"
                    type="success"
                    effect="light"
                  >
                    {{ equipment }}
                  </el-tag>
                  <span v-if="displayEquipmentNames.length === 0" class="empty-text">无</span>
                </div>
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
import { getParkData, getDetailedList } from '@/api/dashboard'
import { DataAnalysis, User, SwitchButton, UserFilled, Lock, Calendar, DocumentRemove, Monitor, Collection, CreditCard, Clock, Money, TrendCharts, Trophy, Reading } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const parkData = ref(null)

// 用于ID转换的映射数据
const detailedListData = ref({})
// 转换后的用户信息
const displayPlatformNames = ref([])
const displayRoomNames = ref([])
const displayEquipmentNames = ref([])

/**
 * 获取 KPI 指标项，包含图标和背景颜色
 * 每个指标项包含：key、label、value、icon、bgColor、iconColor
 */
const kpiItems = computed(() => {
  const d = parkData.value || {}
  return [
    { key: 'name', label: '园区名称', value: d.name ?? '-', icon: 'building', bgColor: '#e6f2ff', iconColor: '#409EFF' },
    { key: 'usage', label: '园区用途', value: d.usage ?? '-', icon: 'collection', bgColor: '#f0f9e6', iconColor: '#67C23A' },
    { key: 'area', label: '园区面积(㎡)', value: d.area ?? '-', icon: 'monitor', bgColor: '#fdf6e6', iconColor: '#E6A23C' },
    { key: 'building', label: '楼栋数量', value: d.building ?? '-', icon: 'monitor', bgColor: '#e1f3d8', iconColor: '#529b2e' },
    { key: 'ins', label: '仪器数量', value: d.ins ?? '-', icon: 'monitor', bgColor: '#e6f2ff', iconColor: '#409EFF' },
    { key: 'insUse', label: '仪器使用次数', value: d.insUse ?? '-', icon: 'trendCharts', bgColor: '#fdf6e6', iconColor: '#E6A23C' },
    { key: 'tUser', label: '总用户数', value: d.tUser ?? '-', icon: 'user', bgColor: '#e6f2ff', iconColor: '#409EFF' },
    { key: 'iUser', label: '内部用户数', value: d.iUser ?? '-', icon: 'user', bgColor: '#e1f3d8', iconColor: '#529b2e' },
    { key: 'oUser', label: '外部用户数', value: d.oUser ?? '-', icon: 'user', bgColor: '#fff2e6', iconColor: '#d48806' },
    { key: 'totalAssetValue', label: '资产总价值(万元)', value: d.totalAssetValue ?? '-', icon: 'money', bgColor: '#ffe6e6', iconColor: '#F56C6C' },
    { key: 'tIncome', label: '总收入(元)', value: d.tIncome ?? '-', icon: 'money', bgColor: '#ffe6e6', iconColor: '#F56C6C' },
    { key: 'iIncome', label: '内部收入(元)', value: d.iIncome ?? '-', icon: 'money', bgColor: '#ffe6f0', iconColor: '#c45656' },
    { key: 'oIncome', label: '外部收入(元)', value: d.oIncome ?? '-', icon: 'money', bgColor: '#fff0e6', iconColor: '#d4a106' },
    { key: 'tTime', label: '总机时数(小时)', value: d.tTime ?? '-', icon: 'clock', bgColor: '#f0f9e6', iconColor: '#67C23A' },
    { key: 'iTime', label: '内部机时数(小时)', value: d.iTime ?? '-', icon: 'clock', bgColor: '#e1f3d8', iconColor: '#529b2e' },
    { key: 'oTime', label: '外部机时数(小时)', value: d.oTime ?? '-', icon: 'clock', bgColor: '#fff2e6', iconColor: '#d48806' },
    { key: 'tGroup', label: '总课题组数', value: d.tGroup ?? '-', icon: 'collection', bgColor: '#f0f9e6', iconColor: '#67C23A' },
    { key: 'iGroup', label: '内部课题组数', value: d.iGroup ?? '-', icon: 'collection', bgColor: '#fff7e6', iconColor: '#d46b08' },
    { key: 'oGroup', label: '外部课题组数', value: d.oGroup ?? '-', icon: 'collection', bgColor: '#fffbe6', iconColor: '#d4b106' },
    { key: 'tCard', label: '总经费卡数', value: d.tCard ?? '-', icon: 'creditCard', bgColor: '#fdf6e6', iconColor: '#E6A23C' },
    { key: 'iCard', label: '内部经费卡数', value: d.iCard ?? '-', icon: 'creditCard', bgColor: '#f6e6ff', iconColor: '#722ed1' },
    { key: 'oCard', label: '外部经费卡数', value: d.oCard ?? '-', icon: 'creditCard', bgColor: '#e6ffe6', iconColor: '#389e0d' },
    { key: 'train', label: '培训场数', value: d.train ?? '-', icon: 'reading', bgColor: '#e6f2ff', iconColor: '#409EFF' },
    { key: 'trainUser', label: '培训人数', value: d.trainUser ?? '-', icon: 'user', bgColor: '#f0f9e6', iconColor: '#67C23A' },
    { key: 'trainInfo', label: '培训资料数', value: d.trainInfo ?? '-', icon: 'reading', bgColor: '#f0f8ff', iconColor: '#1890ff' },
    { key: 'trainPass', label: '培训通过率(%)', value: d.trainPass ?? '-', icon: 'trophy', bgColor: '#fdf6e6', iconColor: '#E6A23C' }
  ]
})

/**
 * 将ID数组转换为实际名称
 * 根据用户权限判断是否展示"全部"或具体名称
 * 注意：全权限用户如果返回的ID列表为空，则显示"无"而不是"全部"
 */
const transformUserInfo = () => {
  // 如果是超级管理员或有全部权限
  if (userStore.hasFullPermission) {
    // 检查是否有实际的ID列表返回
    // 如果ID列表为空，则显示"无"；否则显示"全部"
    displayPlatformNames.value = (userStore.platformIds && userStore.platformIds.length > 0) ? ['全部平台'] : []
    displayRoomNames.value = (userStore.roomIds && userStore.roomIds.length > 0) ? ['全部房间'] : []
    displayEquipmentNames.value = (userStore.equipmentIds && userStore.equipmentIds.length > 0) ? ['全部仪器'] : []
    return
  }

  // 从详细清单数据中提取映射关系
  const platformMap = {}
  const roomMap = {}
  const equipmentMap = {}

  // 构建平台映射表
  if (detailedListData.value.groupList && Array.isArray(detailedListData.value.groupList)) {
    detailedListData.value.groupList.forEach(item => {
      platformMap[item.id] = item.name || item.groupName || `平台 ${item.id}`
    })
  }

  // 构建房间映射表
  if (detailedListData.value.room && Array.isArray(detailedListData.value.room)) {
    detailedListData.value.room.forEach(item => {
      roomMap[item.id] = item.name || `房间 ${item.id}`
    })
  }

  // 构建仪器映射表
  if (detailedListData.value.instrumentInfoList && Array.isArray(detailedListData.value.instrumentInfoList)) {
    detailedListData.value.instrumentInfoList.forEach(item => {
      equipmentMap[item.id] = item.name || item.instrumentName || `仪器 ${item.id}`
    })
  }

  // 转换平台ID为名称
  displayPlatformNames.value = (userStore.platformIds || []).map(id => platformMap[id] || `平台 ${id}`)
  // 转换房间ID为名称
  displayRoomNames.value = (userStore.roomIds || []).map(id => roomMap[id] || `房间 ${id}`)
  // 转换仪器ID为名称
  displayEquipmentNames.value = (userStore.equipmentIds || []).map(id => equipmentMap[id] || `仪器 ${id}`)
}

// 权限参数透传
const buildParams = () => {
  if (userStore.hasFullPermission) return {}
  return {
    platform: userStore.platformIds,
    room: userStore.roomIds,
    eq: userStore.equipmentIds
  }
}

/**
 * 根据图标名称返回对应的图标组件
 * 用于在模板中动态渲染图标
 */
const getIconComponent = (iconName) => {
  const iconMap = {
    'building': Monitor,
    'collection': Collection,
    'monitor': Monitor,
    'user': User,
    'trendCharts': TrendCharts,
    'money': Money,
    'clock': Clock,
    'creditCard': CreditCard,
    'reading': Reading,
    'trophy': Trophy
  }
  return iconMap[iconName] || Monitor
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
      top: 12,
      textStyle: { color: '#303133', fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: { color: '#606266' }
    },
    series: [
      {
        name: '培训通过率',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        label: { show: true, formatter: '{b}\n{c}%', color: '#303133' },
        labelLine: { show: true, lineStyle: { color: '#909399' } },
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.1)'
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
    // 并行获取园区数据和详细清单数据
    const params = {
      id: import.meta.env.VITE_PARK_ID,
      type: 0,
      ...buildParams()
    }

    // 同时发起两个请求
    const [parkDataRes, detailedListRes] = await Promise.all([
      getParkData(params),
      getDetailedList({})
    ])

    // 处理园区数据
    parkData.value = parkDataRes.data || {}

    // 处理详细清单数据
    if (detailedListRes && detailedListRes.data) {
      detailedListData.value = detailedListRes.data
    }

    // 转换用户信息中的ID为名称
    transformUserInfo()

    // 初始化图表
    initCharts()
    updateChartsWithData(parkData.value)
  } catch (e) {
    console.error('仪表板加载失败:', e)
    ElMessage.error(e?.message || '仪表板加载失败')
  } finally {
    loading.value = false
  }
}

// 顶部已提供导航，移除页面内按钮

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
@import '@/styles/variables.scss';
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
  background: $bg-page;
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

.header { display: none; }

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-icon {
  color: $primary-color;
}

.title {
  font-size: 22px;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
  letter-spacing: 1px;
}

.subtitle {
  font-size: 12px;
  color: $text-secondary;
  margin-top: 4px;
  letter-spacing: 1px;
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
  padding: 8px 16px;
  background: $bg-color;
  border: 1px solid $border-light;
  border-radius: 8px;
}

.user-icon {
  font-size: 24px;
  color: $primary-color;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
}

.user-role {
  font-size: 12px;
  color: $text-secondary;
}


.entities-button:hover { opacity: 0.9; }

.entities-button:active {
  transform: translateY(0);
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f56c6c;
  border: 1px solid transparent;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: $box-shadow-base;
}

.logout-button:hover { opacity: 0.9; }

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
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

/**
 * KPI 卡片样式 - 参考仪器运营、用户运营的设计
 * 包含彩色图标和内容区域
 */
.kpi-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: $bg-color;
  border: 1px solid $border-light;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);
}

/**
 * 图标包装器 - 圆形背景
 */
.kpi-icon-wrapper {
  padding: 12px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 48px;
  height: 48px;
}

/**
 * KPI 内容区域
 */
.kpi-content {
  flex: 1;
  min-width: 0;
}

.kpi-title {
  color: $text-secondary;
  font-size: 13px;
  margin-bottom: 6px;
  font-weight: 500;
}

.kpi-value {
  color: $text-primary;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
  word-break: break-all;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.chart-box {
  height: 360px;
  border-radius: 12px;
  background: $bg-color;
  border: 1px solid $border-light;
  transition: all 0.2s ease;
  box-shadow: $box-shadow-light;
}

.chart-box:hover {
  border-color: rgba(0, 212, 255, 0.35);
  box-shadow: inset 0 0 28px rgba(0, 212, 255, 0.18), 0 10px 28px rgba(0, 0, 0, 0.35);
}

.tech-card {
  background: $bg-color;
  border-radius: 12px;
  border: 1px solid $border-light;
  box-shadow: $box-shadow-light;
  overflow: hidden;
  transition: all 0.2s ease;
}

.tech-card:hover { transform: translateY(-1px); }

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: $bg-color;
  border-bottom: 1px solid $border-light;
}

.card-header .header-icon {
  font-size: 24px;
  color: $primary-color;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
  letter-spacing: 0.5px;
}

.count-badge {
  padding: 4px 12px;
  background: $primary-color;
  border-radius: 12px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
}

.header-line { display: none; }

.card-body {
  padding: 30px;
}

/**
 * 基本信息网格 - 2列布局
 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

/**
 * 基本信息项
 */
.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: $bg-color;
  border: 1px solid $border-light;
  border-radius: 8px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.label {
  font-size: 12px;
  color: $text-secondary;
  letter-spacing: 0.5px;
}

.value {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
}

/**
 * 管辖资源区域 - 分开展示房间和仪器
 * 使用两列布局，每列显示一个资源类型
 */
.resources-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid $border-light;
}

/**
 * 资源组 - 包含标题和标签列表
 */
.resource-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/**
 * 资源组标题 - 带图标
 */
.resource-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
}

.resource-header :deep(.el-icon) {
  font-size: 18px;
}

/**
 * 资源标签容器 - 自动换行
 */
.resource-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.resource-tags :deep(.el-tag) {
  margin: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/**
 * 空状态文本
 */
.empty-text {
  font-size: 14px;
  color: $text-secondary;
  font-style: italic;
}

.permission {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f4a460;
}

.permission.full { color: #67c23a; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: $text-regular;
}

.empty-icon { font-size: 48px; color: $primary-color; }

.table-wrapper {
  overflow-x: auto;
}

.tech-table { width: 100%; border-collapse: collapse; color: $text-primary; }

.tech-table th,
.tech-table td {
  border-bottom: 1px solid $border-light;
  padding: 12px;
  text-align: left;
}

.tech-table th { color: $text-regular; font-weight: 600; }

.location-cell {
  max-width: 320px;
  word-break: break-all;
}

/* 隐藏深色背景动画元素 */
.bg-animation,
.bg-gradient,
.grid-lines,
.particles { display: none; }
.bg-animation .grid-lines { display: none; }
.bg-animation .particle { display: none; }
</style>
