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
               <component :is="getIcon(info.icon)" size="24" />
            </span>
            <span class="info-value">{{ info.value }}</span>
          </div>
        </div>

        <div class="social-links">
          <a v-for="(social, index) in socials" :key="index" :href="social.link" target="_blank" class="social-link">
            <component :is="getIcon(social.icon)" size="32" />
          </a>
        </div>
      </div>

      <div class="contact-form-panel">
        <form @submit.prevent class="contact-form">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Message</label>
            <textarea rows="4" class="form-input textarea"></textarea>
          </div>
          <button type="submit" class="retro-button full-width">Send Message</button>
        </form>
      </div>
    </div>
    
    <div class="footer-copy">
      &copy; {{ new Date().getFullYear() }} The Rocking Coasters - Built with Nuxt
    </div>
  </section>
</template>

<script setup>
import { Mail, Phone, MapPin, Instagram, Facebook, Youtube } from 'lucide-vue-next';

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

const getIcon = (name) => {
  const icons = { Mail, Phone, MapPin, Instagram, Facebook, Youtube };
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

.contact-form-panel {
  flex: 1;
  width: 100%;
  max-width: 450px;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  border: 2px solid var(--color-gold);
  padding: 2rem;
  position: relative;
  z-index: 10;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-family: var(--font-rock), cursive;
  color: var(--color-gold);
  text-transform: uppercase;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.form-input {
  background-color: rgba(0, 0, 0, 0.8);
  border: none;
  border-bottom: 2px solid rgba(212, 175, 55, 0.3);
  padding: 0.5rem;
  color: var(--color-white);
  outline: none;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  border-color: var(--color-gold);
}

.form-input.textarea {
  resize: none;
}

.full-width {
  width: 100%;
}

.footer-copy {
  margin-top: 5rem;
  text-align: center;
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  padding-top: 2.5rem;
  font-family: var(--font-rock), cursive;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
</style>
