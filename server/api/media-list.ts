import { defineEventHandler } from 'h3'
import { readFileSync } from 'fs'
import { resolve } from 'path'

export default defineEventHandler(() => {
  const jsonPath = resolve(process.cwd(), 'public/media-list.json')
  try {
    return JSON.parse(readFileSync(jsonPath, 'utf-8'))
  } catch {
    return []
  }
})
