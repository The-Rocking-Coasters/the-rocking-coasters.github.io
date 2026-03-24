<template>
  <section id="media" class="media-section">
    <div class="media-header text-center mb-16">
      <h2 class="media-title">{{ title }}</h2>
      <div class="media-divider"></div>
    </div>

    <div class="media-grid">
      <div 
        v-for="(item, index) in displayItems" 
        :key="index" 
        class="media-item"
        :class="{ 'is-touched': touchedIndex === index }"
        @click="openLightbox(index)"
        @touchstart.passive="touchedIndex = index"
        @touchend.passive="touchedIndex = null"
      >
        <img :src="item.thumbnail ?? item.url" :alt="item.alt || 'Media'" class="media-img" />
        <div class="media-overlay">
          <div v-if="item.type === 'video'" class="video-play-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
              <path d="M5 3l14 9-14 9V3z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="isOpen" class="custom-lightbox" @click.self="closeLightbox">
        <div class="lightbox-content">
          <button class="lightbox-close" @click="closeLightbox" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <button 
            v-if="displayItems.length > 1" 
            class="lightbox-nav lightbox-prev" 
            @click="prev" 
            aria-label="Previous"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div class="lightbox-media-container">
            <img 
              v-if="currentItem && currentItem.type !== 'video'" 
              :src="currentItem.url" 
              :alt="currentItem.alt"
              class="lightbox-media"
            />

            <video 
              v-else-if="currentItem && currentItem.type === 'video'"
              :src="currentItem.url"
              controls
              autoplay
              class="lightbox-media"
            ></video>
          </div>

          <button 
            v-if="displayItems.length > 1" 
            class="lightbox-nav lightbox-next" 
            @click="next" 
            aria-label="Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <div class="lightbox-caption">
            {{ currentItem?.alt }} ({{ selectedIndex + 1 }} / {{ displayItems.length }})
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Media'
  },
  items: {
    type: Array,
    default: () => []
  }
})

const touchedIndex = ref(null)
const dynamicItems = ref([])
const isOpen = ref(false)
const selectedIndex = ref(0)

const displayItems = computed(() => {
  return props.items.length > 0 ? props.items : dynamicItems.value
})

const currentItem = computed(() => displayItems.value[selectedIndex.value])

onMounted(async () => {
  if (props.items.length === 0) {
    try {
      const response = await fetch('/media-list.json')
      if (response.ok) {
        dynamicItems.value = await response.json()
      }
    } catch (e) {
      console.error('Failed to load dynamic media', e)
    }
  }
})

function openLightbox(index) {
  selectedIndex.value = index
  isOpen.value = true
  if (process.client) {
    document.body.style.overflow = 'hidden'
  }
}

function closeLightbox() {
  isOpen.value = false
  if (process.client) {
    document.body.style.overflow = ''
  }
}

function next() {
  selectedIndex.value = (selectedIndex.value + 1) % displayItems.value.length
}

function prev() {
  selectedIndex.value = (selectedIndex.value - 1 + displayItems.value.length) % displayItems.value.length
}

// Keyboard navigation
if (process.client) {
  window.addEventListener('keydown', (e) => {
    if (!isOpen.value) return
    if (e.key === 'ArrowRight') next()
    if (e.key === 'ArrowLeft') prev()
    if (e.key === 'Escape') closeLightbox()
  })
}
</script>

<style scoped>
.media-section {
  background-color: rgba(0, 0, 0, 0.95);
  padding: 5rem 1rem;
}

.media-header {
  margin-bottom: 4rem;
}

.media-title {
  font-size: clamp(3rem, 10vw, 4.5rem);
  margin-bottom: 1rem;
}

.media-divider {
  height: 4px;
  width: 100px;
  background-color: var(--color-gold);
  margin: 0 auto;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .media-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .media-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.media-item {
  position: relative;
  aspect-ratio: 1/1;
  overflow: hidden;
  border: 2px solid var(--color-gold);
  transition: all 0.3s ease;
}

.media-item:hover, .media-item.is-touched {
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
}

.media-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1);
  transition: all 0.5s ease;
}

.media-item:hover .media-img, .media-item.is-touched .media-img {
  filter: grayscale(0);
  transform: scale(1.1);
}

.media-overlay {
  position: absolute;
  inset: 0;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
}

.media-item:hover .media-overlay, .media-item.is-touched .media-overlay {
  background-color: rgba(212, 175, 55, 0.2);
  opacity: 1;
}

.video-play-btn {
  width: 4rem;
  height: 4rem;
  background-color: var(--color-gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-black);
}

:deep(.media-item) {
  cursor: pointer;
}

.custom-lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.lightbox-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10001;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: color 0.3s;
  padding: 0.5rem;
}

.lightbox-close:hover {
  color: white;
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10001;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: color 0.3s;
  padding: 1rem;
}

.lightbox-nav:hover {
  color: white;
}

.lightbox-prev {
  left: 1rem;
}

.lightbox-next {
  right: 1rem;
}

.lightbox-media-container {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-media {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
}

.lightbox-caption {
  position: absolute;
  bottom: 1.5rem;
  left: 0;
  right: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .lightbox-nav svg {
    width: 32px;
    height: 32px;
  }
}
</style>
