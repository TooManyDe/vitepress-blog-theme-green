---
layout: doc
editLink: false
lastUpdated: false
isNoComment: true
isNoBackBtn: true
---

<template v-for="[year, postGroup] in sortedPostGroups" :key="year">
  <h2 :id="year" class="post-title">
    <a
      class="header-anchor"
      :href="`#${year}`"
      :aria-label="`Permalink to &quot;${year}&quot;`"
      >​</a
    >
    <div class="post-year hollow-text source-han-serif">{{ year }}</div>
  </h2>
  <div class="post-container" v-for="post in postGroup" :key="post.url">
    <a :href="post.url">{{ post.title }}</a>
    <span class="post-date">
      {{ post.date.monthDay }}
    </span>
  </div> 
</template>

<hr class="section-divider" />

<template v-for="[category, postGroup] in sortedCategoryGroups" :key="category">
  <h2 :id="category" class="post-title">
    <a
      class="header-anchor"
      :href="`#${category}`"
      :aria-label="`Permalink to &quot;${category}&quot;`"
    >​</a>
    <div class="post-year hollow-text source-han-serif">{{ category }}</div>
  </h2>
  <div class="post-container" v-for="post in postGroup" :key="post.url">
    <a :href="post.url">{{ post.title }}</a>
    <span class="post-date">
      {{ post.date.string }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { data as posts } from "../.vitepress/theme/posts-en.data.mts";

// 按年份分组，并确保组内按时间倒序，年份从大到小排列
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
    const category = post.category || "Uncategorized";
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
.post-title {
  margin-top: 2rem;
  margin-bottom: 6px;
  border-top: 0px;
  position: relative;
  top: 0;
  left: 0;

  .post-year {
    position: absolute;
    top: -15px; /* 根据视觉调整位置 */
    left: -10px;
    z-index: -1;
    opacity: .16;
    font-family: "Inter";
    font-size: 40px;
    font-weight: 600;
  }
}

.post-container {
  display: flex;
  justify-content: space-between;
  margin: 12px 0;

  > a {
    font-weight: 400;
    text-decoration: none !important;
    font-family: "AI";
  }

  .post-date {
    opacity: .6;
    font-family: "Inter";
    flex-shrink: 0;
    margin-left: 1rem;
  }
}

.hollow-text {
  /* 设置文本颜色为透明 */
  color: var(--vp-c-bg);
  -webkit-text-stroke: 1px var(--vp-c-text-1);
}

.section-divider {
  border: none !important;
  height: 1px !important;
  background-color: var(--vp-c-divider) !important;
  opacity: 0.5 !important;
  margin: 2rem 0 !important;
  padding: 0 !important;
  width: 100%;
}
</style>
