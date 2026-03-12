<script setup lang="ts">
defineProps<{
  image?: string
  logo?: string
  alt?: string
}>()
</script>

<template>
  <div class="w-full h-full flex flex-col items-center justify-center bg-black relative">
    <!-- Background Image with Overlay (Mirrors Hero.vue) -->
    <div v-if="image" class="absolute inset-0 flex">
      <img
        :src="image"
        :alt="alt"
        class="w-full h-full object-cover grayscale opacity-50"
      />
      <!-- Gradient matching Hero.vue: to bottom, rgba(0,0,0,0.6), transparent, var(--color-black) -->
      <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
    </div>

    <!-- Content (Mirrors Hero.vue) -->
    <div class="relative z-10 flex flex-col items-center justify-center w-full h-full p-20 text-center">
      <img
        v-if="logo"
        :src="logo"
        :alt="alt || 'Logo'"
        class="max-w-[90%] max-h-[80%] object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.6)]"
      />
    </div>
  </div>
</template>
