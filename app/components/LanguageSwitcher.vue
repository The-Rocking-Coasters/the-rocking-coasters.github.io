<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const getFlag = (code: string) => {
  switch (code) {
    case 'en': return '🇬🇧'
    case 'nl': return '🇳🇱'
    default: return code
  }
}
</script>

<template>
  <div class="language-switcher">
    <button
      v-for="loc in locales"
      :key="loc.code"
      @click="setLocale(loc.code)"
      :class="{ active: locale === loc.code }"
      :title="loc.name"
    >
      <span class="flag">{{ getFlag(loc.code) }}</span>
      <span class="label">{{ loc.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.language-switcher {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

button {
  background: transparent;
  border: 1px solid var(--color-gold);
  color: var(--color-gold);
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  opacity: 0.7;
}

button:hover {
  background: rgba(212, 175, 55, 0.1);
  opacity: 1;
}

button.active {
  background: var(--color-gold);
  color: var(--color-black);
  opacity: 1;
}

.flag {
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .label {
    display: none;
  }
  button {
    padding: 0.25rem 0.4rem;
    gap: 0;
  }
  .flag {
    font-size: 1rem;
  }
}
</style>
