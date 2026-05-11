<template>
  <div class="login-page">
    <!-- 动态背景 -->
    <div class="bg-animation">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="grid-pattern"></div>
    </div>

    <div class="login-wrapper anim-fade-up">
      <!-- 左侧品牌区 -->
      <div class="brand-panel">
        <div class="brand-content">
          <div class="brand-logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="url(#logo-grad)"/>
              <path d="M14 16l10-6 10 6v16l-10 6-10-6V16z" stroke="white" stroke-width="2.5" fill="none"/>
              <circle cx="24" cy="24" r="5" fill="white" opacity="0.9"/>
              <defs><linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48"><stop stop-color="#818cf8"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>
            </svg>
          </div>
          <h1>私有云盘</h1>
          <p class="brand-desc">Enterprise Private Cloud Storage</p>
          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
              <span>永久存储，永不清理</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>
              <span>端到端私密加密</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
              <span>全格式在线预览</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="form-panel glass-panel">
        <div class="form-header">
          <h2>欢迎回来</h2>
          <p>登录你的私有云盘账号</p>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" size="large" class="login-form">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="用户名或邮箱地址"
              :prefix-icon="User"
              class="custom-input"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="输入密码"
              :prefix-icon="Lock"
              show-password
              class="custom-input"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <div class="form-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <a href="#" class="forgot-link">忘记密码?</a>
          </div>

          <el-button
            type="primary"
            :loading="loading"
            @click="handleLogin"
            class="login-btn"
            size="large"
          >
            <span v-if="!loading">登 录</span>
            <span v-else>验证中...</span>
          </el-button>

          <div class="form-footer">
            <span>还没有账号？</span>
            <router-link to="/register" class="register-link">
              立即注册 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </router-link>
          </div>
        </el-form>
      </div>
    </div>

    <!-- 底部版权 -->
    <div class="login-footer">
      <span>&copy; 2026 Private Cloud Storage. All rights reserved.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref()
const loading = ref(false)
const rememberMe = ref(false)

const form = reactive({ username: '', password: '' })

const rules = {
  username: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await authStore.login(form.username, form.password)
    ElMessage.success({ message: '登录成功，欢迎回来！', duration: 2000 })
    router.push('/dashboard')
  } catch (e: any) {
    ElMessage.error({ message: e.response?.data?.message || '用户名或密码错误', duration: 3000 })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #0f172a;
}

// === 动态背景 ===
.bg-animation {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;
    animation: float 8s ease-in-out infinite;
  }
  .orb-1 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, #6366f1, transparent 70%);
    top: -20%; left: -10%;
    animation-delay: 0s;
  }
  .orb-2 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, #8b5cf6, transparent 70%);
    bottom: -20%; right: -5%;
    animation-delay: -3s;
  }
  .orb-3 {
    width: 350px; height: 350px;
    background: radial-gradient(circle, #a855f7, transparent 70%);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    animation-delay: -6s;
  }

  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 60px 60px;
  }
}

// === 登录容器 ===
.login-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  width: 960px;
  max-width: 95vw;
  min-height: 560px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0,0,0,0.4);
}

// === 左侧品牌面板 ===
.brand-panel {
  flex: 1;
  background: var(--primary-gradient);
  background-size: 200% 200%;
  animation: gradient-shift 8s ease infinite;
  padding: 48px 40px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }

  @media (max-width: 768px) {
    display: none;
  }
}

.brand-content {
  position: relative;
  z-index: 1;
  color: white;

  .brand-logo {
    margin-bottom: 24px;
    svg { width: 56px; height: 56px; }
  }

  h1 {
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 6px;
  }

  .brand-desc {
    font-size: 14px;
    opacity: 0.7;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 40px;
  }

  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    opacity: 0.9;

    .feature-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background: rgba(255,255,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
  }
}

// === 右侧表单 ===
.form-panel {
  width: 440px;
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px);

  html.dark & {
    background: rgba(30,41,59,0.95);
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 32px 24px;
  }
}

.form-header {
  margin-bottom: 32px;
  h2 { font-size: 26px; font-weight: 700; color: var(--text-color); margin-bottom: 6px; }
  p { font-size: 14px; color: var(--text-secondary); }
}

.login-form {
  .custom-input {
    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--border-color);
      padding: 4px 16px;
      border-radius: var(--radius-md) !important;
      transition: all var(--transition-base);
      background: var(--bg-color);
      &:hover, &.is-focus {
        box-shadow: 0 0 0 2px var(--primary-light);
        background: var(--card-bg);
      }
    }
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  .forgot-link {
    font-size: 13px;
    color: var(--primary-color);
    &:hover { text-decoration: underline; }
  }
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  border-radius: var(--radius-md);
  background: var(--primary-gradient) !important;
  border: none !important;
  transition: all var(--transition-base);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(99,102,241,0.4);
  }

  &:active { transform: translateY(0); }
}

.form-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);

  .register-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--primary-color);
    font-weight: 600;
    margin-left: 4px;
    &:hover svg { transform: translateX(3px); }
    svg { transition: transform var(--transition-fast); }
  }
}

.login-footer {
  position: relative;
  z-index: 1;
  margin-top: 24px;
  font-size: 12px;
  color: rgba(255,255,255,0.3);
}
</style>
