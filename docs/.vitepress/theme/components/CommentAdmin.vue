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
            <span v-if="loading" class="loading-spinner" aria-hidden="true"></span>
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
              class="btn btn-sm btn-primary"
              @click="updateStatus(item.id, 1)"
              :disabled="item.loading"
            >
              <span v-if="item.loading" class="loading-spinner" aria-hidden="true"></span>
              通过审核
            </button>
            <button
              v-if="item.status === 1"
              class="btn btn-sm btn-outline"
              @click="updateStatus(item.id, 2)"
              :disabled="item.loading"
            >
              <span v-if="item.loading" class="loading-spinner" aria-hidden="true"></span>
              隐藏
            </button>
            <button
              v-if="item.status !== 2"
              class="btn btn-sm btn-danger"
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
  Geist (Vercel) 设计令牌映射：
  - 间距遵循 4px 基准刻度：4 / 8 / 12 / 16 / 24 / 32 / 40px
  - 圆角：控件 6px，卡片 12px，徽标/胶囊 9999px
  - 主操作使用「纯色反转」黑白按钮（而非品牌色），强调色仅用于状态与选中态
  - 阴影克制，层级主要靠边框与色阶表达
  - 动效统一 150ms + Geist 缓动曲线
  仍然使用 VitePress 的 --vp-c-* 变量取色，以便自动适配亮/暗主题。
*/
.admin-container {
  --gd-space-1: 4px;
  --gd-space-2: 8px;
  --gd-space-3: 12px;
  --gd-space-4: 16px;
  --gd-space-6: 24px;
  --gd-space-8: 32px;
  --gd-space-10: 40px;
  --gd-radius-sm: 6px;
  --gd-radius-md: 12px;
  --gd-radius-full: 9999px;
  --gd-duration: 150ms;
  --gd-ease: cubic-bezier(0.175, 0.885, 0.32, 1.1);
  --gd-shadow-raised: 0 2px 2px rgba(0, 0, 0, 0.04);

  max-width: 800px;
  margin: var(--gd-space-8) auto;
  font-family: var(--vp-font-family-base);
  color: var(--vp-c-text-1);
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--gd-space-4);
  margin-bottom: var(--gd-space-6);
  padding-bottom: var(--gd-space-4);
  border-bottom: 1px solid var(--vp-c-divider);
}

.admin-header h2 {
  margin: 0;
  font-size: 20px;
  line-height: 26px;
  font-weight: 600;
  letter-spacing: -0.4px;
}

.auth-controls {
  display: flex;
  gap: var(--gd-space-2);
  align-items: center;
}

/* 输入框：6px 圆角，弱化边框，双层焦点环 */
.auth-controls input {
  height: var(--gd-space-10);
  padding: 0 var(--gd-space-3);
  font-size: 14px;
  line-height: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--gd-radius-sm);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  transition: border-color var(--gd-duration) var(--gd-ease),
              box-shadow var(--gd-duration) var(--gd-ease);
}

.auth-controls input::placeholder {
  color: var(--vp-c-text-3);
}

.auth-controls input:hover:not(:disabled) {
  border-color: var(--vp-c-text-3);
}

.auth-controls input:focus-visible {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-bg), 0 0 0 4px var(--vp-c-brand-1);
}

/* 按钮基础样式：统一高度、字重与圆角 */
.btn {
  height: var(--gd-space-10);
  padding: 0 var(--gd-space-4);
  border: 1px solid transparent;
  border-radius: var(--gd-radius-sm);
  cursor: pointer;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--gd-space-1);
  transition: background-color var(--gd-duration) var(--gd-ease),
              border-color var(--gd-duration) var(--gd-ease),
              opacity var(--gd-duration) var(--gd-ease);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--vp-c-bg), 0 0 0 4px var(--vp-c-brand-1);
}

/* 主按钮：黑/白反转填充（Geist 主按钮规范），不依赖品牌色，强调最高优先级动作 */
.btn-primary {
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.86;
}

.btn-primary:active:not(:disabled) {
  opacity: 0.74;
}

/* 次级按钮：描边样式，用于次要或撤销类操作 */
.btn-outline {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
}

.btn-outline:hover:not(:disabled) {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-text-3);
}

.btn-outline:active:not(:disabled) {
  background: var(--vp-c-bg-soft);
  opacity: 0.85;
}

/* 危险按钮：实心红底白字，对应 Geist 的 error button 规范，用于不可逆操作 */
.btn-danger {
  background: var(--vp-c-danger-1);
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  filter: brightness(0.92);
}

.btn-danger:active:not(:disabled) {
  filter: brightness(0.84);
}

/* 小尺寸按钮 */
.btn-sm {
  height: 32px;
  padding: 0 var(--gd-space-3);
  font-size: 13px;
}

/* 登录徽章：胶囊形态，用于状态展示 */
.badge {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  padding: var(--gd-space-1) var(--gd-space-3);
  border-radius: var(--gd-radius-full);
  font-size: 12px;
  font-weight: 500;
}

/* 过滤栏：选中态使用强调色表达「状态」，未选中为低强度文字按钮 */
.filter-bar {
  display: flex;
  gap: var(--gd-space-2);
  margin-bottom: var(--gd-space-6);
  flex-wrap: wrap;
}

.filter-btn {
  height: 32px;
  padding: 0 var(--gd-space-3);
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--gd-radius-sm);
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background-color var(--gd-duration) var(--gd-ease),
              border-color var(--gd-duration) var(--gd-ease),
              color var(--gd-duration) var(--gd-ease);
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
  padding: var(--gd-space-10) var(--gd-space-6);
  color: var(--vp-c-text-3);
  font-size: 13px;
}

/* 评论列表 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: var(--gd-space-3);
}

.comment-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--gd-radius-md);
  padding: var(--gd-space-6);
  background: var(--vp-c-bg);
  transition: border-color var(--gd-duration) var(--gd-ease),
              box-shadow var(--gd-duration) var(--gd-ease);
}

.comment-card:hover {
  border-color: var(--vp-c-text-3);
  box-shadow: var(--gd-shadow-raised);
}

.comment-card.is-reply {
  margin-left: var(--gd-space-6);
  border-left: 2px solid var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
}

.card-meta {
  display: flex;
  gap: var(--gd-space-4);
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: var(--gd-space-2);
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
  padding: var(--gd-space-1) var(--gd-space-2);
  border-radius: var(--gd-radius-sm);
  font-size: 12px;
}

.page-url {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-3);
}

/* 状态标签：6px 圆角的弱填充标签，颜色仅承载语义，不替代文字 */
.status-tag {
  padding: var(--gd-space-1) var(--gd-space-2);
  border-radius: var(--gd-radius-sm);
  font-size: 12px;
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
  margin: var(--gd-space-2) 0 var(--gd-space-4);
  font-size: 14px;
  line-height: 20px;
  color: var(--vp-c-text-1);
}

.reply-prefix {
  color: var(--vp-c-brand-1);
  font-weight: 500;
  margin-right: var(--gd-space-1);
}

.card-actions {
  display: flex;
  gap: var(--gd-space-2);
  flex-wrap: wrap;
}

/* 加载动画 */
.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--gd-radius-full);
  animation: spin 0.6s linear infinite;
}

.loading-spinner.large {
  width: 24px;
  height: 24px;
  border-width: 3px;
  margin: 0 auto var(--gd-space-2);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式调整：sm/md 断点附近收紧间距，按钮转为全宽堆叠 */
@media (max-width: 600px) {
  .admin-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--gd-space-3);
  }

  .auth-controls {
    width: 100%;
  }

  .auth-controls input {
    flex: 1;
  }

  .comment-card {
    padding: var(--gd-space-4);
  }

  .comment-card.is-reply {
    margin-left: var(--gd-space-4);
  }

  .card-meta {
    gap: var(--gd-space-2);
    font-size: 12px;
  }

  .card-actions {
    flex-direction: column;
  }

  .card-actions .btn {
    width: 100%;
  }
}

/* 遵循 prefers-reduced-motion：去除非必要动效 */
@media (prefers-reduced-motion: reduce) {
  .admin-container *,
  .admin-container *::before,
  .admin-container *::after {
    transition-duration: 0.01ms !important;
  }
}
</style>