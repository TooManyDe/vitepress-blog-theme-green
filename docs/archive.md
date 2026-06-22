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
    <span class="group-rule"></span>
    <span class="group-label">{{ parseInt(year).toString() }}</span>
    <span class="group-rule"></span>
  </h2>
  <div class="post-container" v-for="post in postGroup" :key="post.url">
    <a :href="post.url" class="post-link">{{ post.title }}</a>
    <span class="dots" aria-hidden="true"></span>
    <span class="post-date">
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
    <span class="group-rule"></span>
    <span class="group-label">{{ category }}</span>
    <span class="group-rule"></span>
  </h2>
  <div class="post-container" v-for="post in postGroup" :key="post.url">
    <a :href="post.url" class="post-link">{{ post.title }}</a>
    <span class="dots" aria-hidden="true"></span>
    <span class="post-date">
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.9em;
  margin-top: 3.2rem;
  margin-bottom: 1.1rem;
  border-top: 0;

  &:first-child {
    margin-top: 1rem;
  }

  .group-rule {
    flex: 1 1 56px;
    max-width: 72px;
    height: 1px;
    background-color: var(--vp-c-text-2);
    opacity: 0.35;
  }

  .group-label {
    flex-shrink: 0;
    font-family: "ChillRoundF";
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--vp-c-text-2);
    opacity: 0.7;
  }
}

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
    font-family: "AI";
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
    font-family: "AI";
    font-size: 0.92rem;
    font-variant-numeric: oldstyle-nums;
    letter-spacing: 0.01em;
    color: var(--vp-c-text-2);
    opacity: 0.65;
  }
}

.section-divider {
  border: none !important;
  height: 1px !important;
  background-color: var(--vp-c-divider) !important;
  opacity: 0.5 !important;
  margin: 2.2rem 0 !important;
  padding: 0 !important;
  width: 100%;
}

/* 响应式调整 - 手机端 */
@media (max-width: 640px) {
  .group-title {
    margin-top: 2.4rem;
    gap: 0.6em;

    .group-rule {
      flex: 1 1 32px;
      max-width: 40px;
    }

    .group-label {
      font-size: 0.75rem;
      letter-spacing: 0.16em;
    }
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