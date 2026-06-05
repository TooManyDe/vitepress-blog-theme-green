---
layout: doc
editLink: false
lastUpdated: false
isNoBackBtn: true
---

<template v-for="[year, postGroup] in postGroups" :key="year">
  <h2 :id="year" class="post-title">
    <a
      class="header-anchor"
      :href="`#${year}`"
      :aria-label="`Permalink to &quot;${year}&quot;`"
      >​</a
    >
    <div class="post-year hollow-text source-han-serif">{{ parseInt(year).toString() }}</div>
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
import { ref, computed } from "vue";
import {
	MessagePlugin,
	PaginationProps,
	Pagination as TPagination,
} from "tdesign-vue-next";
import { TimeIcon } from "tdesign-icons-vue-next";

import { data as posts } from "./.vitepress/theme/posts.data.mts";
import { isMobile } from "./.vitepress/theme/utils/mobile.ts";

const postGroups = computed(() => {
  const groups = new Map<string, typeof posts>();
  posts.forEach((post) => {
    const year = post.date.year;
    if (!groups.has(year)) {
      groups.set(year, []);
    }
    groups.get(year)?.push(post);
  });
  return groups;
});

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
    return [category, group];
  });

  sortedEntries.sort((a, b) => b[1][0].date.time - a[1][0].date.time);

  return sortedEntries as [string, typeof posts][];
});
</script>

<style lang="scss" scoped>
.mr-2 {
	margin-right: 2px;
}

.post-title {
  margin-top: 2px;
  margin-bottom: 6px;
  border-top: 0px;
  position: relative;
  top: 0;
  left: 0;
  font-family: "ChillRoundF";

  .post-year {
    position: absolute;
    top: 25px;
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
    font-family: "AI";
    text-decoration: none !important;
    color: var(--vp-c-green) !important;
  }

  .post-date {
    opacity: .6;
    font-family: "Inter";
  }
}

.hollow-text {
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


