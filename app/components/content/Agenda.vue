<template>
  <section id="agenda" class="agenda-section">
    <div class="agenda-header text-center mb-12">
      <h2 class="agenda-title italic">{{ title }}</h2>
      <div class="agenda-divider"></div>
    </div>

    <div class="agenda-list">
      <!-- UPCOMING PERFORMANCES -->
      <div v-for="(event, index) in upcomingPerformances" :key="'up-' + index" class="agenda-item">
        <div class="agenda-date-col">
          <div class="agenda-date">
                <div class="date-day">{{ formatDate(event.date, 'DD') }}</div>
                <div class="date-month">{{ formatDate(event.date, 'MMM') }}</div>
                <div class="date-year">{{ formatDate(event.date, 'YYYY') }}</div>
              </div>
        </div>

        <div class="agenda-info-col">
          <h3 class="agenda-venue">{{ event.venue }}</h3>
          <p v-if="event.address" class="agenda-address">{{ event.address }}</p>
          <p v-if="event.location" class="agenda-location">{{ event.location }}</p>
          <div class="agenda-details">
            <span v-if="event.time" class="agenda-detail">
              <span class="icon-clock">🕒</span> {{ event.time }}
            </span>
            <span v-if="event.entranceFee >= 0" class="agenda-detail">
              <span class="icon-ticket">🎟️</span>
              <span v-if="event.entranceFee === 0" class="free-badge">{{ $t('free') }}</span>
              <span v-else>€{{ event.entranceFee }}</span>
            </span>
            <button v-if="event.mapQuery" class="agenda-map-toggle" @click="toggleMap('up-' + index)" :title="$t('toggleMap')">
              <span class="icon-pin">📍</span>
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

        <div class="agenda-actions-col">
          <a v-if="event.ticketUrl" :href="event.ticketUrl" target="_blank" class="retro-button small">{{ $t('tickets') }}</a>
          <a v-else-if="event.googleMapsUrl" :href="event.googleMapsUrl" target="_blank" class="retro-button small secondary">{{ $t('location') }}</a>
        </div>
      </div>

      <div v-if="upcomingPerformances.length === 0" class="agenda-empty">
        New dates coming soon. Stay tuned!
      </div>

      <!-- PAST SHOWS TOGGLE -->
      <div v-if="pastPerformances.length > 0" class="past-shows-toggle-row">
        <button class="past-shows-toggle" @click="showPastShows = !showPastShows">
          <span v-if="!showPastShows">{{ $t('showPastShows', { count: pastPerformances.length }) }}</span>
          <span v-else>{{ $t('hidePastShows') }}</span>
        </button>
      </div>

      <!-- PAST PERFORMANCES (collapsible) -->
      <Transition name="crate">
        <div v-if="showPastShows" class="past-shows-section">
          <div class="past-shows-label">{{ $t('pastShows') }}</div>
          <div
            v-for="(event, index) in pastPerformances"
            :key="'past-' + index"
            class="agenda-item past-item"
          >
            <div class="agenda-date-col">
              <div class="agenda-date past-date">
                <div class="date-day">{{ formatDate(event.date, 'DD') }}</div>
                <div class="date-month">{{ formatDate(event.date, 'MMM') }}</div>
                <div class="date-year">{{ formatDate(event.date, 'YYYY') }}</div>
              </div>
            </div>

            <div class="agenda-info-col">
              <h3 class="agenda-venue past-venue">{{ event.venue }}</h3>
              <p v-if="event.address" class="agenda-address">{{ event.address }}</p>
              <p v-if="event.location" class="agenda-location">{{ event.location }}</p>
              <div class="agenda-details">
                <span v-if="event.time" class="agenda-detail">
                  <span class="icon-clock">🕒</span> {{ event.time }}
                </span>
                <span v-if="event.entranceFee >= 0" class="agenda-detail">
                  <span class="icon-ticket">🎟️</span>
                  <span v-if="event.entranceFee === 0" class="free-badge">{{ $t('free') }}</span>
                  <span v-else>€{{ event.entranceFee }}</span>
                </span>
                <button v-if="event.mapQuery" class="agenda-map-toggle" @click="toggleMap('past-' + index)" :title="$t('toggleMap')">
                  <span class="icon-pin">📍</span>
                </button>
              </div>

              <Transition name="fade">
                <div v-if="event.mapQuery && showMaps['past-' + index]" class="agenda-map">
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

            <div class="agenda-actions-col">
              <span class="played-badge">✓ Played</span>
              <button
                v-if="getMediaForDate(event.date).length > 0"
                class="retro-button small secondary media-btn"
                @click="openLightbox(event.date)"
              >{{ $t('viewMedia') }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
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

const props = defineProps({
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
const showPastShows = ref(false)
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

const formatDate = (dateStr, part) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (part === 'DD') return date.getDate();
  if (part === 'MMM') return date.toLocaleString(locale.value, { month: 'short' });
  if (part === 'YYYY') return date.getFullYear();
  return dateStr;
}
</script>

<style scoped>
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

.agenda-list {
  max-width: 900px;
  margin: 0 auto;
}

.agenda-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 2rem;
  padding: 2.5rem 1.5rem;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  transition: all 0.3s ease;
}

.agenda-item:hover {
  background-color: rgba(212, 175, 55, 0.03);
}

.agenda-date-col {
  display: flex;
  justify-content: center;
}

.agenda-date {
  text-align: center;
  border: 2px solid var(--color-gold);
  padding: 0.75rem;
  min-width: 90px;
  background-color: transparent;
  transition: all 0.3s ease;
}

.agenda-item:hover .agenda-date {
  background-color: var(--color-gold);
  color: var(--color-black);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
}

.date-day {
  font-family: var(--font-rock), cursive;
  font-size: 2rem;
  line-height: 1;
  font-weight: bold;
}

.date-month {
  font-family: var(--font-rock), cursive;
  font-size: 1rem;
  text-transform: uppercase;
  margin-top: 0.25rem;
}

.date-year {
  font-family: var(--font-rock), cursive;
  font-size: 0.75rem;
  text-transform: uppercase;
  margin-top: 0.2rem;
  color: #d1d5db;
  letter-spacing: 0.05em;
}

.agenda-info-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.agenda-venue {
  font-size: 1.75rem;
  color: var(--color-white);
  line-height: 1.2;
  transition: color 0.3s ease;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.agenda-item:hover .agenda-venue {
  color: var(--color-gold);
}

.agenda-details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
  color: #d1d5db;
  font-size: 1.1rem;
}

.agenda-detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-clock, .icon-ticket {
  color: var(--color-gold);
  font-size: 1rem;
}

.free-badge {
  color: var(--color-gold);
  font-family: var(--font-rock), cursive;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.agenda-address {
  width: 100%;
  margin: 0;
  font-size: 0.95rem;
  color: #d1d5db;
  letter-spacing: 0.02em;
}

.agenda-location {
  width: 100%;
  margin: 0 0 0.5rem 0;
  font-style: italic;
  font-size: 1rem;
  opacity: 0.8;
}

.agenda-map-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
}

.agenda-map-toggle:hover {
  transform: scale(1.2);
}

.icon-pin {
  font-size: 1.25rem;
}

.agenda-map {
  margin-top: 1.5rem;
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  overflow: hidden;
  max-width: 450px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  transition: border-color 0.3s ease;
}

.agenda-item:hover .agenda-map {
  border-color: var(--color-gold);
}

.agenda-actions-col {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  min-width: 140px;
}

.retro-button.small {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
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
  color: #d1d5db;
  font-style: italic;
  padding: 4rem 0;
  font-size: 1.25rem;
}

/* ── PAST SHOWS TOGGLE BUTTON ── */
.past-shows-toggle-row {
  display: flex;
  justify-content: center;
  padding: 2.5rem 0 1rem;
}

.past-shows-toggle {
  background: none;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  color: #d1d5db;
  font-family: var(--font-rock), cursive;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.75rem 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.past-shows-toggle:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: #d1d5db;
}

/* ── PAST SHOWS SECTION ── */
.past-shows-section {
  overflow: hidden;
}

.past-shows-label {
  text-align: center;
  font-family: var(--font-rock), cursive;
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #4b5563;
  padding: 1.5rem 0 0.5rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}

/* Past items: dimmed, grayscale feel */
.past-item {
  opacity: 0.45;
  filter: grayscale(60%);
  border-bottom-color: rgba(255, 255, 255, 0.07);
  transition: opacity 0.3s ease, filter 0.3s ease;
}

.past-item:hover {
  opacity: 0.75;
  filter: grayscale(20%);
  background-color: rgba(255, 255, 255, 0.02);
}

.past-date {
  border-color: #4b5563 !important;
}

.past-item:hover .past-date {
  background-color: #4b5563 !important;
  color: var(--color-white) !important;
  box-shadow: none !important;
}

.past-venue {
  color: #9ca3af !important;
}

.past-item:hover .past-venue {
  color: #d1d5db !important;
}

.played-badge {
  font-family: var(--font-rock), cursive;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #4b5563;
  border: 1px solid #374151;
  padding: 0.35rem 0.75rem;
  white-space: nowrap;
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
  max-height: 2000px;
}
.crate-leave-active {
  transition: max-height 0.4s ease, opacity 0.3s ease;
}
.crate-enter-from,
.crate-leave-to {
  max-height: 0;
  opacity: 0;
}

@media (max-width: 768px) {
  .agenda-item {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 1.5rem;
    padding: 2rem 1rem;
  }

  .agenda-date-col, .agenda-actions-col {
    justify-content: center;
  }

  .agenda-details {
    justify-content: center;
    gap: 1rem;
  }

  .agenda-map {
    margin: 1.5rem auto 0;
    width: 100%;
  }

  .agenda-venue {
    font-size: 1.5rem;
  }

  .played-badge {
    margin: 0 auto;
  }
  .media-btn {
    margin-top: 0.5rem;
  }
}
</style>
