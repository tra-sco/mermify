import { defineConfig } from 'vitepress'

const isProd = process.env.GITHUB_ACTIONS === 'true'
const editorLink = isProd ? 'https://tra-sco.github.io/mermify/' : 'http://localhost:8002/'
const base = isProd ? '/mermify/docs/' : '/docs/'

export default defineConfig({
  lang: 'en-US',
  title: 'Mermify Documentation',
  description: 'Premium documentation for the Mermify visual Mermaid editor.',
  base,
  head: [
    ['link', { rel: 'icon', href: `${base}favicon.svg` }]
  ],
  themeConfig: {
    logo: '/favicon.svg',
    siteTitle: 'mermify',
    nav: [
      { text: 'Editor', link: editorLink },
      { text: 'Guide', link: '/guide/installation' },
      { text: 'Usage', link: '/guide/usage' }
    ],
    sidebar: {
      '/guide/': [
        { text: 'Installation', link: '/guide/installation' },
        { text: 'Usage', link: '/guide/usage' }
      ]
    },
    editLink: {
      pattern: 'https://github.com/tra-sco/mermify/edit/main/docs/:path',
      text: 'Suggest changes on GitHub'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/tra-sco/mermify' }
    ]
  }
})
