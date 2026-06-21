---
layout: doc
pageClass: is-home-page
editLink: false
lastUpdated: false
isNoComment: false
isNoBackBtn: true
---

<div class="links-page">
  <!-- 友链列表 -->
  <div class="links-list">
    <div v-for="link in friendLinks" :key="link.url" class="link-container">
      <div class="link-item">
        <a :href="link.url" target="_blank" rel="noopener noreferrer" class="link-avatar">
          <img :src="link.avatar" :alt="link.name" />
        </a>
        <div class="link-content">
          <h3 class="link-title">
            <a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.name }}</a>
          </h3>
          <div class="link-desc source-han-serif">
            {{ link.desc }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 友链与本站之间的分割线 -->
  <hr class="link-divider" />

  <!-- 本站信息 -->
  <div class="link-container">
    <div class="link-item">
      <a :href="siteInfo.url" target="_blank" rel="noopener noreferrer" class="link-avatar">
        <img :src="siteInfo.avatar" :alt="siteInfo.name" />
      </a>
      <div class="link-content">
        <h3 class="link-title">
          <a :href="siteInfo.url" target="_blank" rel="noopener noreferrer">{{ siteInfo.name }}</a>
        </h3>
        <div class="link-desc source-han-serif">
          {{ siteInfo.desc }}
        </div>
      </div>
    </div>
  </div>
</div>

<script lang="ts" setup>
import { ref } from 'vue'

// 在这里维护你的友链数据
const friendLinks = ref([
  {
    name: 'Yunyi's Blog',
    desc: '得闲饮茶～～～',
    url: 'https://www.yunyitang.me/',
    avatar: 'https://www.yunyitang.me/img/favicon.png' 
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

// 本站信息
const siteInfo = ref({
  name: '的的不休',
  desc: '每一段旅行都有终点',
  url: 'https://ddbx.org',
  avatar: 'https://cdn.ddbx.org/02.png'
})
</script>

<style lang="scss" scoped>
.links-page {
  max-width: 800px;
  margin: 0 auto 2rem auto;
}

/* 友链列表容器 */
.links-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* 友链之间通过 gap 隔开，不再使用分割线 */
}

/* 分割线样式（用于友链和本站之间） */
.link-divider {
  border: none !important;
  height: 1px !important;
  background-color: var(--vp-c-divider) !important;
  opacity: 0.5 !important;
  margin: 1rem 0 !important; 
  padding: 0 !important;
  width: 100%;
}

/* 单个友链项样式 */
.link-container {
  margin: 0 !important;
  padding: 0 !important;
}

.link-item {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 0 !important;
  padding: 0 !important;
  gap: 1rem;
  transition: transform 0.3s ease;
}

.link-item:hover {
  transform: translateY(-2px);
}

.link-avatar {
  flex-shrink: 0;
  display: block;
  
  img {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--vp-c-divider);
    transition: all 0.3s ease;
  }
  
  &:hover img {
    transform: scale(1.1);
    border-color: var(--vp-c-brand-1);
  }
}

.link-content {
  flex-grow: 1;
  min-width: 0;
}

.link-title {
  margin: 0 0 0.25rem 0 !important;
  padding: 0 !important;
  line-height: 1.5 !important;
  font-size: 1.2rem;

  > a {
    text-decoration: none !important;
    font-weight: 600 !important;
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
  line-height: 1.6;
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .link-item {
    gap: 0.75rem;
  }
  
  .link-avatar img {
    width: 48px;
    height: 48px;
  }
}
</style>
