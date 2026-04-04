<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
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
      <span class="label-full">{{ loc.name }}</span>
      <span class="label-short">{{ loc.code.toUpperCase() }}</span>
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
  font-family: var(--font-rock), cursive;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
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

.label-short {
  display: none;
}

@media (max-width: 768px) {
  .label-full {
    display: none;
  }

  .label-short {
    display: inline;
    font-size: 0.75rem;
  }

  button {
    padding: 0.25rem 0.45rem;
  }
}
</style>
