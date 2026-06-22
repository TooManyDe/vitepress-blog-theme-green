---
layout: doc
editLink: false
lastUpdated: false
isNoComment: true
isNoBackBtn: true
---

<template v-for="[year, postGroup] in sortedPostGroups" :key="year">
  <h2 :id="year" class="group-title">
    <a
      class="header-anchor"
      :href="`#${year}`"
      :aria-label="`Permalink to &quot;${year}&quot;`"
      >​</a
    >
    {{ parseInt(year).toString() }}
  </h2>
  <div class="post-container" v-for="post in postGroup" :key="post.url">
    <a :href="post.url" class="post-link">{{ post.title }}</a>
    <span class="dots" aria-hidden="true"></span>
    <span class="post-date source-han-serif">
      {{ post.date.monthDay }}
    </span>
  </div>
</template>

<hr class="section-divider" />

<template v-for="[category, postGroup] in sortedCategoryGroups" :key="category">
  <h2 :id="category" class="group-title">
    <a
      class="header-anchor"
      :href="`#${category}`"
      :aria-label="`Permalink to &quot;${category}&quot;`"
    >​</a>
    {{ category }}
  </h2>
  <div class="post-container" v-for="post in postGroup" :key="post.url">
    <a :href="post.url" class="post-link">{{ post.title }}</a>
    <span class="dots" aria-hidden="true"></span>
    <span class="post-date source-han-serif">
      {{ post.date.string }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { data as posts } from "./.vitepress/theme/posts.data.mts";

// 按年份分组，并显式按年份/年内时间倒序排序
const sortedPostGroups = computed(() => {
  const groups = new Map<string, typeof posts>();

  posts.forEach((post) => {
    const year = post.date.year;
    if (!groups.has(year)) {
      groups.set(year, []);
    }
    groups.get(year)?.push(post);
  });

  const entries = Array.from(groups.entries()).map(([year, group]) => {
    group.sort((a, b) => b.date.time - a.date.time);
    return [year, group] as [string, typeof posts];
  });

  entries.sort((a, b) => Number(b[0]) - Number(a[0]));

  return entries;
});

// 按分类分组，分类按其最新文章时间倒序排列
const sortedCategoryGroups = computed(() => {
  const map = new Map<string, typeof posts>();

  posts.forEach((post) => {
    const category = post.category || "未分类";
    if (!map.has(category)) {
      map.set(category, []);
    }
    map.get(category)?.push(post);
  });

  const sortedEntries = Array.from(map.entries()).map(([category, group]) => {
    group.sort((a, b) => b.date.time - a.date.time);
    return [category, group] as [string, typeof posts];
  });

  sortedEntries.sort((a, b) => b[1][0].date.time - a[1][0].date.time);

  return sortedEntries;
});
</script>

<style lang="scss" scoped>
.group-title {
  margin-top: 2.4rem;
  margin-bottom: 0.6rem;
  border-top: 0;
  position: relative;
  font-family: "ChillRoundF";
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-2);
  opacity: 0.6;
}

.post-container {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  padding: 0.34rem 0;
  margin: 0;

  .post-link {
    flex-shrink: 0;
    max-width: 78%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 400;
    font-family: "AI";
    font-size: 1.02rem;
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
    margin: 0 0.6em;
    border-bottom: 1px dotted var(--vp-c-divider);
    transform: translateY(-0.32em);
  }

  .post-date {
    flex-shrink: 0;
    font-family: "Inter", monospace;
    font-size: 0.85rem;
    letter-spacing: 0.02em;
    color: var(--vp-c-text-2);
    opacity: 0.55;
  }
}

.section-divider {
  border: none !important;
  height: 1px !important;
  background-color: var(--vp-c-divider) !important;
  opacity: 0.5 !important;
  margin: 1.4rem 0 !important;
  padding: 0 !important;
  width: 100%;
}

/* 响应式调整 - 手机端 */
@media (max-width: 640px) {
  .group-title {
    margin-top: 2rem;
    font-size: 0.85rem;
  }

  .post-container {
    padding: 0.3rem 0;
  }

  .post-container .post-link {
    max-width: 65%;
  }

  .post-container .post-date {
    font-size: 0.8rem;
  }
}
</style>