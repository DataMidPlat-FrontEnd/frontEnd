<template>
  <div class="login-container">
    <!-- 背景动画层 -->
    <div class="bg-animation">
      <!-- 渐变背景 -->
      <div class="bg-gradient"></div>

      <!-- 网格线 -->
      <div class="grid-lines">
        <div v-for="i in 20" :key="`h-${i}`" class="grid-line horizontal" :style="{ top: `${i * 5}%` }"></div>
        <div v-for="i in 20" :key="`v-${i}`" class="grid-line vertical" :style="{ left: `${i * 5}%` }"></div>
      </div>

      <!-- 浮动粒子 -->
      <div class="particles">
        <div v-for="i in 30" :key="`p-${i}`" class="particle" :style="getParticleStyle(i)"></div>
      </div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-box">
      <!-- 装饰性边角 -->
      <div class="corner-decoration tl"></div>
      <div class="corner-decoration tr"></div>
      <div class="corner-decoration bl"></div>
      <div class="corner-decoration br"></div>

      <!-- Logo 和标题 -->
      <div class="login-header">
        <div class="logo-wrapper">
          <div class="logo-icon">
            <el-icon :size="56"><DataAnalysis /></el-icon>
          </div>
          <div class="logo-glow"></div>
        </div>
        <h1 class="title">业务数据融合后台</h1>
        <p class="subtitle">BUSINESS DATA FUSION PLATFORM</p>
        <div class="title-divider"></div>
      </div>

      <!-- 登录表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <div class="input-wrapper">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              prefix-icon="User"
              clearable
            />
            <div class="input-border"></div>
          </div>
        </el-form-item>

        <el-form-item prop="password">
          <div class="input-wrapper">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              prefix-icon="Lock"
              show-password
              clearable
            />
            <div class="input-border"></div>
          </div>
        </el-form-item>

        <el-form-item>
          <button
            type="button"
            :disabled="loading"
            class="login-button"
            @click="handleLogin"
          >
            <span class="button-content">
              <el-icon v-if="loading" class="loading-icon"><Loading /></el-icon>
              <span>{{ loading ? '登录中...' : '登 录 系 统' }}</span>
            </span>
            <div class="button-glow"></div>
            <div class="button-shine"></div>
          </button>
        </el-form-item>
      </el-form>

      <!-- 提示信息 -->
      <div class="login-footer">
        <div class="tips">
          <el-icon><InfoFilled /></el-icon>
          <span>仅限授权用户登录</span>
        </div>
        <div class="version">Version 1.0.0 | © 2025</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock, InfoFilled, DataAnalysis, Loading } from '@element-plus/icons-vue'

// 路由
const router = useRouter()
const route = useRoute()

// 用户状态管理
const userStore = useUserStore()

// 表单引用
const loginFormRef = ref(null)

// 加载状态
const loading = ref(false)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度在 6 到 50 个字符', trigger: 'blur' }
  ]
}

/**
 * 生成粒子样式
 * @param {Number} index - 粒子索引
 * @returns {Object} 样式对象
 */
const getParticleStyle = (index) => {
  const size = Math.random() * 4 + 2
  const left = Math.random() * 100
  const animationDuration = Math.random() * 20 + 10
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
 * 处理登录
 */
const handleLogin = async () => {
  // 验证表单
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true

    try {
      // 调用登录接口
      await userStore.login(loginForm.username, loginForm.password)

      ElMessage.success('登录成功')

      // 跳转到目标页面或首页
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } catch (error) {
      ElMessage.error(error.message || '登录失败，请检查用户名和密码')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
// 科技风格登录页面样式
.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0e27;

  // 背景动画层
  .bg-animation {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;

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
      opacity: 0.1;

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
        opacity: 0.6;
        animation: particleFloat linear infinite;
        box-shadow: 0 0 10px #00d4ff;
      }
    }
  }

  // 登录卡片
  .login-box {
    position: relative;
    width: 480px;
    padding: 50px 45px;
    background: rgba(15, 20, 40, 0.85);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(0, 212, 255, 0.2);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.4),
      0 0 80px rgba(0, 212, 255, 0.1),
      inset 0 0 80px rgba(0, 212, 255, 0.03);
    z-index: 1;
    animation: boxFloat 6s ease-in-out infinite;

    // 装饰性边角
    .corner-decoration {
      position: absolute;
      width: 30px;
      height: 30px;
      border: 2px solid #00d4ff;
      opacity: 0.6;

      &.tl {
        top: -1px;
        left: -1px;
        border-right: none;
        border-bottom: none;
        border-top-left-radius: 20px;
      }

      &.tr {
        top: -1px;
        right: -1px;
        border-left: none;
        border-bottom: none;
        border-top-right-radius: 20px;
      }

      &.bl {
        bottom: -1px;
        left: -1px;
        border-right: none;
        border-top: none;
        border-bottom-left-radius: 20px;
      }

      &.br {
        bottom: -1px;
        right: -1px;
        border-left: none;
        border-top: none;
        border-bottom-right-radius: 20px;
      }
    }

    // Logo 和标题
    .login-header {
      text-align: center;
      margin-bottom: 45px;

      .logo-wrapper {
        position: relative;
        display: inline-block;
        margin-bottom: 25px;

        .logo-icon {
          position: relative;
          color: #00d4ff;
          animation: logoRotate 20s linear infinite;
          filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.6));
          z-index: 1;
        }

        .logo-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.3), transparent 70%);
          border-radius: 50%;
          animation: pulse 3s ease-in-out infinite;
        }
      }

      .title {
        font-size: 32px;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 12px;
        letter-spacing: 2px;
        text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
        animation: titleGlow 3s ease-in-out infinite;
      }

      .subtitle {
        font-size: 13px;
        font-weight: 300;
        color: #00d4ff;
        letter-spacing: 3px;
        opacity: 0.8;
        margin-bottom: 20px;
      }

      .title-divider {
        width: 60px;
        height: 3px;
        margin: 0 auto;
        background: linear-gradient(90deg, transparent, #00d4ff, transparent);
        border-radius: 2px;
        box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
      }
    }

    // 登录表单
    .login-form {
      .input-wrapper {
        position: relative;

        :deep(.el-input) {
          .el-input__wrapper {
            background: rgba(0, 212, 255, 0.05);
            border: 1px solid rgba(0, 212, 255, 0.3);
            box-shadow: none;
            transition: all 0.3s ease;

            &:hover {
              border-color: rgba(0, 212, 255, 0.5);
              background: rgba(0, 212, 255, 0.08);
            }

            &.is-focus {
              border-color: #00d4ff;
              background: rgba(0, 212, 255, 0.1);
              box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
            }

            input {
              color: #ffffff;

              &::placeholder {
                color: rgba(255, 255, 255, 0.4);
              }
            }

            .el-input__prefix {
              color: #00d4ff;
            }

            .el-input__suffix {
              color: #00d4ff;
            }
          }
        }

        .input-border {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #00d4ff, #00ff88);
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }

        &:focus-within .input-border {
          width: 100%;
        }
      }

      // 登录按钮
      .login-button {
        position: relative;
        width: 100%;
        height: 50px;
        margin-top: 20px;
        background: linear-gradient(135deg, #00d4ff, #00a8cc);
        border: none;
        border-radius: 8px;
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 4px;
        cursor: pointer;
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(0, 212, 255, 0.5);

          .button-shine {
            left: 100%;
          }
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          z-index: 1;

          .loading-icon {
            animation: rotate 1s linear infinite;
          }
        }

        .button-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.2), transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        &:hover:not(:disabled) .button-glow {
          opacity: 1;
        }

        .button-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.6s ease;
        }
      }
    }

    // 提示信息
    .login-footer {
      margin-top: 30px;

      .tips {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 13px;
        color: rgba(0, 212, 255, 0.7);
        margin-bottom: 15px;

        .el-icon {
          font-size: 16px;
        }
      }

      .version {
        text-align: center;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.3);
        letter-spacing: 1px;
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
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

@keyframes boxFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes logoRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.5;
  }
}

@keyframes titleGlow {
  0%, 100% {
    text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
  }
  50% {
    text-shadow: 0 0 30px rgba(0, 212, 255, 0.8), 0 0 40px rgba(0, 212, 255, 0.4);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

