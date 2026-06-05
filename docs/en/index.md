---
layout: doc
pageClass: is-home-page
editLink: false
lastUpdated: false
isNoComment: true
isNoBackBtn: true
---

<!-- 完全采用第一个文件的结构 -->
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

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vitepress";
// 引入第二个文件指定的数据源（删除了 TDesign 相关的组件组件和移动端判定工具）
import { data as posts } from "../.vitepress/theme/posts-en.data.mts";

const route = useRoute();

const getPage = () => {
  const search = route.query
  const searchParams = new URLSearchParams(search);
  return Number(searchParams.get("page") || "1");
}

const current = ref(getPage())
const pageSize = ref(10); // 每页显示数量

// 动态路由监听：当从 NAV 导航切换回首页且带 page 参数时，同步更新
const router = useRouter();
router.onAfterRouteChange = (to) => {
  current.value = getPage();
}

// 核心：动态截取当前页要展示的博文
const curPosts = computed(() => {
	return posts.slice(
		(current.value - 1) * pageSize.value,
		current.value * pageSize.value
	);
});
</script>

<style lang="scss" scoped>
/* =========================
   🍎 完全保留第一个文件的全部样式
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


