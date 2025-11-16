<template>
  <div class="entities-page">
    <!-- 页面标题 -->
    <el-card class="page-header">
      <template #header>
        <div class="card-header">
          <span>实体统计</span>
          <el-button type="primary" @click="goDashboard">返回运营首页</el-button>
        </div>
      </template>
    </el-card>

    <!-- 内容区域 -->
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

                <div v-if="buildingData" class="table-wrapper">
                  <table class="tech-table">
                    <thead>
                      <tr>
                        <th>指标</th>
                        <th>数值</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>建筑名称</td><td>{{ buildingData.name ?? '-' }}</td></tr>
                      <tr><td>建筑用途</td><td>{{ buildingData.usage ?? '-' }}</td></tr>
                      <tr><td>部署平台</td><td>{{ buildingData.platform ?? '-' }}</td></tr>
                      <tr><td>建筑面积(㎡)</td><td>{{ buildingData.area ?? '-' }}</td></tr>
                      <tr><td>楼层数量</td><td>{{ buildingData.floor ?? '-' }}</td></tr>
                      <tr><td>仪器数量</td><td>{{ buildingData.ins ?? '-' }}</td></tr>
                      <tr><td>仪器使用次数</td><td>{{ buildingData.insUse ?? '-' }}</td></tr>
                      <tr><td>总用户数</td><td>{{ buildingData.tUser ?? '-' }}</td></tr>
                      <tr><td>内部用户数</td><td>{{ buildingData.iUser ?? '-' }}</td></tr>
                      <tr><td>外部用户数</td><td>{{ buildingData.oUser ?? '-' }}</td></tr>
                      <tr><td>资产总价值(万元)</td><td>{{ buildingData.totalAssetValue ?? '-' }}</td></tr>
                      <tr><td>总收入(元)</td><td>{{ buildingData.tIncome ?? '-' }}</td></tr>
                      <tr><td>内部收入(元)</td><td>{{ buildingData.iIncome ?? '-' }}</td></tr>
                      <tr><td>外部收入(元)</td><td>{{ buildingData.oIncome ?? '-' }}</td></tr>
                      <tr><td>总机时数(小时)</td><td>{{ buildingData.tTime ?? '-' }}</td></tr>
                      <tr><td>内部机时数(小时)</td><td>{{ buildingData.iTime ?? '-' }}</td></tr>
                      <tr><td>外部机时数(小时)</td><td>{{ buildingData.oTime ?? '-' }}</td></tr>
                      <tr><td>总课题组数</td><td>{{ buildingData.tGroup ?? '-' }}</td></tr>
                      <tr><td>内部课题组数</td><td>{{ buildingData.iGroup ?? '-' }}</td></tr>
                      <tr><td>外部课题组数</td><td>{{ buildingData.oGroup ?? '-' }}</td></tr>
                      <tr><td>总经费卡数</td><td>{{ buildingData.tCard ?? '-' }}</td></tr>
                      <tr><td>内部经费卡数</td><td>{{ buildingData.iCard ?? '-' }}</td></tr>
                      <tr><td>外部经费卡数</td><td>{{ buildingData.oCard ?? '-' }}</td></tr>
                      <tr><td>培训场数</td><td>{{ buildingData.train ?? '-' }}</td></tr>
                      <tr><td>培训人数</td><td>{{ buildingData.trainUser ?? '-' }}</td></tr>
                      <tr><td>培训资料数</td><td>{{ buildingData.trainInfo ?? '-' }}</td></tr>
                      <tr><td>培训通过率(%)</td><td>{{ buildingData.trainPass ?? '-' }}</td></tr>
                    </tbody>
                  </table>
                  <div class="actions">
                    <el-button type="primary" plain>导出报表</el-button>
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

                <div class="table-wrapper">
                  <table class="tech-table">
                    <thead><tr><th>指标</th><th>数值</th></tr></thead>
                    <tbody>
                      <tr><td>名称</td><td>{{ floorInfoSafe.name || '—' }}</td></tr>
                      <tr><td>用途</td><td>{{ floorInfoSafe.usage || '—' }}</td></tr>
                      <tr><td>面积(㎡)</td><td>{{ floorInfoSafe.area || '—' }}</td></tr>
                      <tr>
                        <td>包含平台</td>
                        <td>
                          <span v-if="floorInfoSafe.platform && floorInfoSafe.platform.length">
                            <span v-for="p in floorInfoSafe.platform" :key="p.id" class="tag">{{ p.name }}</span>
                          </span>
                          <span v-else>—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="actions">
                    <el-button type="primary" plain>导出报表</el-button>
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

                <div v-if="roomDetailSafe.name" class="table-wrapper">
                  <table class="tech-table">
                    <thead><tr><th>指标</th><th>数值</th></tr></thead>
                    <tbody>
                      <tr><td>房间名称</td><td>{{ roomDetailSafe.name }}</td></tr>
                      <tr><td>房间用途</td><td>{{ roomDetailSafe.usage || '—' }}</td></tr>
                      <tr><td>房间面积(㎡)</td><td>{{ roomDetailSafe.area || '—' }}</td></tr>
                      <tr>
                        <td>所属平台</td>
                        <td>
                          <span v-if="roomDetailSafe.platform && roomDetailSafe.platform.length">
                            <span v-for="p in roomDetailSafe.platform" :key="p.id" class="tag">{{ p.name }}</span>
                          </span>
                          <span v-else>—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="actions">
                    <el-button type="primary" plain>导出报表</el-button>
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

                <div v-if="eqDetail" class="table-wrapper">
                  <table class="tech-table">
                    <thead><tr><th>指标</th><th>数值</th></tr></thead>
                    <tbody>
                      <tr><td>仪器名称</td><td>{{ eqDetail.name || '-' }}</td></tr>
                      <tr><td>资产编号</td><td>{{ eqDetail.code || '-' }}</td></tr>
                      <tr><td>品牌</td><td>{{ eqDetail.manufacturer || '-' }}</td></tr>
                      <tr><td>型号</td><td>{{ eqDetail.instrVersion || '-' }}</td></tr>
                      <tr><td>参数</td><td>{{ eqDetail.technical || '-' }}</td></tr>
                      <tr><td>所属平台</td><td>{{ eqDetail.platform || '-' }}</td></tr>
                      <tr><td>所属房间</td><td>{{ eqDetail.room || '-' }}</td></tr>
                      <tr><td>当前状态</td><td>{{ eqDetail.status || '-' }}</td></tr>
                      <tr><td>使用率(%)</td><td>{{ eqDetail.usage ?? '-' }}</td></tr>
                      <tr><td>总机时(小时)</td><td>{{ eqDetail.tTime ?? '-' }}</td></tr>
                      <tr><td>内部机时(小时)</td><td>{{ eqDetail.iTime ?? '-' }}</td></tr>
                      <tr><td>外部机时(小时)</td><td>{{ eqDetail.oTime ?? '-' }}</td></tr>
                      <tr><td>总预约人数</td><td>{{ eqDetail.tUser ?? '-' }}</td></tr>
                      <tr><td>内部预约人数</td><td>{{ eqDetail.iUser ?? '-' }}</td></tr>
                      <tr><td>外部预约人数</td><td>{{ eqDetail.oUser ?? '-' }}</td></tr>
                      <tr><td>总服务项目数</td><td>{{ eqDetail.tCard ?? '-' }}</td></tr>
                      <tr><td>内部服务项目数</td><td>{{ eqDetail.iCard ?? '-' }}</td></tr>
                      <tr><td>外部服务项目数</td><td>{{ eqDetail.oCard ?? '-' }}</td></tr>
                      <tr><td>使用样品数</td><td>{{ eqDetail.sample ?? '-' }}</td></tr>
                      <tr><td>使用耗材数</td><td>{{ eqDetail.materials ?? '-' }}</td></tr>
                      <tr><td>功能特色</td><td>{{ eqDetail.function || '-' }}</td></tr>
                      <tr><td>支撑成果</td><td>{{ eqDetail.result || '-' }}</td></tr>
                      <tr><td>简介</td><td>{{ eqDetail.remark || '-' }}</td></tr>
                      <tr><td>管理员联系方式</td><td>{{ eqDetail.mgr || '-' }}</td></tr>
                    </tbody>
                  </table>
                  <div class="actions">
                    <el-button type="primary" plain>导出报表</el-button>
                  </div>
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
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { DocumentRemove, DataAnalysis } from '@element-plus/icons-vue'
import { getBuildingData, getFloorData, getRoomData, getRoomDataByFloor, getEqData } from '@/api/entities'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// Tabs
const activeTab = ref('building')
if (route.query.tab) activeTab.value = String(route.query.tab)
watch(() => route.query.tab, (t) => { if (t) activeTab.value = String(t) })
watch(activeTab, (t) => { router.replace({ path: '/entities', query: { tab: t } }) })

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

  .corner-decoration { display: none; }

  .box-header { display: none; }
}

.tab-wrapper {
  padding: 0 24px 24px;
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

    .info-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
      .info-item {
        display: flex; flex-direction: column; gap: 8px; padding: 12px;
        background: $bg-color; border: 1px solid $border-light; border-radius: 8px;
        .label { font-size: 12px; color: $text-secondary; letter-spacing: 0.5px; }
        .value { font-size: 16px; font-weight: 600; color: $text-primary; }
        &.full-width { grid-column: 1 / -1; }
      }
    }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: $text-regular; .empty-icon { font-size: 42px; color: $primary-color; } }

    .table-wrapper { overflow-x: auto; }
    .tech-table { width: 100%; border-collapse: collapse; color: $text-primary; th, td { border-bottom: 1px solid $border-light; padding: 12px; text-align: left; } th { color: $text-regular; font-weight: 600; } }
    .actions { display: flex; justify-content: flex-end; margin-top: 12px; }
  }
}

.pagination {
  display: flex; justify-content: flex-end; margin-top: 12px;
}

.tag {
  display: inline-block;
  background: rgba(64, 158, 255, 0.12);
  color: $primary-color;
  border: 1px solid rgba(64, 158, 255, 0.25);
  border-radius: 6px;
  padding: 4px 8px;
  margin-right: 6px;
  font-size: 12px;
}

@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.1); opacity: 1; } }
@keyframes titleGlow { 0%, 100% { text-shadow: none; } 50% { text-shadow: none; } }

/* 隐藏深色背景动画元素 */
.bg-animation, .bg-gradient, .grid-lines, .particles { display: none; }
</style>