<script setup>
import { ref, onMounted, onUnmounted, reactive, watch, computed, nextTick } from 'vue'
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
const showForm = ref(false)
const activeReply = ref(null)

// 增加 rememberInfo 字段
const form = reactive({ nickname: '', email: '', content: '', rememberInfo: false })
const replyForm = reactive({ nickname: '', email: '', content: '', rememberInfo: false })
const lastEnforcedVersion = ref('')

const mainTurnstileToken = ref('')
let mainTurnstileWidgetId = null

const replyTurnstileToken = ref('')
let replyTurnstileWidgetId = null

let themeObserver = null

const REMEMBER_INFO_KEY = 'comment_remember_info'

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

const getTurnstileTheme = () => document.documentElement.classList.contains('dark') ? 'dark' : 'light'

const sha256 = async (message) => {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const i18n = computed(() => {
  const map = {
    zh: {
      title: '评论', triggerComment: '评论', triggerCommentHide: '收起',
      nicknamePlaceholder: '名称 *（必填）', emailPlaceholder: '邮箱 *（必填，不公开）',
      contentPlaceholder: '评论内容 *（必填，最多1000字）', send: '发送', sending: '发送中...',
      reply: '回复', loadMoreReplies: '展开更多回复', confirmReply: '回复', cancelReply: '取消',
      fieldRequired: '字段必填', emailRequired: '请填写邮箱', emailInvalid: '邮箱格式不正确',
      submitFailed: '提交失败：', replyFailed: '回复失败：', networkError: '网络错误，请稍后重试',
      turnstileRequired: '请先完成人机验证', replyNicknamePlaceholder: '名称 *（必填）',
      replyEmailPlaceholder: '邮箱 *（必填，不公开）', replyContentPlaceholder: '回复内容  *（必填，最多1000字）',
      submitSuccessPending: '已提交，审核通过后将公开显示。',
      rememberMe: '记住我'
    },
    en: {
      title: 'Comments', triggerComment: 'Comments', triggerCommentHide: 'Collapse',
      nicknamePlaceholder: 'Your Name *', emailPlaceholder: 'Your Email * (private)',
      contentPlaceholder: 'Your Thoughts * (Max 1000 characters)', send: 'Send', sending: 'Sending...',
      reply: 'Reply', loadMoreReplies: 'Load more replies', confirmReply: 'Reply', cancelReply: 'Cancel',
      fieldRequired: 'All fields are required', emailRequired: 'Email is required', emailInvalid: 'Invalid email format',
      submitFailed: 'Submit failed: ', replyFailed: 'Reply failed: ', networkError: 'Network error, please try again later',
      turnstileRequired: 'Please complete the CAPTCHA', replyNicknamePlaceholder: 'Your Name *',
      replyEmailPlaceholder: 'Your Email * (private)', replyContentPlaceholder: 'Your Reply * (Max 1000 characters)',
      submitSuccessPending: 'Comment submitted. It will be public after admin approval.',
      rememberMe: 'Remember me'
    }
  }
  return map[lang.value] || map.zh
})

const formatDateTime = (timestamp) => {
  const d = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  const month = pad(d.getMonth() + 1), date = pad(d.getDate()), year = d.getFullYear()
  const hours = pad(d.getHours()), minutes = pad(d.getMinutes()), seconds = pad(d.getSeconds())
  return lang.value === 'en' ? `${month}/${date}/${year} ${hours}:${minutes}:${seconds}` : `${year}/${month}/${date} ${hours}:${minutes}:${seconds}`
}

const toggleForm = () => {
  showForm.value = !showForm.value
  if (!showForm.value && mainTurnstileWidgetId !== null) {
    try { window.turnstile.remove(mainTurnstileWidgetId) } catch(e) {}
    mainTurnstileWidgetId = null
    mainTurnstileToken.value = ''
  }
}

const fetchComments = async () => {
  let url = `${API_BASE}/api/comments?pageKey=${encodeURIComponent(normalizedPageKey.value)}`
  if (lastEnforcedVersion.value) url += `&v=${encodeURIComponent(lastEnforcedVersion.value)}`
  try {
    const res = await fetch(url)
    const { roots, replies } = await res.json()
    if (!roots || roots.length === 0) { commentsTree.value = []; return }

    roots.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const nodeMap = new Map()
    roots.forEach(r => { r.children = []; r.hasMoreReplies = false; nodeMap.set(r.id, r) })
    replies.forEach(r => { r.children = []; nodeMap.set(r.id, r); if (r.root_id && nodeMap.has(r.root_id)) nodeMap.get(r.root_id).children.push(r) })
    roots.forEach(r => { if (replies.filter(rep => rep.root_id === r.id).length >= 30) r.hasMoreReplies = true })
    commentsTree.value = roots
  } catch (e) { console.error('获取评论失败', e) }
}

const fetchMoreReplies = async (rootId) => {
  const targetRoot = commentsTree.value.find(r => r.id === rootId)
  if (!targetRoot || targetRoot.children.length === 0) return
  const lastReply = targetRoot.children[targetRoot.children.length - 1]
  const cursor = `${lastReply.seq_num}|${lastReply.id}`
  try {
    const res = await fetch(`${API_BASE}/api/comments/replies?root_id=${rootId}&cursor=${encodeURIComponent(cursor)}`)
    const { replies } = await res.json()
    if (replies.length === 0) { targetRoot.hasMoreReplies = false; return }
    replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    targetRoot.children = [...targetRoot.children, ...replies]
    if (replies.length < 10) targetRoot.hasMoreReplies = false
  } catch (e) { console.error('加载更多回复失败', e) }
}

const renderMainTurnstile = async () => {
  if (!showForm.value) return
  await nextTick()
  if (!window.turnstile || !document.getElementById('turnstile-container-main')) return
  if (mainTurnstileWidgetId !== null) { try { window.turnstile.remove(mainTurnstileWidgetId) } catch(e) {} }
  mainTurnstileToken.value = ''
  mainTurnstileWidgetId = window.turnstile.render('#turnstile-container-main', {
    sitekey: TURNSTILE_SITE_KEY,
    size: 'flexible',
    theme: getTurnstileTheme(),
    appearance: 'interaction-only',
    callback: (token) => { mainTurnstileToken.value = token },
    'expired-callback': () => { mainTurnstileToken.value = '' },
    'error-callback': () => { mainTurnstileToken.value = '' }
  })
}

const renderReplyTurnstile = async () => {
  await nextTick()
  if (!window.turnstile || !activeReply.value) return
  const containerId = `turnstile-container-reply-${activeReply.value.id}`
  const el = document.getElementById(containerId)
  if (!el) return
  if (replyTurnstileWidgetId !== null) { try { window.turnstile.remove(replyTurnstileWidgetId) } catch(e) {} }
  replyTurnstileToken.value = ''
  replyTurnstileWidgetId = window.turnstile.render(`#${containerId}`, {
    sitekey: TURNSTILE_SITE_KEY,
    size: 'flexible',
    theme: getTurnstileTheme(),
    appearance: 'interaction-only',
    callback: (token) => { replyTurnstileToken.value = token },
    'expired-callback': () => { replyTurnstileToken.value = '' },
    'error-callback': () => { replyTurnstileToken.value = '' }
  })
}

const submitComment = async () => {
  if (!form.nickname.trim() || !form.content.trim()) return alert(i18n.value.fieldRequired)
  if (!form.email.trim()) return alert(i18n.value.emailRequired)
  if (!EMAIL_REGEX.test(form.email.trim())) return alert(i18n.value.emailInvalid)
  if (!mainTurnstileToken.value) return alert(i18n.value.turnstileRequired)

  submitting.value = true
  const trimmedEmail = form.email.trim().toLowerCase()
  const emailHash = await sha256(trimmedEmail)

  const payload = {
    commentId: crypto.randomUUID(),
    pageKey: normalizedPageKey.value,
    token: mainTurnstileToken.value,
    nickname: form.nickname,
    emailHash,
    email: trimmedEmail,
    content: form.content
  }

  try {
    const res = await fetch(`${API_BASE}/api/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })

    if (res.ok) {
      const data = await res.json()
      if (data.enforcedVersion) {
        lastEnforcedVersion.value = data.enforcedVersion
        localStorage.setItem(`comment_v_${normalizedPageKey.value}`, data.enforcedVersion)
      }
      
      // 处理记住信息逻辑
      if (form.rememberInfo) {
        localStorage.setItem(REMEMBER_INFO_KEY, JSON.stringify({ nickname: form.nickname, email: form.email }))
      } else {
        localStorage.removeItem(REMEMBER_INFO_KEY)
      }

      form.content = ''
      if (mainTurnstileWidgetId !== null) window.turnstile.reset(mainTurnstileWidgetId)
      mainTurnstileToken.value = ''

      alert(i18n.value.submitSuccessPending)
    } else {
      const errorText = await res.text()
      alert(i18n.value.submitFailed + errorText)
      if (mainTurnstileWidgetId !== null) window.turnstile.reset(mainTurnstileWidgetId)
    }
  } catch (e) {
    alert(i18n.value.networkError)
  } finally {
    submitting.value = false
  }
}

const openReplyForm = (id, rootId, replyToId, replyToName) => {
  if (activeReply.value?.id === id) { activeReply.value = null; return }
  if (replyTurnstileWidgetId !== null) { try { window.turnstile.remove(replyTurnstileWidgetId) } catch(e) {}; replyTurnstileWidgetId = null }
  replyTurnstileToken.value = ''
  activeReply.value = { id, rootId, replyToId, replyToName }
  replyForm.nickname = form.nickname
  replyForm.email = form.email
  replyForm.rememberInfo = form.rememberInfo // 同步主表单的记住状态
  replyForm.content = ''
}

const submitReply = async () => {
  if (!replyForm.nickname.trim() || !replyForm.content.trim()) return alert(i18n.value.fieldRequired)
  if (!replyForm.email.trim()) return alert(i18n.value.emailRequired)
  if (!EMAIL_REGEX.test(replyForm.email.trim())) return alert(i18n.value.emailInvalid)
  if (!activeReply.value) return
  if (!replyTurnstileToken.value) return alert(i18n.value.turnstileRequired)

  submitting.value = true
  const target = activeReply.value
  const trimmedEmail = replyForm.email.trim().toLowerCase()
  const emailHash = await sha256(trimmedEmail)

  const payload = {
    commentId: crypto.randomUUID(),
    pageKey: normalizedPageKey.value,
    rootId: target.rootId,
    replyToId: target.replyToId,
    replyToName: target.replyToName,
    token: replyTurnstileToken.value,
    nickname: replyForm.nickname,
    emailHash,
    email: trimmedEmail,
    content: replyForm.content
  }

  try {
    const res = await fetch(`${API_BASE}/api/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })

    if (res.ok) {
      // 处理记住信息逻辑
      if (replyForm.rememberInfo) {
        form.rememberInfo = true // 同步给主表单
        localStorage.setItem(REMEMBER_INFO_KEY, JSON.stringify({ nickname: replyForm.nickname, email: replyForm.email }))
      } else {
        form.rememberInfo = false // 同步给主表单
        localStorage.removeItem(REMEMBER_INFO_KEY)
      }

      form.nickname = replyForm.nickname
      form.email = replyForm.email
      replyForm.content = ''
      activeReply.value = null
      if (replyTurnstileWidgetId !== null) { try { window.turnstile.remove(replyTurnstileWidgetId) } catch(e) {}; replyTurnstileWidgetId = null }
      replyTurnstileToken.value = ''

      alert(i18n.value.submitSuccessPending)
    } else {
      const errorText = await res.text()
      alert(i18n.value.replyFailed + errorText)
      if (replyTurnstileWidgetId !== null) window.turnstile.reset(replyTurnstileWidgetId)
    }
  } catch (e) {
    alert(i18n.value.networkError)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  lastEnforcedVersion.value = localStorage.getItem(`comment_v_${normalizedPageKey.value}`) || ''
  
  // 读取记住的信息并填充表单
  try {
    const savedInfo = localStorage.getItem(REMEMBER_INFO_KEY)
    if (savedInfo) {
      const info = JSON.parse(savedInfo)
      form.nickname = info.nickname || ''
      form.email = info.email || ''
      form.rememberInfo = true
      replyForm.rememberInfo = true
    }
  } catch (e) { console.warn('读取记住信息失败', e) }

  fetchComments()
  if (!window.turnstile) {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => {
      if (showForm.value) renderMainTurnstile()
      if (activeReply.value) renderReplyTurnstile()
    }
    document.head.appendChild(script)
  }

  themeObserver = new MutationObserver(() => {
    if (showForm.value) renderMainTurnstile()
    if (activeReply.value) renderReplyTurnstile()
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  if (themeObserver) themeObserver.disconnect()
})

watch(() => route.path, () => {
  commentsTree.value = []
  showForm.value = false
  activeReply.value = null
  lastEnforcedVersion.value = localStorage.getItem(`comment_v_${normalizedPageKey.value}`) || ''
  fetchComments()
})
</script>

<template>
  <div class="vp-comments-wrapper" v-if="!frontmatter.isNoComment">
    <div class="vp-comments">
      <span
        class="comment-toggle"
        @click="toggleForm"
        :class="{ 'is-active': showForm }"
      >
        {{ showForm ? i18n.triggerCommentHide : i18n.triggerComment }}
      </span>

      <transition name="vp-slide-big" @after-enter="renderMainTurnstile">
        <div v-if="showForm" class="vp-form-container">
          <div class="vp-form-row">
            <input v-model="form.nickname" type="text" :placeholder="i18n.nicknamePlaceholder" class="vp-input vp-input-name" :disabled="submitting" />
            <input v-model="form.email" type="email" :placeholder="i18n.emailPlaceholder" class="vp-input" :disabled="submitting" autocomplete="email" />
            <textarea v-model="form.content" :placeholder="i18n.contentPlaceholder" rows="4" class="vp-input vp-textarea" :disabled="submitting"></textarea>
          </div>
          <div id="turnstile-container-main" class="vp-turnstile"></div>
          <div class="vp-action-bar">
            <label class="vp-remember-label">
              <input type="checkbox" v-model="form.rememberInfo" />
              <span>{{ i18n.rememberMe }}</span>
            </label>
            <button @click="submitComment" :disabled="submitting" class="vp-btn vp-btn-primary">
              <span v-if="submitting" class="vp-spinner"></span>
              {{ submitting ? i18n.sending : i18n.send }}
            </button>
          </div>
        </div>
      </transition>

      <div class="vp-list-container">
        <div v-for="root in commentsTree" :key="root.id" class="vp-comment-item">
          <div class="vp-meta">
            <span class="vp-name">{{ root.nickname }}</span>
            <button class="vp-action-btn" @click="openReplyForm(root.id, root.id, root.id, root.nickname)">{{ i18n.reply }}</button>
          </div>
          <p class="vp-content">{{ root.content }}</p>
          <span class="vp-time">{{ formatDateTime(root.created_at) }}</span>

          <transition name="vp-slide" @after-enter="renderReplyTurnstile">
            <div v-if="activeReply?.id === root.id" class="vp-inline-form">
              <div class="vp-form-row">
                <input v-model="replyForm.nickname" type="text" :placeholder="i18n.replyNicknamePlaceholder" class="vp-input vp-input-name" :disabled="submitting" />
                <input v-model="replyForm.email" type="email" :placeholder="i18n.replyEmailPlaceholder" class="vp-input" :disabled="submitting" autocomplete="email" />
                <textarea v-model="replyForm.content" :placeholder="i18n.replyContentPlaceholder" rows="3" class="vp-input vp-textarea" :disabled="submitting"></textarea>
              </div>
              <div :id="'turnstile-container-reply-' + root.id" class="vp-turnstile"></div>
              <div class="vp-inline-btns">
                <label class="vp-remember-label vp-remember-sm">
                  <input type="checkbox" v-model="replyForm.rememberInfo" />
                  <span>{{ i18n.rememberMe }}</span>
                </label>
                <button @click="submitReply" :disabled="submitting" class="vp-btn vp-btn-primary vp-btn-sm">
                  <span v-if="submitting" class="vp-spinner"></span>
                  {{ submitting ? i18n.sending : i18n.confirmReply }}
                </button>
                <button @click="activeReply = null" class="vp-btn vp-btn-ghost vp-btn-sm">{{ i18n.cancelReply }}</button>
              </div>
            </div>
          </transition>

          <div class="vp-sub-tree" v-if="root.children && root.children.length > 0">
            <div v-for="reply in root.children" :key="reply.id" class="vp-reply-item">
              <div class="vp-meta">
                <span class="vp-name">{{ reply.nickname }}</span>
                <span class="vp-reply-target" v-if="reply.reply_to_name">@{{ reply.reply_to_name }}</span>
                <button class="vp-action-btn" @click="openReplyForm(reply.id, root.id, reply.id, reply.nickname)">{{ i18n.reply }}</button>
              </div>
              <p class="vp-content">{{ reply.content }}</p>
              <span class="vp-time">{{ formatDateTime(reply.created_at) }}</span>

              <transition name="vp-slide" @after-enter="renderReplyTurnstile">
                <div v-if="activeReply?.id === reply.id" class="vp-inline-form">
                  <div class="vp-form-row">
                    <input v-model="replyForm.nickname" type="text" :placeholder="i18n.replyNicknamePlaceholder" class="vp-input vp-input-name" :disabled="submitting" />
                    <input v-model="replyForm.email" type="email" :placeholder="i18n.replyEmailPlaceholder" class="vp-input" :disabled="submitting" autocomplete="email" />
                    <textarea v-model="replyForm.content" :placeholder="i18n.replyContentPlaceholder" rows="3" class="vp-input vp-textarea" :disabled="submitting"></textarea>
                  </div>
                  <div :id="'turnstile-container-reply-' + reply.id" class="vp-turnstile"></div>
                  <div class="vp-inline-btns">
                    <label class="vp-remember-label vp-remember-sm">
                      <input type="checkbox" v-model="replyForm.rememberInfo" />
                      <span>{{ i18n.rememberMe }}</span>
                    </label>
                    <button @click="submitReply" :disabled="submitting" class="vp-btn vp-btn-primary vp-btn-sm">
                      <span v-if="submitting" class="vp-spinner"></span>
                      {{ submitting ? i18n.sending : i18n.confirmReply }}
                    </button>
                    <button @click="activeReply = null" class="vp-btn vp-btn-ghost vp-btn-sm">{{ i18n.cancelReply }}</button>
                  </div>
                </div>
              </transition>
            </div>
            <button v-if="root.hasMoreReplies" class="vp-load-more" @click="fetchMoreReplies(root.id)">{{ i18n.loadMoreReplies }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vp-comments-wrapper { margin-top: 0; }
.vp-comments { color: var(--vp-c-text-1); font-family: var(--vp-font-family-base); }
.comment-toggle {
  display: inline-block; margin-bottom: 0px; cursor: pointer;
  font-size: 1.125rem; text-decoration: none; user-select: none;
  color: var(--vp-c-brand-1); font-family: "AI", var(--vp-font-family-base), sans-serif;
  font-weight: 500; transition: color 0.25s, opacity 0.25s;
}
.comment-toggle:hover { opacity: 0.8; color: var(--vp-c-brand-2); }
.comment-toggle.is-active { color: var(--vp-c-brand-2); }
.vp-form-container {
  margin-top: 1.5rem; padding: 0rem; border: 1px solid var(--vp-c-divider); border-radius: 8px;
  width: 66.6667%; box-sizing: border-box;
}
@media (max-width: 640px) {
  .vp-form-container { width: 100%; padding: 1rem; }
}
.vp-form-row { display: flex; flex-direction: column; align-items: stretch; gap: 0; margin-bottom: 0; width: 100%; }
.vp-form-row .vp-input { width: 100%; }
.vp-input {
  width: 100%; padding: 0.5rem 0.75rem; background: transparent;
  border: 1px solid var(--vp-c-divider); border-radius: 6px; color: var(--vp-c-text-1);
  font-size: 0.875rem; font-family: inherit; margin-bottom: 0.75rem; transition: border-color 0.25s; box-sizing: border-box;
}
.vp-input::placeholder { color: var(--vp-c-text-3); }
.vp-input:focus { outline: none; border-color: var(--vp-c-brand-1); box-shadow: 0 0 0 2px rgba(var(--vp-c-brand-1-rgb, 0), 0.12); }
.vp-textarea { resize: vertical; min-height: 80px; }
.vp-turnstile { margin-bottom: 0.5rem; width: 100%; }
.vp-action-bar { display: flex; justify-content: space-between; align-items: center; }
.vp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.4rem 1rem; border: 1px solid transparent; border-radius: 6px; font-size: 0.875rem;
  font-weight: 500; cursor: pointer; transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}
.vp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.vp-btn-primary { background: var(--vp-c-brand-1); color: var(--vp-c-white); }
.vp-btn-primary:hover:not(:disabled) { background: var(--vp-c-brand-2); }
.vp-btn-ghost { background: transparent; color: var(--vp-c-text-2); border-color: var(--vp-c-divider); }
.vp-btn-ghost:hover:not(:disabled) { background: transparent; border-color: var(--vp-c-text-3); color: var(--vp-c-text-1); }
.vp-btn-sm { padding: 0.25rem 0.75rem; font-size: 0.75rem; }
.vp-spinner {
  width: 0.875rem; height: 0.875rem; border: 2px solid currentColor;
  border-right-color: transparent; border-radius: 50%; animation: vp-spin 0.6s linear infinite;
}
@keyframes vp-spin { to { transform: rotate(360deg); } }
.vp-list-container { margin-top: 2rem; }
.vp-comment-item { padding: 0.5rem 0; }
.vp-meta { display: flex; align-items: center; gap: 0.25rem; margin-bottom: 0.25rem; }
.vp-name {
  font-size: 1.125rem; font-weight: 600; color: var(--vp-c-brand-1);
  font-family: "AI", var(--vp-font-family-base), sans-serif; letter-spacing: 0.3px;
}
.vp-reply-target {
  color: var(--vp-c-brand-1); font-size: 0.9375rem; font-weight: 500;
  font-family: "AI", var(--vp-font-family-base), sans-serif;
}
.vp-time { display: block; font-size: 0.75rem; color: var(--vp-c-text-3); font-variant-numeric: tabular-nums; margin-top: 0.25rem; }
.vp-content {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  margin: 0 0 0.25rem 0;
  word-break: break-word;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.vp-action-btn { font-size: 0.75rem; color: var(--vp-c-text-3); background: none; border: none; cursor: pointer; padding: 0; transition: color 0.2s; }
.vp-action-btn:hover { color: var(--vp-c-brand-1); }
.vp-inline-form {
  margin-top: 1rem; padding: 1rem; border: 1px solid var(--vp-c-divider); border-radius: 6px;
  width: 66.6667%; box-sizing: border-box;
}
@media (max-width: 640px) {
  .vp-inline-form { width: 100%; }
  .vp-sub-tree .vp-inline-form {
    margin-left: -2rem;
    width: calc(100% + 2rem);
  }
}
.vp-inline-btns { display: flex; justify-content: flex-end; align-items: center; gap: 0.25rem; margin-top: 0.25rem; }
.vp-sub-tree { margin-top: 0.25rem; padding-left: 2rem; border-left: none; }
.vp-reply-item { padding: 0.5rem 0; }
.vp-reply-item .vp-content { font-size: 0.875rem; }
.vp-load-more {
  display: flex; align-items: center; justify-content: center; width: 100%; margin-top: 0.25rem; padding: 0.25rem;
  background: transparent; border: 1px dashed var(--vp-c-divider); border-radius: 6px; color: var(--vp-c-text-2);
  font-size: 0.75rem; cursor: pointer; transition: all 0.2s;
}
.vp-load-more:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }

/* 记住我复选框样式 */
.vp-remember-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-right: auto; /* 强制将复选框推到容器的最左侧 */
  font-size: 0.875rem;
  color: var(--vp-c-text-3); /* 文字颜色始终保持不变 */
  cursor: pointer;
  user-select: none;
}

.vp-remember-sm {
  font-size: 0.75rem;
}

/* 复选框默认与选中样式 */
.vp-remember-label input[type="checkbox"] {
  width: 0.875rem;
  height: 0.875rem;
  cursor: pointer;
  accent-color: var(--vp-c-green-1); 
}



.vp-slide-enter-active, .vp-slide-leave-active, .vp-slide-big-enter-active, .vp-slide-big-leave-active { transition: all 0.25s ease; overflow: hidden; }
.vp-slide-enter-from, .vp-slide-leave-to, .vp-slide-big-enter-from, .vp-slide-big-leave-to { opacity: 0; max-height: 0; margin-top: 0; transform: translateY(-5px); }
.vp-slide-enter-to, .vp-slide-leave-from { opacity: 1; max-height: 600px; }
.vp-slide-big-enter-to, .vp-slide-big-leave-from { opacity: 1; max-height: 5000px; }
</style>
