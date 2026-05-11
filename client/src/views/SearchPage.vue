<template>
  <div class="page-container">
    <div class="page-header">
      <h2>搜索结果: "{{ keyword }}"</h2>
      <span class="result-count">共 {{ total }} 个结果</span>
    </div>

    <div class="card-container">
      <el-tabs v-model="searchType" @tab-change="doSearch">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="文件" name="file" />
        <el-tab-pane label="文件夹" name="folder" />
      </el-tabs>

      <!-- 文件结果 -->
      <div v-if="files.length > 0" class="file-grid">
        <FileCard v-for="file in files" :key="file._id" :file="file" @click="previewFile(file)" />
      </div>

      <!-- 文件夹结果 -->
      <div v-if="folders.length > 0" class="folder-list">
        <div v-for="folder in folders" :key="folder._id" class="folder-item">
          <el-icon :size="24" style="color:#E6A23C"><Folder /></el-icon>
          <span>{{ folder.name }}</span>
          <span class="folder-path">{{ folder.path }}</span>
        </div>
      </div>

      <el-empty v-if="!hasResults && searched" description="未找到相关结果" />
    </div>

    <FilePreview v-model:visible="showPreview" :file="previewFileData" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { searchApi } from '@/api'
import FileCard from '@/components/FileCard.vue'
import FilePreview from '@/components/FilePreview.vue'

const route = useRoute()
const keyword = ref('')
const searchType = ref('all')
const files = ref<any[]>([])
const folders = ref<any[]>([])
const total = ref(0)
const searched = ref(false)
const showPreview = ref(false)
const previewFileData = ref<any>(null)

const hasResults = computed(() => files.value.length > 0 || folders.value.length > 0)

onMounted(() => {
  keyword.value = (route.query.q as string) || ''
  if (keyword.value) doSearch()
})

watch(() => route.query.q, (val) => {
  keyword.value = (val as string) || ''
  if (keyword.value) doSearch()
})

async function doSearch() {
  if (!keyword.value) return
  try {
    const res: any = await searchApi.search({ q: keyword.value, type: searchType.value })
    files.value = res.data?.files || []
    folders.value = res.data?.folders || []
    total.value = res.data?.total || 0
    searched.value = true
  } catch (e) { /* ignore */ }
}

function previewFile(file: any) {
  previewFileData.value = file
  showPreview.value = true
}
</script>

<style scoped lang="scss">
.result-count { color: var(--text-secondary); font-size: 14px; }

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.folder-list {
  margin-top: 16px;
  .folder-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    cursor: pointer;
    border-radius: 6px;
    &:hover { background: var(--bg-color); }
    .folder-path { color: var(--text-secondary); font-size: 12px; margin-left: auto; }
  }
}
</style>
