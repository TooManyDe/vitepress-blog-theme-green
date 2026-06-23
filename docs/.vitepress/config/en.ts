import { type DefaultTheme, defineConfig } from 'vitepress'

const RSS_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><title>RSS</title><path d="M108.56,342.78a60.34,60.34,0,1,0,60.56,60.44A60.63,60.63,0,0,0,108.56,342.78Z"/><path d="M48,186.67v86.55c52,0,101.94,15.39,138.67,52.11s52,86.56,52,138.67h86.66C325.33,312.44,199.67,186.67,48,186.67Z"/><path d="M48,48v86.56c185.25,0,329.22,144.08,329.22,329.44H464C464,234.66,277.67,48,48,48Z"/></svg>'

const navConfig: DefaultTheme.NavItem[] = [
  { text: "Archive", link: "/en/archive", activeMatch: '/en/archive' },
  { text: "Friends", link: "/en/friends", activeMatch: '/en/friends' },
]

const socialLinksConfig: DefaultTheme.SocialLink[] = [
  {
    icon: { svg: RSS_ICON_SVG },
    link: "/feed-en.xml",
  },
]

export const search: DefaultTheme.AlgoliaSearchOptions['locales'] = {
  root: {
    placeholder: 'Search',
    translations: {
      button: {
        buttonText: 'Search',
        buttonAriaLabel: 'Search'
      },
      modal: {
        searchBox: {
          resetButtonTitle: 'Clear the query',
          resetButtonAriaLabel: 'Clear the query',
          cancelButtonText: 'Cancel',
          cancelButtonAriaLabel: 'Cancel'
        },
        startScreen: {
          recentSearchesTitle: 'Search History',
          noRecentSearchesText: 'No recent searches',
          saveRecentSearchButtonTitle: 'Save to search history',
          removeRecentSearchButtonTitle: 'Remove from search history',
          favoriteSearchesTitle: 'Favorites',
          removeFavoriteSearchButtonTitle: 'Remove from favorites'
        },
        errorScreen: {
          titleText: 'Unable to fetch results',
          helpText: 'Network error'
        },
        footer: {
          selectText: 'Select',
          navigateText: 'Navigate',
          closeText: 'Close',
          searchByText: 'Search by'
        },
        noResultsScreen: {
          noResultsText: 'No results found',
          suggestedQueryText: 'Try searching for',
          reportMissingResultsText: 'Believe this query should return results?',
          reportMissingResultsLinkText: 'Let us know'
        }
      }
    }
  }
}

const themeConfig: DefaultTheme.Config = {
  nav: navConfig,
  
footer: {
  message: '© 2026 <a href="https://ddbx.org" target="_blank" rel="noopener noreferrer">的的不休</a> Powered by <a href="https://vitepress.dev" target="_blank" rel="noopener noreferrer">VitePress</a>',
},

  
  docFooter: {
    prev: 'Previous',
    next: 'Next'
  },
  
  outlineTitle: "On this page",
  lastUpdatedText: "Last updated",
  returnToTopLabel: "Return to top",
  sidebarMenuLabel: "Menu",
  darkModeSwitchLabel: "Dark mode",
  
  socialLinks: socialLinksConfig,
}

export default defineConfig({
  title: "的的不休",
  description: "Every trip has an end",
  lang: "en-US",
  
  titleTemplate: ':title - Every trip has an end',
  themeConfig,
  
  head: [
    ['meta', { name: 'author', content: 'ddbx' }],
    ['meta', { name: 'keywords', content: 'ddbx, blog, sharing' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/20.png' }],
    ['link', { rel: 'alternate', type: 'application/rss+xml', title: 'ddbx RSS', href: '/feed-en.xml' }],
  ],
  
  cleanUrls: true,
  lastUpdated: false,
  
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
    }
  }
})
