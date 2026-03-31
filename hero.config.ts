/**
 * Hero banner configuration.
 * Edit this file to curate which video clips appear in the hero background,
 * and to control visual settings like opacity and grayscale.
 *
 * HERO_CLIPS: map of output media filename (without path) → clip settings
 *   start:    start time in seconds
 *   duration: clip duration in seconds
 *
 * HERO_VISUAL: controls how the video/image is rendered in the hero
 *   opacity:   0–1, how visible the background is
 *   grayscale: 0–1, 0 = full colour, 1 = full greyscale
 */

export type HeroClipConfig = {
  start: number
  duration: number
}

export type HeroVisualConfig = {
  opacity: number
  grayscale: number
}

export const HERO_CLIPS: Record<string, HeroClipConfig> = {
  '2026-03-29-6.mp4': { start: 30, duration: 6 },
  '2026-03-29-8.mp4': { start: 34, duration: 6 },
  '2026-03-29-1.mp4': { start: 110, duration: 6 },
}

export const HERO_VISUAL: HeroVisualConfig = {
  opacity: 0.55,
  grayscale: 0,
}
