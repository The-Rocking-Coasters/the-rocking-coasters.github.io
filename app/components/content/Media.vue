<template>
  <section id="media" class="media-section">
    <div class="media-header text-center mb-16">
      <h2 class="media-title">{{ title }}</h2>
      <div class="media-divider"></div>
    </div>

    <!-- Filter bar -->
    <div v-if="dateGroups.length > 1 || hasOtherItems" class="media-filters">
      <button
        class="media-filter-btn"
        :class="{ active: activeFilter === null }"
        @click="activeFilter = null"
      >{{ $t('mediaFilterAll') }}</button>
      <button
        v-for="group in dateGroups"
        :key="group.date"
        class="media-filter-btn"
        :class="{ active: activeFilter === group.date }"
        @click="activeFilter = group.date"
      >{{ group.label }}</button>
      <button
        v-if="hasOtherItems"
        class="media-filter-btn"
        :class="{ active: activeFilter === '__other__' }"
        @click="activeFilter = '__other__'"
      >{{ $t('mediaFilterOther') }}</button>
    </div>

    <div class="media-grid">
      <div
        v-for="(item, index) in displayItems"
        :key="item.url"
        class="media-item"
        :class="{ 'is-touched': touchedIndex === index }"
        @click="openLightbox(index)"
        @touchstart.passive="touchedIndex = index"
        @touchend.passive="touchedIndex = null"
      >
        <video
          v-if="item.thumbnailType === 'video/webm'"
          :src="item.thumbnail"
          class="media-img"
          autoplay
          muted
          loop
          playsinline
        ></video>
        <img v-else :src="item.thumbnail ?? item.url" :alt="item.alt || 'Media'" class="media-img" />
        <div class="media-overlay">
          <div v-if="item.type === 'video'" class="video-play-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 3l14 9-14 9V3z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div v-if="hasMore" class="media-more">
      <span class="media-more-hint">{{ allFilteredItems.length - MAX_DISPLAY }} more — open the lightbox to browse all</span>
    </div>
  </section>

  <MediaLightbox
    v-model="lightboxOpen"
    :items="allFilteredItems"
    :start-index="lightboxStartIndex"
  />
</template>

<script setup>
const MAX_DISPLAY = 16

const props = defineProps({
  title: { type: String, default: 'Media' },
  items: { type: Array, default: () => [] },
})

const touchedIndex = ref(null)
const dynamicItems = ref([])
const lightboxOpen = ref(false)
const lightboxStartIndex = ref(0)
const activeFilter = ref(null)

// Fetch media list if no items passed via props
const { data: fetchedItems } = await useFetch('/api/media-list', { default: () => [] })

const allItems = computed(() => {
  const source = props.items.length > 0 ? props.items : (fetchedItems.value ?? dynamicItems.value)
  // Exclude hero clips and webm thumbnails (items whose url contains -hero or whose type is video/webm thumbnail)
  return source.filter(item =>
    !item.url.includes('-hero') &&
    !(item.url.endsWith('.webm') && source.some(s => s.thumbnail === item.url))
  )
})

// Build date groups from item URLs (prefix YYYY-MM-DD)
const dateGroups = computed(() => {
  const seen = new Set()
  const groups = []
  for (const item of allItems.value) {
    const match = item.url.match(/\/(\d{4}-\d{2}-\d{2})-/)
    if (!match) continue
    const date = match[1]
    if (!seen.has(date)) {
      seen.add(date)
      const d = new Date(date)
      const label = d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
      groups.push({ date, label })
    }
  }
  return groups.sort((a, b) => b.date.localeCompare(a.date))
})

const hasOtherItems = computed(() =>
  allItems.value.some(item => !item.url.match(/\/\d{4}-\d{2}-\d{2}-/))
)

const allFilteredItems = computed(() => {
  if (!activeFilter.value) return allItems.value
  if (activeFilter.value === '__other__') return allItems.value.filter(item => !item.url.match(/\/\d{4}-\d{2}-\d{2}-/))
  return allItems.value.filter(item => item.url.includes(`/${activeFilter.value}-`))
})

// Randomised selection capped at MAX_DISPLAY for the grid
const randomSeed = ref(Math.random())
const displayItems = computed(() => {
  const items = [...allFilteredItems.value]
  // Seeded shuffle (Fisher-Yates with a simple seed)
  let seed = Math.floor(randomSeed.value * 2147483647)
  for (let i = items.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(seed) % (i + 1);
    [items[i], items[j]] = [items[j], items[i]]
  }
  return items.slice(0, MAX_DISPLAY)
})

const hasMore = computed(() => allFilteredItems.value.length > MAX_DISPLAY)

function openLightbox(gridIndex) {
  // Map grid index back to the full filtered list index
  const clickedItem = displayItems.value[gridIndex]
  const fullIndex = allFilteredItems.value.findIndex(i => i.url === clickedItem.url)
  lightboxStartIndex.value = fullIndex >= 0 ? fullIndex : 0
  lightboxOpen.value = true
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

/* ── FILTER BAR ── */
.media-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  max-width: 1200px;
  margin: 0 auto 2.5rem;
}

.media-filter-btn {
  background: none;
  border: 1px solid rgba(212, 175, 55, 0.25);
  color: #9ca3af;
  font-family: var(--font-rock), cursive;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.4rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.media-filter-btn:hover,
.media-filter-btn.active {
  border-color: var(--color-gold);
  color: var(--color-gold);
  background: rgba(212, 175, 55, 0.05);
}

/* ── GRID ── */
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
  border: 2px solid rgba(212, 175, 55, 0.3);
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.media-item:hover,
.media-item.is-touched {
  border-color: var(--color-gold);
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
}

.media-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1);
  transition: all 0.5s ease;
}

.media-item:hover .media-img,
.media-item.is-touched .media-img {
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

.media-item:hover .media-overlay,
.media-item.is-touched .media-overlay {
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

/* ── MORE HINT ── */
.media-more {
  text-align: center;
  margin-top: 1.5rem;
}

.media-more-hint {
  font-size: 0.8rem;
  color: #9ca3af;
  font-style: italic;
  letter-spacing: 0.05em;
}
</style>
