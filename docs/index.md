---
layout: doc
pageClass: is-home-page
editLink: false
lastUpdated: false
isNoComment: true
isNoBackBtn: true
---

<!-- 1. 列表层：完全保持第一个文件的 Apple 风格结构 -->
<div class="posts-list">
  <div v-for="(post, index) in curPosts" :key="post.url" class="post-container">
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
      v-if="index === curPosts.length - 1"
      class="post-divider post-divider-last"
    />
  </div>
</div>

<!-- 2. 分页层：追加 TDesign 分页组件 -->
<div class="pagination-container">
  <t-config-provider :global-config="enConfig">
    <t-pagination
      v-model="current"
      v-model:pageSize="pageSize"
      :total="total"
      size="small"
      :showPageSize="false"
      :showPageNumber="!isMobile()"
      :showJumper="isMobile()"
      @current-change="onCurrentChange"
    />
  </t-config-provider>
</div>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vitepress";
// 引入 TDesign 依赖
import {
	Pagination as TPagination,
  ConfigProvider as TConfigProvider,
  type PaginationProps
} from "tdesign-vue-next";
import enConfig from 'tdesign-vue-next/es/locale/en_US';

// 数据源指向第一个文件原本的 posts
import { data as posts } from "./.vitepress/theme/posts.data.mts";
// 引入移动端检测逻辑（配合分页组件显隐规律）
import { isMobile } from "./.vitepress/theme/utils/mobile.ts";

const route = useRoute();

// 从当前 URL 参数中获取页码，默认为第 1 页
const getPage = () => {
  const search = route.query
  const searchParams = new URLSearchParams(search);
  return Number(searchParams.get("page") || "1");
}

const current = ref(getPage())
const pageSize = ref(10); // 严格限制：每页分 10 篇
const total = ref(posts.length);

// 路由改变时（例如从导航栏重新点进首页），同步校准页码状态
const router = useRouter();
router.onAfterRouteChange = (to) => {
  current.value = getPage();
}

// 核心：将原本的一股脑循环 posts 改为通过 computed 切片出来的 curPosts
const curPosts = computed(() => {
	return posts.slice(
		(current.value - 1) * pageSize.value,
		current.value * pageSize.value
	);
});

// 页码改变时的回调：无刷新修改浏览器 URL，并平滑置顶
const onCurrentChange: PaginationProps["onCurrentChange"] = (index, pageInfo) => {
	const url = new URL(window.location as any);
	url.searchParams.set("page", index.toString());
	window.history.replaceState({}, "", url);

	window.scrollTo({
		top: 0,
	});
};
</script>

<style lang="scss" scoped>

/* =========================
   🍎 Apple Typography System (原封不动)
   ========================= */

.post-divider {
  border: none !important;
  height: 1px !important;
  background-color: var(--vp-c-divider) !important;
  opacity: 0.5 !important;
  margin: 2rem 0 !important;
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
  }
}

/* 日期 */
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

/* =========================
   📦 追加：分页组件专用基础样式
   ========================= */
.pagination-container {
	margin-top: 60px; /* 让分页器和最底下一篇博文拉开恰当的距离 */

	:deep(li) {
		margin-top: 0px; /* 防止 VitePress 样式干扰 TDesign 内部的 li 标签间距 */
	}
}
</style>
