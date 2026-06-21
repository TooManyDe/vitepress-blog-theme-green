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
    <h2 class="links-title">友情链接</h2>
    <div v-for="(link, index) in links" :key="link.url" class="link-container">
      <hr v-if="index !== 0" class="link-divider" />
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

  <!-- 本站信息 -->
  <div class="site-info-section">
    <h2 class="site-info-title">本站信息</h2>
    <div class="site-info-container">
      <img src="https://cdn.ddbx.org/02.png" alt="网站头像" class="site-avatar" />
      <div class="site-details">
        <h3 class="site-name">的的不休</h3>
        <p class="site-desc">每一段旅行都有终点</p>
        <div class="site-links">
          <a href="https://ddbx.org" target="_blank" rel="noopener noreferrer" class="site-link">
            <span class="link-icon">🔗</span>
            <span class="link-text">https://ddbx.org</span>
          </a>
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
.links-page {
  max-width: 800px;
  margin: 0 auto;
}

/* 友链列表样式 */
.links-title {
  margin: 0 0 2rem 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--vp-c-brand-1);
}

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

/* 本站信息样式 */
.site-info-section {
  margin-top: 3rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 2rem;
  border: 1px solid var(--vp-c-divider);
}

.site-info-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-align: center;
}

.site-info-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.site-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--vp-c-brand-1);
}

.site-details {
  flex: 1;
  max-width: 400px;
}

.site-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.site-desc {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.site-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.site-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
  
  &:hover {
    color: var(--vp-c-brand-2);
  }
}

.link-icon {
  font-size: 1rem;
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
  
  .site-info-container {
    flex-direction: column;
    text-align: center;
  }
  
  .site-avatar {
    margin-bottom: 1rem;
  }
  
  .site-details {
    max-width: 100%;
  }
}
</style>
