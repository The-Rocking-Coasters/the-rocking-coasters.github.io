import { readdirSync, existsSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

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
      type MediaItem = {
          url: string
          alt: string
          type: string
          thumbnail?: string
          thumbnailType?: string
      };
      const mediaDir = resolve(__dirname, 'public/images/media')
      const outputJson = resolve(__dirname, 'public/media-list.json')

      if (existsSync(mediaDir)) {
        const files: string[] = readdirSync(mediaDir)
        const mediaItems : MediaItem[] = files
          .filter((file: string) => {
            if (!/\.(jpg|jpeg|png|webp|mp4|webm|ogg)$/i.test(file)) return false
            // Exclude WebM files that are thumbnails for a video (same base name as an mp4/ogg)
            if (/\.webm$/i.test(file)) {
              const baseName = file.split('.').slice(0, -1).join('.')
              const hasSourceVideo = files.some(f => new RegExp(`^${baseName}\\.(mp4|ogg)$`, 'i').test(f))
              if (hasSourceVideo) return false
            }
            return true
          })
          .map((file: string) => {
            const isVideo = /\.(mp4|webm|ogg)$/i.test(file)
            const item: MediaItem = {
              url: `/images/media/${file}`,
              alt: file.split('.').slice(0, -1).join('.').replace(/[_-]/g, ' '),
              type: isVideo ? 'video' : 'image'
            }
            if (isVideo) {
              const baseName = file.split('.').slice(0, -1).join('.')
              const gifName = `${baseName}.webm`
              const gifPath = resolve(mediaDir, gifName)
              if (!existsSync(gifPath)) {
                try {
                  const videoPath = resolve(mediaDir, file)
                  const filters = 'fps=24,scale=480:-1:flags=lanczos'
                  execSync(
                    `ffmpeg -y -t 4 -i "${videoPath}" -vf "${filters}" -c:v libvpx-vp9 -b:v 0 -crf 40 -an "${gifPath}"`,
                    { stdio: 'pipe' }
                  )
                  console.log(`[Media Plugin] Generated WebM thumbnail: ${gifName}`)
                } catch (e) {
                  console.warn(`[Media Plugin] Could not generate GIF for ${file} (ffmpeg not available?)`)
                }
              }
              if (existsSync(gifPath)) {
                item.thumbnail = `/images/media/${gifName}`
                item.thumbnailType = 'video/webm'
              }
            }
            return item
          })

        writeFileSync(outputJson, JSON.stringify(mediaItems, null, 2))
        console.log(`[Media Plugin] Generated media-list.json with ${mediaItems.length} items.`)
      } else {
        console.warn(`[Media Plugin] Media directory not found: ${mediaDir}`)
      }
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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/@nuxtjs/i18n') || id.includes('node_modules/vue-i18n')) {
              return 'i18n'
            }
            if (id.includes('node_modules/@nuxt/content') || id.includes('node_modules/remark') || id.includes('node_modules/micromark') || id.includes('node_modules/mdast')) {
              return 'content'
            }
          }
        }
      }
    }
  },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2024-04-03',
})