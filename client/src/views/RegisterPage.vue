<template>
  <div class="register-page">
    <div class="bg-animation">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="grid-pattern"></div>
    </div>

    <div class="register-wrapper anim-fade-up">
      <div class="form-panel glass-panel">
        <div class="form-header">
          <div class="back-link">
            <router-link to="/login">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              返回登录
            </router-link>
          </div>
          <h2>创建账号</h2>
          <p>开启你的私有云盘之旅</p>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" size="large">
          <div class="form-row">
            <el-form-item prop="username">
              <el-input v-model="form.username" placeholder="设置用户名" :prefix-icon="User" class="custom-input" />
            </el-form-item>
            <el-form-item prop="email">
              <el-input v-model="form.email" placeholder="邮箱地址" :prefix-icon="Message" class="custom-input" />
            </el-form-item>
          </div>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="设置密码（至少6位）" :prefix-icon="Lock" show-password class="custom-input" />
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" placeholder="确认密码" :prefix-icon="Lock" show-password class="custom-input" @keyup.enter="handleRegister" />
          </el-form-item>

          <div class="terms-agree">
            <el-checkbox v-model="agreeTerms" />
            <span>我同意 <a href="#">服务条款</a> 和 <a href="#">隐私政策</a></span>
          </div>

          <el-button type="primary" :loading="loading" @click="handleRegister" class="register-btn" size="large">
            <span v-if="!loading">创建账号</span>
            <span v-else>创建中...</span>
          </el-button>

          <div class="form-footer">
            已有账号？<router-link to="/login">立即登录</router-link>
          </div>
        </el-form>
      </div>

      <div class="brand-side">
        <div class="brand-text">
          <div class="brand-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="rgba(255,255,255,0.15)"/><path d="M16 28l8 4 8-4M16 20l8 4 8-4M24 14v18" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
          <h3>你的专属知识库</h3>
          <p>永久保存所有学习资料</p>
          <ul>
            <li>无限层级文件夹</li>
            <li>大文件分片上传</li>
            <li>全格式在线预览</li>
            <li>私密加密分享</li>
          </ul>
        </div>
      </div>
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
const agreeTerms = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const validateConfirm = (_rule: any, value: string, callback: any) => {
  callback(value !== form.password ? new Error('两次密码不一致') : undefined)
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度3-20位', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

async function handleRegister() {
  if (!agreeTerms.value) {
    ElMessage.warning('请先同意服务条款')
    return
  }
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await authStore.register(form.username, form.email, form.password)
    ElMessage.success('注册成功！欢迎加入')
    router.push('/dashboard')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #0f172a;
}

.bg-animation {
  position: absolute; inset: 0; overflow: hidden; z-index: 0;
  .orb {
    position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5;
    animation: float 8s ease-in-out infinite;
  }
  .orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #10b981, transparent 70%); top: -20%; right: -10%; }
  .orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #6366f1, transparent 70%); bottom: -20%; left: -5%; animation-delay: -3s; }
  .orb-3 { width: 300px; height: 300px; background: radial-gradient(circle, #8b5cf6, transparent 70%); top: 40%; left: 30%; animation-delay: -6s; }
  .grid-pattern {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 60px 60px;
  }
}

.register-wrapper {
  position: relative; z-index: 1;
  display: flex; width: 900px; max-width: 95vw;
  min-height: 600px; border-radius: var(--radius-xl);
  overflow: hidden; box-shadow: 0 25px 80px rgba(0,0,0,0.4);
}

.form-panel {
  width: 480px; padding: 40px;
  background: rgba(255,255,255,0.95);

  html.dark & { background: rgba(30,41,59,0.95); }

  @media (max-width: 768px) { width: 100%; padding: 28px 20px; }
}

.form-header {
  margin-bottom: 28px;
  .back-link a {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;
    &:hover { color: var(--primary-color); }
  }
  h2 { font-size: 26px; font-weight: 700; color: var(--text-color); margin-bottom: 6px; }
  p { font-size: 14px; color: var(--text-secondary); }
}

.form-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
}

.custom-input :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--border-color);
  border-radius: var(--radius-md) !important;
  background: var(--bg-color);
  transition: all var(--transition-base);
  &:hover, &.is-focus {
    box-shadow: 0 0 0 2px var(--primary-light);
    background: var(--card-bg);
  }
}

.terms-agree {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 20px; font-size: 13px; color: var(--text-secondary);
  a { color: var(--primary-color); }
}

.register-btn {
  width: 100%; height: 48px; font-size: 16px; font-weight: 600;
  letter-spacing: 2px; border-radius: var(--radius-md);
  background: var(--primary-gradient) !important; border: none !important;
  &:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(99,102,241,0.4); }
}

.form-footer {
  margin-top: 20px; text-align: center; font-size: 14px; color: var(--text-secondary);
  a { color: var(--primary-color); font-weight: 600; }
}

.brand-side {
  flex: 1;
  background: var(--primary-gradient);
  background-size: 200% 200%;
  animation: gradient-shift 8s ease infinite;
  display: flex; align-items: center; justify-content: center;
  padding: 40px;
  @media (max-width: 768px) { display: none; }
}

.brand-text {
  text-align: center; color: white;
  .brand-icon { margin-bottom: 20px; }
  h3 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
  p { opacity: 0.7; margin-bottom: 32px; font-size: 14px; }
  ul {
    list-style: none; text-align: left;
    li {
      padding: 8px 0 8px 28px;
      position: relative; font-size: 14px; opacity: 0.85;
      &::before {
        content: ''; position: absolute; left: 0; top: 14px;
        width: 8px; height: 8px; border-radius: 50%;
        background: rgba(255,255,255,0.5);
      }
    }
  }
}
</style>
