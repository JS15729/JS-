<template>
  <div class="page-container">
    <div class="page-header">
      <h2><el-icon><Setting /></el-icon> 系统配置</h2>
    </div>

    <!-- 系统统计 -->
    <div class="stats-row" v-if="stats">
      <el-card shadow="hover">
        <div class="stat-item">
          <span class="stat-value">{{ stats.user_count }}</span>
          <span class="stat-label">注册用户</span>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="stat-item">
          <span class="stat-value">{{ stats.file_count }}</span>
          <span class="stat-label">文件总数</span>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="stat-item">
          <span class="stat-value">{{ formatFileSize(stats.total_storage) }}</span>
          <span class="stat-label">存储用量</span>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="stat-item">
          <span class="stat-value">{{ stats.banned_user_count }}</span>
          <span class="stat-label">封禁用户</span>
        </div>
      </el-card>
    </div>

    <!-- 配置表单 -->
    <div class="card-container" style="margin-top:20px">
      <el-form :model="configs" label-width="180px">
        <el-form-item label="站点名称">
          <el-input v-model="configs.site_name" placeholder="站点名称" />
        </el-form-item>
        <el-form-item label="站点描述">
          <el-input v-model="configs.site_description" placeholder="站点描述" />
        </el-form-item>
        <el-form-item label="允许注册">
          <el-switch v-model="configs.allow_register" active-value="true" inactive-value="false" />
        </el-form-item>
        <el-form-item label="默认存储配额(GB)">
          <el-input-number v-model="defaultQuotaGB" :min="1" :max="1024" />
          <span style="margin-left:8px;color:var(--text-secondary)">当前: {{ configs.default_storage_quota ? formatFileSize(+configs.default_storage_quota) : '-' }}</span>
        </el-form-item>
        <el-form-item label="备份保留天数">
          <el-input-number v-model="configs.backup_keep_days" :min="1" :max="365" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveAll" :loading="saving">保存配置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 备份管理 -->
    <div class="card-container" style="margin-top:20px">
      <h3 style="margin-bottom:16px">备份管理</h3>
      <el-button type="primary" @click="runBackup" :loading="backingUp">
        <el-icon><Upload /></el-icon> 立即备份
      </el-button>
      <div v-if="backups.length > 0" style="margin-top:16px">
        <el-table :data="backups">
          <el-table-column prop="name" label="备份文件" />
          <el-table-column label="大小" width="120">
            <template #default="{ row }">{{ formatFileSize(row.size) }}</template>
          </el-table-column>
          <el-table-column label="创建时间" width="200">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { systemApi } from '@/api'
import { formatFileSize, formatDate } from '@/utils'

const configs = reactive<Record<string, any>>({})
const stats = ref<any>(null)
const backups = ref<any[]>([])
const saving = ref(false)
const backingUp = ref(false)

const defaultQuotaGB = ref(10)

onMounted(async () => {
  try {
    const [configRes, statsRes, backupRes] = await Promise.all([
      systemApi.getConfigs(),
      systemApi.getStats(),
      systemApi.getBackupStatus(),
    ])
    Object.assign(configs, configRes.data || {})
    stats.value = statsRes.data || {}
    backups.value = backupRes.data?.backups || []

    if (configs.default_storage_quota) {
      defaultQuotaGB.value = Math.round(+configs.default_storage_quota / 1024 / 1024 / 1024)
    }
  } catch (e) { /* ignore */ }
})

async function saveAll() {
  saving.value = true
  try {
    // 更新存储配额
    configs.default_storage_quota = String(defaultQuotaGB.value * 1024 * 1024 * 1024)
    for (const key of Object.keys(configs)) {
      if (typeof configs[key] === 'string' || typeof configs[key] === 'number') {
        await systemApi.updateConfig(key, String(configs[key]))
      }
    }
    ElMessage.success('配置已保存')
  } catch (e: any) { ElMessage.error('保存失败') }
  saving.value = false
}

async function runBackup() {
  backingUp.value = true
  try {
    const res: any = await systemApi.runBackup()
    ElMessage.success(`备份完成: ${res.data?.file}`)
    const backupRes: any = await systemApi.getBackupStatus()
    backups.value = backupRes.data?.backups || []
  } catch (e: any) { ElMessage.error('备份失败') }
  backingUp.value = false
}
</script>

<style scoped lang="scss">
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  .stat-item {
    text-align: center;
    .stat-value { display: block; font-size: 28px; font-weight: 700; color: var(--primary-color); }
    .stat-label { display: block; font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
  }
}
</style>
