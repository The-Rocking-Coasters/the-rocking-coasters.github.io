import { resolve } from 'path'
import { processMedia } from './scripts/media'

// noinspection JSUnusedGlobalSymbols
export default defineNuxtConfig({
  ssr: true,
  nitro: {
    prerender: {
      autoSubfolderIndex: true
    }
  },
  $production: {
    studio: false
  },
  future: {
    compatibilityVersion: 4,
  },
  experimental: {
    // @ts-ignore - inlineStyles is valid in Nuxt 4 but may not be typed in the current version
    inlineStyles: true,
  },
  modules: ['@nuxt/content', 'nuxt-studio', '@nuxtjs/i18n', "@nuxtjs/seo"],
  hooks: {
    'build:before': (): void => {
      processMedia(resolve(__dirname, '..'))
    }
  },
  site: {
    url: 'https://therockingcoasters.nl',
    name: 'The Rocking Coasters',
    description: '50s & 60s Rock n Roll Band',
    defaultLocale: 'nl',
    indexable: true,
  },
  schemaOrg: {
    identity: {
      type: 'MusicGroup',
      name: 'The Rocking Coasters',
      url: 'https://therockingcoasters.nl',
      logo: '/images/logo.svg', // Assuming this is available
      sameAs: [
        'https://www.facebook.com/TheRockingCoasters/'
      ]
    }
  },
  ogImage: {
    enabled: true,
    defaults: {
      url: '/images/og-main.jpg',
      width: 1200,
      height: 630,
      alt: 'The Rocking Coasters'
    }
  },
  seo: {
    fallbackTitle: false,
  },
  i18n: {
    locales: [
      { code: 'nl', language: 'nl-NL', name: 'Nederlands', file: 'nl.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' }
    ],
    defaultLocale: 'nl',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    baseUrl: 'https://therockingcoasters.nl'
  },
  robots: {
    enabled: true,
  },
  sitemap: {
    enabled: true,
  },
  studio: {
    repository: {
      provider: 'github',
      owner: 'd2af5',
      repo: 'website',
      branch: 'main',
    }
  },
  routeRules: {
    '/': { prerender: true },
    '/images/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/images/media/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/webp', href: '/favicon.webp' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'apple-touch-icon-precomposed', href: '/apple-touch-icon-precomposed.png' },
        { rel: 'preload', as: 'image', href: '/images/logo.svg', fetchpriority: 'high' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;700&display=swap', media: 'print', onload: "this.media='all'" }
      ]
    }
  },
  devtools: { enabled: true },
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@unhead/schema-org/vue',
      ]
    },
  },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2024-04-03',
})