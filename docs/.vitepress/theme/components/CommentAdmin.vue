<!-- .vitepress/theme/components/CommentAdmin.vue -->
<template>
  <div class="admin-container">
    <div class="admin-header">
      <h2>评论管理</h2>
      <div class="auth-controls">
        <template v-if="!isLoggedIn">
          <input 
            v-model="adminTokenInput" 
            type="password" 
            placeholder="输入管理员密钥" 
            @keyup.enter="login"
            :disabled="loading"
          />
          <button 
            class="btn btn-primary" 
            @click="login" 
            :disabled="loading"
          >
            <span v-if="loading" class="loading-spinner"></span>
            登录
          </button>
        </template>
        <template v-else>
          <span class="badge">已登录</span>
          <button 
            class="btn btn-outline" 
            @click="logout" 
            :disabled="loading"
          >
            <span v-if="loading" class="loading-spinner"></span>
            退出
          </button>
        </template>
      </div>
    </div>

    <div v-if="isLoggedIn" class="filter-bar">
      <button 
        v-for="status in statusOptions" 
        :key="status.value"
        :class="['filter-btn', { active: filterStatus === status.value }]"
        @click="filterStatus = status.value"
      >
        {{ status.label }} ({{ counts[status.countKey] }})
      </button>
    </div>

    <div v-if="isLoggedIn" class="content-area">
      <div v-if="loading && !allComments.length" class="status-text">
        <div class="loading-spinner large"></div>
        加载中...
      </div>
      <div v-else-if="filteredComments.length === 0" class="status-text">
        暂无评论
      </div>
      
      <div v-else class="comment-list">
        <div 
          v-for="item in filteredComments" 
          :key="item.id" 
          class="comment-card"
          :class="{ 'is-reply': item.root_id }"
        >
          <div class="card-meta">
            <span class="name">{{ item.nickname }}</span>
            <span class="email">{{ item.email || '未提供' }}</span>
            <span class="time">{{ formatTime(item.created_at) }}</span>
            <span class="page-url">页面: {{ item.page_key }}</span>
            <span class="status-tag" :class="`status-${item.status}`">
              {{ statusOptions.find(s => s.value === item.status)?.label }}
            </span>
          </div>
          
          <p class="card-content">
            <span v-if="item.root_id" class="reply-prefix">
              回复 @{{ item.reply_to_name || '未知用户' }}:
            </span>
            {{ item.content }}
          </p>
          
          <div class="card-actions">
            <button 
              v-if="item.status !== 1" 
              class="btn btn-sm btn-primary"
              @click="updateStatus(item.id, 1)"
              :disabled="item.loading"
            >
              <span v-if="item.loading" class="loading-spinner"></span>
              通过审核
            </button>
            <button 
              v-if="item.status === 1" 
              class="btn btn-sm btn-outline"
              @click="updateStatus(item.id, 2)"
              :disabled="item.loading"
            >
              <span v-if="item.loading" class="loading-spinner"></span>
              隐藏
            </button>
            <button 
              v-if="item.status !== 2" 
              class="btn btn-sm btn-danger"
              @click="updateStatus(item.id, 2)"
              :disabled="item.loading"
            >
              <span v-if="item.loading" class="loading-spinner"></span>
              彻底删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const API_BASE = 'https://api.ddbx.org'
const TOKEN_KEY = 'comment_admin_token'

const adminTokenInput = ref('')
const isLoggedIn = ref(false)
const allComments = ref([])
const loading = ref(false)
const filterStatus = ref(0)
const error = ref(null)

// 状态选项配置
const statusOptions = [
  { value: 0, label: '待审核', countKey: 'pending' },
  { value: 1, label: '已公开', countKey: 'approved' },
  { value: 2, label: '已隐藏', countKey: 'hidden' }
]

const counts = computed(() => ({
  pending: allComments.value.filter(c => c.status === 0).length,
  approved: allComments.value.filter(c => c.status === 1).length,
  hidden: allComments.value.filter(c => c.status === 2).length,
}))

const filteredComments = computed(() => {
  return allComments.value.filter(c => c.status === filterStatus.value)
})

const formatTime = (ts) => new Date(ts).toLocaleString('zh-CN')

const login = async () => {
  if (!adminTokenInput.value || loading.value) return
  
  loading.value = true
  error.value = null
  const token = adminTokenInput.value
  
  try {
    localStorage.setItem(TOKEN_KEY, token)
    isLoggedIn.value = true
    adminTokenInput.value = ''
    await fetchAllComments()
  } catch (e) {
    console.error('登录失败:', e)
    error.value = '登录失败，请重试'
    localStorage.removeItem(TOKEN_KEY)
    isLoggedIn.value = false
  } finally {
    loading.value = false
  }
}

const logout = () => {
  localStorage.removeItem(TOKEN_KEY)
  isLoggedIn.value = false
  allComments.value = []
}

const fetchAllComments = async () => {
  if (loading.value) return
  
  loading.value = true
  error.value = null
  const token = localStorage.getItem(TOKEN_KEY)
  
  try {
    const res = await fetch(`${API_BASE}/api/admin/comments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (res.ok) {
      const data = await res.json()
      allComments.value = data.comments.map(comment => ({
        ...comment,
        loading: false // 为每个评论添加独立loading状态
      }))
    } else if (res.status === 401) {
      error.value = '密钥错误，请重新登录'
      logout()
    } else {
      throw new Error(`服务器错误: ${res.status}`)
    }
  } catch (e) {
    console.error('获取评论失败:', e)
    error.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

const updateStatus = async (id, status) => {
  const comment = allComments.value.find(c => c.id === id)
  if (!comment || comment.loading) return
  
  const action = status === 1 ? '通过审核' : '删除'
  if (!confirm(`确定${action}该评论吗？`)) return
  
  comment.loading = true
  const token = localStorage.getItem(TOKEN_KEY)
  
  try {
    const res = await fetch(`${API_BASE}/api/admin/comments/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ status })
    })
    
    if (res.ok) {
      comment.status = status
    } else {
      throw new Error('操作失败')
    }
  } catch (e) {
    console.error('更新状态失败:', e)
    alert('操作失败，请重试')
  } finally {
    comment.loading = false
  }
}

onMounted(() => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    isLoggedIn.value = true
    fetchAllComments()
  }
})
</script>

<style scoped>
/* 使用 VitePress CSS 变量，确保与主题一致 */
.admin-container {
  max-width: 800px;
  margin: 2rem auto;
  font-family: var(--vp-font-family-base);
  color: var(--vp-c-text-1);
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.admin-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.auth-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.auth-controls input {
  padding: 0.5rem 0.8rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  transition: border-color 0.2s;
}

.auth-controls input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

/* 按钮基础样式 */
.btn {
  padding: 0.4rem 1rem;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 主按钮 - 登录/通过审核 */
.btn-primary {
  background: var(--vp-c-brand-1);
  color: white;
  border-color: var(--vp-c-brand-1);
}

.btn-primary:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
}

.btn-primary:active:not(:disabled) {
  background: var(--vp-c-brand-3);
}

/* 轮廓按钮 - 退出/隐藏 */
.btn-outline {
  background: transparent;
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.btn-outline:hover:not(:disabled) {
  background: var(--vp-c-brand-soft);
}

.btn-outline:active:not(:disabled) {
  background: var(--vp-c-brand-soft);
  opacity: 0.8;
}

/* 危险按钮 - 删除 */
.btn-danger {
  background: transparent;
  color: var(--vp-c-danger-1);
  border-color: var(--vp-c-danger-1);
}

.btn-danger:hover:not(:disabled) {
  background: var(--vp-c-danger-soft);
}

/* 小尺寸按钮 */
.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

/* 登录徽章 */
.badge {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* 过滤栏 */
.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.filter-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.filter-btn.active {
  background: var(--vp-c-brand-1);
  color: white;
  border-color: var(--vp-c-brand-1);
}

/* 状态提示 */
.status-text {
  text-align: center;
  padding: 3rem;
  color: var(--vp-c-text-3);
  font-size: 0.875rem;
}

/* 评论列表 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1rem;
  background: var(--vp-c-bg);
  transition: border-color 0.2s;
}

.comment-card:hover {
  border-color: var(--vp-c-brand-1);
}

.comment-card.is-reply {
  margin-left: 2rem;
  border-left: 3px solid var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
}

.card-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.name {
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

.email {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-size: 0.75rem;
}

.page-url {
  font-family: var(--vp-font-family-mono);
  opacity: 0.7;
}

/* 状态标签 */
.status-tag {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-0 {
  background: var(--vp-c-warning-soft);
  color: var(--vp-c-warning-1);
}

.status-1 {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.status-2 {
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
}

.card-content {
  margin: 0.5rem 0 1rem;
  line-height: 1.6;
  padding-left: 0.5rem;
}

.reply-prefix {
  color: var(--vp-c-brand-1);
  font-weight: 500;
  margin-right: 0.5rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* 加载动画 */
.loading-spinner {
  display: inline-block;
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.loading-spinner.large {
  width: 1.5rem;
  height: 1.5rem;
  border-width: 3px;
  margin: 0 auto 0.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式调整 */
@media (max-width: 600px) {
  .admin-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .auth-controls {
    width: 100%;
  }
  
  .auth-controls input {
    flex: 1;
  }
  
  .card-meta {
    gap: 0.5rem;
    font-size: 0.75rem;
  }
  
  .card-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
