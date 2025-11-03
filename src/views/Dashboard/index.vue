<template>
  <div class="dashboard-container">
    <!-- 背景动画层 -->
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

    <!-- 主内容区 -->
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
          <button class="logout-button" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            <span>退出登录</span>
          </button>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content">
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
                <span class="value permission" :class="{ 'full': userStore.hasFullPermission }">
                  <el-icon><Lock /></el-icon>
                  {{ userStore.hasFullPermission ? '全部数据' : '受限数据' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 预约列表卡片 -->
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
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  DataAnalysis,
  User,
  SwitchButton,
  UserFilled,
  Lock,
  Calendar,
  DocumentRemove
} from '@element-plus/icons-vue'

// 路由
const router = useRouter()

// 用户状态管理
const userStore = useUserStore()

/**
 * 生成粒子样式
 * @param {Number} index - 粒子索引
 * @returns {Object} 样式对象
 */
const getParticleStyle = (index) => {
  const size = Math.random() * 3 + 1
  const left = Math.random() * 100
  const animationDuration = Math.random() * 20 + 15
  const animationDelay = Math.random() * 5

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDuration: `${animationDuration}s`,
    animationDelay: `${animationDelay}s`
  }
}

/**
 * 退出登录
 */
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (error) {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
// 科技风格运营首页样式
.dashboard-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  background: #0a0e27;

  // 背景动画层
  .bg-animation {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;

    // 渐变背景
    .bg-gradient {
      position: absolute;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg,
        #0a0e27 0%,
        #1a1f3a 25%,
        #2a1f3f 50%,
        #1a1f3a 75%,
        #0a0e27 100%);
      animation: gradientShift 15s ease infinite;
    }

    // 网格线
    .grid-lines {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0.08;

      .grid-line {
        position: absolute;
        background: linear-gradient(90deg, transparent, #00d4ff, transparent);

        &.horizontal {
          width: 100%;
          height: 1px;
        }

        &.vertical {
          width: 1px;
          height: 100%;
        }
      }
    }

    // 浮动粒子
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

  // 主内容区
  .main-content {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    padding: 20px;

    // 顶部导航栏
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

      .header-left {
        display: flex;
        align-items: center;
        gap: 20px;

        .logo-icon {
          color: #00d4ff;
          filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.6));
          animation: logoGlow 3s ease-in-out infinite;
        }

        .title-wrapper {
          .title {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
            letter-spacing: 2px;
            text-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
          }

          .subtitle {
            font-size: 12px;
            color: #00d4ff;
            margin: 4px 0 0 0;
            letter-spacing: 2px;
            opacity: 0.8;
          }
        }
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 20px;

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 20px;
          background: rgba(0, 212, 255, 0.05);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 8px;

          .user-icon {
            font-size: 24px;
            color: #00d4ff;
          }

          .user-details {
            display: flex;
            flex-direction: column;
            gap: 2px;

            .user-name {
              font-size: 14px;
              font-weight: 600;
              color: #ffffff;
            }

            .user-role {
              font-size: 12px;
              color: rgba(0, 212, 255, 0.8);
            }
          }
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

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(244, 67, 54, 0.5);
            background: linear-gradient(135deg, rgba(244, 67, 54, 1), rgba(211, 47, 47, 1));
          }

          &:active {
            transform: translateY(0);
          }
        }
      }
    }

    // 内容区域
    .content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 30px;

      // 科技卡片
      .tech-card {
        background: rgba(15, 20, 40, 0.85);
        backdrop-filter: blur(20px);
        border-radius: 12px;
        border: 1px solid rgba(0, 212, 255, 0.2);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        transition: all 0.3s ease;

        &:hover {
          border-color: rgba(0, 212, 255, 0.4);
          box-shadow: 0 6px 30px rgba(0, 212, 255, 0.2);
        }

        // 卡片头部
        .card-header {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 30px;
          background: rgba(0, 212, 255, 0.05);
          border-bottom: 1px solid rgba(0, 212, 255, 0.2);

          .header-icon {
            font-size: 24px;
            color: #00d4ff;
            filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.6));
          }

          h3 {
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
        }

        // 卡片主体
        .card-body {
          padding: 30px;

          // 信息网格
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;

            .info-item {
              display: flex;
              flex-direction: column;
              gap: 8px;
              padding: 16px;
              background: rgba(0, 212, 255, 0.03);
              border: 1px solid rgba(0, 212, 255, 0.15);
              border-radius: 8px;
              transition: all 0.3s ease;

              &:hover {
                background: rgba(0, 212, 255, 0.08);
                border-color: rgba(0, 212, 255, 0.3);
              }

              &.full-width {
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

                &.permission {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  color: #f4a460;

                  &.full {
                    color: #00ff88;
                  }

                  .el-icon {
                    font-size: 18px;
                  }
                }
              }
            }
          }

          // 空状态
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            color: rgba(255, 255, 255, 0.4);

            .empty-icon {
              font-size: 64px;
              margin-bottom: 16px;
              opacity: 0.5;
            }

            p {
              font-size: 14px;
              margin: 0;
            }
          }

          // 表格容器
          .table-wrapper {
            overflow-x: auto;

            // 科技表格
            .tech-table {
              width: 100%;
              border-collapse: collapse;

              thead {
                tr {
                  background: rgba(0, 212, 255, 0.1);
                  border-bottom: 2px solid rgba(0, 212, 255, 0.3);

                  th {
                    padding: 16px;
                    text-align: left;
                    font-size: 14px;
                    font-weight: 600;
                    color: #00d4ff;
                    letter-spacing: 0.5px;
                    white-space: nowrap;
                  }
                }
              }

              tbody {
                tr {
                  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
                  transition: all 0.3s ease;

                  &:hover {
                    background: rgba(0, 212, 255, 0.05);
                  }

                  td {
                    padding: 16px;
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.9);
                    white-space: nowrap;

                    &.location-cell {
                      max-width: 300px;
                      white-space: normal;
                      word-break: break-all;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

// 动画定义
@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes particleFloat {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.4;
  }
  90% {
    opacity: 0.4;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

@keyframes logoGlow {
  0%, 100% {
    filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.6));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.9));
  }
}

// 响应式设计
@media (max-width: 768px) {
  .dashboard-container {
    .main-content {
      padding: 10px;

      .header {
        flex-direction: column;
        gap: 15px;
        padding: 15px;

        .header-left,
        .header-right {
          width: 100%;
          justify-content: center;
        }
      }

      .content {
        .tech-card {
          .card-body {
            padding: 20px;

            .info-grid {
              grid-template-columns: 1fr;
            }
          }
        }
      }
    }
  }
}
</style>

