<script setup>
import { ref, onMounted, reactive, watch, computed } from 'vue'
import { useRoute, useData } from 'vitepress'

const API_BASE = 'https://api.ddbx.org'
const TURNSTILE_SITE_KEY = '0x4AAAAAADoeWJeldd1Dgu09'

const route = useRoute()
const { frontmatter } = useData()

const lang = computed(() => route.path.startsWith('/en') ? 'en' : 'zh')
const normalizedPageKey = computed(() => {
  const path = route.path
  return path.startsWith('/en') ? path.slice(3) : path
})

const commentsTree = ref([])
const submitting = ref(false)
const showMainForm = ref(false)
const activeReply = ref(null)

const form = reactive({ nickname: '', content: '' })
const replyForm = reactive({ nickname: '', content: '' })
const lastEnforcedVersion = ref('')

const turnstileToken = ref('')
let turnstileWidgetId = null

const i18n = computed(() => {
  const map = {
    zh: {
      title: '评论',
      triggerComment: '💬 写评论',
      triggerCommentHide: '收起',
      nicknamePlaceholder: '你的名称 *',
      contentPlaceholder: '输入你想表达的内容 (Max 1000字) *',
      send: '发送',
      sending: '发送中...',
      reply: '回复',
      loadMoreReplies: '展开更多回复',
      confirmReply: '回复',
      cancelReply: '取消',
      fieldRequired: '字段必填',
      submitFailed: '提交失败：',
      replyFailed: '回复失败：',
      networkError: '网络错误，请稍后重试',
      turnstileRequired: '请先完成人机验证',
      replyNicknamePlaceholder: '你的名称 *',
      replyContentPlaceholder: '输入回应内容...',
    },
    en: {
      title: 'Comments',
      triggerComment: '💬 Write a comment',
      triggerCommentHide: 'Collapse',
      nicknamePlaceholder: 'Your Name *',
      contentPlaceholder: 'Write your thoughts (Max 1000 characters) *',
      send: 'Send',
      sending: 'Sending...',
      reply: 'Reply',
      loadMoreReplies: 'Load more replies',
      confirmReply: 'Reply',
      cancelReply: 'Cancel',
      fieldRequired: 'All fields are required',
      submitFailed: 'Submit failed: ',
      replyFailed: 'Reply failed: ',
      networkError: 'Network error, please try again later',
      turnstileRequired: 'Please complete the CAPTCHA',
      replyNicknamePlaceholder: 'Your Name *',
      replyContentPlaceholder: 'Write your reply...',
    }
  }
  return map[lang.value] || map.zh
})

const formatDateTime = (timestamp) => {
  const d = new Date(timestamp)
  if (lang.value === 'en') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[d.getMonth()]
    const date = d.getDate()
    const year = d.getFullYear()
    let hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${month} ${date}, ${year} ${hours}:${minutes}:${seconds} ${ampm}`
  } else {
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
}

const fetchComments = async () => {
  let url = `${API_BASE}/api/comments?pageKey=${encodeURIComponent(normalizedPageKey.value)}`
  if (lastEnforcedVersion.value) url += `&v=${encodeURIComponent(lastEnforcedVersion.value)}`

  try {
    const res = await fetch(url)
    const { roots, replies } = await res.json()

    if (!roots || roots.length === 0) {
      commentsTree.value = []
      return
    }

    const nodeMap = new Map()
    roots.forEach(r => {
      r.children = []
      r.hasMoreReplies = false
      nodeMap.set(r.id, r)
    })

    replies.forEach(r => {
      r.children = []
      nodeMap.set(r.id, r)
      if (r.root_id && nodeMap.has(r.root_id)) {
        nodeMap.get(r.root_id).children.push(r)
      }
    })

    roots.forEach(r => {
      if (replies.filter(rep => rep.root_id === r.id).length >= 30) {
        r.hasMoreReplies = true
      }
    })

    commentsTree.value = roots
  } catch (e) {
    console.error('获取评论失败', e)
  }
}

const fetchMoreReplies = async (rootId) => {
  const targetRoot = commentsTree.value.find(r => r.id === rootId)
  if (!targetRoot || targetRoot.children.length === 0) return

  const lastReply = targetRoot.children[targetRoot.children.length - 1]
  const cursor = `${lastReply.seq_num}|${lastReply.id}`

  try {
    const res = await fetch(`${API_BASE}/api/comments/replies?root_id=${rootId}&cursor=${encodeURIComponent(cursor)}`)
    const { replies } = await res.json()

    if (replies.length === 0) {
      targetRoot.hasMoreReplies = false
      return
    }

    targetRoot.children = [...targetRoot.children, ...replies]
    if (replies.length < 10) targetRoot.hasMoreReplies = false
  } catch (e) {
    console.error('加载更多回复失败', e)
  }
}

const submitComment = async () => {
  if (!form.nickname.trim() || !form.content.trim()) return alert(i18n.value.fieldRequired)
  if (!turnstileToken.value) return alert(i18n.value.turnstileRequired)

  submitting.value = true
  const payload = {
    commentId: crypto.randomUUID(),
    pageKey: normalizedPageKey.value,
    token: turnstileToken.value,
    nickname: form.nickname,
    content: form.content
  }

  try {
    const res = await fetch(`${API_BASE}/api/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      const data = await res.json()
      if (data.enforcedVersion) {
        lastEnforcedVersion.value = data.enforcedVersion
        localStorage.setItem(`comment_v_${normalizedPageKey.value}`, data.enforcedVersion)
      }
      form.content = ''
      showMainForm.value = false
      if (turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId)
      turnstileToken.value = ''
      await fetchComments()
    } else {
      const errorText = await res.text()
      alert(i18n.value.submitFailed + errorText)
    }
  } catch (e) {
    alert(i18n.value.networkError)
  } finally {
    submitting.value = false
  }
}

const openReplyForm = (id, rootId, replyToId, replyToName) => {
  if (activeReply.value?.id === id) {
    activeReply.value = null
    return
  }
  activeReply.value = { id, rootId, replyToId, replyToName }
  replyForm.nickname = form.nickname
  replyForm.content = ''
}

const submitReply = async () => {
  if (!replyForm.nickname.trim() || !replyForm.content.trim()) return alert(i18n.value.fieldRequired)
  if (!activeReply.value) return
  if (!turnstileToken.value) return alert(i18n.value.turnstileRequired)

  submitting.value = true
  const target = activeReply.value

  const payload = {
    commentId: crypto.randomUUID(),
    pageKey: normalizedPageKey.value,
    rootId: target.rootId,
    replyToId: target.replyToId,
    replyToName: target.replyToName,
    token: turnstileToken.value,
    nickname: replyForm.nickname,
    content: replyForm.content
  }

  try {
    const res = await fetch(`${API_BASE}/api/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      form.nickname = replyForm.nickname
      replyForm.content = ''
      activeReply.value = null
      if (turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId)
      turnstileToken.value = ''
      await fetchComments()
    } else {
      const errorText = await res.text()
      alert(i18n.value.replyFailed + errorText)
    }
  } catch (e) {
    alert(i18n.value.networkError)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  lastEnforcedVersion.value = localStorage.getItem(`comment_v_${normalizedPageKey.value}`) || ''
  fetchComments()

  const script = document.createElement('script')
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
  script.async = true
  script.onload = () => {
    if (window.turnstile) {
      turnstileWidgetId = window.turnstile.render('#turnstile-container', {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => { turnstileToken.value = token },
        'expired-callback': () => { turnstileToken.value = '' }
      })
    }
  }
  document.head.appendChild(script)
})

watch(() => route.path, () => {
  commentsTree.value = []
  showMainForm.value = false
  activeReply.value = null
  lastEnforcedVersion.value = localStorage.getItem(`comment_v_${normalizedPageKey.value}`) || ''
  fetchComments()
})
</script>

<template>
  <div class="vp-comments" v-if="!frontmatter.isNoComment">
    <!-- 触发器 -->
    <button 
      class="vp-comment-trigger"
      @click="showMainForm = !showMainForm"
      :aria-expanded="showMainForm"
    >
      {{ showMainForm ? i18n.triggerCommentHide : i18n.triggerComment }}
    </button>

    <!-- 主评论表单 -->
    <transition name="vp-slide">
      <div v-if="showMainForm" class="vp-form-container">
        <input 
          v-model="form.nickname" 
          type="text" 
          :placeholder="i18n.nicknamePlaceholder" 
          class="vp-input"
          :disabled="submitting"
        />
        <textarea 
          v-model="form.content" 
          :placeholder="i18n.contentPlaceholder" 
          rows="4"
          class="vp-input vp-textarea"
          :disabled="submitting"
        ></textarea>

        <div id="turnstile-container" class="vp-turnstile"></div>

        <div class="vp-action-bar">
          <button 
            @click="submitComment" 
            :disabled="submitting" 
            class="vp-btn vp-btn-primary"
          >
            <span v-if="submitting" class="vp-spinner"></span>
            {{ submitting ? i18n.sending : i18n.send }}
          </button>
        </div>
      </div>
    </transition>

    <!-- 评论列表 -->
    <div class="vp-list-container">
      <div v-for="root in commentsTree" :key="root.id" class="vp-comment-item">
        <div class="vp-meta">
          <span class="vp-name">{{ root.nickname }}</span>
          <span class="vp-time">{{ formatDateTime(root.created_at) }}</span>
        </div>
        <p class="vp-content">{{ root.content }}</p>
        <button 
          class="vp-action-btn"
          @click="openReplyForm(root.id, root.id, root.id, root.nickname)"
        >
          {{ i18n.reply }}
        </button>

        <transition name="vp-slide">
          <div v-if="activeReply?.id === root.id" class="vp-inline-form">
            <input 
              v-model="replyForm.nickname" 
              type="text" 
              :placeholder="i18n.replyNicknamePlaceholder" 
              class="vp-input"
              :disabled="submitting"
            />
            <textarea 
              v-model="replyForm.content" 
              :placeholder="i18n.replyContentPlaceholder" 
              rows="3"
              class="vp-input vp-textarea"
              :disabled="submitting"
            ></textarea>
            <div class="vp-inline-btns">
              <button 
                @click="submitReply" 
                :disabled="submitting" 
                class="vp-btn vp-btn-primary vp-btn-sm"
              >
                <span v-if="submitting" class="vp-spinner"></span>
                {{ submitting ? i18n.sending : i18n.confirmReply }}
              </button>
              <button 
                @click="activeReply = null" 
                class="vp-btn vp-btn-ghost vp-btn-sm"
              >
                {{ i18n.cancelReply }}
              </button>
            </div>
          </div>
        </transition>

        <!-- 子回复树 -->
        <div class="vp-sub-tree" v-if="root.children && root.children.length > 0">
          <div v-for="reply in root.children" :key="reply.id" class="vp-reply-item">
            <div class="vp-meta">
              <span class="vp-name">{{ reply.nickname }}</span>
              <span class="vp-reply-target" v-if="reply.reply_to_name">
                @{{ reply.reply_to_name }}
              </span>
              <span class="vp-time">{{ formatDateTime(reply.created_at) }}</span>
            </div>
            <p class="vp-content">{{ reply.content }}</p>
            <button 
              class="vp-action-btn"
              @click="openReplyForm(reply.id, root.id, reply.id, reply.nickname)"
            >
              {{ i18n.reply }}
            </button>

            <transition name="vp-slide">
              <div v-if="activeReply?.id === reply.id" class="vp-inline-form">
                <input 
                  v-model="replyForm.nickname" 
                  type="text" 
                  :placeholder="i18n.replyNicknamePlaceholder" 
                  class="vp-input"
                  :disabled="submitting"
                />
                <textarea 
                  v-model="replyForm.content" 
                  :placeholder="i18n.replyContentPlaceholder" 
                  rows="3"
                  class="vp-input vp-textarea"
                  :disabled="submitting"
                ></textarea>
                <div class="vp-inline-btns">
                  <button 
                    @click="submitReply" 
                    :disabled="submitting" 
                    class="vp-btn vp-btn-primary vp-btn-sm"
                  >
                    <span v-if="submitting" class="vp-spinner"></span>
                    {{ submitting ? i18n.sending : i18n.confirmReply }}
                  </button>
                  <button 
                    @click="activeReply = null" 
                    class="vp-btn vp-btn-ghost vp-btn-sm"
                  >
                    {{ i18n.cancelReply }}
                  </button>
                </div>
              </div>
            </transition>
          </div>
          <button 
            v-if="root.hasMoreReplies" 
            class="vp-load-more"
            @click="fetchMoreReplies(root.id)"
          >
            {{ i18n.loadMoreReplies }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==================== VitePress 原生适配样式 ==================== */
.vp-comments {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-base);
}

/* 触发器 */
.vp-comment-trigger {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 1rem;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.25s, color 0.25s;
}
.vp-comment-trigger:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.vp-comment-trigger[aria-expanded="true"] {
  background: var(--vp-c-bg-soft);
}

/* 表单容器 */
.vp-form-container {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

/* 输入框 */
.vp-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
  font-family: inherit;
  margin-bottom: 0.75rem;
  transition: border-color 0.25s;
}
.vp-input::placeholder {
  color: var(--vp-c-text-3);
}
.vp-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px rgba(var(--vp-c-brand-1-rgb, 0), 0.12); /* 兼容性处理 */
}
.vp-textarea {
  resize: vertical;
  min-height: 80px;
}

.vp-turnstile {
  margin-bottom: 0.75rem;
}

.vp-action-bar {
  display: flex;
  justify-content: flex-end;
}

/* 按钮系统 */
.vp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.4rem 1rem;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}
.vp-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vp-btn-primary {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}
.vp-btn-primary:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
}

.vp-btn-ghost {
  background: transparent;
  color: var(--vp-c-text-2);
  border-color: var(--vp-c-divider);
}
.vp-btn-ghost:hover:not(:disabled) {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-text-3);
  color: var(--vp-c-text-1);
}

.vp-btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

.vp-spinner {
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: vp-spin 0.6s linear infinite;
}
@keyframes vp-spin {
  to { transform: rotate(360deg); }
}

/* 列表与内容排版 */
.vp-list-container {
  margin-top: 2rem;
}
.vp-comment-item {
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}
.vp-comment-item:last-child {
  border-bottom: none;
}

.vp-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}
.vp-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.vp-reply-target {
  color: var(--vp-c-brand-1);
  font-size: 0.8125rem;
  font-weight: 500;
}
.vp-time {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  font-variant-numeric: tabular-nums;
}
.vp-content {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  margin: 0 0 0.25rem 0;
  word-break: break-word;
}
.vp-action-btn {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}
.vp-action-btn:hover {
  color: var(--vp-c-brand-1);
}

/* 内联回复表单 */
.vp-inline-form {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
}
.vp-inline-btns {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

/* 子回复树 */
.vp-sub-tree {
  margin-top: 1rem;
  padding-left: 1.25rem;
  border-left: 2px solid var(--vp-c-divider);
}
.vp-reply-item {
  padding: 0.75rem 0;
  border-bottom: 1px dashed var(--vp-c-divider);
}
.vp-reply-item:last-child {
  border-bottom: none;
}
.vp-reply-item .vp-content {
  font-size: 0.875rem;
}

.vp-load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: transparent;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}
.vp-load-more:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

/* Vue 过渡动画 */
.vp-slide-enter-active,
.vp-slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.vp-slide-enter-from,
.vp-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  transform: translateY(-5px);
}
.vp-slide-enter-to,
.vp-slide-leave-from {
  opacity: 1;
  max-height: 500px; /* 给足高度空间 */
}
</style>
