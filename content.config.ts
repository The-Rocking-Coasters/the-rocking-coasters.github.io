import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/index.md'
    }),
    members: defineCollection({
      type: 'data',
      source: 'members/*.md',
      schema: z.object({
        name: z.string(),
        role_en: z.string(),
        role_nl: z.string(),
        bio_en: z.string(),
        bio_nl: z.string(),
        image: z.string(),
        instruments: z.string(),
        order: z.number()
      })
    }),
    performances: defineCollection({
      type: 'data',
      source: 'performances/*.md',
      schema: z.object({
        date: z.string(),
        venue: z.string(),
        address: z.string().optional(),
        location: z.string().optional(),
        time: z.string(),
        entranceFee: z.number(),
        googleMapsUrl: z.string().url(),
        ticketUrl: z.string().url().optional()
      })
    }),
    media: defineCollection({
      type: 'data',
      source: 'media/*.md',
      schema: z.object({
        title_en: z.string().optional(),
        title_nl: z.string().optional(),
        type: z.enum(['photo', 'video']),
        url: z.string(),
        thumbnail: z.string().optional(),
        alt_en: z.string().optional(),
        alt_nl: z.string().optional(),
        order: z.number().optional()
      })
    }),
    posts: defineCollection({
      type: 'page',
      source: 'posts/*.md',
      schema: z.object({
        title_en: z.string(),
        title_nl: z.string(),
        date: z.string(),
        image: z.string().optional(),
        excerpt_en: z.string().optional(),
        excerpt_nl: z.string().optional(),
        published: z.boolean().default(false),
        socials: z.array(z.enum(['facebook', 'instagram', 'tiktok', 'youtube'])).optional()
      })
    })
  }
})
