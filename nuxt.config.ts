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
  modules: ['@nuxt/content', 'nuxt-studio', '@nuxtjs/i18n', "@nuxtjs/seo"],
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
    defaults: {
      component: 'RockingCoasters',
      props: {
        image: '/images/band.jpg',
        logo: '/images/logo.svg',
        alt: 'The Rocking Coasters'
      }
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
    '/': { prerender: true }
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/webp', href: '/favicon.webp' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;700&display=swap' }
      ]
    }
  },
  devtools: { enabled: true },
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'lucide-vue-next',
      ]
    }
  },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2024-04-03',
})