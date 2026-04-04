<template>
  <section id="hero" class="hero-section">
    <div class="hero-bg">
      <!-- Video background: cycles through curated hero clips -->
      <template v-if="heroClips.length > 0">
        <video
          v-for="(clip, i) in heroClips"
          :key="clip.webm || clip.mp4"
          ref="videoEls"
          class="hero-bg-video"
          :class="{ active: i === clipIndex }"
          autoplay
          muted
          playsinline
          :style="i === clipIndex ? heroStyle : undefined"
          @ended="nextClip"
        >
          <source v-if="clip.webm" :src="clip.webm" type="video/webm" />
          <source v-if="clip.mp4" :src="clip.mp4" type="video/mp4" />
        </video>
      </template>
      <!-- Static fallback (no hero clips yet, or video unsupported) -->
      <img
        v-else
        :src="backgroundImage"
        :alt="alt"
        class="hero-bg-img"
        :style="heroStyle"
      />
      <div class="hero-overlay"></div>
    </div>

    <div class="hero-content">
      <img
        :src="logoImage"
        alt="The Rocking Coasters Logo"
        class="hero-logo"
        fetchpriority="high"
        loading="eager"
        width="1600"
        height="900"
      />
    </div>

    <div class="hero-scroll-indicator">
      <NuxtLink to="#agenda" class="scroll-link" aria-label="Scroll to agenda">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
        </svg>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
import { HERO_VISUAL } from '../../../hero.config'

defineProps({
  backgroundImage: { type: String, default: '/images/band.webp' },
  logoImage:       { type: String, default: '/images/logo.svg' },
  alt:             { type: String, default: 'The Rocking Coasters Band' },
})

const { data: mediaList } = await useFetch('/api/media-list', { default: () => [] })

const heroClips = computed(() =>
  (mediaList.value ?? [])
    .filter(i => i.heroClip || i.heroClipMp4)
    .map(i => ({ webm: i.heroClip, mp4: i.heroClipMp4 }))
)

const clipIndex = ref(0)
const videoEls = ref([])

const heroStyle = computed(() => ({
  opacity: HERO_VISUAL.opacity,
  filter: HERO_VISUAL.grayscale > 0 ? `grayscale(${HERO_VISUAL.grayscale})` : undefined,
}))

const nextClip = () => {
  clipIndex.value = (clipIndex.value + 1) % (heroClips.value.length || 1)
}

watch(clipIndex, (newIdx) => {
  nextTick(() => {
    videoEls.value.forEach((el, i) => {
      if (!el) return
      if (i === newIdx) {
        el.currentTime = 0
        el.play().catch(() => {})
      } else {
        el.pause()
      }
    })
  })
})
</script>

<style scoped>
.hero-section {
  position: relative;
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0;
  max-width: none;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 1s ease;
  pointer-events: none;
}

.hero-bg-video.active {
  opacity: 1;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent, var(--color-black));
}

.hero-content {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.hero-logo {
  max-width: 90%;
  max-height: 80vh;
  object-fit: contain;
  filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.6));
}

@media (max-width: 768px) {
  .hero-logo {
    max-width: 180%;
    width: 120%;
    max-height: 50vh;
    transform: scale(1.8);
  }
}

.hero-scroll-indicator {
  position: absolute;
  bottom: 2.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  animation: bounce 2s infinite;
}

.scroll-link {
  color: var(--color-gold);
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
  40% { transform: translateX(-50%) translateY(-30px); }
  60% { transform: translateX(-50%) translateY(-15px); }
}
</style>
