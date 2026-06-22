import DefaultTheme from 'vitepress/theme'
import type { EnhanceApp, Theme } from 'vitepress'

import 'tdesign-vue-next/es/style/index.css'
import './style.css'

import Comment from './components/Comment.vue'
import ImageViewer from './components/ImageViewer.vue'
import CustomLayout from './Layout.vue'

const enhanceApp: EnhanceApp = ({ app }) => {
  app.component('Comment', Comment)
  app.component('ImageViewer', ImageViewer)
  
  if (typeof window !== 'undefined') {
    app.mixin({
      mounted() {
      }
    })
  }
}

export default {
  ...DefaultTheme,
  Layout: CustomLayout,
  enhanceApp,
} as Theme
