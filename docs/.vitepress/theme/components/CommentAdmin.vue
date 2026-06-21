<!-- .vitepress/theme/components/CommentAdmin.vue -->
<template>
  <div class="admin-container">
    <div class="admin-header">
      <h2>评论管理后台</h2>
      <div class="auth-controls">
        <template v-if="!isLoggedIn">
          <input v-model="adminTokenInput" type="password" placeholder="输入管理员密钥" @keyup.enter="login" />
          <button @click="login">登录</button>
        </template>
        <template v-else>
          <span class="badge">已登录</span>
          <button @click="logout">退出</button>
        </template>
      </div>
    </div>

    <div v-if="isLoggedIn" class="filter-bar">
      <button :class="{active: filterStatus === 0}" @click="filterStatus = 0">待审核 ({{ counts.pending }})</button>
      <button :class="{active: filterStatus === 1}" @click="filterStatus = 1">已公开 ({{ counts.approved }})</button>
      <button :class="{active: filterStatus === 2}" @click="filterStatus = 2">已隐藏 ({{ counts.hidden }})</button>
    </div>

    <div v-if="isLoggedIn" class="content-area">
      <div v-if="loading" class="status-text">加载中...</div>
      <div v-else-if="filteredComments.length === 0" class="status-text">暂无评论</div>
      
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
              {{ item.status === 0 ? '待审核' : item.status === 1 ? '已公开' : '已隐藏' }}
            </span>
          </div>
          
          <p class="card-content">
            <span v-if="item.root_id" class="reply-prefix">
              回复 @{{ item.reply_to_name || '未知用户' }}:
            </span>
            {{ item.content }}
          </p>
          
          <div class="card-actions">
            <button v-if="item.status !== 1" class="btn btn-approve" @click="updateStatus(item.id, 1)">通过审核</button>
            <button v-if="item.status === 1" class="btn btn-hide" @click="updateStatus(item.id, 2)">隐藏</button>
            <button v-if="item.status !== 2" class="btn btn-delete" @click="updateStatus(item.id, 2)">彻底删除</button>
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

const counts = computed(() => ({
  pending: allComments.value.filter(c => c.status === 0).length,
  approved: allComments.value.filter(c => c.status === 1).length,
  hidden: allComments.value.filter(c => c.status === 2).length,
}))

const filteredComments = computed(() => {
  return allComments.value.filter(c => c.status === filterStatus.value)
})

const formatTime = (ts) => new Date(ts).toLocaleString('zh-CN')

const login = () => {
  if (!adminTokenInput.value) return
  localStorage.setItem(TOKEN_KEY, adminTokenInput.value)
  isLoggedIn.value = true
  adminTokenInput.value = ''
  fetchAllComments()
}

const logout = () => {
  localStorage.removeItem(TOKEN_KEY)
  isLoggedIn.value = false
  allComments.value = []
}

const fetchAllComments = async () => {
  loading.value = true
  const token = localStorage.getItem(TOKEN_KEY)
  try {
    const res = await fetch(`${API_BASE}/api/admin/comments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      allComments.value = data.comments
    } else if (res.status === 401) {
      alert('密钥错误，请重新登录')
      logout()
    }
  } catch (e) {
    alert('网络错误')
  } finally {
    loading.value = false
  }
}

const updateStatus = async (id, status) => {
  const action = status === 1 ? '通过审核' : '删除'
  if (!confirm(`确定${action}该评论吗？`)) return
  
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
      const idx = allComments.value.findIndex(c => c.id === id)
      if (idx !== -1) allComments.value[idx].status = status
    } else {
      alert('操作失败')
    }
  } catch (e) {
    alert('网络错误')
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
.admin-header h2 { margin: 0; font-size: 1.5rem; }
.auth-controls { display: flex; gap: 0.5rem; align-items: center; }
.auth-controls input {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: transparent;
  color: var(--vp-c-text-1);
}
.auth-controls button {
  padding: 0.4rem 1rem;
  background: var(--vp-c-brand-1);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.badge {
  background: var(--vp-c-brand-1);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.filter-bar button {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.filter-bar button.active {
  background: var(--vp-c-brand-1);
  color: white;
  border-color: var(--vp-c-brand-1);
}

.status-text {
  text-align: center;
  padding: 3rem;
  color: var(--vp-c-text-3);
}

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
}
.name { font-weight: 600; color: var(--vp-c-brand-1); }
.email { 
  font-family: monospace; 
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-size: 0.75rem;
}
.page-url { font-family: monospace; opacity: 0.7; }
.status-tag { padding: 0.1rem 0.4rem; border-radius: 3px; font-size: 0.75rem; }
.status-0 { background: rgba(255, 165, 0, 0.2); color: orange; }
.status-1 { background: rgba(0, 128, 0, 0.2); color: green; }
.status-2 { background: rgba(255, 0, 0, 0.2); color: red; }

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

.card-actions { display: flex; gap: 0.5rem; }
.btn {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
}
.btn-approve { background: var(--vp-c-brand-1); color: white; }
.btn-hide { background: transparent; border-color: var(--vp-c-divider); color: var(--vp-c-text-2); }
.btn-delete { background: transparent; border-color: #ff4d4f; color: #ff4d4f; }
</style>
