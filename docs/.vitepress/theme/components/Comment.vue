<script setup>
import { ref, onMounted, reactive, watch, computed } from 'vue'
import { useRoute } from 'vitepress'

const API_BASE = 'https://blog-comments-api.jihaoqi.workers.dev'
// ⚠️ 请替换为你从 Cloudflare 获取的真实 Site Key
const TURNSTILE_SITE_KEY = '0x4AAAAAADoeWJeldd1Dgu09'  

const route = useRoute()

// 语言判断
const lang = computed(() => route.path.startsWith('/en') ? 'en' : 'zh')

// 统一 pageKey：去掉可能的语言前缀 /en
const normalizedPageKey = computed(() => {
  const path = route.path
  return path.startsWith('/en') ? path.slice(3) : path
})

const commentsTree = ref([])
const submitting = ref(false)
const showMainForm = ref(false)          // 是否展开主评论输入框
const activeReply = ref(null)            // 当前内联回复目标

const form = reactive({ nickname: '', content: '' })
const replyForm = reactive({ nickname: '', content: '' })
const lastEnforcedVersion = ref('')

// --- Turnstile 相关状态 ---
const turnstileToken = ref('')           // 每次验证获得的 token
let turnstileWidgetId = null             // 保存 widget ID，用于 reset

// 多语言文本
const i18n = computed(() => {
  const map = {
    zh: {
      title: '评论',
      triggerComment: '💬 写评论',
      triggerCommentHide: '收起 ▲',
      nicknamePlaceholder: '你的名称 *',
      contentPlaceholder: '输入你想表达的内容 (Max 1000字) *',
      send: '发送',
      sending: '写入中...',
      reply: '回复',
      loadMoreReplies: '展开更深层讨论...',
      confirmReply: '确认回复',
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
      triggerCommentHide: 'Collapse ▲',
      nicknamePlaceholder: 'Your Name *',
      contentPlaceholder: 'Write your thoughts (Max 1000 characters) *',
      send: 'Send',
      sending: 'Sending...',
      reply: 'Reply',
      loadMoreReplies: 'Load more replies...',
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

// 日期格式化
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

// 加载评论列表
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

// 加载更多回复
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

// 提交主评论
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
      // 重置 Turnstile
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

// 打开/切换内联回复表单
const openReplyForm = (id, rootId, replyToId, replyToName) => {
  if (activeReply.value?.id === id) {
    activeReply.value = null
    return
  }
  activeReply.value = { id, rootId, replyToId, replyToName }
  replyForm.nickname = form.nickname
  replyForm.content = ''
}

// 提交内联回复
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

// 初始化
onMounted(() => {
  lastEnforcedVersion.value = localStorage.getItem(`comment_v_${normalizedPageKey.value}`) || ''
  fetchComments()

  // 动态加载 Turnstile 脚本并显式渲染
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

// 路由切换时重置状态
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
    <h2 class="title comment-trigger" @click="showMainForm = !showMainForm">
      {{ showMainForm ? i18n.triggerCommentHide : i18n.triggerComment }}
    </h2>

    <!-- 主评论表单 -->
    <div v-if="showMainForm" class="form-container">
      <input v-model="form.nickname" type="text" :placeholder="i18n.nicknamePlaceholder" class="input-field nick" />
      <textarea v-model="form.content" :placeholder="i18n.contentPlaceholder" rows="3" class="input-field area"></textarea>

      <!-- Turnstile 小组件容器 -->
      <div id="turnstile-container" style="margin: 0.8rem 0;"></div>

      <div class="action-bar">
        <button @click="submitComment" :disabled="submitting" class="btn submit">
          {{ submitting ? i18n.sending : i18n.send }}
        </button>
      </div>
    </div>

    <!-- 评论列表 -->
    <div class="list-container">
      <div v-for="root in commentsTree" :key="root.id" class="root-card">
        <div class="meta-header">
          <span class="user">{{ root.nickname }}</span>
          <span class="time">{{ formatDateTime(root.created_at) }}</span>
        </div>
        <p class="body-text">{{ root.content }}</p>
        <span class="action-trigger" @click="openReplyForm(root.id, root.id, root.id, root.nickname)">
          {{ i18n.reply }}
        </span>

        <!-- 内联回复表单（针对根评论） -->
        <div v-if="activeReply?.id === root.id" class="inline-reply-form">
          <input v-model="replyForm.nickname" type="text" :placeholder="i18n.replyNicknamePlaceholder" class="input-field nick" />
          <textarea v-model="replyForm.content" :placeholder="i18n.replyContentPlaceholder" rows="2" class="input-field area"></textarea>
          <div class="inline-reply-btns">
            <button @click="submitReply" :disabled="submitting" class="btn submit small">
              {{ submitting ? i18n.sending : i18n.confirmReply }}
            </button>
            <button @click="activeReply = null" class="btn cancel small">
              {{ i18n.cancelReply }}
            </button>
          </div>
        </div>

        <!-- 子回复树 -->
        <div class="sub-tree" v-if="root.children && root.children.length > 0">
          <div v-for="reply in root.children" :key="reply.id" class="reply-card">
            <div class="meta-header">
              <span class="user">{{ reply.nickname }}</span>
              <span class="prefix" v-if="reply.reply_to_name">@{{ reply.reply_to_name }}</span>
              <span class="time">{{ formatDateTime(reply.created_at) }}</span>
            </div>
            <p class="body-text">{{ reply.content }}</p>
            <span class="action-trigger" @click="openReplyForm(reply.id, root.id, reply.id, reply.nickname)">
              {{ i18n.reply }}
            </span>

            <div v-if="activeReply?.id === reply.id" class="inline-reply-form">
              <input v-model="replyForm.nickname" type="text" :placeholder="i18n.replyNicknamePlaceholder" class="input-field nick" />
              <textarea v-model="replyForm.content" :placeholder="i18n.replyContentPlaceholder" rows="2" class="input-field area"></textarea>
              <div class="inline-reply-btns">
                <button @click="submitReply" :disabled="submitting" class="btn submit small">
                  {{ submitting ? i18n.sending : i18n.confirmReply }}
                </button>
                <button @click="activeReply = null" class="btn cancel small">
                  {{ i18n.cancelReply }}
                </button>
              </div>
            </div>
          </div>
          <div v-if="root.hasMoreReplies" class="more-trigger" @click="fetchMoreReplies(root.id)">
            {{ i18n.loadMoreReplies }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-wrapper {
  margin-top: 4rem;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 2rem;
}
.title {
  font-size: 1.1rem;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-1);
  margin-bottom: 1.5rem;
  font-weight: 600;
}
.comment-trigger {
  display: inline-block;
  cursor: pointer;
  user-select: none;
  text-decoration: underline;
  text-underline-offset: 3px;
  color: var(--vp-c-brand-1);
  margin-bottom: 1.5rem;
}
.comment-trigger:hover {
  opacity: 0.75;
}
.form-container {
  margin-bottom: 2.5rem;
}
.input-field {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  padding: 0.6rem;
  font-size: 0.88rem;
  color: var(--vp-c-text-1);
  font-family: inherit;
  margin-bottom: 0.5rem;
  box-sizing: border-box;
}
.input-field:focus {
  border-color: var(--vp-c-text-2);
  outline: none;
}
.input-field.nick {
  max-width: 240px;
  display: block;
}
.action-bar {
  display: flex;
  justify-content: flex-end;
}
.btn {
  border: 1px solid var(--vp-c-text-1);
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
  padding: 0.4rem 1.2rem;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 500;
}
.btn:hover {
  opacity: 0.85;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn.cancel {
  background: transparent;
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
  margin-right: 0.5rem;
}
.btn.small {
  padding: 0.3rem 0.9rem;
  font-size: 0.8rem;
}
.root-card {
  padding: 1.2rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}
.meta-header {
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
  margin-bottom: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.meta-header .user {
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.meta-header .prefix {
  color: var(--vp-c-brand-1);
  font-weight: 500;
}
.body-text {
  font-size: 0.92rem;
  line-height: 1.6;
  margin: 0.2rem 0;
  color: var(--vp-c-text-1);
  word-break: break-word;
}
.action-trigger {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  text-decoration: underline;
  cursor: pointer;
  display: inline-block;
  margin-top: 0.2rem;
}
.action-trigger:hover {
  color: var(--vp-c-brand-1);
}
.sub-tree {
  margin-left: 1.5rem;
  border-left: 1px solid var(--vp-c-divider);
  padding-left: 1rem;
  margin-top: 0.6rem;
}
.reply-card {
  padding: 0.6rem 0;
  border-bottom: 1px dashed var(--vp-c-divider);
}
.reply-card:last-child {
  border-bottom: none;
}
.inline-reply-form {
  margin-top: 0.6rem;
  margin-bottom: 0.4rem;
  padding: 0.8rem;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft, rgba(142, 150, 170, 0.04));
}
.inline-reply-form .input-field {
  margin-bottom: 0.4rem;
}
.inline-reply-btns {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.3rem;
}
.more-trigger {
  text-align: center;
  padding: 0.6rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  cursor: pointer;
  text-decoration: underline;
}
.more-trigger:hover {
  color: var(--vp-c-brand-1);
}
</style>