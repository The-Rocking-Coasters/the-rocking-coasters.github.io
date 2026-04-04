<template>
  <section id="agenda" class="agenda-section">
    <div class="agenda-header">
      <h2 class="agenda-title italic">{{ title }}</h2>
      <div class="agenda-divider"></div>
    </div>

    <!-- ── UPCOMING GIGS ── -->
    <div class="gig-list">
      <article
        v-for="(event, index) in upcomingPerformances"
        :key="'up-' + index"
        class="gig-card"
        :style="{ '--i': index }"
      >
        <div class="gig-date">
          <span class="gig-weekday">{{ formatDate(event.date, 'DDD') }}</span>
          <span class="gig-day">{{ formatDate(event.date, 'DD') }}</span>
          <span class="gig-month">{{ formatDate(event.date, 'MMM') }}</span>
          <span class="gig-year">{{ formatDate(event.date, 'YYYY') }}</span>
        </div>

        <div class="gig-info">
          <h3 class="gig-venue">{{ event.venue }}</h3>
          <a
            v-if="event.googleMapsUrl"
            :href="event.googleMapsUrl"
            target="_blank"
            class="gig-address"
          >
            <MapPin :size="14" />
            <span>{{ event.address || event.venue }}</span>
            <ExternalLink :size="10" class="gig-external" />
          </a>
          <p v-else-if="event.address" class="gig-address-plain">
            {{ event.address }}
          </p>
          <div class="gig-meta">
            <span v-if="event.time" class="gig-meta-item">
              <Clock :size="14" /> {{ event.time }}
            </span>
            <span class="gig-meta-sep" v-if="event.time && event.entranceFee >= 0">&middot;</span>
            <span v-if="event.entranceFee >= 0" class="gig-meta-item">
              <Ticket :size="14" />
              <span v-if="event.entranceFee === 0" class="gig-free">{{ $t('free') }}</span>
              <span v-else>&euro;{{ event.entranceFee }}</span>
            </span>
          </div>
        </div>

        <div v-if="event.ticketUrl" class="gig-action">
          <a :href="event.ticketUrl" target="_blank" class="gig-ticket-btn">
            <Ticket :size="14" />
            {{ $t('tickets') }}
          </a>
        </div>
      </article>

      <div v-if="upcomingPerformances.length === 0" class="gig-empty">
        New dates coming soon. Stay tuned!
      </div>
    </div>

    <!-- ── ARCHIVE TOGGLE ── -->
    <div v-if="pastPerformances.length > 0" class="archive-toggle-row">
      <button class="archive-toggle-btn" @click="showArchive = !showArchive">
        <component :is="showArchive ? ChevronUp : ChevronDown" :size="14" class="archive-toggle-icon" />
        <Guitar :size="14" class="archive-guitar-icon" />
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
            <div class="archive-year-group">
              <article
                v-for="(event, index) in group"
                :key="'past-' + year + '-' + index"
                class="archive-card"
              >
                <div class="archive-date">
                  <span class="archive-date-day">{{ formatDate(event.date, 'DD') }}</span>
                  <span class="archive-date-month">{{ formatDate(event.date, 'MMM') }}</span>
                </div>

                <div class="archive-info">
                  <span class="archive-venue">{{ event.venue }}</span>
                  <span v-if="event.address" class="archive-address">{{ event.address }}</span>
                </div>

                <div class="archive-actions">
                  <Check :size="14" class="archive-check" />
                  <button
                    v-if="getMediaForDate(event.date).length > 0"
                    class="archive-media-btn"
                    @click="openLightbox(event.date)"
                  ><Camera :size="12" /> {{ $t('viewMedia') }}</button>
                </div>
              </article>
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
import { Clock, Ticket, MapPin, Check, ExternalLink, ChevronUp, ChevronDown, Guitar, Camera } from 'lucide-vue-next'

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
  if (part === 'DDD') return date.toLocaleString(locale.value, { weekday: 'short' }).toUpperCase()
  if (part === 'MMM') return date.toLocaleString(locale.value, { month: 'short' }).toUpperCase()
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
  text-align: center;
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

/* ── GIG LIST ── */
.gig-list {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ── GIG CARD (Desktop: ticket-stub) ── */
.gig-card {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  align-items: stretch;
  border: 1px solid rgba(212, 175, 55, 0.15);
  background: rgba(255, 255, 255, 0.02);
  transition: border-color 0.3s ease, background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  animation: gig-appear 0.5s ease both;
  animation-delay: calc(var(--i) * 0.08s);
}

.gig-card:hover {
  border-color: rgba(212, 175, 55, 0.4);
  background: rgba(212, 175, 55, 0.04);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

@keyframes gig-appear {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ── DATE STUB ── */
.gig-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 0.5rem;
  border-right: 2px dashed rgba(212, 175, 55, 0.2);
  background: rgba(212, 175, 55, 0.04);
  transition: background 0.3s ease;
  gap: 0.1rem;
}

.gig-card:hover .gig-date {
  background: rgba(212, 175, 55, 0.1);
}

.gig-weekday {
  font-family: var(--font-rock), cursive;
  font-size: 0.65rem;
  color: var(--color-gold);
  letter-spacing: 0.15em;
  line-height: 1;
}

.gig-day {
  font-family: var(--font-rock), cursive;
  font-size: 2rem;
  font-weight: bold;
  line-height: 1;
  color: var(--color-white);
  transition: color 0.3s ease;
}

.gig-card:hover .gig-day {
  color: var(--color-gold);
}

.gig-month {
  font-family: var(--font-rock), cursive;
  font-size: 0.8rem;
  color: #d1d5db;
  letter-spacing: 0.1em;
  line-height: 1;
}

.gig-year {
  font-family: var(--font-rock), cursive;
  font-size: 0.6rem;
  color: #9ca3af;
  letter-spacing: 0.1em;
  line-height: 1;
  margin-top: 0.1rem;
}

/* ── GIG INFO ── */
.gig-info {
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.35rem;
}

.gig-venue {
  font-family: var(--font-rock), cursive;
  font-size: 1.3rem;
  color: var(--color-white);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
  line-height: 1.15;
  transition: color 0.3s ease;
}

.gig-card:hover .gig-venue {
  color: var(--color-gold);
}

.gig-address {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-gold);
  opacity: 0.7;
  text-decoration: none;
  font-size: 0.85rem;
  transition: opacity 0.2s ease;
  width: fit-content;
}

.gig-address:hover {
  opacity: 1;
}

.gig-external {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.gig-address:hover .gig-external {
  opacity: 0.7;
}

.gig-address-plain {
  color: #b0b7c0;
  font-size: 0.85rem;
  margin: 0;
}

.gig-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.1rem;
}

.gig-meta-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #b0b7c0;
  font-size: 0.85rem;
}

.gig-meta-item svg {
  color: rgba(212, 175, 55, 0.7);
}

.gig-meta-sep {
  color: #9ca3af;
  font-size: 0.7rem;
}

.gig-free {
  color: var(--color-gold);
  font-family: var(--font-rock), cursive;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── GIG ACTION ── */
.gig-action {
  display: flex;
  align-items: center;
  padding-right: 1.25rem;
}

.gig-ticket-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.25rem;
  background: var(--color-gold);
  color: var(--color-black);
  font-family: var(--font-rock), cursive;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-decoration: none;
  transition: background 0.2s ease, transform 0.2s ease;
  white-space: nowrap;
  font-weight: bold;
}

.gig-ticket-btn:hover {
  background: var(--color-gold-light, #F5E1A4);
  transform: scale(1.03);
}

/* ── EMPTY STATE ── */
.gig-empty {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 4rem 0;
  font-size: 1.1rem;
}

/* ══════════════════════════════════
   ARCHIVE
   ══════════════════════════════════ */

/* ── ARCHIVE TOGGLE ── */
.archive-toggle-row {
  max-width: 860px;
  margin: 3rem auto 0;
  display: flex;
  justify-content: center;
}

.archive-toggle-btn {
  background: none;
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: #9ca3af;
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
  border-color: rgba(212, 175, 55, 0.6);
  color: #d1d5db;
}

.archive-toggle-icon {
  color: var(--color-gold);
  flex-shrink: 0;
  opacity: 0.6;
}

.archive-guitar-icon {
  color: var(--color-gold);
  flex-shrink: 0;
  opacity: 0.7;
}

/* ── ARCHIVE SECTION ── */
.archive-section {
  max-width: 860px;
  margin: 0 auto;
  overflow: hidden;
}

.archive-inner {
  padding-top: 2rem;
  border-top: 1px dashed rgba(212, 175, 55, 0.15);
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
  background: rgba(212, 175, 55, 0.15);
}

.archive-heading-text {
  font-family: var(--font-rock), cursive;
  font-size: 0.85rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #9ca3af;
  white-space: nowrap;
}

/* ── YEAR GROUPS ── */
.archive-year-label {
  font-family: var(--font-rock), cursive;
  font-size: 1.1rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-gold);
  padding: 1.5rem 0 0.6rem;
  margin-top: 0.5rem;
}

.archive-year-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

/* ── ARCHIVE CARDS (mini ticket stubs) ── */
.archive-card {
  display: grid;
  grid-template-columns: 60px 1fr auto;
  align-items: stretch;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  transition: border-color 0.25s ease, background 0.25s ease;
}

.archive-card:hover {
  border-color: rgba(212, 175, 55, 0.2);
  background: rgba(212, 175, 55, 0.03);
}

.archive-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 0.35rem;
  border-right: 2px dashed rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  transition: border-color 0.25s ease;
}

.archive-card:hover .archive-date {
  border-right-color: rgba(212, 175, 55, 0.15);
}

.archive-date-day {
  font-family: var(--font-rock), cursive;
  font-size: 1.3rem;
  color: #d1d5db;
  line-height: 1;
}

.archive-date-month {
  font-family: var(--font-rock), cursive;
  font-size: 0.65rem;
  text-transform: uppercase;
  color: #9ca3af;
  letter-spacing: 0.05em;
  line-height: 1;
  margin-top: 0.1rem;
}

.archive-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.15rem;
  padding: 0.6rem 1rem;
  min-width: 0;
}

.archive-venue {
  font-family: var(--font-rock), cursive;
  font-size: 1rem;
  color: #d1d5db;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  transition: color 0.25s ease;
}

.archive-card:hover .archive-venue {
  color: var(--color-gold);
}

.archive-address {
  font-size: 0.75rem;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.archive-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.85rem;
}

.archive-check {
  color: #9ca3af;
  opacity: 0.5;
  flex-shrink: 0;
  transition: color 0.25s ease, opacity 0.25s ease;
}

.archive-card:hover .archive-check {
  color: var(--color-gold);
  opacity: 0.8;
}

.archive-media-btn {
  background: none;
  border: 1px solid rgba(212, 175, 55, 0.35);
  color: var(--color-gold);
  opacity: 0.7;
  font-family: var(--font-body), sans-serif;
  font-size: 0.75rem;
  padding: 0.3rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.archive-media-btn:hover {
  opacity: 1;
  border-color: var(--color-gold);
  background: rgba(212, 175, 55, 0.08);
}

/* ── TRANSITIONS ── */
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

/* ══════════════════════════════════
   MOBILE
   ══════════════════════════════════ */
@media (max-width: 768px) {

  .agenda-section {
    padding: 3.5rem 0.75rem;
  }

  .agenda-header {
    margin-bottom: 2.5rem;
  }

  /* ── GIG CARDS: vertical layout ── */
  .gig-list {
    gap: 0.6rem;
  }

  .gig-card {
    grid-template-columns: 1fr;
  }

  .gig-card:hover {
    transform: none;
    box-shadow: none;
  }

  /* Date becomes a horizontal ribbon */
  .gig-date {
    flex-direction: row;
    align-items: baseline;
    gap: 0.4rem;
    padding: 0.55rem 0.85rem;
    border-right: none;
    border-bottom: 2px dashed rgba(212, 175, 55, 0.2);
    background: rgba(212, 175, 55, 0.07);
  }

  .gig-weekday {
    font-size: 0.75rem;
  }

  .gig-day {
    font-size: 1.2rem;
  }

  .gig-month {
    font-size: 0.8rem;
  }

  .gig-year {
    font-size: 0.7rem;
    margin-top: 0;
  }

  /* Info section */
  .gig-info {
    padding: 0.75rem 0.85rem;
    gap: 0.3rem;
  }

  .gig-venue {
    font-size: 1.1rem;
  }

  .gig-address {
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .gig-address .gig-external {
    opacity: 0.5;
  }

  .gig-meta {
    margin-top: 0.15rem;
  }

  .gig-meta-item {
    font-size: 0.8rem;
  }

  /* Ticket button: full width inside card */
  .gig-action {
    padding: 0 0.85rem 0.75rem;
  }

  .gig-ticket-btn {
    width: 100%;
    justify-content: center;
    padding: 0.7rem 1rem;
    font-size: 0.85rem;
  }

  /* ── ARCHIVE MOBILE ── */
  .archive-year-label {
    font-size: 0.95rem;
    padding: 1.25rem 0 0.5rem;
  }

  .archive-year-group {
    gap: 0.35rem;
  }

  .archive-card {
    grid-template-columns: 1fr;
    border-color: rgba(212, 175, 55, 0.1);
  }

  .archive-date {
    flex-direction: row;
    align-items: baseline;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    border-right: none;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.02);
  }

  .archive-date-day {
    font-size: 1rem;
    color: #d1d5db;
  }

  .archive-date-month {
    font-size: 0.7rem;
    color: #b0b7c0;
  }

  .archive-info {
    padding: 0.5rem 0.75rem;
  }

  .archive-venue {
    font-size: 0.95rem;
    color: #e5e7eb;
  }

  .archive-address {
    color: #b0b7c0;
  }

  .archive-actions {
    padding: 0 0.75rem 0.5rem;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .archive-check {
    opacity: 0.4;
  }

  .archive-media-btn {
    border-color: rgba(212, 175, 55, 0.5);
    color: var(--color-gold);
    opacity: 0.85;
    font-size: 0.8rem;
    padding: 0.35rem 0.85rem;
  }

  .archive-heading-text {
    color: #b0b7c0;
  }

  .archive-heading-line {
    background: rgba(212, 175, 55, 0.15);
  }

  .archive-inner {
    border-top-color: rgba(212, 175, 55, 0.15);
  }
}
</style>
