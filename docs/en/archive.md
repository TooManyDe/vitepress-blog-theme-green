---
layout: doc
editLink: false
lastUpdated: false
isNoComment: true
isNoBackBtn: true
---

<!-- 之所以将代码写在 md 里面，而非单独封装为 Vue 组件，因为 aside 不会动态刷新，参考 https://github.com/vuejs/vitepress/issues/2686 -->
<template>
  <!-- 按年份分组 -->
  <template v-for="[year, postGroup] in sortedPostGroups" :key="year">
    <h2 :id="year" class="group-title">
      <a
        class="header-anchor"
        :href="`#${year}`"
        :aria-label="`Permalink to &quot;${year}&quot;`"
        >​</a
      >
      {{ year }}
    </h2>
    <div class="post-container" v-for="post in postGroup" :key="post.url">
      <a :href="post.url" class="post-link">{{ post.title }}</a>
      <span class="dots" aria-hidden="true"></span>
      <span class="post-date">{{ post.date.monthDay }}</span>
    </div>
  </template>

  <hr class="section-divider" />

  <!-- 按分类分组 -->
  <template v-for="[category, postGroup] in sortedCategoryGroups" :key="category">
    <h2 :id="category" class="group-title">
      <a
        class="header-anchor"
        :href="`#${category}`"
        :aria-label="`Permalink to &quot;${category}&quot;`"
        >​</a
      >
      {{ category }}
    </h2>
    <div class="post-container" v-for="post in postGroup" :key="post.url">
      <a :href="post.url" class="post-link">{{ post.title }}</a>
      <span class="dots" aria-hidden="true"></span>
      <span class="post-date">{{ post.date.string }}</span>
    </div>
  </template>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { data as posts } from "../.vitepress/theme/posts-en.data.mts";

// 定义文章类型
interface Post {
  url: string;
  title: string;
  date: {
    time: number;
    year: string;
    monthDay: string;
    string: string;
  };
  category?: string;
}

// 按年份分组，并显式按年份/年内时间倒序排序
const sortedPostGroups = computed(() => {
  const groups = new Map<string, Post[]>();

  posts.forEach((post: Post) => {
    const year = post.date.year;
    if (!groups.has(year)) {
      groups.set(year, []);
    }
    groups.get(year)?.push(post);
  });

  const entries = Array.from(groups.entries()).map(([year, group]) => {
    group.sort((a, b) => b.date.time - a.date.time);
    return [year, group] as [string, Post[]];
  });

  entries.sort((a, b) => Number(b[0]) - Number(a[0]));

  return entries;
});

// 按分类分组，分类按其最新文章时间倒序排列
const sortedCategoryGroups = computed(() => {
  const map = new Map<string, Post[]>();

  posts.forEach((post: Post) => {
    const category = post.category || "Uncategorized";
    if (!map.has(category)) {
      map.set(category, []);
    }
    map.get(category)?.push(post);
  });

  const sortedEntries = Array.from(map.entries()).map(([category, group]) => {
    group.sort((a, b) => b.date.time - a.date.time);
    return [category, group] as [string, Post[]];
  });

  sortedEntries.sort((a, b) => b[1][0].date.time - a[1][0].date.time);

  return sortedEntries;
});
</script>

<style lang="scss" scoped>
/* 标题样式 */
.group-title {
  margin-top: 2.2rem;
  margin-bottom: 0.6rem;
  border-top: 0;
  font-family: "Inter", -apple-system, sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
  opacity: 0.6;

  &:first-child {
    margin-top: 0.6rem;
  }
}

/* 文章容器 */
.post-container {
  display: flex;
  align-items: baseline;
  padding: 0.45rem 0;
  margin: 0;
  line-height: 1.5;

  .post-link {
    flex-shrink: 0;
    max-width: 76%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 400;
    font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
    font-size: 1.04rem;
    text-decoration: none !important;
    color: var(--vp-c-text-1);
    transition: color 0.25s ease;
  }

  &:hover .post-link {
    color: var(--vp-c-brand-1);
  }

  .dots {
    flex: 1 1 auto;
    min-width: 0.8rem;
    height: 1px;
    align-self: center;
    margin: 0 0.7em;
    background-image: linear-gradient(
      to right,
      var(--vp-c-text-2) 0%,
      var(--vp-c-text-2) 30%,
      transparent 30%
    );
    background-size: 5px 1px;
    background-repeat: repeat-x;
    opacity: 0.4;
  }

  .post-date {
    flex-shrink: 0;
    font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
    font-size: 0.92rem;
    font-variant-numeric: oldstyle-nums;
    letter-spacing: 0.01em;
    color: var(--vp-c-text-2);
    opacity: 0.65;
  }
}

/* 分割线 */
.section-divider {
  border: none !important;
  height: 1px !important;
  background-color: var(--vp-c-divider) !important;
  opacity: 0.5 !important;
  margin: 2rem 0 !important;
  padding: 0 !important;
  width: 100%;
}

/* 响应式调整 - 手机端 */
@media (max-width: 640px) {
  .group-title {
    margin-top: 1.8rem;
    font-size: 0.72rem;
    letter-spacing: 0.1em;
  }

  .post-container {
    padding: 0.4rem 0;
  }

  .post-container .post-link {
    max-width: 62%;
    font-size: 1rem;
  }


  .post-container .post-date {
    font-size: 0.85rem;
  }
}
</style>