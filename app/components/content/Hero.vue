<template>
  <section id="hero" class="hero-section">
    <div class="hero-bg">
      <img :src="backgroundImage" :alt="alt" class="hero-bg-img" />
      <div class="hero-overlay"></div>
    </div>
    
    <div class="hero-content">
      <img :src="logoImage" alt="The Rocking Coasters Logo" class="hero-logo" />
    </div>

    <div class="hero-scroll-indicator">
      <NuxtLink to="#agenda" class="scroll-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
        </svg>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
defineProps({
  backgroundImage: {
    type: String,
    default: '/images/band.jpg'
  },
  logoImage: {
    type: String,
    default: '/images/logo.svg'
  },
  alt: {
    type: String,
    default: 'The Rocking Coasters Band'
  }
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
  filter: grayscale(1);
  opacity: 0.5;
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
    max-width: 180%; /* Allow golden border to overflow for maximum text width */
    width: 120%;
    max-height: 50vh;
    transform: scale(1.8); /* Ensure the logo feels prominent */
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
  0%, 20%, 50%, 80%, 100% {transform: translateX(-50%) translateY(0);}
  40% {transform: translateX(-50%) translateY(-30px);}
  60% {transform: translateX(-50%) translateY(-15px);}
}
</style>
