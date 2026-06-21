---
layout: doc
pageClass: is-home-page
editLink: false
lastUpdated: false
isNoComment: true
isNoBackBtn: true
---

<div class="links-list">
  <div v-for="(link, index) in links" :key="link.url" class="link-container">
    <hr v-if="index !== 0" class="link-divider" />
    <div class="link-item">
      <a :href="link.url" target="_blank" rel="noopener noreferrer" class="link-avatar">
        <img :src="link.avatar" :alt="link.name" />
      </a>
      <div class="link-content">
        <h2 class="link-title">
          <a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.name }}</a>
        </h2>
        <div class="link-desc source-han-serif">
          {{ link.desc }}
        </div>
      </div>
    </div>
  </div>
</div>

<script lang="ts" setup>
import { ref } from 'vue'

// 在这里维护你的友链数据
const links = ref([
  {
    name: '艾斯特的博客',
    desc: '分享前端开发、VitePress 主题开发与折腾记录。',
    url: 'https://example.com',
    avatar: 'https://www.gravatar.com/avatar/?d=mp' // 替换为真实头像地址
  },
  {
    name: '某位大佬的站点',
    desc: '热爱生活，记录技术与日常的点滴思考。',
    url: 'https://example2.com',
    avatar: 'https://www.gravatar.com/avatar/?d=identicon'
  },
  {
    name: '另一个朋友',
    desc: '专注后端开发与架构设计，偶尔写写随笔。',
    url: 'https://example3.com',
    avatar: 'https://www.gravatar.com/avatar/?d=retro'
  }
  // 继续添加更多友链...
])
</script>

<style lang="scss" scoped>
.link-divider {
  border: none !important;
  height: 1px !important;
  background-color: var(--vp-c-divider) !important;
  opacity: 0.5 !important;
  margin: 1rem 0 !important; 
  padding: 0 !important;
  width: 100%;
}

.link-item {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 0 !important;
  padding: 0 !important;
  gap: 1rem; /* 头像和文字之间的间距 */
}

.link-avatar {
  flex-shrink: 0;
  display: block;
  
  img {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--vp-c-divider);
    transition: transform 0.3s ease;
  }
  
  &:hover img {
    transform: rotate(360deg); /* 鼠标悬浮时头像旋转一圈，增加趣味性 */
  }
}

.link-content {
  flex-grow: 1;
  min-width: 0; /* 防止 flex 项内容溢出 */
}

.link-title {
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1.7 !important;
  font-size: 1.1rem;

  > a {
    text-decoration: none !important;
    font-weight: 500 !important;
    letter-spacing: -0.01em;
    display: inline-block;
    color: var(--vp-c-brand-1);
    
    &:hover {
      color: var(--vp-c-brand-2);
    }
  }
}

.link-desc {
  margin: 0 !important;
  padding: 0 !important;

  line-height: 1.7;
  margin-top: 0.25em;   

  font-family: "Inter", system-ui, sans-serif;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  
  /* 文本超出省略号（单行） */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
