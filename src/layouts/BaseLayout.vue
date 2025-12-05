<template>
  <el-container class="layout-container">
    <el-aside :width="collapsed ? '64px' : '220px'" class="layout-aside">
      <div class="brand" @click="goDashboard">
        <el-icon :size="collapsed ? 24 : 28"><DataAnalysis /></el-icon>
        <span v-if="!collapsed">业务数据融合后台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="layout-menu"
        :collapse="collapsed"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>运营首页</span>
        </el-menu-item>
        <el-sub-menu index="entities">
          <template #title>
            <el-icon><Collection /></el-icon>
            <span>实体统计</span>
          </template>
          <el-menu-item index="/entities/building">建筑统计</el-menu-item>
          <el-menu-item index="/entities/floor">楼层统计</el-menu-item>
          <el-menu-item index="/entities/room">房间统计</el-menu-item>
          <el-menu-item index="/entities/equipment">仪器统计</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="operation">
          <template #title>
            <el-icon><TrendCharts /></el-icon>
            <span>运营统计</span>
          </template>
          <el-menu-item index="/operation/platform">平台运营</el-menu-item>
          <el-menu-item index="/operation/equipment">仪器运营</el-menu-item>
          <el-menu-item index="/operation/user">用户运营</el-menu-item>
          <el-menu-item index="/operation/training">培训运营</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="usage">
          <template #title>
            <el-icon><DataLine /></el-icon>
            <span>使用统计</span>
          </template>
          <el-menu-item index="/usage/equipment">仪器使用</el-menu-item>
          <el-menu-item index="/usage/user">用户使用</el-menu-item>
          <el-menu-item index="/usage/group">课题组使用</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="performance">
          <template #title>
            <el-icon><Histogram /></el-icon>
            <span>业绩统计</span>
          </template>
          <el-menu-item index="/performance/admin">管理员业绩统计</el-menu-item>
          <el-menu-item index="/performance/platform">平台业绩统计</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="roi">
          <template #title>
            <el-icon><PieChart /></el-icon>
            <span>投入产出分析</span>
          </template>
          <el-menu-item index="/roi/buy">购置投入产出分析</el-menu-item>
          <el-menu-item index="/roi/repair">维保投入产出分析</el-menu-item>
          <el-menu-item index="/roi/train">培训投入产出分析</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="alarm">
          <template #title>
            <el-icon><Warning /></el-icon>
            <span>报警统计</span>
          </template>
          <el-menu-item index="/alarm/environment">环境超标报警</el-menu-item>
          <el-menu-item index="/alarm/shutdown">忘记关机报警</el-menu-item>
          <el-menu-item index="/alarm/theft">仪器盗用报警</el-menu-item>
          <el-menu-item index="/alarm/maintenance">维保到期报警</el-menu-item>
          <el-menu-item index="/alarm/bad-user">劣迹用户报警</el-menu-item>
          <el-menu-item index="/alarm/bad-behavior">劣迹行为报警</el-menu-item>
          <el-menu-item index="/alarm/violation">违规行为报警</el-menu-item>
        </el-sub-menu>
      </el-menu>
      <div class="collapse-bar">
        <el-button text @click="collapsed = !collapsed">
          <el-icon><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
          <span v-if="!collapsed">收起</span>
        </el-button>
      </div>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <template v-if="isTopHeaderRoute">
          <div class="hl">
            <div class="logo-icon">
              <el-icon :size="32"><component :is="headerIconComp" /></el-icon>
            </div>
            <div class="title-wrapper">
              <h1 class="title">{{ headerTitle }}</h1>
            </div>
          </div>
          <div class="hr">
            <div class="user-info">
              <el-icon class="user-icon"><User /></el-icon>
              <div class="user-details">
                <span class="user-name">{{ userStore.userName }}</span>
                <span class="user-role">{{ userStore.userRole }}</span>
              </div>
            </div>
            <button class="logout-button" @click="logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </button>
          </div>
        </template>
        <template v-else>
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-button link @click="logout">
              <el-icon><SwitchButton /></el-icon>
              退出
            </el-button>
          </div>
        </template>
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { DataAnalysis, HomeFilled, Collection, Fold, Expand, SwitchButton, User, TrendCharts, Warning, Histogram, DataLine, PieChart } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const collapsed = ref(false)
const keyword = ref('')

const activeMenu = computed(() => route.fullPath.startsWith('/entities') ? '/entities' : route.path)
const pageTitle = computed(() => route.meta.title || '')
const isTopHeaderRoute = computed(() => true)
const headerTitle = computed(() => pageTitle.value)
const headerIconComp = computed(() => {
  const p = route.path
  if (p.startsWith('/dashboard')) return HomeFilled
  if (p.startsWith('/entities')) return Collection
  if (p.startsWith('/operation')) return TrendCharts
  if (p.startsWith('/usage')) return DataLine
  if (p.startsWith('/performance')) return Histogram
  if (p.startsWith('/roi')) return PieChart
  if (p.startsWith('/alarm')) return Warning
  return DataAnalysis
})

const goDashboard = () => router.push('/dashboard')
const logout = () => { userStore.logout(); router.replace('/login') }

watch(keyword, () => {})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.layout-container { height: 100%; }
.layout-aside {
  background: $bg-color;
  border-right: 1px solid $border-light;
  display: flex; flex-direction: column;
}
.brand { display: flex; align-items: center; gap: 8px; padding: 12px; cursor: pointer; color: $text-primary; }
.layout-menu { border: none; }
.collapse-bar { margin-top: auto; padding: 8px; text-align: center; border-top: 1px solid $border-light; }

.layout-header { display: flex; align-items: center; justify-content: space-between; background: $bg-color; border-bottom: 1px solid $border-light; height: 56px; padding: 0 16px; }
.hl { display: flex; align-items: center; gap: 12px; }
.hr { display: flex; align-items: center; gap: 12px; }
.logo-icon { color: $primary-color; }
.title { font-size: 18px; font-weight: 600; color: $text-primary; margin: 0; }
.subtitle { font-size: 12px; color: $text-secondary; margin-top: 2px; }
.user-info { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; height: 36px; background: $bg-color; border: 1px solid $border-light; border-radius: 8px; }
.user-icon { font-size: 20px; color: $primary-color; }
.user-details { display: inline-flex; flex-direction: row; align-items: center; gap: 8px; }
.user-name { font-size: 14px; font-weight: 600; color: $text-primary; }
.user-role { font-size: 12px; color: $text-secondary; }
.logout-button { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #f56c6c; border: 1px solid transparent; border-radius: 8px; color: #fff; cursor: pointer; box-shadow: $box-shadow-base; }
.layout-main { padding: 16px; }
</style>
