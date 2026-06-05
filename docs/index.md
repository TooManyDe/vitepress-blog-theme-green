---
layout: doc
pageClass: is-home-page
editLink: false
lastUpdated: false
isNoComment: true
isNoBackBtn: true
---

<div class="posts-list">
  <!-- 注意：这里将循环源从 posts 改为了分页切片后的 curPosts -->
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

<!-- 新增：分页组件层（使用 zhConfig 配置为中文环境） -->
<div class="pagination-container">
  <t-config-provider :global-config="zhConfig">
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
// 引入中文语言包
import zhConfig from 'tdesign-vue-next/es/locale/zh_CN';

// 保持原本的数据源路径
import { data as posts } from "./.vitepress/theme/posts.data.mts";
// 引入移动端检测（若你的 utils 下没有这个文件，可手动补充或替换检测方法）
import { isMobile } from "./.vitepress/theme/utils/mobile.ts";

const route = useRoute();

// 从当前 URL 获取页码参数
const getPage = () => {
  const search = route.query
  const searchParams = new URLSearchParams(search);
  return Number(searchParams.get("page") || "1");
}

const current = ref(getPage())
const pageSize = ref(10); // 每页分 10 篇
const total = ref(posts.length);

// 监听路由更新（应对导航栏切换或清空参数时内容不同步的问题）
const router = useRouter();
router.onAfterRouteChange = (to) => {
  current.value = getPage();
}

// 动态截取当前页展示的数据
const curPosts = computed(() => {
  return posts.slice(
    (current.value - 1) * pageSize.value,
    current.value * pageSize.value
  );
});

// 切页回调：修改 URL 参数并平滑滚动回顶部
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
   🍎 Apple Typography System (完全保留并沿用你的配置)
   ========================= */

.post-divider {
  border: none !important;
  height: 1px !important;
  background-color: var(--vp-c-divider) !important;
  opacity: 0.5 !important;
  margin: 1rem 0 !important; /* 保持你修改后的 1rem */
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
    color: var(--vp-c-green) !important; /* 保持你配置的绿色 */
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
   📦 追加：分页组件布局微调
   ========================= */
.pagination-container {
  margin-top: 4rem; /* 留出合适的优雅留白 */

  :deep(li) {
    margin-top: 0px; /* 防止 VitePress 基础样式污染 TDesign 的分页按钮间距 */
  }
}
</style>

