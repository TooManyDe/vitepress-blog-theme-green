---
layout: doc
pageClass: is-home-page
editLink: false
lastUpdated: false
isNoComment: false
isNoBackBtn: true
---

<div class="links-page">
  <div class="links-list">
    <div v-for="link in friendLinks" :key="`${link.name}-${link.url}`" class="link-container">
      <div class="link-item">
        <a :href="link.url" target="_blank" rel="noopener noreferrer" class="link-avatar">
          <img :src="link.avatar" :alt="link.name" @error="handleAvatarError" />
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
    <hr class="link-divider" />
    <div class="link-container">
      <div class="link-item">
        <a :href="siteInfo.url" target="_blank" rel="noopener noreferrer" class="link-avatar">
          <img :src="siteInfo.avatar" :alt="siteInfo.name" @error="handleAvatarError" />
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
</div>

<script lang="ts" setup>
import { ref } from 'vue'

// 在这里维护你的友链数据
const friendLinks = ref([
  {
    name: '的的不休',
    desc: '每一段旅行都有终点',
    url: 'https://ddbx.org',
    avatar: 'https://vitepress-blog-theme-green.pages.dev/bg.jpg'
  },
  {
    name: '的的不休',
    desc: '每一段旅行都有终点',
    url: 'https://ddbx.org',
    avatar: 'https://vitepress-blog-theme-green.pages.dev/bg.jpg'
  },
  {
    name: '的的不休',
    desc: '每一段旅行都有终点',
    url: 'https://ddbx.org',
    avatar: 'https://vitepress-blog-theme-green.pages.dev/bg.jpg'
  }
])

// 本站信息
const siteInfo = ref({
  name: '的的不休',
  desc: '每一段旅行都有终点',
  url: 'https://ddbx.org',
  avatar: 'https://vitepress-blog-theme-green.pages.dev/bg.jpg'
})

// 处理图片加载失败
const handleAvatarError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = 'https://via.placeholder.com/56/cccccc/666666?text=Avatar'
}

</script>

<style lang="scss" scoped>
.links-page {
  max-width: 800px;
  margin: 0 auto 3rem auto;
}

.links-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr); 
  gap: 1.5rem 2rem; 
}


.link-divider {
  grid-column: 1 / -1; 
  border: none !important;
  height: 1px !important;
  background-color: var(--vp-c-divider) !important;
  opacity: 0.5 !important;
  margin: 0 !important; 
  padding: 0 !important;
  width: 100%;
}


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


@media (max-width: 640px) {
  .links-list {
    grid-template-columns: 1fr; 
    gap: 1.5rem; 
  }
  
  .link-item {
    gap: 0.75rem;
  }
  
  .link-avatar img {
    width: 48px;
    height: 48px;
  }
}
</style>
