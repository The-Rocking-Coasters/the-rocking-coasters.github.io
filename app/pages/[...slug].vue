<script setup lang="ts">
const route = useRoute()

const { locale } = useI18n()

const { data: page } = await useAsyncData(route.path, () => {
  // If we are on root, use default locale 'nl'
  // If the route is /en, query a collection with path /en/
  // Use locales to determine if it's a locale prefix
  const path = route.path === '/' ? `/${locale.value}/` : route.path
  // Ensure a path ends with a slash for a directory query if needed, or just a path
  return queryCollection('content').path(path).first()
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
