<template>
  <section id="contact" class="contact-section">
    <!-- Decorative vinyl record -->
    <div class="vinyl-record large"></div>
    <div class="vinyl-record small"></div>

    <div class="contact-container">
      <div class="contact-info-panel">
        <h2 class="contact-title italic">{{ title }}</h2>
        <p class="contact-subtitle">{{ subtitle }}</p>
        
        <div class="info-list">
          <div v-for="(info, index) in contactInfo" :key="index" class="info-item">
            <span class="info-icon">
               <ClientOnly><component :is="getIcon(info.icon)" :size="24" /></ClientOnly>
            </span>
            <span class="info-value">{{ info.value }}</span>
          </div>
        </div>

        <div class="social-links">
          <a v-for="(social, index) in socials" :key="index" :href="social.link" target="_blank" class="social-link" :aria-label="social.icon">
            <ClientOnly><component :is="getIcon(social.icon)" :size="32" /></ClientOnly>
          </a>
        </div>
      </div>

      <div class="contact-reasons-panel">
        <h3 class="reasons-title">{{ $t('contact.whyUs') }}</h3>
        <ul class="reasons-list">
          <li class="reason-item">
            <span class="reason-icon"><Guitar :size="20" /></span>
            <span>{{ $t('contact.reason1') }}</span>
          </li>
          <li class="reason-item">
            <span class="reason-icon"><Mic :size="20" /></span>
            <span>{{ $t('contact.reason2') }}</span>
          </li>
          <li class="reason-item">
            <span class="reason-icon"><PersonStanding :size="20" /></span>
            <span>{{ $t('contact.reason3') }}</span>
          </li>
          <li class="reason-item">
            <span class="reason-icon"><Music :size="20" /></span>
            <span>{{ $t('contact.reason4') }}</span>
          </li>
          <li class="reason-item">
            <span class="reason-icon"><Star :size="20" /></span>
            <span>{{ $t('contact.reason5') }}</span>
          </li>
        </ul>
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-number">{{ totalShows }}+</span>
            <span class="stat-label">{{ $t('contact.statShows') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ yearsActive }}+</span>
            <span class="stat-label">{{ $t('contact.statYears') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">100%</span>
            <span class="stat-label">{{ $t('contact.statVibes') }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer-copy">
      &copy; {{ new Date().getFullYear() }} The Rocking Coasters - Built with Nuxt
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { Mail, Phone, MapPin, Instagram, Facebook, Youtube, Guitar, Mic, PersonStanding, Music, Star } from 'lucide-vue-next';

defineProps({
  title: {
    type: String,
    default: 'Contact'
  },
  subtitle: {
    type: String,
    default: 'Book us for your next event'
  },
  contactInfo: {
    type: Array,
    default: () => [
      { icon: 'Mail', value: 'info@therockingcoasters.nl' },
      { icon: 'Phone', value: '+31 6 12345678' }
    ]
  },
  socials: {
    type: Array,
    default: () => [
      { icon: 'Facebook', link: '#' },
      { icon: 'Instagram', link: '#' },
      { icon: 'Youtube', link: '#' }
    ]
  }
})

const FOUNDED_YEAR = 2011;
const HISTORICAL_SHOWS_PER_YEAR = 12;
const HISTORICAL_END_YEAR = 2025;

const yearsActive = new Date().getFullYear() - FOUNDED_YEAR;

const { data: performances } = await useAsyncData('performances-stats', () =>
  queryCollection('performances').all()
);

const totalShows = computed(() => {
  const historicalShows = (HISTORICAL_END_YEAR - FOUNDED_YEAR + 1) * HISTORICAL_SHOWS_PER_YEAR;
  const today = new Date();
  const currentYearShows = (performances.value || []).filter(p => {
    const d = new Date(p.date);
    return d.getFullYear() >= 2026 && d <= today;
  }).length;
  return historicalShows + currentYearShows;
});

const getIcon = (name) => {
  const icons = { Mail, Phone, MapPin, Instagram, Facebook, Youtube, YouTube: Youtube };
  return icons[name] || Mail;
}

</script>

<style scoped>
.contact-section {
  background-color: var(--color-black);
  padding: 5rem 1rem;
  position: relative;
  overflow: hidden;
}

.vinyl-record {
  position: absolute;
  border-radius: 50%;
  border-style: solid;
  border-color: rgba(212, 175, 55, 0.1);
  opacity: 0.2;
  pointer-events: none;
}

.vinyl-record.large {
  right: -5rem;
  bottom: -5rem;
  width: 20rem;
  height: 20rem;
  border-width: 20px;
}

.vinyl-record.small {
  right: -2.5rem;
  bottom: -2.5rem;
  width: 10rem;
  height: 10rem;
  border-width: 10px;
}

.contact-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  max-width: 1100px;
  margin: 0 auto;
  align-items: center;
}

@media (min-width: 768px) {
  .contact-container {
    flex-direction: row;
  }
}

.contact-info-panel {
  flex: 1;
  text-align: center;
}

@media (min-width: 768px) {
  .contact-info-panel {
    text-align: left;
  }
}

.contact-title {
  font-size: clamp(3.5rem, 12vw, 5.5rem);
  margin-bottom: 0.5rem;
  line-height: 1.1;
}

.contact-subtitle {
  font-size: 1.25rem;
  color: var(--color-gold);
  font-family: var(--font-rock), cursive;
  text-transform: uppercase;
  margin-bottom: 3rem;
  letter-spacing: 0.1em;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

@media (min-width: 768px) {
  .info-item {
    justify-content: flex-start;
  }
}

.info-icon {
  color: var(--color-gold);
}

.info-value {
  font-size: 1.125rem;
}

.social-links {
  margin-top: 3rem;
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .social-links {
    justify-content: flex-start;
  }
}

.social-link {
  color: var(--color-gold);
  transition: color 0.3s ease;
}

.social-link:hover {
  color: var(--color-white);
}

.contact-reasons-panel {
  flex: 1;
  width: 100%;
  max-width: 450px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 2px solid var(--color-gold);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.reasons-title {
  font-family: var(--font-rock), cursive;
  color: var(--color-gold);
  text-transform: uppercase;
  font-size: 1.5rem;
  letter-spacing: 0.1em;
  margin: 0;
}

.reasons-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reason-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
}

.reason-icon {
  color: var(--color-gold);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid rgba(212, 175, 55, 0.3);
  padding-top: 1.5rem;
  margin-top: auto;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-number {
  font-family: var(--font-rock), cursive;
  color: var(--color-gold);
  font-size: 1.75rem;
}

.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
}

.footer-copy {
  margin-top: 5rem;
  text-align: center;
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  padding-top: 2.5rem;
  font-family: var(--font-rock), cursive;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
</style>
