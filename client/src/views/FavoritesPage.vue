<template>
  <div class="page-container">
    <div class="page-header">
      <h2><el-icon><Star /></el-icon> 我的收藏</h2>
    </div>
    <div class="card-container" v-if="files.length > 0">
      <div class="file-grid">
        <FileCard v-for="file in files" :key="file._id" :file="file" @click="previewFile(file)" />
      </div>
    </div>
    <el-empty v-else description="暂无收藏的文件" />
    <FilePreview v-model:visible="showPreview" :file="previewFileData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { favoriteApi } from '@/api'
import FileCard from '@/components/FileCard.vue'
import FilePreview from '@/components/FilePreview.vue'

const files = ref<any[]>([])
const showPreview = ref(false)
const previewFileData = ref<any>(null)

onMounted(async () => {
  try {
    const res: any = await favoriteApi.getList()
    files.value = res.data || []
  } catch (e) { /* ignore */ }
})

function previewFile(file: any) {
  previewFileData.value = file
  showPreview.value = true
}
</script>

<style scoped lang="scss">
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
</style>
