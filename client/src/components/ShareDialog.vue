<template>
  <el-dialog v-model="dialogVisible" title="创建分享链接" width="450px">
    <el-form :model="form" label-width="80px" v-if="fileId">
      <el-form-item label="分享文件">
        <span>{{ fileId }}</span>
      </el-form-item>
      <el-form-item label="提取码">
        <el-input v-model="form.password" placeholder="留空则无需提取码" maxlength="8" />
      </el-form-item>
      <el-form-item label="有效期">
        <el-radio-group v-model="form.type">
          <el-radio value="permanent">永久有效</el-radio>
          <el-radio value="temporary">7天有效</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <div v-if="shareResult" class="share-result">
      <p>分享链接已生成：</p>
      <div class="share-link">
        <el-input v-model="shareUrl" readonly>
          <template #append>
            <el-button @click="copyLink">复制</el-button>
          </template>
        </el-input>
      </div>
      <p v-if="shareResult.password" class="code-tip">提取码: <strong>{{ shareResult.password }}</strong></p>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
      <el-button type="primary" @click="createShare" :loading="loading" :disabled="!!shareResult">
        创建分享
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { shareApi } from '@/api'

const props = defineProps<{ visible: boolean; fileId: string }>()
const emit = defineEmits(['update:visible'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const loading = ref(false)
const shareResult = ref<any>(null)

const form = reactive({
  password: '',
  type: 'permanent',
})

const shareUrl = computed(() => {
  if (!shareResult.value) return ''
  return `${window.location.origin}/s/${shareResult.value.code}`
})

watch(() => props.visible, (val) => {
  if (!val) {
    shareResult.value = null
    form.password = ''
    form.type = 'permanent'
  }
})

async function createShare() {
  if (!props.fileId) return
  loading.value = true
  try {
    const res: any = await shareApi.create({
      file_id: props.fileId,
      password: form.password || '',
      type: form.type,
      expires_at: form.type === 'temporary'
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : '',
    })
    shareResult.value = res.data
    ElMessage.success('分享链接已创建')
  } catch (e: any) {
    ElMessage.error('创建分享失败')
  } finally {
    loading.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    ElMessage.success('链接已复制到剪贴板')
  } catch {
    // fallback
    const input = document.createElement('input')
    input.value = shareUrl.value
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    ElMessage.success('链接已复制')
  }
}
</script>

<style scoped lang="scss">
.share-result {
  margin-top: 16px;
  padding: 16px;
  background: var(--bg-color);
  border-radius: 8px;
  p { margin-bottom: 10px; font-size: 14px; }
  .code-tip { color: var(--primary-color); strong { font-size: 18px; letter-spacing: 2px; } }
}
</style>
