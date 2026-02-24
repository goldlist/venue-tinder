import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const csvPath = path.join(__dirname, '../data/flash_data.csv')
const outputPath = path.join(__dirname, '../src/data/artists.json')

const text = fs.readFileSync(csvPath, 'utf-8')
const rawLines = text.split('\n')

// Parse a single CSV line respecting quoted fields
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

// Seeded distance: 0.5–15 miles, stable per handle
function getDistance(handle) {
  let hash = 0
  for (let i = 0; i < handle.length; i++) {
    hash = ((hash << 5) - hash) + handle.charCodeAt(i)
    hash |= 0
  }
  const norm = (Math.abs(hash) % 1000) / 1000
  return parseFloat((0.5 + norm * 14.5).toFixed(1))
}

// Column indices (0-based)
// 0: Handle, 1: Location, 2: Title, 3: Description,
// 4: Image URL, 5: Collection, 6: XS Price Cents, 7: XL Price Cents

const artistMap = new Map()
const seenFlashIds = new Set()

for (let lineNum = 1; lineNum < rawLines.length; lineNum++) {
  const line = rawLines[lineNum]
  if (!line.trim()) continue

  const cols = parseCSVLine(line)
  if (cols.length < 5) continue

  const handle = cols[0]
  if (!handle) continue

  const location = cols[1]
  const title = cols[2]
  const description = cols[3]
  const rawUrl = cols[4]
  const collection = cols[5] || ''
  const xsCents = parseInt((cols[6] || '0').replace(/,/g, '')) || 0
  const xlCents = parseInt((cols[7] || '0').replace(/,/g, '')) || 0

  if (!rawUrl || !rawUrl.startsWith('s3://')) continue

  const imageUrl = rawUrl.replace('s3://venue-ink-prd-app/', 'https://venue.ink/')

  // Extract flash ID from URL path
  const flashIdMatch = imageUrl.match(/\/(fli-[A-Za-z0-9]+)\//)
  const flashId = flashIdMatch ? flashIdMatch[1] : `fli-line${lineNum}`

  // Skip duplicate flash IDs
  if (seenFlashIds.has(flashId)) continue
  seenFlashIds.add(flashId)

  const priceMin = xsCents > 0 ? Math.round(xsCents / 100) : 0
  const priceMax = xlCents > 0 ? Math.round(xlCents / 100) : priceMin

  if (!artistMap.has(handle)) {
    artistMap.set(handle, {
      handle,
      location,
      bookingUrl: `https://venue.ink/@${handle}`,
      distance: getDistance(handle),
      flash: [],
    })
  }

  artistMap.get(handle).flash.push({
    id: flashId,
    title,
    description,
    collection,
    imageUrl,
    priceMin,
    priceMax,
  })
}

// Compute per-artist priceRange
const artists = Array.from(artistMap.values()).map(artist => {
  const prices = artist.flash.flatMap(f => [f.priceMin, f.priceMax]).filter(p => p > 0)
  const priceRange = prices.length > 0
    ? { min: Math.min(...prices), max: Math.max(...prices) }
    : { min: 0, max: 0 }
  return { ...artist, priceRange }
})

// Filter out artists with no flash
const filtered = artists.filter(a => a.flash.length > 0)

fs.writeFileSync(outputPath, JSON.stringify(filtered, null, 2))
console.log(`✓ Processed ${filtered.length} artists, ${filtered.reduce((s, a) => s + a.flash.length, 0)} flash items → src/data/artists.json`)
