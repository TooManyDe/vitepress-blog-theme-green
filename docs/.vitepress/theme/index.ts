// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import type { EnhanceApp, Theme } from 'vitepress'

// 样式导入
import 'tdesign-vue-next/es/style/index.css'
import './style.css'

// 组件导入
import Comment from './components/Comment.vue'
import ImageViewer from './components/ImageViewer.vue'
import CustomLayout from './Layout.vue'
import CommentAdmin from './components/CommentAdmin.vue'

const enhanceApp: EnhanceApp = ({ app }) => {
  // 注册全局组件
  app.component('Comment', Comment)
  app.component('ImageViewer', ImageViewer)
  app.component('CommentAdmin', CommentAdmin) 
  
  // 路由切换逻辑
  if (typeof window !== 'undefined') {
    app.mixin({
      mounted() {
        // 确保组件在客户端正确挂载
      }
    })
  }
}

export default {
  ...DefaultTheme,
  Layout: CustomLayout,
  enhanceApp,
} as Theme
