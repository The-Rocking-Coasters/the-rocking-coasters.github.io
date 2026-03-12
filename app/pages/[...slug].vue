<script setup lang="ts">
const route = useRoute()

const { locale } = useI18n()

const { data: page } = await useAsyncData(route.path, () => {
  let path = route.path

  if (locale.value === 'nl' && !path.startsWith('/nl')) {
    path = `/nl${path}`
  }

  path = path.replace(/\/+/g, '/').replace(/\/$/, '')
  if (path === '') path = '/'

  return queryCollection('content').path(path).first()
})

useSeoMeta({
  title: () => page.value?.title,
  ogTitle: () => page.value?.title,
  description: () => page.value?.description,
  ogDescription: () => page.value?.description,
  ogType: 'website',
  ogUrl: () => `https://therockingcoasters.nl${route.path}`,
  twitterCard: 'summary_large_image',
})

defineOgImageComponent('RockingCoasters', {
  alt: page.value?.title || 'The Rocking Coasters',
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}
</script>

<template>
  <ContentRenderer
    v-if="page"
    :value="page"
  />
</template>
