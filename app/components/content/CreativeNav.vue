<template>
  <nav class="creative-nav" :class="{ 'nav-hidden': !showNav }">
    <div class="nav-container">
      <NuxtLink v-for="link in links" :key="link.href" :to="link.href" class="nav-link group">
        <component :is="link.icon" size="20" />
        <span class="nav-tooltip">{{ link.label }}</span>
      </NuxtLink>
    </div>
  </nav>

  <div class="top-right-nav">
    <LanguageSwitcher />
  </div>
</template>

<script setup>
import { Home, Calendar, Users, Camera, Mail } from 'lucide-vue-next';
import { ref, onMounted, onUnmounted } from 'vue';

const showNav = ref(true);
let lastScroll = 0;

const links = [
  { href: '#hero', label: 'Top', icon: Home },
  { href: '#agenda', label: 'Agenda', icon: Calendar },
  { href: '#biography', label: 'The Band', icon: Users },
  { href: '#media', label: 'Media', icon: Camera },
  { href: '#contact', label: 'Contact', icon: Mail },
];

const handleScroll = () => {
  const currentScroll = window.pageYOffset;
  if (currentScroll <= 0) {
    showNav.value = true;
    return;
  }
  
  showNav.value = currentScroll <= 100 || currentScroll <= lastScroll;
  lastScroll = currentScroll;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.top-right-nav {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 101;
}

.creative-nav {
  position: fixed;
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  transition: all 0.5s ease;
}

.nav-hidden {
  transform: translateY(-50%) translateX(5rem);
  opacity: 0;
}

.nav-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  border: 2px solid var(--color-gold);
  padding: 0.5rem;
  border-radius: 9999px;
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
}

.nav-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  color: var(--color-gold);
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  background-color: var(--color-gold);
  color: var(--color-black);
}

.nav-tooltip {
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 1rem;
  background-color: var(--color-gold);
  color: var(--color-black);
  padding: 0.25rem 0.5rem;
  font-family: var(--font-rock), cursive;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  white-space: nowrap;
}

.nav-link:hover .nav-tooltip {
  opacity: 1;
}

@media (max-width: 768px) {
  .top-right-nav {
    top: 0.75rem;
    right: 0.75rem;
  }
  
  .creative-nav {
    right: 0.5rem;
    padding: 0;
  }
  
  .nav-container {
    gap: 0.25rem;
    padding: 0.25rem;
  }
  
  .nav-link {
    width: 2.25rem;
    height: 2.25rem;
  }
  
  .nav-link :deep(svg) {
    width: 16px;
    height: 16px;
  }
}
</style>
