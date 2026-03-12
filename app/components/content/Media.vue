<template>
  <section id="media" class="media-section">
    <div class="media-header text-center mb-16">
      <h2 class="media-title">{{ title }}</h2>
      <div class="media-divider"></div>
    </div>

    <div class="media-grid">
      <div v-for="(item, index) in items" :key="index" class="media-item">
        <img :src="item.url" :alt="item.alt || 'Media'" class="media-img" />
        <div class="media-overlay">
          <div v-if="item.type === 'video'" class="video-play-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
              <path d="M5 3l14 9-14 9V3z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'Media'
  },
  items: {
    type: Array,
    default: () => []
  }
})
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

.media-item:hover {
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
}

.media-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1);
  transition: all 0.5s ease;
}

.media-item:hover .media-img {
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

.media-item:hover .media-overlay {
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
</style>
