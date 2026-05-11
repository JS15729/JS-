<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-title-group">
        <div class="header-icon" style="background:linear-gradient(135deg,#3b82f6,#6366f1);color:white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
        </div>
        <div><h2>系统公告</h2><p class="header-subtitle" v-if="authStore.isAdmin">管理公告通知</p></div>
      </div>
      <div class="header-actions" v-if="authStore.isAdmin">
        <el-button type="primary" @click="showCreate = true">发布公告</el-button>
      </div>
    </div>

    <!-- 公告列表 -->
    <div class="card-container anim-fade-up" v-if="list.length > 0">
      <div v-for="item in list" :key="item._id" class="announce-card" :class="{ unread: !item.is_read, pinned: item.is_pinned }" @click="readDetail(item)">
        <div class="ann-head">
          <div class="ann-level-tag" :class="item.level">
            {{ levelLabel(item.level) }}
          </div>
          <span class="ann-pin" v-if="item.is_pinned">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
            置顶
          </span>
        </div>
        <h3 class="ann-title">{{ item.title }}</h3>
        <p class="ann-content">{{ item.content }}</p>
        <div class="ann-meta">
          <span>{{ item.author || '系统' }}</span>
          <span>·</span>
          <span>{{ formatDate(item.created_at) }}</span>
          <span v-if="!item.is_read" class="unread-badge">未读</span>
        </div>

        <!-- 管理员操作 -->
        <div class="ann-admin-actions" v-if="authStore.isAdmin">
          <el-button size="small" text @click.stop="editItem(item)">编辑</el-button>
          <el-button size="small" text type="danger" @click.stop="deleteItem(item._id)">删除</el-button>
        </div>
      </div>
    </div>

    <el-empty v-else description="暂无公告" :image-size="100" />

    <!-- 创建/编辑公告对话框 -->
    <el-dialog v-model="showCreate" :title="editingItem ? '编辑公告' : '发布公告'" width="560px" destroy-on-close>
      <el-form :model="form" label-position="top">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="公告标题" size="large" />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="公告内容..." />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="级别">
              <el-select v-model="form.level" style="width:100%">
                <el-option label="普通信息" value="info" />
                <el-option label="警告" value="warning" />
                <el-option label="重要通知" value="important" />
                <el-option label="成功" value="success" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="选项">
              <el-checkbox v-model="form.is_pinned">置顶公告</el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="submitAnnounce" :loading="submitting">
          {{ editingItem ? '更新' : '发布' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { announcementApi } from '@/api'
import { formatDate } from '@/utils'

const authStore = useAuthStore()
const list = ref<any[]>([])
const showCreate = ref(false)
const editingItem = ref<any>(null)
const submitting = ref(false)

const form = reactive({ title: '', content: '', level: 'info', is_pinned: false })

onMounted(async () => {
  try {
    const res: any = await announcementApi.getList()
    list.value = res.data || []
  } catch (e) { /* */ }
})

function levelLabel(level: string) {
  const map: Record<string, string> = { info: '信息', warning: '警告', important: '重要', success: '成功' }
  return map[level] || level
}

function readDetail(item: any) {
  if (!item.is_read) {
    announcementApi.markAsRead(item._id).then(() => item.is_read = true).catch(() => {})
  }
  ElMessageBox.alert(item.content, item.title, { confirmButtonText: '知道了', type: item.level === 'important' ? 'warning' : 'info' })
}

function editItem(item: any) {
  editingItem.value = item
  form.title = item.title
  form.content = item.content
  form.level = item.level
  form.is_pinned = item.is_pinned
  showCreate.value = true
}

async function submitAnnounce() {
  if (!form.title.trim() || !form.content.trim()) {
    ElMessage.warning('请填写标题和内容')
    return
  }
  submitting.value = true
  try {
    if (editingItem.value) {
      await announcementApi.update(editingItem.value._id, form)
      ElMessage.success('已更新')
    } else {
      await announcementApi.create(form)
      ElMessage.success('公告已发布')
    }
    showCreate.value = false
    editingItem.value = null
    form.title = ''; form.content = ''; form.level = 'info'; form.is_pinned = false
    const res: any = await announcementApi.getList()
    list.value = res.data || []
  } catch (e: any) { ElMessage.error('操作失败') }
  submitting.value = false
}

async function deleteItem(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该公告？', '确认', { type: 'warning' })
    await announcementApi.remove(id)
    list.value = list.value.filter((a: any) => a._id !== id)
    ElMessage.success('已删除')
  } catch (e: any) { if (e !== 'cancel') ElMessage.error('操作失败') }
}
</script>

<style scoped lang="scss">
.announce-card {
  padding: 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  margin-bottom: 12px;
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;

  &:hover { border-color: var(--primary-light); box-shadow: var(--shadow-sm); }
  &.unread {
    background: rgba(99,102,241,0.02);
    border-left: 3px solid var(--primary-color);
  }
  &.pinned {
    background: rgba(245,158,11,0.02);
  }

  .ann-head {
    display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
  }
  .ann-level-tag {
    font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: var(--radius-full);
    &.info { background: rgba(59,130,246,0.1); color: #3b82f6; }
    &.warning { background: rgba(245,158,11,0.1); color: #f59e0b; }
    &.important { background: rgba(239,68,68,0.1); color: #ef4444; }
    &.success { background: rgba(16,185,129,0.1); color: #10b981; }
  }
  .ann-pin { font-size: 11px; color: #f59e0b; display: flex; align-items: center; gap: 3px; }

  .ann-title { font-size: 16px; font-weight: 600; color: var(--text-color); margin-bottom: 6px; }
  .ann-content {
    font-size: 14px; color: var(--text-secondary);
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    line-height: 1.5;
  }
  .ann-meta {
    display: flex; align-items: center; gap: 6px;
    margin-top: 12px; font-size: 12px; color: var(--text-tertiary);
    .unread-badge { color: var(--primary-color); font-weight: 600; }
  }
  .ann-admin-actions {
    position: absolute; top: 12px; right: 16px;
    display: flex; gap: 4px;
  }
}
</style>
