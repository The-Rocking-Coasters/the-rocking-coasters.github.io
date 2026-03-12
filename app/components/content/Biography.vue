<template>
  <section id="biography" class="bio-section">
    <div class="bio-header mb-16">
      <div class="bio-title-wrapper">
        <div class="bio-line"></div>
        <h2 class="bio-title italic">{{ title }}</h2>
        <div class="bio-line"></div>
      </div>
      <div class="bio-content text-center mb-12">
        <slot />
      </div>
    </div>

    <!-- Members Section -->
    <div v-if="sortedMembers.length > 0" class="members-grid">
      <div v-for="(member, index) in sortedMembers" :key="index" class="member-card">
        <div class="member-image-wrapper">
          <img :src="member.image" :alt="member.name" class="member-image" />
          <div class="member-image-overlay"></div>
        </div>

        <h3 class="member-name">{{ member.name }}</h3>
        <p class="member-role italic">{{ locale === 'nl' ? member.role_nl : member.role_en }}</p>
        
        <div class="member-bio">
          {{ locale === 'nl' ? member.bio_nl : member.bio_en }}
        </div>
        
        <div class="member-footer">
          <p class="instruments-label">{{ $t('instruments') }}:</p>
          <p class="instruments-list">{{ member.instruments }}</p>
        </div>

        <div class="member-decoration"></div>
      </div>
    </div>
  </section>
</template>

<script setup>
const { locale } = useI18n()

const props = defineProps({
  title: {
    type: String,
    default: 'The Band'
  }
})

const { data: members } = await useAsyncData('members', () => {
  return queryCollection('members').all()
})

const sortedMembers = computed(() => {
  if (!members.value) return []
  return [...members.value]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
})
</script>

<style scoped>
.bio-section {
  background-color: var(--color-black);
  padding: 5rem 1rem;
  position: relative;
  overflow: hidden;
}

.bio-title-wrapper {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.bio-line {
  height: 2px;
  flex-grow: 1;
  background-color: var(--color-gold);
}

.bio-title {
  font-size: clamp(2.5rem, 8vw, 4rem);
  flex-shrink: 0;
}

.bio-content {
  max-width: 800px;
  margin: 0 auto;
  font-size: 1.125rem;
  color: #e5e7eb;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 2rem;
}

@media (min-width: 768px) {
  .members-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .members-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.member-card {
  position: relative;
  background-color: rgba(0, 0, 0, 0.4);
  border: 2px solid var(--color-gold);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: all 0.5s ease;
  overflow: hidden;
  height: 100%;
}

.member-card:hover {
  background-color: rgba(212, 175, 55, 0.1);
}

.member-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 3/4;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.member-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1);
  transition: all 0.5s ease;
  transform: scale(1.05);
}

.member-card:hover .member-image {
  filter: grayscale(0);
  transform: scale(1.1);
}

.member-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--color-black), transparent);
  opacity: 0.6;
}

.member-name {
  font-size: 1.875rem;
  margin-bottom: 0.25rem;
}

.member-role {
  color: var(--color-gold);
  font-family: var(--font-rock), cursive;
  font-size: 1.25rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
}

.member-bio {
  font-size: 0.9375rem;
  color: #e5e7eb;
  margin-bottom: 1.5rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: all 0.5s ease;
}

.member-card:hover .member-bio {
  -webkit-line-clamp: unset;
}

.member-footer {
  margin-top: auto;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(212, 175, 55, 0.3);
}

.instruments-label {
  font-size: 0.8125rem;
  font-family: var(--font-rock), cursive;
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.25rem;
}

.instruments-list {
  font-size: 0.9375rem;
  font-style: italic;
  color: #e5e7eb;
}

.member-decoration {
  position: absolute;
  bottom: -2.5rem;
  right: -2.5rem;
  width: 6rem;
  height: 6rem;
  background-color: rgba(212, 175, 55, 0.05);
  border-radius: 50%;
  filter: blur(24px);
  transition: all 0.5s ease;
}

.member-card:hover .member-decoration {
  background-color: rgba(212, 175, 55, 0.2);
}
</style>
