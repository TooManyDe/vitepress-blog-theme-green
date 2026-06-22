---
layout: doc
pageClass: is-home-page
editLink: false
lastUpdated: false
isNoComment: false
isNoBackBtn: true
---

<div class="links-page">
  <!-- 统一的网格容器，包含友链、分割线、本站信息 -->
  <div class="links-list">
    <!-- 1. 友链列表 -->
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
    <!-- 3. 本站信息（也作为Grid的一项） -->
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
    name: "Yunyi's Blog", 
    desc: '得闲饮茶～～～',
    url: 'https://www.yunyitang.me/',
    avatar: 'https://www.yunyitang.me/img/favicon.png' 
  },
  {
    name: '橙树志 | citydatum',
    desc: '过已过，来未来，唯当下',
    url: 'https://citydatum.cn',
    avatar: 'https://citydatum.cn/favicon.ico'
  },
  {
    name: '轻风blog',
    desc: '茫茫人海，多么幸运才能遇见你！',
    url: 'https://www.qingfengnb.cn',
    avatar: 'https://img.qingfengnb.cn/LightPicture/2025/07/bec6eb9625656d60.jpg'
  },
  {
    name: '凡梦星尘空间站',
    desc: '再平凡的人也有属于他的梦想！',
    url: 'https://lisenhui.cn',
    avatar: 'https://lisenhui.github.io/imgs/avatar.png'
  },
  {
    name: '灵的梦境',
    desc: '愿美梦成真',
    url: 'https://lemonadorable.github.io/',
    avatar: 'https://lemonadorable.github.io/favicon/favicon.gif'
  },
  {
    name: "iMaeGoo’s Blog",
    desc: '虹墨空间站',
    url: 'https://www.imaegoo.com',
    avatar: 'https://cdn.jsdelivr.net/npm/imaegoo/avatar.jpg'
  }
])

// 本站信息
const siteInfo = ref({
  name: '的的不休',
  desc: '每一段旅行都有终点',
  url: 'https://ddbx.org',
  avatar: 'https://cdn.ddbx.org/12.png'
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

/* 统一的网格容器 - 包含友链、分割线、本站信息 */
.links-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 默认两列 */
  gap: 1.5rem 2rem; /* 行间距和列间距 */
}

/* 分割线样式 - 现在在Grid内，grid-column: 1 / -1 生效 */
.link-divider {
  grid-column: 1 / -1; /* 让分割线跨越所有列 */
  border: none !important;
  height: 1px !important;
  background-color: var(--vp-c-divider) !important;
  opacity: 0.5 !important;
  margin: 0 !important; 
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

/* 响应式调整 - 手机端单栏 */
@media (max-width: 640px) {
  .links-list {
    grid-template-columns: 1fr; /* 单列 */
    gap: 1.5rem; /* 仅行间距 */
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
