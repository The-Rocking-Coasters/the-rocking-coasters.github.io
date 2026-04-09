<script setup lang="ts">
import { toPng } from 'html-to-image'
import { Calendar, Check, ChevronDown, Download, Film, Image, Lock, LogOut, Move, Pencil, Play, RotateCcw, SlidersHorizontal, X } from 'lucide-vue-next'
import { HERO_VISUAL } from '../../hero.config'

definePageMeta({ layout: 'blank' })

// ── Simple passcode gate ──
const PASSCODE = 'rock56'
const accessCookie = useCookie('trc-social-access', { maxAge: 60 * 60 * 24 * 90 })
const unlocked = ref(accessCookie.value === 'granted')
const passcodeInput = ref('')
const passcodeError = ref(false)

function submitPasscode() {
  if (passcodeInput.value.toLowerCase() === PASSCODE) {
    accessCookie.value = 'granted'
    unlocked.value = true
    passcodeError.value = false
  } else {
    passcodeError.value = true
  }
}

function logout() {
  accessCookie.value = null
  unlocked.value = false
  passcodeInput.value = ''
}

const { data: performances } = await useAsyncData('performances', () =>
  queryCollection('performances').all()
)

const { data: mediaList } = await useFetch('/api/media-list', { default: () => [] })

const imageItems = computed(() =>
  (mediaList.value ?? []).filter(
    (item: any) => item.type === 'image' && !item.url.includes('-hero')
  )
)

const videoItems = computed(() =>
  (mediaList.value ?? []).filter(
    (item: any) => item.type === 'video' && !item.url.includes('-hero') && !item.url.endsWith('.webm')
  )
)

const today = new Date()
today.setHours(0, 0, 0, 0)

const upcomingPerformances = computed(() => {
  if (!performances.value) return []
  return performances.value
    .filter(p => new Date(p.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

const allPerformances = computed(() => {
  if (!performances.value) return []
  return [...performances.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

const selectedPerformanceId = ref<string | null>('__next__')

const selectedPerformance = computed(() => {
  if (selectedPerformanceId.value === null) return null
  if (selectedPerformanceId.value === '__next__') return upcomingPerformances.value[0] || null
  return allPerformances.value.find(p => p.date === selectedPerformanceId.value) || null
})

const perfDropdownLabel = computed(() => {
  if (selectedPerformanceId.value === null) return 'Geen optreden'
  if (selectedPerformanceId.value === '__next__') {
    const p = upcomingPerformances.value[0]
    return p ? `${new Date(p.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} — ${p.venue}` : 'Geen optreden'
  }
  const p = selectedPerformance.value
  return p ? `${new Date(p.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} — ${p.venue}` : 'Geen optreden'
})

function selectPerformance(id: string | null) {
  selectedPerformanceId.value = id
  perfDropdownOpen.value = false
}

// ── Easter calculation (Anonymous Gregorian algorithm) ──
function computeEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getDutchHoliday(dateStr: string): string | null {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const key = toKey(date)

  const fixed: Record<string, string> = {
    [`${year}-01-01`]: 'Nieuwjaarsdag',
    [`${year}-04-27`]: 'Koningsdag',
    [`${year}-05-05`]: 'Bevrijdingsdag',
    [`${year}-12-25`]: 'Eerste Kerstdag',
    [`${year}-12-26`]: 'Tweede Kerstdag',
  }
  if (fixed[key]) return fixed[key]

  const easter = computeEaster(year)
  const movable: Record<string, string> = {
    [toKey(addDays(easter, -2))]: 'Goede Vrijdag',
    [toKey(easter)]: 'Eerste Paasdag',
    [toKey(addDays(easter, 1))]: 'Tweede Paasdag',
    [toKey(addDays(easter, 39))]: 'Hemelvaartsdag',
    [toKey(addDays(easter, 49))]: 'Eerste Pinksterdag',
    [toKey(addDays(easter, 50))]: 'Tweede Pinksterdag',
  }
  return movable[key] || null
}

const holiday = computed(() => {
  if (!selectedPerformance.value) return null
  return getDutchHoliday(selectedPerformance.value.date)
})

const formattedDate = computed(() => {
  if (!selectedPerformance.value) return ''
  const date = new Date(selectedPerformance.value.date)
  const weekday = date.toLocaleString('nl-NL', { weekday: 'long' })
  const day = date.getDate()
  const month = date.toLocaleString('nl-NL', { month: 'long' })
  const year = date.getFullYear()
  return `${weekday} ${day} ${month} ${year}`
})

// ── Toolbar state ──
const toolbarOpen = ref(false)
const perfDropdownOpen = ref(false)
const bgOpacity = ref(HERO_VISUAL.opacity)
const bgImage = ref('/images/media/2026-03-29-4.webp')
const showMediaPicker = ref(false)
const exporting = ref(false)
const cardRef = ref<HTMLElement | null>(null)

// ── Draggable elements ──
const logoPos = reactive({ x: 0, y: 0 })
const logoScale = ref(1.2)
const datePos = reactive({ x: 0, y: 0 })
const venuePos = reactive({ x: 0, y: 0 })
const isDragging = ref(false)
const activeDragEl = ref<HTMLElement | null>(null)

const SNAP_THRESHOLD = 6

function beginDrag(e: MouseEvent, pos: { x: number; y: number }) {
  const startX = e.clientX
  const startY = e.clientY
  const originX = pos.x
  const originY = pos.y
  const el = (e.currentTarget as HTMLElement)
  const card = cardRef.value
  isDragging.value = true
  activeDragEl.value = el

  const onMove = (ev: MouseEvent) => {
    ev.preventDefault()
    let newX = originX + (ev.clientX - startX)
    let newY = originY + (ev.clientY - startY)

    // Snap to center
    if (card && el) {
      const cardRect = card.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const elCenterX = elRect.left + elRect.width / 2
      const elCenterY = elRect.top + elRect.height / 2
      const cardCenterX = cardRect.left + cardRect.width / 2
      const cardCenterY = cardRect.top + cardRect.height / 2

      if (Math.abs(elCenterX - cardCenterX) < SNAP_THRESHOLD) {
        newX = newX - (elCenterX - cardCenterX)
      }
      if (Math.abs(elCenterY - cardCenterY) < SNAP_THRESHOLD) {
        newY = newY - (elCenterY - cardCenterY)
      }
    }

    pos.x = newX
    pos.y = newY
  }

  const onUp = () => {
    isDragging.value = false
    activeDragEl.value = null
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

const guidesVisible = ref(false)
const guideH = ref(false)
const guideV = ref(false)

watchEffect(() => {
  if (!isDragging.value || !activeDragEl.value || !cardRef.value) {
    guidesVisible.value = false
    guideH.value = false
    guideV.value = false
    return
  }
  guidesVisible.value = true
  const cardRect = cardRef.value.getBoundingClientRect()
  const elRect = activeDragEl.value.getBoundingClientRect()
  const elCenterX = elRect.left + elRect.width / 2
  const elCenterY = elRect.top + elRect.height / 2
  const cardCenterX = cardRect.left + cardRect.width / 2
  const cardCenterY = cardRect.top + cardRect.height / 2
  guideV.value = Math.abs(elCenterX - cardCenterX) < SNAP_THRESHOLD + 1
  guideH.value = Math.abs(elCenterY - cardCenterY) < SNAP_THRESHOLD + 1
})

function onLogoWheel(e: WheelEvent) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.05 : 0.05
  logoScale.value = Math.min(3, Math.max(0.2, logoScale.value + delta))
}

function beginResize(e: MouseEvent, _corner: string) {
  const startX = e.clientX
  const startY = e.clientY
  const originScale = logoScale.value

  const onMove = (ev: MouseEvent) => {
    ev.preventDefault()
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY
    // Use diagonal distance for uniform scaling
    const dist = (dx + dy) * 0.005
    logoScale.value = Math.min(3, Math.max(0.2, originScale + dist))
  }

  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function resetPositions() {
  logoPos.x = 0; logoPos.y = 0
  logoScale.value = 1.2
  datePos.x = 0; datePos.y = 0
  venuePos.x = 0; venuePos.y = 0
}

// ── Frame scrubber state ──
const frameScrubberVideo = ref<any>(null)
const frameScrubberEl = ref<HTMLVideoElement | null>(null)
const frameScrubberCanvas = ref<HTMLCanvasElement | null>(null)
const frameScrubberTime = ref(0)
const frameScrubberDuration = ref(1)
const frameScrubberReady = ref(false)

function openFrameScrubber(item: any) {
  frameScrubberVideo.value = item
  frameScrubberTime.value = 0
  frameScrubberReady.value = false
}

function onFrameScrubberLoaded() {
  const video = frameScrubberEl.value
  if (!video) return
  frameScrubberDuration.value = video.duration
  frameScrubberTime.value = 0
  frameScrubberReady.value = true
  drawFramePreview()
}

function onFrameScrubberSeeked() {
  drawFramePreview()
}

function drawFramePreview() {
  const video = frameScrubberEl.value
  const canvas = frameScrubberCanvas.value
  if (!video || !canvas) return
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(video, 0, 0)
}

function seekFrameScrubber(time: number) {
  frameScrubberTime.value = time
  const video = frameScrubberEl.value
  if (video) video.currentTime = time
}

function confirmFrame() {
  const canvas = frameScrubberCanvas.value
  if (!canvas) return
  bgImage.value = canvas.toDataURL('image/png')
  frameScrubberVideo.value = null
  showMediaPicker.value = false
}

function cancelFrameScrubber() {
  frameScrubberVideo.value = null
}

function selectBackground(url: string) {
  bgImage.value = url
  showMediaPicker.value = false
}

async function imgToDataUrl(src: string): Promise<string> {
  // Already a data URL
  if (src.startsWith('data:')) return src

  const resp = await fetch(src)
  const blob = await resp.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

async function saveToImage() {
  if (!cardRef.value) return

  // Convert reactive image sources to data URLs so html-to-image can embed them
  const originalBg = bgImage.value
  bgImage.value = await imgToDataUrl(originalBg)

  exporting.value = true
  await nextTick()

  try {
    const dataUrl = await toPng(cardRef.value, {
      width: cardRef.value.offsetWidth,
      height: cardRef.value.offsetHeight,
      pixelRatio: 2,
      // Inline all remaining images (logo SVG etc.)
      fetchRequestInit: { cache: 'force-cache' },
      includeQueryParams: true,
    })
    const link = document.createElement('a')
    link.download = `trc-${selectedPerformance.value?.date || 'social'}.png`
    link.href = dataUrl
    link.click()
  } finally {
    bgImage.value = originalBg
    exporting.value = false
  }
}

useSeoMeta({
  title: 'The Rocking Coasters — Social Card',
  robots: 'noindex, nofollow',
})
</script>

<template>
  <!-- Passcode gate -->
  <div v-if="!unlocked" class="gate">
    <div class="gate-card">
      <Lock :size="32" class="gate-icon" />
      <h1 class="gate-title">Social Card Tool</h1>
      <p class="gate-hint">Voer de toegangscode in</p>
      <form class="gate-form" @submit.prevent="submitPasscode">
        <input
          v-model="passcodeInput"
          type="password"
          class="gate-input"
          :class="{ 'gate-input-error': passcodeError }"
          placeholder="Toegangscode"
          autocomplete="off"
          autofocus
          @input="passcodeError = false"
        />
        <button type="submit" class="toolbar-btn toolbar-btn-save">Doorgaan</button>
      </form>
      <p v-if="passcodeError" class="gate-error">Onjuiste code</p>
    </div>
  </div>

  <div v-else class="social-page">
    <!-- Toolbar toggle (hidden during export) -->
    <button v-if="!exporting && !toolbarOpen" class="toolbar-fab" @click="toolbarOpen = true" title="Instellingen">
      <Pencil :size="18" />
    </button>

    <!-- Toolbar panel -->
    <Transition name="toolbar-slide">
      <div v-if="!exporting && toolbarOpen" class="toolbar">
        <!-- Row 1: Performance picker -->
        <div class="toolbar-row">
          <div class="perf-dropdown">
            <button class="perf-dropdown-trigger" @click="perfDropdownOpen = !perfDropdownOpen">
              <Calendar :size="14" />
              <span class="perf-dropdown-label">{{ perfDropdownLabel }}</span>
              <ChevronDown :size="14" class="perf-dropdown-chevron" :class="{ open: perfDropdownOpen }" />
            </button>
            <Transition name="picker-slide">
              <div v-if="perfDropdownOpen" class="perf-dropdown-menu">
                <button
                  class="perf-dropdown-item"
                  :class="{ active: selectedPerformanceId === '__next__' }"
                  @click="selectPerformance('__next__')"
                >Volgend optreden</button>
                <button
                  class="perf-dropdown-item"
                  :class="{ active: selectedPerformanceId === null }"
                  @click="selectPerformance(null)"
                >Geen optreden</button>
                <div class="perf-dropdown-divider"></div>
                <button
                  v-for="p in allPerformances"
                  :key="p.date"
                  class="perf-dropdown-item"
                  :class="{ active: selectedPerformanceId === p.date }"
                  @click="selectPerformance(p.date)"
                >{{ new Date(p.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) }} — {{ p.venue }}</button>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Row 2: Background -->
        <div class="toolbar-row">
          <div class="toolbar-slider-row">
            <label class="toolbar-label"><Image :size="14" /> Achtergrond</label>
            <button class="toolbar-btn toolbar-btn-compact" @click="showMediaPicker = !showMediaPicker">
              Wijzig
            </button>
          </div>
        </div>

        <!-- Row 3: Opacity -->
        <div class="toolbar-row">
          <div class="toolbar-slider-row">
            <label class="toolbar-label"><SlidersHorizontal :size="14" /> Opacity</label>
            <input v-model.number="bgOpacity" type="range" min="0" max="1" step="0.05" class="toolbar-slider" />
            <span class="toolbar-value">{{ Math.round(bgOpacity * 100) }}%</span>
          </div>
        </div>

        <!-- Row 4: Logo scale -->
        <div class="toolbar-row">
          <div class="toolbar-slider-row">
            <label class="toolbar-label">Logo</label>
            <input v-model.number="logoScale" type="range" min="0.2" max="3" step="0.05" class="toolbar-slider" />
            <span class="toolbar-value">{{ Math.round(logoScale * 100) }}%</span>
          </div>
        </div>

        <!-- Row 5: Actions -->
        <div class="toolbar-row toolbar-row-actions">
          <button class="toolbar-btn toolbar-btn-fill" @click="resetPositions" title="Reset posities">
            <RotateCcw :size="14" />
            Reset
          </button>
        </div>

        <!-- Row 4: Save + utils -->
        <div class="toolbar-row">
          <button class="toolbar-btn toolbar-btn-save toolbar-btn-fill" @click="saveToImage">
            <Download :size="14" />
            Opslaan als afbeelding
          </button>
          <button class="toolbar-btn toolbar-btn-icon" @click="logout" title="Uitloggen">
            <LogOut :size="14" />
          </button>
          <button class="toolbar-btn toolbar-btn-icon" @click="toolbarOpen = false" title="Sluiten">
            <X :size="14" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Media picker panel -->
    <Transition name="picker-slide">
      <div v-if="showMediaPicker && !exporting" class="picker-panel">
        <div class="picker-header">
          <span class="picker-title">Kies achtergrond</span>
          <button class="picker-close" @click="showMediaPicker = false">
            <X :size="18" />
          </button>
        </div>
        <div class="picker-grid">
          <button
            class="picker-item"
            :class="{ active: bgImage === '/images/band.webp' }"
            @click="selectBackground('/images/band.webp')"
          >
            <img src="/images/band.webp" alt="Band foto" class="picker-thumb" />
          </button>
          <button
            v-for="item in imageItems"
            :key="item.url"
            class="picker-item"
            :class="{ active: bgImage === item.url }"
            @click="selectBackground(item.url)"
          >
            <img :src="item.thumbnail ?? item.url" :alt="item.alt || ''" class="picker-thumb" />
          </button>
          <button
            v-for="item in videoItems"
            :key="'vid-' + item.url"
            class="picker-item picker-item-video"
            @click="openFrameScrubber(item)"
          >
            <video
              v-if="item.thumbnail"
              :src="item.thumbnail"
              class="picker-thumb"
              muted
              playsinline
              loop
              autoplay
            />
            <div v-else class="picker-thumb picker-thumb-placeholder">
              <Film :size="20" />
            </div>
            <div class="picker-video-badge">
              <Play :size="10" />
            </div>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Frame scrubber overlay -->
    <Transition name="picker-slide">
      <div v-if="frameScrubberVideo && !exporting" class="frame-scrubber-overlay">
        <div class="frame-scrubber-panel">
          <div class="picker-header">
            <span class="picker-title">Kies een frame</span>
            <button class="picker-close" @click="cancelFrameScrubber">
              <X :size="18" />
            </button>
          </div>

          <div class="frame-scrubber-preview">
            <canvas ref="frameScrubberCanvas" class="frame-scrubber-canvas" />
            <video
              ref="frameScrubberEl"
              :src="frameScrubberVideo.url"
              class="frame-scrubber-video-hidden"
              muted
              playsinline
              preload="auto"
              crossorigin="anonymous"
              @loadeddata="onFrameScrubberLoaded"
              @seeked="onFrameScrubberSeeked"
            />
          </div>

          <div v-if="frameScrubberReady" class="frame-scrubber-controls">
            <input
              :value="frameScrubberTime"
              type="range"
              :min="0"
              :max="frameScrubberDuration"
              :step="0.04"
              class="frame-scrubber-slider"
              @input="seekFrameScrubber(Number(($event.target as HTMLInputElement).value))"
            />
            <span class="frame-scrubber-timecode">
              {{ frameScrubberTime.toFixed(2) }}s / {{ frameScrubberDuration.toFixed(2) }}s
            </span>
          </div>
          <div v-else class="frame-scrubber-loading">Laden...</div>

          <div class="frame-scrubber-actions">
            <button class="toolbar-btn" @click="cancelFrameScrubber">Annuleren</button>
            <button class="toolbar-btn toolbar-btn-save" :disabled="!frameScrubberReady" @click="confirmFrame">
              <Check :size="14" />
              Gebruik dit frame
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Social card -->
    <div ref="cardRef" class="social-card">
      <img
        :src="bgImage"
        alt=""
        class="social-bg"
        :style="{ opacity: bgOpacity }"
      />
      <div class="social-overlay"></div>

      <!-- Center guides -->
      <div v-if="guidesVisible && !exporting" class="guides">
        <div v-if="guideV" class="guide guide-v"></div>
        <div v-if="guideH" class="guide guide-h"></div>
      </div>

      <div class="social-content">
        <!-- Date block (top 1/3) -->
        <div
          v-if="selectedPerformance"
          class="draggable"
          :class="{ 'draggable-hint': !exporting }"
          :style="{ transform: `translate(calc(-50% + ${datePos.x}px), ${datePos.y}px)` }"
          @mousedown.prevent="beginDrag($event, datePos)"
        >
          <Move v-if="!exporting" :size="16" class="drag-handle" />
          <div class="social-info">
            <p v-if="holiday" class="social-holiday">{{ holiday }}</p>
            <p class="social-date">{{ formattedDate }}</p>
            <p class="social-time">Aanvang {{ selectedPerformance.time }} uur</p>
          </div>
        </div>

        <!-- Logo (center, resizable) -->
        <div
          class="draggable"
          :class="{ 'draggable-hint': !exporting }"
          :style="{ transform: `translate(calc(-50% + ${logoPos.x}px), calc(-50% + ${logoPos.y}px)) scale(${logoScale})` }"
          @mousedown.prevent="beginDrag($event, logoPos)"
          @wheel.prevent="onLogoWheel"
        >
          <Move v-if="!exporting" :size="16" class="drag-handle" />
          <img
            src="/images/logo.svg"
            alt="The Rocking Coasters"
            class="social-logo"
            draggable="false"
          />
          <div v-if="!exporting" class="resize-corners">
            <span
              v-for="corner in ['tl','tr','bl','br']"
              :key="corner"
              class="resize-corner"
              :class="`resize-${corner}`"
              @mousedown.prevent.stop="beginResize($event, corner)"
            ></span>
          </div>
        </div>

        <!-- Venue block (bottom 1/3) -->
        <div
          v-if="selectedPerformance"
          class="draggable"
          :class="{ 'draggable-hint': !exporting }"
          :style="{ transform: `translate(calc(-50% + ${venuePos.x}px), ${venuePos.y}px)` }"
          @mousedown.prevent="beginDrag($event, venuePos)"
        >
          <Move v-if="!exporting" :size="16" class="drag-handle" />
          <div class="social-info">
            <p class="social-venue">{{ selectedPerformance.venue }}</p>
            <p v-if="selectedPerformance.address" class="social-address">{{ selectedPerformance.address }}</p>
            <p class="social-entrance">
              <span v-if="selectedPerformance.entranceFee === 0">Gratis entree</span>
              <span v-else-if="selectedPerformance.entranceFee === -1">Entree nog niet bekend</span>
              <span v-else>Entree &euro;{{ selectedPerformance.entranceFee }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── PASSCODE GATE ── */
.gate {
  width: 100vw;
  height: 100vh;
  background: var(--color-black);
  display: flex;
  align-items: center;
  justify-content: center;
}

.gate-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem;
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  max-width: 360px;
  width: 90vw;
}

.gate-icon {
  color: var(--color-gold);
  opacity: 0.6;
}

.gate-title {
  font-size: 1.5rem;
  margin: 0;
}

.gate-hint {
  font-family: var(--font-body), sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.gate-form {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  margin-top: 0.5rem;
  box-sizing: border-box;
}

.gate-form .toolbar-btn-save {
  flex-shrink: 0;
}

.gate-input {
  flex: 1;
  min-width: 0;
  padding: 0.55rem 0.85rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 4px;
  color: var(--color-white);
  font-family: var(--font-body), sans-serif;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.gate-input:focus {
  border-color: var(--color-gold);
}

.gate-input-error {
  border-color: #e53e3e;
}

.gate-error {
  font-family: var(--font-body), sans-serif;
  font-size: 0.8rem;
  color: #e53e3e;
}

.social-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--color-black);
}

/* ── TOOLBAR FAB ── */
.toolbar-fab {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 100;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(212, 175, 55, 0.3);
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  color: var(--color-gold);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0.6;
}

.toolbar-fab:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.85);
  border-color: var(--color-gold);
}

/* ── TOOLBAR PANEL ── */
.toolbar {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 100;
  width: 320px;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  overflow: visible;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.toolbar-row:last-child {
  border-bottom: none;
}

.toolbar-row-actions {
  gap: 0.35rem;
}

.toolbar-slide-enter-active,
.toolbar-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.toolbar-slide-enter-from,
.toolbar-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

/* ── SLIDER ROWS ── */
.toolbar-slider-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.toolbar-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-rock), cursive;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
  min-width: 5.5rem;
}

.toolbar-label svg {
  color: var(--color-gold);
  opacity: 0.6;
}

.toolbar-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.toolbar-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-gold);
  border: 2px solid rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition: transform 0.15s;
}

.toolbar-slider::-webkit-slider-thumb:hover {
  transform: scale(1.25);
}

.toolbar-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-gold);
  border: 2px solid rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.toolbar-slider::-moz-range-track {
  background: rgba(255, 255, 255, 0.1);
  height: 4px;
  border-radius: 2px;
}

.toolbar-value {
  font-family: var(--font-rock), cursive;
  font-size: 1rem;
  color: var(--color-gold);
  min-width: 3rem;
  text-align: right;
}

/* ── BUTTONS ── */
.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(212, 175, 55, 0.2);
  color: rgba(255, 255, 255, 0.75);
  font-family: var(--font-body), sans-serif;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.toolbar-btn:hover {
  border-color: var(--color-gold);
  color: var(--color-gold);
  background: rgba(212, 175, 55, 0.08);
}

.toolbar-btn-fill {
  flex: 1;
}

.toolbar-btn-compact {
  padding: 0.3rem 0.7rem;
  font-size: 0.65rem;
  margin-left: auto;
}

.toolbar-btn-icon {
  padding: 0.5rem;
  opacity: 0.4;
  flex-shrink: 0;
}

.toolbar-btn-icon:hover {
  opacity: 1;
}

.toolbar-btn-save {
  background: var(--color-gold);
  color: var(--color-black);
  border-color: var(--color-gold);
  font-weight: bold;
}

.toolbar-btn-save:hover {
  background: var(--color-gold-light);
  color: var(--color-black);
}

/* ── PERFORMANCE DROPDOWN ── */
.perf-dropdown {
  position: relative;
  width: 100%;
}

.perf-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0.45rem 0.7rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.85);
  font-family: var(--font-body), sans-serif;
  font-size: 0.75rem;
  cursor: pointer;
  transition: border-color 0.2s;
  text-align: left;
}

.perf-dropdown-trigger:hover {
  border-color: var(--color-gold);
}

.perf-dropdown-trigger svg:first-child {
  color: var(--color-gold);
  opacity: 0.7;
  flex-shrink: 0;
}

.perf-dropdown-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.perf-dropdown-chevron {
  opacity: 0.5;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.perf-dropdown-chevron.open {
  transform: rotate(180deg);
}

.perf-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: -0.75rem;
  right: -0.75rem;
  background: rgba(10, 10, 10, 0.98);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 0 0 8px 8px;
  max-height: 320px;
  overflow-y: auto;
  z-index: 110;
}

.perf-dropdown-item {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.65);
  font-family: var(--font-body), sans-serif;
  font-size: 0.75rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.perf-dropdown-item:hover {
  background: rgba(212, 175, 55, 0.08);
  color: var(--color-white);
}

.perf-dropdown-item.active {
  color: var(--color-gold);
  background: rgba(212, 175, 55, 0.06);
}

.perf-dropdown-divider {
  height: 1px;
  background: rgba(212, 175, 55, 0.1);
  margin: 0.2rem 0;
}

/* ── MEDIA PICKER ── */
.picker-panel {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 101;
  width: 380px;
  max-height: calc(100vh - 2rem);
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
}

.picker-title {
  font-family: var(--font-rock), cursive;
  font-size: 1rem;
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.picker-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0.2rem;
  display: flex;
  transition: color 0.2s;
}
.picker-close:hover { color: var(--color-white); }

.picker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  padding: 0.75rem;
  overflow-y: auto;
}

.picker-item {
  aspect-ratio: 1;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  background: none;
  padding: 0;
  transition: border-color 0.2s ease;
}

.picker-item:hover {
  border-color: rgba(212, 175, 55, 0.5);
}

.picker-item.active {
  border-color: var(--color-gold);
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.picker-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.picker-item-video {
  position: relative;
}

.picker-video-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: var(--color-gold);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-thumb-placeholder {
  background: #222;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── FRAME SCRUBBER ── */
.frame-scrubber-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.frame-scrubber-panel {
  width: 700px;
  max-width: 95vw;
  background: rgba(10, 10, 10, 0.98);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.frame-scrubber-preview {
  position: relative;
  background: #000;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.frame-scrubber-canvas {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.frame-scrubber-video-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.frame-scrubber-controls {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-top: 1px solid rgba(212, 175, 55, 0.15);
}

.frame-scrubber-slider {
  flex: 1;
  accent-color: var(--color-gold);
  cursor: pointer;
}

.frame-scrubber-timecode {
  font-family: var(--font-body), sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  min-width: 10rem;
  text-align: right;
}

.frame-scrubber-loading {
  padding: 1.5rem;
  text-align: center;
  font-family: var(--font-body), sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.frame-scrubber-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(212, 175, 55, 0.15);
}

.picker-slide-enter-active,
.picker-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.picker-slide-enter-from,
.picker-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── DRAGGABLE ── */
.draggable {
  position: relative;
  touch-action: none;
  user-select: none;
}

.draggable-hint {
  cursor: grab;
}

.draggable-hint:active {
  cursor: grabbing;
}

.draggable-hint:hover .drag-handle {
  opacity: 0.8;
}

.drag-handle {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  color: var(--color-gold);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.8));
  z-index: 20;
}

/* ── RESIZE HANDLES ── */
.resize-corners {
  position: absolute;
  inset: -4px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}

.draggable-hint:hover .resize-corners {
  opacity: 1;
}

.resize-corner {
  position: absolute;
  width: 10px;
  height: 10px;
  border: 2px solid var(--color-gold);
  background: rgba(0, 0, 0, 0.6);
  pointer-events: auto;
  cursor: nwse-resize;
}

.resize-tl { top: 0; left: 0; cursor: nwse-resize; }
.resize-tr { top: 0; right: 0; cursor: nesw-resize; }
.resize-bl { bottom: 0; left: 0; cursor: nesw-resize; }
.resize-br { bottom: 0; right: 0; cursor: nwse-resize; }

/* ── CENTER GUIDES ── */
.guides {
  position: absolute;
  inset: 0;
  z-index: 50;
  pointer-events: none;
}

.guide {
  position: absolute;
  background: rgba(212, 175, 55, 0.5);
}

.guide-v {
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  transform: translateX(-0.5px);
}

.guide-h {
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  transform: translateY(-0.5px);
}

/* ── SOCIAL CARD ── */
.social-card {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--color-black);
  display: flex;
  align-items: center;
  justify-content: center;
}

.social-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.social-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3) 0%,
    transparent 30%,
    transparent 50%,
    rgba(0, 0, 0, 0.6) 75%,
    rgba(0, 0, 0, 0.85) 100%
  );
}

.social-content {
  position: absolute;
  inset: 0;
  z-index: 10;
  text-align: center;
}

.social-content > .draggable {
  position: absolute;
  left: 50%;
}

.social-content > .draggable:nth-child(1) {
  top: 4%;
  transform-origin: center top;
}

.social-content > .draggable:nth-child(2) {
  top: 50%;
  transform-origin: center center;
}

.social-content > .draggable:nth-child(3) {
  bottom: 4%;
  transform-origin: center bottom;
}

.social-logo {
  max-width: 85vw;
  max-height: 45vh;
  object-fit: contain;
  filter: drop-shadow(0 0 40px rgba(212, 175, 55, 0.7));
}

.social-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.social-holiday {
  font-family: var(--font-rock), cursive;
  font-size: clamp(1.2rem, 3vw, 2rem);
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.8);
  background: rgba(212, 175, 55, 0.12);
  padding: 0.3rem 1.5rem;
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.social-date {
  font-family: var(--font-rock), cursive;
  font-size: clamp(1.5rem, 4vw, 3rem);
  color: var(--color-white);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.8);
}

.social-time {
  font-family: var(--font-body), sans-serif;
  font-size: clamp(0.9rem, 2vw, 1.3rem);
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 0.05em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
}

.social-divider {
  width: 80px;
  height: 3px;
  background: var(--color-gold);
  margin: 0.6rem 0;
}

.social-venue {
  font-family: var(--font-rock), cursive;
  font-size: clamp(1.8rem, 5vw, 3.5rem);
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.8);
}

.social-address {
  font-family: var(--font-body), sans-serif;
  font-size: clamp(0.8rem, 1.8vw, 1.1rem);
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.03em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
}

.social-entrance {
  font-family: var(--font-rock), cursive;
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  color: var(--color-gold-light);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-top: 0.3rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
}
</style>
