<template>
  <div class="comments" v-if="!frontmatter.isNoComment">
    <span
      class="comment-toggle"
      @click="toggleComments"
      style="color: var(--vp-c-brand-1); font-family: ChillRoundF; font-weight: 500;"
    >
      {{ loadComments ? commentText : commentText }}
    </span>

    <Giscus
      v-if="loadComments && showComment"
      :key="`${term}-${lang}-${isDark}`"
      repo="TooManyDe/vitepress-blog-theme-green"
      repo-id="R_kgDOTCL9qA"
      category="General"
      category-id="DIC_kwDOTCL9qM4C_sF6"
      mapping="specific"
      :term="term"
      strict="1"
      reactions-enabled="1"
      emit-metadata="0"
      input-position="bottom"
      :theme="isDark ? 'dark' : 'light'"
      :lang="lang"
      loading="lazy"
      crossorigin="anonymous"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, computed } from "vue";
import { useData, useRoute } from "vitepress";
import Giscus from "@giscus/vue";

const route = useRoute();
const { isDark, frontmatter } = useData();

const term = computed(() =>
  route.path.startsWith("/en") ? route.path.slice(3) : route.path
);
const lang = computed(() =>
  route.path.startsWith("/en") ? "en" : "zh-Hans"
);

const commentText = computed(() =>
  lang.value === "en" ? "Comments" : "评论"
);

const loadComments = ref(false);
const showComment = ref(true);

const toggleComments = () => {
  if (loadComments.value) {
    showComment.value = false;
    loadComments.value = false;
  } else {
    loadComments.value = true;
    nextTick(() => {
      showComment.value = true;
    });
  }
};

watch(
  () => [route.path, lang.value, isDark.value],
  () => {
    if (loadComments.value) {
      showComment.value = false;
      nextTick(() => {
        showComment.value = true;
      });
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.comments {
  margin-top: 0px;
  margin-bottom: 20px;
}

.comment-toggle {
  display: inline-block;
  margin-bottom: 0px;
  cursor: pointer;
  font-size: 18px;
  text-decoration: none;
  user-select: none;

  &:hover {
    opacity: 0.8;
  }
}
</style>