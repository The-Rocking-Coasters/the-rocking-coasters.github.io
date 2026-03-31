import { readdirSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'
import { HERO_CLIPS } from '../hero.config'

type MediaItem = {
  url: string
  alt: string
  type: string
  thumbnail?: string
  thumbnailType?: string
  heroClip?: string
}

/**
 * Parses a WhatsApp-style filename into a sortable output filename.
 * e.g. "WhatsApp Image 2026-03-29 at 16.39.29-2.jpeg" → "2026-03-29-2"
 *      "WhatsApp Video 2026-03-30 at 18.36.21.mp4"    → "2026-03-30-1"
 *
 * Files sharing the same date are ordered by their time component, with an
 * optional trailing counter (-N) used as a tiebreaker.
 */
function parseWhatsAppFilename(filename: string): { date: string; time: string; counter: number } | null {
  // Matches: WhatsApp {Type} {YYYY-MM-DD} at {HH.MM.SS}[-N].{ext}
  const match = filename.match(
    /WhatsApp\s+\S+\s+(\d{4}-\d{2}-\d{2})\s+at\s+(\d{2})\.(\d{2})\.(\d{2})(?:-(\d+))?/i
  )
  if (!match) return null
  const [, date, hh, mm, ss, counter] = match
  return {
    date,
    time: `${hh}${mm}${ss}`,
    counter: counter ? parseInt(counter, 10) : 0,
  }
}

/**
 * Maps original WhatsApp filename dates to the actual capture date.
 * Use this when the WhatsApp "sent" date differs from the real capture date.
 * Key: date as it appears in the WhatsApp filename (YYYY-MM-DD)
 * Value: actual capture date to use in the output filename (YYYY-MM-DD)
 */
const DATE_OVERRIDES: Record<string, string> = {
  '2026-03-30': '2026-03-29',
  '2026-03-31': '2026-03-29',
}

/**
 * Converts original_content media files to public/images/media with web-optimised
 * quality and date-based filenames.
 * Run this locally whenever new media is added to original_content.
 */
export function convertMedia(rootDir: string): void {
  const originalDir = resolve(rootDir, '../original_content')
  const mediaDir = resolve(rootDir, 'public/images/media')

  if (!existsSync(originalDir)) {
    console.warn(`[Media] original_content directory not found: ${originalDir}`)
    return
  }

  if (!existsSync(mediaDir)) mkdirSync(mediaDir, { recursive: true })

  const origFiles = readdirSync(originalDir).filter(f =>
    /\.(jpe?g|png|webp|mp4|mov|webm|ogg)$/i.test(f)
  )

  type ParsedFile = { filename: string; date: string; time: string; counter: number }
  const parsed: ParsedFile[] = []

  for (const filename of origFiles) {
    const info = parseWhatsAppFilename(filename)
    if (!info) {
      console.warn(`[Media] Skipping unrecognised filename: ${filename}`)
      continue
    }
    parsed.push({ filename, ...info })
  }

  parsed.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    if (a.time !== b.time) return a.time.localeCompare(b.time)
    return a.counter - b.counter
  })

  const dateCounters: Record<string, number> = {}
  for (const item of parsed) {
    const outputDate = DATE_OVERRIDES[item.date] ?? item.date
    dateCounters[outputDate] = (dateCounters[outputDate] ?? 0) + 1
    const idx = dateCounters[outputDate]
    const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(item.filename)
    const outExt = isVideo ? 'mp4' : 'jpg'
    const outName = `${outputDate}-${idx}.${outExt}`
    const srcPath = resolve(originalDir, item.filename)
    const dstPath = resolve(mediaDir, outName)

    if (existsSync(dstPath)) {
      console.log(`[Media] Already converted, skipping: ${outName}`)
      continue
    }

    try {
      if (isVideo) {
        execSync(
          `ffmpeg -y -i "${srcPath}" -vf "scale='min(1280,iw)':-2:flags=lanczos" ` +
          `-c:v libx264 -crf 28 -preset medium -movflags +faststart -c:a aac -b:a 96k "${dstPath}"`,
          { stdio: 'pipe' }
        )
      } else {
        execSync(
          `ffmpeg -y -i "${srcPath}" -vf "scale='min(1920,iw)':-2:flags=lanczos" ` +
          `-q:v 4 "${dstPath}"`,
          { stdio: 'pipe' }
        )
      }
      console.log(`[Media] Converted: ${item.filename} → ${outName}`)
    } catch (e) {
      console.warn(`[Media] Failed to convert ${item.filename}: ${(e as Error).message}`)
    }
  }
}

/**
 * Generates public/media-list.json from whatever media files are already present
 * in public/images/media. Also generates WebM thumbnails and hero clips as needed.
 * Called automatically during build.
 */
export function generateMediaList(rootDir: string): void {
  const mediaDir = resolve(rootDir, 'public/images/media')
  const outputJson = resolve(rootDir, 'public/media-list.json')

  if (!existsSync(mediaDir)) {
    console.warn(`[Media] Media directory not found: ${mediaDir}`)
    return
  }

  const files: string[] = readdirSync(mediaDir)
  const mediaItems: MediaItem[] = files
    .filter((file: string) => {
      if (!/\.(jpg|jpeg|png|webp|mp4|webm|ogg)$/i.test(file)) return false
      if (/\.webm$/i.test(file)) {
        const baseName = file.split('.').slice(0, -1).join('.')
        // Exclude WebM thumbnails (same base name as an mp4/ogg)
        const hasSourceVideo = files.some(f => new RegExp(`^${baseName}\\.(mp4|ogg)$`, 'i').test(f))
        if (hasSourceVideo) return false
        // Exclude hero clip WebMs
        if (file.includes('-hero')) return false
      }
      return true
    })
    .map((file: string) => {
      const isVideo = /\.(mp4|webm|ogg)$/i.test(file)
      const item: MediaItem = {
        url: `/images/media/${file}`,
        alt: file.split('.').slice(0, -1).join('.').replace(/[_-]/g, ' '),
        type: isVideo ? 'video' : 'image',
      }

      if (isVideo) {
        const baseName = file.split('.').slice(0, -1).join('.')

        // Thumbnail
        const thumbName = `${baseName}.webm`
        const thumbPath = resolve(mediaDir, thumbName)
        if (!existsSync(thumbPath)) {
          try {
            const videoPath = resolve(mediaDir, file)
            execSync(
              `ffmpeg -y -t 4 -i "${videoPath}" -vf "fps=24,scale=480:-1:flags=lanczos" ` +
              `-c:v libvpx-vp9 -b:v 0 -crf 40 -an "${thumbPath}"`,
              { stdio: 'pipe' }
            )
            console.log(`[Media] Generated WebM thumbnail: ${thumbName}`)
          } catch (e) {
            console.warn(`[Media] Could not generate thumbnail for ${file}`)
          }
        }
        if (existsSync(thumbPath)) {
          item.thumbnail = `/images/media/${thumbName}`
          item.thumbnailType = 'video/webm'
        }

        // Hero clip extraction (from hero.config.ts)
        const heroConfig = HERO_CLIPS[file]
        if (heroConfig) {
          const heroName = `${baseName}-hero.webm`
          const heroPath = resolve(mediaDir, heroName)
          if (!existsSync(heroPath)) {
            try {
              const videoPath = resolve(mediaDir, file)
              execSync(
                `ffmpeg -y -ss ${heroConfig.start} -t ${heroConfig.duration} -i "${videoPath}" ` +
                `-vf "scale=1280:-2:flags=lanczos" -c:v libvpx-vp9 -b:v 0 -crf 33 -an "${heroPath}"`,
                { stdio: 'pipe' }
              )
              console.log(`[Media] Generated hero clip: ${heroName}`)
            } catch (e) {
              console.warn(`[Media] Could not generate hero clip for ${file}: ${(e as Error).message}`)
            }
          }
          if (existsSync(heroPath)) {
            item.heroClip = `/images/media/${heroName}`
          }
        }
      }

      return item
    })

  writeFileSync(outputJson, JSON.stringify(mediaItems, null, 2))
  console.log(`[Media] Generated media-list.json with ${mediaItems.length} items.`)
}

/**
 * Convenience function: convert new media from original_content, then regenerate
 * the media list. Run locally after adding new files to original_content.
 */
export function processMedia(rootDir: string): void {
  convertMedia(rootDir)
  generateMediaList(rootDir)
}
