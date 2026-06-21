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
            class="vp-input"
          />
          <button
            class="vp-btn vp-btn-primary"
            @click="login"
            :disabled="loading"
          >
            <span v-if="loading" class="loading-spinner" aria-hidden="true"></span>
            登录
          </button>
        </template>
        <template v-else>
          <span class="vp-badge">已登录</span>
          <button
            class="vp-btn vp-btn-outline"
            @click="logout"
            :disabled="loading"
          >
            <span v-if="loading" class="loading-spinner" aria-hidden="true"></span>
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
        <div class="loading-spinner large" aria-hidden="true"></div>
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
              class="vp-btn vp-btn-sm vp-btn-primary"
              @click="updateStatus(item.id, 1)"
              :disabled="item.loading"
            >
              <span v-if="item.loading" class="loading-spinner" aria-hidden="true"></span>
              通过审核
            </button>
            <button
              v-if="item.status === 1"
              class="vp-btn vp-btn-sm vp-btn-outline"
              @click="updateStatus(item.id, 2)"
              :disabled="item.loading"
            >
              <span v-if="item.loading" class="loading-spinner" aria-hidden="true"></span>
              隐藏
            </button>
            <button
              v-if="item.status !== 2"
              class="vp-btn vp-btn-sm vp-btn-danger"
              @click="updateStatus(item.id, 2)"
              :disabled="item.loading"
            >
              <span v-if="item.loading" class="loading-spinner" aria-hidden="true"></span>
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
/* 
  VitePress 设计令牌系统
  基于 VitePress 默认主题 CSS 变量，扩展设计令牌
  参考官方变量定义: https://github.com/vuejs/vitepress/blob/main/src/client/theme-default/styles/vars.css
*/
.admin-container {
  /* 间距系统 - 遵循 4px 基准刻度 */
  --vp-space-1: 4px;
  --vp-space-2: 8px;
  --vp-space-3: 12px;
  --vp-space-4: 16px;
  --vp-space-6: 24px;
  --vp-space-8: 32px;
  --vp-space-10: 40px;
  --vp-space-12: 48px;
  
  /* 圆角系统 */
  --vp-radius-sm: 6px;
  --vp-radius-md: 12px;
  --vp-radius-full: 9999px;
  
  /* 动效系统 */
  --vp-duration: 150ms;
  --vp-ease: cubic-bezier(0.175, 0.885, 0.32, 1.1);
  
  /* 阴影系统 */
  --vp-shadow-raised: 0 2px 2px rgba(0, 0, 0, 0.04);
  --vp-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.08);
  
  max-width: 800px;
  margin: var(--vp-space-8) auto;
  font-family: var(--vp-font-family-base);
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg);
  border-radius: var(--vp-radius-md);
  transition: background-color var(--vp-duration) var(--vp-ease);
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--vp-space-4);
  margin-bottom: var(--vp-space-6);
  padding-bottom: var(--vp-space-4);
  border-bottom: 1px solid var(--vp-c-divider);
}

.admin-header h2 {
  margin: 0;
  font-size: 20px;
  line-height: 26px;
  font-weight: 600;
  letter-spacing: -0.4px;
  color: var(--vp-c-text-1);
}

.auth-controls {
  display: flex;
  gap: var(--vp-space-2);
  align-items: center;
}

/* VitePress 输入框样式 */
.vp-input {
  height: var(--vp-space-10);
  padding: 0 var(--vp-space-3);
  font-size: 14px;
  line-height: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--vp-radius-sm);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  transition: border-color var(--vp-duration) var(--vp-ease),
              box-shadow var(--vp-duration) var(--vp-ease);
}

.vp-input::placeholder {
  color: var(--vp-c-text-3);
}

.vp-input:hover:not(:disabled) {
  border-color: var(--vp-c-text-3);
}

.vp-input:focus-visible {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-bg), 0 0 0 4px var(--vp-c-brand-1);
}

/* VitePress 按钮系统 */
.vp-btn {
  height: var(--vp-space-10);
  padding: 0 var(--vp-space-4);
  border: 1px solid transparent;
  border-radius: var(--vp-radius-sm);
  cursor: pointer;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--vp-space-1);
  transition: background-color var(--vp-duration) var(--vp-ease),
              border-color var(--vp-duration) var(--vp-ease),
              opacity var(--vp-duration) var(--vp-ease);
}

.vp-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vp-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--vp-c-bg), 0 0 0 4px var(--vp-c-brand-1);
}

/* 主按钮 - 黑/白反转填充（VitePress 主按钮规范） */
.vp-btn-primary {
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
}

.vp-btn-primary:hover:not(:disabled) {
  opacity: 0.86;
}

.vp-btn-primary:active:not(:disabled) {
  opacity: 0.74;
}

/* 次级按钮 - 描边样式 */
.vp-btn-outline {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
}

.vp-btn-outline:hover:not(:disabled) {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-text-3);
}

.vp-btn-outline:active:not(:disabled) {
  background: var(--vp-c-bg-soft);
  opacity: 0.85;
}

/* 危险按钮 - 实心红底白字 */
.vp-btn-danger {
  background: var(--vp-c-danger-1);
  color: #fff;
}

.vp-btn-danger:hover:not(:disabled) {
  filter: brightness(0.92);
}

.vp-btn-danger:active:not(:disabled) {
  filter: brightness(0.84);
}

/* 小尺寸按钮 */
.vp-btn-sm {
  height: 32px;
  padding: 0 var(--vp-space-3);
  font-size: 13px;
}

/* VitePress 徽标样式 */
.vp-badge {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  padding: var(--vp-space-1) var(--vp-space-3);
  border-radius: var(--vp-radius-full);
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: var(--vp-space-1);
}

/* 过滤栏 */
.filter-bar {
  display: flex;
  gap: var(--vp-space-2);
  margin-bottom: var(--vp-space-6);
  flex-wrap: wrap;
}

.filter-btn {
  height: 32px;
  padding: 0 var(--vp-space-3);
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--vp-radius-sm);
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background-color var(--vp-duration) var(--vp-ease),
              border-color var(--vp-duration) var(--vp-ease),
              color var(--vp-duration) var(--vp-ease);
}

.filter-btn:hover {
  border-color: var(--vp-c-text-3);
  color: var(--vp-c-text-1);
}

.filter-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--vp-c-bg), 0 0 0 4px var(--vp-c-brand-1);
}

.filter-btn.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #fff;
}

/* 状态提示 */
.status-text {
  text-align: center;
  padding: var(--vp-space-10) var(--vp-space-6);
  color: var(--vp-c-text-3);
  font-size: 13px;
}

/* 评论列表 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: var(--vp-space-3);
}

.comment-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--vp-radius-md);
  padding: var(--vp-space-6);
  background: var(--vp-c-bg);
  transition: border-color var(--vp-duration) var(--vp-ease),
              box-shadow var(--vp-duration) var(--vp-ease),
              background-color var(--vp-duration) var(--vp-ease);
}

.comment-card:hover {
  border-color: var(--vp-c-text-3);
  box-shadow: var(--vp-shadow-hover);
}

.comment-card.is-reply {
  margin-left: var(--vp-space-6);
  border-left: 2px solid var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
}

.card-meta {
  display: flex;
  gap: var(--vp-space-4);
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: var(--vp-space-2);
  flex-wrap: wrap;
  align-items: center;
}

.name {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.email {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  padding: var(--vp-space-1) var(--vp-space-2);
  border-radius: var(--vp-radius-sm);
  font-size: 12px;
}

.page-url {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-3);
}

/* 状态标签 */
.status-tag {
  padding: var(--vp-space-1) var(--vp-space-2);
  border-radius: var(--vp-radius-sm);
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
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
  margin: var(--vp-space-2) 0 var(--vp-space-4);
  font-size: 14px;
  line-height: 20px;
  color: var(--vp-c-text-1);
}

.reply-prefix {
  color: var(--vp-c-brand-1);
  font-weight: 500;
  margin-right: var(--vp-space-1);
}

.card-actions {
  display: flex;
  gap: var(--vp-space-2);
  flex-wrap: wrap;
}

/* 加载动画 */
.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--vp-radius-full);
  animation: spin 0.6s linear infinite;
}

.loading-spinner.large {
  width: 24px;
  height: 24px;
  border-width: 3px;
  margin: 0 auto var(--vp-space-2);
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
    align-items: stretch;
    gap: var(--vp-space-3);
  }

  .auth-controls {
    width: 100%;
  }

  .auth-controls input {
    flex: 1;
  }

  .comment-card {
    padding: var(--vp-space-4);
  }

  .comment-card.is-reply {
    margin-left: var(--vp-space-4);
  }

  .card-meta {
    gap: var(--vp-space-2);
    font-size: 12px;
  }

  .card-actions {
    flex-direction: column;
  }

  .card-actions .btn {
    width: 100%;
  }
}

/* 遵循 prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .admin-container *,
  .admin-container *::before,
  .admin-container *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}

/* 暗色模式调整 */
.dark .admin-container {
  --vp-shadow-raised: 0 2px 2px rgba(0, 0, 0, 0.2);
  --vp-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dark .comment-card {
  background: var(--vp-c-bg-soft);
}

.dark .comment-card:hover {
  border-color: var(--vp-c-text-3);
  background: var(--vp-c-bg);
}

.dark .status-tag {
  background: var(--vp-c-bg-soft);
}
</style>
