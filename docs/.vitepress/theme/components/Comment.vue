<script setup>
import { ref, onMounted, reactive, watch, computed } from 'vue'
import { useRoute, useData } from 'vitepress'

const API_BASE = 'https://blog-comments-api.jihaoqi.workers.dev'
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
      console.error('Worker Error:', errorText)
    }
  } catch (e) {
    alert(i18n.value.networkError)
    console.error(e)
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
      console.error('Worker Error:', errorText)
    }
  } catch (e) {
    alert(i18n.value.networkError)
    console.error(e)
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
        callback: (token) => {
          turnstileToken.value = token
        },
        'expired-callback': () => {
          turnstileToken.value = ''
        }
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
  <div class="comments" v-if="!frontmatter.isNoComment">
    <div class="comment-wrapper">
      <!-- 触发器按钮 -->
      <button 
        class="comment-trigger"
        @click="showMainForm = !showMainForm"
        :aria-expanded="showMainForm"
      >
        <span class="trigger-icon">💬</span>
        <span class="trigger-text">{{ showMainForm ? i18n.triggerCommentHide : i18n.triggerComment }}</span>
      </button>

      <!-- 主评论表单 -->
      <transition name="slide-down">
        <div v-if="showMainForm" class="form-container">
          <div class="form-field">
            <label for="nickname" class="field-label">{{ i18n.nicknamePlaceholder }}</label>
            <input 
              v-model="form.nickname" 
              type="text" 
              id="nickname"
              :placeholder="i18n.nicknamePlaceholder" 
              class="input-field"
              :disabled="submitting"
            />
          </div>
          <div class="form-field">
            <label for="content" class="field-label">{{ i18n.contentPlaceholder }}</label>
            <textarea 
              v-model="form.content" 
              id="content"
              :placeholder="i18n.contentPlaceholder" 
              rows="4"
              class="input-field textarea"
              :disabled="submitting"
            ></textarea>
          </div>

          <!-- Turnstile 小组件容器 -->
          <div id="turnstile-container" class="turnstile-container"></div>

          <div class="action-bar">
            <button 
              @click="submitComment" 
              :disabled="submitting" 
              class="btn btn-primary"
            >
              <span v-if="submitting" class="spinner"></span>
              <span>{{ submitting ? i18n.sending : i18n.send }}</span>
            </button>
          </div>
        </div>
      </transition>

      <!-- 评论列表 -->
      <div class="list-container">
        <div v-for="root in commentsTree" :key="root.id" class="root-card">
          <div class="comment-header">
            <div class="comment-author">
              <span class="user-avatar">{{ root.nickname.charAt(0).toUpperCase() }}</span>
              <div class="author-info">
                <span class="user-name">{{ root.nickname }}</span>
                <span class="comment-time">{{ formatDateTime(root.created_at) }}</span>
              </div>
            </div>
          </div>
          <div class="comment-body">
            <p class="body-text">{{ root.content }}</p>
          </div>
          <div class="comment-actions">
            <button 
              class="action-btn"
              @click="openReplyForm(root.id, root.id, root.id, root.nickname)"
            >
              <span class="action-icon">↪</span>
              <span>{{ i18n.reply }}</span>
            </button>
          </div>

          <!-- 内联回复表单（针对根评论） -->
          <transition name="slide-down">
            <div v-if="activeReply?.id === root.id" class="inline-reply-form">
              <div class="form-field">
                <input 
                  v-model="replyForm.nickname" 
                  type="text" 
                  :placeholder="i18n.replyNicknamePlaceholder" 
                  class="input-field"
                  :disabled="submitting"
                />
              </div>
              <div class="form-field">
                <textarea 
                  v-model="replyForm.content" 
                  :placeholder="i18n.replyContentPlaceholder" 
                  rows="3"
                  class="input-field textarea"
                  :disabled="submitting"
                ></textarea>
              </div>
              <div class="inline-reply-btns">
                <button 
                  @click="submitReply" 
                  :disabled="submitting" 
                  class="btn btn-primary btn-small"
                >
                  <span v-if="submitting" class="spinner"></span>
                  <span>{{ submitting ? i18n.sending : i18n.confirmReply }}</span>
                </button>
                <button 
                  @click="activeReply = null" 
                  class="btn btn-ghost btn-small"
                >
                  {{ i18n.cancelReply }}
                </button>
              </div>
            </div>
          </transition>

          <!-- 子回复树 -->
          <div class="sub-tree" v-if="root.children && root.children.length > 0">
            <div v-for="reply in root.children" :key="reply.id" class="reply-card">
              <div class="comment-header">
                <div class="comment-author">
                  <span class="user-avatar small">{{ reply.nickname.charAt(0).toUpperCase() }}</span>
                  <div class="author-info">
                    <span class="user-name">{{ reply.nickname }}</span>
                    <span class="reply-prefix" v-if="reply.reply_to_name">
                      <span class="prefix-icon">@</span>
                      <span>{{ reply.reply_to_name }}</span>
                    </span>
                    <span class="comment-time">{{ formatDateTime(reply.created_at) }}</span>
                  </div>
                </div>
              </div>
              <div class="comment-body">
                <p class="body-text">{{ reply.content }}</p>
              </div>
              <div class="comment-actions">
                <button 
                  class="action-btn"
                  @click="openReplyForm(reply.id, root.id, reply.id, reply.nickname)"
                >
                  <span class="action-icon">↪</span>
                  <span>{{ i18n.reply }}</span>
                </button>
              </div>

              <transition name="slide-down">
                <div v-if="activeReply?.id === reply.id" class="inline-reply-form">
                  <div class="form-field">
                    <input 
                      v-model="replyForm.nickname" 
                      type="text" 
                      :placeholder="i18n.replyNicknamePlaceholder" 
                      class="input-field"
                      :disabled="submitting"
                    />
                  </div>
                  <div class="form-field">
                    <textarea 
                      v-model="replyForm.content" 
                      :placeholder="i18n.replyContentPlaceholder" 
                      rows="3"
                      class="input-field textarea"
                      :disabled="submitting"
                    ></textarea>
                  </div>
                  <div class="inline-reply-btns">
                    <button 
                      @click="submitReply" 
                      :disabled="submitting" 
                      class="btn btn-primary btn-small"
                    >
                      <span v-if="submitting" class="spinner"></span>
                      <span>{{ submitting ? i18n.sending : i18n.confirmReply }}</span>
                    </button>
                    <button 
                      @click="activeReply = null" 
                      class="btn btn-ghost btn-small"
                    >
                      {{ i18n.cancelReply }}
                    </button>
                  </div>
                </div>
              </transition>
            </div>
            <button 
              v-if="root.hasMoreReplies" 
              class="more-trigger"
              @click="fetchMoreReplies(root.id)"
            >
              <span class="more-icon">⬇</span>
              <span>{{ i18n.loadMoreReplies }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==================== Vercel Design System 变量 ==================== */
:root {
  /* 色彩系统 */
  --color-bg: #ffffff;
  --color-bg-soft: #f9f9f9;
  --color-bg-subtle: #f3f3f3;
  --color-border: #eaeaea;
  --color-border-strong: #d4d4d4;
  --color-text: #171717;
  --color-text-secondary: #525252;
  --color-text-tertiary: #8a8a8a;
  --color-primary: #0070f3;
  --color-primary-hover: #0061d5;
  --color-primary-active: #0050b3;
  --color-danger: #e00;
  --color-success: #0070f3;
  
  /* 暗色模式 */
  --color-bg-dark: #000000;
  --color-bg-soft-dark: #0a0a0a;
  --color-bg-subtle-dark: #171717;
  --color-border-dark: #262626;
  --color-border-strong-dark: #404040;
  --color-text-dark: #ededed;
  --color-text-secondary-dark: #a1a1a1;
  --color-text-tertiary-dark: #737373;
  
  /* 间距系统 - 8px基础单位 */
  --space-1: 0.125rem;   /* 2px */
  --space-2: 0.25rem;    /* 4px */
  --space-3: 0.375rem;   /* 6px */
  --space-4: 0.5rem;     /* 8px */
  --space-5: 0.625rem;   /* 10px */
  --space-6: 0.75rem;    /* 12px */
  --space-8: 1rem;       /* 16px */
  --space-10: 1.25rem;   /* 20px */
  --space-12: 1.5rem;    /* 24px */
  --space-16: 2rem;      /* 32px */
  --space-20: 2.5rem;    /* 40px */
  --space-24: 3rem;      /* 48px */
  --space-32: 4rem;      /* 64px */
  
  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;
  
  /* 字体大小 */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  
  /* 字重 */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* 行高 */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* 过渡 */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* 阴影 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* 暗色模式变量 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: var(--color-bg-dark);
    --color-bg-soft: var(--color-bg-soft-dark);
    --color-bg-subtle: var(--color-bg-subtle-dark);
    --color-border: var(--color-border-dark);
    --color-border-strong: var(--color-border-strong-dark);
    --color-text: var(--color-text-dark);
    --color-text-secondary: var(--color-text-secondary-dark);
    --color-text-tertiary: var(--color-text-tertiary-dark);
  }
}

/* ==================== 基础样式 ==================== */
.comment-wrapper {
  margin-top: var(--space-32);
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-24);
  color: var(--color-text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* ==================== 触发器按钮 ==================== */
.comment-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.comment-trigger:hover {
  background: var(--color-bg-soft);
  border-color: var(--color-border-strong);
  color: var(--color-text);
}

.comment-trigger[aria-expanded="true"] {
  background: var(--color-bg-soft);
  border-color: var(--color-border-strong);
}

.trigger-icon {
  font-size: var(--text-base);
  line-height: 1;
}

/* ==================== 表单容器 ==================== */
.form-container {
  margin-top: var(--space-6);
  padding: var(--space-8);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.form-field {
  margin-bottom: var(--space-5);
}

.field-label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-field {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--text-sm);
  font-family: inherit;
  transition: all var(--transition-fast);
}

.input-field:hover {
  border-color: var(--color-border-strong);
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
}

.input-field:disabled {
  background: var(--color-bg-subtle);
  cursor: not-allowed;
  opacity: 0.7;
}

.input-field.textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.turnstile-container {
  margin: var(--space-5) 0;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-6);
}

/* ==================== 按钮系统 ==================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:active:not(:disabled) {
  background: var(--color-primary-active);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border-color: var(--color-border);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--color-bg-soft);
  color: var(--color-text);
}

.btn-small {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-xs);
}

.spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner 0.6s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

/* ==================== 评论列表 ==================== */
.list-container {
  margin-top: var(--space-16);
}

.root-card {
  padding: var(--space-8) 0;
  border-bottom: 1px solid var(--color-border);
}

.root-card:last-child {
  border-bottom: none;
}

.comment-header {
  margin-bottom: var(--space-4);
}

.comment-author {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--color-primary), #0091ff);
  color: white;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  border-radius: 50%;
  flex-shrink: 0;
}

.user-avatar.small {
  width: 28px;
  height: 28px;
  font-size: var(--text-xs);
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.user-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text);
}

.comment-time {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
}

.reply-prefix {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.prefix-icon {
  font-weight: bold;
}

.comment-body {
  margin: var(--space-4) 0;
  padding-left: var(--space-10); /* 对齐头像 */
}

.body-text {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--color-text);
  word-break: break-word;
  margin: 0;
}

.comment-actions {
  padding-left: var(--space-10); /* 对齐头像 */
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-bg-soft);
  color: var(--color-text-secondary);
}

.action-icon {
  font-size: var(--text-sm);
}

/* ==================== 内联回复表单 ==================== */
.inline-reply-form {
  margin-top: var(--space-4);
  margin-left: var(--space-10); /* 对齐头像 */
  padding: var(--space-6);
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.inline-reply-form .form-field {
  margin-bottom: var(--space-4);
}

.inline-reply-btns {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

/* ==================== 子回复树 ==================== */
.sub-tree {
  margin-top: var(--space-6);
  margin-left: var(--space-10); /* 对齐头像 */
  padding-left: var(--space-8);
  border-left: 2px solid var(--color-border);
}

.reply-card {
  padding: var(--space-6) 0;
  border-bottom: 1px dashed var(--color-border);
}

.reply-card:last-child {
  border-bottom: none;
}

.reply-card .comment-body {
  margin: var(--space-3) 0;
  padding-left: var(--space-10); /* 对齐头像 */
}

.reply-card .comment-actions {
  padding-left: var(--space-10); /* 对齐头像 */
}

/* ==================== 加载更多 ==================== */
.more-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-4);
  margin-top: var(--space-6);
  background: transparent;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.more-trigger:hover {
  background: var(--color-bg-soft);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.more-icon {
  font-size: var(--text-sm);
}

/* ==================== 过渡动画 ==================== */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all var(--transition-normal);
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 1000px;
  margin-top: var(--space-6);
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 768px) {
  .comment-wrapper {
    margin-top: var(--space-24);
    padding-top: var(--space-16);
  }
  
  .form-container {
    padding: var(--space-6);
  }
  
  .user-avatar {
    width: 32px;
    height: 32px;
    font-size: var(--text-xs);
  }
  
  .user-avatar.small {
    width: 24px;
    height: 24px;
  }
  
  .comment-body,
  .comment-actions {
    padding-left: var(--space-8);
  }
  
  .inline-reply-form,
  .sub-tree {
    margin-left: var(--space-8);
    padding-left: var(--space-6);
  }
  
  .reply-card .comment-body,
  .reply-card .comment-actions {
    padding-left: var(--space-8);
  }
}

/* ==================== 可访问性 ==================== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 焦点状态 */
.btn:focus-visible,
.input-field:focus-visible,
.action-btn:focus-visible,
.more-trigger:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  :root {
    --color-border: #000000;
    --color-border-strong: #000000;
    --color-text-secondary: #000000;
    --color-text-tertiary: #000000;
  }
}
</style>

