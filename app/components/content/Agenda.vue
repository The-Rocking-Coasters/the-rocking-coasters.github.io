<template>
  <section id="agenda" class="agenda-section">
    <div class="agenda-header text-center mb-12">
      <h2 class="agenda-title italic">{{ title }}</h2>
      <div class="agenda-divider"></div>
    </div>

    <!-- ── UPCOMING PERFORMANCES ── -->
    <div class="agenda-list">
      <div
        v-for="(event, index) in upcomingPerformances"
        :key="'up-' + index"
        class="agenda-card"
      >
        <div class="agenda-card-accent"></div>

        <div class="agenda-card-date">
          <div class="date-day">{{ formatDate(event.date, 'DD') }}</div>
          <div class="date-month">{{ formatDate(event.date, 'MMM') }}</div>
          <div class="date-year">{{ formatDate(event.date, 'YYYY') }}</div>
        </div>

        <div class="agenda-card-body">
          <h3 class="agenda-venue">{{ event.venue }}</h3>
          <p v-if="event.address" class="agenda-address">{{ event.address }}</p>
          <p v-if="event.location" class="agenda-location">{{ event.location }}</p>
          <div class="agenda-details">
            <span v-if="event.time" class="agenda-detail">
              <span class="detail-icon">🕒</span> {{ event.time }}
            </span>
            <span v-if="event.entranceFee >= 0" class="agenda-detail">
              <span class="detail-icon">🎟️</span>
              <span v-if="event.entranceFee === 0" class="free-badge">{{ $t('free') }}</span>
              <span v-else>€{{ event.entranceFee }}</span>
            </span>
            <button v-if="event.mapQuery" class="map-toggle-btn" @click="toggleMap('up-' + index)" :title="$t('toggleMap')">
              📍
            </button>
          </div>

          <Transition name="fade">
            <div v-if="event.mapQuery && showMaps['up-' + index]" class="agenda-map">
              <iframe
                width="100%"
                height="150"
                style="border:0"
                loading="lazy"
                allowfullscreen
                :src="`https://www.google.com/maps?q=${encodeURIComponent(event.mapQuery)}&output=embed`"
              ></iframe>
            </div>
          </Transition>
        </div>

        <div class="agenda-card-actions">
          <a v-if="event.ticketUrl" :href="event.ticketUrl" target="_blank" class="retro-button small">{{ $t('tickets') }}</a>
          <a v-else-if="event.googleMapsUrl" :href="event.googleMapsUrl" target="_blank" class="retro-button small secondary">{{ $t('location') }}</a>
        </div>
      </div>

      <div v-if="upcomingPerformances.length === 0" class="agenda-empty">
        New dates coming soon. Stay tuned!
      </div>
    </div>

    <!-- ── ARCHIVE TOGGLE ── -->
    <div v-if="pastPerformances.length > 0" class="archive-toggle-row">
      <button class="archive-toggle-btn" @click="showArchive = !showArchive">
        <span class="archive-toggle-icon">{{ showArchive ? '▲' : '▼' }}</span>
        <span v-if="!showArchive">{{ $t('showPastShows', { count: pastPerformances.length }) }}</span>
        <span v-else>{{ $t('hidePastShows') }}</span>
      </button>
    </div>

    <!-- ── ARCHIVE ── -->
    <Transition name="crate">
      <div v-if="showArchive" class="archive-section">
        <div class="archive-inner">
          <div class="archive-heading">
            <span class="archive-heading-line"></span>
            <span class="archive-heading-text">{{ $t('pastShows') }}</span>
            <span class="archive-heading-line"></span>
          </div>

          <template v-for="(group, year) in groupedPastPerformances" :key="year">
            <div class="archive-year-label">{{ year }}</div>
            <div
              v-for="(event, index) in group"
              :key="'past-' + year + '-' + index"
              class="archive-row"
            >
              <div class="archive-date">
                <span class="archive-date-day">{{ formatDate(event.date, 'DD') }}</span>
                <span class="archive-date-month">{{ formatDate(event.date, 'MMM') }}</span>
              </div>

              <div class="archive-info">
                <span class="archive-venue">{{ event.venue }}</span>
                <span v-if="event.location" class="archive-location">{{ event.location }}</span>
              </div>

              <div class="archive-meta">
                <span v-if="event.time" class="archive-time">{{ event.time }}</span>
              </div>

              <div class="archive-actions">
                <span class="played-badge">✓</span>
                <button
                  v-if="getMediaForDate(event.date).length > 0"
                  class="archive-media-btn"
                  @click="openLightbox(event.date)"
                >{{ $t('viewMedia') }}</button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </section>

  <MediaLightbox
    v-model="lightboxOpen"
    :items="lightboxItems"
    :start-index="0"
  />
</template>

<script setup>
const { locale } = useI18n()
const { enrichPerformance } = useVenueData()

defineProps({
  title: {
    type: String,
    default: 'Tour Dates'
  }
})

const { data: performances } = await useAsyncData('performances', () => {
  return queryCollection('performances').all()
})

const { data: mediaList } = await useFetch('/api/media-list', {
  default: () => [],
})

const allSortedPerformances = ref([])
const showMaps = ref({})
const showArchive = ref(false)
const lightboxOpen = ref(false)
const lightboxItems = ref([])

const getMediaForDate = (date) => {
  if (!mediaList.value) return []
  return mediaList.value.filter(item => item.url.includes(`/images/media/${date}-`))
}

const openLightbox = (date) => {
  lightboxItems.value = getMediaForDate(date)
  lightboxOpen.value = true
}

const toggleMap = (key) => {
  showMaps.value[key] = !showMaps.value[key]
}

watch(performances, (newVal) => {
  if (!newVal) {
    allSortedPerformances.value = []
    return
  }
  allSortedPerformances.value = newVal
    .map(p => enrichPerformance(p))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}, { immediate: true })

const today = new Date()
today.setHours(0, 0, 0, 0)

const upcomingPerformances = computed(() =>
  allSortedPerformances.value.filter(p => new Date(p.date) >= today)
)

const pastPerformances = computed(() =>
  allSortedPerformances.value
    .filter(p => new Date(p.date) < today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
)

const groupedPastPerformances = computed(() => {
  const groups = {}
  for (const p of pastPerformances.value) {
    const year = new Date(p.date).getFullYear()
    if (!groups[year]) groups[year] = []
    groups[year].push(p)
  }
  return groups
})

const formatDate = (dateStr, part) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (part === 'DD') return date.getDate()
  if (part === 'MMM') return date.toLocaleString(locale.value, { month: 'short' })
  if (part === 'YYYY') return date.getFullYear()
  return dateStr
}
</script>

<style scoped>
/* ── SECTION ── */
.agenda-section {
  background-color: var(--color-black);
  padding: 5rem 1rem;
}

.agenda-header {
  margin-bottom: 4rem;
}

.agenda-title {
  font-size: clamp(3rem, 10vw, 4.5rem);
  margin-bottom: 1rem;
}

.agenda-divider {
  height: 4px;
  width: 100px;
  background-color: var(--color-gold);
  margin: 0 auto;
}

/* ── UPCOMING CARDS ── */
.agenda-list {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.agenda-card {
  display: grid;
  grid-template-columns: 70px 1fr auto;
  align-items: center;
  gap: 0 1.5rem;
  padding: 0.85rem 0.5rem;
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
  transition: background 0.3s ease;
  position: relative;
}

.agenda-card:hover {
  background: rgba(212, 175, 55, 0.03);
}

.agenda-card-accent {
  width: 4px;
  height: 100%;
  background: rgba(212, 175, 55, 0.2);
  position: absolute;
  left: 0;
  top: 0;
  transition: background 0.3s ease;
}

.agenda-card:hover .agenda-card-accent {
  background: var(--color-gold);
}

.agenda-card-date {
  text-align: center;
  border: 2px solid var(--color-gold);
  padding: 0.4rem 0.25rem;
  background: transparent;
  transition: all 0.3s ease;
  width: 70px;
  flex-shrink: 0;
}

.agenda-card:hover .agenda-card-date {
  background: var(--color-gold);
  color: var(--color-black);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.3);
}

.date-day {
  font-family: var(--font-rock), cursive;
  font-size: 1.4rem;
  line-height: 1;
  font-weight: bold;
}

.date-month {
  font-family: var(--font-rock), cursive;
  font-size: 0.75rem;
  text-transform: uppercase;
  margin-top: 0.15rem;
}

.date-year {
  font-family: var(--font-rock), cursive;
  font-size: 0.7rem;
  text-transform: uppercase;
  margin-top: 0.15rem;
  color: #9ca3af;
  letter-spacing: 0.05em;
}

.agenda-card:hover .date-year {
  color: var(--color-black);
}

.agenda-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.agenda-venue {
  font-family: var(--font-rock), cursive;
  font-size: 1.1rem;
  color: var(--color-white);
  line-height: 1.1;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: color 0.3s ease;
}

.agenda-card:hover .agenda-venue {
  color: var(--color-gold);
}

.agenda-address {
  margin: 0;
  font-size: 0.9rem;
  color: #9ca3af;
}

.agenda-location {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
  font-style: italic;
}

.agenda-details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  color: #d1d5db;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.agenda-detail {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.detail-icon {
  font-size: 0.9rem;
}

.free-badge {
  color: var(--color-gold);
  font-family: var(--font-rock), cursive;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.map-toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 1.1rem;
  transition: transform 0.2s ease;
  line-height: 1;
}

.map-toggle-btn:hover {
  transform: scale(1.2);
}

.agenda-map {
  margin-top: 1.25rem;
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  overflow: hidden;
  max-width: 420px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
}

.agenda-card-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  min-width: 110px;
}

.retro-button.small {
  padding: 0.65rem 1.25rem;
  font-size: 0.95rem;
  text-align: center;
  white-space: nowrap;
}

.retro-button.secondary {
  background-color: transparent;
  border: 2px solid var(--color-gold);
  color: var(--color-gold);
}

.retro-button.secondary:hover {
  background-color: var(--color-gold);
  color: var(--color-black);
}

.agenda-empty {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 4rem 0;
  font-size: 1.1rem;
}

/* ── ARCHIVE TOGGLE ── */
.archive-toggle-row {
  max-width: 860px;
  margin: 3rem auto 0;
  display: flex;
  justify-content: center;
}

.archive-toggle-btn {
  background: none;
  border: 1px solid rgba(212, 175, 55, 0.25);
  color: #6b7280;
  font-family: var(--font-rock), cursive;
  font-size: 0.95rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.75rem 2.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.archive-toggle-btn:hover {
  border-color: rgba(212, 175, 55, 0.5);
  color: #9ca3af;
}

.archive-toggle-icon {
  font-size: 0.7rem;
  color: rgba(212, 175, 55, 0.4);
}

/* ── ARCHIVE SECTION ── */
.archive-section {
  max-width: 860px;
  margin: 0 auto;
  overflow: hidden;
}

.archive-inner {
  padding-top: 2rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
  margin-top: 1rem;
}

.archive-heading {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.archive-heading-line {
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}

.archive-heading-text {
  font-family: var(--font-rock), cursive;
  font-size: 0.8rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #6b7280;
  white-space: nowrap;
}

/* ── YEAR GROUPS ── */
.archive-year-label {
  font-family: var(--font-rock), cursive;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(212, 175, 55, 0.5);
  padding: 1.25rem 0 0.5rem;
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
  margin-bottom: 0.25rem;
}

/* ── ARCHIVE ROWS ── */
.archive-row {
  display: grid;
  grid-template-columns: 70px 1fr auto auto;
  align-items: center;
  gap: 1.5rem;
  padding: 0.85rem 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  opacity: 0.75;
  transition: opacity 0.25s ease, background 0.25s ease;
}

.archive-row:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.03);
}

.archive-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.archive-date-day {
  font-family: var(--font-rock), cursive;
  font-size: 1.4rem;
  color: #9ca3af;
}

.archive-date-month {
  font-family: var(--font-rock), cursive;
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #6b7280;
  letter-spacing: 0.05em;
}

.archive-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.archive-venue {
  font-family: var(--font-rock), cursive;
  font-size: 1.1rem;
  color: #d1d5db;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.archive-location {
  font-size: 0.8rem;
  color: #6b7280;
  font-style: italic;
}

.archive-meta {
  text-align: right;
}

.archive-time {
  font-size: 0.8rem;
  color: #6b7280;
  white-space: nowrap;
}

.archive-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: flex-end;
}

.played-badge {
  font-family: var(--font-rock), cursive;
  font-size: 0.7rem;
  color: #6b7280;
  border: 1px solid #374151;
  padding: 0.2rem 0.5rem;
  letter-spacing: 0.05em;
}

.archive-media-btn {
  background: none;
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: rgba(212, 175, 55, 0.6);
  font-family: var(--font-body), sans-serif;
  font-size: 0.75rem;
  padding: 0.3rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.archive-media-btn:hover {
  border-color: var(--color-gold);
  color: var(--color-gold);
  background: rgba(212, 175, 55, 0.05);
}

/* ── TRANSITIONS ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.crate-enter-active {
  transition: max-height 0.5s ease, opacity 0.4s ease;
  max-height: 3000px;
}
.crate-leave-active {
  transition: max-height 0.4s ease, opacity 0.3s ease;
}
.crate-enter-from,
.crate-leave-to {
  max-height: 0;
  opacity: 0;
}

/* ── MOBILE ── */
@media (max-width: 768px) {
  .agenda-card {
    grid-template-columns: 55px 1fr;
    grid-template-rows: auto auto;
    padding: 0.75rem 0.5rem;
  }

  .agenda-card-actions {
    grid-column: 2 / -1;
    flex-direction: row;
    align-items: center;
    min-width: unset;
    padding-top: 0.5rem;
  }

  .agenda-venue {
    font-size: 1.1rem;
  }

  .archive-row {
    grid-template-columns: 55px 1fr auto;
    grid-template-rows: auto auto;
    gap: 0.75rem 1rem;
  }

  .archive-meta {
    display: none;
  }

  .archive-actions {
    grid-column: 2 / -1;
  }
}
</style>
