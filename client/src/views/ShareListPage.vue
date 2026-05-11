<template>
  <div class="page-container">
    <div class="page-header">
      <h2><el-icon><Share /></el-icon> 我的分享</h2>
    </div>

    <div class="card-container" v-if="shares.length > 0">
      <el-table :data="shares" style="width:100%">
        <el-table-column prop="file.name" label="文件" min-width="200">
          <template #default="{ row }">{{ row.file?.name || '未知文件' }}</template>
        </el-table-column>
        <el-table-column label="分享码" width="180">
          <template #default="{ row }">
            <el-tag>{{ row.code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提取码" width="100">
          <template #default="{ row }">
            <span>{{ row.has_password ? '有' : '无' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" width="100">
          <template #default="{ row }">{{ row.type === 'permanent' ? '永久' : '限时' }}</template>
        </el-table-column>
        <el-table-column label="浏览次数" width="90">
          <template #default="{ row }">{{ row.view_count }}</template>
        </el-table-column>
        <el-table-column label="下载次数" width="90">
          <template #default="{ row }">{{ row.download_count }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button size="small" @click="copyLink(row)">复制链接</el-button>
            <el-button size="small" type="danger" @click="removeShare(row._id)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-empty v-else description="还没有分享记录" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { shareApi } from '@/api'
import { formatDate } from '@/utils'

const shares = ref<any[]>([])

onMounted(async () => {
  try {
    const res: any = await shareApi.getList()
    shares.value = res.data || []
  } catch (e) { /* ignore */ }
})

function copyLink(share: any) {
  const url = `${window.location.origin}/s/${share.code}`
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('链接已复制')
  })
}

async function removeShare(id: string) {
  try {
    await ElMessageBox.confirm('取消分享后链接将失效', '确认', { type: 'warning' })
    await shareApi.remove(id)
    shares.value = shares.value.filter((s: any) => s._id !== id)
    ElMessage.success('分享已取消')
  } catch (e: any) { if (e !== 'cancel') ElMessage.error('操作失败') }
}
</script>
