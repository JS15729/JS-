<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-title-group">
        <div class="header-icon" style="background:linear-gradient(135deg,#ef4444,#f87171);color:white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        </div>
        <div>
          <h2>用户管理</h2>
          <p class="header-subtitle">{{ total }} 个注册用户</p>
        </div>
      </div>
    </div>

    <div class="card-container anim-fade-up">
      <el-table :data="users" v-loading="loading" stripe class="modern-table">
        <el-table-column prop="username" label="用户" min-width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="34" class="table-avatar">{{ row.username?.charAt(0)?.toUpperCase() }}</el-avatar>
              <div>
                <span class="uc-name">{{ row.username }}</span>
                <span class="uc-email">{{ row.email }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="90">
          <template #default="{ row }">
            <span class="role-badge" :class="row.role">{{ row.role === 'admin' ? '管理员' : '用户' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <span class="status-dot" :class="row.status"></span>
            {{ row.status === 'active' ? '正常' : '封禁' }}
          </template>
        </el-table-column>
        <el-table-column label="存储" width="150">
          <template #default="{ row }">
            <div class="storage-cell">
              <div class="sc-bar"><div class="sc-fill" :style="{ width: storagePercent(row) + '%' }" :class="{ warn: storagePercent(row) > 80 }"></div></div>
              <span class="sc-text">{{ formatFileSize(row.storage_used) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="登录" width="80">
          <template #default="{ row }">{{ row.login_count || 0 }}</template>
        </el-table-column>
        <el-table-column label="注册时间" width="150">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'active' && row.role !== 'admin'" size="small" type="warning" plain @click="banUser(row._id)">封禁</el-button>
            <el-button v-if="row.status === 'banned'" size="small" type="success" @click="unbanUser(row._id)">解封</el-button>
            <el-button v-if="row.role !== 'admin'" size="small" type="danger" plain @click="deleteUser(row._id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" v-if="total > limit">
        <el-pagination v-model:current-page="page" :page-size="limit" :total="total" layout="prev, pager, next" background @current-change="loadUsers" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userApi } from '@/api'
import { formatFileSize, formatDate } from '@/utils'

const users = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const limit = 20
const total = ref(0)

onMounted(() => loadUsers())

async function loadUsers() {
  loading.value = true
  try {
    const res: any = await userApi.getList({ page: page.value, limit })
    users.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (e) { /* */ }
  loading.value = false
}

function storagePercent(user: any) {
  if (!user.storage_quota) return 0
  return Math.round((user.storage_used / user.storage_quota) * 100)
}

async function banUser(id: string) {
  try {
    await ElMessageBox.confirm('封禁后该用户将无法登录', '确认封禁', { type: 'warning' })
    await userApi.ban(id)
    ElMessage.success('已封禁')
    loadUsers()
  } catch (e: any) { if (e !== 'cancel') ElMessage.error('操作失败') }
}

async function unbanUser(id: string) {
  try { await userApi.unban(id); ElMessage.success('已解封'); loadUsers() } catch (e: any) { ElMessage.error('操作失败') }
}

async function deleteUser(id: string) {
  try {
    await ElMessageBox.confirm('此操作不可逆，将删除该用户所有数据', '危险操作', { type: 'error', confirmButtonText: '确认删除' })
    await userApi.delete(id)
    ElMessage.success('已删除')
    loadUsers()
  } catch (e: any) { if (e !== 'cancel') ElMessage.error('操作失败') }
}
</script>

<style scoped lang="scss">
.user-cell { display: flex; align-items: center; gap: 10px; .table-avatar { background: var(--primary-gradient); color: white; font-weight: 600; font-size: 13px; } .uc-name { font-size: 14px; font-weight: 500; display: block; } .uc-email { font-size: 12px; color: var(--text-tertiary); } }

.role-badge {
  font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: var(--radius-full);
  background: var(--bg-secondary); color: var(--text-secondary);
  &.admin { background: rgba(99,102,241,0.1); color: #6366f1; }
}

.status-dot {
  display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 5px;
  &.active { background: #10b981; }
  &.banned { background: #ef4444; }
}

.storage-cell {
  .sc-bar { height: 4px; background: var(--bg-secondary); border-radius: 2px; margin-bottom: 3px; overflow: hidden;
    .sc-fill { height: 100%; border-radius: 2px; background: var(--primary-gradient); transition: width 0.5s ease; &.warn { background: #f59e0b; } }
  }
  .sc-text { font-size: 11px; color: var(--text-tertiary); }
}

.pagination { margin-top: 20px; display: flex; justify-content: center; }
</style>
