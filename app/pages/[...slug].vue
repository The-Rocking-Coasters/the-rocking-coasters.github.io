<script setup lang="ts">
const route = useRoute()

const { locale } = useI18n()

const { data: page } = await useAsyncData(route.path, () => {
  const { locale } = useI18n()
  let path = route.path

  if (locale.value === 'nl' && !path.startsWith('/nl')) {
    path = `/nl${path}`
  }

  path = path.replace(/\/+/g, '/').replace(/\/$/, '')
  if (path === '') path = '/'

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
