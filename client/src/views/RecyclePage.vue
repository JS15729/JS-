<template>
  <div class="page-container">
    <div class="page-header">
      <h2><el-icon><Delete /></el-icon> 回收站</h2>
      <el-button type="danger" @click="emptyRecycle" :disabled="!hasItems">清空回收站</el-button>
    </div>

    <div class="card-container" v-if="hasItems">
      <el-tabs v-model="activeTab">
        <el-tab-pane :label="`文件 (${recycleFiles.length})`" name="files">
          <el-table :data="recycleFiles" style="width: 100%">
            <el-table-column prop="name" label="文件名" min-width="200">
              <template #default="{ row }">
                <span>{{ row.original_name || row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="size" label="大小" width="100">
              <template #default="{ row }">{{ formatFileSize(row.size) }}</template>
            </el-table-column>
            <el-table-column prop="deleted_at" label="删除时间" width="170">
              <template #default="{ row }">{{ formatDate(row.deleted_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="restoreFile(row._id)">恢复</el-button>
                <el-button size="small" type="danger" @click="permanentDeleteFile(row._id)">彻底删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane :label="`文件夹 (${recycleFolders.length})`" name="folders">
          <el-table :data="recycleFolders" style="width: 100%">
            <el-table-column prop="name" label="文件夹名" min-width="200" />
            <el-table-column prop="deleted_at" label="删除时间" width="170">
              <template #default="{ row }">{{ formatDate(row.deleted_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="restoreFolder(row._id)">恢复</el-button>
                <el-button size="small" type="danger" @click="permanentDeleteFolder(row._id)">彻底删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
    <el-empty v-else description="回收站为空" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { recycleApi } from '@/api'
import { formatFileSize, formatDate } from '@/utils'

const recycleFiles = ref<any[]>([])
const recycleFolders = ref<any[]>([])
const activeTab = ref('files')

const hasItems = computed(() => recycleFiles.value.length > 0 || recycleFolders.value.length > 0)

onMounted(loadData)

async function loadData() {
  try {
    const res: any = await recycleApi.getList()
    recycleFiles.value = res.data?.files || []
    recycleFolders.value = res.data?.folders || []
  } catch (e) { /* ignore */ }
}

async function restoreFile(id: string) {
  try {
    await recycleApi.restoreFile(id)
    ElMessage.success('文件已恢复')
    loadData()
  } catch (e: any) { ElMessage.error('恢复失败') }
}

async function restoreFolder(id: string) {
  try {
    await recycleApi.restoreFolder(id)
    ElMessage.success('文件夹已恢复')
    loadData()
  } catch (e: any) { ElMessage.error('恢复失败') }
}

async function permanentDeleteFile(id: string) {
  try {
    await ElMessageBox.confirm('彻底删除后无法恢复！', '警告', { type: 'warning', confirmButtonText: '确认删除' })
    await recycleApi.permanentDeleteFile(id)
    ElMessage.success('已彻底删除')
    loadData()
  } catch (e: any) { if (e !== 'cancel') ElMessage.error('删除失败') }
}

async function permanentDeleteFolder(id: string) {
  try {
    await ElMessageBox.confirm('彻底删除文件夹及内部所有文件！', '警告', { type: 'warning', confirmButtonText: '确认删除' })
    await recycleApi.permanentDeleteFolder(id)
    ElMessage.success('已彻底删除')
    loadData()
  } catch (e: any) { if (e !== 'cancel') ElMessage.error('删除失败') }
}

async function emptyRecycle() {
  try {
    await ElMessageBox.confirm('确定清空回收站吗？所有文件将彻底删除！', '警告', { type: 'warning', confirmButtonText: '清空' })
    await recycleApi.empty()
    ElMessage.success('回收站已清空')
    loadData()
  } catch (e: any) { if (e !== 'cancel') ElMessage.error('清空失败') }
}
</script>
