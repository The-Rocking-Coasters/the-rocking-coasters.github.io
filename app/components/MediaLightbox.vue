<template>
  <Teleport to="body">
    <Transition name="lightbox-fade">
      <div v-if="modelValue" class="lightbox-overlay" @click.self="close" @keydown.esc="close" tabindex="-1" ref="overlayRef">
        <button class="lightbox-close" @click="close" :aria-label="$t('lightbox.close')">✕</button>

        <button v-if="items.length > 1" class="lightbox-nav lightbox-prev" @click="prev" :aria-label="$t('lightbox.prev')">‹</button>
        <button v-if="items.length > 1" class="lightbox-nav lightbox-next" @click="next" :aria-label="$t('lightbox.next')">›</button>

        <div class="lightbox-content">
          <template v-if="current">
            <video
              v-if="current.type === 'video'"
              :key="current.url"
              class="lightbox-media"
              controls
              autoplay
              playsinline
              :aria-label="current.alt"
            >
              <source :src="current.url" type="video/mp4" />
            </video>
            <img
              v-else
              :key="current.url"
              class="lightbox-media"
              :src="current.url"
              :alt="current.alt"
            />
          </template>
        </div>

        <div v-if="items.length > 1" class="lightbox-counter">{{ activeIndex + 1 }} / {{ items.length }}</div>

        <div v-if="items.length > 1" class="lightbox-thumbs">
          <button
            v-for="(item, i) in items"
            :key="item.url"
            class="lightbox-thumb-btn"
            :class="{ active: i === activeIndex }"
            @click="activeIndex = i"
          >
            <video v-if="item.type === 'video' && item.thumbnail" class="lightbox-thumb" muted playsinline>
              <source :src="item.thumbnail" :type="item.thumbnailType || 'video/webm'" />
            </video>
            <img v-else-if="item.type === 'image'" class="lightbox-thumb" :src="item.url" :alt="item.alt" />
            <div v-else class="lightbox-thumb lightbox-thumb-video-placeholder">▶</div>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  startIndex: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue'])

const activeIndex = ref(props.startIndex)
const overlayRef = ref(null)

const current = computed(() => props.items[activeIndex.value] ?? null)

watch(() => props.modelValue, (val) => {
  if (val) {
    activeIndex.value = props.startIndex
    nextTick(() => overlayRef.value?.focus())
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

watch(() => props.startIndex, (val) => {
  activeIndex.value = val
})

const close = () => emit('update:modelValue', false)

const prev = () => {
  activeIndex.value = (activeIndex.value - 1 + props.items.length) % props.items.length
}

const next = () => {
  activeIndex.value = (activeIndex.value + 1) % props.items.length
}
</script>

<style scoped>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  outline: none;
}

.lightbox-content {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
  padding: 3rem 4rem 1rem;
  box-sizing: border-box;
}

.lightbox-media {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 4px;
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
  opacity: 0.8;
  transition: opacity 0.2s;
  z-index: 1;
}
.lightbox-close:hover { opacity: 1; }

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  font-size: 3rem;
  line-height: 1;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
  z-index: 1;
}
.lightbox-nav:hover { background: rgba(255,255,255,0.25); }
.lightbox-prev { left: 0.5rem; }
.lightbox-next { right: 0.5rem; }

.lightbox-counter {
  color: rgba(255,255,255,0.6);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.lightbox-thumbs {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1rem 1rem;
  overflow-x: auto;
  max-width: 100%;
}

.lightbox-thumb-btn {
  background: none;
  border: 2px solid transparent;
  border-radius: 4px;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.2s;
  overflow: hidden;
}
.lightbox-thumb-btn.active { border-color: var(--color-gold, #c9a84c); }

.lightbox-thumb {
  width: 64px;
  height: 48px;
  object-fit: cover;
  display: block;
}

.lightbox-thumb-video-placeholder {
  width: 64px;
  height: 48px;
  background: #333;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.25s ease;
}
.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}
</style>
