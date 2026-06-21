---
layout: doc
pageClass: is-home-page
editLink: false
lastUpdated: false
isNoComment: false
isNoBackBtn: true
---

<div class="links-page">
  <!-- 申请说明区域 -->
  <div class="apply-section">
    <div class="site-info">
      <img src="https://cdn.ddbx.org/02.png" alt="网站头像" class="site-avatar" />
      <div class="site-details">
        <h1 class="site-name">的的不休</h1>
        <p class="site-desc">每一段旅行都有终点</p></div>
    </div> 
    <div class="apply-rules">
      <h2>友链申请说明</h2>
      <div class="rules-content">
        <div class="rule-item">
          <div class="rule-icon">✓</div>
          <div class="rule-text">建站半年以上，定期更新内容</div>
        </div>
        <div class="rule-item">
          <div class="rule-icon">✓</div>
          <div class="rule-text">原创内容为主，拒绝采集站</div>
        </div>
        <div class="rule-item">
          <div class="rule-icon">✓</div>
          <div class="rule-text">网站内容健康，无违法信息</div>
        </div>
        <div class="rule-item">
          <div class="rule-icon">✓</div>
          <div class="rule-text">先添加本站链接，再申请友链</div>
        </div>
      </div>
      <div class="apply-info">
        <p>本站信息：</p>
        <div class="info-item">
          <span class="info-label">名称：</span>
          <span class="info-value">的的不休</span>
        </div>
        <div class="info-item">
          <span class="info-label">网址：</span>
          <span class="info-value">https://ddbx.org</span>
        </div>
        <div class="info-item">
          <span class="info-label">描述：</span>
          <span class="info-value">每一段旅行都有终点</span>
        </div>
        <div class="info-item">
          <span class="info-label">头像：</span>
          <span class="info-value">https://cdn.ddbx.org/02.png</span>
        </div>
      </div>
      
      <div class="apply-contact">
        <p>申请方式：</p>
        <p>请先添加本站链接，然后在本页面评论区留言。</p>
      </div>
    </div>
  </div>

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

/* 申请说明区域样式 */
.apply-section {
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 3rem;
  border: 1px solid var(--vp-c-divider);
}

.site-info {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.site-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 1.5rem;
  border: 2px solid var(--vp-c-brand-1);
}

.site-details {
  flex: 1;
}

.site-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.site-desc {
  margin: 0;
  font-size: 1rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.apply-rules {
  margin-top: 1.5rem;
}

.apply-rules h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.rules-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.rule-item {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  background-color: var(--vp-c-bg);
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
}

.rule-icon {
  color: var(--vp-c-brand-1);
  font-weight: bold;
  margin-right: 0.75rem;
  font-size: 1.2rem;
}

.rule-text {
  flex: 1;
  color: var(--vp-c-text-1);
  line-height: 1.6;
}

.apply-info {
  background-color: var(--vp-c-bg);
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  margin-bottom: 1.5rem;
}

.apply-info p {
  margin: 0 0 1rem 0;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.info-item {
  display: flex;
  margin-bottom: 0.5rem;
}

.info-label {
  min-width: 80px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.info-value {
  flex: 1;
  color: var(--vp-c-text-1);
  word-break: break-all;
}

.apply-contact {
  background-color: var(--vp-c-bg);
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
}

.apply-contact p {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-text-1);
  line-height: 1.6;
}

.apply-contact p:first-child {
  font-weight: 600;
  margin-bottom: 1rem;
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
  gap: 1rem; /* 头像和文字之间的间距 */
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
  min-width: 0; /* 防止 flex 项内容溢出 */
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
  
  /* 文本超出省略号（单行） */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .apply-section {
    padding: 1.5rem;
  }
  
  .site-info {
    flex-direction: column;
    text-align: center;
  }
  
  .site-avatar {
    margin-right: 0;
    margin-bottom: 1rem;
  }
  
  .rules-content {
    grid-template-columns: 1fr;
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
