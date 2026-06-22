<template>
  <div class="admin-safe-area">
    <div class="admin-container">
      <div class="admin-header">
        <h2 class="admin-title">评论管理</h2>
        <div class="auth-controls">
          <template v-if="!isLoggedIn">
            <input
              v-model="adminTokenInput"
              type="password"
              placeholder="输入密钥"
              @keyup.enter="login"
              :disabled="loading"
              class="vp-input-minimal"
            />
            <button
              class="vp-btn-minimal primary"
              @click="login"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner" aria-hidden="true"></span>
              登录
            </button>
          </template>
          <template v-else>
            <span class="ctrl-item status">Admin</span>
            <button
              class="ctrl-item btn-logout"
              @click="logout"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner" aria-hidden="true"></span>
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
          {{ status.label }}
          <span class="count">({{ counts[status.countKey] }})</span>
        </button>
      </div>

      <div v-if="isLoggedIn" class="content-area">
        <div v-if="loading && !allComments.length" class="status-text-minimal">
          <span class="spinner" aria-hidden="true"></span> 数据加载中...
        </div>
        <div v-else-if="filteredComments.length === 0" class="status-text-minimal">
          暂无相关评论
        </div>

        <div v-else class="comment-flow">
          <div
            v-for="item in filteredComments"
            :key="item.id"
            class="comment-row"
            :class="{ 'is-reply': item.root_id }"
          >
            <div class="row-meta">
              <span class="author">{{ item.nickname }}</span>
              <span class="email">{{ item.email || 'No Email' }}</span>
              <span class="dots" aria-hidden="true"></span>
              <span class="page-key">{{ item.page_key }}</span>
              <span class="time">{{ formatTime(item.created_at) }}</span>
            </div>

            <p class="row-content">
              <span v-if="item.root_id" class="reply-to">
                @{{ item.reply_to_name || '未知用户' }}
              </span>
              {{ item.content }}
            </p>

            <div class="row-actions">
              <button
                v-if="item.status !== 1"
                class="action-link approve"
                @click="updateStatus(item.id, 1)"
                :disabled="item.loading"
              >
                通过
              </button>
              <button
                v-if="item.status === 1"
                class="action-link hide"
                @click="updateStatus(item.id, 2)"
                :disabled="item.loading"
              >
                隐藏
              </button>
              <span v-if="item.loading" class="spinner" aria-hidden="true"></span>
            </div>
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

const formatTime = (ts) => {
  const d = new Date(ts)
  return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const login = async () => {
  if (!adminTokenInput.value || loading.value) return
  loading.value = true
  const token = adminTokenInput.value
  try {
    localStorage.setItem(TOKEN_KEY, token)
    isLoggedIn.value = true
    adminTokenInput.value = ''
    await fetchAllComments()
  } catch (e) {
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
  const token = localStorage.getItem(TOKEN_KEY)
  try {
    const res = await fetch(`${API_BASE}/api/admin/comments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      allComments.value = data.comments.map(c => ({ ...c, loading: false }))
    } else if (res.status === 401) {
      logout()
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const updateStatus = async (id, status) => {
  const comment = allComments.value.find(c => c.id === id)
  if (!comment || comment.loading) return
  
  const action = status === 1 ? '公开' : '隐藏'
  if (!confirm(`确定要${action}这条评论吗？`)) return

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
    if (res.ok) comment.status = status
  } catch (e) {
    alert('操作失败')
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
.admin-safe-area {
  width: 100%;
  padding: 0 24px;
  box-sizing: border-box;
}

.admin-container {
  max-width: 760px;
  margin: 2.5rem auto;
  font-family: var(--vp-font-family-base);
  color: var(--vp-c-text-1);
}

/* 核心修复：使用 center 对齐，彻底解决可能由于字体差异或 padding 导致的错位 */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center; 
  margin-bottom: 2rem;
  padding-bottom: 0.8rem;
}

/* 核心修复：显式清除和重置标题边距，防止 VitePress 内置样式导致撑开错位 */
.admin-title {
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 28px; /* 匹配右侧元素的高度 */
}

.auth-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vp-input-minimal {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  padding: 5px 12px;
  font-size: 0.85rem;
  border-radius: 4px;
  color: var(--vp-c-text-1);
  outline: none;
  height: 28px;
  box-sizing: border-box;
}

.vp-btn-minimal {
  border: none;
  padding: 0 12px;
  font-size: 0.85rem;
  border-radius: 4px;
  cursor: pointer;
  height: 28px;
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  text-decoration: none;
}

.vp-btn-minimal.primary {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
}
.vp-btn-minimal.primary:hover {
  background: var(--vp-c-brand-2);
}

.ctrl-item {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  font-size: 0.82rem;
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
  text-decoration: none;
}

.ctrl-item.status {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.ctrl-item.btn-logout {
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.ctrl-item.btn-logout:hover {
  border-color: var(--vp-c-text-3);
  color: var(--vp-c-text-1);
}

/* 导航过滤栏 */
.filter-bar {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.5rem;
}

.filter-btn {
  background: none;
  border: none;
  padding: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  cursor: pointer;
  text-decoration: none;
}

.filter-btn.active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.filter-btn .count {
  font-size: 0.8rem;
  opacity: 0.6;
}

/* 评论列表流 */
.comment-flow {
  display: flex;
  flex-direction: column;
}

.comment-row {
  padding: 1.2rem 0;
  border-bottom: 1px dashed var(--vp-c-divider);
}
.comment-row:last-child {
  border-bottom: none;
}

.comment-row.is-reply {
  padding-left: 1.2rem;
  border-left: 2px solid var(--vp-c-divider);
}

.row-meta {
  display: flex;
  align-items: baseline;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  flex-wrap: wrap;
  gap: 8px;
}

.row-meta .author {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.row-meta .email {
  opacity: 0.6;
}

.row-meta .dots {
  flex: 1 1 auto;
  min-width: 12px;
  height: 1px;
  align-self: center;
  background-image: linear-gradient(to right, var(--vp-c-text-3) 0%, var(--vp-c-text-3) 30%, transparent 30%);
  background-size: 4px 1px;
  background-repeat: repeat-x;
  opacity: 0.3;
}

.row-meta .page-key {
  font-family: var(--vp-font-family-mono);
  opacity: 0.7;
}

.row-meta .time {
  opacity: 0.5;
}

.row-content {
  margin: 0.5rem 0 0.6rem;
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  word-break: break-all;
}
.reply-to {
  color: var(--vp-c-brand-1);
  font-weight: 500;
  margin-right: 4px;
}

/* 链接式操作组（无下划线） */
.row-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.8rem;
  cursor: pointer;
  text-decoration: none !important;
  font-weight: 500;
  opacity: 0.75;
  transition: opacity 0.15s;
}
.action-link:hover {
  opacity: 1;
}

.action-link.approve { 
  color: var(--vp-c-brand-1); 
}

.action-link.hide { 
  color: var(--vp-c-warning-1); 
}

.status-text-minimal {
  text-align: center;
  padding: 3rem 0;
  color: var(--vp-c-text-3);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  display: inline-block;
  width: 11px;
  height: 11px;
  border: 1.5px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .auth-controls {
    width: 100%;
  }
  .vp-input-minimal {
    flex: 1;
  }
  .row-meta .dots {
    display: none;
  }
}
</style>