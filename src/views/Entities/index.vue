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

    <!-- 内容卡片 -->
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
        <h1 class="title">实体统计</h1>
        <p class="subtitle">ENTITIES ANALYTICS</p>
        <div class="title-divider"></div>

        <!-- 新增：返回运营首页按钮 -->
        <div class="header-actions">
          <el-button type="primary" @click="goDashboard">返回运营首页</el-button>
          <!-- 已移除“返回登录页”按钮 -->
        </div>
      </div>

      <!-- Tabs 切换 -->
      <div class="tab-wrapper">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 建筑统计：仅基本信息 -->
          <el-tab-pane label="建筑统计" name="building">
            <div class="section-card">
              <div class="section-header">
                <h3>建筑基本信息</h3>
                <div class="header-line"></div>
              </div>
              <div class="card-body">
                <div class="filter-bar">
                  <el-input
                    v-model="buildingParams.id"
                    placeholder="建筑ID（默认取环境变量或1）"
                    style="max-width: 220px"
                    clearable
                  />
                  <el-select v-model="buildingParams.type" style="max-width: 160px">
                    <el-option :value="0" label="实时" />
                    <el-option :value="1" label="按时段" />
                  </el-select>
                  <el-date-picker
                    v-model="buildingDateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    value-format="YYYY-MM-DD"
                    style="max-width: 380px"
                    :disabled="buildingParams.type !== 1"
                  />
                  <el-button type="primary" :loading="buildingLoading" @click="loadBuildingData">
                    查询
                  </el-button>
                </div>

                <div v-if="buildingData" class="info-grid">
                  <div class="info-item">
                    <span class="label">建筑名称</span>
                    <span class="value">{{ buildingData.name ?? '-' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">建筑用途</span>
                    <span class="value">{{ buildingData.usage ?? '-' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">部署平台</span>
                    <span class="value">{{ buildingData.platform ?? '-' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">建筑面积(㎡)</span>
                    <span class="value">{{ buildingData.area ?? '-' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">楼层数量</span>
                    <span class="value">{{ buildingData.floor ?? '-' }}</span>
                  </div>
                </div>

                <div v-else class="empty-state">
                  <el-icon class="empty-icon"><DocumentRemove /></el-icon>
                  <p>暂无建筑数据</p>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 楼层统计：统一为和“房间统计”一致的展示风格 -->
          <el-tab-pane label="楼层统计" name="floor">
            <div class="section-card">
              <div class="section-header">
                <h3>楼层基本信息</h3>
                <div class="header-line"></div>
              </div>
              <div class="card-body">
                <div class="filter-bar">
                  <el-input v-model="floorId" placeholder="楼层ID（例如：1）" style="max-width: 220px" clearable />
                  <el-button type="primary" @click="loadFloorData">查询</el-button>
                </div>

                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">名称</span>
                    <span class="value">{{ floorInfoSafe.name || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">用途</span>
                    <span class="value">{{ floorInfoSafe.usage || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">面积(㎡)</span>
                    <span class="value">{{ floorInfoSafe.area || '—' }}</span>
                  </div>
                  <div class="info-item info-platforms">
                    <span class="label">包含平台</span>
                    <span class="value">
                      <span v-if="floorInfoSafe.platform && floorInfoSafe.platform.length">
                        <span v-for="p in floorInfoSafe.platform" :key="p.id" class="tag">{{ p.name }}</span>
                      </span>
                      <span v-else>—</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 按楼层获取房间列表（风格与房间统计一致） -->
            <div class="section-card">
              <div class="section-header">
                <h3>按楼层获取房间列表</h3>
                <div class="header-line"></div>
              </div>
              <div class="card-body">
                <div class="filter-bar">
                  <el-input
                    v-model="floorRoomsQueryId"
                    placeholder="楼层ID（例如：1）"
                    style="max-width: 220px"
                    clearable
                  />
                  <el-button type="primary" :loading="floorRoomsLoading" @click="loadRoomsByFloor">查询</el-button>
                </div>

                <div v-if="floorRooms.length === 0" class="empty-state">
                  <el-icon class="empty-icon"><DocumentRemove /></el-icon>
                  <p>暂无房间列表数据</p>
                </div>
                <div v-else class="table-wrapper">
                  <!-- 楼层统计 Tab 内的“按楼层获取房间列表”表格 -->
                  <table class="tech-table">
                    <thead>
                      <tr>
                        <th>房间ID</th>
                        <th>房间名称</th>
                        <th>房间用途</th>
                        <th>房间面积(㎡)</th>
                        <th>所属平台</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="r in floorRoomsPaged" :key="`${r.name}-${r.area}`">
                        <td>{{ r.id }}</td>
                        <td>{{ r.name }}</td>
                        <td>{{ r.usage }}</td>
                        <td>{{ r.area }}</td>
                        <td>
                          <span v-if="r.platform && r.platform.length">
                            <span v-for="p in r.platform" :key="p.id" class="tag">{{ p.name }}</span>
                          </span>
                          <span v-else>—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="pagination">
                    <el-pagination
                      background
                      layout="prev, pager, next"
                      :total="floorRooms.length"
                      :page-size="floorRoomsPageSize"
                      :current-page="floorRoomsPage"
                      @current-change="(p) => floorRoomsPage = p"
                    />
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 房间统计：房间详情 + 按楼层房间列表 -->
          <el-tab-pane label="房间统计" name="room">
            <!-- 房间详情 -->
            <div class="section-card">
              <div class="section-header">
                <h3>房间详情</h3>
                <div class="header-line"></div>
              </div>
              <div class="card-body">
                <div class="filter-bar">
                  <el-input v-model="roomId" placeholder="房间ID（例如：1）" style="max-width: 220px" clearable />
                  <el-button type="primary" @click="loadRoomDetail">查询</el-button>
                </div>

                <div v-if="roomDetailSafe.name" class="info-grid">
                  <div class="info-item">
                    <span class="label">房间名称</span>
                    <span class="value">{{ roomDetailSafe.name }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">房间用途</span>
                    <span class="value">{{ roomDetailSafe.usage || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">房间面积(㎡)</span>
                    <span class="value">{{ roomDetailSafe.area || '—' }}</span>
                  </div>
                  <div class="info-item info-platforms">
                    <span class="label">所属平台</span>
                    <span class="value">
                      <span v-if="roomDetailSafe.platform && roomDetailSafe.platform.length">
                        <span v-for="p in roomDetailSafe.platform" :key="p.id" class="tag">{{ p.name }}</span>
                      </span>
                      <span v-else>—</span>
                    </span>
                  </div>
                </div>

                <div v-else class="empty-state">
                  <el-icon class="empty-icon"><DocumentRemove /></el-icon>
                  <p>暂无房间详情数据</p>
                </div>

                <!-- 传感器数据 -->
                <div class="section-card inner" v-if="roomDetailSafe.sensor && roomDetailSafe.sensor.length">
                  <div class="section-header">
                    <h3>传感器数据</h3>
                    <div class="header-line"></div>
                  </div>
                  <div class="card-body">
                    <div class="table-wrapper">
                      <table class="tech-table">
                        <thead>
                          <tr>
                            <th>名称</th>
                            <th>读数</th>
                            <th>类型</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="s in roomDetailSafe.sensor" :key="s.id">
                            <td>{{ s.name }}</td>
                            <td>{{ s.value }}</td>
                            <td>{{ s.type }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- 监控信息 -->
                <div class="section-card inner" v-if="roomDetailSafe.camera && roomDetailSafe.camera.length">
                  <div class="section-header">
                    <h3>监控信息</h3>
                    <div class="header-line"></div>
                  </div>
                  <div class="card-body">
                    <div class="table-wrapper">
                      <table class="tech-table">
                        <thead>
                          <tr>
                            <th>名称</th>
                            <th>地址</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="c in roomDetailSafe.camera" :key="c.id">
                            <td>{{ c.name }}</td>
                            <td>{{ c.url }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- 实时报警 -->
                <div class="section-card inner" v-if="roomDetailSafe.alarm && roomDetailSafe.alarm.length">
                  <div class="section-header">
                    <h3>实时报警</h3>
                    <div class="header-line"></div>
                  </div>
                  <div class="card-body">
                    <div class="table-wrapper">
                      <table class="tech-table">
                        <thead>
                          <tr>
                            <th>名称</th>
                            <th>描述</th>
                            <th>类型</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="a in roomDetailSafe.alarm" :key="a.id">
                            <td>{{ a.name }}</td>
                            <td>{{ a.value }}</td>
                            <td>{{ a.type }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 按楼层获取房间列表 -->
            <div class="section-card">
              <div class="section-header">
                <h3>按楼层获取房间列表</h3>
                <div class="header-line"></div>
              </div>
              <div class="card-body">
                <div class="filter-bar">
                  <el-input v-model="floorRoomsQueryId" placeholder="楼层ID（例如：1）" style="max-width: 220px" clearable />
                  <el-button type="primary" @click="loadRoomsByFloor">查询</el-button>
                </div>

                <div v-if="floorRooms.length === 0" class="empty-state">
                  <el-icon class="empty-icon"><DocumentRemove /></el-icon>
                  <p>暂无房间列表数据</p>
                </div>
                <div v-else class="table-wrapper">
                  <!-- 房间统计 Tab 内的“按楼层获取房间列表”表格 -->
                  <table class="tech-table">
                    <thead>
                      <tr>
                        <th>房间ID</th>
                        <th>房间名称</th>
                        <th>房间用途</th>
                        <th>房间面积(㎡)</th>
                        <th>所属平台</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="r in floorRoomsPaged" :key="r.name">
                        <td>{{ r.id }}</td>
                        <td>{{ r.name }}</td>
                        <td>{{ r.usage }}</td>
                        <td>{{ r.area }}</td>
                        <td>
                          <span v-if="r.platform && r.platform.length">
                            <span v-for="p in r.platform" :key="p.id" class="tag">{{ p.name }}</span>
                          </span>
                          <span v-else>—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="pagination">
                    <el-pagination
                      background
                      layout="prev, pager, next"
                      :total="floorRooms.length"
                      :page-size="floorRoomsPageSize"
                      :current-page="floorRoomsPage"
                      @current-change="(p) => floorRoomsPage = p"
                    />
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 仪器统计：按仪器ID查询 eqData -->
          <el-tab-pane label="仪器统计" name="equipment">
            <div class="section-card">
              <div class="section-header">
                <h3>仪器统计</h3>
                <div class="header-line"></div>
              </div>
              <div class="card-body">
                <!-- 查询栏 -->
                <div class="filter-bar">
                  <el-input
                    v-model="eqParams.id"
                    placeholder="仪器ID（例如：1）"
                    style="max-width: 220px"
                    clearable
                  />
                  <el-select v-model="eqParams.type" style="max-width: 160px">
                    <el-option :value="0" label="实时" />
                    <el-option :value="1" label="按时段" />
                  </el-select>
                  <el-date-picker
                    v-model="eqDateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    value-format="YYYY-MM-DD"
                    style="max-width: 380px"
                    :disabled="eqParams.type !== 1"
                  />
                  <el-button type="primary" :loading="eqLoading" @click="loadEqDetail">
                    查询
                  </el-button>
                  <el-button @click="goEquipmentDetailById">查看详情</el-button>
                </div>

                <!-- 基本信息与业务指标（来自 eqData.data） -->
                <div v-if="eqDetail" class="info-grid">
                  <div class="info-item"><span class="label">仪器名称</span><span class="value">{{ eqDetail.name || '-' }}</span></div>
                  <div class="info-item"><span class="label">资产编号</span><span class="value">{{ eqDetail.code || '-' }}</span></div>
                  <div class="info-item"><span class="label">品牌</span><span class="value">{{ eqDetail.manufacturer || '-' }}</span></div>
                  <div class="info-item"><span class="label">型号</span><span class="value">{{ eqDetail.instrVersion || '-' }}</span></div>
                  <div class="info-item"><span class="label">参数</span><span class="value">{{ eqDetail.technical || '-' }}</span></div>
                  <div class="info-item"><span class="label">所属平台</span><span class="value">{{ eqDetail.platform || '-' }}</span></div>
                  <div class="info-item"><span class="label">所属房间</span><span class="value">{{ eqDetail.room || '-' }}</span></div>
                  <div class="info-item"><span class="label">当前状态</span><span class="value">{{ eqDetail.status || '-' }}</span></div>
                  <div class="info-item"><span class="label">使用率(%)</span><span class="value">{{ eqDetail.usage ?? '-' }}</span></div>
                  <div class="info-item"><span class="label">总机时(小时)</span><span class="value">{{ eqDetail.tTime ?? '-' }}</span></div>
                  <div class="info-item"><span class="label">内部机时(小时)</span><span class="value">{{ eqDetail.iTime ?? '-' }}</span></div>
                  <div class="info-item"><span class="label">外部机时(小时)</span><span class="value">{{ eqDetail.oTime ?? '-' }}</span></div>
                  <div class="info-item"><span class="label">总预约人数</span><span class="value">{{ eqDetail.tUser ?? '-' }}</span></div>
                  <div class="info-item"><span class="label">内部预约人数</span><span class="value">{{ eqDetail.iUser ?? '-' }}</span></div>
                  <div class="info-item"><span class="label">外部预约人数</span><span class="value">{{ eqDetail.oUser ?? '-' }}</span></div>
                  <div class="info-item"><span class="label">总服务项目数</span><span class="value">{{ eqDetail.tCard ?? '-' }}</span></div>
                  <div class="info-item"><span class="label">内部服务项目数</span><span class="value">{{ eqDetail.iCard ?? '-' }}</span></div>
                  <div class="info-item"><span class="label">外部服务项目数</span><span class="value">{{ eqDetail.oCard ?? '-' }}</span></div>
                  <div class="info-item"><span class="label">使用样品数</span><span class="value">{{ eqDetail.sample ?? '-' }}</span></div>
                  <div class="info-item"><span class="label">使用耗材数</span><span class="value">{{ eqDetail.materials ?? '-' }}</span></div>
                  <div class="info-item full-width"><span class="label">功能特色</span><span class="value">{{ eqDetail.function || '-' }}</span></div>
                  <div class="info-item full-width"><span class="label">支撑成果</span><span class="value">{{ eqDetail.result || '-' }}</span></div>
                  <div class="info-item full-width"><span class="label">简介</span><span class="value">{{ eqDetail.remark || '-' }}</span></div>
                  <div class="info-item full-width"><span class="label">管理员联系方式</span><span class="value">{{ eqDetail.mgr || '-' }}</span></div>
                </div>

                <!-- 传感器数据 -->
                <div class="section-card inner" v-if="eqDetail?.sensor && eqDetail.sensor.length">
                  <div class="section-header"><h3>传感器数据</h3><div class="header-line"></div></div>
                  <div class="card-body">
                    <div class="table-wrapper">
                      <table class="tech-table">
                        <thead><tr><th>名称</th><th>读数</th><th>类型</th></tr></thead>
                        <tbody>
                          <tr v-for="s in eqDetail.sensor" :key="s.id">
                            <td>{{ s.name }}</td><td>{{ s.value }}</td><td>{{ s.type }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- 监控信息 -->
                <div class="section-card inner" v-if="eqDetail?.camera && eqDetail.camera.length">
                  <div class="section-header"><h3>监控信息</h3><div class="header-line"></div></div>
                  <div class="card-body">
                    <div class="table-wrapper">
                      <table class="tech-table">
                        <thead><tr><th>名称</th><th>地址</th></tr></thead>
                        <tbody>
                          <tr v-for="c in eqDetail.camera" :key="c.id">
                            <td>{{ c.name }}</td><td>{{ c.url }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- 实时报警 -->
                <div class="section-card inner" v-if="eqDetail?.alarm && eqDetail.alarm.length">
                  <div class="section-header"><h3>实时报警</h3><div class="header-line"></div></div>
                  <div class="card-body">
                    <div class="table-wrapper">
                      <table class="tech-table">
                        <thead><tr><th>名称</th><th>描述</th><th>类型</th></tr></thead>
                        <tbody>
                          <tr v-for="a in eqDetail.alarm" :key="a.id">
                            <td>{{ a.name }}</td><td>{{ a.value }}</td><td>{{ a.type }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div v-if="!eqDetail" class="empty-state">
                  <el-icon class="empty-icon"><DocumentRemove /></el-icon>
                  <p>请按仪器ID查询后查看数据</p>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { DocumentRemove, DataAnalysis } from '@element-plus/icons-vue'
import { getBuildingData, getFloorData, getRoomData, getRoomDataByFloor, getEqData } from '@/api/entities'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

// Tabs
const activeTab = ref('building')

// 背景粒子
const getParticleStyle = (index) => {
  const size = Math.random() * 4 + 2
  const left = Math.random() * 100
  const animationDuration = Math.random() * 20 + 10
  const animationDelay = Math.random() * 5
  return { width: `${size}px`, height: `${size}px`, left: `${left}%`, animationDuration: `${animationDuration}s`, animationDelay: `${animationDelay}s` }
}

// 通用：清理反引号
const stripBackticks = (v) => String(v || '').replace(/`/g, '').trim()

/* 建筑统计 */
const buildingParams = ref({
  id: import.meta.env.VITE_BUILDING_ID || '1',
  type: 0
})
const buildingDateRange = ref([])
const buildingLoading = ref(false)
const buildingData = ref(null)

const loadBuildingData = async () => {
  buildingLoading.value = true
  try {
    const params = {
      id: stripBackticks(buildingParams.value.id),
      type: buildingParams.value.type
    }
    if (params.type === 1 && Array.isArray(buildingDateRange.value) && buildingDateRange.value.length === 2) {
      params.beginDate = buildingDateRange.value[0]
      params.endDate = buildingDateRange.value[1]
    }
    const res = await getBuildingData(params)
    buildingData.value = res?.data ?? null
  } catch (e) {
    console.error('buildingData 加载失败:', e)
    buildingData.value = null
  } finally {
    buildingLoading.value = false
  }
}

/* 楼层统计 */
const floorId = ref('')
const floorInfo = ref({})
const floorInfoSafe = computed(() => floorInfo.value || {})

const loadFloorData = async () => {
  const id = stripBackticks(floorId.value)
  if (!id) { floorInfo.value = {}; return }
  try {
    const res = await getFloorData({ id, type: 0 })
    floorInfo.value = res?.data ?? {}
  } catch (e) {
    console.error('floorData 加载失败:', e)
    floorInfo.value = {}
  }
}

// 按楼层获取房间列表
const floorRoomsQueryId = ref('')
const floorRoomsLoading = ref(false)
const floorRooms = ref([])
const floorRoomsPage = ref(1)
const floorRoomsPageSize = ref(8)
const floorRoomsPaged = computed(() => {
  const start = (floorRoomsPage.value - 1) * floorRoomsPageSize.value
  return floorRooms.value.slice(start, start + floorRoomsPageSize.value)
})

// 修复：按楼层获取房间列表（只传 id；解析 data.roomList；统一加载态与提示）
const loadRoomsByFloor = async () => {
  const id = stripBackticks(floorRoomsQueryId.value)
  if (!id) {
    floorRooms.value = []
    ElMessage.warning('请输入楼层ID')
    return
  }
  floorRoomsLoading.value = true
  try {
    const res = await getRoomDataByFloor({ id })
    const list = Array.isArray(res?.data?.roomList) ? res.data.roomList : []
    floorRooms.value = list
    floorRoomsPage.value = 1
    if (list.length === 0) {
      ElMessage.info('该楼层暂无房间数据')
    } else {
      ElMessage.success(`获取到 ${list.length} 条房间数据`)
    }
  } catch (e) {
    console.error('getRoomDataByFloor 加载失败:', e)
    floorRooms.value = []
    ElMessage.error('房间列表获取失败')
  } finally {
    floorRoomsLoading.value = false
  }
}

/* 房间统计 */
const roomId = ref('')
const roomDetail = ref({})
const roomDetailSafe = computed(() => roomDetail.value || {})

const loadRoomDetail = async () => {
  const id = stripBackticks(roomId.value)
  if (!id) { roomDetail.value = {}; return }
  try {
    const res = await getRoomData({ id, type: 0 })
    roomDetail.value = res?.data ?? {}
  } catch (e) {
    console.error('roomData 加载失败:', e)
    roomDetail.value = {}
  }
}

/* 仪器统计（eqData） */
const eqParams = ref({ id: '', type: 0 })
const eqDateRange = ref([])
const eqLoading = ref(false)
const eqDetail = ref(null)

const loadEqDetail = async () => {
  const id = stripBackticks(eqParams.value.id)
  if (!id) { eqDetail.value = null; return }
  eqLoading.value = true
  try {
    const payload = { id, type: eqParams.value.type }
    if (payload.type === 1 && Array.isArray(eqDateRange.value) && eqDateRange.value.length === 2) {
      payload.beginDate = eqDateRange.value[0]
      payload.endDate = eqDateRange.value[1]
    }
    const res = await getEqData(payload)
    eqDetail.value = res?.data ?? null
  } catch (e) {
    console.error('eqData 加载失败:', e)
    eqDetail.value = null
  } finally {
    eqLoading.value = false
  }
}

const goEquipmentDetailById = () => {
  const id = stripBackticks(eqParams.value.id)
  if (!id) return
  router.push(`/entities/equipment/${id}`)
}

// 新增：返回运营首页
const goDashboard = () => {
  router.push('/dashboard')
}

const goLogin = () => {
  userStore.logout()
  router.replace('/login')
}
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

    /* 新增：按钮区域样式（与整体风格一致） */
    .header-actions {
      margin-top: 12px;
      display: flex;
      justify-content: center;
    }
  }
}

.tab-wrapper {
  padding: 0 24px 24px;
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
      :deep(.el-select__wrapper),
      :deep(.el-date-editor) {
        background-color: rgba(255,255,255,0.06);
        border-color: rgba(0, 212, 255, 0.4);
        color: #ffffff;
      }
      :deep(.el-input__inner),
      :deep(.el-select__selected-item),
      :deep(.el-range-input) {
        color: #ffffff;
      }
      :deep(.el-input__inner::placeholder),
      :deep(.el-range-input::placeholder) {
        color: #b8dfff;
        opacity: 0.9;
      }
    }

    .info-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
      .info-item {
        display: flex; flex-direction: column; gap: 8px; padding: 12px;
        background: rgba(0, 212, 255, 0.03); border: 1px solid rgba(0, 212, 255, 0.15); border-radius: 8px;
        .label { font-size: 12px; color: rgba(0, 212, 255, 0.7); letter-spacing: 0.5px; }
        .value { font-size: 16px; font-weight: 600; color: #ffffff; }
        &.full-width { grid-column: 1 / -1; }
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

.pagination {
  display: flex; justify-content: flex-end; margin-top: 12px;
}

.tag {
  display: inline-block;
  background: rgba(0, 212, 255, 0.18);
  color: #00d4ff;
  border: 1px solid rgba(0, 212, 255, 0.35);
  border-radius: 6px;
  padding: 4px 8px;
  margin-right: 6px;
  font-size: 12px;
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