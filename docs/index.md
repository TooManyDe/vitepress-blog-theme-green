---
layout: doc
pageClass: is-home-page
editLink: false
lastUpdated: false
isNoComment: true
isNoBackBtn: true
---

<div class="posts-list">
  <div v-for="(post, index) in posts" :key="post.url" class="post-container">
    <hr v-if="index !== 0" class="post-divider" />
    <div class="post-item">
      <h2 :id="post.title" class="post-title">
        <a :href="post.url">{{ post.title }}</a>
      </h2>
      <div class="post-date source-han-serif">
        {{ post.date.string }}
      </div>
      <div
        v-if="post.excerpt"
        v-html="post.excerpt"
        class="post-excerpt"
      ></div>
    </div>
    <hr
      v-if="index === posts.length - 1"
      class="post-divider post-divider-last"
    />
  </div>
</div>

<script lang="ts" setup>
import { data as posts } from "./.vitepress/theme/posts.data.mts";
</script>

<style lang="scss" scoped>

/* =========================
   🍎 Apple Typography System
   ========================= */

.post-divider {
  border: none !important;
  height: 1px !important;
  background-color: var(--vp-c-divider) !important;
  opacity: 0.5 !important;
  margin: 1rem 0 !important;
  padding: 0 !important;
  width: 100%;
}

.post-divider-last {
  margin-bottom: 0 !important;
}

/* =========================
   Layout
   ========================= */

.post-item {
  display: block;
  width: 100%;
  margin: 0 !important;
  padding: 0 !important;
}

/* =========================
   Typography rhythm (Apple-like)
   ========================= */

.post-title {
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1.7 !important;

  > a {
    text-decoration: none !important;
    font-weight: 500 !important;
    letter-spacing: -0.01em;
    display: inline-block;
    color: #1A6840 !important;
  }
}

/* 日期（关键：不再用 12px margin） */
.post-date {
  display: block;
  margin: 0 !important;
  padding: 0 !important;

  line-height: 1.7;
  margin-top: 0.25em;   /* Apple 微间距 */

  font-family: "Inter", system-ui, sans-serif;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

/* =========================
   Excerpt
   ========================= */

.post-excerpt {
  margin-top: 0.3em;

  :deep(p) {
    margin: 0 !important;
    line-height: 1.7;
    color: var(--vp-c-text-1);
  }

  :deep(p + p) {
    margin-top: 1em !important;
  }
}

/* =========================
   Optional style
   ========================= */

.hollow-text {
  color: var(--vp-c-bg);
  -webkit-text-stroke: 1px var(--vp-c-text-1);
}

</style>
