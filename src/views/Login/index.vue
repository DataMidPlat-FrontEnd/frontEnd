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
@import '@/styles/variables.scss';

.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: $bg-page;

  // 背景动画层
  .bg-animation { display: none; }

  // 登录卡片
  .login-box {
    position: relative;
    width: 480px;
    padding: 40px 36px;
    background: $bg-color;
    border-radius: 12px;
    border: 1px solid $border-light;
    box-shadow: $box-shadow-light;
    z-index: 1;

    // 装饰性边角
    .corner-decoration { display: none; }

    // Logo 和标题
    .login-header {
      text-align: center;
      margin-bottom: 45px;

      .logo-wrapper { margin-bottom: 16px; }
      .logo-icon { color: $primary-color; }

      .title {
        font-size: 28px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 8px;
        letter-spacing: 1px;
      }

      .subtitle {
        font-size: 12px;
        font-weight: 400;
        color: $text-secondary;
        letter-spacing: 2px;
        margin-bottom: 16px;
      }

      .title-divider { display: none; }
    }

    // 登录表单
    .login-form {
      // 输入框包装器 - 确保宽度与按钮一致
      .input-wrapper {
        position: relative;
        width: 100%;
      }

      // 登录按钮
      .login-button {
        position: relative;
        width: 100%;
        height: 46px;
        margin-top: 16px;
        background: $primary-color;
        border: none;
        border-radius: 8px;
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 2px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: $box-shadow-base;

        &:hover:not(:disabled) { opacity: 0.9; }
        &:active:not(:disabled) { opacity: 1; }
        &:disabled { opacity: 0.6; cursor: not-allowed; }

        .button-content { display: flex; align-items: center; justify-content: center; gap: 8px; }
      }
    }

    // 提示信息
    .login-footer {
      margin-top: 30px;

      .tips { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; color: $text-secondary; margin-bottom: 12px; }

      .version { text-align: center; font-size: 12px; color: $text-placeholder; letter-spacing: 1px; }
    }
  }
}

</style>

