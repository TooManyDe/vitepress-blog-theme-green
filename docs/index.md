---
layout: doc
pageClass: is-home-page
editLink: false
lastUpdated: false
---

<div class="posts-list">
  <div v-for="(post, index) in posts" :key="post.url" class="post-container">
    <div class="post-item">
      <h2 :id="post.title" class="post-title">
        <a :href="post.url">{{ post.title }}</a>
      </h2>
      <div class="post-date">{{ post.date.string }}</div>
      <div
        v-if="post.excerpt"
        v-html="post.excerpt"
        class="post-excerpt"
      ></div>
    </div>
    
    <!-- 只在最后一条后不加分割线，其余用优雅细线 -->
    <hr v-if="index !== posts.length - 1" class="post-divider" />
  </div>
</div>

<script lang="ts" setup>
import { data as posts } from "./.vitepress/theme/posts.data.mts";
</script>

<style lang="scss" scoped>
.posts-list {
  max-width: 680px;
  margin: 0 auto;
  padding: 4rem 1.5rem 6rem;
}

.post-container {
  &:first-child {
    padding-top: 1rem;
  }
}

.post-item {
  padding: 2.8rem 0 2.2rem;
}

.post-title {
  margin: 0 0 0.6rem 0;
  font-size: 1.75rem;
  line-height: 1.35;
  font-weight: 600;
  letter-spacing: -0.025em;

  > a {
    text-decoration: none;
    color: var(--vp-c-text-1);
    transition: color 0.3s ease;

    &:hover {
      color: var(--vp-c-text-1);
      opacity: 0.85;
    }
  }
}

.post-date {
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--vp-c-text-3);
  letter-spacing: -0.01em;
  margin-bottom: 1.4rem;
}

.post-excerpt {
  margin-top: 0.4rem;

  :deep(p) {
    margin: 0;
    line-height: 1.75;
    color: var(--vp-c-text-2);
    font-size: 1.02rem;
  }

  :deep(p + p) {
    margin-top: 1.1em;
  }
}

.post-divider {
  border: none;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    var(--vp-c-divider),
    transparent
  );
  margin: 0;
  opacity: 0.6;
}

/* 响应式优化 */
@media (max-width: 640px) {
  .posts-list {
    padding: 2.5rem 1.25rem 4rem;
  }
  
  .post-item {
    padding: 2.2rem 0 1.8rem;
  }
  
  .post-title {
    font-size: 1.55rem;
  }
}

/* 可选：增加极轻微的悬停提升感 */
.post-item:hover {
  .post-title > a {
    color: var(--vp-c-text-1);
  }
}
</style>
