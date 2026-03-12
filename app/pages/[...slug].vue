<script setup lang="ts">
const route = useRoute()

const { locale } = useI18n()

const { data: page } = await useAsyncData(route.path, () => {
  // If we are on root, use default locale 'nl'
  // If the route is /en, query a collection with path /en/
  // Use locales to determine if it's a locale prefix
  let path = route.path
  if (path === '/' || path === '/en' || path === '/en/') {
    path = `/${locale.value}/index`
  } else if (path.endsWith('/')) {
    path = `${path}index`
  } else if (!path.endsWith('/index')) {
    path = `${path}/index`
  }
  
  // If strategy is prefix_except_default, 'nl' routes won't have /nl prefix in route.path
  // But content is in /nl/ directory.
  if (locale.value === 'nl' && !path.startsWith('/nl/')) {
    path = `/nl${path}`
  }

  // Ensure we don't have double slashes
  path = path.replace(/\/+/g, '/')
  
  // Strip trailing /index if it's there, as it seems Nuxt Content v3 prefers the directory path
  if (path.endsWith('/index')) {
    path = path.substring(0, path.length - 6)
  }
  if (path === '') path = '/'

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
