/**
 * 路由配置
 * 定义应用的所有路由
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 路由配置
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/',
    component: () => import('@/layouts/BaseLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: { title: '运营首页', requiresAuth: true }
      },
      {
        path: 'entities',
        name: 'Entities',
        component: () => import('@/views/Entities/index.vue'),
        meta: { title: '实体统计', requiresAuth: true }
      },
      {
        path: 'entities/equipment/:id',
        name: 'EquipmentDetail',
        component: () => import('@/views/Entities/EquipmentDetail.vue'),
        meta: { title: '仪器详情', requiresAuth: true }
      },
      {
        path: 'operation/platform',
        name: 'PlatformOperation',
        component: () => import('@/views/Operation/Platform.vue'),
        meta: { title: '平台运营', requiresAuth: true }
      },
      {
        path: 'operation/equipment',
        name: 'EquipmentOperation',
        component: () => import('@/views/Operation/Equipment.vue'),
        meta: { title: '仪器运营', requiresAuth: true }
      },
      {
        path: 'operation/user',
        name: 'UserOperation',
        component: () => import('@/views/Operation/User.vue'),
        meta: { title: '用户运营', requiresAuth: true }
      },
      {
        path: 'operation/training',
        name: 'TrainingOperation',
        component: () => import('@/views/Operation/Training.vue'),
        meta: { title: '培训运营', requiresAuth: true }
      },
      {
        path: 'usage/equipment',
        name: 'UsageEquipment',
        component: () => import('@/views/Usage/Equipment.vue'),
        meta: { title: '仪器使用统计', requiresAuth: true }
      },
      {
        path: 'usage/user',
        name: 'UsageUser',
        component: () => import('@/views/Usage/User.vue'),
        meta: { title: '用户使用统计', requiresAuth: true }
      },
      {
        path: 'usage/group',
        name: 'UsageGroup',
        component: () => import('@/views/Usage/Pi.vue'),
        meta: { title: '课题组使用统计', requiresAuth: true }
      },
      {
        path: 'performance/admin',
        name: 'PerformanceAdmin',
        component: () => import('@/views/Performance/Admin.vue'),
        meta: { title: '管理员业绩统计', requiresAuth: true }
      },
      {
        path: 'performance/platform',
        name: 'PerformancePlatform',
        component: () => import('@/views/Performance/Platform.vue'),
        meta: { title: '平台业绩统计', requiresAuth: true }
      },
      {
        path: 'roi/buy',
        name: 'RoiBuy',
        component: () => import('@/views/ROI/Buy.vue'),
        meta: { title: '购置投入产出分析', requiresAuth: true }
      },
      {
        path: 'roi/repair',
        name: 'RoiRepair',
        component: () => import('@/views/ROI/Repair.vue'),
        meta: { title: '维保投入产出分析', requiresAuth: true }
      },
      {
        path: 'roi/train',
        name: 'RoiTrain',
        component: () => import('@/views/ROI/Train.vue'),
        meta: { title: '培训投入产出分析', requiresAuth: true }
      },
      {
        path: 'alarm/environment',
        name: 'AlarmEnvironment',
        component: () => import('@/views/Alarm/Environment.vue'),
        meta: { title: '环境超标报警', requiresAuth: true }
      },
      {
        path: 'alarm/shutdown',
        name: 'AlarmShutdown',
        component: () => import('@/views/Alarm/Shutdown.vue'),
        meta: { title: '忘记关机报警', requiresAuth: true }
      },
      {
        path: 'alarm/theft',
        name: 'AlarmTheft',
        component: () => import('@/views/Alarm/Theft.vue'),
        meta: { title: '仪器盗用报警', requiresAuth: true }
      },
      {
        path: 'alarm/maintenance',
        name: 'AlarmMaintenance',
        component: () => import('@/views/Alarm/Maintenance.vue'),
        meta: { title: '维保到期报警', requiresAuth: true }
      },
      {
        path: 'alarm/bad-user',
        name: 'AlarmBadUser',
        component: () => import('@/views/Alarm/BadUser.vue'),
        meta: { title: '劣迹用户报警', requiresAuth: true }
      },
      {
        path: 'alarm/bad-behavior',
        name: 'AlarmBadBehavior',
        component: () => import('@/views/Alarm/BadBehavior.vue'),
        meta: { title: '劣迹行为报警', requiresAuth: true }
      },
      {
        path: 'alarm/violation',
        name: 'AlarmViolation',
        component: () => import('@/views/Alarm/Violation.vue'),
        meta: { title: '违规行为报警', requiresAuth: true }
      }
    ]
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 业务数据融合后台` : '业务数据融合后台'

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    if (userStore.isLoggedIn) {
      next()
    } else {
      // 未登录，跳转到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  } else {
    // 如果已登录且访问登录页，跳转到首页
    if (to.path === '/login' && userStore.isLoggedIn) {
      next({ path: '/' })
    } else {
      next()
    }
  }
})

export default router

